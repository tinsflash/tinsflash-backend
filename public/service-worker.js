// service-worker.js
let lastRunTimestamp = null;

// Install & Activate
self.addEventListener("install", () => {
  console.log("✅ Service Worker installé");
  self.skipWaiting();
});
self.addEventListener("activate", () => {
  console.log("🚀 Service Worker activé");
});

// Vérifie toutes les minutes si un nouveau run est dispo
setInterval(async () => {
  try {
    const resState = await fetch("/api/engine-state");
    const state = await resState.json();

    if (!state?.lastRunFinished) return;

    if (lastRunTimestamp !== state.lastRunFinished) {
      lastRunTimestamp = state.lastRunFinished;

      // Récupère prévisions locales (défaut Bruxelles si pas de géoloc)
      const resForecast = await fetch("/api/superforecast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lat: 50.85, lon: 4.35, country: "BE" })
      });
      const forecast = await resForecast.json();

      // Récupère alertes actives
      const resAlerts = await fetch("/api/alerts");
      const alerts = await resAlerts.json();

      let alertText = "";
      if (alerts && alerts.length > 0) {
        const important = alerts[0]; // prend la première comme prioritaire
        alertText = `⚠️ ${important.data?.type || "Alerte"} – ${important.data?.intensité || "intensité inconnue"}`;
      }

      const text = forecast?.forecast
        ? `Prévisions : ${forecast.forecast}${alertText ? "\n" + alertText : ""}`
        : `Prévisions indisponibles.${alertText ? "\n" + alertText : ""}`;

      // Notification
      self.registration.showNotification("🌍 J.E.A.N. – TINSFLASH", {
        body: text,
        icon: "/avatar-jean.png",
        badge: "/avatar-jean.png",
        vibrate: [200, 100, 200],
      });
    }
  } catch (err) {
    console.error("❌ Erreur notifications:", err);
  }
}, 60000); // toutes les minutes
