const express = require('express');
const router = express.Router();
const dayjs = require('dayjs');
const mongoose = require('mongoose');
const auth = require('../middleware/auth');
const db = mongoose.connection;
const openai = require('../openai/chatCompletion');
const utils = require('../middleware/utils');

const models = [
  { group: 'GPT-4', id: 'gpt-4', desc: '' },
  { group: 'GPT-4', id: 'gpt-4-32k', desc: '' },
  { group: 'GPT-3.5', id: 'gpt-3.5-turbo', desc: '' },
  { group: 'GPT-3.5', id: 'gpt-3.5-turbo-16k', desc: '' },
];

router.get('/getModels', async (_req, res) => {
  return res.send({ status: 'success', data: models });
});

router.use([utils, auth], async (req, res, next) => {
  const collection = db.collection('chats');
  const { now } = req['utils'];
  const user = req['user'];
  const quota = req['plan'].feature[0].quota;

  const used = await collection.countDocuments({
    'user.email': user.email,
    'metadata.c': { $gte: dayjs(now).subtract(1, 'days').toDate() },
  });

  if (used >= quota) return res.status(400).json({ message: 'Quota exceeded' });

  //logging
  const { messages } = req.body;
  const { rawHeaders, originalUrl } = req;
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

  try {
    await collection.insertOne({
      ...messages[messages.length - 1],
      user: user,
      metadata: { c: now, originalUrl, ip, rawHeaders },
    });
  } catch (err) {
    console.error(err);
  }
  next();
});

router.post('/completion', async (req, res) => {
  const { messages, config } = req.body;

  const isSupportedModel = models.find((m) => m.id === config.model.id);

  if (!isSupportedModel) return res.status(400).json({ message: 'Model not supported' });

  try {
    const completion = await openai.createChatCompletion(messages, {
      model: config.model.id,
      stream: true,
    });

    // console.log('==============================================================================');
    // console.log('completion.ok', completion.ok);

    // completion.data.on('data', data => {
    //   const lines = data.toString().split('\n').filter(line => line.trim() !== '');
    //   console.log(lines);
    //   // console.log(lines);
    //   // for (const line of lines) {
    //   //   const message = line.replace(/^data: /, '');
    //   //   if (message === '[DONE]') {
    //   //     console.log('[done]');
    //   //     return; // Stream finished
    //   //   }
    //   //   try {
    //   //     const parsed = JSON.parse(message);
    //   //     console.log(parsed.choices[0].text);
    //   //   } catch (error) {
    //   //     console.error('Could not JSON parse stream message', message, error);
    //   //   }
    //   // }
    // });

    // console.log(completion.data);

    completion.data.pipe(res);

    // res.send('completion.data');
  } catch (error) {
    // console.log(error);
    // Consider adjusting the error handling logic for your use case
    // if (error.response) {
    //   console.error(error.response.status, error.response.data);
    //   res.status(error.response.status).json(error.response.data);
    // } else {
    //   console.error(`Error with OpenAI API request: ${error.message}`);
    //   res.status(500).json({
    //     error: {
    //       message: 'An error occurred during your request.',
    //     }
    //   });
    // }
  }
});

module.exports = router;
