const loaderMessages = [
  "Connexion aux centres météo mondiaux...",
  "Analyse des vents et températures...",
  "Détection des anomalies climatiques...",
  "Fusion IA exclusive TINSFLASH...",
  "Synthèse finale TINSFLASH..."
];

function startLoader(containerId, callback) {
  const container = document.getElementById(containerId);
  if (!container) return;

  let msgIndex = 0;
  const msgBox = document.createElement("div");
  msgBox.className = "loader-message";
  msgBox.innerText = loaderMessages[msgIndex];
  container.appendChild(msgBox);

  const bar = document.createElement("div");
  bar.className = "loader-bar";
  const progress = document.createElement("div");
  progress.className = "loader-progress";
  bar.appendChild(progress);
  container.appendChild(bar);

  const interval = setInterval(() => {
    msgIndex++;
    if (msgIndex < loaderMessages.length) {
      msgBox.innerText = loaderMessages[msgIndex];
    }
  }, 1000);

  setTimeout(() => {
    clearInterval(interval);
    msgBox.innerText = "✅ Données prêtes";
    if (callback) callback();
  }, 5000);
}
