const API_BASE = "http://localhost:3001";

const form = document.getElementById("search-form");
const firstNameInput = document.getElementById("firstName");
const firstNameCharHint = document.getElementById("firstName-char-hint");
const lastNameInput = document.getElementById("lastName");
const clearBtn = document.getElementById("clear-btn");
const statusEl = document.getElementById("status");
const resultsContainer = document.getElementById("results-container");
const resultsBody = document.getElementById("results-body");

const MAX_FIRST_NAME_LENGTH = 50;
const EMPTY_MESSAGE = "Enter a name to begin searching.";
const FIRST_NAME_TOO_LONG_MESSAGE = `First name must be ${MAX_FIRST_NAME_LENGTH} characters or fewer.`;
const LOADING_MESSAGE = "Searching database...";
const ERROR_MESSAGE = "Search failed. Please check the backend connection.";

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function setStatus(message) {
  statusEl.textContent = message;
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

function clearResults() {
  resultsBody.innerHTML = "";
  resultsContainer.hidden = true;
}

function resetUi() {
  firstNameInput.value = "";
  lastNameInput.value = "";
  updateFirstNameCharCount();
  setStatus(EMPTY_MESSAGE);
  clearResults();
}

function renderResults(results) {
  resultsBody.innerHTML = "";

  if (!Array.isArray(results) || results.length === 0) {
    resultsContainer.hidden = true;
    return;
  }

  for (const user of results) {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${escapeHtml(user.firstName)}</td>
      <td>${escapeHtml(user.lastName)}</td>
      <td>${escapeHtml(user.email)}</td>
      <td>${escapeHtml(user.department)}</td>
      <td>${escapeHtml(user.city)}</td>
    `;
    resultsBody.appendChild(row);
  }

  resultsContainer.hidden = false;
}

async function runSearch() {
  const firstName = firstNameInput.value.trim();
  const lastName = lastNameInput.value.trim();

  if (!firstName && !lastName) {
    setStatus(EMPTY_MESSAGE);
    clearResults();
    return;
  }

  if (firstName.length > MAX_FIRST_NAME_LENGTH) {
    setStatus(FIRST_NAME_TOO_LONG_MESSAGE);
    clearResults();
    return;
  }

  const params = new URLSearchParams();
  if (firstName) params.set("firstName", firstName);
  if (lastName) params.set("lastName", lastName);

  setStatus(LOADING_MESSAGE);

  try {
    const response = await fetch(`${API_BASE}/api/search?${params.toString()}`);

    if (!response.ok) {
      setStatus(ERROR_MESSAGE);
      return;
    }

    const data = await response.json();
    const count = typeof data.count === "number" ? data.count : 0;
    setStatus(`Found ${count} results.`);
    renderResults(Array.isArray(data.results) ? data.results : []);
  } catch {
    setStatus(ERROR_MESSAGE);
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
updateFirstNameCharCount();
