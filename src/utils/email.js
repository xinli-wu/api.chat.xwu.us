import { createTransport } from 'nodemailer';

const { EMAIL_HOST, EMAIL_USER, EMAIL_PASS } = process.env;

export const simpleEmail = async ({ to, subject, text, html = undefined }) => {
  if (!EMAIL_HOST || !EMAIL_USER || !EMAIL_PASS) {
    return Promise.reject(new Error('Missing EMAIL_HOST, EMAIL_USER, EMAIL'));
  }

  const transporter = createTransport({
    host: EMAIL_HOST,
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: EMAIL_USER,
      pass: EMAIL_PASS,
    },
  });

  try {
    const info = await transporter.sendMail({
      from: '"uChat" <noreply.chat@xwu.us>',
      to,
      subject,
      text,
      html,
    });

    console.log('Message sent: %s', info.messageId);
    return Promise.resolve(info);
  } catch (error) {
    return Promise.reject(error);
  }
};
