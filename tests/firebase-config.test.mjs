import assert from 'node:assert/strict';
import test from 'node:test';
import { firebaseWebConfig } from '../src/lib/firebase-config.ts';

const keys = ['NEXT_PUBLIC_FIREBASE_API_KEY', 'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
  'NEXT_PUBLIC_FIREBASE_PROJECT_ID', 'NEXT_PUBLIC_FIREBASE_APP_ID'];

test('Firebase configuration fails closed and only exposes public identifiers', () => {
  const before = Object.fromEntries(keys.map(key => [key, process.env[key]]));
  try {
    keys.forEach(key => { delete process.env[key]; });
    assert.equal(firebaseWebConfig(), null);
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY = 'AIzaSyA01234567890123456789012345678901';
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID = 'my-safe-project';
    process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN = 'malicious.example.com';
    process.env.NEXT_PUBLIC_FIREBASE_APP_ID = '1:123:web:abcdef';
    assert.equal(firebaseWebConfig(), null);
    process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN = 'my-safe-project.firebaseapp.com';
    const config = firebaseWebConfig();
    assert.equal(config?.projectId, 'my-safe-project');
    assert.equal(config?.authDomain, 'my-safe-project.firebaseapp.com');
    assert.equal('secretKey' in config, false);
  } finally {
    for (const key of keys) {
      if (before[key] === undefined) delete process.env[key];
      else process.env[key] = before[key];
    }
  }
});
