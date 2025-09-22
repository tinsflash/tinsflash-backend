// public/admin.js

// --- Logs ---
async function fetchLogs() {
  try {
    const res = await fetch("/api/admin/logs");
    const data = await res.json();
    const logElement = document.getElementById("logs");
    logElement.textContent = data.logs?.join("\n") || "Aucun log disponible.";
  } catch (err) {
    document.getElementById("logs").textContent = "❌ Erreur chargement logs";
  }
}

// --- Alertes ---
async function fetchAlerts() {
  try {
    const res = await fetch("/api/alerts");
    const data = await res.json();
    document.getElementById("alerts").textContent = JSON.stringify(data, null, 2);
  } catch (err) {
    document.getElementById("alerts").textContent = "❌ Erreur chargement alertes";
  }
}

// --- Utilisateurs ---
async function fetchUsers() {
  try {
    const res = await fetch("/api/admin/users");
    const data = await res.json();
    document.getElementById("users").textContent = JSON.stringify(data, null, 2);
  } catch (err) {
    document.getElementById("users").textContent = "❌ Erreur chargement utilisateurs";
  }
}

// --- Lancer un Run ---
async function launchRun() {
  try {
    const res = await fetch("/api/supercalc/run", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    const data = await res.json();
    alert("✅ Run lancé – vérifiez les logs !");
    console.log(data);
  } catch (err) {
    alert("❌ Erreur lancement Run");
  }
}

// --- Chat avec J.E.A.N. ---
function appendMessage(sender, text) {
  const log = document.getElementById("chatLog");
  const div = document.createElement("div");
  div.className = "chat-message";
  div.innerHTML = `<b>${sender}:</b> ${text}`;
  log.appendChild(div);
  log.scrollTop = log.scrollHeight;
}

async function sendToJean() {
  const input = document.getElementById("chatInput");
  const question = input.value.trim();
  if (!question) return;

  appendMessage("👤 Admin", question);
  input.value = "";

  try {
    const res = await fetch("/api/admin/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question }),
    });

    const data = await res.json();
    if (data.answer) {
      appendMessage("🤖 J.E.A.N.", data.answer);
    } else {
      appendMessage("⚠️", data.error || "Erreur JEAN");
    }
  } catch (err) {
    appendMessage("⚠️", "Impossible de contacter JEAN: " + err.message);
  }
}

// --- Rafraîchissement automatique ---
setInterval(fetchLogs, 5000);
setInterval(fetchAlerts, 5000);
setInterval(fetchUsers, 10000);

// --- Initialisation ---
fetchLogs();
fetchAlerts();
fetchUsers();

document.getElementById("chatSend")?.addEventListener("click", sendToJean);
