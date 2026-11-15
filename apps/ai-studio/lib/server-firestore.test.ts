import test from 'node:test';
import assert from 'node:assert/strict';
import {
  decodeFirestoreDocument,
  decodeFirestoreValue,
  encodeFirestoreValue,
  getFirestoreBaseUrl,
  getFirestoreDocumentResourceName,
  sanitizeDocId,
} from './server/firestore';

test('sanitizeDocId enforces safe Firestore ID characters and length bounds', () => {
  assert.equal(sanitizeDocId('user/123:abc?x'), 'user_123_abc_x');
  assert.equal(sanitizeDocId(''), 'default');
  assert.equal(sanitizeDocId('a'.repeat(200)).length, 128);
});

test('encodeFirestoreValue and decodeFirestoreValue roundtrip primitives, arrays, and maps', () => {
  const sample = {
    name: 'Primary Workspace',
    splitLayout: 4,
    ratio: 50.5,
    sidebarOpen: true,
    tags: ['work', 'gemini'],
    nested: { active: false, count: 2 },
    empty: null,
  };

  const encoded = encodeFirestoreValue(sample);
  assert.ok('mapValue' in encoded);

  const decoded = decodeFirestoreValue(encoded) as typeof sample;
  assert.deepEqual(decoded, sample);
});

test('decodeFirestoreDocument decodes Firestore REST document fields cleanly', () => {
  const decoded = decodeFirestoreDocument({
    name: 'projects/test/databases/db/documents/workspaces/ws_1',
    fields: {
      id: { stringValue: 'ws_1' },
      ownerId: { stringValue: 'uid_abc' },
      sidebarOpen: { booleanValue: true },
      splitLayout: { integerValue: '4' },
    },
  });

  assert.deepEqual(decoded, {
    id: 'ws_1',
    ownerId: 'uid_abc',
    sidebarOpen: true,
    splitLayout: 4,
  });
});

test('Firestore resource builders target configured projectId and firestoreDatabaseId', () => {
  const baseUrl = getFirestoreBaseUrl();
  assert.ok(baseUrl.includes('gen-lang-client-0815076002'));
  assert.ok(baseUrl.includes('ai-studio-115286c9-8126-4788-b826-a4a0fc69d5b8'));

  const resourceName = getFirestoreDocumentResourceName('workspaces', 'u1_default');
  assert.equal(
    resourceName,
    'projects/gen-lang-client-0815076002/databases/ai-studio-115286c9-8126-4788-b826-a4a0fc69d5b8/documents/workspaces/u1_default'
  );
});
