const OpenAI = require("openai");
const fs = require("fs");
const path = require("path");

const client = new OpenAI({ apiKey: process.env.OPENAI_KEY });

async function generatePodcast(forecast, level = "free") {
  try {
    let details = "Prévisions nationales simplifiées.";
    if (level === "premium") details = "Prévisions détaillées avec tendances.";
    if (level === "pro") details = "Prévisions locales et adaptées aux activités.";
    if (level === "proplus") details = "Prévisions scientifiques hyper précises.";

    const text = `Podcast ${level} - ${details} 
      ${forecast.slice(0, 5).map((f) => `${f.temp}°C, vent ${f.wind}km/h`).join(". ")}`;

    const mp3 = await client.audio.speech.create({
      model: "gpt-4o-mini-tts",
      voice: "alloy",
      input: text,
    });

    const filePath = path.join(__dirname, `../public/podcast-${level}.mp3`);
    const buffer = Buffer.from(await mp3.arrayBuffer());
    fs.writeFileSync(filePath, buffer);

    return `/podcast-${level}.mp3`;
  } catch (err) {
    console.error("Podcast error:", err);
    return null;
  }
}

module.exports = { generatePodcast };

