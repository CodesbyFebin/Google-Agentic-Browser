import { NextResponse } from 'next/server';
import { firebaseWebConfig } from '@/lib/firebase-config';

export const runtime = 'nodejs';

/** Firebase browser API keys are public project configuration, not server secrets. */
export async function GET() {
  const config = firebaseWebConfig();
  return NextResponse.json({ configured: Boolean(config), config }, {
    headers: { 'Cache-Control': 'no-store' },
  });
}
