// public/service-worker.js
self.addEventListener("install", (event) => {
  console.log("✅ Service Worker installé");
});

self.addEventListener("activate", (event) => {
  console.log("⚡ Service Worker activé");
});

// Notifications push locales
self.addEventListener("push", (event) => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || "TINSFLASH Météo";
  const options = {
    body: data.body || "Nouvelle alerte météo disponible",
    icon: "/icons/icon-192.png",
    badge: "/icons/icon-72.png",
  };
  event.waitUntil(self.registration.showNotification(title, options));
});
