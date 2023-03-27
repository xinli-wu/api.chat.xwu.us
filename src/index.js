const { config } = require('dotenv');
config();
const conn = require('./db/conn');
conn();

const express = require('express');
const cors = require('cors');

const chat = require('./router/chat');
const image = require('./router/image');
const login = require('./router/login');
const me = require('./router/me');
const stripe = require('./router/stripe');

const app = express();
const port = 4000;

app.use(cors({
  origin: [
    ...(process.env.NODE_ENV === 'development' ? ['http://localhost:3000'] : [])
    , 'https://chat.xwu.us'
  ]
}));

app.use(express.json());

app.use('/openai/chat', chat);
//  disable image creation, too expensive :(
// app.use('/openai/image', image);
app.use('/login', login);
app.use('/me', me);
app.use('/stripe', stripe);

app.listen(port, () => {
  console.log(`API listening on port ${port}`);
});

module.exports = app;