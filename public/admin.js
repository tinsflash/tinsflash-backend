// public/admin.js
console.log("✅ Admin.js chargé – Console Admin prête.");

// Fonction utilitaire pour afficher du JSON proprement
function formatJSON(obj) {
  return JSON.stringify(obj, null, 2);
}

// -------------------------
// 🚀 Lancer un Run SuperForecast
// -------------------------
async function launchRun() {
  try {
    const res = await fetch("/api/supercalc/run", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lat: 50.5, lon: 4.7 }), // 📌 Position par défaut Belgique
    });
    const data = await res.json();
    document.getElementById("logs").innerText += `\n✅ Run lancé: ${formatJSON(data)}`;
  } catch (err) {
    document.getElementById("logs").innerText += `\n❌ Erreur lancement run: ${err.message}`;
  }
}

// -------------------------
// 📜 Charger les Logs
// -------------------------
async function loadLogs() {
  try {
    const res = await fetch("/api/admin/logs");
    const logs = await res.json();
    document.getElementById("logs").innerText = logs.join("\n");
  } catch (err) {
    document.getElementById("logs").innerText = `❌ Erreur chargement logs: ${err.message}`;
  }
}

// -------------------------
// ⚠️ Charger les Alertes
// -------------------------
async function loadAlerts() {
  try {
    const res = await fetch("/api/alerts");
    const alerts = await res.json();
    document.getElementById("alerts").innerText = formatJSON(alerts);
  } catch (err) {
    document.getElementById("alerts").innerText = `❌ Erreur chargement alertes: ${err.message}`;
  }
}

// -------------------------
// 👥 Charger les Utilisateurs
// -------------------------
async function loadUsers() {
  try {
    const res = await fetch("/api/admin/users");
    const users = await res.json();
    document.getElementById("users").innerText = formatJSON(users);
  } catch (err) {
    document.getElementById("users").innerText = `❌ Erreur chargement utilisateurs: ${err.message}`;
  }
}

// -------------------------
// 💬 Chat avec J.E.A.N
// -------------------------
async function askJean() {
  const message = document.getElementById("chatInput").value;
  if (!message) return;

  try {
    const res = await fetch("/api/admin/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
    });

    const data = await res.json();
    document.getElementById("chatLog").innerText += `\n👤 Toi: ${message}\n🤖 J.E.A.N.: ${data.text}`;
  } catch (err) {
    document.getElementById("chatLog").innerText += `\n❌ Erreur chat: ${err.message}`;
  }

  document.getElementById("chatInput").value = "";
}

// -------------------------
// 🔄 Rafraîchir Index (manuellement)
// -------------------------
async function refreshIndex() {
  try {
    const res = await fetch("/api/admin/refresh-index", { method: "POST" });
    const result = await res.json();
    document.getElementById("logs").innerText += `\n🔄 Index rafraîchi: ${formatJSON(result)}`;
  } catch (err) {
    document.getElementById("logs").innerText += `\n❌ Erreur rafraîchissement: ${err.message}`;
  }
}

// -------------------------
// ⏱️ Auto-refresh périodique
// -------------------------
setInterval(loadLogs, 5000); // recharge les logs toutes les 5s
setInterval(loadAlerts, 10000); // recharge alertes toutes les 10s
setInterval(loadUsers, 15000); // recharge stats users toutes les 15s

// Chargement initial
loadLogs();
loadAlerts();
loadUsers();
