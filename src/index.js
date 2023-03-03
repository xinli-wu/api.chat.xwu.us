const { config } = require('dotenv');
config();

const express = require('express');
const openai = require('./router/openai');
const cors = require('cors');

const app = express();
const port = 4000;

app.use(cors({
  origin: [
    ...(process.env.NODE_ENV === 'development' ? ['http://localhost:3000'] : [])
    , 'https://chat.xwu.us'
  ]
}));

app.use(express.json());
// app.use(express.urlencoded());

app.use('/openai', openai);

app.listen(port, () => {
  console.log(`API listening on port ${port}`);
});

module.exports = app;