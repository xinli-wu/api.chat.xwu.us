import { Schema, model } from 'mongoose';

const subscriptionSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'user' },
  subscription: { type: Object },
  history: { type: Array, default: [] },
});

export default model('subscription', subscriptionSchema);
