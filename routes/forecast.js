const express = require("express");
const router = express.Router();
const { getForecast } = require("../services/models");
const { processAlerts } = require("../services/alertsEngine");

router.get("/", async (req, res) => {
  const { lat, lon } = req.query;
  const forecast = await getForecast(lat, lon);
  const alerts = processAlerts(forecast);
  res.json({ forecast, alerts });
});

module.exports = router;


