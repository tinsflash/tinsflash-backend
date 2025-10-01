// services/hrrr.js
// 🇺🇸 HRRR (High-Resolution Rapid Refresh, NOAA NOMADS)
// Ultra-haute résolution (3 km) — USA uniquement

import axios from "axios";

export default async function hrrr(lat, lon) {
  try {
    const baseUrl = "https://nomads.ncep.noaa.gov/pub/data/nccf/com/hrrr/prod";
    const now = new Date();

    // HRRR est disponible toutes les heures → on prend l'heure UTC précédente
    now.setHours(now.getUTCHours() - 1, 0, 0, 0);
    const yyyymmdd = now.toISOString().slice(0, 10).replace(/-/g, "");
    const hour = String(now.getUTCHours()).padStart(2, "0");

    // Exemple fichier GRIB2 → on ne télécharge pas tout mais on note l’URL
    const gribUrl = `${baseUrl}/hrrr.${yyyymmdd}/conus/hrrr.t${hour}z.wrfsfcf00.grib2`;

    // ⚠️ Ici : idéalement décoder GRIB2 avec wgrib2 ou un parseur Node
    // Pour l’instant on retourne juste la structure avec l’URL
    return {
      source: "HRRR (NOAA NOMADS)",
      modelRun: `${yyyymmdd}T${hour}Z`,
      url: gribUrl,
      note: "⚠️ Extraction brute GRIB2 requise (prévoir décodeur côté serveur).",
    };
  } catch (err) {
    console.error("❌ HRRR fetch error:", err.message);
    return { source: "HRRR (NOAA NOMADS)", error: err.message };
  }
}
