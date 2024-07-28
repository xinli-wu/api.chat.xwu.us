import { Schema, model } from 'mongoose';

const userSchema = new Schema({
  email: { type: String, unique: true },
  token: { type: String },
  metadata: { type: Schema.Types.Mixed },
});

export default model('user', userSchema);
