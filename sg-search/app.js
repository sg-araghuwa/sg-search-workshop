const API_BASE = "http://localhost:3001";

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

const COLUMNS = ["firstName", "lastName", "email", "department", "city"];

let searchGeneration = 0;

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

  const params = new URLSearchParams();
  if (firstName) params.set("firstName", firstName);
  if (lastName) params.set("lastName", lastName);

  const generation = ++searchGeneration;
  setStatus(LOADING_MESSAGE);

  try {
    const response = await fetch(`${API_BASE}/api/search?${params.toString()}`);

    if (generation !== searchGeneration) {
      return;
    }

    if (!response.ok) {
      setStatus(ERROR_MESSAGE);
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
