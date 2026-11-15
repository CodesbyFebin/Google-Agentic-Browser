import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const rulesPath = path.resolve(process.cwd(), 'firestore.rules');
const blueprintPath = path.resolve(process.cwd(), 'firebase-blueprint.json');

test('firestore.rules enforces default-deny, email verification, and owner isolation', () => {
  const rules = fs.readFileSync(rulesPath, 'utf8');

  assert.ok(rules.includes('allow read, write: if false;'), 'Missing global default-deny');
  assert.ok(rules.includes('request.auth.token.email_verified == true'), 'Missing email verification helper');
  assert.ok(rules.includes('data.ownerId == request.auth.uid'), 'Missing ownerId enforcement on create');
  assert.ok(rules.includes('incoming().createdAt == existing().createdAt'), 'Missing immutable createdAt check');
  assert.ok(rules.includes('allow delete: if false;') || rules.includes('allow update, delete: if false;'), 'Missing immutable audit log protection');
});

test('firestore.rules forbids real payment activation and covers every firebase-blueprint collection', () => {
  const rules = fs.readFileSync(rulesPath, 'utf8');
  const blueprint = JSON.parse(fs.readFileSync(blueprintPath, 'utf8')) as {
    firestore: Record<string, unknown>;
  };

  assert.ok(
    rules.includes('data.realPaymentsEnabled == false'),
    'SpendingPolicy rules must enforce realPaymentsEnabled == false'
  );
  assert.ok(
    rules.includes('data.isSimulated == true'),
    'SimulatedTransaction rules must enforce isSimulated == true'
  );

  // Verify every top-level collection declared in firebase-blueprint.json has a match block in firestore.rules
  const blueprintPaths = Object.keys(blueprint.firestore);
  for (const collectionPath of blueprintPaths) {
    const topLevelSegment = collectionPath.split('/')[1];
    assert.ok(
      rules.includes(`match /${topLevelSegment}/`),
      `firestore.rules missing match rule for /${topLevelSegment}/`
    );
  }
});
