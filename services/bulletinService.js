// services/bulletinService.js
import Bulletin from "../models/Bulletin.js";
import { askJean } from "./openai.js";

const COUNTRIES = ["BE", "FR", "LU"];

/**
 * Génère un bulletin météo clair et compréhensible via IA
 */
async function generateBulletin(country, type, forecastData) {
  const prompt = `
Rédige un bulletin météo clair, précis et compréhensible comme à la télévision
pour le ${type === "local" ? "niveau local" : "niveau national"} en ${country}.
Données météo : ${JSON.stringify(forecastData)}
  `;

  const text = await askJean(prompt);

  const bulletin = new Bulletin({
    country,
    type,
    textGenerated: text
  });

  await bulletin.save();
  return bulletin;
}

/**
 * Récupère tous les bulletins du jour
 */
async function getTodayBulletins() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);

  return await Bulletin.find({ date: { $gte: start } });
}

/**
 * Met à jour un bulletin modifié par l’admin
 */
async function updateBulletin(id, newText) {
  return await Bulletin.findByIdAndUpdate(
    id,
    { textEdited: newText },
    { new: true }
  );
}

export default { generateBulletin, getTodayBulletins, updateBulletin };
