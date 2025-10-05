// PATH: services/wetter3Bridge.js
import axios from "axios";
import * as cheerio from "cheerio";
import { addEngineLog, addEngineError } from "./engineState.js";

/**
 * 🌧️ Récupération données Wetter3 (modèle GFS Europe)
 * Retourne grille simplifiée { lat, lon, precipitation }
 */
export async function getWetter3GFS(zone = "Europe") {
  try {
    await addEngineLog("🌦️ Wetter3Bridge – récupération données GFS...");

    // Exemple d’URL GFS Europe
    const url = "https://www.wetter3.de/animation.html?model=gfs&map=Europe&parameter=RR&zeit=0";
    const { data } = await axios.get(url, { timeout: 15000 });

    // Parse simple du HTML pour extraire les données visibles (lignes <script> avec valeurs)
    const $ = cheerio.load(data);
    const scriptText = $('script')
      .map((_, el) => $(el).html())
      .get()
      .find((txt) => txt && txt.includes("RRdata"));

    const result = [];
    if (scriptText) {
      const regex = /\[(\d+\.\d+),(\d+\.\d+),(\d+\.\d+)\]/g;
      let match;
      while ((match = regex.exec(scriptText)) !== null) {
        result.push({
          lat: parseFloat(match[1]),
          lon: parseFloat(match[2]),
          value: parseFloat(match[3]),
        });
      }
    }

    await addEngineLog(`✅ Wetter3Bridge OK (${result.length} points)`);
    return result;
  } catch (err) {
    await addEngineError("❌ Wetter3Bridge erreur: " + err.message);
    return [];
  }
}

export default { getWetter3GFS };
