const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, unique: true },
    department: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
  },
  {
    collection: 'users',
  }
);

userSchema.index({ firstName: 1, lastName: 1 });

module.exports = mongoose.model('User', userSchema);
