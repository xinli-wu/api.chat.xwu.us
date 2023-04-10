const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: { type: String, unique: true },
  token: { type: String },
  metadata: { type: mongoose.Schema.Types.Mixed }
});

module.exports = mongoose.model('user', userSchema);
