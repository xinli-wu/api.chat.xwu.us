const express = require('express');
const router = express.Router();
const dayjs = require('dayjs');
const mongoose = require('mongoose');
const auth = require('../middleware/auth');
const openai = require('../openai/chatCompletion');
const { ObjectId } = require('mongoose/lib');

const db = mongoose.connection;

// middleware that is specific to this router
router.use(auth, async (req, res, next) => {

  next();

});

router.post('/conversation/add', async (req, res) => {
  const collection = db.collection('conversations');
  const user = req['user'];
  const now = dayjs().toISOString();
  const { chats } = req.body;

  const titlePrompt = chats.filter(x => x.message?.role === 'user').map(x => x.message?.content);
  try {
    const completion = await openai.createCompletion(`give a title for this: ${JSON.stringify(titlePrompt)}`, {});
    const title = completion.data.choices[0].text.replaceAll('\n', '');
    if (completion.data.choices[0].text.length > 0) {
      await collection.insertOne(
        {
          metadata: { c: now },
          user: user,
          data: {
            title,
            chats
          }
        },
      );
    }

    res.send({ status: 'success', data: { title } });
  } catch (error) {
    res.send({ status: 'error', message: error.message });
  }
});

router.get('/conversation/get/:_id', async (req, res) => {
  const collection = db.collection('conversations');
  const user = req['user'];
  const { _id } = req.params;

  try {
    const data = await collection.findOne({
      'user._id': user._id,
      _id: new mongoose.Types.ObjectId(_id)
    }, { projection: { data: 1, metadata: 1 } });

    res.send({ status: 'success', data: data });
  } catch (error) {
    res.send({ status: 'error', message: error.message });
  }
});

router.get('/conversation-hitory', async (req, res) => {
  const collection = db.collection('conversations');
  const user = req['user'];

  try {
    const data = await collection.find(
      { 'user._id': user._id },
      { projection: { data: { title: 1 }, metadata: 1 } }
    )
      .sort({ 'metadata.c': -1 })
      .toArray();

    res.send({ status: 'success', data: data });
  } catch (error) {
    res.send({ status: 'error', message: error.message });
  }
});

router.get('/openai/chat/completion-hitory', async (req, res) => {
  const collection = db.collection('chats');
  const user = req['user'];

  try {
    const data = await collection.find(
      { 'user._id': user._id },
      { projection: { content: 1, 'metadata.ts': 1, '_id': 0 } }
    )
      .sort({ 'metadata.ts': -1 })
      .toArray();

    res.send({ status: 'success', data: data });
  } catch (error) {
    res.send({ status: 'error', message: error.message });
  }
});

module.exports = router;