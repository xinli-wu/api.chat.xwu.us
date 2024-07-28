import cookieParser from 'cookie-parser';
import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import conn from './db/conn.js';
import chat from './router/chat.js';
import image from './router/image.js';
import login from './router/login.js';
import me from './router/me.js';
import my from './router/my.js';

dotenv.config();
conn();

const app = express();
const port = 4000;

app.use(express.json());
// app.use(express.urlencoded());
app.use(
  cors({
    origin: [...(process.env.NODE_ENV === 'development' ? ['http://localhost:3000'] : []), 'https://chat.xwu.us'],
    credentials: true,
  })
);

// app.use(json({ limit: '1mb' }));
app.use(cookieParser());

app.use('/openai/chat', chat);
//  disable image creation, too expensive :(
app.use('/openai/image', image);
app.use('/login', login);
app.use('/me', me);
app.use('/my', my);
// // app.use('/stripe', stripe);

app.listen(port, () => {
  console.log(`API listening on port ${port}`);
});

export default app;
