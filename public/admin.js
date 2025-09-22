// -------------------------
// 🌍 Console Admin – Front
// -------------------------

async function launchRun() {
  try {
    const response = await fetch("/api/admin/run-superforecast", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lat: 50.85, lon: 4.35 }), // par défaut Bruxelles
    });

    const data = await response.json();
    if (data.success) {
      alert("✅ Run lancé !");
      getLogs();
      getAlerts();
    } else {
      alert("❌ Erreur lors du lancement du run : " + data.error);
    }
  } catch (err) {
    alert("❌ Impossible de lancer le run : " + err.message);
  }
}

// -------------------------
// 📜 Récupérer Logs
// -------------------------
async function getLogs() {
  try {
    const response = await fetch("/api/admin/logs");
    const logs = await response.json();
    const logsContainer = document.getElementById("logs");
    logsContainer.innerText = logs.join("\n"); // affichage sur plusieurs lignes
  } catch (err) {
    document.getElementById("logs").innerText = "❌ Erreur logs : " + err.message;
  }
}

// -------------------------
// ⚠️ Récupérer Alertes
// -------------------------
async function getAlerts() {
  try {
    const response = await fetch("/api/admin/alerts");
    const alerts = await response.json();
    document.getElementById("alerts").innerText = JSON.stringify(alerts, null, 2);
  } catch (err) {
    document.getElementById("alerts").innerText = "❌ Erreur alertes : " + err.message;
  }
}

// -------------------------
// 👥 Récupérer Utilisateurs
// -------------------------
async function getUsers() {
  try {
    const response = await fetch("/api/admin/users");
    const users = await response.json();
    document.getElementById("users").innerText = JSON.stringify(users, null, 2);
  } catch (err) {
    document.getElementById("users").innerText = "❌ Erreur utilisateurs : " + err.message;
  }
}

// -------------------------
// 🤖 Chat avec J.E.A.N
// -------------------------
async function sendMessage() {
  const input = document.getElementById("chatInput");
  const message = input.value;
  if (!message) return;

  const chatBox = document.getElementById("chatBox");
  chatBox.innerHTML += `<div>👤 ${message}</div>`;
  input.value = "";

  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
    });

    const data = await response.json();
    chatBox.innerHTML += `<div>🤖 ${data.reply || "⚠️ JEAN n’est pas disponible pour le moment."}</div>`;
  } catch (err) {
    chatBox.innerHTML += `<div>❌ Erreur chat : ${err.message}</div>`;
  }
}

// -------------------------
// ⏳ Auto-refresh
// -------------------------
setInterval(() => {
  getLogs();
  getAlerts();
  getUsers();
}, 10000); // toutes les 10s

// Initial load
getLogs();
getAlerts();
getUsers();
