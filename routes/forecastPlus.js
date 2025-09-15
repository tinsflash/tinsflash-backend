const express = require("express");
const { getFusionWeather } = require("../utils/fusion");
const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const { lat, lon } = req.query;
    if (!lat || !lon) {
      return res.status(400).json({ error: "Latitude et longitude obligatoires" });
    }

    const data = await getFusionWeather(lat, lon);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: "Erreur prévisions fusionnées" });
  }
});

module.exports = router;
