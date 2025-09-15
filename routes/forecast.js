const express = require("express");
const { getWeather } = require("../utils/weather");
const { getMeteomatics } = require("../utils/meteomatics");
const router = express.Router();

// OpenWeather (standard)
router.get("/", async (req, res) => {
  try {
    const { lat, lon } = req.query;
    const data = await getWeather(lat, lon);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: "Erreur météo OpenWeather" });
  }
});

// Meteomatics (Pro)
router.get("/pro", async (req, res) => {
  try {
    const { lat, lon } = req.query;
    const data = await getMeteomatics(lat, lon);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: "Erreur météo Meteomatics" });
  }
});

module.exports = router;

