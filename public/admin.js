// public/admin.js

// --- Rafraîchir les logs ---
async function fetchLogs() {
  try {
    const res = await fetch("/api/admin/logs");
    const data = await res.json();

    if (data.logs && Array.isArray(data.logs)) {
      document.getElementById("logs").textContent = data.logs.join("\n");
    } else {
      document.getElementById("logs").textContent = "⚠️ Aucun log disponible.";
    }
  } catch (err) {
    document.getElementById("logs").textContent =
      "❌ Erreur chargement logs : " + err.message;
  }
}

// --- Rafraîchir les alertes ---
async function fetchAlerts() {
  try {
    const res = await fetch("/api/alerts");
    const data = await res.json();
    document.getElementById("alerts").textContent = JSON.stringify(data, null, 2);
  } catch (err) {
    document.getElementById("alerts").textContent =
      "❌ Erreur chargement alertes : " + err.message;
  }
}

// --- Rafraîchir les utilisateurs ---
async function fetchUsers() {
  try {
    const res = await fetch("/api/admin/users");
    const data = await res.json();
    document.getElementById("users").textContent = JSON.stringify(data, null, 2);
  } catch (err) {
    document.getElementById("users").textContent =
      "❌ Erreur chargement utilisateurs : " + err.message;
  }
}

// --- Lancer un Run ---
async function launchRun() {
  try {
    const res = await fetch("/api/supercalc/run", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lat: 50.5, lon: 4.7 }), // valeurs par défaut
    });

    const data = await res.json();
    alert("✅ Run lancé – surveillez les logs !");
    console.log("Résultat Run:", data);

    // Forcer rafraîchissement des logs après lancement
    fetchLogs();
  } catch (err) {
    alert("❌ Erreur lancement Run : " + err.message);
  }
}

// --- Chat avec J.E.A.N. ---
async function sendChat() {
  const input = document.getElementById("chatInput");
  const msg = input.value.trim();
  if (!msg) return;

  const log = document.getElementById("chatLog");
  log.innerHTML += `<div class="chat-message admin">👤 Admin: ${msg}</div>`;
  input.value = "";

  try {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: msg }),
    });

    const data = await res.json();
    const reply = data.reply || "⚠️ Pas de réponse de J.E.A.N.";

    log.innerHTML += `<div class="chat-message jean">🤖 J.E.A.N.: ${reply}</div>`;
    log.scrollTop = log.scrollHeight;
  } catch (err) {
    log.innerHTML += `<div class="chat-message jean">❌ Erreur chat: ${err.message}</div>`;
  }
}

// --- Rafraîchissement manuel ---
function refreshAll() {
  fetchLogs();
  fetchAlerts();
  fetchUsers();
}

// --- Rafraîchissement auto toutes les 10s ---
setInterval(fetchLogs, 10000);
setInterval(fetchAlerts, 15000);
setInterval(fetchUsers, 20000);

// --- Premier chargement ---
refreshAll();

// --- Brancher le bouton de chat ---
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("chatSend")?.addEventListener("click", sendChat);
  document.getElementById("refreshBtn")?.addEventListener("click", refreshAll);
});
