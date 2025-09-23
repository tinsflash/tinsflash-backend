// -----------------------------
// 🌍 Console Admin JS
// -----------------------------

// 📜 Charger les logs
async function loadLogs() {
  try {
    const res = await fetch("/api/admin/logs");
    const logs = await res.json();
    document.getElementById("logs").textContent = logs.join("\n");
  } catch (err) {
    document.getElementById("logs").textContent =
      "❌ Impossible de charger les logs : " + err.message;
  }
}

// ⚠️ Charger les alertes
async function loadAlerts() {
  try {
    const res = await fetch("/api/alerts");
    const alerts = await res.json();
    if (!alerts.length) {
      document.getElementById("alerts").textContent =
        "✅ Aucune alerte active pour le moment.";
    } else {
      document.getElementById("alerts").textContent = alerts
        .map(
          (a) =>
            `🚨 [${a.level || "N/A"}] ${a.message || "Message manquant"} (${a.zone || "Zone inconnue"})`
        )
        .join("\n\n");
    }
  } catch (err) {
    document.getElementById("alerts").textContent =
      "❌ Impossible de charger les alertes : " + err.message;
  }
}

// 👥 Charger les utilisateurs
async function loadUsers() {
  try {
    const res = await fetch("/api/admin/users");
    const users = await res.json();
    document.getElementById("users").textContent = JSON.stringify(users, null, 2);
  } catch (err) {
    document.getElementById("users").textContent =
      "❌ Impossible de charger les utilisateurs : " + err.message;
  }
}

// 🚀 Lancer un run SuperForecast
async function launchRun() {
  try {
    document.getElementById("logs").textContent =
      "⚡ Lancement du Run SuperForecast...";
    const res = await fetch("/api/supercalc/run", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lat: 50.5, lon: 4.7 }), // ✅ Belgique par défaut
    });

    const data = await res.json();
    if (data.error) {
      document.getElementById("logs").textContent =
        "❌ Erreur lors du Run : " + data.error;
    } else {
      document.getElementById("logs").textContent =
        "✅ Run terminé\n\n" + (data.logs ? data.logs.join("\n") : "");
    }
  } catch (err) {
    document.getElementById("logs").textContent =
      "❌ Impossible de lancer le Run : " + err.message;
  }
}

// 💬 Envoyer une question à J.E.A.N.
async function sendChat() {
  const input = document.getElementById("chatInput");
  const message = input.value.trim();
  if (!message) return;

  document.getElementById("chatResponse").textContent = "⏳ J.E.A.N. réfléchit...";

  try {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
    });

    const data = await res.json();
    if (data.error) {
      document.getElementById("chatResponse").textContent =
        "❌ Erreur : " + data.error;
    } else {
      document.getElementById("chatResponse").textContent =
        `🤖 (${data.reply?.engine || "J.E.A.N."}) :\n${data.reply?.text || data.reply}`;
    }
  } catch (err) {
    document.getElementById("chatResponse").textContent =
      "❌ Erreur en contactant J.E.A.N. : " + err.message;
  }
}

// 🔄 Rafraîchissement périodique
setInterval(loadLogs, 5000); // toutes les 5s
setInterval(loadAlerts, 15000); // toutes les 15s
setInterval(loadUsers, 20000); // toutes les 20s

// 🔄 Chargement initial
loadLogs();
loadAlerts();
loadUsers();
