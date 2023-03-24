const express = require('express');
const router = express.Router();
const dayjs = require('dayjs');
const mongoose = require('mongoose');
const { Configuration, OpenAIApi } = require('openai');
const auth = require('../middleware/auth');

const db = mongoose.connection;

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

// middleware that is specific to this router
router.use(async (req, res, next) => {
  if (process.env.NODE_ENV === 'production') {
    const { prompt } = req.body;
    const { rawHeaders, originalUrl } = req;
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const collection = db.collection('chats');

    try {

      await collection.insertOne({
        prompt,
        metadata: { ts: dayjs().toISOString(), originalUrl, ip, rawHeaders }
      });

    } catch (err) {
      console.error(err);
    }
  }

  next();

});

router.post('/create', auth, async (req, res) => {
  const { prompt } = req.body;
  try {

    const response = await openai.createImage({
      prompt: prompt,
      n: 4,
      size: '256x256',
      response_format: 'b64_json'
    });

    res.send(response.data);
  } catch (error) {
    console.log(error);
    // Consider adjusting the error handling logic for your use case
    if (error.response) {
      console.error(error.response.status, error.response.data);
      res.status(error.response.status).json(error.response.data);
    } else {
      console.error(`Error with OpenAI API request: ${error.message}`);
      res.status(500).json({
        error: {
          message: 'An error occurred during your request.',
        }
      });
    }
  }
});

module.exports = router;