// services/alertsService.js
// Expose les alertes via API

import express from "express";
import { processAlerts } from "./alertsEngine.js";
import { detectAlerts } from "./alertDetector.js"; // ✅ correction : named import

const router = express.Router();

/**
 * GET /api/alerts/:zone
 * Retourne la liste des alertes enrichies (avec fiabilité)
 */
router.get("/:zone", async (req, res) => {
  try {
    const zone = req.params.zone;

    // ⚠️ detectAlerts attend normalement un "forecast"
    // Pour l’instant on lui passe juste un objet minimal avec zone
    const rawAlerts = detectAlerts({ zone });

    const enriched = await processAlerts(rawAlerts, { zone });

    res.json({ zone, alerts: enriched });
  } catch (err) {
    console.error("❌ Erreur alertsService:", err);
    res.status(500).json({ error: "Erreur moteur alertes" });
  }
});

export default router;
