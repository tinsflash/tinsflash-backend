// ==========================================================
// 🌍 TINSFLASH – Service d’export PDF (Everest Protocol v2.5 PRO++)
// 100 % réel – IA J.E.A.N. (GPT-5 moteur / GPT-4o-mini console)
// ==========================================================

import { jsPDF } from "jspdf";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ==========================================================
// 🧠 Fonction principale : création d’un rapport PDF complet
// ==========================================================
export async function createFullReportPDF(alert, mode = "buffer") {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  // === En-tête ===
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("🌍 TINSFLASH – Rapport d’Alerte IA J.E.A.N.", 15, 20);
  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.text(`Référence : ${alert._id}`, 15, 35);
  doc.text(`Zone : ${alert.zone || "—"}`, 15, 42);
  doc.text(`Type : ${alert.title || "—"}`, 15, 49);
  doc.text(`Certitude : ${alert.certainty || "?"}%`, 15, 56);
  doc.text(`Gravité : ${alert.severity || "—"}`, 15, 63);
  doc.text(`Coordonnées : ${alert.geo?.lat || 0}, ${alert.geo?.lon || 0}`, 15, 70);
  doc.text(`Date : ${new Date().toLocaleString("fr-FR")}`, 15, 77);
  doc.line(15, 82, 195, 82);

  // === Analyse IA ===
  doc.setFont("helvetica", "bold");
  doc.text("🧠 Analyse IA J.E.A.N.", 15, 92);
  doc.setFont("helvetica", "normal");
  const aiText = alert.analysisIA || "Aucune analyse IA disponible.";
  doc.text(doc.splitTextToSize(aiText, 180), 15, 100);

  // === Page 2 : données techniques ===
  doc.addPage();
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("⚙️ Données techniques", 15, 20);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  const infos = [
    `Modèles utilisés : ${alert.modelsUsed?.join(", ") || "non précisés"}`,
    `Précipitations : ${alert.data?.precipitation || 0} mm`,
    `Vent max : ${alert.data?.wind || 0} km/h`,
    `Température : ${alert.data?.temperature || 0} °C`,
    `Pression : ${alert.data?.pressure || 0} hPa`,
  ];
  doc.text(infos, 15, 35);

  // === Page 3 : validation humaine ===
  doc.addPage();
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("👁️ Validation humaine / Expert", 15, 20);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  const humanText =
    alert.humanReview ||
    "Ce rapport est en attente de validation par un expert météorologique agréé.";
  doc.text(doc.splitTextToSize(humanText, 180), 15, 35);
  doc.text("Signature : ____________________________", 15, 120);
  doc.text("Date : ___________________", 15, 135);

  // === Sauvegarde locale ===
  const buffer = doc.output("arraybuffer");
  const pdfBuffer = Buffer.from(buffer);
  const exportDir = path.join(__dirname, "../exports");
  if (!fs.existsSync(exportDir)) fs.mkdirSync(exportDir, { recursive: true });
  const filePath = path.join(exportDir, `TINSFLASH_Alert_${alert._id}.pdf`);
  fs.writeFileSync(filePath, pdfBuffer);

  if (mode === "file") return filePath;
  return pdfBuffer;
}
