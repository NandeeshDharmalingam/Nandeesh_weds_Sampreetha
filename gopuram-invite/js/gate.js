/* ============================================================================
   Draw a heart: the heart shape, and the opening screen where the guest traces it.
   The guest follows a dotted heart with a finger or mouse. A lenient check
   accepts a rough heart; a "draw it for me" button covers everyone else.
   ========================================================================== */
(function () {
  'use strict';

  /* ---------- the heart shape (also used by the page's SVG hearts) ---------- */
  var Heart = (function () {
    var N = 360;
    var raw = [];
    var minY = Infinity;
    var maxY = -Infinity;
    for (var i = 0; i < N; i++) {
      var t = (i / N) * Math.PI * 2;
      var x = 16 * Math.pow(Math.sin(t), 3);
      var y = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
      raw.push([x, y]);
      if (y < minY) { minY = y; }
      if (y > maxY) { maxY = y; }
    }
    var midY = (minY + maxY) / 2;
    // Width 1, centred on (0, 0). Starts at the top dip and runs clockwise.
    var points = raw.map(function (p) { return [p[0] / 32, (p[1] - midY) / 32]; });
    return {
      points: points,
      pathData: function () {
        return 'M' + points.map(function (p) { return p[0].toFixed(4) + ' ' + p[1].toFixed(4); }).join('L') + 'Z';
      }
    };
  })();

  // Evenly spaced points around a closed outline.
  function resample(pts, n) {
    var m = pts.length;
    var cum = [0];
    var i;
    for (i = 1; i <= m; i++) {
      var p = pts[i - 1];
      var q = pts[i % m];
      cum.push(cum[i - 1] + Math.hypot(q.x - p.x, q.y - p.y));
    }
    var total = cum[m];
    var out = [];
    var j = 0;
    for (i = 0; i < n; i++) {
      var d = (i / n) * total;
      while (j < m - 1 && cum[j + 1] < d) { j++; }
      var a = pts[j];
      var b = pts[(j + 1) % m];
      var f = (d - cum[j]) / (cum[j + 1] - cum[j] || 1);
      out.push({ x: a.x + (b.x - a.x) * f, y: a.y + (b.y - a.y) * f });
    }
    return out;
  }

  /* ---------- the opening screen ---------- */
  function createGate(opts) {
    var canvas = opts.canvas;
    var g2 = canvas.getContext('2d');
    var gateEl = opts.gate;
    var hintEl = opts.hint;
    var autoBtn = opts.auto;
    var text = opts.text;
    var reduced = !!opts.reduced;

    var W = 0;
    var H = 0;
    var cx = 0;
    var cy = 0;
    var size = 280;
    var baseTol = 28;
    var tol = 28;

    var full = []; // outline points in pixels
    var guide = []; // 96 evenly spaced points the stroke is compared with
    var hit = [];
    var glow = [];
    var hitCount = 0;
    var total = 0;
    var near = 0;
    var strokes = [];
    var current = null;
    var sparks = [];

    var state = 'idle'; // idle | success | done
    var drawing = false;
    var autoRunning = false;
    var raf = 0;
    var failTimer = 0;
    var helpTimer = 0;
    var fadeToken = 0;
    var failures = 0;
    var successAt = 0;
    var lastTs = 0;

    function reset() {
      strokes = [];
      current = null;
      hit = guide.map(function () { return false; });
      glow = guide.map(function () { return 0; });
      hitCount = 0;
      total = 0;
      near = 0;
    }

    function layout() {
      var L = opts.layout();
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = canvas.clientWidth;
      H = canvas.clientHeight;
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      g2.setTransform(dpr, 0, 0, dpr, 0, 0);
      cx = L.cx;
      cy = L.cy;
      size = L.w;
      baseTol = Math.max(24, size * 0.1);
      tol = baseTol;
      full = Heart.points.map(function (p) { return { x: cx + p[0] * size, y: cy + p[1] * size }; });
      guide = resample(full, 96);
      reset();
    }

    function addPoint(x, y) {
      current.pts.push({ x: x, y: y });
      total++;
      var nearest = Infinity;
      for (var i = 0; i < guide.length; i++) {
        var dx = guide[i].x - x;
        var dy = guide[i].y - y;
        var d = Math.sqrt(dx * dx + dy * dy);
        if (d < nearest) { nearest = d; }
        if (d <= tol && !hit[i]) { hit[i] = true; hitCount++; }
      }
      if (nearest <= tol * 2.4) { near++; }
    }

    function spark(x, y) {
      if (reduced || sparks.length > 70) { return; }
      for (var i = 0; i < 2; i++) {
        sparks.push({
          x: x + (Math.random() - 0.5) * 6,
          y: y + (Math.random() - 0.5) * 6,
          vx: (Math.random() - 0.5) * 40,
          vy: (Math.random() - 0.5) * 40 + 10,
          life: 1,
          r: 1 + Math.random() * 1.8
        });
      }
    }

    /* ----- drawing on the canvas ----- */
    function outline(ctx2) {
      ctx2.beginPath();
      ctx2.moveTo(full[0].x, full[0].y);
      for (var i = 1; i < full.length; i++) { ctx2.lineTo(full[i].x, full[i].y); }
      ctx2.closePath();
    }

    function strokePath(s) {
      var p = s.pts;
      g2.beginPath();
      g2.moveTo(p[0].x, p[0].y);
      if (p.length < 3) {
        g2.lineTo(p[p.length - 1].x + 0.01, p[p.length - 1].y);
        return;
      }
      for (var i = 1; i < p.length - 1; i++) {
        g2.quadraticCurveTo(p[i].x, p[i].y, (p[i].x + p[i + 1].x) / 2, (p[i].y + p[i + 1].y) / 2);
      }
      g2.lineTo(p[p.length - 1].x, p[p.length - 1].y);
    }

    function render(ts) {
      var dt = Math.min(0.05, (ts - lastTs) / 1000 || 0.016);
      lastTs = ts;
      g2.clearRect(0, 0, W, H);
      var life = state === 'success' ? Math.max(0, 1 - (ts - successAt) / 450) : 1;
      if (life <= 0) { return; }

      g2.save();
      g2.lineCap = 'round';
      g2.lineJoin = 'round';

      // dotted guide
      g2.globalAlpha = life;
      g2.setLineDash([0.1, 11]);
      g2.lineDashOffset = reduced ? 0 : -(ts / 55) % 11.1;
      g2.lineWidth = 4.4;
      g2.strokeStyle = 'rgba(255, 255, 255, 0.95)';
      outline(g2);
      g2.stroke();
      g2.setLineDash([]);

      // the part already traced lights up gold
      var n = guide.length;
      g2.strokeStyle = 'rgb(255, 224, 140)';
      g2.lineWidth = 4.4;
      for (var i = 0; i < n; i++) {
        glow[i] += ((hit[i] ? 1 : 0) - glow[i]) * 0.2;
        var a = Math.min(glow[i], glow[(i + 1) % n]);
        if (a < 0.03) { continue; }
        g2.globalAlpha = life * a;
        g2.beginPath();
        g2.moveTo(guide[i].x, guide[i].y);
        g2.lineTo(guide[(i + 1) % n].x, guide[(i + 1) % n].y);
        g2.stroke();
      }

      // the guest's own line: a white core with a soft blue glow
      strokes.forEach(function (s) {
        if (!s.pts.length) { return; }
        var alpha = life * s.alpha;
        strokePath(s);
        g2.strokeStyle = 'rgb(130, 190, 255)';
        g2.globalAlpha = alpha * 0.1;
        g2.lineWidth = 18;
        g2.stroke();
        g2.globalAlpha = alpha * 0.26;
        g2.lineWidth = 9;
        g2.stroke();
        g2.strokeStyle = 'rgb(255, 250, 235)';
        g2.globalAlpha = alpha * 0.95;
        g2.lineWidth = 3.2;
        g2.stroke();
      });

      // sparkles that trail the finger
      g2.globalCompositeOperation = 'lighter';
      for (var k = sparks.length - 1; k >= 0; k--) {
        var sp = sparks[k];
        sp.life -= dt * 1.6;
        if (sp.life <= 0) { sparks.splice(k, 1); continue; }
        sp.x += sp.vx * dt;
        sp.y += sp.vy * dt;
        g2.globalAlpha = life * sp.life * 0.8;
        g2.fillStyle = 'rgb(255, 244, 214)';
        g2.beginPath();
        g2.arc(sp.x, sp.y, sp.r, 0, Math.PI * 2);
        g2.fill();
      }
      g2.restore();
    }

    function frame(ts) {
      raf = 0;
      render(ts);
      if (state !== 'done') { raf = window.requestAnimationFrame(frame); }
    }

    function ensureLoop() {
      if (!raf && state !== 'done') { raf = window.requestAnimationFrame(frame); }
    }

    /* ----- is it a heart? ----- */
    function check(final) {
      if (state !== 'idle') { return; }
      var cov = hitCount / guide.length;
      var prec = total ? near / total : 0;
      if ((cov >= 0.9 && prec >= 0.6) || (final && cov >= 0.76 && prec >= 0.6)) {
        succeed();
        return;
      }
      if (final) {
        window.clearTimeout(failTimer);
        failTimer = window.setTimeout(fail, 1300);
      }
    }

    function showHelp() {
      hintEl.textContent = text.help;
      gateEl.classList.add('is-help');
      window.clearTimeout(helpTimer);
      helpTimer = window.setTimeout(function () {
        hintEl.textContent = text.hint;
        gateEl.classList.remove('is-help');
      }, 3200);
    }

    function revealAuto() { autoBtn.classList.add('is-ready'); }

    function fail() {
      if (state !== 'idle' || drawing) { return; }
      failures++;
      var token = ++fadeToken;
      var t0 = performance.now();
      (function step(now) {
        if (token !== fadeToken || state !== 'idle') { return; }
        var k = Math.min(1, (now - t0) / 600);
        strokes.forEach(function (s) { s.alpha = 1 - k; });
        if (k < 1) { window.requestAnimationFrame(step); } else { reset(); }
      })(t0);
      showHelp();
      if (failures >= 2) { revealAuto(); }
    }

    function succeed() {
      if (state !== 'idle') { return; }
      state = 'success';
      drawing = false;
      successAt = performance.now();
      window.clearTimeout(failTimer);
      window.clearTimeout(helpTimer);
      fadeToken++;
      gateEl.classList.add('is-success');
      opts.onSuccess({ cx: cx, cy: cy, size: size });
      window.setTimeout(function () {
        state = 'done';
        g2.clearRect(0, 0, W, H);
      }, 520);
    }

    /* ----- the guest's finger or mouse ----- */
    function pos(e) {
      var r = canvas.getBoundingClientRect();
      return { x: e.clientX - r.left, y: e.clientY - r.top };
    }

    function down(e) {
      if (state !== 'idle' || autoRunning) { return; }
      e.preventDefault();
      tol = baseTol * (e.pointerType === 'touch' ? 1.25 : 1);
      try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
      window.clearTimeout(failTimer);
      fadeToken++;
      strokes.forEach(function (s) { s.alpha = 1; });
      drawing = true;
      current = { pts: [], alpha: 1 };
      strokes.push(current);
      var p = pos(e);
      addPoint(p.x, p.y);
      spark(p.x, p.y);
      ensureLoop();
    }

    function move(e) {
      if (!drawing || !current) { return; }
      var list = e.getCoalescedEvents ? e.getCoalescedEvents() : null;
      if (!list || !list.length) { list = [e]; }
      list.forEach(function (ev) {
        var p = pos(ev);
        var last = current.pts[current.pts.length - 1];
        if (Math.hypot(p.x - last.x, p.y - last.y) >= 2.5) {
          addPoint(p.x, p.y);
          spark(p.x, p.y);
        }
      });
      check(false);
    }

    function up() {
      if (!drawing) { return; }
      drawing = false;
      current = null;
      check(true);
    }

    // The guest asked us to draw it: trace the outline, then let the normal check pass.
    function autoDraw() {
      if (state !== 'idle' || autoRunning) { return; }
      autoRunning = true;
      window.clearTimeout(failTimer);
      fadeToken++;
      reset();
      tol = baseTol;
      current = { pts: [], alpha: 1 };
      strokes.push(current);
      var t0 = performance.now();
      var dur = reduced ? 160 : 1900;
      var idx = 0;
      ensureLoop();
      (function step(now) {
        var k = Math.min(1, (now - t0) / dur);
        var e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
        var upto = Math.min(full.length - 1, Math.floor(e * (full.length - 1)));
        for (; idx <= upto && current; idx++) { addPoint(full[idx].x, full[idx].y); }
        if (current && idx > 0) { spark(full[idx - 1].x, full[idx - 1].y); }
        check(false);
        if (k < 1 && state === 'idle') {
          window.requestAnimationFrame(step);
        } else {
          current = null;
          autoRunning = false;
          check(true);
        }
      })(t0);
    }

    layout();
    canvas.addEventListener('pointerdown', down);
    canvas.addEventListener('pointermove', move);
    canvas.addEventListener('pointerup', up);
    canvas.addEventListener('pointercancel', up);
    // Keep the page from scrolling or bouncing while the guest draws on a phone.
    gateEl.addEventListener('touchmove', function (e) { e.preventDefault(); }, { passive: false });
    autoBtn.addEventListener('click', autoDraw);
    document.addEventListener('keydown', function (e) {
      if ((e.key === 'Enter' || e.key === ' ') && state === 'idle' && document.activeElement === document.body) {
        e.preventDefault();
        autoDraw();
      }
    });

    var resizeTimer = 0;
    window.addEventListener('resize', function () {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(function () { if (state === 'idle' && !drawing) { layout(); } }, 150);
    });

    hintEl.textContent = text.hint;
    window.setTimeout(revealAuto, reduced ? 0 : 6500);
    ensureLoop();

    return { autoDraw: autoDraw, relayout: layout };
  }

  window.HeartGate = { create: createGate, Heart: Heart };
})();
