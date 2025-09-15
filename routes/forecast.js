const express = require("express");
const { getWeather } = require("../utils/weather");
const { getMeteomaticsWeather } = require("../utils/meteomatics");

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const { lat, lon } = req.query;

    // Données OpenWeather
    const owData = await getWeather(lat, lon);

    // Données Meteomatics
    const mmData = await getMeteomaticsWeather(lat, lon);

    // Fusion simple (on pourra affiner après)
    const combined = {
      source: "TINSFLASH",
      location: { lat, lon },
      openWeather: owData,
      meteomatics: mmData,
    };

    res.json(combined);
  } catch (error) {
    res.status(500).json({ error: "Erreur météo combinée" });
  }
});

module.exports = router;

