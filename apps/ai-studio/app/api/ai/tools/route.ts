import { NextRequest, NextResponse } from 'next/server';
import { Type, type FunctionDeclaration } from '@google/genai';
import { z } from 'zod';
import { getGeminiClient, normalizeGeminiError, withGeminiRetry, requireGeminiSession } from '@/lib/server/gemini';
import { checkRateLimit } from '@/lib/security';
import { resolveSupportedModel } from '@/lib/models';

const ToolsSchema = z.object({
  prompt: z.string().min(1).max(8000),
  model: z.string().max(64).optional(),
});

const ALLOWLISTED_DECLARATIONS: FunctionDeclaration[] = [
  {
    name: 'propose_workspace_action',
    description:
      'Proposes a consequential Workspace or Money OS action that MUST wait for explicit human approval before execution.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        actionType: {
          type: Type.STRING,
          description:
            'One of: SPEND_MONEY_SIMULATED, SEND_EMAIL, CREATE_CALENDAR_EVENT, WRITE_DRIVE_FILE, UPDATE_GOOGLE_DOC',
        },
        title: { type: Type.STRING },
        reason: { type: Type.STRING },
        estimatedCostUsd: { type: Type.NUMBER },
      },
      required: ['actionType', 'title', 'reason'],
    },
  },
  {
    name: 'search_knowledge_base',
    description: 'Searches local Space notes and saved Chronicle reports.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        query: { type: Type.STRING },
      },
      required: ['query'],
    },
  },
];

export async function POST(req: NextRequest) {
  try {
    const session = await requireGeminiSession(req);
    const rate = checkRateLimit(`ai-tools:${session.uid}`, 25, 60_000);
    if (!rate.allowed) {
      return NextResponse.json({ error: 'Rate limit exceeded.' }, { status: 429 });
    }

    const body = await req.json();
    const parsed = ToolsSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid tools payload.' }, { status: 400 });
    }

    const activeModel = resolveSupportedModel(parsed.data.model);
    const ai = getGeminiClient();

    const response = await withGeminiRetry(async () => {
      return ai.models.generateContent({
        model: activeModel,
        contents: parsed.data.prompt,
        config: {
          systemInstruction:
            'You are an assistant in Google Agentic Browser. When an action involves spending money, sending emails, writing files, or modifying calendar events, call propose_workspace_action instead of claiming it was done.',
          tools: [{ functionDeclarations: ALLOWLISTED_DECLARATIONS }],
        },
      });
    });

    return NextResponse.json({
      text: response.text ?? '',
      functionCalls: response.functionCalls ?? [],
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
