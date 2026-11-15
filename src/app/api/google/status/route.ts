import { NextRequest, NextResponse } from 'next/server';
import { geminiModel, isGeminiConfigured } from '@/lib/gemini';
import { getGoogleSession, googleOAuthConfigured } from '@/lib/google-oauth';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const session = getGoogleSession(req);
  return NextResponse.json({
    gemini: { configured: isGeminiConfigured(), model: geminiModel() },
    googleDrive: {
      configured: googleOAuthConfigured(),
      connected: Boolean(session),
      email: session?.email || null,
      scope: session?.scope || null,
      readOnly: true,
    },
    agents: { mode: 'plan-only', externalExecutionEnabled: false },
  }, { headers: { 'Cache-Control': 'no-store' } });
}
