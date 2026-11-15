import test from 'node:test';
import assert from 'node:assert/strict';
import {
  MAX_DRIVE_CONTEXT_FILES,
  driveSearchFilter,
  normalizeDriveFile,
  parseSelectedDriveFileIds,
  safeDriveWebUrl,
} from '../src/lib/google-drive-utils.ts';

test('Drive query escapes apostrophes and backslashes, and rejects controls', () => {
  assert.equal(driveSearchFilter(''), 'trashed = false');
  assert.equal(driveSearchFilter("Febin's notes"), "trashed = false and name contains 'Febin\\'s notes'");
  assert.equal(driveSearchFilter('a\\b'), "trashed = false and name contains 'a\\\\b'");
  assert.throws(() => driveSearchFilter('x'.repeat(101)), RangeError);
  assert.throws(() => driveSearchFilter('line\nseparator'), RangeError);
});

test('Only 0–3 distinct valid file IDs may reach Gemini planning', () => {
  assert.equal(MAX_DRIVE_CONTEXT_FILES, 3);
  assert.deepEqual(parseSelectedDriveFileIds(undefined), []);
  assert.deepEqual(parseSelectedDriveFileIds(['1AbCdEfGh', '2AbCdEfGh']), ['1AbCdEfGh', '2AbCdEfGh']);
  assert.equal(parseSelectedDriveFileIds(['1AbCdEfGh', '1AbCdEfGh']), null);
  assert.equal(parseSelectedDriveFileIds(['abc']), null);
  assert.equal(parseSelectedDriveFileIds(['1AbCdEfGh', '2AbCdEfGh', '3AbCdEfGh', '4AbCdEfGh']), null);
  assert.equal(parseSelectedDriveFileIds('1AbCdEfGh'), null);
});

test('Drive metadata never emits arbitrary URLs or document content', () => {
  assert.equal(safeDriveWebUrl('https://drive.google.com/file/d/123/view'), 'https://drive.google.com/file/d/123/view');
  assert.equal(safeDriveWebUrl('https://docs.google.com/document/d/123/edit'), 'https://docs.google.com/document/d/123/edit');
  assert.equal(safeDriveWebUrl('https://drive.google.com.evil.test/file'), null);
  assert.equal(safeDriveWebUrl('javascript:alert(1)'), null);
  assert.equal(safeDriveWebUrl('https://user@drive.google.com/file'), null);
  const metadata = normalizeDriveFile({
    id: '1AbCdEfGhIjKlMn', name: '<script>no</script>', mimeType: 'application/vnd.google-apps.document',
    webViewLink: 'https://malicious.test/redirect', content: 'Private document content',
  });
  assert.deepEqual(metadata, {
    id: '1AbCdEfGhIjKlMn', name: '<script>no</script>',
    mimeType: 'application/vnd.google-apps.document', modifiedTime: '', url: null,
  });
  assert.equal(normalizeDriveFile({ id: '../../secrets', name: 'Oops' }), null);
});
