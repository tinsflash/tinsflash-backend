import webpush from "web-push";

// ✅ Config avec tes clés VAPID
webpush.setVapidDetails(
  "mailto:info@tinsflash.com",
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

// Stockage temporaire des abonnements
// Format : { sub, zone }
let subscriptions = [];

// 🔹 Enregistrer un nouvel abonnement (avec zone)
export function addSubscription({ sub, zone = "GLOBAL" }) {
  if (!sub || !sub.endpoint) {
    console.warn("⚠️ Abonnement invalide ignoré");
    return;
  }

  // Évite les doublons
  const exists = subscriptions.find(
    (s) => s.sub.endpoint === sub.endpoint && s.zone === zone
  );
  if (!exists) {
    subscriptions.push({ sub, zone });
    console.log(`✅ Nouvel abonnement ajouté (zone: ${zone})`);
  }
}

// 🔹 Envoyer une notification (option: filtrage par zone)
export async function sendNotification(title, message, zone = "GLOBAL") {
  const payload = JSON.stringify({ title, message });
  const results = [];

  // Cible abonnés selon la zone (ou tous si GLOBAL)
  const targets = zone === "GLOBAL"
    ? subscriptions
    : subscriptions.filter((s) => s.zone === zone);

  if (targets.length === 0) {
    console.log(`⚠️ Aucun abonné pour la zone ${zone}`);
    return [];
  }

  for (const { sub, zone: z } of targets) {
    try {
      const res = await webpush.sendNotification(sub, payload);
      results.push({ zone: z, endpoint: sub.endpoint, status: "ok" });
    } catch (err) {
      console.error(`❌ Push error (${z}):`, err.message);
      results.push({ zone: z, endpoint: sub.endpoint, status: "fail", error: err.message });
    }
  }

  return results;
}
