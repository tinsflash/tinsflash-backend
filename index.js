const express = require("express");
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware pour choisir la langue
function getLang(req) {
  return req.query.lang === "en" ? "en" : "fr";
}

// Route d'accueil
app.get("/", (req, res) => {
  const lang = getLang(req);
  const messages = {
    fr: "✅ Bienvenue sur le backend TINSFLASH !",
    en: "✅ Welcome to the TINSFLASH backend!"
  };
  res.send(messages[lang]);
});

// Prévisions météo
app.get("/forecast", (req, res) => {
  const lang = getLang(req);
  const forecasts = {
    fr: {
      location: "Namur",
      today: "🌤️ Aujourd’hui : 18°C, ensoleillé",
      tomorrow: "🌧️ Demain : 16°C, averses",
      afterTomorrow: "🌩️ Mercredi : 14°C, orages"
    },
    en: {
      location: "Namur",
      today: "🌤️ Today: 18°C, sunny",
      tomorrow: "🌧️ Tomorrow: 16°C, showers",
      afterTomorrow: "🌩️ Wednesday: 14°C, storms"
    }
  };
  res.json(forecasts[lang]);
});

// Alertes météo
app.get("/alerts", (req, res) => {
  const lang = getLang(req);
  const alerts = {
    fr: [
      { type: "vent", level: "⚠️ Rafales > 80 km/h" },
      { type: "pluie", level: "🌧️ Risque d’inondation élevé" },
      { type: "neige", level: "❄️ Verglas probable" }
    ],
    en: [
      { type: "wind", level: "⚠️ Gusts > 80 km/h" },
      { type: "rain", level: "🌧️ High flood risk" },
      { type: "snow", level: "❄️ Possible black ice" }
    ]
  };
  res.json(alerts[lang]);
});

// Podcast météo
app.get("/podcast", (req, res) => {
  const lang = getLang(req);
  const podcasts = {
    fr: {
      message: "🎙️ Podcast météo généré à 7h05 et 19h05",
      url: "https://tinsflash.com/audio/mock_bulletin_fr.mp3"
    },
    en: {
      message: "🎙️ Weather podcast generated at 7:05 AM and 7:05 PM",
      url: "https://tinsflash.com/audio/mock_bulletin_en.mp3"
    }
  };
  res.json(podcasts[lang]);
});

// Lancer le serveur
app.listen(PORT, () => {
  console.log(`🚀 TINSFLASH backend running on http://localhost:${PORT}`);
});