const assert = require('assert');
const requireAuth = require('../middleware/requireAuth');

const {
  parseBearerToken,
  hasRequiredScope,
  _setVerifierForTests,
  _resetVerifierForTests,
} = requireAuth;

function mockRes() {
  return {
    statusCode: null,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
  };
}

assert.strictEqual(parseBearerToken(undefined), null);
assert.strictEqual(parseBearerToken('Basic abc'), null);
assert.strictEqual(parseBearerToken('Bearer'), null);
assert.strictEqual(parseBearerToken('Bearer '), null);
assert.strictEqual(parseBearerToken('bearer token123'), 'token123');
assert.strictEqual(parseBearerToken('Bearer eyJhbGciOiJSUzI1NiJ9'), 'eyJhbGciOiJSUzI1NiJ9');

assert.strictEqual(hasRequiredScope({}, undefined), true);
assert.strictEqual(hasRequiredScope({}, ''), true);
assert.strictEqual(hasRequiredScope({ scp: ['search'] }, 'search'), true);
assert.strictEqual(hasRequiredScope({ scp: ['openid'] }, 'search'), false);
assert.strictEqual(hasRequiredScope({}, 'search'), false);

(async () => {
  _resetVerifierForTests();
  process.env.OKTA_ISSUER = 'https://example.okta.com/oauth2/default';
  process.env.OKTA_AUDIENCE = 'test-client-id';
  delete process.env.OKTA_REQUIRED_SCOPE;

  const res = mockRes();
  let nextCalled = false;

  await requireAuth({ headers: {} }, res, () => {
    nextCalled = true;
  });

  assert.strictEqual(nextCalled, false);
  assert.strictEqual(res.statusCode, 401);
  assert.deepStrictEqual(res.body, { error: 'Unauthorized' });

  _setVerifierForTests({
    verifyAccessToken: async () => {
      throw new Error('invalid token');
    },
  });

  const resInvalid = mockRes();
  await requireAuth(
    { headers: { authorization: 'Bearer not-a-real-jwt' } },
    resInvalid,
    () => {}
  );

  assert.strictEqual(resInvalid.statusCode, 401);
  assert.deepStrictEqual(resInvalid.body, { error: 'Unauthorized' });

  process.env.OKTA_REQUIRED_SCOPE = 'search';
  _setVerifierForTests({
    verifyAccessToken: async () => ({
      claims: { scp: ['openid'] },
    }),
  });

  const resForbidden = mockRes();
  await requireAuth(
    { headers: { authorization: 'Bearer mock-valid-token' } },
    resForbidden,
    () => {}
  );

  assert.strictEqual(resForbidden.statusCode, 403);
  assert.deepStrictEqual(resForbidden.body, { error: 'Forbidden' });

  _resetVerifierForTests();
  delete process.env.OKTA_REQUIRED_SCOPE;

  console.log('requireAuth: all checks passed');
})().catch((err) => {
  _resetVerifierForTests();
  console.error(err);
  process.exit(1);
});
