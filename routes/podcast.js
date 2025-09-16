const express = require("express");
const router = express.Router();
const { getForecast } = require("../services/models");
const { generatePodcast } = require("../services/podcastEngine");

router.get("/", async (req, res) => {
  const { lat, lon, level } = req.query;
  const forecast = await getForecast(lat, lon);
  const fileUrl = await generatePodcast(forecast, level || "free");
  res.json({ podcast: fileUrl });
});

module.exports = router;
