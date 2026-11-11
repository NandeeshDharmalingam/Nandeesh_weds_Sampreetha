/* ============================================================================
   A stream of flower petals pouring from the spot where the two hands touch
   down towards the names. The stream is a soft S-shaped path measured in
   screen pixels; every petal remembers how far it has travelled along the path
   and how far to the side, so the whole stream bends and scrolls with the page.
   ========================================================================== */
(function () {
  'use strict';

  var TAU = Math.PI * 2;
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function smooth(t) { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); }

  /* ---------- petal pictures, drawn once ---------- */
  var DRAWERS = {
    rose: function (g, r) {
      var gr = g.createRadialGradient(0, r * 0.3, r * 0.05, 0, 0, r);
      gr.addColorStop(0, '#fff0f3');
      gr.addColorStop(0.55, '#f9bccb');
      gr.addColorStop(1, '#ea8ea8');
      g.fillStyle = gr;
      g.beginPath();
      g.moveTo(0, r * 0.86);
      g.bezierCurveTo(-r * 0.98, r * 0.3, -r * 0.8, -r * 0.8, -r * 0.1, -r * 0.66);
      g.bezierCurveTo(-r * 0.04, -r * 0.62, 0, -r * 0.54, 0, -r * 0.5);
      g.bezierCurveTo(0, -r * 0.54, r * 0.04, -r * 0.62, r * 0.1, -r * 0.66);
      g.bezierCurveTo(r * 0.8, -r * 0.8, r * 0.98, r * 0.3, 0, r * 0.86);
      g.fill();
      g.strokeStyle = 'rgba(255,255,255,0.55)';
      g.lineWidth = r * 0.04;
      g.beginPath();
      g.moveTo(-r * 0.5, -r * 0.35);
      g.quadraticCurveTo(-r * 0.2, -r * 0.6, 0, -r * 0.35);
      g.stroke();
    },
    jasmine: function (g, r) {
      for (var i = 0; i < 6; i++) {
        g.save();
        g.rotate((i / 6) * TAU);
        var gr = g.createLinearGradient(0, 0, 0, -r * 0.9);
        gr.addColorStop(0, '#f6ecd0');
        gr.addColorStop(0.5, '#ffffff');
        gr.addColorStop(1, '#fff4f4');
        g.fillStyle = gr;
        g.strokeStyle = 'rgba(214,196,150,0.8)';
        g.lineWidth = r * 0.02;
        g.beginPath();
        g.ellipse(0, -r * 0.5, r * 0.22, r * 0.42, 0, 0, TAU);
        g.fill();
        g.stroke();
        g.restore();
      }
      g.fillStyle = '#f3d27a';
      g.beginPath();
      g.arc(0, 0, r * 0.14, 0, TAU);
      g.fill();
    },
    marigold: function (g, r) {
      var rings = [[14, 0.82, '#ffd88a'], [12, 0.62, '#ffc25c'], [9, 0.42, '#ffad3b'], [6, 0.22, '#f79a2a']];
      rings.forEach(function (ring, k) {
        for (var i = 0; i < ring[0]; i++) {
          g.save();
          g.rotate((i / ring[0]) * TAU + k * 0.2);
          g.fillStyle = ring[2];
          g.strokeStyle = 'rgba(230,140,40,0.45)';
          g.lineWidth = r * 0.015;
          g.beginPath();
          g.ellipse(0, -r * ring[1] * 0.62, r * 0.13, r * ring[1] * 0.38, 0, 0, TAU);
          g.fill();
          g.stroke();
          g.restore();
        }
      });
    },
    lotus: function (g, r) {
      var gr = g.createLinearGradient(0, r * 0.9, 0, -r * 0.9);
      gr.addColorStop(0, '#fff6f8');
      gr.addColorStop(0.5, '#fbd0dc');
      gr.addColorStop(1, '#f19db6');
      g.fillStyle = gr;
      g.beginPath();
      g.moveTo(0, r * 0.9);
      g.bezierCurveTo(-r * 0.7, r * 0.3, -r * 0.5, -r * 0.6, 0, -r * 0.92);
      g.bezierCurveTo(r * 0.5, -r * 0.6, r * 0.7, r * 0.3, 0, r * 0.9);
      g.fill();
      g.strokeStyle = 'rgba(255,255,255,0.5)';
      g.lineWidth = r * 0.025;
      [-0.18, 0, 0.18].forEach(function (o) {
        g.beginPath();
        g.moveTo(0, r * 0.8);
        g.quadraticCurveTo(r * o * 2, 0, r * o * 0.6, -r * 0.7);
        g.stroke();
      });
    }
  };
  var KINDS = ['rose', 'rose', 'jasmine', 'marigold', 'lotus', 'jasmine'];

  function picture(kind, size) {
    var c = document.createElement('canvas');
    c.width = c.height = size;
    var g = c.getContext('2d');
    g.translate(size / 2, size / 2);
    DRAWERS[kind](g, size / 2 - 2);
    return c;
  }

  function sparkle() {
    var c = document.createElement('canvas');
    c.width = c.height = 48;
    var g = c.getContext('2d');
    var gr = g.createRadialGradient(24, 24, 0, 24, 24, 24);
    gr.addColorStop(0, 'rgba(255, 250, 232, 1)');
    gr.addColorStop(0.3, 'rgba(255, 222, 160, 0.55)');
    gr.addColorStop(1, 'rgba(255, 214, 150, 0)');
    g.fillStyle = gr;
    g.fillRect(0, 0, 48, 48);
    return c;
  }

  /* ---------- the stream ---------- */
  // opts: { still: bool, petalSrc: picture of petals side by side, petalFrames: [[x, y, w, h], ...] }
  function create(canvas, opts) {
    var ctx = canvas.getContext('2d');
    var still = !!(opts && opts.still);
    var dpr = 1;
    var W = 1;
    var H = 1;
    var pics = {};
    KINDS.forEach(function (k) { if (!pics[k]) { pics[k] = picture(k, 72); } });
    var kinds = KINDS.slice();
    if (opts && opts.petalSrc) {
      var sheet = new Image();
      sheet.onload = function () {
        opts.petalFrames.forEach(function (f, i) {
          var c = document.createElement('canvas');
          c.width = f[2];
          c.height = f[3];
          c.getContext('2d').drawImage(sheet, f[0], f[1], f[2], f[3], 0, 0, f[2], f[3]);
          pics['w' + i] = c;
          for (var n = 0; n < 4; n++) { kinds.push('w' + i); }
        });
      };
      sheet.src = opts.petalSrc;
    }
    var spark = sparkle();
    var list = [];
    var dust = [];
    var path = { x0: 0, y0: 0, x1: 0, len: 120 };
    var amount = 0; // 0 = stopped, 1 = full flow
    var fade = 1; // fades the whole stream (for example once the hands have scrolled away)
    var carry = 0;

    function resize(w, h) {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = w;
      H = h;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      canvas.style.width = w + 'px';
      canvas.style.height = h + 'px';
    }

    // From where the petals start (x0, y0) to where they land (x1, y1), in CSS pixels on screen.
    function setPath(x0, y0, x1, y1) {
      path.x0 = x0;
      path.y0 = y0;
      path.x1 = x1;
      path.len = Math.max(140, y1 - y0);
    }

    // Where the stream is after travelling d pixels, plus the sideways direction there.
    var P = { x: 0, y: 0, nx: 1, ny: 0 };
    function xAt(d) {
      var amp = Math.min(W * 0.07, 42);
      var ramp = smooth(d / (H * 0.1)) * (1 - smooth((d - (path.len - H * 0.2)) / (H * 0.14)));
      return lerp(path.x0, path.x1, smooth(d / path.len)) + amp * Math.sin((d / (H * 0.5)) * Math.PI) * ramp;
    }
    function at(d) {
      var x = xAt(d);
      var slope = (xAt(d + 3) - x) / 3; // sideways change per pixel going down
      var m = Math.sqrt(1 + slope * slope);
      P.x = x;
      P.y = path.y0 + d;
      P.nx = 1 / m;
      P.ny = -slope / m;
      return P;
    }

    function spawn(d0) {
      var size = (W < 520 ? 18 : 25) * (0.7 + Math.random() * 0.8);
      list.push({
        d: d0,
        v: (Math.random() + Math.random() + Math.random() - 1.5) / 1.5,
        speed: 0.26 + Math.random() * 0.16,
        size: size,
        kind: kinds[(Math.random() * kinds.length) | 0],
        rot: Math.random() * TAU,
        spin: (Math.random() - 0.5) * 2.6,
        phase: Math.random() * TAU,
        flutter: 1.6 + Math.random() * 1.6,
        alpha: 0.7 + Math.random() * 0.3
      });
      if (Math.random() < 0.55) {
        dust.push({ d: d0, v: Math.random() * 2 - 1, speed: 0.22 + Math.random() * 0.2, phase: Math.random() * TAU, size: 3 + Math.random() * 5 });
      }
    }

    function setAmount(a) { amount = clamp(a, 0, 1); }
    function setFade(f) { fade = clamp(f, 0, 1); }
    function active() { return amount > 0.01 || list.length > 0; }

    // A still picture for guests who prefer less motion.
    function fillStill() {
      list.length = 0;
      dust.length = 0;
      var span = Math.min(path.len, H * 0.75);
      for (var i = 0; i < 80; i++) { spawn(span * (0.03 + 0.94 * (i / 80))); }
    }

    function update(dt) {
      var rate = 90 * amount * (W < 520 ? 0.9 : 1.3);
      if (list.length > 1400) { rate = 0; }
      carry += rate * dt;
      while (carry >= 1) { carry -= 1; spawn(0); }
      var i;
      for (i = list.length - 1; i >= 0; i--) {
        var p = list[i];
        p.d += H * p.speed * dt;
        p.phase += p.flutter * dt;
        p.rot += p.spin * dt;
        if (p.d > path.len + 24) { list.splice(i, 1); }
      }
      for (i = dust.length - 1; i >= 0; i--) {
        var q = dust[i];
        q.d += H * q.speed * dt;
        q.phase += 3 * dt;
        if (q.d > path.len + 24) { dust.splice(i, 1); }
      }
    }

    // fade near the start, and as the petals reach the names
    function edge(d) { return smooth(d / (H * 0.03)) * (1 - smooth((d - (path.len - H * 0.14)) / (H * 0.12))); }
    function spread(d) { return lerp(5, Math.min(W * 0.27, 175), Math.pow(smooth(d / (H * 0.55)), 1.2)); }

    function draw() {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (fade <= 0.001 || !list.length) { return; }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var i;
      var top = -60;
      var bottom = H + 60;

      // a soft ribbon of light under the petals leads the eye down
      var front = 0;
      for (i = 0; i < list.length; i++) { if (list[i].d > front) { front = list[i].d; } }
      front = Math.min(front, path.len);
      if (front > 12) {
        var steps = 32;
        var from = Math.max(0, top - path.y0);
        var to = Math.min(front, bottom - path.y0);
        ctx.globalCompositeOperation = 'lighter';
        ctx.lineCap = 'round';
        ctx.strokeStyle = 'rgb(255, 214, 190)';
        for (i = 0; i < steps && to > from; i++) {
          var d0 = lerp(from, to, i / steps);
          var d1 = lerp(from, to, (i + 1) / steps);
          var a0 = at(d0);
          var xa = a0.x;
          var ya = a0.y;
          var a1 = at(d1);
          ctx.globalAlpha = 0.2 * fade * edge((d0 + d1) / 2) * (0.55 + 0.45 * (1 - (d0 + d1) / (2 * path.len)));
          ctx.lineWidth = spread((d0 + d1) / 2) * 0.7;
          ctx.beginPath();
          ctx.moveTo(xa, ya);
          ctx.lineTo(a1.x, a1.y);
          ctx.stroke();
        }
      }

      // sparkles, then petals on top
      ctx.globalCompositeOperation = 'lighter';
      for (i = 0; i < dust.length; i++) {
        var s = dust[i];
        var y = path.y0 + s.d;
        if (y < top || y > bottom) { continue; }
        var qa = at(s.d);
        var tw = 0.4 + 0.6 * Math.abs(Math.sin(s.phase));
        var a = tw * 0.8 * fade * edge(s.d);
        if (a < 0.02) { continue; }
        var sw = spread(s.d);
        var sz = s.size * 2.4;
        ctx.globalAlpha = a;
        ctx.drawImage(spark, qa.x + qa.nx * s.v * sw - sz / 2, qa.y + qa.ny * s.v * sw - sz / 2, sz, sz);
      }
      ctx.globalCompositeOperation = 'source-over';
      for (i = 0; i < list.length; i++) {
        var p = list[i];
        var py = path.y0 + p.d;
        if (py < top || py > bottom) { continue; }
        var al = p.alpha * fade * edge(p.d);
        if (al < 0.02) { continue; }
        var r = at(p.d);
        var w = spread(p.d);
        var wob = Math.sin(p.phase * 0.8) * 6 * smooth(p.d / (H * 0.4));
        var x = r.x + r.nx * (p.v * w + wob);
        var yy = r.y + r.ny * (p.v * w + wob);
        var flip = Math.cos(p.phase * 1.4);
        var psz = p.size * (0.85 + 0.35 * smooth(p.d / (H * 0.5)));
        ctx.globalAlpha = al;
        ctx.save();
        ctx.translate(x, yy);
        ctx.rotate(p.rot);
        ctx.scale(0.35 + 0.65 * Math.abs(flip), 1);
        var pic = pics[p.kind];
        var sc = psz / Math.max(pic.width, pic.height) * (pic.width > 80 ? 1.15 : 1);
        ctx.drawImage(pic, -pic.width * sc / 2, -pic.height * sc / 2, pic.width * sc, pic.height * sc);
        ctx.restore();
      }
      ctx.globalAlpha = 1;
    }

    return {
      resize: resize,
      setPath: setPath,
      setAmount: setAmount,
      setFade: setFade,
      active: active,
      fillStill: fillStill,
      redraw: draw,
      step: function (dt) { if (!still) { update(Math.min(dt, 0.05)); } draw(); },
      clear: function () { list.length = 0; dust.length = 0; ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, canvas.width, canvas.height); }
    };
  }

  window.Cascade = { create: create };
})();
