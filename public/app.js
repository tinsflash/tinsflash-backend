// ------------------------------
// Gestion des alertes
// ------------------------------
async function loadAlerts() {
  try {
    const res = await fetch("/alerts");
    const data = await res.json();

    const localDiv = document.getElementById("alerts-local");
    const worldDiv = document.getElementById("alerts-world");

    if (data.alerts && Array.isArray(data.alerts)) {
      localDiv.innerHTML = data.alerts
        .map(a => `<p>⚠️ [${a.level}] ${a.type} (${a.reliability}%) - ${a.description}</p>`)
        .join("");
    } else {
      localDiv.innerHTML = "<p>Aucune alerte locale/nationale.</p>";
    }

    if (data.external) {
      worldDiv.innerHTML = `<p>🌍 Données externes : ${data.external.weather?.[0]?.description || "Aucune info."}</p>`;
    } else {
      worldDiv.innerHTML = "<p>Aucune alerte mondiale.</p>";
    }
  } catch (err) {
    console.error("Erreur alertes :", err);
    document.getElementById("alerts-local").innerHTML = "<p>Erreur chargement alertes.</p>";
    document.getElementById("alerts-world").innerHTML = "<p>Erreur chargement alertes.</p>";
  }
}

// ------------------------------
// Gestion utilisateur (Account)
// ------------------------------
async function loadUserInfo() {
  const userDiv = document.getElementById("user-info");
  if (userDiv) {
    userDiv.innerHTML = `
      <p><strong>Nom :</strong> Jean Dupont</p>
      <p><strong>Email :</strong> jean@example.com</p>
      <p><strong>Statut :</strong> Connecté ✅</p>
    `;
  }
}

async function upgradePlan(plan) {
  const subDiv = document.getElementById("subscription-info");
  if (subDiv) {
    subDiv.innerHTML = `🚀 Passage à l’abonnement ${plan.toUpperCase()} en cours...`;
    setTimeout(() => {
      subDiv.innerHTML = `✅ Abonnement mis à jour vers ${plan.toUpperCase()}`;
    }, 1500);
  }
}

// ------------------------------
// Podcasts
// ------------------------------
async function generatePodcast(type) {
  try {
    const res = await fetch(`/podcast/generate?type=${type}`);
    const data = await res.json();

    const container = document.getElementById("my-podcasts");
    if (container) {
      const div = document.createElement("div");
      div.classList.add("podcast-item");
      div.innerHTML = `<p><strong>${type}</strong> → ${data.forecast}</p>`;
      container.appendChild(div);
    }
  } catch (err) {
    console.error("Erreur podcast :", err);
    alert("Erreur génération podcast.");
  }
}

// ------------------------------
// Codes promos
// ------------------------------
function applyPromo() {
  const input = document.getElementById("promo-code");
  const result = document.getElementById("promo-result");
  if (input && result) {
    const code = input.value.trim();
    if (!code) {
      alert("Veuillez entrer un code promo.");
      return;
    }
    result.innerText = `✅ Code "${code}" appliqué avec succès !`;
  }
}

// ------------------------------
// Chat IA (console admin / cockpit futur)
// ------------------------------
async function sendToAI(message) {
  try {
    const res = await fetch("/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message })
    });
    const data = await res.json();
    return data.reply || "Réponse indisponible.";
  } catch (err) {
    console.error("Erreur chat IA :", err);
    return "Erreur IA.";
  }
}

// ------------------------------
// DOMContentLoaded → auto-init
// ------------------------------
document.addEventListener("DOMContentLoaded", () => {
  // Alerts
  if (document.getElementById("alerts-local")) loadAlerts();
  // Account
  if (document.getElementById("user-info")) loadUserInfo();
});
