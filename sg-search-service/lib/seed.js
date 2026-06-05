const { readFileSync } = require('fs');
const { join } = require('path');
const { parse } = require('csv-parse/sync');
const User = require('../models/User');

const REQUIRED_COLUMNS = ['firstName', 'lastName', 'email', 'department', 'city'];
const CSV_PATH = join(__dirname, '..', 'users.csv');

function readAndParseCsv() {
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
  for (const col of REQUIRED_COLUMNS) {
    if (!headers.includes(col)) {
      throw new Error(
        `users.csv missing required column "${col}". Found: ${headers.join(', ')}`
      );
    }
  }

  records.forEach((row, index) => {
    for (const col of REQUIRED_COLUMNS) {
      if (!row[col]?.trim()) {
        throw new Error(
          `users.csv row ${index + 2} has empty or missing "${col}"`
        );
      }
    }
  });

  return records;
}

async function seedFromCsv() {
  const records = readAndParseCsv();

  const operations = records.map((row) => ({
    updateOne: {
      filter: { email: row.email },
      update: {
        $set: {
          firstName: row.firstName,
          lastName: row.lastName,
          email: row.email,
          department: row.department,
          city: row.city,
        },
      },
      upsert: true,
    },
  }));

  await User.bulkWrite(operations);
  return records.length;
}

module.exports = { seedFromCsv };
