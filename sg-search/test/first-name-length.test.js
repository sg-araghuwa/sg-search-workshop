const fs = require("fs");
const path = require("path");
const assert = require("assert");

const root = path.join(__dirname, "..");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const appJs = fs.readFileSync(path.join(root, "app.js"), "utf8");

assert.match(html, /id="firstName"[^>]*maxlength="50"/);
assert.match(html, /id="firstName-char-hint"/);
assert.match(html, /class="char-count-hint"/);
assert.match(html, /aria-describedby="firstName-char-hint"/);
assert.match(appJs, /MAX_FIRST_NAME_LENGTH\s*=\s*50/);
assert.match(appJs, /updateFirstNameCharCount/);
assert.match(appJs, /firstNameInput\.title/);
assert.match(appJs, /FIRST_NAME_TOO_LONG_MESSAGE/);
assert.match(appJs, /characters or fewer/);

const runSearchIdx = appJs.indexOf("async function runSearch");
const lengthGuardIdx = appJs.indexOf(
  "firstName.length > MAX_FIRST_NAME_LENGTH",
  runSearchIdx
);
const fetchIdx = appJs.indexOf("fetch(", runSearchIdx);
assert.ok(lengthGuardIdx > runSearchIdx && fetchIdx > lengthGuardIdx);

console.log("first-name-length: all checks passed");
