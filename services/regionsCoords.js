// services/regionsCoords.js
// Coordonnées officielles par pays/région (zones couvertes par la centrale nucléaire météo)

export const REGIONS_COORDS = {
  // ========================
  // 🇧🇪 Belgique (IRM / KMI)
  // ========================
  BE: {
    "Région côtière": { lat: 51.2333, lon: 2.9167 },   // Ostende
    "Centre / Brabant - Bruxelles": { lat: 50.8503, lon: 4.3517 }, // Bruxelles
    "Ardennes": { lat: 50.0000, lon: 5.7000 },          // Bastogne
    "Lorraine belge": { lat: 49.6833, lon: 5.8167 },    // Arlon
    "Sillon Sambre-et-Meuse": { lat: 50.4667, lon: 4.8667 } // Namur
  },

  // ========================
  // 🇫🇷 France (Météo-France)
  // ========================
  FR: {
    "Île-de-France": { lat: 48.8566, lon: 2.3522 },     // Paris
    "Hauts-de-France": { lat: 50.6292, lon: 3.0573 },   // Lille
    "Normandie": { lat: 49.1829, lon: -0.3700 },        // Caen
    "Grand Est": { lat: 48.5734, lon: 7.7521 },         // Strasbourg
    "Bretagne": { lat: 48.1173, lon: -1.6778 },         // Rennes
    "Pays de la Loire": { lat: 47.2184, lon: -1.5536 }, // Nantes
    "Centre-Val de Loire": { lat: 47.9025, lon: 1.9090 }, // Orléans
    "Bourgogne-Franche-Comté": { lat: 47.3220, lon: 5.0415 }, // Dijon
    "Nouvelle-Aquitaine": { lat: 44.8378, lon: -0.5792 }, // Bordeaux
    "Auvergne-Rhône-Alpes": { lat: 45.7640, lon: 4.8357 }, // Lyon
    "Occitanie": { lat: 43.6047, lon: 1.4442 },         // Toulouse
    "Provence-Alpes-Côte d’Azur": { lat: 43.2965, lon: 5.3698 }, // Marseille
    "Corse": { lat: 41.9192, lon: 8.7386 }              // Ajaccio
  },

  // ========================
  // 🇩🇪 Allemagne (DWD)
  // ========================
  DE: {
    "Bade-Wurtemberg": { lat: 48.7784, lon: 9.1800 },   // Stuttgart
    "Bavière": { lat: 48.1371, lon: 11.5754 },          // Munich
    "Berlin": { lat: 52.5200, lon: 13.4050 },
    "Brandebourg": { lat: 52.4000, lon: 13.0667 },      // Potsdam
    "Brême": { lat: 53.0833, lon: 8.8000 },
    "Hambourg": { lat: 53.5500, lon: 10.0000 },
    "Hesse": { lat: 50.1109, lon: 8.6821 },             // Francfort
    "Mecklembourg-Poméranie": { lat: 53.6333, lon: 11.4167 }, // Schwerin
    "Basse-Saxe": { lat: 52.3667, lon: 9.7167 },        // Hanovre
    "Rhénanie du Nord-Westphalie": { lat: 51.2277, lon: 6.7735 }, // Düsseldorf
    "Rhénanie-Palatinat": { lat: 50.0000, lon: 7.6000 }, // Mayence
    "Sarre": { lat: 49.2333, lon: 6.9833 },             // Sarrebruck
    "Saxe": { lat: 51.0500, lon: 13.7333 },             // Dresde
    "Saxe-Anhalt": { lat: 51.5000, lon: 11.9667 },      // Magdebourg
    "Schleswig-Holstein": { lat: 54.3167, lon: 10.1333 }, // Kiel
    "Thuringe": { lat: 50.9833, lon: 11.0333 }          // Erfurt
  },

  // ========================
  // 🇬🇧 Royaume-Uni (Met Office)
  // ========================
  UK: {
    "London & South East": { lat: 51.5072, lon: -0.1276 },
    "South West": { lat: 50.7184, lon: -3.5339 },       // Exeter
    "East of England": { lat: 52.2053, lon: 0.1218 },   // Cambridge
    "West Midlands": { lat: 52.4862, lon: -1.8904 },    // Birmingham
    "East Midlands": { lat: 52.6369, lon: -1.1398 },    // Leicester
    "Yorkshire & Humber": { lat: 53.7997, lon: -1.5492 }, // Leeds
    "North West": { lat: 53.4808, lon: -2.2426 },       // Manchester
    "North East": { lat: 54.9783, lon: -1.6174 },       // Newcastle
    "Wales": { lat: 51.4816, lon: -3.1791 },            // Cardiff
    "Scotland": { lat: 55.9533, lon: -3.1883 },         // Edinburgh
    "Northern Ireland": { lat: 54.5970, lon: -5.9300 }  // Belfast
  },

  // ========================
  // 🇳🇴 Norvège (MET Norway)
  // ========================
  NO: {
    "Oslo/Viken": { lat: 59.9139, lon: 10.7522 },
    "Vestland": { lat: 60.3943, lon: 5.3250 },          // Bergen
    "Rogaland": { lat: 58.9690, lon: 5.7331 },          // Stavanger
    "Agder": { lat: 58.1467, lon: 7.9956 },             // Kristiansand
    "Innlandet": { lat: 61.1153, lon: 10.4663 },        // Lillehammer
    "Troms og Finnmark": { lat: 69.6496, lon: 18.9560 }, // Tromsø
    "Nordland": { lat: 67.2804, lon: 14.4049 },         // Bodø
    "Trøndelag": { lat: 63.4305, lon: 10.3951 },        // Trondheim
    "Møre og Romsdal": { lat: 62.4722, lon: 6.1495 }    // Ålesund
  },

  // ========================
  // 🇺🇦 Ukraine (Ukrhydrometcenter)
  // ========================
  UA: {
    "Ouest": { lat: 49.8397, lon: 24.0297 },           // Lviv
    "Nord": { lat: 51.5000, lon: 31.3000 },            // Chernihiv
    "Centre": { lat: 50.4501, lon: 30.5234 },          // Kiev
    "Sud": { lat: 46.4825, lon: 30.7233 },             // Odessa
    "Est": { lat: 48.0000, lon: 37.8000 },             // Donetsk
    "Crimée": { lat: 44.9521, lon: 34.1024 }           // Simferopol
  },

  // ========================
  // 🇺🇸 États-Unis (NWS)
  // ========================
  US: {
    "Nord-Est": { lat: 40.7128, lon: -74.0060 },       // New York
    "Sud-Est": { lat: 33.7490, lon: -84.3880 },        // Atlanta
    "Midwest": { lat: 41.8781, lon: -87.6298 },        // Chicago
    "Ouest": { lat: 34.0522, lon: -118.2437 },         // Los Angeles
    "Montagnes Rocheuses": { lat: 39.7392, lon: -104.9903 }, // Denver
    "Californie": { lat: 36.7783, lon: -119.4179 },    // Fresno (centre CA)
    "Texas": { lat: 30.2672, lon: -97.7431 },          // Austin
    "Floride": { lat: 25.7617, lon: -80.1918 }         // Miami
  }
};
