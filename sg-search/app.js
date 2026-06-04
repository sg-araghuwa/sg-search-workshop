const SEARCH_API = "http://localhost:3001/api/search";

const RESULT_COLUMNS = [
  { key: "firstName", label: "First Name" },
  { key: "lastName", label: "Last Name" },
  { key: "email", label: "Email" },
  { key: "department", label: "Department" },
  { key: "city", label: "City" },
];

const STATUS = {
  empty: "Enter a name to begin searching.",
  loading: "Searching database...",
  success: (n) => `Found ${n} results.`,
  error: "Search failed. Please check the backend connection.",
};

let searchGeneration = 0;

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("search-form");
  const statusEl = document.getElementById("status-message");
  const clearBtn = document.getElementById("btn-clear");
  if (!form || !statusEl) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    await runSearch(statusEl);
  });

  clearBtn?.addEventListener("click", () => {
    resetSearchUi(statusEl);
  });
});

function resetSearchUi(statusEl) {
  searchGeneration += 1;

  const first = document.getElementById("firstName");
  const last = document.getElementById("lastName");
  if (first) first.value = "";
  if (last) last.value = "";

  if (statusEl) statusEl.textContent = STATUS.empty;
  clearResultsPanel();
}

async function runSearch(statusEl) {
  const generation = ++searchGeneration;

  const firstName = (document.getElementById("firstName")?.value ?? "").trim();
  const lastName = (document.getElementById("lastName")?.value ?? "").trim();

  if (!firstName && !lastName) {
    if (generation !== searchGeneration) return;
    statusEl.textContent = STATUS.empty;
    return;
  }

  if (generation !== searchGeneration) return;
  statusEl.textContent = STATUS.loading;
  clearResultsPanel();

  try {
    const params = new URLSearchParams();
    if (firstName) params.set("firstName", firstName);
    if (lastName) params.set("lastName", lastName);
    const res = await fetch(`${SEARCH_API}?${params.toString()}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (generation !== searchGeneration) return;
    const count = typeof data.count === "number" ? data.count : 0;
    statusEl.textContent = STATUS.success(count);
    renderResults(Array.isArray(data.results) ? data.results : []);
  } catch {
    if (generation !== searchGeneration) return;
    statusEl.textContent = STATUS.error;
  }
}

function clearResultsPanel() {
  const panel = document.getElementById("results-panel");
  if (!panel) return;
  panel.replaceChildren();
  panel.classList.remove("results-panel--with-table");
}

function renderResults(results) {
  const panel = document.getElementById("results-panel");
  if (!panel) return;

  panel.replaceChildren();
  panel.classList.add("results-panel--with-table");

  const table = document.createElement("table");
  table.className = "results-table";

  const thead = document.createElement("thead");
  const headerRow = document.createElement("tr");
  for (const col of RESULT_COLUMNS) {
    const th = document.createElement("th");
    th.textContent = col.label;
    headerRow.appendChild(th);
  }
  thead.appendChild(headerRow);
  table.appendChild(thead);

  const tbody = document.createElement("tbody");
  for (const row of results) {
    const tr = document.createElement("tr");
    for (const col of RESULT_COLUMNS) {
      const td = document.createElement("td");
      const raw = row?.[col.key];
      td.textContent = raw == null ? "" : String(raw);
      tr.appendChild(td);
    }
    tbody.appendChild(tr);
  }
  table.appendChild(tbody);
  panel.appendChild(table);
}
