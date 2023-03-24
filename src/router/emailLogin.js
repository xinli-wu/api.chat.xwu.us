const express = require('express');
const router = express.Router();
const dayjs = require('dayjs');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../model/user');
const { simpleEmail } = require('../utils/email');

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
  // const link = `${req.protocol}://${req.get('host')}/email-login?email=${encodeURIComponent(email)}&otp=${encodeURIComponent(otp)}`;
  const link = `${origin}/email-login?email=${encodeURIComponent(email)}&otp=${encodeURIComponent(otp)}`;
  console.log(link);
  await simpleEmail({ to: email, subject: 'Your OTP link', text: link });
};

// middleware that is specific to this router
router.use(async (req, res, next) => { next(); });

router.post('/', async (req, res) => {
  let { email } = req.body;
  email = email.toLowerCase();

  const { otp } = req.body;
  const origin = req.get('origin');

  if (!email) {
    res.send({ message: 'Wrong params' });
    return;
  };

  try {

    const user = await User.findOne({ email });

    if (!user) {
      // first time user, add to db and send opt
      const otp = await genHash(JSON.stringify({ email, ts: dayjs() }));
      const user = await User.create({ email, otp });
      await user.save();
      const link = `${origin}/email-login?email=${encodeURIComponent(user.email)}&otp=${encodeURIComponent(user.otp)}`;
      console.log(link);
      await sendOTP({ origin, email, otp });
      res.send({ message: 'Please click on the link sent to your email.' });
    } else {

      if (otp) {
        if (otp !== user.otp) res.status(401).send({ message: 'Wrong OTP' });
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
        res.send({ message: 'Please click on the link sent to your email.' });
      }

    }

  } catch (error) {
    console.error(error);
  }
});

module.exports = router;