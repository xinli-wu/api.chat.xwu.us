const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const createChatCompletion = ({ model, messages, stream = true }) =>
  openai.chat.completions.create({ model, messages, stream });

const createCompletion = (prompt, { model = 'text-curie-001' }) =>
  openai.createCompletion({
    model,
    prompt,
  });

module.exports = {
  createChatCompletion,
  createCompletion,
  openai,
};
