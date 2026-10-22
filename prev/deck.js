/* 《괴물》 review analysis deck — custom engine + anime.js + Chart.js */
(function () {
  "use strict";
  const S = window.REVIEW_STATS || {};
  const slides = Array.from(document.querySelectorAll(".slide"));
  const total = slides.length;
  const STATIC = /[#&?]static/.test(location.hash);
  if (STATIC) document.body.classList.add("static");
  let cur = 0;
  let busy = false;
  const charts = {};
  const entered = new Set();

  /* ---------------- slide engine ---------------- */
  const progress = document.querySelector(".progress");
  const counter = document.querySelector(".counter");
  const dots = document.querySelector(".dots");

  slides.forEach((_, i) => {
    const a = document.createElement("a");
    a.href = "#";
    a.dataset.i = i;
    a.addEventListener("click", (e) => { e.preventDefault(); go(i); });
    dots && dots.appendChild(a);
  });

  function go(n) {
    n = Math.max(0, Math.min(total - 1, n));
    if (n === cur && entered.has(n)) return;
    busy = true;
    slides[cur].classList.remove("active");
    cur = n;
    slides[cur].classList.add("active");
    if (progress) progress.style.width = ((cur + 1) / total * 100) + "%";
    if (counter) counter.textContent = String(cur + 1).padStart(2, "0") + " / " + String(total).padStart(2, "0");
    dots && Array.from(dots.children).forEach((d, i) => d.classList.toggle("on", i === cur));
    setTimeout(() => { busy = false; }, 620);
    runEnter(cur);
  }

  function next() { if (!busy) go(cur + 1); }
  function prev() { if (!busy) go(cur - 1); }

  document.addEventListener("keydown", (e) => {
    if (["ArrowRight", "ArrowDown", "PageDown", " ", "Enter"].includes(e.key)) { e.preventDefault(); next(); }
    else if (["ArrowLeft", "ArrowUp", "PageUp"].includes(e.key)) { e.preventDefault(); prev(); }
    else if (e.key === "Home") go(0);
    else if (e.key === "End") go(total - 1);
    else if (e.key.toLowerCase() === "f") toggleFull();
  });

  let wheelLock = 0;
  window.addEventListener("wheel", (e) => {
    const now = Date.now();
    if (now - wheelLock < 900) return;
    if (Math.abs(e.deltaY) < 24) return;
    wheelLock = now;
    e.deltaY > 0 ? next() : prev();
  }, { passive: true });

  let tx = 0, ty = 0;
  window.addEventListener("touchstart", (e) => { tx = e.touches[0].clientX; ty = e.touches[0].clientY; }, { passive: true });
  window.addEventListener("touchend", (e) => {
    const dx = e.changedTouches[0].clientX - tx;
    const dy = e.changedTouches[0].clientY - ty;
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy)) { dx < 0 ? next() : prev(); }
  }, { passive: true });

  document.querySelectorAll("[data-nav]").forEach((b) => {
    b.addEventListener("click", () => (b.dataset.nav === "next" ? next() : prev()));
  });

  function toggleFull() {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen?.();
    else document.exitFullscreen?.();
  }

  /* ---------------- forest light / pollen canvas ---------------- */
  const sky = document.getElementById("rain");
  if (sky) {
    const ctx = sky.getContext("2d");
    let W, H, motes, glow = 0.7, target = 0.7;
    function resize() {
      W = sky.width = window.innerWidth;
      H = sky.height = window.innerHeight;
      const count = Math.min(160, Math.round((W * H) / 38000));
      motes = Array.from({ length: count }, () => ({
        x: Math.random() * W, y: Math.random() * H,
        r: 0.8 + Math.random() * 3.2,
        vx: (Math.random() - 0.5) * 0.26,
        vy: -(0.1 + Math.random() * 0.5),
        a: 0.14 + Math.random() * 0.5,
        h: Math.random() < 0.55 ? 86 : 44
      }));
    }
    resize();
    window.addEventListener("resize", resize);
    (function loop() {
      glow += (target - glow) * 0.05;
      ctx.clearRect(0, 0, W, H);
      for (const m of motes) {
        const g = ctx.createRadialGradient(m.x, m.y, 0, m.x, m.y, m.r * 5);
        g.addColorStop(0, "hsla(" + m.h + ",72%,74%," + (m.a * glow) + ")");
        g.addColorStop(1, "hsla(" + m.h + ",72%,74%,0)");
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(m.x, m.y, m.r * 5, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "hsla(" + m.h + ",85%,88%," + (m.a * glow * 0.9) + ")";
        ctx.beginPath(); ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2); ctx.fill();
        m.x += m.vx; m.y += m.vy;
        if (m.y < -12) { m.y = H + 12; m.x = Math.random() * W; }
        if (m.x < -12) m.x = W + 12; else if (m.x > W + 12) m.x = -12;
      }
      requestAnimationFrame(loop);
    })();
    window.setGlow = (v) => { target = v; };
  }

  /* ---------------- helpers ---------------- */
  const A = window.anime;
  function reveal(el, opts) {
    if (!el) return;
    if (STATIC) { el.forEach((x) => { x.style.opacity = 1; x.style.transform = "none"; }); return; }
    if (!A) return;
    A({
      targets: el,
      opacity: [0, 1],
      translateY: opts && opts.y != null ? [opts.y, 0] : [26, 0],
      duration: (opts && opts.d) || 700,
      delay: A.stagger((opts && opts.stagger) || 0),
      easing: "easeOutCubic"
    });
  }
  function countUp(el, to, opts) {
    if (!el) return;
    const dec = (opts && opts.dec) || 0;
    const suffix = el.dataset.suffix || "";
    if (STATIC) { el.textContent = (dec ? Number(to).toFixed(dec) : Math.round(to).toLocaleString()) + suffix; return; }
    if (!A) return;
    const o = { v: 0 };
    el.textContent = "0" + suffix;
    A({ targets: o, v: to, round: dec ? null : 1, duration: 1500, easing: "easeOutExpo",
      update: () => { el.textContent = (dec ? o.v.toFixed(dec) : Math.round(o.v).toLocaleString()) + suffix; } });
  }

  /* ---------------- Chart.js factory ---------------- */
  const GRID = "rgba(255,255,255,0.08)";
  const TICK = "#a9c0ab";
  function chart(id, cfg) {
    if (!window.Chart) return null;
    const el = document.getElementById(id);
    if (!el) return null;
    if (charts[id]) { charts[id].destroy(); }
    cfg.options = cfg.options || {};
    cfg.options.animation = STATIC ? false : { duration: 1400, easing: "easeOutQuart" };
    cfg.options.color = TICK;
    charts[id] = new Chart(el.getContext("2d"), cfg);
    return charts[id];
  }

  function initKeywords() {
    const words = [
      ["괴물", 146], ["나·내가", 62], ["모든·모두", 34], ["요리·미나토", 33],
      ["누가", 31], ["보고·보는", 24], ["마음", 23], ["사랑", 23],
      ["다시 태어나다", 18], ["아이들", 14], ["좋아하는", 12], ["고레에다", 11], ["행복", 10]
    ];
    chart("cKeywords", {
      type: "bar",
      data: {
        labels: words.map((w) => w[0]),
        datasets: [{ data: words.map((w) => w[1]), backgroundColor: words.map((_, i) =>
          i === 0 ? "#f4cf6b" : i < 3 ? "#9ad46f" : "rgba(94,161,83,0.6)"), borderRadius: 6, barPercentage: 0.72 }]
      },
      options: {
        indexAxis: "y", responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { color: GRID }, ticks: { color: TICK } },
          y: { grid: { display: false }, ticks: { color: "#e3eedd", font: { size: 13, weight: "600" } } }
        }
      }
    });
  }

  function initThemes() {
    const th = (S.themes || []);
    const labels = th.map((t) => t.name);
    const vals = th.map((t) => t.count);
    const max = Math.max.apply(null, vals);
    const pal = th.map((t, i) => i === 0 ? "#f4cf6b" : i < 3 ? "#9ad46f" : "rgba(94,161,83,0.55)");
    chart("cThemes", {
      type: "bar",
      data: { labels, datasets: [{ data: vals, backgroundColor: pal, borderRadius: 7, barPercentage: 0.7 }] },
      options: {
        indexAxis: "y", responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: { callbacks: { label: (c) => c.parsed.x + "건" } } },
        scales: {
          x: { grid: { color: GRID }, ticks: { color: TICK, font: { size: 13 } }, suggestedMax: max * 1.12 },
          y: { grid: { display: false }, ticks: { color: "#eef7e8", font: { size: 15, weight: "600" } } }
        }
      }
    });
  }

  function initSentiment() {
    const s = S.sentiment || [];
    chart("cSentiment", {
      type: "bar",
      data: { labels: s.map((x) => x.stage), datasets: [{ data: s.map((x) => x.value), backgroundColor: s.map((x) => x.color), borderRadius: 10, barPercentage: 0.6 }] },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { x: { grid: { display: false }, ticks: { color: "#e3eedd", font: { size: 14, weight: "600" } } }, y: { grid: { color: GRID }, ticks: { color: TICK } } }
      }
    });
  }

  function initLength() {
    const d = S.lengthDist || { labels: [], values: [] };
    chart("cLength", {
      type: "bar",
      data: { labels: d.labels, datasets: [{ data: d.values, backgroundColor: ["#3f7a4f", "#5ea153", "#9ad46f", "#f4cf6b", "#ffe3a8"], borderRadius: 8, barPercentage: 0.62 }] },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } },
        scales: { x: { grid: { display: false }, ticks: { color: "#e3eedd" } }, y: { grid: { color: GRID }, ticks: { color: TICK } } } }
    });
  }

  function initPrejudice() {
    const labels = ["오해", "선입견·단정", "편견", "판단·비난", "이해의 오만"];
    const vals = [26, 14, 10, 9, 8];
    chart("cPrejudice", {
      type: "bar",
      data: { labels, datasets: [{ data: vals,
        backgroundColor: ["#9ad46f", "#7cc45f", "#f4cf6b", "#d8a23f", "#b98a35"],
        borderRadius: 8, barPercentage: 0.66 }] },
      options: {
        indexAxis: "y", responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: { callbacks: { label: (c) => c.parsed.x + "건" } } },
        scales: {
          x: { grid: { color: GRID }, ticks: { color: TICK, font: { size: 13 } }, suggestedMax: 30 },
          y: { grid: { display: false }, ticks: { color: "#eef7e8", font: { size: 15, weight: "700" } } }
        }
      }
    });
  }

  /* ---------------- waveform (sound slide) ---------------- */
  function initWave() {
    const svg = document.getElementById("wave");
    if (!svg || svg.dataset.done) return;
    svg.dataset.done = "1";
    const NS = "http://www.w3.org/2000/svg";
    const W = 900, H = 220, mid = H / 2, n = 90, bars = [];
    for (let i = 0; i < n; i++) {
      let env = Math.exp(-Math.pow((i - n * 0.45) / (n * 0.34), 2));
      let h = 6 + env * (Math.sin(i * 0.9) * 0.5 + 0.5) * 150 * (0.6 + Math.random() * 0.7);
      const r = document.createElementNS(NS, "rect");
      r.setAttribute("x", (i * (W / n)).toString());
      r.setAttribute("y", (mid - h / 2).toString());
      r.setAttribute("width", (W / n - 3).toString());
      r.setAttribute("rx", "2");
      r.setAttribute("height", h.toString());
      r.setAttribute("fill", i % 3 === 0 ? "#f4cf6b" : "#9ad46f");
      r.setAttribute("opacity", "0.85");
      svg.appendChild(r);
      bars.push({ el: r, h });
    }
    if (A) {
      if (!STATIC) A({ targets: bars.map((b) => b.el), scaleY: [0.05, 1], opacity: [0.2, 0.9], transformOrigin: "center",
        duration: 900, delay: A.stagger(14), easing: "easeOutQuart" });
      let t = 0;
      setInterval(() => {
        t++;
        bars.forEach((b, i) => {
          const s = 0.55 + 0.45 * Math.abs(Math.sin(t * 0.6 + i * 0.35));
          b.el.setAttribute("height", (b.h * s).toFixed(1));
          b.el.setAttribute("y", (mid - (b.h * s) / 2).toFixed(1));
        });
      }, 90);
    }
  }

  /* ---------------- per-slide entrance ---------------- */
  function runEnter(n) {
    const s = slides[n];
    if (!s) return;
    const name = s.dataset.name;
    const first = !entered.has(n);

    // generic reveals
    reveal(s.querySelectorAll(".kicker, h1, h2, .thesis, .lead, .quote, .quote-src, .footer-note, .source-line, .scroll-hint, .pull, .pull-center, .title-line, .mini-title, .read-note"),
      { stagger: 90, d: 700, y: 24 });
    reveal(s.querySelectorAll(".chip"), { stagger: 60, d: 600 });
    reveal(s.querySelectorAll(".stat-card, .pipe-node, .panel3, .crit .c, .crit-list .row, .crit-hero, .tc, .stage-row, .bigram, .conclusion-points .cp, .quotelist .q, .bigline"),
      { stagger: 90, d: 700 });

    if (window.setGlow) {
      window.setGlow(name === "title" ? 0.55 : (name === "ending" || name === "conclusion") ? 1.0 : name === "sound" ? 0.6 : 0.72);
    }

    if (name === "title") {
      const chars = s.querySelectorAll(".film-title .ch");
      if (STATIC) { chars.forEach((c) => { c.style.opacity = 1; c.style.transform = "none"; }); }
      else if (A) A({ targets: chars, opacity: [0, 1], translateY: [90, 0], rotate: [8, 0],
        duration: 1000, delay: A.stagger(90, { start: 200 }), easing: "easeOutExpo" });
    }

    if (name === "summary") {
      s.querySelectorAll(".num[data-to]").forEach((el) => {
        countUp(el, parseFloat(el.dataset.to), { dec: parseInt(el.dataset.dec || "0", 10) });
      });
    }

    if (name === "keywords") initKeywords();
    if (name === "themes") initThemes();
    if (name === "prejudice") initPrejudice();
    if (name === "sound") initWave();

    if (name === "viewpoint") {
      const p = s.querySelectorAll(".panel3");
      if (STATIC) p.forEach((x) => { x.style.opacity = 1; x.style.transform = "none"; });
      else if (A) A({ targets: p, opacity: [0, 1], translateX: (el, i) => [120 - i * 40, 0], rotateY: [18, 0],
        duration: 900, delay: A.stagger(160), easing: "easeOutCubic" });
    }

    if (name === "ending") {
      const hl = s.querySelector(".bigline");
      if (STATIC && hl) { hl.style.opacity = 1; hl.style.transform = "none"; }
      else if (hl && A) A({ targets: hl, opacity: [0, 1], scale: [0.96, 1], duration: 1200, easing: "easeOutExpo" });
    }

    entered.add(n);
  }

  /* ---------------- boot ---------------- */
  window.addEventListener("load", () => {
    const mm = (location.hash || "").match(/slide=(\d+)/);
    go(mm ? Math.max(0, Math.min(total - 1, +mm[1] - 1)) : 0);
  });
  window.__deck = { go, next, prev };
})();
