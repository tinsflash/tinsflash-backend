// PATH: services/evolution.js
// ♻️ Suivi automatique des alertes sur plusieurs runs
// Compare les alertes actuelles avec celles précédentes et ajuste leur statut

import Alert from "../models/Alert.js";
import { addEngineLog, addEngineError } from "./engineState.js";

/**
 * Compare et met à jour les alertes selon les nouveaux runs.
 * - Si une alerte réapparaît → on augmente sa fiabilité
 * - Si elle disparaît → on incrémente disappearedRunsCount
 * - Si disappearedRunsCount >= 3 → suppression
 * - Si confiance >= 90 → publiée
 * - Si 70–89 → à valider
 * - Si 50–69 → sous surveillance
 * @param {Array} newAlerts alertes du run actuel
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
          Math.abs(
            new Date(old.issuedAt).getTime() - new Date(newA.createdAt).getTime()
          ) < 1000 * 60 * 60 * 24 // même jour ±1
      );

      if (match) {
        // === Réapparition : on actualise
        match.certainty = Math.min(100, (match.certainty + newA.confidence) / 2);
        match.disappearedRunsCount = 0;

        if (match.certainty >= 90) match.workflow = "published";
        else if (match.certainty >= 70) match.workflow = "toValidate";
        else if (match.certainty >= 50) match.workflow = "under-surveillance";

        match.history.push({
          run: Date.now(),
          confidence: newA.confidence,
          status: match.workflow,
        });

        await match.save();
        updated.push(match);
      } else {
        // === Nouvelle alerte
        const fresh = new Alert({
          title: newA.type,
          description: newA.message,
          country: newA.country || "UNK",
          severity:
            newA.confidence >= 90
              ? "extreme"
              : newA.confidence >= 70
              ? "high"
              : "medium",
          certainty: newA.confidence,
          status: "✅ Premier détecteur",
          workflow:
            newA.confidence >= 90
              ? "published"
              : newA.confidence >= 70
              ? "toValidate"
              : "under-surveillance",
        });
        await fresh.save();
        created.push(fresh);
      }
    }

    // === Alertes disparues
    for (const old of prevAlerts) {
      const stillThere = newAlerts.some(
        (n) => n.title === old.title && n.country === old.country
      );
      if (!stillThere) {
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
      `♻️ Évolution alertes: +${created.length} créées, ${updated.length} maj, ${deleted.length} supprimées`
    );

    return { created, updated, deleted };
  } catch (err) {
    await addEngineError("Erreur évolution alertes: " + err.message);
    console.error("❌ Evolution alerts:", err);
    return { error: err.message };
  }
}

/**
 * Lancement manuel de la routine (utilisée par le moteur principal ou la console admin)
 */
export async function runEvolution() {
  await addEngineLog("🚀 Lancement évolution automatique des alertes...");
  const alerts = await Alert.find();
  const res = await evolveAlerts(alerts);
  await addEngineLog(
    `✅ Évolution terminée (${res.created?.length || 0} créées, ${res.updated?.length || 0} maj, ${res.deleted?.length || 0} supprimées)`
  );
  return res;
}

export default { evolveAlerts, runEvolution };
