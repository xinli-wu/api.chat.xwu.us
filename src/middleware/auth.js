const jwt = require('jsonwebtoken');
const User = require('../model/user');
const Subscription = require('../model/subscription');
const { plans, planConfig } = require('../router/stripe/plans');

const config = process.env;

const auth = async (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];

  if (!token) {
    return res.status(403).send('A token is required for authentication');
  }

  try {
    const decoded = jwt.verify(token, config.JWT_ACCESS_TOKEN_SECRET);

    const email = decoded?.email;
    const user = await User.findOne({ email });
    const subscription = await Subscription.findOne({ user });

    req.user = user;
    req.subscription = subscription;
    req.plan =
      planConfig.find(
        (x) => x.name === subscription?.subscription?.displayName,
      ) || planConfig[0];
  } catch (err) {
    return res.status(401).send({ status: 'error', message: 'Invalid Token' });
  }
  return next();
};

module.exports = auth;
