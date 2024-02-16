const express = require('express');
const dayjs = require('dayjs');
const mongoose = require('mongoose');
const auth = require('../middleware/auth');
const { openai } = require('../openai/chat');
const utils = require('../middleware/utils');

const router = express.Router();

const db = mongoose.connection;
const models = [
  // { group: 'GPT-4', id: 'gpt-4-32k', desc: '' },
  { group: 'OpenAI', id: 'gpt-3.5-turbo', desc: '' },
  { group: 'OpenAI', id: 'gpt-3.5-turbo-0613', desc: '' },
  { group: 'OpenAI', id: 'gpt-4', desc: '' },
  // { group: 'GPT-3.5', id: 'gpt-3.5-turbo-16k', desc: '' },
];

router.get('/models', async (_req, res) => res.send({ status: 'success', data: models }));

router.use([utils, auth], async (req, res, next) => {
  const collection = db.collection('chats');
  const { now } = req.utils;
  const { user } = req;
  const { quota } = req.plan.feature[0];

  const used = await collection.countDocuments({
    'user.email': user.email,
    'metadata.c': { $gte: dayjs(now).subtract(1, 'days').toDate() },
  });

  if (used >= quota) return res.status(400).json({ message: 'Quota exceeded' });

  // logging
  const { messages } = req.body;
  const { rawHeaders, originalUrl } = req;
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

  try {
    await collection.insertOne({
      ...messages[messages.length - 1],
      user,
      metadata: { c: now, originalUrl, ip, rawHeaders },
    });
  } catch (err) {
    console.error(err);
  }
  return next();
});

router.post('/completion', async (req, res) => {
  const { messages, config } = req.body;

  const isSupportedModel = models.find((m) => m.id === config.model.id);

  if (!isSupportedModel) return res.status(400).json({ message: 'Model not supported' });

  try {
    const stream = await openai.chat.completions.create({
      messages,
      model: config.model.id,
      stream: true,
    });

    for await (const chunk of stream) {
      res.write(`${JSON.stringify(chunk)}\n`);
    }
  } catch (error) {
    console.log(error);
    // Consider adjusting the error handling logic for your use case
    if (error.response) {
      console.error(error.response.status, error.response.data);
      return res.status(error.response.status).json(error.response.data);
    }
    console.error(`Error with OpenAI API request: ${error.message}`);
    return res.status(500).json({
      error: {
        message: 'An error occurred during your request.',
      },
    });
  }
  return res.end();
});

module.exports = router;
