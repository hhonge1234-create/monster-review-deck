/* 《괴물》 리뷰 분석 deck v2 — navigation + per-slide animations (anime.js v3, Chart.js v4) */
(function () {
  'use strict';
  var C = { ink: '#22301F', muted: '#6B7464', moss: '#3F6B34', moss2: '#2F5130', leaf: '#8DBE6A', leaf2: '#C9E2B4',
            sun: '#E9B949', red: '#D63B2F', sky: '#6F93B4', paper: '#F7F4EC', paper2: '#EFEADD', line: '#DDD7C7' };
  var NS = 'http://www.w3.org/2000/svg';
  var stage = document.getElementById('stage');
  var slides = Array.prototype.slice.call(document.querySelectorAll('.slide'));
  var cur = -1, charts = {};

  /* ---------- layout: scale 1600x900 stage to viewport ---------- */
  function fit() {
    var s = Math.min(window.innerWidth / 1600, window.innerHeight / 900);
    stage.style.transform = 'translate(-50%,-50%) scale(' + s + ')';
    stage.style.transformOrigin = 'center center';
  }
  window.addEventListener('resize', fit); fit();

  slides.forEach(function (s, i) {
    var p = s.querySelector('.pnum'); if (p) p.textContent = String(i + 1).padStart(2, '0') + ' / ' + slides.length;
  });

  /* ---------- helpers ---------- */
  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function el(tag, attrs, parent) {
    var e = document.createElementNS(NS, tag);
    for (var k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }
  function reveal(s, start) {
    var t = $$('[data-r]', s);
    anime.remove(t);
    anime.set(t, { opacity: 0, translateY: 22 });
    anime({ targets: t, opacity: [0, 1], translateY: [22, 0], delay: anime.stagger(85, { start: start || 120 }),
            duration: 720, easing: 'easeOutCubic' });
  }
  function counters(s, delay) {
    $$('.count', s).forEach(function (c) {
      var to = parseFloat(c.dataset.to), dec = parseInt(c.dataset.dec || '0', 10), o = { v: 0 };
      c.textContent = (0).toFixed(dec);
      anime({ targets: o, v: to, duration: 1600, delay: delay || 500, easing: 'easeOutExpo',
              update: function () { c.textContent = o.v.toLocaleString('ko-KR', { minimumFractionDigits: dec, maximumFractionDigits: dec }); } });
    });
  }
  function typeText(node, text, speed, delay, done) {
    node.innerHTML = '';
    var i = 0, caret = document.createElement('span'); caret.className = 'caret';
    var span = document.createElement('span'); node.appendChild(span); node.appendChild(caret);
    clearInterval(node._t); clearTimeout(node._d);
    node._d = setTimeout(function () {
      node._t = setInterval(function () {
        span.textContent = text.slice(0, ++i);
        if (i >= text.length) { clearInterval(node._t); if (done) done(); }
      }, speed);
    }, delay || 0);
  }

  /* ---------- per-slide animations ---------- */
  var A = {};

  A.cover = function (s) {
    var img = $('.cover-img', s);
    anime({ targets: img, scale: [1.08, 1], opacity: [0, 1], duration: 2200, easing: 'easeOutQuart' });
    reveal(s, 700);
    var box = $('#pollen', s);
    if (!box.childElementCount) {
      for (var i = 0; i < 26; i++) {
        var d = document.createElement('div'); d.className = 'pollen';
        var sz = 4 + Math.random() * 10; d.style.width = d.style.height = sz + 'px';
        d.style.left = (Math.random() * 1600) + 'px'; d.style.top = (80 + Math.random() * 480) + 'px';
        box.appendChild(d);
        (function (d) {
          anime({ targets: d, translateX: function () { return anime.random(-60, 60); },
                  translateY: function () { return anime.random(-50, 30); }, opacity: [{ value: 0.95, duration: 1500 }, { value: 0.2, duration: 2500 }],
                  duration: anime.random(4000, 7000), delay: anime.random(0, 2000), direction: 'alternate', loop: true, easing: 'easeInOutSine' });
        })(d);
      }
    }
  };

  A.summary = function (s) {
    reveal(s); counters(s, 600);
    var f = $('.stars .fill', s); f.style.width = '0%';
    anime({ targets: f, width: f.dataset.w + '%', duration: 1800, delay: 700, easing: 'easeOutCubic' });
    var b = $('.bar100 i', s); b.style.width = '0%';
    anime({ targets: b, width: b.dataset.w + '%', duration: 1800, delay: 800, easing: 'easeOutCubic' });
  };

  A.method = function (s) {
    reveal(s);
    var p = $('#pipe-path', s), len = p.getTotalLength();
    p.style.strokeDasharray = len; p.style.strokeDashoffset = len;
    anime({ targets: p, strokeDashoffset: [len, 0], duration: 1600, delay: 200, easing: 'easeInOutSine',
            complete: function () { p.style.strokeDasharray = '6 8'; } });
    anime({ targets: $$('.step .no', s), scale: [0, 1], delay: anime.stagger(160, { start: 400 }), duration: 600, easing: 'easeOutBack' });
  };

  /* theme bubbles: deterministic circle packing */
  var THEMES = [
    { n: '누가 괴물인가', c: 146, act: 1, sub: '146건 · 30.6%' },
    { n: '결말과 위로', c: 68, act: 3, sub: '68건 · 14%' },
    { n: '오해·편견', c: 57, act: 2, sub: '57건 · 11%' },
    { n: '시점 구조', c: 30, act: 2, sub: '30건 · 6%' },
    { n: '학교·시스템', c: 23, act: 2, sub: '23건' },
    { n: '사랑·퀴어', c: 23, act: 3, sub: '23건' },
    { n: '음악', c: 17, act: 3, sub: '17건 (+18)' },
    { n: '영상미', c: 15, act: 3, sub: '15건' },
    { n: '아역', c: 7, act: 3, sub: '7건' }
  ];
  function pack(W, H) {
    var k = 13.6, pts = THEMES.map(function (t, i) {
      var a = i * 2.39996, d = i === 0 ? 0 : 60 + i * 26;
      return { t: t, r: k * Math.sqrt(t.c), x: W / 2 - 60 + Math.cos(a) * d, y: H / 2 + Math.sin(a) * d * 0.7 };
    });
    for (var it = 0; it < 600; it++) {
      pts.forEach(function (p) { p.x += (W / 2 - 40 - p.x) * 0.01; p.y += (H / 2 - p.y) * 0.014; });
      for (var i = 0; i < pts.length; i++) for (var j = i + 1; j < pts.length; j++) {
        var a = pts[i], b = pts[j], dx = b.x - a.x, dy = b.y - a.y, dist = Math.sqrt(dx * dx + dy * dy) || 1, min = a.r + b.r + 8;
        if (dist < min) { var m = (min - dist) / dist / 2; a.x -= dx * m; a.y -= dy * m; b.x += dx * m; b.y += dy * m; }
      }
      pts.forEach(function (p) { p.x = Math.max(p.r + 4, Math.min(W - p.r - 4, p.x)); p.y = Math.max(p.r + 4, Math.min(H - p.r - 4, p.y)); });
    }
    return pts;
  }
  A.bubbles = function (s) {
    reveal(s);
    var svg = $('#bubbles', s);
    if (!svg.childElementCount) {
      var col = { 1: C.red, 2: C.moss, 3: C.sun }, txt = { 1: '#fff', 2: '#fff', 3: C.ink };
      pack(1020, 640).forEach(function (p) {
        var g = el('g', { transform: 'translate(' + p.x.toFixed(1) + ',' + p.y.toFixed(1) + ')', class: 'bub' }, svg);
        el('circle', { r: p.r.toFixed(1), fill: col[p.t.act], 'fill-opacity': p.t.act === 3 ? 0.9 : 0.92, class: 'bc' }, g);
        var big = p.r > 90, fs = big ? (p.r > 140 ? 34 : 24) : (p.r > 60 ? 18 : 14);
        var t1 = el('text', { 'text-anchor': 'middle', y: big ? -4 : -2, 'font-size': fs, 'font-weight': 700, fill: txt[p.t.act], class: 'bt' }, g);
        t1.textContent = p.t.n;
        var t2 = el('text', { 'text-anchor': 'middle', y: big ? fs + 6 : fs + 2, 'font-size': Math.max(12, fs * 0.62), 'font-weight': 500, fill: txt[p.t.act], 'fill-opacity': 0.85, class: 'bt' }, g);
        t2.textContent = p.t.sub;
      });
    }
    var cs = $$('.bc', svg), ts = $$('.bt', svg);
    cs.forEach(function (c) { c._r = c._r || parseFloat(c.getAttribute('r')); c.setAttribute('r', 0); });
    anime.set(ts, { opacity: 0 });
    anime({ targets: cs, r: function (c) { return c._r; }, delay: anime.stagger(110, { start: 300 }), duration: 1100, easing: 'easeOutElastic(1, .6)' });
    anime({ targets: ts, opacity: [0, 1], delay: anime.stagger(55, { start: 900 }), duration: 500, easing: 'linear' });
  };

  A.act = function (s) {
    anime({ targets: $('.photo', s), scale: [1.12, 1], duration: 6000, easing: 'easeOutQuad' });
    anime({ targets: $('.scrim-l', s), opacity: [0, 1], duration: 900, easing: 'linear' });
    reveal(s, 300);
  };

  A.keywords = function (s) {
    reveal(s); counters(s, 700);
    var labels = ['괴물', '나 (내가·나는·나도)', '모든·모두', '요리·미나토', '누가', '보고·보는', '마음', '사랑', '새로·다시 태어', '아이들', '좋아하는', '고레에다', '행복이라', '오해를', '사카모토·류이치'];
    var data = [146, 62, 34, 33, 31, 24, 23, 23, 18, 14, 12, 11, 10, 9, 9];
    var colors = data.map(function (v, i) { return i === 0 ? C.red : i === 1 ? C.ink : (labels[i] === '누가' ? C.moss : (['사랑', '행복이라'].indexOf(labels[i]) > -1 ? C.sun : C.leaf)); });
    if (charts.kw) charts.kw.destroy();
    var valuePlugin = { id: 'vals', afterDatasetsDraw: function (ch) {
      var ctx = ch.ctx, meta = ch.getDatasetMeta(0);
      ctx.save(); ctx.font = '600 15px "Noto Sans KR"'; ctx.fillStyle = C.ink; ctx.textBaseline = 'middle';
      meta.data.forEach(function (b, i) { var prog = b.$animations && b.$animations.x ? 0.6 : 1; ctx.globalAlpha = prog; ctx.fillText(data[i], b.x + 8, b.y); });
      ctx.restore();
    } };
    charts.kw = new Chart($('#kwChart', s), {
      type: 'bar', plugins: [valuePlugin],
      data: { labels: labels, datasets: [{ data: data, backgroundColor: colors, borderRadius: 6, barPercentage: 0.78, categoryPercentage: 0.9 }] },
      options: { indexAxis: 'y', responsive: true, maintainAspectRatio: false,
        animation: { duration: 1400, delay: function (c) { return c.type === 'data' ? 400 + c.dataIndex * 70 : 0; }, easing: 'easeOutQuart' },
        plugins: { legend: { display: false }, tooltip: { callbacks: { label: function (c) { return ' ' + c.raw + '건'; } } } },
        scales: { x: { grid: { color: 'rgba(34,48,31,.06)' }, border: { display: false }, ticks: { color: C.muted, font: { size: 13 } }, max: 160 },
                  y: { grid: { display: false }, border: { display: false }, ticks: { color: C.ink, font: { size: 16, weight: 600, family: 'Noto Sans KR' } } } } }
    });
  };

  A.bigrams = function (s) {
    reveal(s);
    anime({ targets: $('.wc img', s), scale: [0.92, 1], rotate: [-2, 0], duration: 1600, easing: 'easeOutQuart' });
    $$('.bg-row .track i', s).forEach(function (b, i) {
      b.style.width = '0%';
      anime({ targets: b, width: (parseFloat(b.dataset.v) / 12 * 100) + '%', duration: 1100, delay: 600 + i * 140, easing: 'easeOutCubic' });
    });
    var t = $('#typeLine', s); typeText(t, t.dataset.text, 55, 1300);
  };

  A.suspects = function (s) {
    reveal(s); counters(s, 3600);
    var cards = $$('.sus', s), strikes = $$('.sus .strike', s), me = $('.sus.me', s);
    anime.set(cards, { opacity: 0, translateX: -30 }); anime.set(strikes, { scaleX: 0 });
    var tl = anime.timeline({ easing: 'easeOutCubic' });
    cards.slice(0, 4).forEach(function (c, i) {
      tl.add({ targets: c, opacity: [0, 1], translateX: [-30, 0], duration: 420 }, i === 0 ? 300 : '-=60')
        .add({ targets: strikes[i], scaleX: [0, 1], duration: 360 }, '+=180')
        .add({ targets: c, opacity: 0.45, duration: 260 }, '-=120');
    });
    tl.add({ targets: me, opacity: [0, 1], translateX: [0, 0], scale: [0.85, 1], duration: 900, easing: 'easeOutElastic(1, .55)' }, '+=150');
    var ring = $('#ring146', s);
    anime.set(ring, { strokeDashoffset: 754 });
    anime({ targets: ring, strokeDashoffset: 754 * (1 - 0.306), duration: 1600, delay: 3600, easing: 'easeOutCubic' });
  };

  A.viewpoints = function (s) {
    reveal(s);
    var v = $('#vpVideo', s);
    try { v.currentTime = 0; var p = v.play(); if (p && p.catch) p.catch(function () {}); } catch (e) {}
    anime({ targets: $$('.vp .who', s), rotateY: [90, 0], delay: anime.stagger(220, { start: 500 }), duration: 700, easing: 'easeOutBack' });
  };

  A.network = function (s) {
    reveal(s); counters(s, 600);
    var svg = $('#net', s);
    if (!svg.childElementCount) {
      var defs = el('defs', {}, svg);
      var cx = 410, cy = 320;
      var nodes = [
        { n: '엄마의 걱정', d: '보호하려는 마음', x: 150, y: 110 },
        { n: '학교의 회피', d: '조직을 지키려는 태도', x: 670, y: 110 },
        { n: '선생의 침묵', d: '말하지 못한 진실', x: 110, y: 470 },
        { n: '사회의 편견', d: '\'정상\'이라는 기준', x: 710, y: 470 },
        { n: '그리고 나', d: '보이는 대로 믿은 관객', x: 410, y: 585, me: true }
      ];
      nodes.forEach(function (nd, i) {
        var g = el('linearGradient', { id: 'eg' + i, gradientUnits: 'userSpaceOnUse', x1: nd.x, y1: nd.y, x2: cx, y2: cy }, defs);
        el('stop', { offset: '0', 'stop-color': C.moss }, g); el('stop', { offset: '1', 'stop-color': C.red }, g);
      });
      var eg = el('g', { class: 'edges' }, svg);
      nodes.forEach(function (nd, i) {
        el('line', { x1: nd.x, y1: nd.y, x2: cx, y2: cy, stroke: 'url(#eg' + i + ')', 'stroke-width': 5, 'stroke-linecap': 'round', class: 'edge' }, eg);
        el('circle', { r: 7, fill: C.red, cx: nd.x, cy: nd.y, class: 'pulse', 'data-x': nd.x, 'data-y': nd.y }, eg);
      });
      var center = el('g', { class: 'center' }, svg);
      el('circle', { cx: cx, cy: cy, r: 96, fill: C.red, 'fill-opacity': 0.12, class: 'halo' }, center);
      el('circle', { cx: cx, cy: cy, r: 74, fill: '#fff', stroke: C.red, 'stroke-width': 4 }, center);
      var ct = el('text', { x: cx, y: cy - 4, 'text-anchor': 'middle', 'font-size': 24, 'font-weight': 700, fill: C.ink }, center); ct.textContent = '아이들';
      var ct2 = el('text', { x: cx, y: cy + 24, 'text-anchor': 'middle', 'font-size': 15, fill: C.muted }, center); ct2.textContent = '미나토 · 요리';
      nodes.forEach(function (nd) {
        var g = el('g', { class: 'node' }, svg);
        var w = nd.me ? 210 : 200;
        el('rect', { x: nd.x - w / 2, y: nd.y - 38, width: w, height: 76, rx: 16, fill: nd.me ? C.ink : '#fff', stroke: nd.me ? C.ink : C.line }, g);
        var t = el('text', { x: nd.x, y: nd.y - 6, 'text-anchor': 'middle', 'font-size': 20, 'font-weight': 700, fill: nd.me ? '#fff' : C.ink }, g); t.textContent = nd.n;
        var t2 = el('text', { x: nd.x, y: nd.y + 20, 'text-anchor': 'middle', 'font-size': 14, fill: nd.me ? '#DCE3D6' : C.muted }, g); t2.textContent = nd.d;
      });
      var lg = el('g', {}, svg);
      el('rect', { x: 260, y: 8, width: 300, height: 34, rx: 17, fill: C.paper2 }, lg);
      el('circle', { cx: 290, cy: 25, r: 7, fill: C.moss }, lg);
      var l1 = el('text', { x: 304, y: 30, 'font-size': 14, fill: C.ink, 'font-weight': 600 }, lg); l1.textContent = '선의에서 출발해';
      el('circle', { cx: 430, cy: 25, r: 7, fill: C.red }, lg);
      var l2 = el('text', { x: 444, y: 30, 'font-size': 14, fill: C.ink, 'font-weight': 600 }, lg); l2.textContent = '폭력으로 도착';
    }
    var edges = $$('.edge', svg), pulses = $$('.pulse', svg), nodesG = $$('.node', svg);
    edges.forEach(function (e) { var L = Math.hypot(e.x2.baseVal.value - e.x1.baseVal.value, e.y2.baseVal.value - e.y1.baseVal.value); e.style.strokeDasharray = L; e.style.strokeDashoffset = L; e._L = L; });
    anime.set(nodesG, { opacity: 0, translateY: 14 }); anime.set($('.center', svg), { opacity: 0 });
    anime({ targets: $('.center', svg), opacity: [0, 1], duration: 700, delay: 200, easing: 'linear' });
    anime({ targets: nodesG, opacity: [0, 1], translateY: [14, 0], delay: anime.stagger(150, { start: 400 }), duration: 600, easing: 'easeOutCubic' });
    anime({ targets: edges, strokeDashoffset: function (e) { return [e._L, 0]; }, delay: anime.stagger(150, { start: 900 }), duration: 900, easing: 'easeInOutSine' });
    anime.remove(pulses);
    pulses.forEach(function (p, i) {
      var x0 = +p.dataset.x, y0 = +p.dataset.y;
      anime({ targets: p, cx: [x0, 410], cy: [y0, 320], opacity: [{ value: 1, duration: 100 }, { value: 0, duration: 400, delay: 1300 }],
              duration: 1800, delay: 2000 + i * 300, loop: true, easing: 'easeInQuad' });
    });
    var halo = $('.halo', svg); anime.remove(halo);
    anime({ targets: halo, r: [86, 112], 'fill-opacity': [0.22, 0], duration: 1600, delay: 2200, loop: true, easing: 'easeOutSine' });
  };

  A.ending = function (s) {
    reveal(s, 200);
    anime({ targets: $('.ending-photo', s), scale: [1.1, 1], duration: 7000, easing: 'easeOutQuad' });
    var lines = $$('.dl .ln', s);
    var texts = lines.map(function (q) { return q.dataset.t || (q.dataset.t = q.textContent); });
    lines.forEach(function (q) { q.textContent = ''; });
    $$('.dl', s).forEach(function (d) { d.style.opacity = 0; });
    var i = 0;
    (function next() {
      if (i >= lines.length || cur !== slides.indexOf(s)) return;
      var d = lines[i].parentNode; d.style.opacity = 1;
      var k = i++;
      typeText(lines[k], texts[k], 70, k === 0 ? 900 : 350, function () {
        var c = lines[k].querySelector('.caret'); if (c && k < lines.length - 1) c.remove();
        next();
      });
    })();
  };

  A.emotion = function (s) {
    reveal(s); counters(s, 900);
    var g = $('#emoGif', s); g.src = g.dataset.src + '?r=' + Date.now();
    anime({ targets: $$('.emo-steps .st', s), scale: [0.8, 1], delay: anime.stagger(700, { start: 600 }), duration: 700, easing: 'easeOutBack' });
  };

  A.sound = function (s) {
    reveal(s);
    var svg = $('#tri', s);
    var P = [{ x: 380, y: 100, n: '고레에다 히로카즈', r: '연출', k: '담담함', c: C.moss },
             { x: 120, y: 500, n: '사카모토 유지', r: '각본', k: '비틀린 시선', c: C.sky },
             { x: 640, y: 500, n: '사카모토 류이치', r: '음악', k: '쓸쓸함', c: C.sun }];
    if (!svg.childElementCount) {
      var rip = el('g', { class: 'rip' }, svg);
      for (var i = 0; i < 3; i++) el('circle', { cx: P[2].x, cy: P[2].y, r: 60, fill: 'none', stroke: C.sun, 'stroke-width': 3, class: 'ripple' }, rip);
      var tri = el('path', { d: 'M' + P[0].x + ' ' + P[0].y + ' L' + P[2].x + ' ' + P[2].y + ' L' + P[1].x + ' ' + P[1].y + ' Z',
                             fill: C.leaf2, 'fill-opacity': 0.35, stroke: C.moss, 'stroke-width': 3, 'stroke-linejoin': 'round', class: 'triP' }, svg);
      var ctr = el('g', { class: 'ctr' }, svg);
      var a = el('text', { x: 380, y: 352, 'text-anchor': 'middle', 'font-size': 30, 'font-weight': 700, fill: C.ink }, ctr); a.textContent = '피날레';
      var b = el('text', { x: 380, y: 382, 'text-anchor': 'middle', 'font-size': 15, fill: C.muted }, ctr); b.textContent = '세 사람의 조합이 완성한 감정의 절정';
      P.forEach(function (p) {
        var g = el('g', { class: 'pn' }, svg);
        el('circle', { cx: p.x, cy: p.y, r: 58, fill: '#fff', stroke: p.c, 'stroke-width': 6 }, g);
        var t = el('text', { x: p.x, y: p.y + 8, 'text-anchor': 'middle', 'font-size': 22, 'font-weight': 700, fill: C.ink }, g); t.textContent = p.r;
        var t2 = el('text', { x: p.x, y: p.y + 88, 'text-anchor': 'middle', 'font-size': 19, 'font-weight': 700, fill: C.ink }, g); t2.textContent = p.n;
        var t3 = el('text', { x: p.x, y: p.y + 112, 'text-anchor': 'middle', 'font-size': 15, fill: C.muted }, g); t3.textContent = '"' + p.k + '"';
      });
      // keep top node label inside: move name above for top node
      var top = $$('.pn', svg)[0].querySelectorAll('text');
      top[1].setAttribute('y', P[0].y - 72); top[2].setAttribute('y', P[0].y + 90);
    }
    var tp = $('.triP', svg), L = tp.getTotalLength();
    tp.style.strokeDasharray = L; tp.style.strokeDashoffset = L;
    anime({ targets: tp, strokeDashoffset: [L, 0], duration: 1600, delay: 500, easing: 'easeInOutSine' });
    anime({ targets: $$('.pn', svg), opacity: [0, 1], scale: [0.6, 1], delay: anime.stagger(250, { start: 200 }), duration: 800, easing: 'easeOutBack' });
    anime({ targets: $('.ctr', svg), opacity: [0, 1], duration: 800, delay: 1800, easing: 'linear' });
    var rp = $$('.ripple', svg); anime.remove(rp);
    anime({ targets: rp, r: [60, 150], 'stroke-opacity': [0.8, 0], duration: 2600, delay: anime.stagger(860, { start: 1000 }), loop: true, easing: 'easeOutSine' });
    var w = $('#wave', s);
    if (!w.childElementCount) for (var j = 0; j < 56; j++) w.appendChild(document.createElement('i'));
    var bars = $$('i', w); anime.remove(bars);
    (function loop() {
      if (cur !== slides.indexOf(s)) return;
      anime({ targets: bars, height: function (b, i) { var env = 0.35 + 0.65 * Math.sin(Math.PI * i / bars.length); return (12 + Math.random() * 88 * env) + '%'; },
              duration: 520, delay: anime.stagger(12), easing: 'easeInOutSine', complete: loop });
    })();
  };

  A.three = function (s) {
    reveal(s); counters(s, 700);
    anime({ targets: $('.three-photo', s), opacity: [0, 1], translateX: [-40, 0], duration: 1400, easing: 'easeOutCubic' });
    $$('.mini i', s).forEach(function (b, i) {
      b.style.width = '0%';
      anime({ targets: b, width: (parseFloat(b.dataset.v) / 23 * 100) + '%', duration: 1200, delay: 800 + i * 200, easing: 'easeOutCubic' });
    });
  };

  A.critique = function (s) {
    reveal(s);
    var b = $('#posBar', s); b.style.width = '0%';
    anime({ targets: b, width: '77.7%', duration: 1800, delay: 400, easing: 'easeOutQuart' });
    anime({ targets: $$('.crit .card', s), rotate: [function () { return anime.random(-3, 3); }, 0], duration: 900, delay: anime.stagger(90, { start: 600 }), easing: 'easeOutBack' });
  };

  A.conclusion = function (s) {
    anime({ targets: $('.concl-photo', s), scale: [1.1, 1], duration: 7000, easing: 'easeOutQuad' });
    reveal(s, 200);
    anime({ targets: $$('.oneline span', s), opacity: [0, 1], translateX: [-20, 0], delay: anime.stagger(500, { start: 1700 }), duration: 700, easing: 'easeOutCubic' });
  };

  /* ---------- navigation ---------- */
  function go(n) {
    n = Math.max(0, Math.min(slides.length - 1, n));
    if (n === cur) return;
    var prev = slides[cur];
    if (prev) { prev.classList.remove('active'); var v = prev.querySelector('video'); if (v) v.pause(); }
    cur = n;
    var s = slides[n]; s.classList.add('active');
    document.getElementById('progress').style.width = ((n + 1) / slides.length * 100) + '%';
    if (location.hash !== '#' + (n + 1)) history.replaceState(null, '', '#' + (n + 1));
    var fn = A[s.dataset.anim]; try { (fn || reveal)(s); } catch (e) { console.error(e); reveal(s); }
  }
  function next() { go(cur + 1); } function prevS() { go(cur - 1); }
  document.addEventListener('keydown', function (e) {
    if (['ArrowRight', 'PageDown', ' ', 'Enter'].indexOf(e.key) > -1) { e.preventDefault(); next(); }
    else if (['ArrowLeft', 'PageUp', 'Backspace'].indexOf(e.key) > -1) { e.preventDefault(); prevS(); }
    else if (e.key === 'Home') go(0); else if (e.key === 'End') go(slides.length - 1);
  });
  document.getElementById('nextBtn').onclick = function (e) { e.stopPropagation(); next(); };
  document.getElementById('prevBtn').onclick = function (e) { e.stopPropagation(); prevS(); };
  stage.addEventListener('click', function (e) { if (e.target.closest('video,canvas,a,button,#nav')) return; (e.clientX < window.innerWidth * 0.25 ? prevS : next)(); });
  var tx = null;
  document.addEventListener('touchstart', function (e) { tx = e.touches[0].clientX; }, { passive: true });
  document.addEventListener('touchend', function (e) { if (tx === null) return; var dx = e.changedTouches[0].clientX - tx; if (Math.abs(dx) > 40) (dx < 0 ? next : prevS)(); tx = null; });
  var wl = 0;
  document.addEventListener('wheel', function (e) { var t = Date.now(); if (t - wl < 900 || Math.abs(e.deltaY) < 30) return; wl = t; (e.deltaY > 0 ? next : prevS)(); }, { passive: true });
  window.addEventListener('hashchange', function () { var n = parseInt(location.hash.slice(1), 10); if (n) go(n - 1); });

  function start() { var n = parseInt(location.hash.slice(1), 10); go(n ? n - 1 : 0); }
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(start); else window.addEventListener('load', start);
})();
