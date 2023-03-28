const jwt = require('jsonwebtoken');

const genAccessToken = (obj, { expiresIn = '10m' }) => {
  const token = jwt.sign(obj, process.env.JWT_ACCESS_TOKEN_SECRET, { expiresIn });
  return token;
};

const genRefershToken = (obj, { expiresIn = '1d' }) => {
  const token = jwt.sign(obj, process.env.JWT_REFRESH_TOKEN_SECRET, { expiresIn });
  return token;
};

module.exports = {
  genAccessToken,
  genRefershToken
};