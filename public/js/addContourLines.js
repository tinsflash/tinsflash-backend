// ==========================================================
// 🌍 TINSFLASH — addContourLines.js
// ==========================================================
// 🔸 Lecture du relief HR (floreffe_altitudes_hr.json)
// 🔸 Génération de courbes d'altitude ("contours topographiques")
// 🔸 Effet holographique pulsant type Hunger Games
// 🔸 Compatible avec hologram-floreffe.html / mobile
// ==========================================================

import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";

export async function addContourLines(scene, baseGroup, scale = 600) {
  const url = "./floreffe_altitudes_hr.json";
  console.log(`📡 Chargement relief HR depuis ${url}`);

  try {
    const data = await (await fetch(url)).json();
    console.log(`✅ Relief HR chargé (${data.length} points)`);

    // Groupes de rendu
    const contourGroup = new THREE.Group();
    scene.add(contourGroup);

    // Paliers d'altitude (5 m)
    const minAlt = Math.min(...data.map(p => p.alt));
    const maxAlt = Math.max(...data.map(p => p.alt));
    const step = 5; // mètres
    const levels = [];
    for (let a = Math.floor(minAlt); a <= Math.ceil(maxAlt); a += step) levels.push(a);

    const mat = new THREE.LineBasicMaterial({
      color: 0x00ff99,
      transparent: true,
      opacity: 0.4,
    });

    // Création des courbes
    levels.forEach(level => {
      const near = data.filter(p => Math.abs(p.alt - level) <= 1);
      if (near.length < 10) return;

      const geom = new THREE.BufferGeometry();
      const verts = [];
      near.forEach(p => {
        const x = p.lon * scale - 2800;
        const y = p.alt * 1.5 + 2; // léger décalage
        const z = -p.lat * scale + 30500;
        verts.push(x, y, z);
      });
      geom.setAttribute("position", new THREE.Float32BufferAttribute(verts, 3));

      const line = new THREE.Line(geom, mat.clone());
      line.userData.altitude = level;
      contourGroup.add(line);
    });

    // Animation pulsante holographique
    function animateContours() {
      const t = Date.now() * 0.002;
      contourGroup.children.forEach(line => {
        const altFactor = line.userData.altitude / maxAlt;
        line.material.opacity = 0.25 + 0.25 * Math.sin(t + altFactor * Math.PI * 2);
      });
      requestAnimationFrame(animateContours);
    }
    animateContours();

    console.log(`🌐 ${contourGroup.children.length} courbes de niveau générées`);
    baseGroup.add(contourGroup);

  } catch (err) {
    console.error(`❌ Erreur contours : ${err.message}`);
  }
}
