import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getGeminiClient, normalizeGeminiError, requireGeminiSession } from '@/lib/server/gemini';
import { checkRateLimit, wrapUntrustedContent } from '@/lib/security';
import { resolveSupportedModel } from '@/lib/models';

const StreamSchema = z.object({
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
});

export async function POST(req: NextRequest) {
  try {
    const session = await requireGeminiSession(req);
    const rate = checkRateLimit(`ai-stream:${session.uid}`, 40, 60_000);
    if (!rate.allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please wait before sending more AI requests.' },
        { status: 429 }
      );
    }

    const body = await req.json();
    const parsed = StreamSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid stream request.', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { message, history = [], model, systemInstruction, paneContext, useSearchGrounding } =
      parsed.data;
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

    const stream = await ai.models.generateContentStream({
      model: activeModel,
      contents,
      config: {
        systemInstruction:
          systemInstruction ||
          'You are Gemini inside Google Agentic Browser (The Browser That Does). Be concise, accurate, and transparent. Never fabricate executed side effects.',
        ...(useSearchGrounding ? { tools: [{ googleSearch: {} }] } : {}),
      },
    });

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          const urlsSeen = new Map<string, string>();
          for await (const chunk of stream) {
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
                encoder.encode(`data: ${JSON.stringify({ delta, model: activeModel })}\n\n`)
              );
            }
          }
          const groundingUrls = Array.from(urlsSeen.entries()).map(([uri, title]) => ({
            uri,
            title,
          }));
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ done: true, model: activeModel, groundingUrls })}\n\n`
            )
          );
          controller.close();
        } catch (err) {
          const normalized = normalizeGeminiError(err);
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ error: normalized.message, code: normalized.code })}\n\n`
            )
          );
          controller.close();
        }
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
    const normalized = normalizeGeminiError(err);
    return NextResponse.json(
      { error: normalized.message, code: normalized.code },
      { status: normalized.status }
    );
  }
}
