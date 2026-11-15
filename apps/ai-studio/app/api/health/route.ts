import { NextResponse } from 'next/server';
import { isGeminiConfigured } from '@/lib/server/gemini';
import { DEFAULT_GEMINI_MODEL } from '@/lib/models';
import firebaseConfig from '@/firebase-applet-config.json';

export async function GET() {
  return NextResponse.json({
    ok: true,
    app: 'Google Agentic Browser',
    geminiConfigured: isGeminiConfigured(),
    defaultModel: DEFAULT_GEMINI_MODEL,
    firebaseProjectId: firebaseConfig.projectId,
    oauthConfigured: Boolean(firebaseConfig.oAuthClientId),
    simulationMode: true,
    realPaymentsEnabled: false,
  });
}
