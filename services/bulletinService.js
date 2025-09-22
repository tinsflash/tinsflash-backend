// services/bulletinService.js
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import Forecast from "../models/Forecast.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const bulletinPath = path.join(__dirname, "../public/data/bulletin.json");

// Génération automatique du bulletin météo
export async function generateBulletin() {
  try {
    const latest = await Forecast.findOne().sort({ timestamp: -1 });
    if (!latest) {
      return { local: "❌ Pas de données disponibles", national: "❌ Pas de données disponibles" };
    }

    const { data, location } = latest;

    const bulletinLocal = `📍 Prévisions locales (${location.lat}, ${location.lon})
🌡️ Température: ${data.temp}°C
💨 Vent: ${data.wind} km/h
🌧️ Pluie: ${data.rain} mm
❄️ Neige: ${data.snow || 0} mm
🔎 Analyse IA: ${data.anomaly ? "⚠️ Anomalie détectée" : "✅ Conditions normales"}`;

    const bulletinNational = `🇫🇷 Bulletin national
Les conditions globales annoncent une moyenne de ${data.temp}°C,
avec des vents de ${data.wind} km/h et ${data.rain} mm de précipitations.
Synthèse IA: ${data.anomaly ? "⚠️ Risque météo détecté" : "✅ Aucune anomalie majeure"}`;

    const bulletin = { local: bulletinLocal, national: bulletinNational, timestamp: new Date() };
    fs.writeFileSync(bulletinPath, JSON.stringify(bulletin, null, 2), "utf-8");

    return bulletin;
  } catch (err) {
    console.error("❌ Erreur génération bulletin:", err.message);
    return { local: "Erreur génération", national: "Erreur génération" };
  }
}

// Récupération du dernier bulletin
export function getBulletin() {
  if (fs.existsSync(bulletinPath)) {
    return JSON.parse(fs.readFileSync(bulletinPath, "utf-8"));
  }
  return { local: "⏳ En attente de génération", national: "⏳ En attente de génération" };
}

// Mise à jour manuelle du bulletin
export function updateBulletin(newBulletin) {
  const bulletin = { ...newBulletin, timestamp: new Date() };
  fs.writeFileSync(bulletinPath, JSON.stringify(bulletin, null, 2), "utf-8");
  return bulletin;
}

export default { generateBulletin, getBulletin, updateBulletin };
