const express = require('express');
const router = express.Router();
const User = require('../model/user');
const { simpleEmail } = require('../utils/email');
const disposableEmailBlocker = require('../middleware/disposableEmailBlocker');
const { genAccessToken, genRefershToken } = require('../utils/token');
const utils = require('../middleware/utils');
const jwt = require('jsonwebtoken');
const { Buffer } = require('node:buffer');

const sendOTP = async ({ origin, email, otp }) => {
  const link = `${origin}/login?email=${encodeURIComponent(
    email,
  )}&otp=${encodeURIComponent(otp)}`;

  return simpleEmail({
    to: email,
    subject: '[uChat] Your OTP link',
    text: '',
    html: `
    Hi ${email},
    <br>
    <p>Please click on the following link to verify your email address, it will expire in 5 minutes:</p>
    
    <p><a href="${link}">${link}</a></p>
    `,
  });
};

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// middleware that is specific to this router
router.use(utils, async (req, res, next) => {
  let { email } = req.body;

  if (!email || !emailRegex.test(email)) {
    return res.status(403).send({ status: 'error', message: 'Wrong params' });
  }

  email = email.toLowerCase();
  const user = await User.findOne({ email });

  req['email'] = email;
  req['user'] = user;

  next();
});

router.post('/', disposableEmailBlocker, async (req, res) => {
  let user = req['user'];
  const { now } = req['utils'];
  const email = req['email'];

  const { otp } = req.body;
  const origin = req.get('origin');

  if (!otp) {
    const otp = genAccessToken({ email }, { expiresIn: '5m' });
    const encodedOTP = Buffer.from(otp).toString('base64');

    if (!user) {
      // first time user, add to db and send opt
      user = await User.create({ email, metadata: { c: now } });
    } else {
      user.metadata = { ...user.metadata, u: now };
      await user.save();
    }

    await user.save();
    await sendOTP({ origin, email, otp: encodedOTP });

    return res.send({
      status: 'success',
      message: 'Please click on the link sent to your email.',
    });
  }

  try {
    const decodedOTP = Buffer.from(otp, 'base64').toString('ascii');
    jwt.verify(decodedOTP, process.env.JWT_ACCESS_TOKEN_SECRET);
  } catch (error) {
    return res.status(406).send({
      status: 'error',
      message: 'Wrong or Expired OTP, please request a new one.',
    });
  }

  // Correct OTP, del OTP in db and issue token
  // await user.updateOne({ $unset: { otp: 1 } });
  user.metadata = { ...user.metadata, u: now };
  user.token = genAccessToken({ _id: user._id, email: user.email }, {});
  await user.save();

  const refreshToken = genRefershToken(
    { _id: user._id, email: user.email },
    {},
  );

  // res.header('Access-Control-Allow-Credentials', 'true');

  res.cookie('jwt', refreshToken, {
    maxAge: 24 * 60 * 60 * 1000, // 1 day
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    domain: process.env.NODE_ENV === 'production' ? 'chat.xwu.us' : 'localhost',
    path: '/',
  });

  res.send({
    status: 'success',
    message: 'You are logged in, welcome 🙌',
    data: { user },
  });
});

module.exports = router;
