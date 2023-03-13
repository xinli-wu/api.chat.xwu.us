const express = require('express');
const router = express.Router();
const dayjs = require('dayjs');
const mongoose = require('mongoose');
const { Configuration, OpenAIApi } = require('openai');

const db = mongoose.connection;

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

// middleware that is specific to this router
router.use(async (req, res, next) => {
  const { messages } = req.body;
  const { rawHeaders, originalUrl } = req;
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  const collection = db.collection('chats');

  try {

    await collection.insertOne({
      ...messages[messages.length - 1],
      metadata: { ts: dayjs().toISOString(), originalUrl, ip, rawHeaders }
    });

  } finally {

    next();
  }

});

router.post('/completion', async (req, res) => {
  const { messages } = req.body;
  try {

    const completion = await openai.createChatCompletion({
      model: "gpt-3.5-turbo",
      messages: messages,
      temperature: 0.6,
      max_tokens: 1000,
      stream: true
    }, { responseType: 'stream' });

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