import { NextRequest, NextResponse } from 'next/server';
import { ThinkingLevel } from '@google/genai';
import { z } from 'zod';
import {
  getGeminiClient,
  normalizeGeminiError,
  requireGeminiSession,
  withGeminiRetry,
} from '@/lib/server/gemini';
import { checkRateLimit, wrapUntrustedContent } from '@/lib/security';
import {
  estimateCostUsd,
  estimateTokenCount,
  resolveSupportedModel,
} from '@/lib/models';

const ChatSchema = z.object({
  message: z.string().min(1).max(16000),
  history: z
    .array(
      z.object({
        role: z.enum(['user', 'model']),
        content: z.string().min(1).max(16000),
      })
    )
    .max(30)
    .optional(),
  model: z.string().max(64).optional(),
  systemInstruction: z.string().max(4000).optional(),
  paneContext: z.string().max(12000).optional(),
  useSearchGrounding: z.boolean().optional(),
  stream: z.boolean().optional(),
});

export async function POST(req: NextRequest) {
  const abortController = new AbortController();
  const onReqAbort = () => abortController.abort();
  req.signal.addEventListener('abort', onReqAbort);

  try {
    const session = await requireGeminiSession(req);
    const rate = checkRateLimit(`ai-chat:${session.uid}`, 40, 60_000);
    if (!rate.allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please wait before sending more AI requests.' },
        { status: 429 }
      );
    }

    const body = await req.json();
    const parsed = ChatSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid chat payload.', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const {
      message,
      history = [],
      model,
      systemInstruction,
      paneContext,
      useSearchGrounding,
      stream = true,
    } = parsed.data;

    const activeModel = resolveSupportedModel(model);
    const ai = getGeminiClient();

    const contents = [
      ...history.map((h) => ({
        role: h.role,
        parts: [{ text: h.content }],
      })),
      {
        role: 'user' as const,
        parts: [
          {
            text: paneContext
              ? `${message}\n\n${wrapUntrustedContent('Active Workspace Pane', paneContext)}`
              : message,
          },
        ],
      },
    ];

    const generationConfig = {
      abortSignal: abortController.signal,
      systemInstruction:
        systemInstruction ||
        'You are Gemini inside Google Agentic Browser (The Browser That Does). Provide concise, accurate, actionable responses. Never claim external actions executed without explicit human approval.',
      ...(activeModel === 'gemini-4-hydrogen'
        ? { thinkingConfig: { thinkingLevel: ThinkingLevel.MEDIUM } }
        : {}),
      ...(useSearchGrounding ? { tools: [{ googleSearch: {} }] } : {}),
    };

    if (!stream) {
      const response = await withGeminiRetry(async (retrySignal) => {
        const linked = AbortSignal.any([abortController.signal, retrySignal]);
        return ai.models.generateContent({
          model: activeModel,
          contents,
          config: {
            ...generationConfig,
            abortSignal: linked,
          },
        });
      });

      const text = response.text ?? '';
      const groundingChunks =
        response.candidates?.[0]?.groundingMetadata?.groundingChunks ?? [];
      const groundingUrls = groundingChunks
        .map((c) => c.web)
        .filter((w): w is { uri: string; title?: string } => Boolean(w?.uri))
        .map((w) => ({ uri: w.uri, title: w.title || w.uri }));

      const inputTokens = estimateTokenCount(
        history.map((h) => h.content).join(' ') + message + (paneContext || '')
      );
      const outputTokens = estimateTokenCount(text);

      return NextResponse.json({
        text,
        model: activeModel,
        groundingUrls,
        usage: {
          inputTokens,
          outputTokens,
          estimatedCostUsd: estimateCostUsd(activeModel, inputTokens, outputTokens),
        },
      });
    }

    const geminiStream = await ai.models.generateContentStream({
      model: activeModel,
      contents,
      config: generationConfig,
    });

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          const urlsSeen = new Map<string, string>();
          for await (const chunk of geminiStream) {
            if (abortController.signal.aborted) {
              break;
            }
            const delta = chunk.text ?? '';
            const groundingChunks =
              chunk.candidates?.[0]?.groundingMetadata?.groundingChunks ?? [];
            for (const g of groundingChunks) {
              if (g.web?.uri) {
                urlsSeen.set(g.web.uri, g.web.title || g.web.uri);
              }
            }
            if (delta) {
              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({ delta, model: activeModel })}\n\n`
                )
              );
            }
          }

          if (!abortController.signal.aborted) {
            const groundingUrls = Array.from(urlsSeen.entries()).map(
              ([uri, title]) => ({ uri, title })
            );
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({
                  done: true,
                  model: activeModel,
                  groundingUrls,
                })}\n\n`
              )
            );
          }
          controller.close();
        } catch (err) {
          if (abortController.signal.aborted) {
            controller.close();
            return;
          }
          const normalized = normalizeGeminiError(err);
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                error: normalized.message,
                code: normalized.code,
              })}\n\n`
            )
          );
          controller.close();
        } finally {
          req.signal.removeEventListener('abort', onReqAbort);
        }
      },
      cancel() {
        abortController.abort();
        req.signal.removeEventListener('abort', onReqAbort);
      },
    });

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
      },
    });
  } catch (err) {
    req.signal.removeEventListener('abort', onReqAbort);
    if (abortController.signal.aborted) {
      return NextResponse.json({ error: 'Request cancelled.' }, { status: 499 });
    }
    const normalized = normalizeGeminiError(err);
    return NextResponse.json(
      { error: normalized.message, code: normalized.code },
      { status: normalized.status }
    );
  }
}
