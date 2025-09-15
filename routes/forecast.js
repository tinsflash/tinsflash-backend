const express = require("express");
const { getWeather } = require("../utils/weather");
const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const { lat, lon } = req.query;
    const data = await getWeather(lat, lon);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: "Erreur météo" });
  }
});

module.exports = router;

