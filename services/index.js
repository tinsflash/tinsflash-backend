// -------------------------
// 🌍 index.js
// Point d’entrée unique pour tous les services météo
// -------------------------

// Prévisions
const { getForecast } = require("./forecastService");

// Alertes
const { processAlerts } = require("./alertsEngine");
const { getAlerts } = require("./alertsService");

// Radar
const { getRadar } = require("./radarService");

// Textes auto
const { generateText } = require("./textGenService");

// Codes météo (icônes / symboles)
const { getWeatherIcon } = require("./codesService");

// Podcasts
const { generatePodcast } = require("./podcastService");

// Chat IA
const { chatWithJean } = require("./chatService");

// Modèles IA (optionnel si tu veux charger dynamiquement des modèles)
const models = require("./models");

module.exports = {
  forecast: {
    getForecast,
  },
  alerts: {
    processAlerts,
    getAlerts,
  },
  radar: {
    getRadar,
  },
  text: {
    generateText,
  },
  codes: {
    getWeatherIcon,
  },
  podcast: {
    generatePodcast,
  },
  chat: {
    chatWithJean,
  },
  models,
};
