import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json(
      { error: 'Disconnected: Google Workspace access token is required.' },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(req.url);
  const query = searchParams.get('q')?.trim() || '';
  const fileId = searchParams.get('fileId')?.trim() || '';

  if (fileId) {
    if (!/^[a-zA-Z0-9_-]{1,128}$/.test(fileId)) {
      return NextResponse.json({ error: 'Invalid fileId format.' }, { status: 400 });
    }
    const res = await fetch(
      `https://www.googleapis.com/drive/v3/files/${fileId}?fields=id,name,mimeType,modifiedTime,webViewLink`,
      { headers: { Authorization: authHeader } }
    );
    const data = await res.json();
    if (!res.ok) {
      return NextResponse.json({ error: data.error?.message || 'Drive read failed.' }, { status: res.status });
    }
    let previewText = '';
    if (data.mimeType === 'text/plain' || data.mimeType === 'text/markdown') {
      const contentRes = await fetch(
        `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
        { headers: { Authorization: authHeader } }
      );
      if (contentRes.ok) {
        previewText = (await contentRes.text()).slice(0, 8000);
      }
    }
    return NextResponse.json({ file: data, previewText });
  }

  const params = new URLSearchParams({
    pageSize: '15',
    fields: 'files(id,name,mimeType,modifiedTime,webViewLink)',
    orderBy: 'modifiedTime desc',
  });
  if (query) {
    const escaped = query.replace(/'/g, "\\'");
    params.set('q', `name contains '${escaped}' and trashed = false`);
  } else {
    params.set('q', 'trashed = false');
  }

  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files?${params.toString()}`,
    { headers: { Authorization: authHeader } }
  );
  const data = await res.json();
  if (!res.ok) {
    return NextResponse.json(
      { error: data.error?.message || 'Failed to query Google Drive.' },
      { status: res.status }
    );
  }
  return NextResponse.json({ files: data.files ?? [] });
}
