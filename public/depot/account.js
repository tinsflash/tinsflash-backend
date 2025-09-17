const API_BASE = "https://tinsflash-backend.onrender.com";

// Simule login simple (peut évoluer vers Stripe ou Auth0)
function login() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  const status = document.getElementById("login-status");

  if (email && password) {
    status.innerHTML = "✅ Connecté (simulation utilisateur)";
    localStorage.setItem("userEmail", email);
  } else {
    status.innerHTML = "❌ Remplissez tous les champs";
  }
}

// Vérifie abonnement (simulé)
function loadSubscription() {
  const container = document.getElementById("subscription-status");
  const email = localStorage.getItem("userEmail");
  if (!email) {
    container.innerHTML = "Non connecté";
    return;
  }
  container.innerHTML = "📌 Abonnement actuel : Gratuit";
}

// Applique un code promo
async function applyPromo() {
  const code = document.getElementById("promo-code").value;
  const status = document.getElementById("promo-status");

  if (!code) {
    status.innerHTML = "❌ Entrez un code";
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/codes/validate?code=${code}`);
    const data = await res.json();
    if (data.valid) {
      status.innerHTML = `✅ Code activé : ${data.type} (${data.duration})`;
    } else {
      status.innerHTML = "❌ Code invalide";
    }
  } catch (err) {
    status.innerHTML = "❌ Erreur serveur promo";
  }
}

window.onload = loadSubscription;
