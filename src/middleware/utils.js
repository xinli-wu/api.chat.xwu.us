import dayjs from 'dayjs';

export const utils = async (req, res, next) => {
  const now = dayjs().toDate();
  req.utils = { now };
  return next();
};

export default utils;
