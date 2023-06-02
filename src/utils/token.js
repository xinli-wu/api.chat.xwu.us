const jwt = require('jsonwebtoken');

const { JWT_ACCESS_TOKEN_SECRET, JWT_REFRESH_TOKEN_SECRET } = process.env;

const genAccessToken = (obj, { expiresIn = '10m' }) => {
  return jwt.sign(obj, JWT_ACCESS_TOKEN_SECRET, { expiresIn });
};

const genRefershToken = (obj, { expiresIn = '1d' }) => {
  return jwt.sign(obj, JWT_REFRESH_TOKEN_SECRET, { expiresIn });
};

module.exports = {
  genAccessToken,
  genRefershToken,
};
