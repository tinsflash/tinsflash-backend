// src/routes/iaRoutes.js
import express from "express";
import { getAllForecastZones } from "../services/forecastService.js";
import { runIAJEANAnalysis } from "../services/iaService.js";
import { addEngineLog, addEngineError } from "../services/engineState.js";

const router = express.Router();

router.get("/run", async (req, res) => {
  try {
    addEngineLog("API /api/ia/run called");
    const zones = await getAllForecastZones();
    const result = await runIAJEANAnalysis(zones);
    if (result.status === "success") {
      return res.status(200).json(result);
    } else {
      return res.status(500).json(result);
    }
  } catch (err) {
    addEngineError("API /ia/run internal error: " + err.message);
    return res.status(500).json({ status: "error", message: "Erreur interne IA", details: err.message });
  }
});

export default router;
