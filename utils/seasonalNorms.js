// utils/seasonalNorms.js

/**
 * Normes saisonnières de référence (Europe)
 */
export const seasonalNorms = {
  winter: { temp_min: -2, temp_max: 5, wind: 20 },
  spring: { temp_min: 5, temp_max: 15, wind: 15 },
  summer: { temp_min: 15, temp_max: 28, wind: 10 },
  autumn: { temp_min: 8, temp_max: 18, wind: 18 }
};

/**
 * Retourne les normes de la saison demandée
 * @param {string} season - winter | spring | summer | autumn
 */
export function getNorm(season) {
  return seasonalNorms[season] || {};
}
