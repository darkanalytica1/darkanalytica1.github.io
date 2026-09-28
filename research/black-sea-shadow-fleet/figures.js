/* Figures for "Positions that lie". Data: window.D (data.js). d3 v7, local. */
(function () {
  const C = { page: "#F5F7FA", ink: "#0E1726", ink2: "#3D4A5C", ink3: "#5F6B7C", line: "#D8DEE6", navy: "#0B2545", steel: "#3E5C76", brass: "#8A6A1F", teal: "#2F6F73", land: "#D9DEE5", landEdge: "#A7B2C0" };
  const G = D.geo;
  const mono = "IBM Plex Mono, monospace";
  const reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function feat(c) { let f = { type: "Polygon", coordinates: c }; if (d3.geoArea(f) > 2 * Math.PI) f = { type: "Polygon", coordinates: c.map(r => r.slice().reverse()) }; return f; }
  function depthFill(z) { return z > -50 ? "#D8E6F2" : z > -200 ? "#D6E3EE" : z > -1000 ? "#C5D6E5" : z > -2000 ? "#B6CADD" : "#A8BFD5"; }
  function contours(g, proj, path, svgG, levels) {
    const n = g.lons.length, m = g.lats.length, vals = new Float64Array(n * m);
    for (let j = 0; j < m; j++) for (let i = 0; i < n; i++) vals[j * n + i] = g.z[j][i];
    const dx = (g.lons[n - 1] - g.lons[0]) / (n - 1), dy = (g.lats[m - 1] - g.lats[0]) / (m - 1);
    const cs = d3.contours().size([n, m]).thresholds(levels)(vals.map(v => -v));
    const tr = d3.geoTransform({ point: function (x, y) { const p = proj([g.lons[0] + x * dx - dx / 2, g.lats[0] + y * dy - dy / 2]); this.stream.point(p[0], p[1]); } });
    const pth = d3.geoPath(tr);
    svgG.selectAll(null).data(cs).join("path").attr("d", pth).attr("fill", d => depthFill(-d.value)).attr("stroke", "none");
  }
  function base(svg, proj, grid, levels) {
    const path = d3.geoPath(proj);
    svg.append("rect").attr("width", "100%").attr("height", "100%").attr("fill", "#D8E6F2");
    contours(grid, proj, path, svg.append("g"), levels);
    svg.append("g").selectAll("path").data(G.land).join("path").attr("d", c => path(feat(c)))
      .attr("fill", C.land).attr("stroke", C.landEdge).attr("stroke-width", 0.6);
    return path;
  }

  /* ---------- Figure 1: hero map ---------- */
  function hero() {
    const el = document.getElementById("map"); if (!el) return;
    const W = el.clientWidth, H = Math.round(W * (W < 600 ? 0.72 : 0.52));
    el.innerHTML = "";
    const svg = d3.select(el).append("svg").attr("viewBox", `0 0 ${W} ${H}`).attr("width", "100%").attr("role", "img")
      .attr("aria-label", "Map of the Black Sea showing vessel traffic, the Romanian exclusive economic zone, Neptun Deep and the places where ships reported impossible positions");
    const proj = d3.geoMercator().fitExtent([[6, 6], [W - 6, H - 6]], { type: "MultiPoint", coordinates: [[27.3, 40.85], [41.8, 47.3]] });
    const path = base(svg, proj, G.gebco, [50, 200, 1000, 2000]);
    // EEZ
    svg.append("g").selectAll("path").data(G.eez).join("path").attr("d", c => path(feat(c)))
      .attr("fill", "rgba(11,37,69,0.05)").attr("stroke", C.navy).attr("stroke-width", 1.1).attr("stroke-dasharray", "4 3");
    // cables
    const cab = svg.append("g");
    G.cables.forEach(c => c.lines.forEach(l => cab.append("path").attr("d", path({ type: "LineString", coordinates: l })).attr("fill", "none").attr("stroke", C.teal).attr("stroke-width", 1).attr("opacity", 0.8)));
    const layer = svg.append("g");
    const r = d3.scaleSqrt().domain([0, d3.max(D.dens.all, d => d[2])]).range([0, (proj([27.4, 44])[0] - proj([27.3, 44])[0]) * 0.72]);
    const rs = d3.scaleSqrt().domain([0, d3.max(D.dens.sanc, d => d[2])]).range([0, (proj([27.4, 44])[0] - proj([27.3, 44])[0]) * 0.72]);
    const rc = d3.scaleSqrt().domain([0, d3.max(D.cells, d => d.vessels)]).range([2, W < 600 ? 12 : 22]);
    // Neptun and Constanta
    const pn = proj(G.neptun), pc = proj([28.65, 44.17]);
    const marks = svg.append("g");
    marks.append("circle").attr("cx", pn[0]).attr("cy", pn[1]).attr("r", 5).attr("fill", "none").attr("stroke", C.brass).attr("stroke-width", 1.6);
    marks.append("circle").attr("cx", pn[0]).attr("cy", pn[1]).attr("r", 1.8).attr("fill", C.brass);
    const lab = (p, t, dx, dy, a, col) => marks.append("text").attr("x", p[0] + dx).attr("y", p[1] + dy).attr("text-anchor", a || "start").style("font", `500 ${W < 600 ? 9 : 11}px ${mono}`).attr("fill", col || C.ink2).text(t);
    const sm = W < 600; sm ? lab(pn, "Neptun Deep", 0, 16, "middle", C.brass) : lab(pn, "Neptun Deep (approx.)", 8, 4, "start", C.brass);
    marks.append("circle").attr("cx", pc[0]).attr("cy", pc[1]).attr("r", 2.4).attr("fill", C.ink);
    sm ? lab(pc, "Constanța", 5, -6, "start", C.ink) : lab(pc, "Constanța", -6, -6, "end", C.ink);
    const pe = proj([sm ? 29.6 : 30.2, sm ? 43.2 : 43.55]); lab(pe, "ROMANIAN EEZ", 0, 0, "middle", C.navy);
    const pk = proj([36.6, 45.75]); lab(pk, "Kerch Strait", 0, 0, "middle");
    const pv = proj([37.78, 44.72]); marks.append("circle").attr("cx", pv[0]).attr("cy", pv[1]).attr("r", 2.4).attr("fill", C.ink); if (!sm) lab(pv, "Novorossiysk", 6, 12, "start", C.ink);
    const pb = proj([29.0, 41.1]); lab(pb, "Bosphorus", 4, 14, "start");
    const pka = proj([29.6, 42.4]); lab(pka, "KAFOS cable", 0, 0, "middle", C.teal);
    function draw(mode) {
      layer.selectAll("*").remove();
      if (mode === "all") {
        layer.selectAll("circle").data(D.dens.all).join("circle").attr("cx", d => proj([d[0], d[1]])[0]).attr("cy", d => proj([d[0], d[1]])[1])
          .attr("r", d => r(d[2])).attr("fill", C.steel).attr("opacity", 0.55);
      } else if (mode === "sanc") {
        layer.selectAll("circle").data(D.dens.sanc).join("circle").attr("cx", d => proj([d[0], d[1]])[0]).attr("cy", d => proj([d[0], d[1]])[1])
          .attr("r", d => rs(d[2])).attr("fill", C.brass).attr("opacity", 0.75);
      } else {
        layer.selectAll("circle").data(D.cells).join("circle").attr("cx", d => proj([d.lon, d.lat])[0]).attr("cy", d => proj([d.lon, d.lat])[1])
          .attr("r", d => rc(d.vessels)).attr("fill", "rgba(138,106,31,0.18)").attr("stroke", C.brass).attr("stroke-width", 1)
          .append("title").text(d => `${d.vessels} vessels reported this inland point (${d.lat.toFixed(2)}N ${d.lon.toFixed(2)}E${d.elev != null ? ", terrain " + Math.round(d.elev) + " m" : ""})`);
      }
      if (!reduce) layer.attr("opacity", 0).transition().duration(260).attr("opacity", 1);
    }
    draw(heroMode);
    document.querySelectorAll("#heroTabs button").forEach(b => b.onclick = () => {
      heroMode = b.dataset.m; document.querySelectorAll("#heroTabs button").forEach(x => x.setAttribute("aria-pressed", x === b)); draw(heroMode);
      document.querySelectorAll(".mode-note").forEach(n => n.hidden = n.dataset.m !== heroMode);
    });
  }
  let heroMode = "cells";

  /* ---------- Figure 2: small multiples ---------- */
  function multiples() {
    const el = document.getElementById("mult"); if (!el) return;
    el.innerHTML = "";
    const cols = el.clientWidth < 700 ? 1 : 2, gap = 14, w = (el.clientWidth - gap * (cols - 1)) / cols, h = Math.round(w * 0.62);
    D.mult.forEach((p, idx) => {
      const cell = d3.select(el).append("div").attr("class", "mcell").style("width", w + "px");
      cell.append("div").attr("class", "mono mt").text(p.title);
      const svg = cell.append("svg").attr("viewBox", `0 0 ${w} ${h}`).attr("width", "100%").attr("role", "img").attr("aria-label", p.title + ". " + p.sub);
      const proj = d3.geoMercator().fitExtent([[2, 2], [w - 2, h - 2]], { type: "MultiPoint", coordinates: [[p.bbox[0], p.bbox[1]], [p.bbox[2], p.bbox[3]]] });
      svg.append("defs").append("clipPath").attr("id", "mc" + idx).append("rect").attr("width", w).attr("height", h);
      const g = svg.append("g").attr("clip-path", `url(#mc${idx})`);
      base(g, proj, p.grid === "kerch" ? G.gebco_kerch : G.gebco, p.grid === "kerch" ? [20, 50, 200, 1000] : [50, 200, 1000, 2000]);
      if (p.eez) g.append("g").selectAll("path").data(G.eez).join("path").attr("d", c => d3.geoPath(proj)(feat(c))).attr("fill", "none").attr("stroke", C.navy).attr("stroke-dasharray", "4 3");
      const line = d3.line().x(d => proj(d)[0]).y(d => proj(d)[1]);
      p.tracks.forEach(t => {
        const col = t.g === "S" ? C.brass : C.steel;
        g.append("path").attr("d", line(t.pts)).attr("fill", "none").attr("stroke", col).attr("stroke-width", 0.9).attr("opacity", 0.75);
        g.append("g").selectAll("circle").data(t.pts).join("circle").attr("cx", d => proj(d)[0]).attr("cy", d => proj(d)[1]).attr("r", 1.4).attr("fill", col);
      });
      (p.marks || []).forEach(m => {
        const q = proj([m[0], m[1]]);
        g.append("circle").attr("cx", q[0]).attr("cy", q[1]).attr("r", 8).attr("fill", "none").attr("stroke", m[2] === "false fix" ? C.brass : C.ink).attr("stroke-width", m[2] === "false fix" ? 2.2 : 1.2);
        g.append("text").attr("x", q[0] + (m[3] || 10)).attr("y", q[1] + 4).attr("text-anchor", (m[3] || 10) < 0 ? "end" : "start").style("font", `600 11px ${mono}`).attr("fill", C.ink).text(m[2]);
      });
      cell.append("p").attr("class", "msub").text(p.sub);
    });
  }

  /* ---------- Figure 3: listed vs everyone, by region ---------- */
  function compare() {
    const el = document.getElementById("cmp"); if (!el) return;
    el.innerHTML = "";
    const R = D.regions.filter(d => d.O.vessels >= 20);
    const W = el.clientWidth, sm = W < 600, lw = sm ? 128 : 210, rowH = 34, H = R.length * rowH + 34;
    const svg = d3.select(el).append("svg").attr("viewBox", `0 0 ${W} ${H}`).attr("width", "100%").attr("role", "img").attr("aria-label", "Share of vessels with at least one inland position, listed vessels versus all others, by sea area");
    const x = d3.scaleLinear().domain([0, 1]).range([lw, W - (sm ? 14 : 150)]);
    svg.append("g").attr("transform", `translate(0,${H - 22})`).call(d3.axisBottom(x).ticks(W < 600 ? 3 : 5, "%").tickSize(-(H - 30))).call(g => {
      g.selectAll("line").attr("stroke", C.line); g.select(".domain").remove(); g.selectAll("text").style("font", `500 11px ${mono}`).attr("fill", C.ink3); });
    R.forEach((d, i) => {
      const y = 14 + i * rowH, so = d.O.land_vessels / d.O.vessels, ss = d.S.vessels ? d.S.land_vessels / d.S.vessels : null;
      svg.append("text").attr("x", lw - 10).attr("y", y + 4).attr("text-anchor", "end").style("font", `500 ${W < 600 ? 10 : 12.5}px IBM Plex Sans`).attr("fill", C.ink).text(d.short || d.name);
      if (ss != null) svg.append("line").attr("x1", x(so)).attr("x2", x(ss)).attr("y1", y).attr("y2", y).attr("stroke", C.line).attr("stroke-width", 3);
      svg.append("circle").attr("cx", x(so)).attr("cy", y).attr("r", 6).attr("fill", C.steel).append("title").text(`All other vessels: ${d.O.land_vessels} of ${d.O.vessels}`);
      if (ss != null) svg.append("circle").attr("cx", x(ss)).attr("cy", y).attr("r", 6).attr("fill", C.brass).append("title").text(`Listed vessels: ${d.S.land_vessels} of ${d.S.vessels}`);
      if (!sm) svg.append("text").attr("x", W - 2).attr("y", y + 4).attr("text-anchor", "end").style("font", `500 10.5px ${mono}`).attr("fill", C.ink3)
        .text(`${d.S.land_vessels}/${d.S.vessels} · ${d.O.land_vessels}/${d.O.vessels}`);
    });
  }

  /* ---------- Figure 4: lists ---------- */
  function lists() {
    const el = document.getElementById("lists"); if (!el) return;
    el.innerHTML = "";
    const L = D.lists.by_list, W = el.clientWidth, rowH = 30, lw = W < 600 ? 100 : 190, H = L.length * rowH + 10;
    const svg = d3.select(el).append("svg").attr("viewBox", `0 0 ${W} ${H}`).attr("width", "100%").attr("role", "img").attr("aria-label", "Number of Russia-linked vessels on each list");
    const x = d3.scaleLinear().domain([0, D.lists.total]).range([lw, W - 60]);
    L.forEach((d, i) => {
      const y = 6 + i * rowH;
      svg.append("text").attr("x", lw - 10).attr("y", y + 15).attr("text-anchor", "end").style("font", `500 ${W < 600 ? 10.5 : 12.5}px IBM Plex Sans`).attr("fill", C.ink).text(d.label);
      svg.append("rect").attr("x", lw).attr("y", y + 3).attr("height", 18).attr("width", x(D.lists.total) - lw).attr("fill", "#E9EDF2");
      svg.append("rect").attr("x", lw).attr("y", y + 3).attr("height", 18).attr("width", x(d.n) - lw).attr("fill", d.key === "GUR" ? C.brass : C.navy);
      svg.append("text").attr("x", x(d.n) + 6).attr("y", y + 16).style("font", `600 12px ${mono}`).attr("fill", C.ink).text(d.n.toLocaleString("en-GB"));
    });
  }

  /* ---------- Figure 5: detentions ---------- */
  function det() {
    const el = document.getElementById("det"); if (!el) return;
    el.innerHTML = "";
    const R = D.det, W = el.clientWidth, rowH = 30, lw = W < 600 ? 90 : 150, H = R.length * rowH + 10;
    const svg = d3.select(el).append("svg").attr("viewBox", `0 0 ${W} ${H}`).attr("width", "100%").attr("role", "img").attr("aria-label", "Black Sea MoU detentions 2022 to 2026 by port-state, with detentions of listed vessels");
    const x = d3.scaleLinear().domain([0, d3.max(R, d => d.total)]).range([lw, W - 110]);
    R.forEach((d, i) => {
      const y = 6 + i * rowH;
      svg.append("text").attr("x", lw - 10).attr("y", y + 15).attr("text-anchor", "end").style("font", `500 12.5px IBM Plex Sans`).attr("fill", C.ink).text(d.country);
      svg.append("rect").attr("x", lw).attr("y", y + 3).attr("height", 18).attr("width", x(d.total) - lw).attr("fill", "#C9D3DE");
      svg.append("rect").attr("x", lw).attr("y", y + 3).attr("height", 18).attr("width", Math.max(d.listed ? 2 : 0, x(d.listed) - lw)).attr("fill", C.brass);
      svg.append("text").attr("x", x(d.total) + 6).attr("y", y + 16).style("font", `500 11.5px ${mono}`).attr("fill", C.ink2).text(`${d.total} · listed ${d.listed}`);
    });
  }

  /* ---------- Figure 6: daily ---------- */
  function daily() {
    const el = document.getElementById("daily"); if (!el) return;
    el.innerHTML = "";
    const R = D.daily, W = el.clientWidth, H = W < 600 ? 190 : 220, m = { l: 40, r: 10, t: 10, b: 24 };
    const svg = d3.select(el).append("svg").attr("viewBox", `0 0 ${W} ${H}`).attr("width", "100%").attr("role", "img").attr("aria-label", "Vessels reporting inland positions per sampled day");
    const x = d3.scaleTime().domain(d3.extent(R, d => d.date)).range([m.l, W - m.r]);
    const y = d3.scaleLinear().domain([0, d3.max(R, d => d.land_v)]).nice().range([H - m.b, m.t]);
    svg.append("g").attr("transform", `translate(0,${H - m.b})`).call(d3.axisBottom(x).ticks(W < 600 ? 4 : 7).tickFormat(d3.timeFormat("%b %Y"))).call(g => { g.selectAll("text").style("font", `500 10.5px ${mono}`).attr("fill", C.ink3); g.selectAll("line,path").attr("stroke", C.line); });
    svg.append("g").attr("transform", `translate(${m.l},0)`).call(d3.axisLeft(y).ticks(4).tickSize(-(W - m.l - m.r))).call(g => { g.select(".domain").remove(); g.selectAll("line").attr("stroke", C.line); g.selectAll("text").style("font", `500 10.5px ${mono}`).attr("fill", C.ink3); });
    const bw = Math.max(1.5, (W - m.l - m.r) / R.length - 1.5);
    svg.append("g").selectAll("rect").data(R).join("rect").attr("x", d => x(d.date) - bw / 2).attr("width", bw).attr("y", d => y(d.land_v)).attr("height", d => y(0) - y(d.land_v)).attr("fill", C.steel)
      .append("title").text(d => `${d.label}: ${d.land_v} vessels with an inland fix (${d.land_s} listed) of ${d.vessels}`);
    svg.append("g").selectAll("rect").data(R).join("rect").attr("x", d => x(d.date) - bw / 2).attr("width", bw).attr("y", d => y(d.land_s)).attr("height", d => y(0) - y(d.land_s)).attr("fill", C.brass);
  }

  D.daily.forEach(d => { d.date = new Date(d.day.slice(0, 4) + "-" + d.day.slice(4, 6) + "-" + d.day.slice(6, 8)); d.label = d.date.toISOString().slice(0, 10); });
  function all() { hero(); multiples(); compare(); lists(); det(); daily(); }
  all();
  let t; window.addEventListener("resize", () => { clearTimeout(t); t = setTimeout(all, 180); });
})();
