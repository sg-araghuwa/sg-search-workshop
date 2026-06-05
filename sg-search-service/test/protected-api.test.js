const assert = require('assert');
const http = require('http');
const { spawn } = require('child_process');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const PORT = 3098;
const BASE = `http://127.0.0.1:${PORT}`;

const TEST_ENV = {
  ...process.env,
  PORT: String(PORT),
  OKTA_ISSUER: 'https://example.okta.com/oauth2/default',
  OKTA_AUDIENCE: 'test-client-id',
};

function request(pathname, options = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(`${BASE}${pathname}`);
    const reqOptions = {
      hostname: url.hostname,
      port: url.port,
      path: `${url.pathname}${url.search}`,
      method: options.method || 'GET',
      headers: options.headers || {},
    };

    const req = http.request(reqOptions, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        let parsed = null;
        if (body.length) {
          try {
            parsed = JSON.parse(body);
          } catch {
            parsed = body;
          }
        }
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: parsed,
        });
      });
    });

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

    const health = await request('/health');
    assert.strictEqual(health.status, 200);
    assert.deepStrictEqual(health.body, { status: 'ok' });

    const root = await request('/');
    assert.strictEqual(root.status, 200);
    assert.match(String(root.body), /sg-search-service is running/);

    const unauthorized = await request('/api/search?firstName=John');
    assert.strictEqual(unauthorized.status, 401);
    assert.deepStrictEqual(unauthorized.body, { error: 'Unauthorized' });

    const preflight = await request('/api/search', {
      method: 'OPTIONS',
      headers: {
        Origin: 'http://localhost:3000',
        'Access-Control-Request-Method': 'GET',
        'Access-Control-Request-Headers': 'authorization',
      },
    });
    assert.strictEqual(preflight.status, 204);
    assert.strictEqual(
      preflight.headers['access-control-allow-headers']
        .toLowerCase()
        .includes('authorization'),
      true
    );

    console.log('protected-api: all checks passed');
  } finally {
    child.kill();
  }
})().catch((err) => {
  child.kill();
  console.error(err);
  process.exit(1);
});
