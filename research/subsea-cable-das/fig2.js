/* DarkAnalytica · Svalbard cable investigation · figures 2-5 (crossings, timeline, coverage multiples).
   Data: window.DATA (route, depth profile) + window.DATA2 (AIS crossings, incidents, sensitivity). */
(function(){
const D=window.DATA, D2=window.DATA2, C=window.C_;
const FAULT=[130,230];               // reported fault zone, km from Longyearbyen (operator estimate via NUPI Policy Brief 1/2023, see note 9)
const fmt=d3.format(",");
function routePoint(km){ const g=km/D.scale,cum=D.route_cum_km,r=D.route; let i=1; while(i<cum.length-1&&cum[i]<g)i++;
  const t=Math.max(0,Math.min(1,(g-cum[i-1])/(cum[i]-cum[i-1]))); return [r[i-1][0]+t*(r[i][0]-r[i-1][0]),r[i-1][1]+t*(r[i][1]-r[i-1][1])]; }
window.routePoint_=routePoint;

/* crossings + fault zone + markers on an existing map (host must hold drawMap output) */
window.overlayMap=function(host,o){
  const P=host._P, g=d3.select(host).select("svg g");
  // fault zone bracket along the route
  const seg=[]; for(let k=FAULT[0];k<=FAULT[1];k+=5) seg.push(routePoint(k));
  g.append("path").attr("d",d3.line().x(d=>P(d[0],d[1])[0]).y(d=>P(d[0],d[1])[1])(seg)).attr("fill","none")
   .attr("stroke","#B7791F").attr("stroke-width",14).attr("stroke-opacity",.28).attr("stroke-linecap","round");
  // crossings (jan 2022) jittered across the line for legibility
  if(o.crossings!==false){ let s=7;const rnd=()=>{s=(s*16807)%2147483647;return (s-1)/2147483646};
    D2.jan2022.crossings.forEach(c=>{ const q=routePoint(c.km), p=P(q[0],q[1]);
      g.append("circle").attr("cx",p[0]+(rnd()-.5)*10).attr("cy",p[1]+(rnd()-.5)*10).attr("r",o.cr||2.1)
       .attr("fill",c.flag==="Russia"?"#8A6A1F":"#3E5C76").attr("fill-opacity",.75).attr("stroke","#fff").attr("stroke-width",.4); }); }
  // markers
  (o.marks||[]).forEach(m=>{ const p=P(m.lon,m.lat);
    g.append("path").attr("d",d3.symbol(d3.symbolDiamond,70)()).attr("transform",`translate(${p[0]},${p[1]})`).attr("fill",m.c||C.navy).attr("stroke","#fff").attr("stroke-width",1.2);
    const t=g.append("text").attr("x",p[0]+(m.dx||8)).attr("y",p[1]+(m.dy||4)).text(m.t).attr("font-family","IBM Plex Mono").attr("font-size",o.fs||11)
      .attr("fill",m.tc||C.ink).attr("text-anchor",m.a||"start").attr("stroke","#fff").attr("stroke-width",3.2).attr("paint-order","stroke"); });
};

/* Figure 2: crossings along the route, over depth, with heard zones and the fault zone */
window.drawCrossings=function(host,o){
  const W=o.w,H=o.h,m={l:58,r:14,t:48,b:34}, L=D.L;
  host.innerHTML=""; const svg=d3.select(host).append("svg").attr("width",W).attr("height",H).attr("role","img").attr("aria-label","Vessel crossings of the cable route by distance from Longyearbyen, over seabed depth");
  const x=d3.scaleLinear([0,L],[m.l,W-m.r]);
  const hB=(H-m.t-m.b)*0.46, yB0=m.t+hB;             // bars band
  const yD=d3.scaleLinear([0,-2800],[yB0+18,H-m.b]);  // depth band
  const bin=10, series=o.series==="y2025"?D2.y2025.crossings:D2.jan2022.crossings;
  const bins=d3.bin().domain([0,L]).thresholds(d3.range(0,L+bin,bin)).value(d=>d.km)(series);
  const yB=d3.scaleLinear([0,Math.max(4,d3.max(bins,b=>b.length))],[yB0,m.t]).nice();
  // heard zones
  [[0,D.span],[L-D.span,L]].forEach(([a,b])=>svg.append("rect").attr("x",x(a)).attr("y",m.t).attr("width",x(b)-x(a)).attr("height",H-m.t-m.b).attr("fill","#E2EEEE"));
  // fault zone
  svg.append("rect").attr("x",x(FAULT[0])).attr("y",m.t).attr("width",x(FAULT[1])-x(FAULT[0])).attr("height",H-m.t-m.b).attr("fill","#F4EFE2");
  svg.append("text").attr("x",x(FAULT[0])).attr("y",m.t-8).attr("text-anchor","start").text(W<640?"2022 fault zone":"2022 fault zone (reported)").attr("font-family","IBM Plex Mono").attr("font-size",11).attr("fill","#80550F");
  svg.append("text").attr("x",x(0)).attr("y",m.t-8).attr("text-anchor","end").text("heard ›").attr("dx",-4).attr("font-family","IBM Plex Mono").attr("font-size",11).attr("fill",C.teal);
  // repeaters
  for(let i=1;i<=20;i++){ const k=i*D.span; svg.append("line").attr("x1",x(k)).attr("x2",x(k)).attr("y1",m.t).attr("y2",H-m.b).attr("stroke",C.navy).attr("stroke-opacity",.14).attr("stroke-dasharray","2 3"); }
  // bars stacked by flag
  bins.forEach(b=>{ const ru=b.filter(d=>d.flag==="Russia").length, ot=b.length-ru;
    if(ot) svg.append("rect").attr("x",x(b.x0)+.5).attr("width",Math.max(1,x(b.x1)-x(b.x0)-1)).attr("y",yB(ot)).attr("height",yB0-yB(ot)).attr("fill",C.steel);
    if(ru) svg.append("rect").attr("x",x(b.x0)+.5).attr("width",Math.max(1,x(b.x1)-x(b.x0)-1)).attr("y",yB(ot+ru)).attr("height",yB(ot)-yB(ot+ru)).attr("fill",C.brass); });
  svg.append("line").attr("x1",m.l).attr("x2",W-m.r).attr("y1",yB0).attr("y2",yB0).attr("stroke",C.ink).attr("stroke-width",1);
  yB.ticks(3).forEach(t=>svg.append("text").attr("x",m.l-8).attr("y",yB(t)+4).attr("text-anchor","end").text(t).attr("font-family","IBM Plex Mono").attr("font-size",11).attr("fill",C.ink3));
  svg.append("text").attr("x",0).attr("y",12).attr("text-anchor","start").text("vessel crossings per 10 km of route").attr("font-family","IBM Plex Mono").attr("font-size",10.5).attr("fill",C.ink3);
  // depth
  const pts=D.profile.map(p=>[p[0],Math.min(0,p[1])]);
  svg.append("path").attr("d",d3.area().x(d=>x(d[0])).y0(H-m.b).y1(d=>yD(d[1])).curve(d3.curveMonotoneX)(pts)).attr("fill","#1F3A5F").attr("fill-opacity",.85);
  [0,-1000,-2000].forEach(z=>svg.append("text").attr("x",m.l-8).attr("y",yD(z)+4).attr("text-anchor","end").text(`${Math.abs(z).toLocaleString("en")} m`).attr("font-family","IBM Plex Mono").attr("font-size",11).attr("fill",C.ink3));
  [0,250,500,750,1000,1250].forEach(k=>svg.append("text").attr("x",x(k)).attr("y",H-m.b+18).attr("text-anchor","middle").text(fmt(k)+(k?"":" km")).attr("font-family","IBM Plex Mono").attr("font-size",11).attr("fill",C.ink3));
  svg.append("text").attr("x",W-m.r).attr("y",H-4).attr("text-anchor","end").text("km from Longyearbyen along the approximate route").attr("font-family","IBM Plex Mono").attr("font-size",10.5).attr("fill",C.ink3);
};

const TL_LABEL={"2021-04-03":"LoVe observatory cable","2022-01-07":"Svalbard cable, no vessel named","2026-spring":"GUGI submersibles reported"};
const TL_DX={"2024-11-18":-44,"2025-01-26":40,"2021-04-03":46,"2026-spring":-70};
const tlDate=s=>s.length===10?s.slice(0,7):s.slice(0,4)+" spring";
/* Figure 3: incident timeline, Arctic vs Baltic lanes */
window.drawTimeline=function(host,o){
  if(o.w<640) return drawTimelineList(host,o);
  const W=o.w,H=o.h,m={l:78,r:16,t:16,b:30};
  host.innerHTML=""; const svg=d3.select(host).append("svg").attr("width",W).attr("height",H).attr("role","img").attr("aria-label","Timeline of subsea infrastructure incidents, Arctic and Baltic, 2021-2026");
  const pd=s=>s.length===10?new Date(s):new Date(s.slice(0,4)+"-04-15");
  const nm=d=>TL_LABEL[d.date]||d.vessel.split(";")[0];
  const x=d3.scaleTime([new Date("2021-01-01"),new Date("2026-12-31")],[m.l,W-m.r]);
  const lanes={"Arctic":m.t+34,"Baltic":m.t+34+(H-m.t-m.b-40)*0.62};
  Object.entries(lanes).forEach(([k,y])=>{ svg.append("line").attr("x1",m.l).attr("x2",W-m.r).attr("y1",y).attr("y2",y).attr("stroke",C.line);
    svg.append("text").attr("x",m.l-10).attr("y",y+4).attr("text-anchor","end").text(k.toUpperCase()).attr("font-family","IBM Plex Mono").attr("font-size",11).attr("fill",C.ink3).attr("letter-spacing",".1em"); });
  d3.range(2021,2027).forEach(yr=>svg.append("text").attr("x",x(new Date(yr+"-01-01"))).attr("y",H-8).text(yr).attr("font-family","IBM Plex Mono").attr("font-size",11).attr("fill",C.ink3));
  const items=D2.incidents.map(d=>({d,lane:d.region.startsWith("Baltic")?"Baltic":"Arctic",t:pd(d.date)}));
  const used={};
  items.forEach((it,i)=>{ const X=x(it.t), Y=lanes[it.lane]; const k=it.lane; used[k]=(used[k]||0)+1; const up=(used[k]%2===1);
    const col=it.lane==="Arctic"?C.brass:C.steel;
    svg.append("circle").attr("cx",X).attr("cy",Y).attr("r",6).attr("fill",col).attr("stroke","#fff").attr("stroke-width",1.5);
    const ty=up?Y-14:Y+22, lbl=nm(it.d); const dx=TL_DX[it.d.date]||0;
    const t=svg.append("text").attr("x",X).attr("y",ty).attr("text-anchor","middle").attr("font-family","IBM Plex Sans").attr("font-size",12).attr("fill",C.ink);
    t.attr("x",X+dx); t.append("tspan").attr("x",X+dx).attr("font-weight",600).text(tlDate(it.d.date));
    t.append("tspan").attr("x",X+dx).attr("dy",up?-14:14).attr("fill",C.ink2).text(lbl);
  });
};

/* narrow screens: the timeline as a dated list */
function drawTimelineList(host,o){
  host.innerHTML=""; const W=o.w, rh=46, items=D2.incidents.slice().sort((a,b)=>a.date<b.date?-1:1), H=items.length*rh+8;
  const svg=d3.select(host).append("svg").attr("width",W).attr("height",H).attr("role","img").attr("aria-label","Timeline of subsea infrastructure incidents, Arctic and Baltic, 2021-2026");
  svg.append("line").attr("x1",74).attr("x2",74).attr("y1",10).attr("y2",H-10).attr("stroke",C.line);
  items.forEach((d,i)=>{ const y=i*rh+22, arc=!d.region.startsWith("Baltic"), col=arc?C.brass:C.steel;
    svg.append("text").attr("x",0).attr("y",y+4).text(tlDate(d.date).replace(" spring","")).attr("font-family","IBM Plex Mono").attr("font-size",11.5).attr("fill",C.ink3);
    svg.append("circle").attr("cx",74).attr("cy",y).attr("r",6).attr("fill",col).attr("stroke","#fff").attr("stroke-width",1.5);
    svg.append("text").attr("x",88).attr("y",y+4).text((arc?"ARCTIC":"BALTIC")).attr("font-family","IBM Plex Mono").attr("font-size",10).attr("letter-spacing",".1em").attr("fill",col);
    svg.append("text").attr("x",140).attr("y",y+4).text((TL_LABEL[d.date]||d.vessel.split(";")[0]).slice(0,Math.floor((W-140)/6.6))).attr("font-family","IBM Plex Sans").attr("font-size",12.5).attr("fill",C.ink); });
}

/* Figure 4: coverage small multiples */
window.drawMultiples=function(host,o){
  const L=D.L,s=D.span,W=o.w; host.innerHTML="";
  const rows=[["DAS from one landing","commercial","4.8 %",[[0,s]],"das"],["DAS from both landings","commercial","9.5 %",[[0,s],[L-s,L]],"das"],["Enhanced-scattering fibre","commercial, 200 km reach","9.5 %",[[0,s],[L-s,L]],"das"],["Loopback repeaters","demonstrated, not commercial","100 %",[[0,L]],"loop"],["Polarisation on live traffic","research, no location","100 %",[[0,L]],"sop"]];
  const x=d3.scaleLinear([0,L],[0,W-280]);
  rows.forEach(([t,n,v,h,mode],i)=>{ const svg=d3.select(host).append("svg").attr("width",W).attr("height",34).attr("role","img").attr("aria-label",t+": "+v);
    svg.append("text").attr("x",0).attr("y",15).text(t).attr("font-family","IBM Plex Sans").attr("font-size",14).attr("fill",C.ink);
    svg.append("text").attr("x",0).attr("y",30).text(n).attr("font-family","IBM Plex Mono").attr("font-size",10.5).attr("fill",C.ink3);
    const g=svg.append("g").attr("transform","translate(210,0)");
    g.append("rect").attr("y",11).attr("width",x(L)).attr("height",9).attr("rx",2).attr("fill",C.brass);
    if(mode==="sop"){ svg.append("defs").html(`<pattern id="hh${i}" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="5" height="5" fill="#E2EEEE"/><line x1="0" y1="0" x2="0" y2="5" stroke="${C.teal}" stroke-width="2"/></pattern>`);
      g.append("rect").attr("y",11).attr("width",x(L)).attr("height",9).attr("rx",2).attr("fill",`url(#hh${i})`); }
    else h.forEach(([a,b])=>g.append("rect").attr("x",x(a)).attr("y",11).attr("width",x(b)-x(a)).attr("height",9).attr("rx",2).attr("fill",mode==="loop"?"#5F9A9D":C.teal));
    g.append("rect").attr("x",x(FAULT[0])).attr("y",7).attr("width",x(FAULT[1])-x(FAULT[0])).attr("height",17).attr("fill","none").attr("stroke","#B7791F").attr("stroke-width",1.4).attr("stroke-dasharray","3 2");
    for(let k=1;k<=20;k++) g.append("line").attr("x1",x(k*s)).attr("x2",x(k*s)).attr("y1",8).attr("y2",23).attr("stroke",C.navy).attr("stroke-opacity",mode==="loop"?.9:.35);
    svg.append("text").attr("x",W).attr("y",20).attr("text-anchor","end").text(v).attr("font-family","IBM Plex Mono").attr("font-size",14).attr("font-weight",600).attr("fill",C.ink);
  });
};
})();
