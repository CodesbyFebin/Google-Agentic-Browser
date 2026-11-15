import { NextResponse } from 'next/server';
import { GEMINI_MODELS, DEFAULT_GEMINI_MODEL } from '@/lib/models';
import { isGeminiConfigured } from '@/lib/server/gemini';

export async function GET() {
  return NextResponse.json({
    configured: isGeminiConfigured(),
    defaultModel: DEFAULT_GEMINI_MODEL,
    models: GEMINI_MODELS,
  });
}
