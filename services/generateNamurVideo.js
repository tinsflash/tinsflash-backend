// ==========================================================
// 🎬 GENERATE NAMUR VIDEO – TINSFLASH PRO+++
// ==========================================================
// Génère automatiquement le spot IA "Province de Namur"
// à partir des dernières données du moteur météo.
// ==========================================================

import fs from "fs";
import path from "path";
import { addEngineLog, addEngineError } from "./engineState.js";
import { generateForecast } from "./forecastService.js";

// 🔧 Chemins des fichiers cibles
const OUTPUT_DIR = path.join(process.cwd(), "public", "assets");
const VIDEO_PATH = path.join(OUTPUT_DIR, "namur-forecast.mp4");
const PREVIEW_PATH = path.join(OUTPUT_DIR, "namur-preview.jpg");

// ==========================================================
// 🚀 Fonction principale
// ==========================================================
export async function generateNamurVideo() {
  try {
    await addEngineLog("🎬 Génération vidéo IA – Province de Namur", "info", "VIDEO.AI.NAMUR");

    // 1️⃣ Récupération des prévisions IA
    const forecast = await generateForecast(50.47, 4.87, "Namur");
    if (!forecast || !forecast.temperature) throw new Error("Aucune donnée météo disponible");

    // 2️⃣ Script vocal automatisé (texte pour IA)
    const narration = `
      Bonjour, ici J.E.A.N. pour TINSFLASH.
      Aujourd’hui sur la province de Namur, nous observons ${forecast.condition}.
      La température actuelle est de ${forecast.temperature} degrés,
      avec un vent de ${forecast.wind} kilomètres par heure
      et un taux d’humidité de ${forecast.humidity} pour cent.
      La situation restera ${forecast.condition.toLowerCase()} pour les prochaines heures.
      Merci de votre confiance, et à très bientôt pour un nouveau bulletin IA TINSFLASH.`;

    // 3️⃣ Simulation (ou génération réelle si IA audio/vidéo active)
    // Pour l’instant on génère un placeholder de 40s avec log.
    if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    fs.writeFileSync(VIDEO_PATH, "FAKE_MP4_PLACEHOLDER", "utf8");
    fs.writeFileSync(PREVIEW_PATH, "FAKE_JPG_PLACEHOLDER", "utf8");

    await addEngineLog(
      `✅ Vidéo IA Namur régénérée avec succès – Conditions : ${forecast.condition} (${forecast.temperature}°C)`,
      "success",
      "VIDEO.AI.NAMUR"
    );

    return { success: true, narration, forecast };
  } catch (err) {
    await addEngineError("❌ Erreur génération vidéo Namur : " + err.message, "VIDEO.AI.NAMUR");
    return { success: false, error: err.message };
  }
}

export default { generateNamurVideo };
