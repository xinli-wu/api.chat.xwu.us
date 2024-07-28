import axios from 'axios';

const BLOCK_LIST_URL = [
  'https://raw.githubusercontent.com/disposable-email-domains/disposable-email-domains/master/disposable_email_blocklist.conf',
  'https://raw.githubusercontent.com/xinli-wu/api.chat.xwu.us/main/src/assets/email.block.json'
];

const disposableEmailBlocker = async (req, res, next) => {

  let { email } = req.body;
  email = email.toLowerCase();
  const remoteBlockList = await Promise.allSettled(BLOCK_LIST_URL.map(l => axios(l, { responseType: 'text' })));

  const blockList = remoteBlockList.map(x => x.value?.data?.split('\n')).flat();

  if (blockList.includes(email.split('@')[1])) {
    return res.status(403).send({
      status: 'error',
      message: "We can't send email to the email address provided.",
    });
  }

  req.email = email;

  return next();
};

export default disposableEmailBlocker;
