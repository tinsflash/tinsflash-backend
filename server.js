// -------------------------
// ⚡ alertsService.js
// Gestion des alertes météo TINSFLASH (free / premium / pro / pro+)
// -------------------------
import fetch from "node-fetch";
console.log("🚀 Initialisation serveur TINSFLASH...");
// ✅ Simule une API météo radar pour la pluie
async function checkRain(lat, lon) {
  return {
    intensity: Math.random() * 10, // mm/h
    minutes: Math.floor(Math.random() * 60),
    reliability: 80 + Math.random() * 20
  };
}

// ✅ Simule la neige
async function checkSnow(lat, lon) {
  return {
    prob: Math.random(),
    intensity: Math.random() * 5,
    reliability: 70 + Math.random() * 30
  };
}

// ✅ Simule le vent
async function checkWind(lat, lon) {
  return {
    speed: Math.floor(20 + Math.random() * 60), // km/h
    reliability: 75 + Math.random() * 25
  };
}

// ✅ Alertes globales (affichées dans cockpit)
export async function getAlerts() {
  return [
    {
      level: "info",
      message: "🌤️ Journée globalement calme",
      reliability: 95
    },
    {
      level: "warning",
      message: "🌧️ Risque d’averses en fin de journée",
      reliability: 80
    }
  ];
}

// ✅ Alertes personnalisées (push sur mobile)
export async function getUserAlerts(lat, lon, level = "free") {
  const alerts = [];

  // 🌧️ Pluie
  const rain = await checkRain(lat, lon);
  if (rain.intensity > 0.1) {
    alerts.push({
      type: "rain",
      message: `🌧️ Pluie attendue dans ${rain.minutes} min`,
      level: rain.intensity > 5 ? "forte" : "faible",
      reliability: rain.reliability
    });
  }

  // ❄️ Neige (premium+)
  if (level !== "free") {
    const snow = await checkSnow(lat, lon);
    if (snow.prob > 0.2) {
      alerts.push({
        type: "snow",
        message: `❄️ Risque de neige (${snow.intensity.toFixed(1)} mm/h)`,
        level: snow.intensity > 3 ? "forte" : "légère",
        reliability: snow.reliability
      });
    }
  }

  // 💨 Vent fort
  const wind = await checkWind(lat, lon);
  if (wind.speed > 50) {
    alerts.push({
      type: "wind",
      message: `💨 Rafales à ${wind.speed} km/h attendues`,
      level: "danger",
      reliability: wind.reliability
    });
  }

  return alerts;
}
