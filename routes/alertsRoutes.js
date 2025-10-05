// PATH: routes/alertsRoutes.js
import express from "express";
import Alert from "../models/Alerts.js";
import { askOpenAI } from "../services/openaiService.js";
import { addEngineLog, addEngineError } from "../services/engineState.js";

const router = express.Router();

/** ===============================
 *  📊 GET /api/alerts
 *  Retourne toutes les alertes actives
 *  =============================== */
router.get("/", async (req, res) => {
  try {
    const alerts = await Alert.find().sort({ "data.confidence": -1 });
    res.json(alerts);
  } catch (err) {
    await addEngineError("❌ /api/alerts: " + err.message);
    res.status(500).json({ error: err.message });
  }
});

/** ===============================
 *  📈 GET /api/alerts/summary
 *  Données de synthèse pour le tableau de bord
 *  =============================== */
router.get("/summary", async (req, res) => {
  try {
    const all = await Alert.find();
    const byStatus = {
      published: all.filter(a => a.data.status === "published").length,
      toValidate: all.filter(a => a.data.status === "toValidate").length,
      "under-surveillance": all.filter(a => a.data.status === "under-surveillance").length,
      archived: all.filter(a => a.data.status === "archived").length,
    };
    const exclusives = all.filter(a => a.data.external?.exclusivity === "exclusive").length;
    const confirmedElsewhere = all.filter(a => a.data.external?.exclusivity === "confirmed-elsewhere").length;
    const continental = all.filter(a => a.continent && !a.country).length;
    const local = all.filter(a => a.country).length;

    res.json({
      total: all.length,
      byStatus,
      exclusives,
      confirmedElsewhere,
      continental,
      local,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/** ===============================
 *  ✅ POST /api/alerts/:id/:action
 *  Change le statut d'une alerte (published, surveillance, pending, etc.)
 *  =============================== */
router.post("/:id/:action", async (req, res) => {
  try {
    const { id, action } = req.params;
    const alert = await Alert.findById(id);
    if (!alert) return res.status(404).json({ error: "Alerte non trouvée" });

    alert.data.status = action;
    alert.data.lastAction = new Date();
    await alert.save();

    await addEngineLog(`⚙️ Alerte ${id} mise à jour vers ${action}`);
    res.json({ success: true, id, action });
  } catch (err) {
    await addEngineError("❌ update alert: " + err.message);
    res.status(500).json({ error: err.message });
  }
});

/** ===============================
 *  📤 POST /api/alerts/export/:id
 *  Export Premium (NASA / NWS / Copernicus)
 *  =============================== */
router.post("/export/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const alert = await Alert.findById(id);
    if (!alert) return res.status(404).json({ error: "Alerte non trouvée" });

    // Exemple d’export (à remplacer plus tard par vrais webhooks/API)
    const targets = ["NASA", "NOAA/NWS", "Copernicus", "EUMETSAT"];
    alert.data.exportedAt = new Date();
    alert.data.exportTargets = targets;
    await alert.save();

    await addEngineLog(`📤 Alerte ${alert.country || alert.region} exportée vers ${targets.join(", ")}`);
    res.json({ success: true, id, targets });
  } catch (err) {
    await addEngineError("❌ export alert: " + err.message);
    res.status(500).json({ error: err.message });
  }
});

/** ===============================
 *  🧠 POST /api/alerts/analyze/:id
 *  Analyse IA J.E.A.N pour alerte en surveillance
 *  =============================== */
router.post("/analyze/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const alert = await Alert.findById(id);
    if (!alert) return res.status(404).json({ error: "Alerte non trouvée" });

    const prompt = `
    Tu es J.E.A.N., IA météo TINSFLASH.
    Analyse cette alerte et indique :
    - Type de phénomène (vent, pluie, orage, tempête, chaleur, froid…)
    - Risque pour humains, animaux, infrastructures.
    - Intensité probable (1 à 10)
    - Fiabilité actuelle (${alert.data.confidence || "?"}%)
    - Si altitude / relief / zone océanique changent la perception du risque.
    - Précise la zone (${alert.country || alert.region}) et le continent (${alert.continent || "?"})
    Donne un rapport clair et court, format JSON {type, intensité, risques, note, recommandation}.
    `;

    const aiResponse = await askOpenAI(prompt, JSON.stringify(alert.data));
    let analysis;
    try {
      analysis = JSON.parse(aiResponse);
    } catch {
      analysis = { raw: aiResponse };
    }

    alert.data.analysis = analysis;
    alert.data.analysisAt = new Date();
    await alert.save();

    await addEngineLog(`🧠 Analyse IA J.E.A.N effectuée sur ${id}`);
    res.json({ success: true, alert, analysis });
  } catch (err) {
    await addEngineError("❌ analyse alert: " + err.message);
    res.status(500).json({ error: err.message });
  }
});

export default router;
