// ==========================================================
// 🔔 TINSFLASH – notificationService.js
// v1.0 REAL CONNECT – Notifications horaires "Mode Tocsin"
// ==========================================================
// Rôle : agréger les pré-alertes créées <60 min et notifier
// le responsable (Patrick) via Telegram ou Pushover.
// ==========================================================

import axios from "axios";
import mongoose from "mongoose";
import { addEngineLog, addEngineError } from "./engineState.js";

// ---------------- Configuration notification ----------------
// Choisis ton canal : "telegram" ou "pushover"
const CHANNEL = process.env.TINSFLASH_NOTIFY_CHANNEL || "telegram";

// Telegram (par défaut)
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "";
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || "";

// Pushover (optionnel)
const PUSHOVER_TOKEN = process.env.PUSHOVER_TOKEN || "";
const PUSHOVER_USER = process.env.PUSHOVER_USER || "";

// ------------------------------------------------------------
const WatchdogPrealert =
  mongoose.models.watchdog_prealerts ||
  mongoose.model(
    "watchdog_prealerts",
    new mongoose.Schema({}, { strict: false }),
    "watchdog_prealerts"
  );

// ------------------------------------------------------------
async function getRecentPrealerts(minutes = 60) {
  const cutoff = new Date(Date.now() - minutes * 60 * 1000);
  return await WatchdogPrealert.find({ createdAt: { $gte: cutoff } }).lean();
}

// ------------------------------------------------------------
async function sendTelegramMessage(text) {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) return false;
  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
  await axios.post(url, { chat_id: TELEGRAM_CHAT_ID, text });
  return true;
}

// ------------------------------------------------------------
async function sendPushoverMessage(text) {
  if (!PUSHOVER_TOKEN || !PUSHOVER_USER) return false;
  await axios.post("https://api.pushover.net/1/messages.json", {
    token: PUSHOVER_TOKEN,
    user: PUSHOVER_USER,
    message: text,
  });
  return true;
}

// ------------------------------------------------------------
export async function runNotificationDigest() {
  try {
    const alerts = await getRecentPrealerts(60);
    if (!alerts.length) return;

    const grouped = alerts.reduce((acc, a) => {
      const key = `${a.phenomenon}-${a.level}`;
      acc[key] = acc[key] ? acc[key] + 1 : 1;
      return acc;
    }, {});

    const summary = Object.entries(grouped)
      .map(([k, v]) => `• ${k.replace("-", " ")} : ${v}`)
      .join("\n");

    const maxVal = Math.max(...alerts.map((a) => a.value ?? 0));
    const msg =
      `🚨 *TINSFLASH – Pré-alertes automatiques (dernière heure)*\n\n` +
      `${summary}\n\nMax : ${maxVal}\n` +
      `_Heure : ${new Date().toLocaleTimeString("fr-BE")}_`;

    if (CHANNEL === "telegram") await sendTelegramMessage(msg);
    else if (CHANNEL === "pushover") await sendPushoverMessage(msg);

    await addEngineLog(`🔔 Notification envoyée (${alerts.length} pré-alertes)`, "info", "NOTIFY");
  } catch (e) {
    await addEngineError("Erreur notificationDigest : " + e.message, "NOTIFY");
  }
}

export default { runNotificationDigest };
