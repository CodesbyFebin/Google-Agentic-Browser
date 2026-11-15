import { NextRequest, NextResponse } from 'next/server';
import { ThinkingLevel, Type } from '@google/genai';
import { z } from 'zod';
import { getGeminiClient, normalizeGeminiError, withGeminiRetry, requireGeminiSession } from '@/lib/server/gemini';
import { checkRateLimit, wrapUntrustedContent } from '@/lib/security';
import { resolveSupportedModel } from '@/lib/models';

const AnalyzeSchema = z.object({
  topic: z.string().min(1).max(4000),
  context: z.string().max(16000).optional(),
  model: z.string().max(64).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await requireGeminiSession(req);
    const rate = checkRateLimit(`ai-analyze:${session.uid}`, 25, 60_000);
    if (!rate.allowed) {
      return NextResponse.json({ error: 'Rate limit exceeded.' }, { status: 429 });
    }

    const body = await req.json();
    const parsed = AnalyzeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid analysis request.' }, { status: 400 });
    }

    const { topic, context, model } = parsed.data;
    const activeModel = resolveSupportedModel(model);
    const ai = getGeminiClient();

    const response = await withGeminiRetry(async () => {
      return ai.models.generateContent({
        model: activeModel,
        contents: context
          ? `Analyze and compare options for: ${topic}\n\n${wrapUntrustedContent('Analysis Input', context)}`
          : `Analyze and compare options for: ${topic}`,
        config: {
          systemInstruction:
            'You are ATLAS, the Analysis Agent. Compare alternatives objectively, score criteria transparently, and provide a well-reasoned recommendation.',
          ...(activeModel === 'gemini-4-hydrogen'
            ? { thinkingConfig: { thinkingLevel: ThinkingLevel.MEDIUM } }
            : {}),
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            required: ['summary', 'options', 'recommendation'],
            properties: {
              summary: { type: Type.STRING, description: 'Concise executive comparison summary.' },
              options: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  required: ['name', 'strengths', 'tradeoffs', 'estimatedPricing', 'rank'],
                  properties: {
                    name: { type: Type.STRING },
                    strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
                    tradeoffs: { type: Type.ARRAY, items: { type: Type.STRING } },
                    estimatedPricing: { type: Type.STRING },
                    rank: { type: Type.INTEGER },
                  },
                },
              },
              recommendation: { type: Type.STRING },
            },
          },
        },
      });
    });

    const parsedJson = JSON.parse((response.text ?? '{}').trim());
    return NextResponse.json({
      analysis: parsedJson,
      model: activeModel,
    });
  } catch (err) {
    const normalized = normalizeGeminiError(err);
    return NextResponse.json(
      { error: normalized.message, code: normalized.code },
      { status: normalized.status }
    );
  }
}
