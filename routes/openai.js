const OpenAI = require("openai");

const client = new OpenAI({
  apiKey: process.env.OPENAI_KEY,
});

async function generatePodcast(location) {
  const prompt = `Fais un bulletin météo clair et concis pour ${location}.`;

  const completion = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
  });

  return completion.choices[0].message.content;
}

module.exports = { generatePodcast };

