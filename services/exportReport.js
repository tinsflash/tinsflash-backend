import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { createCanvas, loadImage } from "canvas";
import fetch from "node-fetch";

export async function createFullReportPDF(alert, mode="simple"){
  const doc=new jsPDF({orientation:"portrait",unit:"mm",format:"A4"});
  const m=14;
  doc.setFontSize(16);
  doc.text("TINSFLASH – Rapport d’Alerte IA",m,20);
  doc.setFontSize(12);
  doc.text(`Zone : ${alert.zone}`,m,30);
  doc.text(`Titre : ${alert.title}`,m,38);
  doc.text(`Certitude IA : ${alert.certainty||0}%`,m,46);
  doc.text(`Date : ${new Date(alert.createdAt).toLocaleString()}`,m,54);
  doc.text(`Mode : ${mode}`,m,62);
  doc.line(m,66,195,66);
  doc.setFontSize(11);
  doc.text(`Description : ${alert.description||"Aucune"}`,m,76,{maxWidth:180});

  const rows=Object.entries(alert.details||{}).map(([k,v])=>[k,String(v)]);
  if(rows.length>0){
    autoTable(doc,{startY:90,head:[["Paramètre","Valeur"]],body:rows,theme:"grid",styles:{fontSize:9}});
  }

  const lat=alert.geo?.lat||0,lon=alert.geo?.lon||0;
  const zoom=6,color=alert.certainty>=90?"00ff80":alert.certainty>=70?"ffc107":"ff7043";
  try{
    const map=`https://static-maps.yandex.ru/1.x/?ll=${lon},${lat}&z=${zoom}&l=map&size=450,350&pt=${lon},${lat},pm2${color}l`;
    const img=await (await fetch(map)).arrayBuffer();
    const i=await loadImage(Buffer.from(img));
    const c=createCanvas(150,120),ctx=c.getContext("2d");
    ctx.drawImage(i,0,0,150,120);
    const mapData=c.toDataURL("image/png");
    const y=(doc.lastAutoTable?.finalY||110)+10;
    doc.addImage(mapData,"PNG",m,y,90,72);
    doc.setFontSize(10);
    doc.text(`Coordonnées : ${lat.toFixed(3)}°, ${lon.toFixed(3)}°`,m+95,y+10);
    doc.text(`Couleur IA : ${alert.certainty}%`,m+95,y+18);
    doc.text("Sources : OSM / Yandex / IA J.E.A.N",m+95,y+26);
  }catch{
    doc.text("Carte indisponible.",m,(doc.lastAutoTable?.finalY||110)+10);
  }

  const yS=(doc.lastAutoTable?.finalY||110)+90;
  doc.setFontSize(11);
  doc.text("Analyse IA détaillée :",m,yS);
  const lines=alert.aiSummary?.split("\n")||["Non spécifiée"];
  let y=yS+8;
  lines.forEach(l=>{doc.text(l,m,y,{maxWidth:180});y+=6;});
  doc.setFontSize(9);
  doc.text("Rapport généré automatiquement par TINSFLASH – IA J.E.A.N (Everest v2.6)",m,285);
  return doc.output("arraybuffer");
}
