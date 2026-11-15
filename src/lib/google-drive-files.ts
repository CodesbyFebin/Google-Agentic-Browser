/** Read-only Google Drive metadata adapter. Never downloads file contents. */
import 'server-only';
import {
  driveSearchFilter, normalizeDriveFile,
  type DriveFileMetadata,
} from '@/lib/google-drive-utils';

export class DriveMetadataError extends Error {
  constructor(message: string, public readonly status: number) {
    super(message);
    this.name = 'DriveMetadataError';
  }
}

async function googleDriveGet(url: URL, accessToken: string): Promise<unknown> {
  let response: Response;
  try {
    response = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
      signal: AbortSignal.timeout(10_000),
      cache: 'no-store',
    });
  } catch {
    throw new DriveMetadataError('Could not contact Google Drive. Try again.', 502);
  }
  if (response.status === 401 || response.status === 403) {
    throw new DriveMetadataError('Google Drive access expired or was denied. Reconnect the account.', 401);
  }
  if (response.status === 429) throw new DriveMetadataError('Google Drive request quota exceeded. Try later.', 429);
  if (!response.ok) throw new DriveMetadataError('Google Drive could not return the requested metadata.', 502);
  try {
    return await response.json();
  } catch {
    throw new DriveMetadataError('Google Drive returned an invalid response.', 502);
  }
}

export async function searchDriveMetadata(accessToken: string, search: string): Promise<DriveFileMetadata[]> {
  const url = new URL('https://www.googleapis.com/drive/v3/files');
  url.searchParams.set('pageSize', '20');
  url.searchParams.set('q', driveSearchFilter(search));
  url.searchParams.set('fields', 'files(id,name,mimeType,modifiedTime,webViewLink)');
  url.searchParams.set('orderBy', 'modifiedTime desc');
  const payload = await googleDriveGet(url, accessToken);
  const files = (payload && typeof payload === 'object' ? (payload as { files?: unknown }).files : undefined);
  return Array.isArray(files)
    ? files.map(normalizeDriveFile).filter((file): file is DriveFileMetadata => file !== null)
    : [];
}

/** Re-fetch selected IDs with the user's OAuth token; never trust browser-supplied titles. */
export async function loadSelectedDriveMetadata(accessToken: string, ids: string[]): Promise<DriveFileMetadata[]> {
  return Promise.all(ids.map(async id => {
    const url = new URL(`https://www.googleapis.com/drive/v3/files/${encodeURIComponent(id)}`);
    url.searchParams.set('fields', 'id,name,mimeType,modifiedTime,webViewLink');
    const payload = await googleDriveGet(url, accessToken);
    const file = normalizeDriveFile(payload);
    if (!file || file.id !== id) {
      throw new DriveMetadataError('A selected Drive file was unavailable. Refresh the list.', 422);
    }
    return file;
  }));
}
