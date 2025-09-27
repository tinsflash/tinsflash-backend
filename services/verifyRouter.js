// services/verifyRouter.js
import express from "express";
import { askAI } from "./aiService.js";
import { getEngineState } from "./engineState.js";
import { getLogs } from "./adminLogs.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const state = getEngineState();
    const logs = getLogs().slice(0, 15);

    const prompt = `
Vérifie que le moteur TINSFLASH a correctement produit les résultats attendus :

- Prévisions locales et nationales pour les zones couvertes
- Alertes locales et nationales pour les zones couvertes
- Alertes continentales pour les zones non couvertes

Données moteur :
- runTime: ${state.runTime}
- zones couvertes OK: ${Object.keys(state.zonesCovered || {}).filter(z => state.zonesCovered[z])}
- zones KO: ${Object.keys(state.zonesCovered || {}).filter(z => !state.zonesCovered[z])}
- erreurs: ${JSON.stringify(state.errors)}
- alertes: ${state.alertsList?.length || 0}
- logs: ${logs.map(l => l.message).join(" | ")}

Réponds uniquement par catégories claires :
1/ Prévisions zones couvertes → Oui/Non + explication
2/ Alertes zones couvertes → Oui/Non + explication
3/ Alertes zones non couvertes → Oui/Non + explication
Conclusion: ✅ Tout ok ou ⚠️ Problème détecté
`;

    const reply = await askAI(prompt);
    res.json({ reply });
  } catch (err) {
    console.error("❌ Verify-all error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

export default router;
