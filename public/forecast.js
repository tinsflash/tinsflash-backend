/* global Notification */
let lastCountry = "BE";
let lastRegion = "Bruxelles";
let lastLat = 50.8503, lastLon = 4.3517;
let knownAlertIds = new Set();
let dailyTimers = [];

// ---------- UI helpers ----------
function el(id){ return document.getElementById(id); }
function dayName(ts){
  try{
    const d = new Date(ts);
    return d.toLocaleDateString(undefined,{weekday:'short', day:'2-digit', month:'short'});
  }catch{ return "Jour"; }
}
function iconUrl(code){ return `https://openweathermap.org/img/wn/${code||"01d"}@2x.png`; }
function tempSpan(min,max){ return `<span class="badge">${Math.round(min)}° / ${Math.round(max)}°</span>`; }
function windSpan(ms){ return `<span class="badge">${Math.round((ms||0)*3.6)} km/h</span>`; }
function precipSpan(mm){ return `<span class="badge">${(mm??0).toFixed(1)} mm</span>`; }
function reliabilityBadge(p){
  if(p>=90) return `<span class="badge ok">Fiabilité ${p}%</span>`;
  if(p>=70) return `<span class="badge warn">Fiabilité ${p}%</span>`;
  return `<span class="badge err">Fiabilité ${p||"?"}%</span>`;
}
function notify(title, body){
  if(Notification?.permission==="granted"){
    new Notification(title,{ body });
  }
}

// ---------- Prévisions ----------
async function loadForecast(lat, lon, country="BE", region="Bruxelles"){
  lastLat=lat; lastLon=lon; lastCountry=country||"BE"; lastRegion=region||"";
  try{
    const res = await fetch("/api/superforecast", {
      method:"POST",
      headers:{ "Content-Type":"application/json" },
      body:JSON.stringify({ lat, lon, country:lastCountry, region:lastRegion })
    });
    const data = await res.json();

    // LOCAL
    const local = data?.local || data; // compat
    el("localForecast").innerHTML = renderForecastBlock(local?.forecast, "Local");

    // NATIONAL
    const national = data?.national || null;
    el("nationalForecast").innerHTML = national
      ? renderForecastBlock(national?.forecast, lastCountry.toUpperCase())
      : `<div class="card"><h4>National</h4><div class="meta">Données indisponibles</div></div>`;

    // Texte auto (style “bulletin”)
    const txtLocal = summarizeText(local?.forecast, "local");
    const txtNat = summarizeText(national?.forecast, "national");
    el("textLocal").textContent = txtLocal || "—";
    el("textNational").textContent = txtNat || "—";

  }catch(e){
    console.error("Prévisions error:",e);
    el("localForecast").innerHTML = `<div class="card"><h4>Local</h4><div class="meta">Erreur chargement</div></div>`;
    el("nationalForecast").innerHTML = `<div class="card"><h4>National</h4><div class="meta">Erreur chargement</div></div>`;
  }
}

function renderForecastBlock(list, label){
  if(!Array.isArray(list) || !list.length){
    return `<div class="card"><h4>${label}</h4><div class="meta">Aucune donnée</div></div>`;
  }
  const cards = list.slice(0,7).map(d => `
    <div class="card">
      <h4>${dayName(d.date||d.day||Date.now())}</h4>
      <div class="meta">${d.description||"Prévisions détaillées"}</div>
      <div class="temps">
        <img alt="" src="${iconUrl(d.icon)}" width="60" height="60">
        ${tempSpan(d.temp_min??d.tmin??d.tempMin, d.temp_max??d.tmax??d.tempMax)}
        ${windSpan(d.wind_ms??d.wind)}
        ${precipSpan(d.precip_mm??d.precip)}
      </div>
      <div style="margin-top:6px">${reliabilityBadge(d.reliability??d.confidence??75)}</div>
    </div>
  `).join("");
  return `<div class="grid">${cards}</div>`;
}

function summarizeText(list, scope){
  if(!Array.isArray(list) || !list.length) return "";
  const d0 = list[0];
  const tmin = Math.round(d0.temp_min ?? d0.tmin ?? 0);
  const tmax = Math.round(d0.temp_max ?? d0.tmax ?? 0);
  const vent = Math.round((d0.wind_ms ?? d0.wind ?? 0)*3.6);
  const pr = Number(d0.precip_mm ?? d0.precip ?? 0).toFixed(1);
  const desc = d0.description || "Ciel variable";
  return scope==="local"
    ? `Aujourd’hui près de vous: ${desc}. Températures ${tmin}°/${tmax}°, vent ${vent} km/h, précipitations ${pr} mm.`
    : `À l’échelle nationale: ${desc}. ${tmin}°/${tmax}°, vent ${vent} km/h, ${pr} mm.`;
}

// ---------- Alerte (poll) ----------
async function loadAlerts(){
  try{
    const res = await fetch("/api/alerts");
    const alerts = await res.json();

    const cont = el("alertsContainer");
    cont.innerHTML = "";
    if(!Array.isArray(alerts) || !alerts.length){
      cont.innerHTML = `<div class="card"><h4>Alertes</h4><div class="meta">Aucune alerte active</div></div>`;
      return;
    }

    // filtre local/national
    const match = (a) => {
      const c = (a.country||"").toUpperCase();
      const r = (a.region||"").toLowerCase();
      return (c && c === lastCountry.toUpperCase())
          || (r && lastRegion && r.includes(lastRegion.toLowerCase()));
    };

    alerts.forEach(a=>{
      // Notif pour nouvelles alertes locales/nationales
      const key = a.id || `${a.country}-${a.region}-${a.timestamp}`;
      if(!knownAlertIds.has(key) && match(a)){
        knownAlertIds.add(key);
        const title = `⚠️ Alerte ${a?.data?.type || "météo"}`;
        const body = `${a.country||""} ${a.region||""} — Intensité ${a?.data?.intensity||"?"}, fiabilité ${a?.data?.reliability||"?"}%`;
        notify(title, body);
      }

      const rel = a?.data?.reliability ?? a?.data?.confidence ?? 75;
      const severityClass = rel>=90 ? "high" : rel<70 ? "low" : "mid";
      cont.innerHTML += `
        <div class="alert ${severityClass}">
          <div class="meta">
            <strong>${a?.data?.type || "Alerte"}</strong> — ${reliabilityBadge(rel)}
          </div>
          <div style="margin-top:6px">
            📍 ${a.country||"-"} ${a.region? "• "+a.region : ""} — ${a.continent? "("+a.continent+")":""}
          </div>
          <div style="color:var(--muted);margin-top:4px">
            ${a?.data?.message || a?.data?.summary || "Analyse en cours…"}
          </div>
        </div>
      `;
    });
  }catch(e){
    console.error("alerts error:", e);
    el("alertsContainer").innerHTML = `<div class="alert">Erreur chargement alertes</div>`;
  }
}

// ---------- Recherche adresse ----------
async function searchAddress(){
  const address = el("addressInput")?.value?.trim();
  if(!address) return;
  el("btnSearch").disabled = true;
  try{
    const resp = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`);
    const data = await resp.json();
    if(!data?.length){ alert("Adresse non trouvée"); return; }
    const best = data[0];
    const lat = parseFloat(best.lat), lon = parseFloat(best.lon);
    // essaie d’inférer le pays depuis display_name
    const parts = (best.display_name||"").split(",").map(s=>s.trim());
    const countryGuess = parts.at(-1) || lastCountry;
    await loadForecast(lat, lon, countryGuess, "");
    notify("📍 Localisation mise à jour", best.display_name || address);
  }catch(e){
    alert("Erreur recherche: "+e.message);
  }finally{
    el("btnSearch").disabled = false;
  }
}

// ---------- Géoloc ----------
function initGeolocation(){
  if(navigator.geolocation){
    navigator.geolocation.getCurrentPosition(
      (pos)=>loadForecast(pos.coords.latitude, pos.coords.longitude, lastCountry, lastRegion),
      ()=>loadForecast(lastLat, lastLon, lastCountry, lastRegion),
      { timeout:8000, maximumAge:300000 }
    );
  }else{
    loadForecast(lastLat, lastLon, lastCountry, lastRegion);
  }
}

// ---------- Notifications planifiées 2×/jour ----------
function clearDailyTimers(){
  dailyTimers.forEach(id=>clearTimeout(id));
  dailyTimers = [];
}
function msToNext(hour, minute){
  const now = new Date();
  const t = new Date();
  t.setHours(hour, minute, 0, 0);
  if(t <= now){ t.setDate(t.getDate()+1); }
  return t - now;
}
function scheduleDailyBriefs(){
  if(Notification?.permission!=="granted") return;
  clearDailyTimers();

  const scheduleAt = (h,m, label)=>{
    const wait = msToNext(h,m);
    const id = setTimeout(async ()=>{
      try{
        const res = await fetch("/api/superforecast", {
          method:"POST",
          headers:{ "Content-Type":"application/json" },
          body:JSON.stringify({ lat:lastLat, lon:lastLon, country:lastCountry, region:lastRegion })
        });
        const data = await res.json();
        const list = data?.local?.forecast || data?.forecast || [];
        const tomorrow = list?.[1] || list?.[0];
        if(tomorrow){
          const tmin = Math.round(tomorrow.temp_min ?? tomorrow.tmin ?? 0);
          const tmax = Math.round(tomorrow.temp_max ?? tomorrow.tmax ?? 0);
          const pr = Number(tomorrow.precip_mm ?? tomorrow.precip ?? 0).toFixed(1);
          const desc = tomorrow.description || "Ciel variable";
          notify(`🕑 Brief ${label}`, `Demain: ${desc}. ${tmin}°/${tmax}°, ${pr} mm, zone ${lastCountry}${lastRegion? " • "+lastRegion:""}.`);
        }
      }catch(e){ /* silencieux */ }
      scheduleDailyBriefs(); // replanifie pour le jour suivant
    }, wait);
    dailyTimers.push(id);
  };

  scheduleAt(7,30,"matin");   // 07:30
  scheduleAt(19,30,"soir");   // 19:30
}

// ---------- J.E.A.N. (ouverture/fermeture bulle + envoi Cohere) ----------
async function askJEAN(){
  const input = el("jean-input");
  const txt = input.value.trim();
  if(!txt) return;
  appendMsg(txt, true);
  input.value = "";
  try{
    const res = await fetch("/api/cohere", {
      method:"POST",
      headers:{ "Content-Type":"application/json" },
      body: JSON.stringify({
        message: txt,
        context: `Localisation approx: ${lastLat.toFixed(2)},${lastLon.toFixed(2)} (${lastCountry}${lastRegion? " • "+lastRegion:""})`
      })
    });
    const data = await res.json();
    appendMsg(data?.reply || "—", false);
    // synthèse vocale masculine
    try {
      const u = new SpeechSynthesisUtterance((data?.reply||"").replace(/\s+/g," ").trim());
      const voice = speechSynthesis.getVoices().find(v=>/male|fr|fr_/i.test(v.name)) || speechSynthesis.getVoices()[0];
      if(voice) u.voice = voice;
      u.pitch = 0.8; u.rate = 0.95;
      speechSynthesis.speak(u);
    } catch {}
  }catch(e){
    appendMsg("Désolé, J.E.A.N. est indisponible.", false);
  }
}
function appendMsg(t, you=false){
  const box = el("jean-msgs");
  const div = document.createElement("div");
  div.className = "msg "+(you?"you":"ai");
  div.textContent = t;
  box.appendChild(div);
  box.scrollTop = box.scrollHeight;
}

// ---------- INIT ----------
document.addEventListener("DOMContentLoaded", ()=>{
  // boutons index (si présents)
  el("btnSearch")?.addEventListener("click", searchAddress);
  el("addressInput")?.addEventListener("keydown", e=>{ if(e.key==="Enter") searchAddress(); });

  // JEAN UI
  const bubble = el("jean-bubble");
  const panel = el("jean-panel");
  const send = el("jean-send");
  bubble?.addEventListener("click", ()=>{ panel.style.display = (panel.style.display==="flex"?"none":"flex"); });
  send?.addEventListener("click", askJEAN);
  el("jean-input")?.addEventListener("keydown", e=>{ if(e.key==="Enter") askJEAN(); });

  // Notifications permission
  if("Notification" in window && Notification.permission!=="granted"){
    Notification.requestPermission().then(p=>{
      if(p==="granted"){ scheduleDailyBriefs(); }
    });
  } else if(Notification.permission==="granted"){
    scheduleDailyBriefs();
  }

  // Géoloc & données
  initGeolocation();
  loadAlerts();
  setInterval(loadAlerts, 60000);
});
