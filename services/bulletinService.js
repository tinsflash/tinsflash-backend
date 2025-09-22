// services/bulletinService.js
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import Forecast from "../models/Forecast.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const bulletinPath = path.join(__dirname, "../public/data/bulletin.json");

/**
 * Génère un bulletin météo clair basé sur le dernier run
 */
export async function generateBulletin() {
  try {
    const latest = await Forecast.findOne().sort({ timestamp: -1 });

    if (!latest) {
      return { local: "❌ Pas de données disponibles", national: "❌ Pas de données disponibles" };
    }

    const { data, location } = latest;

    const bulletinLocal = `🌍 Prévisions locales (${location.lat}, ${location.lon}):
- Température : ${data.temp}°C
- Vent : ${data.wind} km/h
- Pluie : ${data.rain} mm
- Neige : ${data.snow || 0} mm
- Analyse IA : ${data.anomaly ? "⚠️ Anomalie détectée" : "✅ Conditions normales"}`;

    const bulletinNational = `🇫🇷 Bulletin national :
Les conditions globales annoncent une moyenne de ${data.temp}°C,
avec des vents de ${data.wind} km/h et ${data.rain} mm de précipitations.
Synthèse IA : ${data.anomaly || "Aucune anomalie majeure"}.`;

    const bulletin = { local: bulletinLocal, national: bulletinNational, timestamp: new Date() };

    fs.writeFileSync(bulletinPath, JSON.stringify(bulletin, null, 2), "utf-8");

    return bulletin;
  } catch (err) {
    console.error("❌ Erreur génération bulletin:", err.message);
    return { local: "Erreur génération", national: "Erreur génération" };
  }
}

/**
 * Récupère le dernier bulletin sauvegardé
 */
export function getBulletin() {
  if (fs.existsSync(bulletinPath)) {
    return JSON.parse(fs.readFileSync(bulletinPath, "utf-8"));
  }
  return { local: "Pas de bulletin", national: "Pas de bulletin" };
}

/**
 * Met à jour le bulletin (via édition admin)
 */
export function updateBulletin(newBulletin) {
  const bulletin = { ...newBulletin, timestamp: new Date() };
  fs.writeFileSync(bulletinPath, JSON.stringify(bulletin, null, 2), "utf-8");
  return bulletin;
}
