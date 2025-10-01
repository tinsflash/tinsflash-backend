// services/icon.js
// 🌍 ICON : DWD officiel + fallback Meteomatics

import fetch from "node-fetch";
import { fetchMeteomatics } from "../services/meteomatics.js";

export default async function icon(lat, lon) {
  // === Étape 1 : tentative ICON officiel (DWD) ===
  try {
    // ⚠️ Le DWD publie des GRIB2 → pour l’instant on tente accès JSON si dispo
    // Exemple structure (à adapter si DWD ne fournit pas JSON brut pour Render)
    const url = `https://opendata.dwd.de/weather/nwp/icon-eu/json/${Math.floor(lat)},${Math.floor(lon)}.json`;

    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();

      return {
        source: "ICON (DWD OpenData)",
        temperature: data?.temperature || [],
        precipitation: data?.precipitation || [],
        wind: data?.wind || [],
      };
    } else {
      throw new Error(`DWD ICON API HTTP ${res.status}`);
    }
  } catch (err) {
    console.warn("⚠️ ICON (DWD) indisponible, fallback Meteomatics:", err.message);
  }

  // === Étape 2 : fallback Meteomatics ===
  try {
    const params = ["t_2m:C", "precip_1h:mm", "wind_speed_10m:ms"];
    const data = await fetchMeteomatics(params, lat, lon, "icon-eu");

    if (!data) return { source: "ICON (Meteomatics)", error: "Pas de données" };

    return {
      source: "ICON (Meteomatics)",
      temperature: data["t_2m:C"] || [],
      precipitation: data["precip_1h:mm"] || [],
      wind: data["wind_speed_10m:ms"] || [],
    };
  } catch (err) {
    return { source: "ICON (Meteomatics)", error: err.message };
  }
}
