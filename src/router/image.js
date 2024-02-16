const express = require('express');
const dayjs = require('dayjs');
const mongoose = require('mongoose');
const { openai } = require('../openai/image');
const auth = require('../middleware/auth');
const utils = require('../middleware/utils');

const router = express.Router();
const db = mongoose.connection;

// middleware that is specific to this router
router.use([utils, auth], async (req, res, next) => {
  const collection = db.collection('create-image-log');
  const { user } = req;
  const { quota } = req.plan.feature[1];
  const { now } = req.utils;

  const used = await collection.countDocuments({
    'user._id': user._id,
    'metadata.c': { $gte: dayjs(now).subtract(1, 'days').toDate() },
  });

  if (used >= quota) return res.status(400).json({ message: 'Quota exceeded' });

  // logging
  const { prompt } = req.body;
  const { rawHeaders, originalUrl } = req;
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

  try {
    await collection.insertOne({
      prompt,
      user,
      metadata: {
        c: now,
        originalUrl,
        ip,
        rawHeaders,
      },
    });
  } catch (err) {
    console.error(err);
  }

  return next();
});

const models = [
  { group: 'OpenAI', id: 'dall-e-3', desc: '' },
  { group: 'OpenAI', id: 'dall-e-2', desc: '' },
];

router.get('/models', async (_req, res) => res.send({ status: 'success', data: models }));

router.post('/create', auth, async (req, res) => {
  const { prompt, config } = req.body;
  const isSupportedModel = models.find((m) => m.id === config.model.id);

  if (!isSupportedModel) return res.status(400).json({ message: 'Model not supported' });

  try {
    const response = await openai.images.generate({
      model: config.model.id,
      prompt,
      n: 1,
      response_format: 'b64_json',
    });

    res.send({ status: 'success', data: response });
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
        },
      });
    }
  }
  return res.end();
});

module.exports = router;
