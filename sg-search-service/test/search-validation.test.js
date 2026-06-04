const assert = require('assert');
const http = require('http');
const { spawn } = require('child_process');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const PORT = 3099;
const BASE = `http://127.0.0.1:${PORT}`;

function request(pathname) {
  return new Promise((resolve, reject) => {
    http
      .get(`${BASE}${pathname}`, (res) => {
        let body = '';
        res.on('data', (chunk) => {
          body += chunk;
        });
        res.on('end', () => {
          resolve({ status: res.statusCode, body: JSON.parse(body) });
        });
      })
      .on('error', reject);
  });
}

const child = spawn(process.execPath, ['server.js'], {
  cwd: ROOT,
  env: { ...process.env, PORT: String(PORT) },
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
    assert.ok(ok.body.count >= 1);

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
