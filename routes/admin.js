// routes/admin.js
import express from "express";
import forecastService from "../services/forecastService.js";

const router = express.Router();

// Lire la dernière prévision nationale
router.get("/forecasts/latest/:country", async (req, res) => {
  try {
    const forecast = await forecastService.getLatestForecast(req.params.country);
    if (!forecast) {
      return res.status(404).json({ error: "Pas de prévision trouvée" });
    }
    res.json(forecast);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
