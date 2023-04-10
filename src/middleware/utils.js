const dayjs = require('dayjs');

const utils = async (req, res, next) => {
  const now = dayjs().toDate();
  req.utils = { now };
  return next();
};

module.exports = utils;
