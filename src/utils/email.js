const nodemailer = require("nodemailer");

const { EMAIL_HOST, EMAIL_USER, EMAIL_PASS } = process.env;

const simpleEmail = async ({ to, subject, text, html = undefined }) => {
  if (!EMAIL_HOST || !EMAIL_USER || !EMAIL_PASS) {
    return Promise.reject(new Error('Missing EMAIL_HOST, EMAIL_USER, EMAIL'));
  }

  const transporter = nodemailer.createTransport({
    host: EMAIL_HOST,
    port: 465,
    secure: true, // true for 465, false for other ports
    auth: {
      user: EMAIL_USER,
      pass: EMAIL_PASS,
    },
  });

  const info = await transporter.sendMail({
    from: '"uChat" <chat.noreply@xwu.us>',
    to,
    subject,
    text,
    html
  });

  console.log("Message sent: %s", info.messageId);

};

module.exports = { simpleEmail };