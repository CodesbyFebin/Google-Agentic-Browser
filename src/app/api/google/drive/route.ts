import { NextRequest, NextResponse } from 'next/server';
import { getGoogleSession } from '@/lib/google-oauth';
import { DriveMetadataError, searchDriveMetadata } from '@/lib/google-drive-files';
import { driveSearchFilter } from '@/lib/google-drive-utils';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const session = getGoogleSession(req);
  if (!session) return NextResponse.json({ error: 'Connect your Google account to list Drive metadata.' }, { status: 401 });
  if (!session.scope.split(/\s+/).includes('https://www.googleapis.com/auth/drive.metadata.readonly')) {
    return NextResponse.json({ error: 'Drive metadata permission was not granted.' }, { status: 403 });
  }
  const search = req.nextUrl.searchParams.get('q') || '';
  try { driveSearchFilter(search); } catch {
    return NextResponse.json({ error: 'Drive search must be 0–100 characters without control characters.' }, { status: 400 });
  }
  try {
    const files = await searchDriveMetadata(session.accessToken, search);
    return NextResponse.json({ files, query: search, readOnly: true, contentsRead: false }, {
      headers: { 'Cache-Control': 'private, no-store' },
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof DriveMetadataError ? error.message : 'Could not contact Google Drive.' },
      { status: error instanceof DriveMetadataError ? error.status : 502 });
  }
}
