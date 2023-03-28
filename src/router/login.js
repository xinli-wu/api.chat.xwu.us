const express = require('express');
const router = express.Router();
const dayjs = require('dayjs');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../model/user');
const { simpleEmail } = require('../utils/email');
const disposableEmailBlocker = require('../middleware/disposableEmailBlocker');

const saltRounds = 10;

const genAccessToken = (obj, { expiresIn }) => {
  const token = jwt.sign(obj, process.env.JWT_SECRET, { expiresIn });
  return token;
};

const genHash = async (obj) => {
  const hash = await bcrypt.hash(obj, saltRounds);
  return hash;
};

const sendOTP = async ({ origin, email, otp }) => {
  // const link = `${req.protocol}://${req.get('host')}/login?email=${encodeURIComponent(email)}&otp=${encodeURIComponent(otp)}`;
  const link = `${origin}/login?email=${encodeURIComponent(email)}&otp=${encodeURIComponent(otp)}`;

  return simpleEmail({
    to: email,
    subject: '[uChat] Your OTP link',
    text: '',
    html: `
    Hi ${email},
    <br>
    <p>Please click on the following link to verify your email address:</p>
    
    <p><a href="${link}">${link}</a></p>
    `,
  });
};

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// middleware that is specific to this router
router.use(async (req, res, next) => { next(); });

router.post('/', disposableEmailBlocker, async (req, res) => {
  let { email } = req.body;

  if (!email || !emailRegex.test(email)) {
    res.status(403).send({ status: 'error', message: 'Wrong params' });
    return;
  };

  email = email.toLowerCase();

  const { otp } = req.body;
  const origin = req.get('origin');


  try {

    const user = await User.findOne({ email });

    if (!user) {
      // first time user, add to db and send opt
      const otp = await genHash(JSON.stringify({ email, ts: dayjs() }));
      const user = await User.create({ email, otp });
      await user.save();
      await sendOTP({ origin, email, otp });
      res.send({ status: 'success', message: 'Please click on the link sent to your email.' });
    } else {

      if (otp) {
        if (otp !== user.otp) res.status(401).send({ status: 'error', message: 'Wrong OTP' });
        if (user.otp === otp) {
          // Correct OTP, del OTP in db and issue token
          await user.updateOne({ $unset: { otp: 1 } });
          // const user = await User.findOne({ email });
          const token = genAccessToken({ email: user.email }, { expiresIn: '1h' });
          if (user.token !== token) user.token = token;
          await user.save();

          res.send({
            status: 'success',
            message: 'You are logged in, welcome 🙌',
            data: { user }
          });
        }
      } else {
        const otp = await genHash(JSON.stringify({ email, ts: dayjs() }));
        await user.updateOne({ otp });
        await user.save();
        await sendOTP({ origin, email, otp });
        res.send({ status: 'success', message: 'Please click on the link sent to your email.' });
      }
    }

  } catch (error) {
    console.error(error);
  }
});

module.exports = router;