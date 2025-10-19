import * as THREE from "https://cdn.skypack.dev/three";
import { gsap } from "https://cdn.skypack.dev/gsap";

let scene,camera,renderer,terrain,holoLight,windLines=[];
const center=new THREE.Vector3(0,0,0);

async function init(){
  scene=new THREE.Scene();
  const w=window.innerWidth,h=window.innerHeight;
  camera=new THREE.PerspectiveCamera(60,w/h,0.1,1000);
  camera.position.set(0,6,10);

  renderer=new THREE.WebGLRenderer({antialias:true,alpha:true});
  renderer.setSize(w,h);
  renderer.setClearColor(0x000814,1);
  document.getElementById("stratdome").appendChild(renderer.domElement);

  // Relief holographique
  const geo=new THREE.PlaneGeometry(12,12,60,60);
  geo.rotateX(-Math.PI/2);
  for(let i=0;i<geo.attributes.position.count;i++){
    const x=geo.attributes.position.getX(i);
    const z=geo.attributes.position.getZ(i);
    const y=Math.sin(x*0.8)*Math.cos(z*0.7)*0.9;
    geo.attributes.position.setY(i,y);
  }
  const mat=new THREE.MeshBasicMaterial({color:0x00eaff,wireframe:true,opacity:0.4,transparent:true});
  terrain=new THREE.Mesh(geo,mat);
  scene.add(terrain);

  // Lumière bleutée pulsante
  holoLight=new THREE.PointLight(0x00ccff,2,30);
  holoLight.position.set(0,7,4);
  scene.add(holoLight);

  // Halo central
  const ring=new THREE.RingGeometry(5.5,5.6,64);
  const ringMat=new THREE.MeshBasicMaterial({color:0x00ffff,transparent:true,opacity:0.2,side:THREE.DoubleSide});
  const ringMesh=new THREE.Mesh(ring,ringMat);
  ringMesh.rotation.x=-Math.PI/2;
  scene.add(ringMesh);

  // Chargement réel des données
  let forecasts=[],alerts=[];
  try{
    forecasts=await fetch("floreffe_forecasts.json?"+Date.now()).then(r=>r.json());
    alerts=await fetch("floreffe_alerts.json?"+Date.now()).then(r=>r.json());
    document.getElementById("hudData").textContent=`Prévisions ${alerts.length} alertes actives`;
  }catch(e){
    document.getElementById("hudData").textContent="⚠️ données non disponibles";
  }

  // Points d’alerte holographiques
  (alerts||[]).forEach(a=>{
    const color=a.level==="rouge"?0xff0033:0xff9900;
    const sph=new THREE.Mesh(new THREE.SphereGeometry(0.15,16,16),
      new THREE.MeshBasicMaterial({color}));
    sph.position.set((Math.random()-0.5)*8,0.4+Math.random()*0.5,(Math.random()-0.5)*8);
    scene.add(sph);
    gsap.to(sph.scale,{x:1.6,y:1.6,z:1.6,repeat:-1,yoyo:true,duration:1+Math.random()});
  });

  // Flux de vent (lignes lumineuses mobiles)
  for(let i=0;i<50;i++){
    const matL=new THREE.LineBasicMaterial({color:0x00eaff,transparent:true,opacity:0.25});
    const pts=[new THREE.Vector3(Math.random()*12-6,Math.random()*1.2,Math.random()*12-6),
               new THREE.Vector3(Math.random()*12-6,Math.random()*1.2,Math.random()*12-6)];
    const geoL=new THREE.BufferGeometry().setFromPoints(pts);
    const line=new THREE.Line(geoL,matL);
    scene.add(line);
    windLines.push({line,spd:0.002+Math.random()*0.003});
  }

  window.addEventListener("resize",()=>onResize());
  animate();
}

function onResize(){
  camera.aspect=window.innerWidth/window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth,window.innerHeight);
}

let angle=0;
function animate(){
  angle+=0.0015;
  camera.position.x=Math.sin(angle)*9;
  camera.position.z=Math.cos(angle)*9;
  camera.lookAt(center);
  holoLight.intensity=1.2+Math.sin(Date.now()/700)*0.4;

  windLines.forEach(w=>{
    w.line.rotation.y+=w.spd;
  });

  renderer.render(scene,camera);
  requestAnimationFrame(animate);
}

init();
