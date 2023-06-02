const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { genAccessToken } = require('../utils/token');
const jwt = require('jsonwebtoken');
const User = require('../model/user');
const Subscription = require('../model/subscription');

const { JWT_REFRESH_TOKEN_SECRET } = process.env;

router.use(async (req, res, next) => {
  next();
});

router.get('/', auth, async (req, res) => {
  const user = req['user'];

  if (user) {
    res.status(200).send({
      status: 'success',
      message: 'You are logged in, welcome 🙌',
      data: { user },
    });
  } else {
    //no such user
    res.status(401).send({
      status: 'error',
      message: 'You are not logged in 😢',
    });
  }
});

router.post('/refresh', async (req, res) => {
  const { jwt: refreshToken } = req.cookies || {};

  if (!refreshToken)
    return res.status(406).json({ status: 'error', message: 'Unauthorized' });

  // Verifying refresh token
  jwt.verify(refreshToken, JWT_REFRESH_TOKEN_SECRET, async (err, decoded) => {
    if (err) {
      // Wrong Refesh Token
      return res.status(406).json({ status: 'error', message: 'Unauthorized' });
    } else {
      // Correct token we send a new access token
      const user = await User.findOne({ email: decoded.email });
      if (!user)
        return res
          .status(406)
          .json({ status: 'error', message: 'Unauthorized' });

      const subscription = await Subscription.findOne({ user });

      const token = genAccessToken({ email: user?.email }, {});
      if (user.token !== token) user.token = token;
      await user.save();

      delete subscription?.subscription?.session;
      return res.send({
        status: 'success',
        message: 'You are logged in, welcome 🙌',
        data: {
          user: {
            ...user.toObject(),
            ...(subscription && { subscription: subscription?.subscription }),
          },
        },
      });
    }
  });
});

router.post('/logout', async (req, res) => {
  res.cookie('jwt', 'none', {
    expires: new Date(Date.now() + 5 * 1000),
    httpOnly: true,
  });

  res
    .status(200)
    .json({ status: 'success', message: 'User logged out successfully' });
});

module.exports = router;
