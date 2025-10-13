// ==========================================================
// 🧠 TINSFLASH – scriptNamur.js
// ==========================================================
// Génère le texte du bulletin météo IA J.E.A.N. (Province de Namur)
// ==========================================================

export function generateNamurScript(forecastData = {}, alertData = []) {
  const date = new Date().toLocaleDateString("fr-BE", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const cities = [
    "Namur",
    "Andenne",
    "Gembloux",
    "Floreffe",
    "Ciney",
    "Dinant",
    "Philippeville",
    "Couvin",
  ];

  const randomVillage = [
    "Fosses-la-Ville",
    "Profondeville",
    "Assesse",
    "Sombreffe",
    "Mettet",
  ][Math.floor(Math.random() * 5)];

  const intro = `Bonjour, je suis J.E.A.N., l’intelligence artificielle du système TINSFLASH. Voici votre bulletin météo automatique pour la province de Namur, ce ${date}.`;

  const current = `Actuellement, la température moyenne est d’environ ${forecastData.temperature || 17} degrés, sous un ciel ${forecastData.condition?.toLowerCase() || "variable"}. Le vent souffle à ${forecastData.wind || 8} km/h, et l’humidité est de ${forecastData.humidity || 65} %.`;

  const details = cities
    .map(
      (c) =>
        `À ${c}, ${
          Math.random() > 0.5 ? "le soleil domine" : "quelques averses locales sont possibles"
        }, avec environ ${14 + Math.floor(Math.random() * 8)} degrés.`
    )
    .join(" ");

  const villageInfo = `Dans le village de ${randomVillage}, le temps restera ${
    Math.random() > 0.5 ? "calme et ensoleillé" : "instable avec quelques nuages bas"
  }.`;

  let alertSection = "";
  if (alertData.length > 0) {
    const first = alertData[0];
    alertSection = `⚠️ Une alerte est active : ${first.title || "phénomène météorologique"} dans la zone ${
      first.zone || "Namur"
    }, avec une fiabilité estimée à ${(first.reliability * 100 || 80).toFixed(0)} %.`;
  } else {
    alertSection = "Aucune alerte majeure n’est détectée pour le moment sur la province.";
  }

  const trend = `Pour les prochains jours, la tendance reste ${
    Math.random() > 0.5
      ? "douce et lumineuse avec un temps sec"
      : "variable, avec des passages pluvieux possibles"
  }.`;

  const conclusion = "Merci d’avoir suivi ce bulletin automatique TINSFLASH. Je suis J.E.A.N., à bientôt pour une nouvelle mise à jour.";

  return `${intro}\n${current}\n${details}\n${villageInfo}\n${alertSection}\n${trend}\n${conclusion}`;
}
