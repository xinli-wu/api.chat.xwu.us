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
router.use(auth, async (req, res, next) => {
  const user = req['user'];
  const collection = db.collection('images');

  const now = dayjs();

  const lastImage = await collection.find({ 'user._id': user._id, 'metadata.c': { $gte: now.subtract(1, 'days').toISOString() } }).sort('metadata.c', -1).toArray();

  if (lastImage.length > 0) {
    res.send({ status: 'error', message: 'You have created an image in the last 24 hours, please try again later.' });
    return;
  }

  if (process.env.NODE_ENV !== 'production') {
    const { prompt } = req.body;
    const { rawHeaders, originalUrl } = req;
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;


    try {

      await collection.insertOne({
        prompt,
        user: user,
        metadata: { c: now, originalUrl, ip, rawHeaders }
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
      n: 1,
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