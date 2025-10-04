// ---------------------------
// app.js - TINSFLASH Front
// ---------------------------

// 🌍 Geolocalisation ou fallback sur encodage manuel
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

// 🎨 Avatar J.E.A.N.
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

// 🎭 Appliquer icône/Jean selon condition
function applyForecastIcon(condition) {
  condition = (condition || "").toLowerCase();
  if (condition.includes("sun") || condition.includes("clear")) updateJeanAvatar("sun");
  else if (condition.includes("rain")) updateJeanAvatar("rain");
  else if (condition.includes("snow")) updateJeanAvatar("snow");
  else if (condition.includes("storm") || condition.includes("thunder")) updateJeanAvatar("storm");
  else updateJeanAvatar("default");
}

// 📊 Charger prévisions météo
async function loadForecast(country = "FR") {
  try {
    const res = await fetch(`/api/forecast/${country}`);
    const data = await res.json();

    if (!data || data.error) {
      document.getElementById("local-content").innerText = "❌ Erreur prévisions.";
      return;
    }

    // Jour actuel
    const today = data.days?.[0];
    if (today) {
      document.getElementById("local-content").innerHTML = `
        <h3>${today.date}</h3>
        <p>${today.condition}, ${today.temp_min}°C / ${today.temp_max}°C</p>
      `;
      applyForecastIcon(today.condition);
    }

    // 7 jours
    let html = "";
    (data.days || []).forEach((d) => {
      html += `
        <div class="forecast-item">
          <i class="wi wi-day-sunny"></i>
          <p><b>${d.date}</b><br>${d.condition}<br>${d.temp_min}° / ${d.temp_max}°</p>
        </div>
      `;
    });
    document.getElementById("days-container").innerHTML = html;

    // Bulletin texte
    const txt = await fetch("/api/textgen", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: "Fais un bulletin météo clair basé sur les prévisions actuelles." })
    });
    const tdata = await txt.json();
    document.getElementById("forecast-text").innerText = tdata.reply || "❌ Pas de bulletin.";
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

    // Si alerte importante → avatar passe en "alert"
    if (data.some(a => a.level >= 80)) {
      updateJeanAvatar("alert");
    }
  } catch (err) {
    console.error("Alerts error:", err);
  }
}

// 🛰️ Radar Windy
function loadRadar() {
  const map = L.map("radar-map").setView([50.5, 4.5], 5);
  L.tileLayer(
    "https://tile.openweathermap.org/map/precipitation_new/{z}/{x}/{y}.png?appid=demo", 
    { attribution: "Radar", maxZoom: 18 }
  ).addTo(map);
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
  const avatar = document.getElementById("jean-avatar");
  avatar.addEventListener("click", () => {
    if (document.getElementById("jean-chat")) return;
    const chatBox = document.createElement("div");
    chatBox.id = "jean-chat";
    chatBox.style.position = "fixed";
    chatBox.style.bottom = "190px";
    chatBox.style.right = "20px";
    chatBox.style.width = "300px";
    chatBox.style.height = "400px";
    chatBox.style.background = "#fff";
    chatBox.style.border = "2px solid #0077cc";
    chatBox.style.borderRadius = "12px";
    chatBox.style.padding = "10px";
    chatBox.style.zIndex = "10000";
    chatBox.innerHTML = `
      <h3 style="margin:0; color:#0077cc;">💬 J.E.A.N</h3>
      <div id="jean-messages" style="overflow-y:auto; height:300px; margin:10px 0; font-size:14px;"></div>
      <input type="text" id="jean-input" placeholder="Votre question..." style="width:75%;">
      <button id="jean-send">Envoyer</button>
    `;
    document.body.appendChild(chatBox);

    document.getElementById("jean-send").onclick = async () => {
      const msg = document.getElementById("jean-input").value;
      const box = document.getElementById("jean-messages");
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
  });
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
