/** Pure validation utilities shared by read-only Google Drive routes. */
export const MAX_DRIVE_CONTEXT_FILES = 3;

export type DriveFileMetadata = {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime: string;
  url: string | null;
};

const FILE_ID = /^[A-Za-z0-9_-]{8,128}$/;
const SAFE_HOSTS = new Set(['drive.google.com', 'docs.google.com', 'sheets.google.com', 'slides.google.com']);

/** Return null for malformed IDs, including empty or oversized selections. */
export function parseSelectedDriveFileIds(value: unknown): string[] | null {
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value) || value.length > MAX_DRIVE_CONTEXT_FILES) return null;
  if (!value.every(id => typeof id === 'string' && FILE_ID.test(id))) return null;
  const ids = value as string[];
  return new Set(ids).size === ids.length ? ids : null;
}

/** Google Drive q literals must escape both backslash and apostrophe. */
export function driveSearchFilter(search: string): string {
  const value = search.trim();
  if (value.length > 100 || /[\u0000-\u001f\u007f]/.test(value)) {
    throw new RangeError('Search must be 0–100 characters without control characters.');
  }
  const escaped = value.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
  return value ? `trashed = false and name contains '${escaped}'` : 'trashed = false';
}

export function safeDriveWebUrl(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && SAFE_HOSTS.has(url.hostname) &&
      !url.username && !url.password && !url.port ? url.href : null;
  } catch {
    return null;
  }
}

export function normalizeDriveFile(value: unknown): DriveFileMetadata | null {
  if (!value || typeof value !== 'object') return null;
  const file = value as Record<string, unknown>;
  if (typeof file.id !== 'string' || !FILE_ID.test(file.id)) return null;
  return {
    id: file.id,
    name: typeof file.name === 'string' ? file.name.slice(0, 250) : 'Untitled file',
    mimeType: typeof file.mimeType === 'string' ? file.mimeType.slice(0, 150) : '',
    modifiedTime: typeof file.modifiedTime === 'string' ? file.modifiedTime.slice(0, 40) : '',
    url: safeDriveWebUrl(file.webViewLink),
  };
}
