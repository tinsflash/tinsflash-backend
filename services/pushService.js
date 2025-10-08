// ==========================================================
// 🔔 TINSFLASH – Push Notifications Service (Everest Protocol)
// ==========================================================

import webpush from "web-push";
import { addEngineLog } from "./engineState.js";

// ✅ Si pas de clés VAPID, mode console
const vapidPublic = process.env.VAPID_PUBLIC_KEY || "demo-public";
const vapidPrivate = process.env.VAPID_PRIVATE_KEY || "demo-private";

try {
  webpush.setVapidDetails("mailto:info@tinsflash.com", vapidPublic, vapidPrivate);
  console.log("✅ WebPush configuré");
} catch {
  console.warn("⚠️ WebPush non configuré (mode console uniquement)");
}

let subscriptions = [];

/* ===========================================================
   ➕ Enregistrer un nouvel abonnement
   =========================================================== */
export function addSubscription({ sub, zone = "GLOBAL" }) {
  if (!sub || !sub.endpoint) return;
  const exists = subscriptions.find(
    (s) => s.sub.endpoint === sub.endpoint && s.zone === zone
  );
  if (!exists) {
    subscriptions.push({ sub, zone });
    console.log(`✅ Abonnement ajouté (zone ${zone})`);
  }
}

/* ===========================================================
   🚀 Envoyer une notification
   =========================================================== */
export async function sendNotification(title, message, zone = "GLOBAL") {
  const payload = JSON.stringify({ title, message });
  const targets =
    zone === "GLOBAL" ? subscriptions : subscriptions.filter((s) => s.zone === zone);
  if (targets.length === 0) {
    console.log(`⚠️ Aucun abonné pour ${zone}`);
    return [];
  }

  const results = [];
  for (const { sub, zone: z } of targets) {
    try {
      await webpush.sendNotification(sub, payload);
      results.push({ zone: z, status: "ok" });
    } catch (err) {
      console.error(`❌ Push ${z}:`, err.message);
      results.push({ zone: z, status: "fail" });
    }
  }

  await addEngineLog(`🔔 Push envoyé (${title}) vers ${targets.length} abonné(s)`);
  return results;
}
