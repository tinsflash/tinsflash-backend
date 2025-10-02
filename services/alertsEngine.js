// services/alertsEngine.js
// ✅ Classement final des alertes
// Règle nucléaire : >90% publié, 70–90% à valider, <70% sous surveillance

/**
 * Classe une alerte météo en fonction de sa fiabilité
 * @param {Object} alertData - données enrichies (IA + détecteurs + facteurs)
 * @returns {Object} alerte enrichie avec statut final
 */
export function classifyAlerts(alertData) {
  if (!alertData) {
    return { status: "archived", reason: "Aucune donnée" };
  }

  const confidence =
    alertData.confidence ||
    alertData.fiabilite ||
    alertData.reliability ||
    0;

  let status;
  if (confidence >= 90) {
    status = "published";
  } else if (confidence >= 70) {
    status = "toValidate";
  } else {
    status = "under-surveillance"; // ✅ suivi continu
  }

  return {
    ...alertData,
    confidence,
    status,
    disappearedRunsCount: alertData.disappearedRunsCount ?? 0,
    history: Array.isArray(alertData.history)
      ? [...alertData.history, { run: Date.now(), confidence }]
      : [{ run: Date.now(), confidence }],
    classifiedAt: new Date().toISOString(),
  };
}

/**
 * Classe un lot d’alertes (utile pour batch continental/global)
 * @param {Array} alerts
 * @returns {Array} alertes classées
 */
export function bulkClassifyAlerts(alerts = []) {
  return alerts.map(a => classifyAlerts(a));
}
