// -------------------------
// 🎙️ podcastService.js
// Génération de podcasts météo en voix grave FR
// -------------------------
import fs from "fs";
import path from "path";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Dossier temporaire pour stocker les fichiers audio
const PODCAST_DIR = path.resolve("public/podcasts");
if (!fs.existsSync(PODCAST_DIR)) fs.mkdirSync(PODCAST_DIR, { recursive: true });

export async function generatePodcast(type = "daily", text = null) {
  try {
    // Si pas de texte fourni → fallback
    if (!text) {
      text = type === "daily"
        ? "Voici le bulletin météo du jour par TINSFLASH."
        : "Voici le bulletin météo de la semaine par TINSFLASH.";
    }

    // Nom de fichier unique
    const filename = `podcast_${type}_${Date.now()}.mp3`;
    const filePath = path.join(PODCAST_DIR, filename);

    // Appel API OpenAI TTS → voix grave, sérieuse
    const response = await openai.audio.speech.create({
      model: "gpt-4o-mini-tts",
      voice: "alloy", // ⚠️ adapter si tu veux une voix spécifique FR
      input: `Bulletin météo TINSFLASH. ${text}`,
      format: "mp3"
    });

    // Sauvegarde du fichier audio
    const buffer = Buffer.from(await response.arrayBuffer());
    fs.writeFileSync(filePath, buffer);

    return {
      title: `Podcast météo (${type})`,
      text,
      audioUrl: `/podcasts/${filename}`
    };
  } catch (err) {
    console.error("Erreur podcastService:", err);
    return { error: "Impossible de générer le podcast" };
  }
}
