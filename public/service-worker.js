// ---------------------------
// Service Worker - TINSFLASH
// ---------------------------

// Dernier run connu
let lastRunTimestamp = null;

// ✅ Installation
self.addEventListener("install", () => {
  console.log("✅ Service Worker installé");
  self.skipWaiting();
});

// ✅ Activation
self.addEventListener("activate", (event) => {
  console.log("🚀 Service Worker activé");
  event.waitUntil(self.clients.claim());
});

// ✅ Notifications push (envoyées par le serveur avec /api/send-notif)
self.addEventListener("push", (event) => {
  try {
    const data = event.data ? event.data.json() : {};
    self.registration.showNotification(data.title || "🌍 TINSFLASH", {
      body: data.message || "Nouvelle mise à jour météo disponible",
      icon: "/avatar-jean.png",
      badge: "/avatar-jean.png",
      vibrate: [200, 100, 200],
    });
  } catch (err) {
    console.error("❌ Erreur push:", err);
  }
});

// ✅ Vérifie toutes les minutes si un nouveau run est dispo
setInterval(async () => {
  try {
    const resState = await fetch("/api/engine-state");
    const state = await resState.json();

    if (!state?.lastRun) return;

    if (lastRunTimestamp !== state.lastRun) {
      lastRunTimestamp = state.lastRun;

      // 🔹 Prévisions locales (défaut Bruxelles si pas de géoloc)
      const resForecast = await fetch("/api/superforecast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lat: 50.85, lon: 4.35, country: "BE" })
      });
      const forecast = await resForecast.json();

      // 🔹 Alertes actives
      const resAlerts = await fetch("/api/alerts");
      const alerts = await resAlerts.json();

      let alertText = "";
      if (alerts && alerts.length > 0) {
        const important = alerts[0]; // première comme prioritaire
        alertText = `⚠️ ${important.title || "Alerte"} – ${important.level || "intensité inconnue"}%`;
      }

      const text = forecast?.forecast
        ? `Prévisions : ${forecast.forecast}${alertText ? "\n" + alertText : ""}`
        : `Prévisions indisponibles.${alertText ? "\n" + alertText : ""}`;

      // 🔔 Notification auto
      self.registration.showNotification("🌍 J.E.A.N. – TINSFLASH", {
        body: text,
        icon: "/avatar-jean.png",
        badge: "/avatar-jean.png",
        vibrate: [200, 100, 200],
      });
    }
  } catch (err) {
    console.error("❌ Erreur notifications auto:", err);
  }
}, 60000); // toutes les minutes
