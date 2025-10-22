// ==========================================================
// 🛰️ TINSFLASH – overlayInfrastructure.js
// ==========================================================
// 🔸 Affichage 3D des routes, égouts, rivières et bassins
// 🔸 Couleurs dynamiques selon risque : pluie, verglas, crue, ruissellement
// 🔸 Exploite les fichiers : floreffe_routes.json / floreffe_reseaux.json / floreffe_hydro.json / floreffe_geoportail.json
// ==========================================================

export async function loadInfrastructure(scene, forecasts) {
  try {
    const [routes, reseaux, hydro, geo] = await Promise.all([
      fetch("/floreffe_routes.json").then(r => r.json()).catch(()=>null),
      fetch("/floreffe_reseaux.json").then(r => r.json()).catch(()=>null),
      fetch("/floreffe_hydro.json").then(r => r.json()).catch(()=>null),
      fetch("/floreffe_geoportail.json").then(r => r.json()).catch(()=>null)
    ]);

    const group = new THREE.Group();

    // ==========================================================
    // 🛣️ ROUTES — risque verglas / ruissellement
    // ==========================================================
    if (routes?.features) {
      const matRoute = new THREE.LineBasicMaterial({ color: 0xaaaaaa, transparent:true, opacity:0.6 });
      const matVerglas = new THREE.LineBasicMaterial({ color: 0x00ffff, transparent:true, opacity:0.9 });
      const matPluie = new THREE.LineBasicMaterial({ color: 0x0077ff, transparent:true, opacity:0.8 });

      for (const f of routes.features) {
        const coords = f.geometry?.coordinates;
        if (!coords) continue;

        const pts = coords.map(c => new THREE.Vector3((c[0]-4.76)*200, 0.1, (c[1]-50.44)*200));
        const geom = new THREE.BufferGeometry().setFromPoints(pts);

        // ⚙️ évaluer conditions météo
        let mat = matRoute;
        if (forecasts?.zones) {
          const z = forecasts.zones.find(z => Math.abs(z.lat-c[1])<0.01 && Math.abs(z.lon-c[0])<0.01);
          if (z) {
            if (z.temperature <= 0 && z.precipitation > 0) mat = matVerglas;
            else if (z.precipitation >= 3) mat = matPluie;
          }
        }

        const line = new THREE.Line(geom, mat);
        group.add(line);
      }
      console.log(`🛣️ Routes chargées : ${routes.features.length}`);
    }

    // ==========================================================
    // 💧 RESEAUX D'EGOUTS — bassins + conduites
    // ==========================================================
    if (reseaux?.features) {
      const matEgout = new THREE.LineBasicMaterial({ color: 0x3399ff, transparent:true, opacity:0.6 });
      for (const f of reseaux.features) {
        const coords = f.geometry?.coordinates;
        if (!coords) continue;
        const pts = coords.map(c => new THREE.Vector3((c[0]-4.76)*200, -1, (c[1]-50.44)*200));
        const geom = new THREE.BufferGeometry().setFromPoints(pts);
        const line = new THREE.Line(geom, matEgout);
        group.add(line);
      }
      console.log(`💧 Réseaux chargés : ${reseaux.features.length}`);
    }

    // ==========================================================
    // 🌊 HYDRO — rivières + bassins
    // ==========================================================
    if (hydro?.features) {
      const matNormal = new THREE.LineBasicMaterial({ color: 0x0044ff, transparent:true, opacity:0.8 });
      const matCrue = new THREE.LineBasicMaterial({ color: 0xff0000, transparent:true, opacity:0.9 });
      for (const f of hydro.features) {
        const coords = f.geometry?.coordinates;
        if (!coords) continue;
        const pts = coords.map(c => new THREE.Vector3((c[0]-4.76)*200, 0, (c[1]-50.44)*200));
        const geom = new THREE.BufferGeometry().setFromPoints(pts);
        const niveau = f.properties?.niveau_m || 0;
        const seuil = f.properties?.alert_threshold || 1.2;
        const mat = niveau > seuil ? matCrue : matNormal;
        const line = new THREE.Line(geom, mat);
        group.add(line);
      }
      console.log(`🌊 Hydro chargé : ${hydro.features.length}`);
    }

    // ==========================================================
    // 🏔️ GEOPORTAIL — zones de pente / ruissellement
    // ==========================================================
    if (geo?.features) {
      const matRuissellement = new THREE.MeshBasicMaterial({
        color: 0xff6600, transparent:true, opacity:0.15, side:THREE.DoubleSide
      });
      for (const f of geo.features) {
        if (f.properties?.slope_avg > 8) {
          const [lon, lat] = f.geometry?.coordinates?.[0] || [];
          if (!lon || !lat) continue;
          const planeGeom = new THREE.CircleGeometry(10, 16);
          const mesh = new THREE.Mesh(planeGeom, matRuissellement);
          mesh.position.set((lon-4.76)*200, 0.2, (lat-50.44)*200);
          mesh.rotation.x = -Math.PI/2;
          group.add(mesh);
        }
      }
      console.log(`🏔️ Geoportail zones pente : ${geo.features.length}`);
    }

    group.name = "infrastructure";
    scene.add(group);
    console.log("✅ Overlay infrastructure complet ajouté à la scène");
  } catch (e) {
    console.error("❌ Erreur overlayInfrastructure :", e);
  }
}
