// -------------------------
// 🌍 services/radarService.js
// Gestion radar météo multi-sources (gratuit, premium, pro, pro+)
// -------------------------

import fetch from "node-fetch";

// =========================
// GRATUIT : Buienalarm++
// =========================
// - Pluie (Rainviewer)
// - Neige & Nuages (EUMETSAT/NOAA)
// - Vent (Open-Meteo)
// =========================

export async function getRadarLayers(level = "free") {
  try {
    const layers = [];

    // 🌧️ Rainviewer : précipitations
    layers.push({
      name: "rain",
      label: "Pluie",
      tilesUrl:
        "https://tilecache.rainviewer.com/v2/radar/{time}/256/{z}/{x}/{y}/2/1_1.png",
      timestampsUrl: "https://api.rainviewer.com/public/maps.json",
      attribution: "Rainviewer"
    });

    // ❄️ NOAA/EUMETSAT : couverture nuages + neige
    layers.push({
      name: "clouds",
      label: "Nuages & Neige",
      tilesUrl:
        "https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/GOES-East_ABI_Band13_CleanIR/GoogleMapsCompatible_Level9/{z}/{y}/{x}.png",
      attribution: "NASA/NOAA"
    });

    // 💨 Open-Meteo : vent (vecteurs dynamiques)
    layers.push({
      name: "wind",
      label: "Vent",
      dataUrl: "https://api.open-meteo.com/v1/gfs?latitude=50.8&longitude=4.3&hourly=windspeed_10m,winddirection_10m",
      attribution: "Open-Meteo"
    });

    // =========================
    // PREMIUM & PRO features
    // =========================
    if (level === "premium" || level === "pro" || level === "proplus") {
      layers.push({
        name: "relief",
        label: "Relief & Vallées (IA légère)",
        description: "Ajustement pluie/vent selon microclimat",
      });
    }

    if (level === "pro" || level === "proplus") {
      layers.push({
        name: "ocean",
        label: "Conditions en mer",
        dataUrl: "https://api.stormglass.io/v2/weather/point", // nécessite clé
        attribution: "StormGlass"
      });
    }

    if (level === "proplus") {
      layers.push({
        name: "ai-fusion",
        label: "Super radar IA",
        description: "Fusion multi-sources + anomalies climatiques"
      });
    }

    return layers;
  } catch (err) {
    console.error("❌ Erreur radarService:", err.message);
    return [];
  }
}
