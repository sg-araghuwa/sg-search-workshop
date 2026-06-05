const OktaJwtVerifier = require('@okta/jwt-verifier');

let verifier = null;
let testVerifierOverride = null;

function getVerifier() {
  if (testVerifierOverride) {
    return testVerifierOverride;
  }

  if (verifier) {
    return verifier;
  }

  const issuer = process.env.OKTA_ISSUER;
  const audience = process.env.OKTA_AUDIENCE;

  if (!issuer || !audience) {
    throw new Error('OKTA_ISSUER and OKTA_AUDIENCE must be set in environment');
  }

  verifier = new OktaJwtVerifier({
    issuer,
    clientId: audience,
  });

  return verifier;
}

function parseBearerToken(authHeader) {
  if (!authHeader || typeof authHeader !== 'string') {
    return null;
  }

  const match = authHeader.match(/^Bearer\s+(\S+)$/i);
  return match ? match[1] : null;
}

function hasRequiredScope(claims, requiredScope) {
  if (!requiredScope) {
    return true;
  }

  const scopes = claims.scp || [];
  return scopes.includes(requiredScope);
}

async function requireAuth(req, res, next) {
  const token = parseBearerToken(req.headers.authorization);

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const audience = process.env.OKTA_AUDIENCE;

  try {
    const jwt = await getVerifier().verifyAccessToken(token, audience);
    const requiredScope = process.env.OKTA_REQUIRED_SCOPE;

    if (!hasRequiredScope(jwt.claims, requiredScope)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    req.auth = jwt;
    return next();
  } catch {
    return res.status(401).json({ error: 'Unauthorized' });
  }
}

module.exports = requireAuth;
module.exports.parseBearerToken = parseBearerToken;
module.exports.hasRequiredScope = hasRequiredScope;
module.exports._setVerifierForTests = (mockVerifier) => {
  testVerifierOverride = mockVerifier;
};

module.exports._resetVerifierForTests = () => {
  verifier = null;
  testVerifierOverride = null;
};

if (process.env.OKTA_TEST_MOCK === '1' && process.env.NODE_ENV === 'test') {
  testVerifierOverride = {
    verifyAccessToken: async () => ({ claims: { scp: [] } }),
  };
}
