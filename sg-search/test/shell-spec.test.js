const fs = require("fs");
const path = require("path");
const assert = require("assert");

const root = path.join(__dirname, "..");

function read(name) {
  return fs.readFileSync(path.join(root, name), "utf8");
}

const html = read("index.html");
const css = read("styles.css");
const pkg = JSON.parse(read("package.json"));

assert.match(html, /class="blob blob-1"/);
assert.match(html, /class="blob blob-2"/);
assert.match(html, /class="container"/);
assert.match(html, /<h1>Search App<\/h1>/);
assert.match(html, /id="search-panel"/);
assert.match(html, /class="glass-panel"/);
assert.match(html, /id="status"/);
assert.match(html, /class="status-area"/);
assert.match(html, /id="results-panel"/);
assert.match(html, /class="glass-panel results-panel"/);
assert.match(html, /<script src="app\.js"><\/script>/);
assert.doesNotMatch(html, /react|vue|tailwind|bootstrap/i);

assert.match(html, /id="search-form"/);
assert.match(html, /class="search-form"/);
assert.match(html, /id="firstName"/);
assert.match(html, /id="lastName"/);
assert.match(html, /name="firstName"/);
assert.match(html, /name="lastName"/);
assert.match(html, /placeholder="First Name"/);
assert.match(html, /placeholder="Last Name"/);
assert.match(html, /id="btn-search"/);
assert.match(html, /id="btn-clear"/);
assert.match(html, /class="button-group"/);
assert.match(html, /Enter a name to begin searching\./);
assert.match(html, /aria-live="polite"/);
assert.match(html, /role="status"/);
assert.match(html, /type="button"[^>]*id="btn-clear"/);
assert.match(html, /class="results-table"/);
assert.match(html, /id="results-body"/);

assert.match(css, /--layout-max-width:\s*1000px/);
assert.match(css, /--accent-color:\s*#BF5AF2/);
assert.match(css, /--accent-hover:\s*#AC4AD6/);
assert.match(css, /--radius-card:\s*24px/);
assert.match(css, /--radius-control:\s*14px/);
assert.match(css, /--glass-bg:\s*rgba\(255,\s*255,\s*255,\s*0\.6\)/);
assert.match(css, /\.blob/);
assert.match(css, /\.glass-panel/);
assert.match(css, /backdrop-filter:\s*blur\(20px\)/);
assert.match(css, /\.btn-search/);
assert.match(css, /\.btn-clear/);
assert.match(css, /\.results-panel/);
assert.match(css, /padding:\s*0/);

assert.match(css, /\.results-table/);
assert.match(css, /border-collapse:\s*separate/);
assert.match(css, /border-spacing:\s*0/);
assert.match(css, /\.results-table tr:hover td/);
assert.doesNotMatch(css, /\.results-table\s+th[^}]*border-left/i);
assert.doesNotMatch(css, /\.results-table\s+td[^}]*border-left/i);
assert.doesNotMatch(css, /\.results-table\s+th[^}]*border-right/i);
assert.doesNotMatch(css, /\.results-table\s+td[^}]*border-right/i);

assert.strictEqual(pkg.scripts.start, "npx --yes serve -l 3000 -s .");
assert.ok(!pkg.dependencies, "UI must not add npm dependencies");

const appJs = read("app.js");
assert.match(appJs, /preventDefault/);
assert.match(appJs, /addEventListener/);
assert.match(appJs, /fetch\(/);
assert.match(appJs, /API_BASE/);
assert.match(appJs, /\/api\/search/);
assert.match(appJs, /Searching database\.\.\./);
assert.match(appJs, /Search failed\. Please check the backend connection\./);
assert.match(appJs, /Found /);
assert.match(appJs, /results\./);
assert.doesNotMatch(appJs, /innerHTML/);
assert.match(appJs, /getElementById\("results-panel"\)/);
assert.match(appJs, /getElementById\("btn-clear"\)/);
assert.match(appJs, /renderResults/);
assert.match(appJs, /clearResultsPanel/);
assert.match(appJs, /firstName/);
assert.match(appJs, /lastName/);
assert.match(appJs, /email/);
assert.match(appJs, /department/);
assert.match(appJs, /city/);
assert.match(appJs, /textContent/);

const runSearchIdx = appJs.indexOf("async function runSearch");
const emptyGuardIdx = appJs.indexOf("if (!firstName && !lastName)", runSearchIdx);
const fetchIdx = appJs.indexOf("fetch(", runSearchIdx);
const renderIdx = appJs.indexOf("renderResults(", runSearchIdx);
assert.ok(runSearchIdx >= 0, "app.js must define runSearch");
assert.ok(
  emptyGuardIdx > runSearchIdx && fetchIdx > emptyGuardIdx,
  "both-blank trim must return before fetch"
);
assert.ok(
  renderIdx > runSearchIdx,
  "renderResults must be called from runSearch success path"
);

const catchIdx = appJs.indexOf("} catch {", runSearchIdx);
assert.ok(
  catchIdx > runSearchIdx && appJs.indexOf("renderResults", catchIdx) < 0,
  "renderResults must not be called in catch block"
);

assert.ok(
  /searchGeneration/.test(appJs) && /generation !== searchGeneration/.test(appJs),
  "app.js must guard against stale in-flight search responses"
);

console.log("shell-spec: all checks passed");
