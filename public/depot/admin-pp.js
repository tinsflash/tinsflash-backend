const API_BASE = "https://tinsflash-backend.onrender.com";

// Podcasts
async function generatePodcast(type) {
  const status = document.getElementById("podcast-status");
  status.innerHTML = "⏳ Génération...";
  try {
    const res = await fetch(`${API_BASE}/podcast/generate?type=${type}`);
    const data = await res.json();
    status.innerHTML = `✅ Podcast généré : ${data.forecast}`;
  } catch (err) {
    status.innerHTML = "❌ Erreur podcast";
  }
}

// Alertes 70–90%
async function loadPendingAlerts() {
  const container = document.getElementById("alerts-pending");
  try {
    const res = await fetch(`${API_BASE}/alerts?pending=true`);
    const data = await res.json();
    if (data.alerts?.length) {
      container.innerHTML = data.alerts.map(
        a => `<div>⚠️ ${a.type} – Fiabilité ${a.reliability}% 
        <button>Valider</button> <button>Refuser</button></div>`
      ).join("");
    } else {
      container.innerHTML = "Aucune alerte en attente.";
    }
  } catch {
    container.innerHTML = "❌ Erreur chargement alertes";
  }
}

// Codes promo
async function generateCode(type) {
  const status = document.getElementById("code-status");
  try {
    const res = await fetch(`${API_BASE}/codes/generate?type=${type}`);
    const data = await res.json();
    status.innerHTML = `✅ Code généré : ${data.code} (${data.duration})`;
  } catch {
    status.innerHTML = "❌ Erreur code promo";
  }
}

// Chat IA J.E.A.N
async function sendMessage() {
  const input = document.getElementById("chat-input");
  const box = document.getElementById("chat-box");
  const msg = input.value.trim();
  if (!msg) return;

  box.innerHTML += `<div><b>Vous:</b> ${msg}</div>`;
  input.value = "";

  try {
    const res = await fetch(`${API_BASE}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: msg })
    });
    const data = await res.json();
    box.innerHTML += `<div><b>J.E.A.N:</b> ${data.reply}</div>`;
  } catch {
    box.innerHTML += `<div>❌ Erreur IA</div>`;
  }
}

window.onload = loadPendingAlerts;
