// public/admin.js

// 🚀 Lancer un run
async function launchRun() {
  try {
    const res = await fetch("/api/admin/run", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lat: 50.85, lon: 4.35 }) // Bruxelles par défaut
    });
    const data = await res.json();
    if (data.success) {
      alert("✅ Run lancé !");
    } else {
      alert("❌ Erreur lors du lancement du run");
    }
  } catch (err) {
    alert("❌ Erreur connexion serveur");
  }
}

// 📜 Charger les logs
async function loadLogs() {
  try {
    const res = await fetch("/api/admin/logs");
    const data = await res.json();
    document.getElementById("logs").textContent = data.join("\n");
  } catch (err) {
    document.getElementById("logs").textContent = "⚠️ Impossible de charger les logs";
  }
}

// ⚠️ Charger les alertes
async function loadAlerts() {
  try {
    const res = await fetch("/api/admin/alerts");
    const data = await res.json();
    document.getElementById("alerts").textContent = JSON.stringify(data, null, 2);
  } catch (err) {
    document.getElementById("alerts").textContent = "⚠️ Impossible de charger les alertes";
  }
}

// 🤖 Chat avec J.E.A.N.
async function sendMessage() {
  const input = document.getElementById("chatInput").value;
  const chatBox = document.getElementById("chatBox");

  if (!input) return;

  chatBox.innerHTML += `👤: ${input}\n`;

  try {
    const res = await fetch("/api/admin/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question: input })
    });
    const data = await res.json();

    if (data.success) {
      chatBox.innerHTML += `🤖 JEAN: ${data.answer}\n`;
    } else {
      chatBox.innerHTML += `⚠️ JEAN n’est pas dispo\n`;
    }
  } catch {
    chatBox.innerHTML += `⚠️ Erreur de connexion\n`;
  }

  document.getElementById("chatInput").value = "";
}

// Auto-refresh logs + alertes
setInterval(loadLogs, 5000);
setInterval(loadAlerts, 10000);
