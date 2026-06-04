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

assert.match(html, /<header class="page-header">/);
assert.match(html, /id="search-panel"/);
assert.match(html, /id="status-panel"/);
assert.match(html, /id="results-panel"/);
assert.match(html, /class="glass-card"/);
assert.match(html, /<script src="app\.js"><\/script>/);
assert.doesNotMatch(html, /react|vue|tailwind|bootstrap/i);

assert.match(html, /id="search-form"/);
assert.match(html, /id="firstName"/);
assert.match(html, /id="lastName"/);
assert.match(html, /name="firstName"/);
assert.match(html, /name="lastName"/);
assert.match(html, /id="btn-search"/);
assert.match(html, /id="btn-clear"/);
assert.match(html, /Enter a name to begin searching\./);
assert.match(html, /id="status-message"/);
assert.match(html, /aria-live="polite"/);
assert.match(html, /type="button"[^>]*id="btn-clear"/);
assert.doesNotMatch(html, /<table/i);

assert.match(css, /--layout-max-width:\s*800px/);
assert.match(css, /--font-size-base:\s*17px/);
assert.match(css, /--color-accent:\s*#0071e3/);
assert.match(css, /--radius-card:\s*12px/);
assert.match(css, /--radius-control:\s*8px/);
assert.match(css, /backdrop-filter:\s*blur\(var\(--glass-blur\)\)/);
assert.match(css, /@supports not/);
assert.match(css, /\.btn-primary/);
assert.match(css, /\.btn-secondary/);
assert.match(css, /\.input:focus/);

assert.strictEqual(pkg.scripts.start, "npx --yes serve -l 3000 .");
assert.ok(!pkg.dependencies, "UI must not add npm dependencies");

const appJs = read("app.js");
assert.match(appJs, /preventDefault/);
assert.match(appJs, /addEventListener/);
assert.match(appJs, /fetch\(/);
assert.match(appJs, /localhost:3001\/api\/search/);
assert.match(appJs, /Searching database\.\.\./);
assert.match(appJs, /Search failed\. Please check the backend connection\./);
assert.match(appJs, /Found /);
assert.match(appJs, /results\./);
assert.doesNotMatch(appJs, /innerHTML/);

assert.match(appJs, /results-panel/);
assert.match(appJs, /results-table/);
assert.match(appJs, /firstName/);
assert.match(appJs, /lastName/);
assert.match(appJs, /email/);
assert.match(appJs, /department/);
assert.match(appJs, /city/);
assert.ok(
  /textContent/.test(appJs) || /escapeHtml/.test(appJs),
  "app.js must use textContent on cells or escapeHtml helper"
);
assert.match(appJs, /renderResults/);
assert.match(appJs, /First Name/);
assert.match(appJs, /Last Name/);
assert.match(appJs, /Department/);
assert.match(appJs, /replaceChildren/);
assert.match(appJs, /renderResults\(Array\.isArray\(data\.results\)/);

assert.match(appJs, /btn-clear/);
assert.match(appJs, /resetSearchUi/);
assert.match(appJs, /STATUS\.empty/);
assert.match(appJs, /Enter a name to begin searching\./);
assert.match(appJs, /clearResultsPanel\(\)/);
assert.ok(
  /searchGeneration/.test(appJs) && /generation !== searchGeneration/.test(appJs),
  "app.js must guard against stale in-flight search responses"
);

assert.match(css, /\.results-table/);
assert.match(css, /border-collapse:\s*separate/);
assert.doesNotMatch(css, /\.results-table\s+th[^}]*border-left/i);
assert.doesNotMatch(css, /\.results-table\s+td[^}]*border-left/i);

console.log("shell-spec: all checks passed");
