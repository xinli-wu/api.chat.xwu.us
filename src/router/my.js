import { Router } from 'express';
import mongoose from 'mongoose';
import auth from '../middleware/auth.js';
import utils from '../middleware/utils.js';
import openai from '../openai/openai.js';

const router = Router();
const db = mongoose.connection;

// middleware that is specific to this router
router.use([utils, auth], async (req, res, next) => {
  next();
});

router.get('/chat/:_id', async (req, res) => {
  const collection = db.collection('conversations');
  const { user, params } = req;
  const { _id } = params;

  try {
    const data = await collection.findOne(
      {
        'user._id': user._id,
        '_id': new mongoose.Types.ObjectId(_id),
        'metadata.d': { $exists: false },
      },
      { projection: { data: 1, metadata: 1 } }
    );

    if (!data) throw new Error(`${_id} not found`);

    return res.send({ status: 'success', data });
  } catch (error) {
    return res.send({ status: 'error', message: error.message });
  }
});

router.delete('/chat/:_id', async (req, res) => {
  const collection = db.collection('conversations');
  const { user, utils } = req;
  const { now } = utils;
  const { _id } = req.params;

  try {
    const data = await collection.updateOne(
      {
        'user._id': user._id,
        '_id': new mongoose.Types.ObjectId(_id),
      },
      { $set: { 'metadata.d': now } }
    );

    return res.send({ status: 'success', data });
  } catch (error) {
    console.log(error);
    return res.send({ status: 'error', message: error.message });
  }
});

router.get('/chat', async (req, res) => {
  const collection = db.collection('conversations');
  const { user } = req;

  try {
    const data = await collection
      .find(
        { 'user._id': user._id, 'metadata.d': { $exists: false } },
        { projection: { data: { title: 1 }, metadata: 1 } }
      )
      .sort({ 'metadata.c': -1 })
      .toArray();

    return res.send({ status: 'success', data });
  } catch (error) {
    return res.send({ status: 'error', message: error.message });
  }
});

router.post('/chat/add', async (req, res) => {
  const { chats } = req.body;
  const collection = db.collection('conversations');
  const { user, utils, plan } = req;
  const { quota } = plan.feature[2];
  const { now } = utils;

  const used = await collection.countDocuments({ 'user._id': user._id, 'metadata.d': { $exists: false } });

  if (used >= quota) return res.status(400).json({ message: 'Quota exceeded' });

  const titlePrompt = chats.filter((x) => x.message?.role === 'user').map((x) => x.message?.content);

  try {
    const completion = await openai.chat.completions.create({
      messages: [
        {
          role: 'user',
          content: `give a title for this: ${JSON.stringify(titlePrompt)}`,
        },
      ],
      model: 'gpt-3.5-turbo',
    });
    const title = completion.choices[0].message.content?.replace(/\n/g, '') || now.toISOString();

    await collection.insertOne({
      metadata: { c: now },
      user,
      data: { title, chats },
    });

    return res.send({ status: 'success', data: { title } });
  } catch (error) {
    return res.send({ status: 'error', message: error.message });
  }
});

router.get('/image/:_id', async (req, res) => {
  const collection = db.collection('images');
  const { user, params } = req;
  const { _id } = params;

  try {
    const data = await collection.findOne(
      {
        'user._id': user._id,
        '_id': new mongoose.Types.ObjectId(_id),
      },
      { projection: { data: 1, metadata: 1 } }
    );

    res.send({ status: 'success', data });
  } catch (error) {
    res.send({ status: 'error', message: error.message });
  }
});

router.get('/image', async (req, res) => {
  const collection = db.collection('images');
  const { user } = req;

  try {
    const data = await collection
      .find({ 'user._id': user._id }, { projection: { data: { title: 1 }, metadata: 1 } })
      .sort({ 'metadata.c': -1 })
      .toArray();

    res.send({ status: 'success', data });
  } catch (error) {
    res.send({ status: 'error', message: error.message });
  }
});

router.post('/image/add', async (req, res) => {
  const collection = db.collection('images');
  const { user, utils } = req;
  const { now } = utils;
  const { chats } = req.body;

  const { quota } = req.plan.feature[2];

  const used = await collection.countDocuments({ 'user._id': user._id });

  if (used >= quota) return res.status(400).json({ message: 'Quota exceeded' });

  try {
    const title = chats[0]?.message?.content || now.toISOString();

    await collection.insertOne({
      metadata: { c: now },
      user,
      data: { title, chats },
    });

    return res.send({ status: 'success', data: { title } });
  } catch (error) {
    return res.send({ status: 'error', message: error.message });
  }
});

router.get('/openai/chat/completion-hitory', async (req, res) => {
  const collection = db.collection('chats');
  const { user } = req;

  try {
    const data = await collection
      .find({ 'user._id': user._id }, { projection: { 'content': 1, 'metadata.c': 1, '_id': 0 } })
      .sort({ 'metadata.c': -1 })
      .toArray();

    return res.send({ status: 'success', data });
  } catch (error) {
    return res.send({ status: 'error', message: error.message });
  }
});

export default router;
