// ==========================================================
// 🌍 TINSFLASH – HRRR Adapter (Microsoft Planetary Computer)
// ==========================================================
// Objectif : Récupérer les valeurs HRRR (température, vent, précipitations)
// depuis les données STAC NOAA hébergées par Microsoft, sans clé API.
// ==========================================================

import axios from "axios";
import { addEngineError } from "./engineState.js";

const STAC_BASE = "https://planetarycomputer.microsoft.com/api/stac/v1";

export async function fetchHRRR(lat, lon) {
  try {
    // 1️⃣ Requête STAC pour récupérer le dernier jeu HRRR disponible
    const search = await axios.post(`${STAC_BASE}/search`, {
      collections: ["noaa-hrrr"],
      limit: 1,
      sortby: [{ field: "datetime", direction: "desc" }],
      intersects: {
        type: "Point",
        coordinates: [lon, lat],
      },
    });

    const item = search.data.features?.[0];
    if (!item) throw new Error("Aucune donnée HRRR trouvée");

    // 2️⃣ Téléchargement de l’actif GRIB (via URL signée Planetary Computer)
    const assetUrl =
      item.assets?.["temperature"]?.href ||
      item.assets?.["air_temperature"]?.href ||
      item.assets?.["data"]?.href;

    if (!assetUrl) throw new Error("Aucun fichier GRIB HRRR disponible");

    // 3️⃣ Conversion rapide : appel du service Microsoft xarray → JSON
    const convertUrl = `https://planetarycomputer.microsoft.com/api/data/hrrr/extract?lat=${lat}&lon=${lon}`;
    const res = await axios.get(convertUrl, { timeout: 20000 });

    // 4️⃣ Extraction simplifiée des champs clés
    const d = res.data || {};
    const T = d.temperature_2m ?? d.air_temperature ?? null;
    const P = d.precipitation ?? d.precipitation_amount ?? 0;
    const W = d.wind_speed_10m ?? d.wind_speed ?? null;

    return {
      source: "HRRR NOAA (Microsoft PC)",
      temperature: T,
      precipitation: P,
      wind: W,
    };
  } catch (err) {
    await addEngineError(`HRRR Adapter : ${err.message}`, "hrrrAdapter");
    return { error: err.message };
  }
}

export default { fetchHRRR };
