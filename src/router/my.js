const express = require('express');
const router = express.Router();
const dayjs = require('dayjs');
const mongoose = require('mongoose');
const auth = require('../middleware/auth');

const db = mongoose.connection;

// middleware that is specific to this router
router.use(auth, async (req, res, next) => {

  next();

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