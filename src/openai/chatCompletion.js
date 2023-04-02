const { Configuration, OpenAIApi } = require('openai');

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

const createChatCompletion = (messages, { model = 'gpt-3.5-turbo', stream = false }) => {

  return openai.createChatCompletion({
    model: model,
    messages: messages,
    temperature: 0.6,
    max_tokens: 1000,
    stream: stream
  }, { ...(stream && { responseType: 'stream' }) });
};

const createCompletion = (prompt, { model = 'text-curie-001' }) => {
  return openai.createCompletion({
    model: model,
    prompt: prompt
  });
};

module.exports = {
  createChatCompletion,
  createCompletion
};