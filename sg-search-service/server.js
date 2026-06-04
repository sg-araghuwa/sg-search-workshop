const express = require('express');
const { readFileSync } = require('fs');
const { join } = require('path');
const { parse } = require('csv-parse/sync');

const REQUIRED = ['firstName', 'lastName', 'email', 'department', 'city'];
const CSV_PATH = join(__dirname, 'users.csv');

function loadUsers() {
  let raw;
  try {
    raw = readFileSync(CSV_PATH, 'utf8');
  } catch (err) {
    throw new Error(`users.csv not found at ${CSV_PATH}: ${err.message}`);
  }

  let records;
  try {
    records = parse(raw, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      relax_column_count: false,
    });
  } catch (err) {
    throw new Error(`users.csv parse error: ${err.message}`);
  }

  if (records.length === 0) {
    throw new Error('users.csv has no data rows (header only or empty file)');
  }

  const headers = Object.keys(records[0]);
  for (const col of REQUIRED) {
    if (!headers.includes(col)) {
      throw new Error(
        `users.csv missing required column "${col}". Found: ${headers.join(', ')}`
      );
    }
  }

  return records;
}

let users = [];

try {
  users = loadUsers();
  console.log(`Loaded ${users.length} users from users.csv`);
} catch (err) {
  console.error(`Startup failed: ${err.message}`);
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 3001;

app.get('/', (req, res) => {
  res.type('text').send('sg-search-service is running. API routes coming in later stories.');
});

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`sg-search-service listening on http://localhost:${PORT}`);
});
