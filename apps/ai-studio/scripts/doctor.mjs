/** Local configuration readiness check. It never prints credential values. */
import { readFileSync } from 'node:fs';

const firebase = JSON.parse(
  readFileSync(new URL('../firebase-applet-config.json', import.meta.url), 'utf8'),
);
const strict = process.argv.includes('--strict');
let incomplete = false;

function check(label, ready, hint) {
  console.log(`${ready ? 'OK' : 'NEEDS SETUP'}  ${label}`);
  if (!ready) {
    incomplete = true;
    if (hint) console.log(`             ${hint}`);
  }
}

const geminiKey = (process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '').trim();
const model = (process.env.GEMINI_MODEL || 'gemini-3.1-flash-lite').trim();
const signingSecret = process.env.GOOGLE_SESSION_SECRET || '';

console.log('Google Agentic Browser — private integration readiness');
check('Gemini server API key', Boolean(geminiKey && geminiKey !== 'MY_GEMINI_API_KEY'),
  'Add GEMINI_API_KEY to .env.local or your deployment secret manager.');
check('Approval signing secret (32+ characters)', signingSecret.length >= 32,
  'Add a randomly generated GOOGLE_SESSION_SECRET; required in production.');
check('Firebase public web configuration',
  Boolean(firebase.projectId && firebase.appId && firebase.apiKey && firebase.authDomain),
  'Configure firebase-applet-config.json for a Firebase project you control.');

console.log(`INFO         Gemini model: ${model}`);
console.log(`INFO         Guest Gemini development mode: ${process.env.GEMINI_ALLOW_GUEST_DEV === 'true' ? 'enabled (development only)' : 'disabled'}`);
console.log(`INFO         Approved Google Workspace writes: ${process.env.ENABLE_APPROVED_GOOGLE_WRITES === 'true' ? 'enabled — audit before deploying' : 'disabled (recommended)'}`);
console.log('INFO         Firestore rules, OAuth consent, API quotas and live calls require separate verification.');

if (strict && incomplete) process.exitCode = 1;
