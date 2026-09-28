/* Svalbard cable DAS coverage: shared figure module (map + profile + mechanism).
   Data: window.DATA from calculations/prepare_data.py. Brand: DarkAnalytica v2. */
(function(){
const D = window.DATA;
const C = {page:"#F5F7FA",line:"#D8DEE6",ink:"#0E1726",ink2:"#3D4A5C",ink3:"#5F6B7C",navy:"#0B2545",steel:"#3E5C76",brass:"#8A6A1F",teal:"#2F6F73",land:"#E9EDF2",coast:"#8C98A8"};
const G = D.grid, NLA = G.lats.length, NLO = G.lons.length;
const la0 = G.lats[0], dla = G.lats[1]-G.lats[0], lo0 = G.lons[0], dlo = G.lons[1]-G.lons[0];
function zAt(lat, lon){
  const fi=(lat-la0)/dla, fj=(lon-lo0)/dlo;
  const i=Math.max(0,Math.min(NLA-2,Math.floor(fi))), j=Math.max(0,Math.min(NLO-2,Math.floor(fj)));
  const ti=Math.min(1,Math.max(0,fi-i)), tj=Math.min(1,Math.max(0,fj-j));
  const z=G.z; return (1-ti)*((1-tj)*z[i][j]+tj*z[i][j+1]) + ti*((1-tj)*z[i+1][j]+tj*z[i+1][j+1]);
}
// scenario -> list of heard intervals in real km, plus mode
function scenario(name){
  const L=D.L, s=D.span;
  if(name==="single") return {heard:[[0,s]], mode:"das", label:"one landing"};
  if(name==="dual") return {heard:[[0,s],[L-s,L]], mode:"das", label:"both landings"};
  if(name==="esf") return {heard:[[0,s],[L-s,L]], mode:"das", label:"enhanced-scattering fibre"};
  if(name==="loop") return {heard:[[0,L]], mode:"loop", label:"loopback repeaters"};
  if(name==="sop") return {heard:[[0,L]], mode:"sop", label:"polarisation on live traffic"};
}
// position along route geometry for real km
function routePoint(kmReal){
  const g=kmReal/D.scale, cum=D.route_cum_km, r=D.route;
  let i=1; while(i<cum.length-1 && cum[i]<g) i++;
  const t=Math.max(0,Math.min(1,(g-cum[i-1])/(cum[i]-cum[i-1])));
  return [r[i-1][0]+t*(r[i][0]-r[i-1][0]), r[i-1][1]+t*(r[i][1]-r[i-1][1])];
}
function routeSlice(a,b,n){ const out=[]; for(let k=0;k<=n;k++) out.push(routePoint(a+(b-a)*k/n)); return out; }

function depthColor(z){
  if(z>=0) return [233,237,242];
  const t=Math.min(1,Math.pow(-z/3600,0.72));
  const a=[222,231,240], b=[11,37,69];
  return a.map((v,k)=>Math.round(v+(b[k]-v)*t));
}

/* ---------------- MAP ---------------- */
window.drawMap=function(host,o){
  const W=o.w,H=o.h, lonMin=o.lonMin??4.2, lonMax=o.lonMax??23.8, latMin=o.latMin??68.5, latMax=o.latMax??78.95;
  const k=Math.cos(74*Math.PI/180);
  const sx=W/((lonMax-lonMin)*k), sy=H/(latMax-latMin), sc=Math.min(sx,sy);
  const ox=(W-(lonMax-lonMin)*k*sc)/2, oy=(H-(latMax-latMin)*sc)/2;
  const P=(lon,lat)=>[ox+(lon-lonMin)*k*sc, oy+(latMax-lat)*sc];
  const inv=(x,y)=>[lonMin+(x-ox)/(k*sc), latMax-(y-oy)/sc];
  host.innerHTML=""; host.style.position="relative"; host.style.width=W+"px"; host.style.height=H+"px";
  // raster
  const cv=document.createElement("canvas"), dpr=o.dpr||2; cv.width=W*dpr; cv.height=H*dpr; cv.style.cssText=`position:absolute;inset:0;width:${W}px;height:${H}px;border-radius:6px`;
  host.appendChild(cv); const cx=cv.getContext("2d"); const img=cx.createImageData(cv.width,cv.height);
  const step=1/(dpr);
  for(let py=0;py<cv.height;py++){ for(let px=0;px<cv.width;px++){
    const [lon,lat]=inv(px/dpr,py/dpr); const z=zAt(lat,lon);
    let c=depthColor(z);
    // hillshade from local gradient (light from NW)
    const e=0.02, zx=zAt(lat,lon+e*4)-zAt(lat,lon-e*4), zy=zAt(lat+e,lon)-zAt(lat-e,lon);
    const sh=Math.max(-1,Math.min(1,(-zx*0.6+zy*0.8)/900));
    const f= z<0 ? 1+sh*0.16 : 1+sh*0.05;
    const idx=(py*cv.width+px)*4; img.data[idx]=Math.min(255,c[0]*f); img.data[idx+1]=Math.min(255,c[1]*f); img.data[idx+2]=Math.min(255,c[2]*f); img.data[idx+3]=255;
  }}
  cx.putImageData(img,0,0);
  // vector overlay
  const svg=d3.select(host).append("svg").attr("width",W).attr("height",H).style("position","absolute").style("inset","0").style("overflow","visible");
  // contours from upsampled grid
  const UP=3, nx=(NLO-1)*UP+1, ny=(NLA-1)*UP+1, vals=new Float64Array(nx*ny);
  for(let r=0;r<ny;r++){ const lat=la0+(ny-1-r)*dla/UP; for(let c=0;c<nx;c++){ vals[r*nx+c]=zAt(lat,lo0+c*dlo/UP);} }
  const cont=d3.contours().size([nx,ny]).thresholds([-3000,-2000,-1000,-500,0])(vals);
  const gp=(x,y)=>{const lon=lo0+x*dlo/UP, lat=la0+(ny-1-y)*dla/UP; return P(lon,lat);};
  const path=d3.geoPath(d3.geoTransform({point(x,y){const p=gp(x,y); this.stream.point(p[0],p[1]);}}));
  svg.append("defs").html(`<clipPath id="mclip-${o.id}"><rect width="${W}" height="${H}" rx="6"/></clipPath>`);
  const gC=svg.append("g").attr("clip-path",`url(#mclip-${o.id})`);
  cont.forEach(c=>{ const v=c.value; gC.append("path").attr("d",path(c)).attr("fill","none")
    .attr("stroke", v===0? C.coast : "#FFFFFF").attr("stroke-width", v===0?1.1:0.7).attr("stroke-opacity", v===0?1:(v<=-1000?0.35:0.22)); });
  // isobath labels (placed manually along the Norwegian Sea slope)
  const iso=o.isoLabels||[[-1000,8.4,72.6],[-2000,6.6,73.6],[-3000,5.4,71.2]];
  iso.forEach(([v,lon,lat])=>{const p=P(lon,lat); gC.append("text").attr("x",p[0]).attr("y",p[1]).text(`${-v} m`).attr("fill","#FFFFFF").attr("fill-opacity",.7).attr("font-family","IBM Plex Mono").attr("font-size",o.fs*0.72);});
  const sc0=scenario(o.scenario||"dual");
  // Landrø DAS study fibre (schematic)
  if(o.study!==false){ const a=P(15.64,78.22), b=P(11.93,78.925);
    gC.append("path").attr("d",`M${a[0]},${a[1]} Q${(a[0]+b[0])/2-14},${(a[1]+b[1])/2+10} ${b[0]},${b[1]}`).attr("fill","none").attr("stroke",C.steel).attr("stroke-width",1.6).attr("stroke-dasharray","3 3"); }
  const line=d3.line().x(d=>P(d[0],d[1])[0]).y(d=>P(d[0],d[1])[1]);
  // full route (deaf by default)
  const deafCol=C.brass, heardCol=C.teal;
  if(sc0.mode==="sop"){
    gC.append("path").attr("d",line(routeSlice(0,D.L,120))).attr("fill","none").attr("stroke",heardCol).attr("stroke-width",o.rw).attr("stroke-dasharray","2 5").attr("stroke-linecap","round");
  } else {
    gC.append("path").attr("d",line(routeSlice(0,D.L,120))).attr("fill","none").attr("stroke","#FFFFFF").attr("stroke-width",o.rw+3).attr("stroke-opacity",.85);
    gC.append("path").attr("d",line(routeSlice(0,D.L,120))).attr("fill","none").attr("stroke",deafCol).attr("stroke-width",o.rw);
    sc0.heard.forEach(([a,b])=>gC.append("path").attr("d",line(routeSlice(a,b,40))).attr("fill","none").attr("stroke",heardCol).attr("stroke-width",o.rw+1.5).attr("stroke-linecap","round"));
  }
  // repeaters
  for(let i=1;i<=20;i++){ const q=routePoint(i*D.span), p=P(q[0],q[1]);
    gC.append("circle").attr("cx",p[0]).attr("cy",p[1]).attr("r",o.rr).attr("fill","#FFFFFF").attr("stroke",C.navy).attr("stroke-width",1.4); }
  // landings
  [[15.64,78.22],[16.2,69.737]].forEach(q=>{const p=P(q[0],q[1]); gC.append("rect").attr("x",p[0]-o.rr*1.3).attr("y",p[1]-o.rr*1.3).attr("width",o.rr*2.6).attr("height",o.rr*2.6).attr("fill",C.ink);});
  // hover marker
  const hov=gC.append("circle").attr("r",o.rr*1.8).attr("fill","none").attr("stroke",C.ink).attr("stroke-width",2).style("display","none");
  host._hover=(km)=>{ if(km==null){hov.style("display","none");return;} const q=routePoint(km),p=P(q[0],q[1]); hov.attr("cx",p[0]).attr("cy",p[1]).style("display",null); };
  // labels
  (o.labels||[]).forEach(l=>{ const p=P(l.lon,l.lat); const t=gC.append("text").attr("x",p[0]+(l.dx||0)).attr("y",p[1]+(l.dy||0)).text(l.t)
     .attr("font-family",l.mono?"IBM Plex Mono":"IBM Plex Sans").attr("font-size",l.fs||o.fs).attr("font-weight",l.w||500).attr("fill",l.c||C.ink).attr("text-anchor",l.a||"start");
     if(l.halo) t.attr("stroke",l.halo).attr("stroke-width",4).attr("paint-order","stroke").attr("stroke-linejoin","round");
     if(l.ls) t.attr("letter-spacing",l.ls); });
  // scale bar 100 km (1 deg lat = 111.2 km)
  const px100=100/111.2*sc, sb=o.scaleBar||[W-px100-18,H-22];
  gC.append("line").attr("x1",sb[0]).attr("x2",sb[0]+px100).attr("y1",sb[1]).attr("y2",sb[1]).attr("stroke",o.sbColor||"#FFFFFF").attr("stroke-width",2);
  gC.append("text").attr("x",sb[0]+px100/2).attr("y",sb[1]-6).attr("text-anchor","middle").text("100 km").attr("font-family","IBM Plex Mono").attr("font-size",o.fs*0.72).attr("fill",o.sbColor||"#FFFFFF");
  host._P=P; return {P};
};

/* ---------------- PROFILE ---------------- */
window.drawProfile=function(host,o){
  const W=o.w,H=o.h,m=o.m||{l:52,r:10,t:22,b:30}, L=D.L, ZM=2600;
  host.innerHTML="";
  const svg=d3.select(host).append("svg").attr("width",W).attr("height",H).style("overflow","visible");
  const x=d3.scaleLinear([0,L],[m.l,W-m.r]), y=d3.scaleLinear([0,-ZM],[m.t,H-m.b]);
  const sc0=scenario(o.scenario||"dual");
  // deaf band / heard bands
  if(sc0.mode==="sop"){
    svg.append("defs").html(`<pattern id="hatch-${o.id}" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="6" stroke="${C.teal}" stroke-width="1.2" stroke-opacity=".45"/></pattern>`);
    svg.append("rect").attr("x",x(0)).attr("y",m.t).attr("width",x(L)-x(0)).attr("height",H-m.t-m.b).attr("fill",`url(#hatch-${o.id})`);
  } else {
    svg.append("rect").attr("x",x(0)).attr("y",m.t).attr("width",x(L)-x(0)).attr("height",H-m.t-m.b).attr("fill","#F4EFE2");
    sc0.heard.forEach(([a,b])=>svg.append("rect").attr("x",x(a)).attr("y",m.t).attr("width",x(b)-x(a)).attr("height",H-m.t-m.b).attr("fill","#E2EEEE"));
  }
  // grid
  [0,-1000,-2000].forEach(z=>{ svg.append("line").attr("x1",m.l).attr("x2",W-m.r).attr("y1",y(z)).attr("y2",y(z)).attr("stroke","#FFFFFF").attr("stroke-width",1);
    svg.append("text").attr("x",m.l-8).attr("y",y(z)+4).attr("text-anchor","end").text(`${Math.abs(z).toLocaleString("en")} m`).attr("font-family","IBM Plex Mono").attr("font-size",o.fs*0.8).attr("fill",C.ink3); });
  // seabed
  const pts=D.profile.map(p=>[p[0],Math.min(0,p[1])]);
  const area=d3.area().x(d=>x(d[0])).y0(H-m.b).y1(d=>y(d[1])).curve(d3.curveMonotoneX);
  svg.append("defs").html(`<linearGradient id="sea-${o.id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5C7A96"/><stop offset="1" stop-color="${C.navy}"/></linearGradient>`);
  svg.append("path").attr("d",area(pts)).attr("fill",`url(#sea-${o.id})`);
  svg.append("path").attr("d",d3.line().x(d=>x(d[0])).y(d=>y(d[1])).curve(d3.curveMonotoneX)(pts)).attr("fill","none").attr("stroke",C.navy).attr("stroke-width",1.4);
  // cable along the seabed
  const cab=d3.line().x(d=>x(d[0])).y(d=>y(d[1])-3).curve(d3.curveMonotoneX);
  if(sc0.mode!=="sop"){
    svg.append("path").attr("d",cab(pts)).attr("fill","none").attr("stroke",C.brass).attr("stroke-width",o.cw||3);
    sc0.heard.forEach(([a,b])=>svg.append("path").attr("d",cab(pts.filter(p=>p[0]>=a-1&&p[0]<=b+1))).attr("fill","none").attr("stroke",C.teal).attr("stroke-width",(o.cw||3)+1.5));
  }
  // repeaters
  for(let i=1;i<=20;i++){ const k=i*D.span, xx=x(k);
    svg.append("line").attr("x1",xx).attr("x2",xx).attr("y1",m.t).attr("y2",H-m.b).attr("stroke",C.navy).attr("stroke-opacity",.18).attr("stroke-dasharray","2 3");
    svg.append("path").attr("d",`M${xx-4.5},${m.t-9} L${xx+4.5},${m.t-9} L${xx},${m.t-1.5} Z`).attr("fill",C.navy); }
  // axis
  (o.ticks||[0,250,500,750,1000,1250]).forEach(k=>svg.append("text").attr("x",x(k)).attr("y",H-m.b+16).attr("text-anchor","middle").text(k.toLocaleString("en")).attr("font-family","IBM Plex Mono").attr("font-size",o.fs*0.8).attr("fill",C.ink3));
  // hover
  if(o.onHover){ const hl=svg.append("line").attr("y1",m.t).attr("y2",H-m.b).attr("stroke",C.ink).attr("stroke-width",1.5).style("display","none");
    const tt=svg.append("text").attr("font-family","IBM Plex Mono").attr("font-size",o.fs*0.85).attr("fill",C.ink).attr("stroke","#fff").attr("stroke-width",4).attr("paint-order","stroke");
    svg.append("rect").attr("x",m.l).attr("y",m.t).attr("width",W-m.l-m.r).attr("height",H-m.t-m.b).attr("fill","transparent")
      .on("mousemove",ev=>{ const km=x.invert(d3.pointer(ev)[0]); const d=d3.least(D.profile,p=>Math.abs(p[0]-km));
        hl.attr("x1",x(km)).attr("x2",x(km)).style("display",null);
        const heard=sc0.mode!=="das"||sc0.heard.some(([a,b])=>km>=a&&km<=b);
        tt.attr("x",Math.min(x(km)+8,W-190)).attr("y",m.t+16).text(`km ${Math.round(km)} · ${Math.round(-Math.min(0,d[1]))} m · ${sc0.mode==="sop"?"heard, not located":(heard?"heard":"deaf")}`);
        o.onHover(km); })
      .on("mouseleave",()=>{hl.style("display","none"); tt.text(""); o.onHover(null);}); }
  return {x,y,svg};
};
window.SCN=scenario; window.C_=C;
})();
