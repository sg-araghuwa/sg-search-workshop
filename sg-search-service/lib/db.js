const mongoose = require('mongoose');

async function connectDB() {
  const uri = process.env.MONGODB_URI;
  if (!uri || !uri.trim()) {
    throw new Error('MONGODB_URI is required');
  }

  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 5000,
  });
}

module.exports = { connectDB };
