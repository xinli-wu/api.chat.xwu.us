import dotenv from 'dotenv';
import mongoose from 'mongoose';
dotenv.config();

const { MONGO_HOST, MONGO_PORT, MONGO_DB, MONGO_USER, MONGO_PASS } = process.env;

const db = mongoose.connection;

const conn = () => {
  mongoose.connect(`mongodb://${MONGO_HOST}:${MONGO_PORT}/${MONGO_DB}`, {
    user: MONGO_USER,
    pass: MONGO_PASS,
  });
  db.on('error', console.error.bind(console, 'connection error: '));
  db.once('open', () => {
    console.log(`Connected to MongoDB @ ${MONGO_HOST}:${MONGO_PORT} ...`);
  });
};

export default conn;
