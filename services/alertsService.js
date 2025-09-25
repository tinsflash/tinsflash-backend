// PATH: services/alertsService.js
// Expose les alertes via API
import express from "express";
import { processAlerts } from "./alertsEngine.js";
import detectAlerts from "./alertDetector.js"; // détecteur brut

const router = express.Router();

/**
 * GET /api/alerts/:zone
 * Retourne la liste des alertes enrichies (avec fiabilité)
 */
router.get("/:zone", async (req, res) => {
  try {
    const zone = req.params.zone;
    const rawAlerts = await detectAlerts(zone); // détection brute
    const enriched = await processAlerts(rawAlerts, { zone });

    res.json({ zone, alerts: enriched });
  } catch (err) {
    console.error("❌ Erreur alertsService:", err);
    res.status(500).json({ error: "Erreur moteur alertes" });
  }
});

export default router;
