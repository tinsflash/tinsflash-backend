const express = require("express");
const { getWeather, getWeatherPro } = require("../utils/weather");
const router = express.Router();

// Route météo standard (OpenWeather)
router.get("/", async (req, res) => {
  try {
    const { lat, lon } = req.query;
    const data = await getWeather(lat, lon);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: "Erreur météo standard" });
  }
});

// Route météo Pro (Meteomatics)
router.get("/pro", async (req, res) => {
  try {
    const { lat, lon } = req.query;
    const data = await getWeatherPro(lat, lon);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: "Erreur météo Pro" });
  }
});

module.exports = router;

