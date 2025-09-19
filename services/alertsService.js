// -------------------------
// 🌍 alertsService.js
// Génération d’alertes météo locales/nationales/globales
// -------------------------

export async function getAlerts() {
  try {
    const alerts = [];

    // Exemple : on génère quelques alertes dynamiques
    const rnd = Math.random();

    if (rnd > 0.7) {
      alerts.push({
        level: "orange",
        message: "⚠️ Risque de fortes rafales de vent > 80 km/h",
        reliability: 85,
      });
    }

    if (rnd < 0.3) {
      alerts.push({
        level: "rouge",
        message: "🌊 Risque d’inondations locales",
        reliability: 90,
      });
    }

    // Si rien → retour neutre
    if (alerts.length === 0) {
      alerts.push({
        level: "vert",
        message: "✅ Pas d’alerte particulière actuellement",
        reliability: 100,
      });
    }

    return alerts;
  } catch (err) {
    throw new Error("Erreur génération alertes : " + err.message);
  }
}
