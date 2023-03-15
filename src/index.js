const { config } = require('dotenv');
config();
const conn = require('./db/conn');
conn();

const express = require('express');
const cors = require('cors');

const chat = require('./router/chat');
const image = require('./router/image');

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

app.listen(port, () => {
  console.log(`API listening on port ${port}`);
});

module.exports = app;