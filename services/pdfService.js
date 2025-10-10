// ==========================================================
// 📄 TINSFLASH – services/pdfService.js (Everest Protocol v3.5 PRO+++)
// ==========================================================
// Génération PDF des alertes IA.J.E.A.N. – Compatible Render / Node 18+
// Utilise PDFKit (aucune dépendance additionnelle requise sur Render)
// ==========================================================

import PDFDocument from "pdfkit";
import { addEngineLog, addEngineError } from "./engineState.js";

// Génère un PDF en mémoire à partir d'une alerte (objet)
export async function generateAlertPDF(alert) {
  try {
    await addEngineLog(`📄 Génération PDF pour alerte ${alert._id}`, "info", "pdfService");

    const doc = new PDFDocument({ margin: 40 });
    const chunks = [];
    doc.on("data", (chunk) => chunks.push(chunk));

    // === TITRE PRINCIPAL ===
    doc
      .fontSize(22)
      .fillColor("#005DFF")
      .text("🛰️ TINSFLASH PRO+++ – Alerte Météorologique IA.J.E.A.N.", {
        align: "center",
      })
      .moveDown(1.5);

    // === INFOS PRINCIPALES ===
    doc.fontSize(14).fillColor("#000").text(`Titre : ${alert.title || "Alerte"}`);
    doc.text(`Zone : ${alert.zone || "Inconnue"}`);
    doc.text(`Pays : ${alert.country || "—"}`);
    doc.text(`Type : ${alert.type || "—"}`);
    doc.text(`Niveau : ${alert.level || "—"}`);
    doc.text(`Fiabilité IA : ${alert.reliability?.toFixed(1) || "—"} %`);
    doc.text(`Horodatage : ${new Date(alert.timestamp).toLocaleString()}`);
    doc.moveDown(1);

    // === DESCRIPTION ===
    doc
      .fontSize(12)
      .fillColor("#222")
      .text(
        alert.description ||
          "Analyse issue du moteur TINSFLASH PRO+++ et de l’IA J.E.A.N.\nLes conditions observées ont déclenché une alerte automatique suivant les seuils établis.",
        { align: "justify" }
      );

    // === LIGNE DE SÉPARATION ===
    doc.moveDown(1);
    doc.moveTo(40, doc.y).lineTo(550, doc.y).stroke("#005DFF").moveDown(1);

    // === SIGNATURE TECHNIQUE ===
    doc
      .fontSize(10)
      .fillColor("#555")
      .text(
        `Document généré automatiquement par le moteur TINSFLASH IA.J.E.A.N. – Everest Protocol v3.5 PRO+++
© ${new Date().getFullYear()} Centrale Météorologique TINSFLASH – Tous droits réservés.`,
        { align: "center" }
      );

    doc.end();

    // Fusion des buffers
    const pdfBuffer = await new Promise((resolve, reject) => {
      const bufs = [];
      doc.on("data", (d) => bufs.push(d));
      doc.on("end", () => resolve(Buffer.concat(bufs)));
      doc.on("error", reject);
    });

    await addEngineLog(`✅ PDF généré pour ${alert.title}`, "success", "pdfService");
    return pdfBuffer;
  } catch (err) {
    await addEngineError(`Erreur PDFService : ${err.message}`, "pdfService");
    throw err;
  }
}
