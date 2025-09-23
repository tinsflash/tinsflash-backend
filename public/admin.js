// public/admin.js

async function launchRun() {
  const logsBox = document.getElementById("logs");
  logsBox.innerText = "🚀 Lancement du Run en cours...\n";

  try {
    const response = await fetch("/api/supercalc/run", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        lat: 50.5,  // ✅ Coordonnées par défaut (Belgique, à remplacer si besoin)
        lon: 4.7
      })
    });

    const data = await response.json();

    if (data.error) {
      logsBox.innerText += `❌ Erreur: ${data.error}\n`;
    } else {
      logsBox.innerText += `✅ Run terminé avec succès\n`;
      logsBox.innerText += (data.logs || []).join("\n") + "\n";
    }
  } catch (err) {
    logsBox.innerText += `❌ Erreur JS: ${err.message}\n`;
  }
}

// ✅ Récupération périodique des logs
async function refreshLogs() {
  try {
    const response = await fetch("/api/admin/logs");
    const data = await response.json();
    document.getElementById("logs").innerText = data.join("\n");
  } catch (err) {
    document.getElementById("logs").innerText += `\n⚠️ Impossible de charger les logs: ${err.message}`;
  }
}

// ✅ Récupération périodique des utilisateurs
async function refreshUsers() {
  try {
    const response = await fetch("/api/admin/users");
    const data = await response.json();
    document.getElementById("users").innerText = JSON.stringify(data, null, 2);
  } catch (err) {
    document.getElementById("users").innerText = "⚠️ Erreur chargement utilisateurs";
  }
}

// ✅ Récupération périodique des alertes
async function refreshAlerts() {
  try {
    const response = await fetch("/api/alerts");
    const data = await response.json();
    document.getElementById("alerts").innerText = JSON.stringify(data, null, 2);
  } catch (err) {
    document.getElementById("alerts").innerText = "⚠️ Erreur chargement alertes";
  }
}

// ✅ Chat avec J.E.A.N.
async function sendMessage() {
  const input = document.getElementById("chatInput").value;
  const responseBox = document.getElementById("chatResponse");

  responseBox.innerText = "💬 Envoi en cours...";

  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: input }),
    });

    const data = await response.json();
    responseBox.innerText = data.reply || data.text || "⚠️ Pas de réponse.";
  } catch (err) {
    responseBox.innerText = "❌ Erreur: " + err.message;
  }
}

// ✅ Rafraîchissement auto toutes les 5s
setInterval(refreshLogs, 5000);
setInterval(refreshUsers, 10000);
setInterval(refreshAlerts, 15000);
