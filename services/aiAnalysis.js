// ==========================================================
// 🤖 TINSFLASH – aiAnalysis.js (v5.0 PRO+++ REAL FULL CONNECT)
// ==========================================================
// IA J.E.A.N. – moteur d’analyse réel et persistant.
// Lecture hybride : fichiers extraits + fallback MongoDB.
// Compatible avec toutes les zones (Bouké, Belgique, Europe, etc.)
// ==========================================================

import fs from "fs";
import path from "path";
import Extraction from "../models/Extraction.js";
import { addEngineLog, addEngineError, getLastExtraction } from "./engineState.js";
import { checkAIModels } from "./aiModelsChecker.js";

// ==========================================================
// 🧠 Fonction principale – IA J.E.A.N.
// ==========================================================
export async function runAIAnalysis() {
  try {
    await addEngineLog("🧠 Démarrage IA J.E.A.N. – Fusion multi-zones", "info", "IA.JEAN");

    // ------------------------------------------------------
    // 📡 Lecture de la dernière extraction
    // ------------------------------------------------------
    const last = await getLastExtraction();
    if (!last || !last.files?.length) {
      await addEngineError("Aucune extraction trouvée pour analyse IA", "IA.JEAN");
      return { indiceGlobal: 0, synthese: "Aucune extraction disponible" };
    }

    let results = [];

    // ------------------------------------------------------
    // 📦 Lecture fichiers locaux (prioritaire)
    // ------------------------------------------------------
    for (const filePath of last.files) {
      try {
        const fullPath = path.resolve(filePath);
        if (fs.existsSync(fullPath)) {
          const content = JSON.parse(fs.readFileSync(fullPath, "utf8"));
          if (Array.isArray(content)) results.push(...content);
          else if (content?.phase1Results) results.push(...content.phase1Results);
          await addEngineLog(`📂 Données chargées depuis ${filePath} (${content.length || 0} enregistrements)`, "info", "IA.JEAN");
        }
      } catch (err) {
        await addEngineError(`Erreur lecture fichier IA : ${filePath} – ${err.message}`, "IA.JEAN");
      }
    }

    // ------------------------------------------------------
    // 🔁 Fallback MongoDB si aucun fichier valide
    // ------------------------------------------------------
    if (!results || results.length === 0) {
      const label = last.zones?.[0] || "Bouké";
      const doc = await Extraction.findOne({ label }).sort({ ts: -1 }).lean();
      if (doc?.data && Array.isArray(doc.data) && doc.data.length > 0) {
        results = doc.data;
        await addEngineLog(`🔁 Fallback MongoDB utilisé pour ${label}`, "info", "IA.JEAN");
      } else {
        await addEngineError("💥 Aucune donnée valide trouvée (ni fichier, ni DB)", "IA.JEAN");
        return { indiceGlobal: 0, synthese: "Aucune donnée disponible" };
      }
    }

    // ------------------------------------------------------
    // 🧮 Analyse interne – cohérence physique et relief
    // ------------------------------------------------------
    const valid = results.filter(r => r.temperature !== null && r.lat && r.lon);
    const baseIndice = Math.min(100, Math.round((valid.length / results.length) * 100));
    const poidsRelief = Math.min(1.25, 1 + Math.abs(valid[0]?.lat ?? 0) / 90);
    let indiceGlobal = Math.round(baseIndice * poidsRelief);

    // ------------------------------------------------------
    // 📅 Pénalité fraîcheur (données trop anciennes)
    // ------------------------------------------------------
    const total = valid.length || 1;
    const fresh = valid.filter(r => r.freshnessScore >= 80).length;
    const freshnessGlobal = Math.round((fresh / total) * 100);
    const penalty = Math.round((100 - freshnessGlobal) * 0.25);
    indiceGlobal = Math.max(0, indiceGlobal - penalty);

    await addEngineLog(
      `📅 Fraîcheur moyenne ${freshnessGlobal}% – pénalité ${penalty}% – indice intermédiaire ${indiceGlobal}%`,
      "info",
      "IA.JEAN"
    );

    // ------------------------------------------------------
    // 🤖 Analyse IA externe (GraphCast / Pangu / ECMWF-AI)
    // ------------------------------------------------------
    const lat = valid[0]?.lat ?? 50;
    const lon = valid[0]?.lon ?? 4;
    const { results: iaExterne, aiFusion } = await checkAIModels(lat, lon);

    let fusionOK = false;
    if (aiFusion && aiFusion.reliability > 0) {
      fusionOK = true;
      const deltaT = aiFusion.temperature - valid[0].temperature;
      await addEngineLog(
        `🤖 IA externe active (${Math.round(aiFusion.reliability * 100)}%) – ΔT:${deltaT?.toFixed?.(1)}°C`,
        "info",
        "IA.JEAN"
      );
    } else {
      await addEngineError("⚠️ Aucune IA externe valide – analyse interne uniquement", "IA.JEAN");
    }

    // ------------------------------------------------------
    // 🧩 Fusion IA interne + externe (pondération)
    // ------------------------------------------------------
    const pondGlobal = fusionOK
      ? Math.min(100, Math.round(((indiceGlobal + aiFusion.reliability * 100) / 2) * poidsRelief))
      : indiceGlobal;

    const synthese = fusionOK
      ? `Fusion IA réussie (${Math.round(aiFusion.reliability * 100)}% cohérence)`
      : "Analyse IA interne uniquement (mode local)";

    // ------------------------------------------------------
    // 💾 Journalisation du résultat final
    // ------------------------------------------------------
    await addEngineLog(
      `🧠 IA J.E.A.N. – Indice final ${pondGlobal}% (${synthese}) – Zones : ${last.zones.join(", ")}`,
      "success",
      "IA.JEAN"
    );

    // ------------------------------------------------------
    // 🗄️ Sauvegarde du résultat final (MongoDB historique IA)
    // ------------------------------------------------------
    try {
      await Extraction.create({
        label: `IA-${last.zones?.[0] || "Global"}`,
        ts: new Date(),
        data: { indiceGlobal: pondGlobal, synthese, freshnessGlobal, iaExterne, aiFusion },
      });
      await addEngineLog("💾 Résultat IA J.E.A.N. archivé dans MongoDB", "info", "IA.JEAN");
    } catch (err) {
      await addEngineError(`Erreur sauvegarde résultat IA : ${err.message}`, "IA.JEAN");
    }

    // ------------------------------------------------------
    // ✅ Retour du résultat complet
    // ------------------------------------------------------
    return {
      indiceGlobal: pondGlobal,
      synthese,
      freshnessGlobal,
      iaExterne,
      aiFusion,
      lastExtraction: last,
    };

  } catch (e) {
    await addEngineError("Erreur IA J.E.A.N. : " + e.message, "IA.JEAN");
    console.error("❌ Erreur IA J.E.A.N. :", e.message);
    return { error: e.message };
  }
}

// ==========================================================
// 📤 Export global
// ==========================================================
export default { runAIAnalysis };
