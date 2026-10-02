/* 《괴물》 review analysis deck — custom engine + anime.js + Chart.js */
(function () {
  "use strict";
  const S = window.REVIEW_STATS || {};
  const slides = Array.from(document.querySelectorAll(".slide"));
  const total = slides.length;
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

  /* ---------------- rain particle canvas ---------------- */
  const rain = document.getElementById("rain");
  if (rain) {
    const ctx = rain.getContext("2d");
    let W, H, drops, storm = 0.35, target = 0.35;
    function resize() {
      W = rain.width = window.innerWidth;
      H = rain.height = window.innerHeight;
      const count = Math.round(W / 9);
      drops = Array.from({ length: count }, () => ({
        x: Math.random() * W, y: Math.random() * H,
        l: 8 + Math.random() * 22, s: 2 + Math.random() * 4, a: 0.05 + Math.random() * 0.18
      }));
    }
    resize();
    window.addEventListener("resize", resize);
    (function loop() {
      storm += (target - storm) * 0.04;
      ctx.clearRect(0, 0, W, H);
      for (const d of drops) {
        ctx.strokeStyle = "rgba(150,190,225," + (d.a * storm * 1.6) + ")";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(d.x, d.y);
        ctx.lineTo(d.x - d.l * 0.22, d.y + d.l);
        ctx.stroke();
        d.y += d.s * (0.5 + storm * 1.4);
        d.x -= d.s * 0.12;
        if (d.y > H) { d.y = -20; d.x = Math.random() * W; }
      }
      requestAnimationFrame(loop);
    })();
    window.setStorm = (v) => { target = v; };
  }

  /* ---------------- helpers ---------------- */
  const A = window.anime;
  function reveal(el, opts) {
    if (!el || !A) return;
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
    if (!el || !A) return;
    const dec = (opts && opts.dec) || 0;
    const suffix = el.dataset.suffix || "";
    const o = { v: 0 };
    el.textContent = "0" + suffix;
    A({ targets: o, v: to, round: dec ? null : 1, duration: 1500, easing: "easeOutExpo",
      update: () => { el.textContent = (dec ? o.v.toFixed(dec) : Math.round(o.v).toLocaleString()) + suffix; } });
  }

  /* ---------------- Chart.js factory ---------------- */
  const GRID = "rgba(255,255,255,0.06)";
  const TICK = "#8a94a6";
  function chart(id, cfg) {
    if (!window.Chart) return null;
    const el = document.getElementById(id);
    if (!el) return null;
    if (charts[id]) { charts[id].destroy(); }
    cfg.options = cfg.options || {};
    cfg.options.animation = { duration: 1400, easing: "easeOutQuart" };
    cfg.options.color = TICK;
    charts[id] = new Chart(el.getContext("2d"), cfg);
    return charts[id];
  }

  function initKeywords() {
    const words = (S.topWords || []).slice(0, 14);
    chart("cKeywords", {
      type: "bar",
      data: {
        labels: words.map((w) => w[0]),
        datasets: [{ data: words.map((w) => w[1]), backgroundColor: words.map((_, i) =>
          `rgba(${90 + i * 11},${140 - i * 4},${210 - i * 6},0.85)`), borderRadius: 6, barPercentage: 0.72 }]
      },
      options: {
        indexAxis: "y", responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { color: GRID }, ticks: { color: TICK } },
          y: { grid: { display: false }, ticks: { color: "#d6dce6", font: { size: 13, weight: "600" } } }
        }
      }
    });
  }

  function initThemes() {
    const th = (S.themes || []).slice(0, 8);
    const labels = th.map((t) => t.name);
    const vals = th.map((t) => t.count);
    const pal = ["#f4b942", "#ffd166", "#5bc0eb", "#2f6f8f", "#7bd88f", "#b995f2", "#e88", "#8ad"];
    chart("cThemes", {
      type: "doughnut",
      data: { labels, datasets: [{ data: vals, backgroundColor: pal, borderColor: "#0b0e14", borderWidth: 3 }] },
      options: {
        cutout: "58%", responsive: true, maintainAspectRatio: false,
        plugins: { legend: { position: "right", labels: { color: "#d6dce6", boxWidth: 12, padding: 12 } } }
      }
    });
    const max = Math.max.apply(null, vals);
    chart("cRadar", {
      type: "radar",
      data: { labels, datasets: [{ data: vals, borderColor: "#5bc0eb", backgroundColor: "rgba(91,192,235,0.22)", pointBackgroundColor: "#f4b942", borderWidth: 2 }] },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { r: { suggestedMin: 0, suggestedMax: Math.ceil(max * 1.15), grid: { color: GRID }, angleLines: { color: GRID }, pointLabels: { color: "#d6dce6", font: { size: 11 } }, ticks: { display: false } } }
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
        scales: { x: { grid: { display: false }, ticks: { color: "#d6dce6", font: { size: 14, weight: "600" } } }, y: { grid: { color: GRID }, ticks: { color: TICK } } }
      }
    });
  }

  function initLength() {
    const d = S.lengthDist || { labels: [], values: [] };
    chart("cLength", {
      type: "bar",
      data: { labels: d.labels, datasets: [{ data: d.values, backgroundColor: ["#2f6f8f", "#5bc0eb", "#3e8fb0", "#f4b942", "#ffd166"], borderRadius: 8, barPercentage: 0.62 }] },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } },
        scales: { x: { grid: { display: false }, ticks: { color: "#d6dce6" } }, y: { grid: { color: GRID }, ticks: { color: TICK } } } }
    });
  }

  function initPrejudice() {
    chart("cPrejudice", {
      type: "polarArea",
      data: { labels: ["오해", "편견", "선입견·단정", "판단·비난", "이해의 오만"],
        datasets: [{ data: [26, 10, 14, 9, 8], backgroundColor: ["rgba(91,192,235,.7)", "rgba(244,185,66,.7)", "rgba(123,216,143,.6)", "rgba(185,149,242,.6)", "rgba(232,136,136,.6)"], borderColor: "#0b0e14", borderWidth: 2 }] },
      options: { responsive: true, maintainAspectRatio: false,
        plugins: { legend: { position: "bottom", labels: { color: "#d6dce6", boxWidth: 12 } } },
        scales: { r: { grid: { color: GRID }, ticks: { display: false }, angleLines: { color: GRID } } } }
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
      r.setAttribute("fill", i % 3 === 0 ? "#f4b942" : "#5bc0eb");
      r.setAttribute("opacity", "0.85");
      svg.appendChild(r);
      bars.push({ el: r, h });
    }
    if (A) {
      A({ targets: bars.map((b) => b.el), scaleY: [0.05, 1], opacity: [0.2, 0.9], transformOrigin: "center",
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
    reveal(s.querySelectorAll(".kicker, h1, h2, .lead, .quote, .quote-src, .footer-note, .scroll-hint"),
      { stagger: 90, d: 700, y: 24 });
    reveal(s.querySelectorAll(".chip"), { stagger: 60, d: 600 });
    reveal(s.querySelectorAll(".stat-card, .pipe-node, .panel3, .crit .c, .quotelist .q"),
      { stagger: 90, d: 700 });

    if (window.setStorm) {
      window.setStorm(name === "title" ? 0.95 : name === "sun" ? 0.08 : name === "sound" ? 0.55 : 0.3);
    }

    if (name === "title") {
      const chars = s.querySelectorAll(".film-title .ch");
      if (A) A({ targets: chars, opacity: [0, 1], translateY: [90, 0], rotate: [8, 0],
        duration: 1000, delay: A.stagger(90, { start: 200 }), easing: "easeOutExpo" });
    }

    if (name === "overview" && first) {
      s.querySelectorAll(".num[data-to]").forEach((el) => {
        countUp(el, parseFloat(el.dataset.to), { dec: parseInt(el.dataset.dec || "0", 10) });
      });
    } else if (name === "overview") {
      s.querySelectorAll(".num[data-to]").forEach((el) => countUp(el, parseFloat(el.dataset.to), { dec: parseInt(el.dataset.dec || "0", 10) }));
    }

    if (name === "keywords") initKeywords();
    if (name === "themes") { initThemes(); initLength(); }
    if (name === "prejudice") initPrejudice();
    if (name === "sentiment") initSentiment();
    if (name === "sound") initWave();

    if (name === "viewpoint") {
      const p = s.querySelectorAll(".panel3");
      if (A) A({ targets: p, opacity: [0, 1], translateX: (el, i) => [120 - i * 40, 0], rotateY: [18, 0],
        duration: 900, delay: A.stagger(160), easing: "easeOutCubic" });
    }

    if (name === "sun") {
      // de-rain handled by setStorm; animate the big line
      const hl = s.querySelector(".bigline");
      if (hl && A) A({ targets: hl, opacity: [0, 1], scale: [0.96, 1], duration: 1200, easing: "easeOutExpo" });
    }

    entered.add(n);
  }

  /* ---------------- boot ---------------- */
  window.addEventListener("load", () => {
    go(0);
  });
  window.__deck = { go, next, prev };
})();
