require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { connectDB } = require('./lib/db');
const { seedFromCsv } = require('./lib/seed');
const User = require('./models/User');
const requireAuth = require('./middleware/requireAuth');

const MAX_NAME_LENGTH = 50;

const app = express();
app.use(
  cors({
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: false,
  })
);

function resolvePort() {
  if (process.env.PORT === undefined || process.env.PORT === '') {
    return 3001;
  }

  const port = Number(process.env.PORT);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error(`Invalid PORT: ${process.env.PORT}`);
  }

  return port;
}

function queryValue(value) {
  if (value === undefined || value === null) return null;
  const trimmed = String(value).trim();
  return trimmed.length > 0 ? trimmed : null;
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function buildSearchFilter(fn, ln) {
  const filter = {};
  if (fn !== null) {
    filter.firstName = { $regex: `^${escapeRegex(fn)}$`, $options: 'i' };
  }
  if (ln !== null) {
    filter.lastName = { $regex: `^${escapeRegex(ln)}$`, $options: 'i' };
  }
  return filter;
}

app.get('/', (req, res) => {
  res.type('text').send('sg-search-service is running.');
});

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.get('/api/search', requireAuth, async (req, res) => {
  const fn = queryValue(req.query.firstName);
  const ln = queryValue(req.query.lastName);

  if (fn !== null && fn.length > MAX_NAME_LENGTH) {
    return res.status(400).json({
      error: `firstName must not exceed ${MAX_NAME_LENGTH} characters`,
    });
  }

  if (ln !== null && ln.length > MAX_NAME_LENGTH) {
    return res.status(400).json({
      error: `lastName must not exceed ${MAX_NAME_LENGTH} characters`,
    });
  }
  if (fn === null && ln === null) {
    return res.status(400).json({
      error: 'At least one of firstName or lastName is required',
    });
  }

  try {
    const filter = buildSearchFilter(fn, ln);
    const results = await User.find(filter)
      .select('firstName lastName email department city -_id')
      .lean();
    res.json({ count: results.length, results });
  } catch (err) {
    console.error('Search error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

async function main() {
  const uri = process.env.MONGODB_URI?.trim();
  if (!uri) {
    console.error('Startup failed: MONGODB_URI is required');
    process.exit(1);
  }

  await connectDB();

  try {
    await User.syncIndexes();
  } catch (err) {
    console.warn('Index sync warning:', err.message);
  }

  await seedFromCsv();

  const count = await User.countDocuments();
  console.log(`Connected to MongoDB — ${count} users in users collection`);

  const port = resolvePort();
  const server = app.listen(port, () => {
    console.log(`sg-search-service listening on http://localhost:${port}`);
  });

  server.on('error', (err) => {
    console.error('Startup failed:', err.message);
    process.exit(1);
  });
}

main().catch((err) => {
  console.error('Startup failed:', err.message);
  process.exit(1);
});
