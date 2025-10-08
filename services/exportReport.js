// ==========================================================
// 🌍 TINSFLASH – Service d’export PDF (Protocol Everest v1.3 PRO++)
// 100 % réel – Rapports IA J.E.A.N. validés humainement
// ==========================================================

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { jsPDF } from "jspdf";
import Alert from "../models/Alert.js";
import { getEngineState } from "./engineState.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ==========================================================
// 🧠 Génération du rapport PDF complet pour une alerte donnée
// ==========================================================
export async function exportAlertReport(alertId) {
  try {
    const alert = await Alert.findById(alertId);
    if (!alert) throw new Error("Alerte introuvable");

    const state = await getEngineState();
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

    // === Page 1 – En-tête & méta-infos ===
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("🌍 TINSFLASH – Rapport d’Alerte IA J.E.A.N.", 15, 20);

    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text(`Référence interne : ${alert._id}`, 15, 35);
    doc.text(`Zone : ${alert.zone}`, 15, 42);
    doc.text(`Type d'alerte : ${alert.title || "—"}`, 15, 49);
    doc.text(`Certitude IA : ${alert.certainty || "?"}%`, 15, 56);
    doc.text(`Niveau de gravité : ${alert.severity || "—"}`, 15, 63);
    doc.text(`Coordonnées : ${alert.geo?.lat || 0}, ${alert.geo?.lon || 0}`, 15, 70);
    doc.text(`Date de génération : ${new Date().toLocaleString("fr-FR")}`, 15, 77);

    doc.setDrawColor(100);
    doc.line(15, 82, 195, 82);

    // === Page 1 – Analyse IA ===
    doc.setFont("helvetica", "bold");
    doc.text("🧠 Analyse IA J.E.A.N.", 15, 92);
    doc.setFont("helvetica", "normal");
    const aiText = alert.analysisIA || "Aucune analyse IA détaillée disponible.";
    doc.text(doc.splitTextToSize(aiText, 180), 15, 100);

    // === Page 2 – Données techniques ===
    doc.addPage();
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("⚙️ Données techniques", 15, 20);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);
    const techData = [
      `Source(s) de modèle : ${alert.models?.join(", ") || "Non spécifiées"}`,
      `Taux de fiabilité locale : ${state?.checkup?.reliability || "—"}%`,
      `Précipitations prévues : ${alert.data?.rain || 0} mm`,
      `Vent max : ${alert.data?.wind || 0} km/h`,
      `Température : ${alert.data?.temp || 0} °C`,
      `Pression atmosphérique : ${alert.data?.pressure || 0} hPa`,
    ];
    doc.text(techData, 15, 35);

    // === Page 3 – Recommandations humaines ===
    doc.addPage();
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("👁️ Validation humaine / Expert", 15, 20);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);
    const humanNote = alert.humanReview
      ? alert.humanReview
      : "En attente de validation par un expert météorologique agréé.";
    doc.text(doc.splitTextToSize(humanNote, 180), 15, 35);

    doc.text("Signature (expert) : ____________________________", 15, 120);
    doc.text("Date : ___________________", 15, 135);

    // === Sauvegarde fichier ===
    const exportDir = path.join(__dirname, "../exports");
    if (!fs.existsSync(exportDir)) fs.mkdirSync(exportDir, { recursive: true });

    const filePath = path.join(exportDir, `TINSFLASH_RAPPORT_${alert._id}.pdf`);
    await doc.save(filePath);

    return { success: true, path: filePath, name: `TINSFLASH_RAPPORT_${alert._id}.pdf` };
  } catch (err) {
    console.error("Erreur export PDF:", err.message);
    return { success: false, error: err.message };
  }
}

// ==========================================================
// 📦 Export groupé – toutes les alertes Premium / urgentes
// ==========================================================
export async function exportPremiumReports() {
  try {
    const alerts = await Alert.find({ certainty: { $gte: 90 } });
    if (!alerts.length) return { success: false, message: "Aucune alerte Premium à exporter." };

    const results = [];
    for (const alert of alerts) {
      const pdf = await exportAlertReport(alert._id);
      results.push(pdf);
    }

    return { success: true, count: results.length, files: results };
  } catch (err) {
    console.error("Erreur export groupé:", err.message);
    return { success: false, error: err.message };
  }
}
