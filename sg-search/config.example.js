// Copy this file to config.js and fill in values from your Okta SPA app registration.
// config.js is gitignored — do not commit real client IDs.
//
// AC #5 variable mapping (Epic 2 Okta Auth JS uses the property names below):
//   OKTA_ISSUER        → issuer
//   OKTA_CLIENT_ID     → clientId
//   OKTA_REDIRECT_URI  → redirectUri
window.OKTA_CONFIG = {
  issuer: "https://{yourOktaDomain}/oauth2/default",
  clientId: "YOUR_CLIENT_ID",
  redirectUri: "http://localhost:3000/login/callback",
  // If you browse via 127.0.0.1, set redirectUri to:
  // "http://127.0.0.1:3000/login/callback"
  // and register BOTH URIs in the Okta SPA app.
};
