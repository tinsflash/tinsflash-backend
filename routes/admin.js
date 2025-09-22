// routes/admin.js
// -------------------------
// 🌍 Admin Routes
// -------------------------
import express from "express";
import superForecast from "../services/superForecast.js";

const router = express.Router();

// ✅ Exemple console admin – stats système
router.get("/stats", (req, res) => {
  res.json({
    system: "OK",
    users: 2500,
    activeAlerts: 12,
    podcasts: 56,
  });
});

// ✅ Validation d’alertes (accept/refuse/escalate)
router.post("/validate-alert", (req, res) => {
  const { id, action } = req.body; // action = accept/refuse/escalate
  res.json({ success: true, id, action });
});

// ✅ Lancer un Run SuperForecast
router.post("/superforecast/run", async (req, res) => {
  try {
    // Si lat/lon pas envoyés, valeur par défaut = Bruxelles
    const { lat = 50.85, lon = 4.35 } = req.body;

    const result = await superForecast.runFullForecast(lat, lon);

    res.json({
      success: true,
      message: "🚀 SuperForecast lancé avec succès",
      result,
    });
  } catch (err) {
    console.error("❌ Erreur SuperForecast:", err.message);
    res.status(500).json({
      success: false,
      error: "Erreur lors du lancement du SuperForecast",
      details: err.message,
    });
  }
});

export default router;
