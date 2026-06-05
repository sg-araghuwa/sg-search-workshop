const API_BASE = "http://localhost:3001";

const signInSection = document.getElementById("sign-in-section");
const searchSection = document.getElementById("search-section");
const signInBtn = document.getElementById("sign-in-btn");
const signOutBtn = document.getElementById("sign-out-btn");
const userDisplay = document.getElementById("user-display");
const signInError = document.getElementById("sign-in-error");
const authRetryBtn = document.getElementById("auth-retry-btn");

const form = document.getElementById("search-form");
const firstNameInput = document.getElementById("firstName");
const firstNameCharHint = document.getElementById("firstName-char-hint");
const lastNameInput = document.getElementById("lastName");
const clearBtn = document.getElementById("btn-clear");
const statusEl = document.getElementById("status");
const resultsPanel = document.getElementById("results-panel");
const resultsBody = document.getElementById("results-body");

const MAX_FIRST_NAME_LENGTH = 50;
const EMPTY_MESSAGE = "Enter a name to begin searching.";
const FIRST_NAME_TOO_LONG_MESSAGE = `First name must be ${MAX_FIRST_NAME_LENGTH} characters or fewer.`;
const LOADING_MESSAGE = "Searching database...";
const ERROR_MESSAGE = "Search failed. Please check the backend connection.";
const SIGNING_IN_MESSAGE = "Signing you in...";
const SESSION_EXPIRED_MESSAGE =
  "Your session has expired. Please sign in again.";
const NOT_SIGNED_IN_MESSAGE =
  "You are not signed in. Please sign in to search.";

const COLUMNS = ["firstName", "lastName", "email", "department", "city"];

let searchGeneration = 0;

function setStatus(message) {
  statusEl.textContent = message;
}

function showSignInSurface(showError) {
  document.body.classList.add("auth-mode");
  signInSection.hidden = false;
  searchSection.hidden = true;
  signInError.hidden = true;
  if (showError) {
    signInError.hidden = false;
  }
}

function showSearchSurface() {
  document.body.classList.remove("auth-mode");
  signInSection.hidden = true;
  searchSection.hidden = false;
  signInError.hidden = true;
}

function truncateDisplayName(value, maxLength) {
  const text = String(value ?? "").trim();
  if (!text) {
    return "";
  }
  if (text.length <= maxLength) {
    return text;
  }
  return `${text.slice(0, maxLength - 1)}…`;
}

async function enterAuthenticatedState() {
  showSearchSurface();
  const displayName = await auth.getUserDisplayName();
  const truncated = truncateDisplayName(displayName, 40);
  userDisplay.textContent = truncated;
  if (truncated && displayName && displayName.length > 40) {
    userDisplay.title = displayName;
  } else {
    userDisplay.removeAttribute("title");
  }
  setStatus(EMPTY_MESSAGE);
}

function updateFirstNameCharCount() {
  const count = firstNameInput.value.length;
  const label = `${count} / ${MAX_FIRST_NAME_LENGTH}`;
  firstNameCharHint.textContent = label;
  firstNameInput.title = `${count} of ${MAX_FIRST_NAME_LENGTH} characters entered`;
  firstNameCharHint.classList.toggle(
    "char-count-hint--limit",
    count >= MAX_FIRST_NAME_LENGTH
  );
}

function clearResultsPanel() {
  resultsBody.textContent = "";
  resultsPanel.hidden = true;
}

function resetUi() {
  firstNameInput.value = "";
  lastNameInput.value = "";
  updateFirstNameCharCount();
  setStatus(EMPTY_MESSAGE);
  clearResultsPanel();
}

function renderResults(results) {
  resultsBody.textContent = "";

  if (!Array.isArray(results) || results.length === 0) {
    resultsPanel.hidden = true;
    return;
  }

  for (const user of results) {
    const row = document.createElement("tr");
    for (const key of COLUMNS) {
      const cell = document.createElement("td");
      cell.textContent = user[key] ?? "";
      row.appendChild(cell);
    }
    resultsBody.appendChild(row);
  }

  resultsPanel.hidden = false;
}

async function runSearch() {
  const firstName = firstNameInput.value.trim();
  const lastName = lastNameInput.value.trim();

  if (!firstName && !lastName) {
    setStatus(EMPTY_MESSAGE);
    clearResultsPanel();
    return;
  }

  if (firstName.length > MAX_FIRST_NAME_LENGTH) {
    setStatus(FIRST_NAME_TOO_LONG_MESSAGE);
    clearResultsPanel();
    return;
  }

  const token = await auth.getAccessToken();
  if (!token) {
    setStatus(SESSION_EXPIRED_MESSAGE);
    clearResultsPanel();
    auth.signIn().catch(() => showSignInSurface(true));
    return;
  }

  const params = new URLSearchParams();
  if (firstName) params.set("firstName", firstName);
  if (lastName) params.set("lastName", lastName);

  const generation = ++searchGeneration;
  setStatus(LOADING_MESSAGE);

  try {
    const response = await fetch(`${API_BASE}/api/search?${params.toString()}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.status === 401) {
      setStatus(NOT_SIGNED_IN_MESSAGE);
      clearResultsPanel();
      auth.signIn().catch(() => showSignInSurface(true));
      return;
    }

    if (generation !== searchGeneration) {
      return;
    }

    if (!response.ok) {
      setStatus(ERROR_MESSAGE);
      clearResultsPanel();
      return;
    }

    const data = await response.json();

    if (generation !== searchGeneration) {
      return;
    }

    const count = typeof data.count === "number" ? data.count : 0;
    setStatus(`Found ${count} results.`);
    renderResults(Array.isArray(data.results) ? data.results : []);
  } catch {
    if (generation !== searchGeneration) {
      return;
    }
    setStatus(ERROR_MESSAGE);
    clearResultsPanel();
  }
}

async function bootAuth() {
  if (auth.consumeVoluntaryLogout()) {
    showSignInSurface(false);
    return;
  }

  try {
    const state = await auth.initAuth();

    if (state === "callback") {
      const params = new URLSearchParams(window.location.search);
      if (!params.has("code")) {
        window.history.replaceState({}, document.title, "/");
        showSignInSurface(params.has("error"));
        return;
      }

      showSearchSurface();
      setStatus(SIGNING_IN_MESSAGE);
      try {
        await auth.handleCallback();
        await enterAuthenticatedState();
      } catch {
        showSignInSurface(true);
      }
      return;
    }

    if (state === "authenticated") {
      const token = await auth.getAccessToken();
      if (!token) {
        showSignInSurface(false);
        return;
      }
      try {
        await enterAuthenticatedState();
      } catch {
        showSignInSurface(false);
      }
      return;
    }

    showSignInSurface(false);
  } catch {
    showSignInSurface(false);
  }
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  runSearch();
});

[firstNameInput, lastNameInput].forEach((input) => {
  input.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      runSearch();
    }
  });
});

clearBtn.addEventListener("click", resetUi);
firstNameInput.addEventListener("input", updateFirstNameCharCount);

signInBtn.addEventListener("click", () => {
  signInError.hidden = true;
  auth.signIn().catch(() => showSignInSurface(true));
});

authRetryBtn.addEventListener("click", () => {
  signInError.hidden = true;
  auth.signIn().catch(() => showSignInSurface(true));
});

signOutBtn.addEventListener("click", async () => {
  searchGeneration += 1;
  resetUi();
  userDisplay.textContent = "";
  userDisplay.removeAttribute("title");
  signInError.hidden = true;
  showSignInSurface(false);
  try {
    await auth.signOut();
  } catch {
    signInError.hidden = true;
  }
});

document.addEventListener("DOMContentLoaded", () => {
  updateFirstNameCharCount();
  bootAuth();
});
