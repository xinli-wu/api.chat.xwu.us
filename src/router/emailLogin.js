const express = require('express');
const router = express.Router();
const dayjs = require('dayjs');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../model/user');

const saltRounds = 10;

const sendOTP = async (collection, email) => {

};

const genAccessToken = (obj, { expiresIn }) => {
  const token = jwt.sign(obj, process.env.JWT_SECRET, { expiresIn });
  return token;
};

const genHash = async (obj) => {
  const hash = await bcrypt.hash(obj, saltRounds);
  return hash;
};

// middleware that is specific to this router
router.use(async (req, res, next) => { next(); });

router.post('/', async (req, res) => {
  const { email, otp } = req.body;
  const origin = req.get('origin');

  if (!email) {
    res.send({ message: 'Wrong params' });
    return;
  };

  try {

    const user = await User.findOne({ email });

    if (!user) {
      // first time user, add to db and send opt
      const hash = await genHash(JSON.stringify({ email, ts: dayjs() }));
      const user = await User.create({ email: email.toLowerCase(), otp: hash });
      await user.save();
      const link = `${origin}/email-login?email=${encodeURIComponent(user.email)}&otp=${encodeURIComponent(user.otp)}`;
      console.log(link);
      res.send({ message: 'Please click on the link sent to your email.' });
    } else {

      if (user.otp !== otp) res.send({ message: 'Wrong OTP' });

      if (!user.otp || user.otp === otp) {
        // Correct OTP, del OTP in db and issue token
        // await collection.updateOne({ email }, { $unset: { otp: 1 } });
        // const user = await collection.findOne({ email });
        const token = genAccessToken({ email: user.email }, { expiresIn: '1h' });
        if (user.token !== token) user.token = token;
        await user.save();

        res.send({ token: user.token });
      }
    }

  } catch (error) {
    console.error(error);
  }
});

module.exports = router;