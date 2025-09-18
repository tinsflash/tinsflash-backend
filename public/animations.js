// -------------------------
// animations.js
// Ajout d'animations dynamiques aux icônes météo
// -------------------------

document.addEventListener("DOMContentLoaded", () => {
  const icons = document.querySelectorAll(".weather-icon");

  icons.forEach(icon => {
    const symbol = icon.textContent.trim();

    switch (symbol) {
      case "☀️": // Soleil
        icon.classList.add("sun-anim");
        break;

      case "☁️":
      case "⛅":
      case "🌤️":
        icon.classList.add("cloud-anim");
        break;

      case "🌧️":
      case "🌦️":
        icon.classList.add("rain-anim");
        break;

      case "❄️":
        icon.classList.add("snow-anim");
        break;

      case "⛈️":
      case "🌩️":
        icon.classList.add("storm-anim");
        break;
    }
  });
});
