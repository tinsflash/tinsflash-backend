// ---------------------------
// app.js - TINSFLASH Front
// ---------------------------

console.log("🌍 TINSFLASH app.js chargé");

// 🌍 Détection GPS ou fallback encodage manuel
async function getLocationOrManual() {
  return new Promise((resolve) => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
        () => {
          const addr = prompt("Entrez votre ville/pays (ex: Paris, FR) :");
          resolve({ address: addr });
        }
      );
    } else {
      const addr = prompt("Entrez votre ville/pays (ex: Paris, FR) :");
      resolve({ address: addr });
    }
  });
}

// 🎨 Avatar J.E.A.N (Lottie)
function updateJeanAvatar(type = "default") {
  const player = document.getElementById("jean-player");
  if (!player) return;

  const map = {
    "default": "/avatars/jean-default.json",
    "sun": "/avatars/jean-sun.json",
    "rain": "/avatars/jean-rain.json",
    "snow": "/avatars/jean-snow.json",
    "storm": "/avatars/jean-storm.json",
    "alert": "/avatars/jean-alert.json"
  };

  player.load(map[type] || map["default"]);
}

// 🎭 Appliquer avatar selon condition
function applyForecastIcon(condition) {
  condition = (condition || "").toLowerCase();
  if (condition.includes("sun") || condition.includes("clear")) updateJeanAvatar("sun");
  else if (condition.includes("rain")) updateJeanAvatar("rain");
  else if (condition.includes("snow")) updateJeanAvatar("snow");
  else if (condition.includes("storm") || condition.includes("thunder")) updateJeanAvatar("storm");
  else updateJeanAvatar("default");
}

// 🔄 Icône météo Lottie selon condition
function getLottieByCondition(condition) {
  condition = (condition || "").toLowerCase();
  if (condition.includes("sun") || condition.includes("clear"))
    return "https://assets10.lottiefiles.com/packages/lf20_jtbfg2nb.json";
  if (condition.includes("rain"))
    return "https://assets10.lottiefiles.com/packages/lf20_rp9zjhnc.json";
  if (condition.includes("snow"))
    return "https://assets10.lottiefiles.com/packages/lf20_RbLd9R.json";
  if (condition.includes("storm") || condition.includes("thunder"))
    return "https://assets10.lottiefiles.com/packages/lf20_HhXgdh.json";
  return "https://assets10.lottiefiles.com/packages/lf20_jtbfg2nb.json"; // par défaut soleil
}

// 📊 Charger prévisions météo
async function loadForecast(country = "FR") {
  try {
    const res = await fetch(`/api/forecast/${country}`);
    const data = await res.json();

    if (!data || data.error) {
      document.getElementById("today-forecast").innerText = "❌ Erreur prévisions.";
      return;
    }

    // Jour actuel
    const today = data.days?.[0];
    if (today) {
      document.getElementById("today-forecast").innerHTML = `
        <div class="forecast-item">
          <lottie-player src="${getLottieByCondition(today.condition)}"
            background="transparent" speed="1" style="width:60px;height:60px;" loop autoplay></lottie-player>
          <p><strong>${today.date}</strong></p>
          <p>${today.condition}</p>
          <p>${today.temp_min}°C / ${today.temp_max}°C</p>
        </div>
      `;
      applyForecastIcon(today.condition);
    }

    // 7 jours
    document.getElementById("days-container").innerHTML = (data.days || [])
      .map(d => `
        <div class="forecast-item">
          <lottie-player src="${getLottieByCondition(d.condition)}"
            background="transparent" speed="1" style="width:50px;height:50px;" loop autoplay></lottie-player>
          <p><b>${d.date}</b></p>
          <p>${d.condition}</p>
          <p>${d.temp_min}°C / ${d.temp_max}°C</p>
        </div>
      `).join("");

    // Bulletin texte enrichi
    const txt = await fetch("/api/textgen", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt: `Rédige un bulletin météo clair, style radio/TV, basé sur les prévisions actuelles pour ${country}.`
      })
    });
    const tdata = await txt.json();
    document.getElementById("forecast-text").innerText =
      tdata.reply || "❌ Pas de bulletin.";
  } catch (err) {
    console.error("Forecast error:", err);
  }
}

// 🚨 Charger alertes
async function loadAlerts() {
  try {
    const res = await fetch("/api/alerts");
    const data = await res.json();

    const el = document.getElementById("alerts-content");
    if (!data || data.length === 0) {
      el.innerText = "✅ Aucune alerte active.";
      return;
    }

    el.innerHTML = data.map(
      (a) => `<div class="alert"><b>${a.country || a.continent}</b>: ${a.title} (${a.level}%)</div>`
    ).join("");

    // Avatar mode "alert" si nécessaire
    if (data.some(a => a.level >= 80)) {
      updateJeanAvatar("alert");
    }
  } catch (err) {
    console.error("Alerts error:", err);
  }
}

// 🛰️ Radar Windy (embed)
function loadRadar() {
  const radar = document.getElementById("radar-map");
  radar.innerHTML = `
    <iframe src="https://embed.windy.com/embed2.html?lat=50&lon=4.8&zoom=6&level=surface&overlay=precipitation&menu=&message=true&marker=true" 
      width="100%" height="400" frameborder="0" style="border-radius:12px;"></iframe>
  `;
}

// 🎙️ Podcast météo
async function loadPodcast(country = "FR") {
  try {
    const res = await fetch(`/api/podcast/${country}`);
    const data = await res.json();
    const el = document.getElementById("podcast-container");
    el.innerHTML = data?.podcast || "Pas de podcast dispo.";
  } catch (err) {
    console.error("Podcast error:", err);
  }
}

// 💬 Chat Cohere (J.E.A.N.)
function setupJeanChat() {
  const avatar = document.getElementById("avatar-jean");
  avatar.addEventListener("click", () => {
    const chat = document.getElementById("chat-jean");
    chat.style.display = chat.style.display === "flex" ? "none" : "flex";
  });

  document.getElementById("jean-send").onclick = async () => {
    const msg = document.getElementById("jean-input").value;
    const box = document.getElementById("jean-messages");
    if (!msg) return;

    box.innerHTML += `<div><b>Vous:</b> ${msg}</div>`;

    const res = await fetch("/api/jean", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: msg })
    });
    const data = await res.json();

    box.innerHTML += `<div style="color:#0077cc;"><b>J.E.A.N:</b> ${data.reply}</div>`;
    document.getElementById("jean-input").value = "";
    box.scrollTop = box.scrollHeight;

    if (data.avatar) updateJeanAvatar(data.avatar);
  };
}

// 🚀 Initialisation
(async function init() {
  const loc = await getLocationOrManual();
  const country = loc.country || "FR";
  await loadForecast(country);
  await loadAlerts();
  await loadPodcast(country);
  loadRadar();
  setupJeanChat();
})();
