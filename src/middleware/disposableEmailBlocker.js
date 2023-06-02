const { default: axios } = require('axios');
const localBlockList = require('../assets/email.block.json');

const BLOCK_LIST_URL =
  'https://raw.githubusercontent.com/disposable-email-domains/disposable-email-domains/master/disposable_email_blocklist.conf';

const disposableEmailBlocker = async (req, res, next) => {
  let { email } = req.body;
  email = email.toLowerCase();
  const { data } =
    (await axios(BLOCK_LIST_URL, { responseType: 'text' })) || {};

  const blockList = [...data.split('\n'), ...localBlockList];

  if (blockList.includes(email.split('@')[1])) {
    return res.status(403).send({
      status: 'error',
      message: `We can't send email to the email address provided.`,
    });
  }

  req['email'] = email;

  return next();
};

module.exports = disposableEmailBlocker;
