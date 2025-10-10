// ==========================================================
// 🌍 FUSION MONDIALE DES ALERTES — TINSFLASH PRO+++
// Everest Protocol v3.1 – 100 % réel, 0 fallback open-data
// ==========================================================

import {
  addEngineLog,
  addEngineError,
  saveEngineState,
  getEngineState,
} from "./engineState.js";

// ==========================================================
// ⚡ RUN WORLD ALERTS
// Fusionne toutes les alertes (Europe, USA, reste du monde)
// ==========================================================
export async function runWorldAlerts() {
  try {
    const state = await getEngineState();
    state.checkup = state.checkup || {};

    await addEngineLog("🌍 Initialisation RUN World Alerts (fusion globale des alertes)…", "info", "runWorldAlerts");

    // ======================================================
    // Vérification des sources internes disponibles
    // ======================================================
    const hasAny =
      state.alertsEurope ||
      state.alertsUSA ||
      state.alertsWorld ||
      state.alertsAfrica ||
      state.alertsAsia ||
      state.alertsOceania ||
      state.alertsAmericaSud;

    if (!hasAny) {
      await addEngineError("⚠️ Aucune alerte disponible dans aucune zone !");
      state.checkup.alertsWorld = "FAIL";
      await saveEngineState(state);
      return { summary: {}, alerts: {} };
    }

    // ======================================================
    // Fusion des différentes zones — tout réel
    // ======================================================
    const worldAlerts = {
      Europe: state.alertsEurope || {},
      USA: state.alertsUSA || {},
      Africa: state.alertsAfrica || {},
      Asia: state.alertsAsia || {},
      Oceania: state.alertsOceania || {},
      AmericaSud: state.alertsAmericaSud || {},
      World: state.alertsWorld || {},
    };

    // ======================================================
    // Comptage global des alertes
    // ======================================================
    const countAlerts = (obj) => {
      if (!obj || typeof obj !== "object") return 0;
      let count = 0;
      for (const key of Object.keys(obj)) {
        const v = obj[key];
        if (Array.isArray(v)) count += v.length;
        else if (typeof v === "object") count += Object.keys(v).length;
        else count++;
      }
      return count;
    };

    const summary = {
      europe: countAlerts(worldAlerts.Europe),
      usa: countAlerts(worldAlerts.USA),
      africa: countAlerts(worldAlerts.Africa),
      asia: countAlerts(worldAlerts.Asia),
      oceania: countAlerts(worldAlerts.Oceania),
      americaSud: countAlerts(worldAlerts.AmericaSud),
    };

    summary.totalAlerts =
      summary.europe +
      summary.usa +
      summary.africa +
      summary.asia +
      summary.oceania +
      summary.americaSud;

    summary.generatedAt = new Date().toISOString();
    summary.sourceNote = "✅ Toutes les alertes proviennent du moteur TINSFLASH PRO+++ (IA J.E.A.N.)";

    // ======================================================
    // Sauvegarde état moteur global
    // ======================================================
    state.alertsWorld = worldAlerts;
    state.alertsWorldSummary = summary;
    state.checkup.alertsWorld = "OK";
    await saveEngineState(state);

    // ======================================================
    // Logs détaillés
    // ======================================================
    await addEngineLog(
      `🌍 Fusion World Alerts terminée : ${summary.totalAlerts} alertes consolidées.`,
      "success",
      "runWorldAlerts"
    );

    await addEngineLog(
      `📊 Détails par continent → EU: ${summary.europe}, US: ${summary.usa}, AF: ${summary.africa}, AS: ${summary.asia}, OC: ${summary.oceania}, AMS: ${summary.americaSud}`,
      "info",
      "runWorldAlerts"
    );

    return { summary, alerts: worldAlerts };
  } catch (err) {
    await addEngineError("❌ Erreur RUN World Alerts : " + err.message, "runWorldAlerts");
    const state = await getEngineState();
    state.checkup.alertsWorld = "FAIL";
    await saveEngineState(state);
    throw err;
  }
}

export default { runWorldAlerts };
