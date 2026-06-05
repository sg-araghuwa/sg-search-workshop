const assert = require('assert');
const http = require('http');
const { spawn } = require('child_process');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const PORT = 3099;
const BASE = `http://127.0.0.1:${PORT}`;

require('dotenv').config({ path: path.join(ROOT, '.env') });

const MONGODB_URI = process.env.MONGODB_URI?.trim();
if (!MONGODB_URI) {
  console.log(
    'search-validation: skipped — MONGODB_URI not set.\n' +
      '  Copy .env.example to .env and paste the facilitator Atlas URI, then re-run npm test.'
  );
  process.exit(0);
}

const TEST_ENV = {
  ...process.env,
  NODE_ENV: 'test',
  PORT: String(PORT),
  MONGODB_URI,
  OKTA_ISSUER: 'https://example.okta.com/oauth2/default',
  OKTA_AUDIENCE: 'test-client-id',
  OKTA_TEST_MOCK: '1',
};

function request(pathname) {
  return new Promise((resolve, reject) => {
    const url = new URL(`${BASE}${pathname}`);
    const req = http.request(
      {
        hostname: url.hostname,
        port: url.port,
        path: `${url.pathname}${url.search}`,
        method: 'GET',
        headers: { Authorization: 'Bearer test-token' },
      },
      (res) => {
        let body = '';
        res.on('data', (chunk) => {
          body += chunk;
        });
        res.on('end', () => {
          resolve({ status: res.statusCode, body: JSON.parse(body) });
        });
      }
    );
    req.on('error', reject);
    req.end();
  });
}

const child = spawn(process.execPath, ['server.js'], {
  cwd: ROOT,
  env: TEST_ENV,
  stdio: ['ignore', 'pipe', 'pipe'],
});

let ready = false;
child.stdout.on('data', (chunk) => {
  if (chunk.toString().includes('listening')) ready = true;
});

async function waitReady() {
  for (let i = 0; i < 50; i++) {
    if (ready) return;
    await new Promise((r) => setTimeout(r, 100));
  }
  throw new Error('server did not start');
}

(async () => {
  try {
    await waitReady();

    const ok = await request('/api/search?firstName=John');
    assert.strictEqual(ok.status, 200);
    assert.strictEqual(ok.body.count, 3);

    const longName = 'a'.repeat(51);
    const bad = await request(`/api/search?firstName=${longName}&lastName=Smith`);
    assert.strictEqual(bad.status, 400);
    assert.match(bad.body.error, /firstName must not exceed 50 characters/);

    const lastOnly = await request('/api/search?lastName=Smith');
    assert.strictEqual(lastOnly.status, 200);

    console.log('search-validation: all checks passed');
  } finally {
    child.kill();
  }
})().catch((err) => {
  child.kill();
  console.error(err);
  process.exit(1);
});
