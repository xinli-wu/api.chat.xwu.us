const OpenAI = require('openai');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const createImage = ({ prompt, model = 'dall-e-2', size = '256x256', format }) =>
  openai.createImage({
    model: 'dall-e-3',
    prompt: 'a white siamese cat',
    n: 1,
    size: '1024x1024',
    response_format: 'b64_json',
  });

module.exports = {
  createImage,
  openai,
};
