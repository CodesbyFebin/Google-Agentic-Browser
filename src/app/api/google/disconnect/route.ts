import { NextResponse } from 'next/server';
import { GOOGLE_SESSION_COOKIE } from '@/lib/google-oauth';

export const runtime = 'nodejs';

export async function POST() {
  const response = NextResponse.json({ connected: false });
  response.cookies.delete(GOOGLE_SESSION_COOKIE);
  return response;
}
