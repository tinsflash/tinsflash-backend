const express = require("express");
const router = express.Router();
const { getFusionWeather } = require("../utils/fusion");

// Alerte automatique en fonction des seuils météo
router.get("/", async (req, res) => {
  try {
    const { lat, lon, region } = req.query;

    if (!lat || !lon) {
      return res.status(400).json({ error: "Latitude et longitude obligatoires" });
    }

    const data = await getFusionWeather(lat, lon);

    let alerts = [];

    // Exemple de règles simples (à enrichir plus tard)
    if (data.temperature > 35) {
      alerts.push({
        region: region || "Zone locale",
        level: "🔴 Rouge",
        message: "Canicule sévère détectée",
        reliability: data.reliability,
      });
    }

    if (data.temperature < -10) {
      alerts.push({
        region: region || "Zone locale",
        level: "🟠 Orange",
        message: "Vague de froid extrême",
        reliability: data.reliability,
      });
    }

    if (alerts.length === 0) {
      alerts.push({
        region: region || "Zone locale",
        level: "🟢 Vert",
        message: "Pas d’alerte",
        reliability: data.reliability,
      });
    }

    res.json(alerts);
  } catch (error) {
    console.error("Erreur alertes:", error.message);
    res.status(500).json({ error: "Impossible de générer les alertes" });
  }
});

module.exports = router;

