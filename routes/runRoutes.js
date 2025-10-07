// routes/runRoutes.js
// ⚙️ Routes pour exécuter le moteur TINSFLASH

import express from "express";
import { runGlobal } from "../services/runGlobal.js";
import { addEngineLog } from "../services/engineState.js";

const router = express.Router();

// 🔹 Lancer le RUN Global complet (prévisions + alertes)
router.post("/run/global", async (req, res) => {
  try {
    addEngineLog("🛰️ Requête reçue : lancement du RUN Global manuel...");
    const summary = await runGlobal();
    res.json({ success: true, summary });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
