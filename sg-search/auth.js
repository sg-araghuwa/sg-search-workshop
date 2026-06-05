(function () {
  let oktaAuth = null;

  function getConfig() {
    if (typeof window.OKTA_CONFIG === "undefined") {
      throw new Error("Missing OKTA_CONFIG — copy config.example.js to config.js");
    }
    return window.OKTA_CONFIG;
  }

  function createClient() {
    const cfg = getConfig();
    const redirectUri =
      cfg.redirectUri || `${window.location.origin}/login/callback`;
    return new OktaAuth({
      issuer: cfg.issuer,
      clientId: cfg.clientId,
      redirectUri,
      pkce: true,
      scopes: ["openid", "profile", "email"],
    });
  }

  function isCallbackPath() {
    return window.location.pathname.replace(/\/+$/, "") === "/login/callback";
  }

  function isLoginCallback() {
    if (!isCallbackPath()) {
      return false;
    }
    return new URLSearchParams(window.location.search).has("code");
  }

  const LOGOUT_FLAG = "sg-search-voluntary-logout";

  function markVoluntaryLogout() {
    sessionStorage.setItem(LOGOUT_FLAG, "1");
  }

  function consumeVoluntaryLogout() {
    if (sessionStorage.getItem(LOGOUT_FLAG) === "1") {
      sessionStorage.removeItem(LOGOUT_FLAG);
      return true;
    }
    return false;
  }

  function clearCallbackUrl() {
    window.history.replaceState({}, document.title, "/");
  }

  async function initAuth() {
    oktaAuth = createClient();

    if (isCallbackPath()) {
      if (isLoginCallback()) {
        return "callback";
      }
      clearCallbackUrl();
      return "unauthenticated";
    }

    return (await oktaAuth.isAuthenticated()) ? "authenticated" : "unauthenticated";
  }

  async function handleCallback() {
    await oktaAuth.handleLoginRedirect();
    window.history.replaceState({}, document.title, "/");
  }

  async function signIn() {
    await oktaAuth.signInWithRedirect();
  }

  async function signOut() {
    markVoluntaryLogout();
    await oktaAuth.tokenManager.clear();
    // Local sign-out only — avoids Okta redirect reload that re-triggers bootAuth
    // with stale callback/error URLs and shows a false "Sign-in failed" message.
  }

  async function getAccessToken() {
    if (!oktaAuth) {
      return null;
    }

    try {
      let token = await oktaAuth.tokenManager.get("accessToken");
      if (!token || oktaAuth.tokenManager.hasExpired(token)) {
        try {
          token = await oktaAuth.tokenManager.renew("accessToken");
        } catch {
          return null;
        }
      }
      return token?.accessToken ?? null;
    } catch {
      return null;
    }
  }

  async function getUserDisplayName() {
    const user = await oktaAuth.getUser();
    return user.name || user.email || user.preferred_username || "Signed in";
  }

  async function isAuthenticated() {
    return oktaAuth.isAuthenticated();
  }

  window.auth = {
    initAuth,
    handleCallback,
    signIn,
    signOut,
    getAccessToken,
    getUserDisplayName,
    isAuthenticated,
    consumeVoluntaryLogout,
  };
})();
