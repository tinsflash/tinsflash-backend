// utils/seasonalNorms.js
// 📊 Normales climatiques (moyennes saisonnières) par pays & mois
// Sources croisées : WMO, NOAA, MeteoFrance, IRM
// Objectif : comparer les prévisions réelles avec la "normale" pour détecter des anomalies

export function getSeasonalNorms(country = "BE") {
  const month = new Date().getMonth() + 1; // mois courant (1-12)

  const norms = {
    BE: { // 🇧🇪 Belgique (Bruxelles)
      1: { mean: 3 },  2: { mean: 4 },  3: { mean: 7 },  4: { mean: 11 },
      5: { mean: 15 }, 6: { mean: 18 }, 7: { mean: 20 }, 8: { mean: 20 },
      9: { mean: 17 }, 10: { mean: 12 }, 11: { mean: 7 },  12: { mean: 4 }
    },
    FR: { // 🇫🇷 France (Paris)
      1: { mean: 5 },  2: { mean: 6 },  3: { mean: 9 },  4: { mean: 12 },
      5: { mean: 16 }, 6: { mean: 20 }, 7: { mean: 23 }, 8: { mean: 23 },
      9: { mean: 19 }, 10: { mean: 14 }, 11: { mean: 9 },  12: { mean: 6 }
    },
    US: { // 🇺🇸 USA (Washington DC)
      1: { mean: 3 },  2: { mean: 5 },  3: { mean: 10 }, 4: { mean: 16 },
      5: { mean: 21 }, 6: { mean: 26 }, 7: { mean: 29 }, 8: { mean: 28 },
      9: { mean: 24 }, 10: { mean: 17 }, 11: { mean: 11 }, 12: { mean: 5 }
    },
    ES: { // 🇪🇸 Espagne (Madrid)
      1: { mean: 6 },  2: { mean: 8 },  3: { mean: 12 }, 4: { mean: 15 },
      5: { mean: 20 }, 6: { mean: 25 }, 7: { mean: 29 }, 8: { mean: 29 },
      9: { mean: 24 }, 10: { mean: 18 }, 11: { mean: 12 }, 12: { mean: 8 }
    },
    IT: { // 🇮🇹 Italie (Rome)
      1: { mean: 8 },  2: { mean: 9 },  3: { mean: 12 }, 4: { mean: 15 },
      5: { mean: 20 }, 6: { mean: 24 }, 7: { mean: 27 }, 8: { mean: 27 },
      9: { mean: 23 }, 10: { mean: 18 }, 11: { mean: 13 }, 12: { mean: 9 }
    },
    DE: { // 🇩🇪 Allemagne (Berlin)
      1: { mean: 1 },  2: { mean: 3 },  3: { mean: 7 },  4: { mean: 11 },
      5: { mean: 16 }, 6: { mean: 19 }, 7: { mean: 22 }, 8: { mean: 22 },
      9: { mean: 17 }, 10: { mean: 12 }, 11: { mean: 6 },  12: { mean: 2 }
    }
  };

  // fallback par défaut si pays non listé
  return norms[country]?.[month] || { mean: 15 };
}

// 📍 Fonction utilitaire : détecter une anomalie par rapport à la normale
export function detectAnomaly(temp, country = "BE") {
  const norm = getSeasonalNorms(country).mean;
  const diff = temp - norm;

  if (Math.abs(diff) < 2) {
    return { anomaly: false, message: "🌡️ Température dans les normales saisonnières." };
  }

  if (diff >= 2) {
    return { anomaly: true, message: `🔥 Anomalie chaude (+${diff.toFixed(1)}°C par rapport à la normale).` };
  }

  if (diff <= -2) {
    return { anomaly: true, message: `❄️ Anomalie froide (${diff.toFixed(1)}°C sous la normale).` };
  }

  return { anomaly: false, message: "🌡️ Conditions normales." };
}
