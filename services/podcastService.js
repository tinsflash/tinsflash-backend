// -------------------------
// 🌍 podcastService.js
// Génération de prévisions audio par IA
// -------------------------

import fetch from "node-fetch";
import fs from "fs";
import path from "path";

export async function generatePodcast(type = "free") {
  let prompt = "";

  switch (type) {
    case "free":
      prompt = "Prévision météo simple et concise en français.";
      break;
    case "premium":
      prompt = "Prévision météo détaillée avec températures, pluie, vent.";
      break;
    case "pro":
      prompt = "Prévision météo locale adaptée aux agriculteurs et aux pros.";
      break;
    case "proplus":
      prompt = "Prévision météo scientifique ultra précise avec tendances.";
      break;
    default:
      prompt = "Prévision météo générique.";
  }

  try {
    // Génération du texte météo avec GPT
    const reply = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
      }),
    });

    const data = await reply.json();
    const forecastText = data.choices?.[0]?.message?.content || "Prévision indisponible";

    // Génération audio (TTS)
    const tts = await fetch("https://api.openai.com/v1/audio/speech", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini-tts",
        voice: "alloy",
        input: forecastText,
      }),
    });

    const buffer = Buffer.from(await tts.arrayBuffer());
    const filePath = path.join(process.cwd(), `public/podcast-${type}.mp3`);
    fs.writeFileSync(filePath, buffer);

    return {
      type,
      text: forecastText,
      audioUrl: `/podcast-${type}.mp3`,
    };
  } catch (err) {
    throw new Error("Erreur génération podcast : " + err.message);
  }
}
