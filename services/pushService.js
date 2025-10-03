// services/pushService.js
import webpush from "web-push";

// ✅ Config avec tes clés VAPID
webpush.setVapidDetails(
  "mailto:info@tinsflash.com",
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

// Stockage temporaire des abonnements
let subscriptions = [];

// Enregistrer un nouvel abonnement
export function addSubscription(sub) {
  subscriptions.push(sub);
}

// Envoyer une notification à tous
export async function sendNotification(title, message) {
  const payload = JSON.stringify({ title, message });
  const results = [];

  for (const sub of subscriptions) {
    try {
      const res = await webpush.sendNotification(sub, payload);
      results.push({ sub, status: "ok", res });
    } catch (err) {
      console.error("❌ Push error:", err.message);
      results.push({ sub, status: "fail", error: err.message });
    }
  }
  return results;
}
