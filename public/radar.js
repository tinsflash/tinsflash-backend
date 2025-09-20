let map;
let rainLayer;
let radarTimeline = [];
let currentFrame = 0;
let playInterval;

async function initRadar() {
  map = L.map("radar-map").setView([50.85, 4.35], 7);

  // Fonds de carte
  const baseLayers = {
    "Carte": L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"),
    "Satellite": L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}")
  };
  baseLayers["Carte"].addTo(map);
  L.control.layers(baseLayers).addTo(map);

  // Charger RainViewer
  const res = await fetch("https://api.rainviewer.com/public/weather-maps.json");
  const data = await res.json();
  radarTimeline = data.radar.past.concat(data.radar.nowcast);

  // Première frame
  updateRadarFrame();
  playTimeline();
}

function playTimeline() {
  if (playInterval) clearInterval(playInterval);
  playInterval = setInterval(() => {
    currentFrame = (currentFrame + 1) % radarTimeline.length;
    updateRadarFrame();
  }, 1000);
}

function pauseTimeline() {
  if (playInterval) clearInterval(playInterval);
  playInterval = null;
}

function updateRadarFrame() {
  const frame = radarTimeline[currentFrame];
  if (rainLayer) map.removeLayer(rainLayer);

  rainLayer = L.tileLayer(
    `https://tilecache.rainviewer.com/v2/radar/${frame.path}/256/{z}/{x}/{y}/2/1_1.png`,
    { opacity: 0.6 }
  ).addTo(map);

  document.getElementById("radar-time").innerText = new Date(frame.time * 1000)
    .toLocaleTimeString("fr-BE", { hour: "2-digit", minute: "2-digit" });

  updateGraph();
}

function updateGraph() {
  const ctx = document.getElementById("radar-graph").getContext("2d");
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  ctx.beginPath();
  ctx.strokeStyle = "#007bff";
  ctx.lineWidth = 2;

  radarTimeline.forEach((frame, idx) => {
    // Intensité simulée par rapport au temps (on peut remplacer par vrai champ si dispo)
    const y = 100 - ((frame.time % 60) / 60) * 100;
    ctx.lineTo(idx * 10, y);
  });

  ctx.stroke();
}

initRadar();
