import fs from "fs";
import OpenAI from "openai";
import dotenv from "dotenv";

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_KEY,
});

const text = `Bienvenue sur TINSFLASH 🌍, la météo du futur.
Ici, vous accédez aux prévisions les plus fiables au monde :
locales, nationales et mondiales, vérifiées par intelligence artificielle
et avec la participation d'experts météorologues de grande renommée.
Nos abonnements Premium, Pro et Pro+ ouvrent l’accès à des outils avancés,
du cockpit météo façon NASA, et des alertes exclusives avant tout le monde.
Rejoignez la révolution météo, et laissez TINSFLASH éclairer votre ciel.`;

async function generateAudio() {
  try {
    const mp3 = await openai.audio.speech.create({
      model: "gpt-4o-mini-tts",
      voice: "alloy",  // voix masculine grave et posée
      input: text,
    });

    const buffer = Buffer.from(await mp3.arrayBuffer());
    const outputPath = "./public/audio/intro-jean.mp3";

    fs.mkdirSync("./public/audio", { recursive: true });
    fs.writeFileSync(outputPath, buffer);

    console.log("✅ intro-jean.mp3 généré :", outputPath);
  } catch (err) {
    console.error("❌ Erreur génération audio :", err);
  }
}

generateAudio();
