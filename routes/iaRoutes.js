// routes/iaRoutes.js
// 🤖 Route d'analyse IA J.E.A.N (manuelle, déclenchée après RUN global)

import express from "express";
import { addEngineLog } from "../services/engineState.js";
import { analyseIA } from "../services/iaService.js";

const router = express.Router();

// 🔹 Lancer uniquement l'analyse IA
router.post("/ia/analyse", async (req, res) => {
  try {
    addEngineLog("🧠 Requête reçue : lancement de l'analyse IA J.E.A.N...");
    const result = await analyseIA();
    res.json({ success: true, result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
