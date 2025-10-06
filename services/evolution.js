// PATH: services/evolution.js
// ♻️ Suivi automatique des alertes TINSFLASH
// Analyse les alertes de plusieurs runs, ajuste les niveaux de fiabilité et nettoie les anciennes

import Alert from "../models/Alert.js";
import { addEngineLog, addEngineError } from "./engineState.js";

/**
 * ⚙️ Évolution automatique des alertes selon les nouveaux runs
 * - Si une alerte réapparaît → fiabilité ↑
 * - Si elle disparaît → compteur disparition ↑
 * - Si 3 disparitions consécutives → suppression
 * - Classement automatique selon la fiabilité
 * - Historisation de chaque évolution
 */
export async function evolveAlerts(newAlerts = []) {
  try {
    const prevAlerts = await Alert.find();
    const updated = [];
    const created = [];
    const deleted = [];

    for (const newA of newAlerts) {
      const match = prevAlerts.find(
        (old) =>
          old.title === newA.title &&
          old.country === newA.country &&
          Math.abs(new Date(old.issuedAt) - new Date(newA.createdAt)) <
            1000 * 60 * 60 * 24 // ± 24h
      );

      if (match) {
        // === Réapparition d'une alerte existante ===
        match.certainty = Math.min(100, (match.certainty + newA.confidence) / 2);
        match.disappearedRunsCount = 0;

        if (match.certainty >= 90) match.workflow = "published";
        else if (match.certainty >= 70) match.workflow = "toValidate";
        else if (match.certainty >= 50) match.workflow = "under-surveillance";
        else match.workflow = "archived";

        match.history = match.history || [];
        match.history.push({
          run: Date.now(),
          confidence: newA.confidence,
          workflow: match.workflow,
        });

        await match.save();
        updated.push(match);
      } else {
        // === Nouvelle alerte ===
        const fresh = new Alert({
          title: newA.type,
          description: newA.message,
          country: newA.country || "UNK",
          severity:
            newA.confidence >= 90
              ? "extreme"
              : newA.confidence >= 70
              ? "high"
              : newA.confidence >= 50
              ? "medium"
              : "low",
          certainty: newA.confidence,
          status: "✅ Premier détecteur",
          workflow:
            newA.confidence >= 90
              ? "published"
              : newA.confidence >= 70
              ? "toValidate"
              : newA.confidence >= 50
              ? "under-surveillance"
              : "archived",
          disappearedRunsCount: 0,
          history: [
            {
              run: Date.now(),
              confidence: newA.confidence,
              workflow:
                newA.confidence >= 90
                  ? "published"
                  : newA.confidence >= 70
                  ? "toValidate"
                  : "under-surveillance",
            },
          ],
        });

        await fresh.save();
        created.push(fresh);
      }
    }

    // === Traitement des alertes disparues ===
    for (const old of prevAlerts) {
      const stillActive = newAlerts.some(
        (n) => n.title === old.title && n.country === old.country
      );
      if (!stillActive) {
        old.disappearedRunsCount = (old.disappearedRunsCount || 0) + 1;
        if (old.disappearedRunsCount >= 3) {
          await old.deleteOne();
          deleted.push(old);
        } else {
          old.workflow = "under-surveillance";
          await old.save();
          updated.push(old);
        }
      }
    }

    await addEngineLog(
      `♻️ Évolution des alertes : ${created.length} créées, ${updated.length} mises à jour, ${deleted.length} supprimées`
    );

    return { created, updated, deleted };
  } catch (err) {
    await addEngineError("❌ Erreur évolution alertes : " + err.message);
    console.error("❌ Evolution alerts:", err);
    return { error: err.message };
  }
}

/**
 * 🚀 Lancement manuel ou via le moteur central
 * - Met à jour toutes les alertes existantes
 * - Applique les règles de suppression et de classification
 */
export async function runEvolution() {
  await addEngineLog("🚀 Lancement de la routine d’évolution automatique des alertes...");
  const alerts = await Alert.find();
  const res = await evolveAlerts(alerts);
  await addEngineLog(
    `✅ Évolution terminée (${res.created?.length || 0} créées, ${res.updated?.length || 0} maj, ${res.deleted?.length || 0} supprimées)`
  );
  return res;
}

export default { evolveAlerts, runEvolution };
