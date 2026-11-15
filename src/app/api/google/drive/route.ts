import { NextRequest, NextResponse } from 'next/server';
import { getGoogleSession } from '@/lib/google-oauth';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const session = getGoogleSession(req);
  if (!session) return NextResponse.json({ error: 'Connect your Google account to list Drive metadata.' }, { status: 401 });
  if (!session.scope.includes('drive.metadata.readonly')) {
    return NextResponse.json({ error: 'Drive metadata permission was not granted.' }, { status: 403 });
  }
  try {
    const url = new URL('https://www.googleapis.com/drive/v3/files');
    url.searchParams.set('pageSize', '12');
    url.searchParams.set('q', 'trashed = false');
    url.searchParams.set('fields', 'files(id,name,mimeType,modifiedTime,webViewLink),nextPageToken');
    url.searchParams.set('orderBy', 'modifiedTime desc');
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${session.accessToken}` },
      cache: 'no-store',
    });
    if (!response.ok) return NextResponse.json({ error: 'Google Drive API request failed. Check authorization and API activation.' }, { status: 502 });
    const payload = await response.json();
    return NextResponse.json({
      files: Array.isArray(payload.files) ? payload.files.map((f: Record<string, unknown>) => ({
        id: String(f.id || ''),
        name: String(f.name || '').slice(0, 250),
        mimeType: String(f.mimeType || ''),
        modifiedTime: String(f.modifiedTime || ''),
        url: typeof f.webViewLink === 'string' && f.webViewLink.startsWith('https://drive.google.com/') ? f.webViewLink : null,
      })) : [],
      readOnly: true,
    }, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return NextResponse.json({ error: 'Could not contact Google Drive.' }, { status: 502 });
  }
}
