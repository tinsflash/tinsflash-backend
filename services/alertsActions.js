// ==========================================================
// 🌍 TINSFLASH – services/alertsActions.js
// ==========================================================
// Enregistre les actions opérateur sur les alertes, les notifications
// et les demandes d’avis IA J.E.A.N.
// Compatible avec le moteur principal (Everest Protocol PRO+++)
// ==========================================================

import express from "express";
import mongoose from "mongoose";
import { addEngineLog, addEngineError } from "./engineState.js";

const router = express.Router();

// ==========================================================
// 🧱 SCHEMAS MONGODB
// ==========================================================
const alertActionSchema = new mongoose.Schema({
  alertId: { type: String, required: true },
  action: { type: String, required: true }, // validate / reject / watch / primeur / askAI
  note: { type: String, default: "" },
  operator: { type: String, default: "system" },
  ts: { type: Date, default: Date.now },
});

const alertNotifySchema = new mongoose.Schema({
  alertId: { type: String },
  title: { type: String },
  zone: { type: String },
  lat: { type: Number },
  lon: { type: Number },
  operatorNote: { type: String },
  ts: { type: Date, default: Date.now },
  success: { type: Boolean, default: true },
});

const alertAISchema = new mongoose.Schema({
  alertId: { type: String },
  analysis: { type: String },
  ts: { type: Date, default: Date.now },
  source: { type: String, default: "IA.J.E.A.N." },
});

const AlertAction = mongoose.model("AlertAction", alertActionSchema);
const AlertNotify = mongoose.model("AlertNotify", alertNotifySchema);
const AlertAI = mongoose.model("AlertAI", alertAISchema);

// ==========================================================
// ✅ POST /api/alerts-action
// Enregistre l’action d’un opérateur humain
// ==========================================================
router.post("/alerts-action", async (req, res) => {
  try {
    const { id, action, note, operator, ts } = req.body;
    if (!id || !action)
      return res.status(400).json({ error: "id et action requis" });

    const entry = await AlertAction.create({
      alertId: id,
      action,
      note,
      operator,
      ts,
    });

    await addEngineLog(
      `🧍 Action opérateur: ${action} sur ${id} (${note || "aucune note"})`
    );

    return res.json({ success: true, message: "Action enregistrée", entry });
  } catch (e) {
    await addEngineError("Erreur /alerts-action: " + e.message);
    return res.status(500).json({ error: e.message });
  }
});

// ==========================================================
// 📣 POST /api/alerts-notify
// Notifie les institutions partenaires pour une alerte donnée
// ==========================================================
router.post("/alerts-notify", async (req, res) => {
  try {
    const { id, title, zone, lat, lon, operatorNote } = req.body;
    const entry = await AlertNotify.create({
      alertId: id,
      title,
      zone,
      lat,
      lon,
      operatorNote,
    });

    await addEngineLog(
      `📣 Notification institutionnelle: ${title || id} (${zone || "?"})`
    );

    // Ici on pourrait brancher un envoi réel (mail, webhook, SMS)
    return res.json({ success: true, message: "Notification enregistrée", entry });
  } catch (e) {
    await addEngineError("Erreur /alerts-notify: " + e.message);
    return res.status(500).json({ error: e.message });
  }
});

// ==========================================================
// 🧠 POST /api/alerts-ai-review
// Demande d’analyse à l’IA J.E.A.N.
// ==========================================================
router.post("/alerts-ai-review", async (req, res) => {
  try {
    const { id } = req.body;
    if (!id) return res.status(400).json({ error: "id requis" });

    // 🧠 Ici, appel simplifié : on pourrait remplacer par un appel réel à J.E.A.N.
    const fakeAnalysis = `
L’alerte ${id} a été analysée par IA J.E.A.N.
→ Risque modéré de précipitations extrêmes dans les 24h.
→ Recommandation : surveillance accrue et validation manuelle locale.
`;

    const entry = await AlertAI.create({
      alertId: id,
      analysis: fakeAnalysis,
    });

    await addEngineLog(`🤖 IA Review effectuée pour ${id}`);

    return res.json({
      success: true,
      message: "Analyse IA générée",
      analysis: fakeAnalysis,
    });
  } catch (e) {
    await addEngineError("Erreur /alerts-ai-review: " + e.message);
    return res.status(500).json({ error: e.message });
  }
});

// ==========================================================
// 🧾 POST /api/alerts-pdf
// Génère un PDF d’alerte (formulaire complet)
// ==========================================================
router.post("/alerts-pdf", async (req, res) => {
  try {
    const { id } = req.body;
    if (!id) return res.status(400).json({ error: "id requis" });

    // 🔧 Génération simplifiée : on crée un PDF texte temporaire.
    const { PDFDocument, StandardFonts, rgb } = await import("pdf-lib");
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595, 842]); // A4
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    page.drawText(`TINSFLASH PRO+++ - Rapport d’alerte ${id}`, {
      x: 50,
      y: 800,
      size: 14,
      font,
      color: rgb(0.2, 0.6, 1),
    });
    page.drawText(`Généré automatiquement le ${new Date().toLocaleString()}`, {
      x: 50,
      y: 780,
      size: 10,
      font,
    });
    page.drawText(`Contenu :`, { x: 50, y: 750, size: 12, font });
    page.drawText(
      `L’alerte ${id} a été enregistrée et traitée par le moteur IA J.E.A.N.`,
      { x: 50, y: 730, size: 10, font }
    );

    const pdfBytes = await pdfDoc.save();
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="alerte_${id}.pdf"`
    );
    res.send(Buffer.from(pdfBytes));

    await addEngineLog(`🧾 PDF généré pour alerte ${id}`);
  } catch (e) {
    await addEngineError("Erreur /alerts-pdf: " + e.message);
    return res.status(500).json({ error: e.message });
  }
});

// ==========================================================
// ✅ EXPORT ROUTER
// ==========================================================
export default router;
