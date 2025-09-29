// config/alertThresholds.js
// Seuils de déclenchement des alertes par type de phénomène
// ⚠️ Ne jamais modifier directement sans validation métier

export const alertThresholds = {
  vent: {
    primeur: 70,      // fiabilité % min pour signaler
    publication: 90,  // fiabilité % min pour publier auto
    intensity: {
      jaune: 50,      // km/h
      orange: 80,
      rouge: 120
    }
  },
  pluie: {
    primeur: 65,
    publication: 85,
    intensity: {
      jaune: 30,      // mm/24h
      orange: 50,
      rouge: 80
    }
  },
  temperature: {
    primeur: 60,
    publication: 85,
    intensity: {
      jaune: [-5, 35],   // min/max extrêmes
      orange: [-10, 38],
      rouge: [-15, 42]
    }
  },
  neige: {
    primeur: 60,
    publication: 85,
    intensity: {
      jaune: 5,       // cm
      orange: 15,
      rouge: 30
    }
  },
  orage: {
    primeur: 65,
    publication: 85,
    intensity: {
      jaune: "activité faible",
      orange: "activité modérée",
      rouge: "activité forte"
    }
  },
  inondation: {
    primeur: 70,
    publication: 90,
    intensity: {
      jaune: "débordement localisé",
      orange: "inondations urbaines",
      rouge: "crues majeures"
    }
  }
};
