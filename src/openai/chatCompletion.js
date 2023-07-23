const { Configuration, OpenAIApi } = require('openai');

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

const createChatCompletion = (messages, { model, stream = false }) =>
  openai.createChatCompletion(
    {
      model,
      messages,
      temperature: 0.6,
      max_tokens: 1000,
      stream,
    },
    { ...(stream && { responseType: 'stream' }) }
  );

const createCompletion = (prompt, { model = 'text-curie-001' }) =>
  openai.createCompletion({
    model,
    prompt,
  });

module.exports = {
  createChatCompletion,
  createCompletion,
};
