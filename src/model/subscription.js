const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'user' },
  subscription: { type: Object },
  history: { type: Array, default: [] },
});

module.exports = mongoose.model('subscription', subscriptionSchema);
