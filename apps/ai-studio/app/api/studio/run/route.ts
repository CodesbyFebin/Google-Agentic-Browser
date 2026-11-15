import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getGeminiClient, normalizeGeminiError, withGeminiRetry, requireGeminiSession } from '@/lib/server/gemini';
import { checkRateLimit } from '@/lib/security';
import { ALLOWED_TEXT_MODEL_IDS, estimateTokenCount, resolveSupportedModel } from '@/lib/models';

const StudioRunSchema = z.object({
  agentName: z.string().min(1).max(80),
  template: z.enum(['code', 'data', 'research', 'image', 'video', 'build', 'custom']),
  systemInstruction: z.string().min(1).max(8000),
  model: z.string().min(1).max(64),
  tools: z.array(z.string()).max(20),
  prompt: z.string().min(1).max(12000),
});

export async function POST(req: NextRequest) {
  try {
    const session = await requireGeminiSession(req);
    const rate = checkRateLimit(`studio-run:${session.uid}`, 25, 60_000);
    if (!rate.allowed) {
      return NextResponse.json({ error: 'Rate limit exceeded.' }, { status: 429 });
    }

    const body = await req.json();
    const parsed = StudioRunSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid Agent Studio run payload.' }, { status: 400 });
    }

    const { agentName, template, systemInstruction, model, tools, prompt } = parsed.data;

    // Honest media generation handling for Image/Video templates
    if (template === 'image' && model === 'gemini-3.1-flash-lite-image') {
      try {
        const ai = getGeminiClient();
        const imgRes = await withGeminiRetry(async () => {
          return ai.models.generateContent({
            model: 'gemini-3.1-flash-lite-image',
            contents: prompt,
          });
        });
        const parts = imgRes.candidates?.[0]?.content?.parts ?? [];
        const inlineImg = parts.find((p) => p.inlineData?.data);
        if (inlineImg?.inlineData) {
          return NextResponse.json({
            status: 'COMPLETED',
            output: imgRes.text || `Generated image asset using ${model}.`,
            imageDataUrl: `data:${inlineImg.inlineData.mimeType || 'image/png'};base64,${inlineImg.inlineData.data}`,
            model,
            estimatedTokens: estimateTokenCount(prompt),
          });
        }
        return NextResponse.json({
          status: 'COMPLETED',
          output: imgRes.text || 'Image prompt processed without inline media bytes.',
          model,
          estimatedTokens: estimateTokenCount(prompt),
        });
      } catch (err) {
        const normalized = normalizeGeminiError(err);
        return NextResponse.json({
          status: 'UNAVAILABLE',
          error: `Image generation unavailable on current key: ${normalized.message} Configure a billing-enabled key in Settings > Secrets to run ${model}.`,
          model,
        }, { status: normalized.status });
      }
    }

    if (template === 'video' || model === 'gemini-omni-1.2-flash') {
      return NextResponse.json({
        status: 'UNAVAILABLE',
        error:
          'Video generation (gemini-omni-1.2-flash via Interactions API) is Not configured for the active session. Configure a paid Gemini API key with Interactions API access to enable live video generation.',
        model,
      }, { status: 501 });
    }

    const activeModel = ALLOWED_TEXT_MODEL_IDS.has(model)
      ? model
      : resolveSupportedModel(model);
    const ai = getGeminiClient();
    const useSearch = tools.includes('google_search');

    const response = await withGeminiRetry(async () => {
      return ai.models.generateContent({
        model: activeModel,
        contents: prompt,
        config: {
          systemInstruction: `[Custom Agent: ${agentName}]\n${systemInstruction}`,
          ...(useSearch ? { tools: [{ googleSearch: {} }] } : {}),
        },
      });
    });

    const output = response.text ?? '';
    return NextResponse.json({
      status: 'COMPLETED',
      output,
      model: activeModel,
      estimatedTokens: estimateTokenCount(prompt + output),
    });
  } catch (err) {
    const normalized = normalizeGeminiError(err);
    return NextResponse.json(
      { status: 'ERROR', error: normalized.message, code: normalized.code },
      { status: normalized.status }
    );
  }
}
