// PATH: services/forecastService.js
// Bulletin national et local — basé sur SuperForecast et runGlobal
// ⚡ TINSFLASH – Moteur nucléaire météo (bulletins en temps réel)

import { runSuperForecast } from "./superForecast.js";
import openweather from "./openweather.js";
import wetter3Bridge from "./wetter3Bridge.js"; // 🆕 Intégration Wetter3.de (source GFS interne)
import { COVERED_ZONES } from "./zonesCovered.js"; // ✅ Nouveau import correct

/**
 * 🇪🇺 Bulletin national (zones couvertes)
 */
async function getNationalForecast(country) {
  try {
    const zones = COVERED_ZONES[country];
    if (!zones) {
      return {
        country,
        source: "Centrale Nucléaire Météo",
        error: "Pays non couvert",
        forecasts: {},
      };
    }

    const results = await Promise.all(
      zones.map(async (z) => {
        try {
          // === 1️⃣ Wetter3 interne (renforcement du GFS) ===
          let wetter3Data = null;
          try {
            wetter3Data = await wetter3Bridge.getWetter3GFS(z.lat, z.lon);
          } catch {
            wetter3Data = null;
          }

          // === 2️⃣ SuperForecast principal ===
          const sf = await runSuperForecast({
            lat: z.lat,
            lon: z.lon,
            country,
            region: z.region,
          });

          return [
            z.region,
            {
              lat: z.lat,
              lon: z.lon,
              country,
              forecast: sf?.forecast || "⚠️ Pas de données",
              sources: [
                "Centrale Nucléaire Météo",
                wetter3Data ? "Wetter3 GFS" : null,
                "Fusion IA J.E.A.N",
              ].filter(Boolean),
              wetter3: wetter3Data || null,
              enriched: sf?.enriched || null,
              source: "Centrale Nucléaire Météo",
              note:
                country === "USA"
                  ? "⚡ Fusion multi-modèles + HRRR (USA)"
                  : "⚡ Fusion multi-modèles (ECMWF/GFS/ICON/Meteomatics/Copernicus/NASA + Wetter3)",
            },
          ];
        } catch (e) {
          return [
            z.region,
            {
              lat: z.lat,
              lon: z.lon,
              country,
              forecast: "❌ Erreur lors du calcul",
              error: e.message,
              source: "Centrale Nucléaire Météo",
            },
          ];
        }
      })
    );

    return {
      country,
      source: "Centrale Nucléaire Météo",
      forecasts: Object.fromEntries(results),
    };
  } catch (err) {
    console.error("❌ getNationalForecast error:", err.message);
    return {
      country,
      source: "Centrale Nucléaire Météo",
      error: err.message,
      forecasts: {},
    };
  }
}

/**
 * 📍 Prévision locale (point unique)
 */
async function getLocalForecast(lat, lon, country) {
  try {
    const zones = COVERED_ZONES[country];

    if (zones) {
      // Wetter3 local (si dispo)
      let wetter3Data = null;
      try {
        wetter3Data = await wetter3Bridge.getWetter3GFS(lat, lon);
      } catch {
        wetter3Data = null;
      }

      const sf = await runSuperForecast({ lat, lon, country });

      return {
        lat,
        lon,
        country,
        forecast: sf?.forecast || "⚠️ Pas de données",
        wetter3: wetter3Data || null,
        sources: [
          "Centrale Nucléaire Météo",
          wetter3Data ? "Wetter3 GFS" : null,
          "Fusion IA J.E.A.N",
        ].filter(Boolean),
        enriched: sf?.enriched || null,
        source: "Centrale Nucléaire Météo",
        note:
          country === "USA"
            ? "⚡ Fusion multi-modèles + HRRR (USA)"
            : "⚡ Fusion multi-modèles (ECMWF/GFS/ICON/Meteomatics/Copernicus/NASA + Wetter3)",
      };
    }

    // ⚠️ Fallback si hors zones couvertes
    const ow = await openweather(lat, lon);
    return {
      lat,
      lon,
      country,
      forecast: {
        resume: "Prévisions OpenWeather (fallback hors zones couvertes)",
        data: ow,
        fiabilite: "≈45%",
      },
      source: "OpenWeather (fallback)",
    };
  } catch (err) {
    console.error("❌ getLocalForecast error:", err.message);
    return {
      lat,
      lon,
      country,
      source: "Centrale Nucléaire Météo",
      error: err.message,
      forecasts: {},
    };
  }
}

// ✅ Export par défaut (aucune modification des signatures)
export default { getNationalForecast, getLocalForecast };
