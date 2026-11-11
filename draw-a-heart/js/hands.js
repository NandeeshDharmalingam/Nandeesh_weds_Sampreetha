/* ============================================================================
   The two hands from the couple's watercolor artwork (assets/hands/*.webp):
   his from the left, hers from the right (ring and gold bangle). As the guest
   scrolls they slide in from the sides until the fingertips touch. Their far
   ends fade into the sky, so the arms never end in a hard edge.
   ========================================================================== */
(function () {
  'use strict';

  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function smooth(t) { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); }

  // Sizes are in picture pixels. (px, py) is the spot where the two fingertips touch.
  // fade: how far in from the cut end of the arm the picture melts away.
  var ART = {
    groom: { src: 'assets/hands/groom.webp', w: 806, h: 329, px: 758, py: 194, side: -1, fade: 240 },
    bride: { src: 'assets/hands/bride.webp', w: 674, h: 365, px: 13, py: 236, side: 1, fade: 170 }
  };
  var SHADOW_PAD = 30;

  function load(src, done) {
    var img = new Image();
    img.decoding = 'async';
    img.onload = function () { done(img); };
    img.onerror = function () { done(null); };
    img.src = src;
    return img;
  }

  // The cut end of each arm melts into nothing, like a watercolour wash, so no hard edge or streak shows.
  function softArm(img, a) {
    var c = document.createElement('canvas');
    c.width = a.w;
    c.height = a.h;
    var g = c.getContext('2d');
    g.drawImage(img, 0, 0, a.w, a.h);
    var x0 = a.side < 0 ? 0 : a.w;
    var x1 = a.side < 0 ? a.fade : a.w - a.fade;
    var fade = g.createLinearGradient(x0, 0, x1, 0);
    for (var i = 0; i <= 8; i++) { fade.addColorStop(i / 8, 'rgba(0, 0, 0, ' + smooth(i / 8).toFixed(3) + ')'); }
    g.globalCompositeOperation = 'destination-in';
    g.fillStyle = fade;
    g.fillRect(0, 0, a.w, a.h);
    return c;
  }

  // A soft shadow made once: the picture is drawn far off to the side and only its shadow lands in view.
  function makeShadow(src, w, h) {
    var c = document.createElement('canvas');
    c.width = w + SHADOW_PAD * 2;
    c.height = h + SHADOW_PAD * 2;
    var g = c.getContext('2d');
    var far = 6000;
    g.shadowColor = 'rgba(150, 80, 70, 0.2)';
    g.shadowBlur = 16;
    g.shadowOffsetX = far;
    g.drawImage(src, SHADOW_PAD - far, SHADOW_PAD, w, h);
    return c;
  }

  function create(canvas, onChange) {
    var ctx = canvas.getContext('2d');
    var dpr = 1;
    var W = 0;
    var L = null;
    var parts = { groom: null, bride: null };

    ['groom', 'bride'].forEach(function (key) {
      var a = ART[key];
      load(a.src, function (img) {
        if (!img) { return; }
        var soft = softArm(img, a);
        parts[key] = { soft: soft, shadow: makeShadow(soft, a.w, a.h) };
        if (onChange) { onChange(); }
      });
    });

    // layout: { cx, cy, k } - where the fingertips meet (CSS pixels) and the size of one picture pixel
    function resize(w, h, layout) {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = w;
      L = layout;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      canvas.style.width = w + 'px';
      canvas.style.height = h + 'px';
    }

    function drawHand(key, x, y, rot) {
      var a = ART[key];
      var p = parts[key];
      if (!p) { return; }
      ctx.save();
      ctx.translate(x * dpr, y * dpr);
      ctx.rotate(rot);
      ctx.scale(L.k * dpr, L.k * dpr);
      ctx.drawImage(p.shadow, -a.px - SHADOW_PAD, -a.py - SHADOW_PAD + 9);
      ctx.drawImage(p.soft, -a.px, -a.py);
      ctx.restore();
    }

    // the soft light behind the touching fingertips
    function glowBack(j, t) {
      var gx = L.cx * dpr;
      var gy = (L.cy + 12 * L.k) * dpr;
      var r = L.k * 330 * dpr * (0.55 + 0.45 * j) * (1 + 0.04 * Math.sin(t * 2.1));
      var g = ctx.createRadialGradient(gx, gy, 0, gx, gy, r);
      g.addColorStop(0, 'rgba(255, 250, 232,' + (0.95 * j).toFixed(3) + ')');
      g.addColorStop(0.16, 'rgba(255, 222, 160,' + (0.6 * j).toFixed(3) + ')');
      g.addColorStop(0.45, 'rgba(255, 176, 160,' + (0.2 * j).toFixed(3) + ')');
      g.addColorStop(1, 'rgba(255, 176, 160, 0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(gx, gy, r, 0, Math.PI * 2);
      ctx.fill();
    }

    // a small bright spark on the touch and a few twinkling stars around it
    function glowFront(j, t) {
      var gx = L.cx * dpr;
      var gy = (L.cy + 12 * L.k) * dpr;
      var r = L.k * 70 * dpr;
      var g = ctx.createRadialGradient(gx, gy, 0, gx, gy, r);
      g.addColorStop(0, 'rgba(255, 252, 238,' + (0.7 * j).toFixed(3) + ')');
      g.addColorStop(1, 'rgba(255, 236, 190, 0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(gx, gy, r, 0, Math.PI * 2);
      ctx.fill();
      for (var i = 0; i < 7; i++) {
        var ang = i * 2.4 + t * 0.2;
        var dist = L.k * (70 + 46 * ((i * 37) % 7) / 6) * dpr;
        var tw = 0.5 + 0.5 * Math.sin(t * (1.6 + i * 0.37) + i * 1.9);
        var sx = gx + Math.cos(ang) * dist * 1.25;
        var sy = gy + Math.sin(ang) * dist * 0.7;
        var sr = L.k * (9 + 8 * tw) * dpr;
        ctx.strokeStyle = 'rgba(255, 246, 214,' + (0.85 * j * tw).toFixed(3) + ')';
        ctx.lineWidth = Math.max(1, dpr * 0.9);
        ctx.beginPath();
        ctx.moveTo(sx - sr, sy);
        ctx.lineTo(sx + sr, sy);
        ctx.moveTo(sx, sy - sr);
        ctx.lineTo(sx, sy + sr);
        ctx.stroke();
      }
    }

    // st: { reach: 0..1 how far in, join: 0..1 the glow where they touch, t: milliseconds }
    function render(st) {
      if (!L) { return; }
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      var g = ART.groom;
      var b = ART.bride;
      var far = 1 - smooth(st.reach);
      var t = (st.t || 0) / 1000;
      var settle = smooth(st.reach);
      var bob = Math.sin(t * 1.15) * 1.4 * settle;
      var drift = Math.sin(t * 0.8 + 1.3) * 0.9 * settle;
      var travelG = L.cx + (g.w - g.px) * L.k + 50;
      var travelB = (W - L.cx) + b.px * L.k + 50;
      var rise = far * 110 * L.k;
      var press = smooth(st.join) * 1.6;
      var j = clamp(st.join, 0, 1);
      if (j > 0.001) { glowBack(j, t); }
      drawHand('groom', L.cx - far * travelG + drift + press, L.cy + rise + bob, -far * 0.1);
      drawHand('bride', L.cx + far * travelB - drift - press, L.cy + rise - bob, far * 0.1);
      if (j > 0.001) { glowFront(j, t); }
    }

    return {
      resize: resize,
      render: render,
      ready: function () { return !!(parts.groom && parts.bride); },
      // where the petals start to pour (CSS pixels, relative to the canvas)
      anchor: function () { return L ? { x: L.cx, y: L.cy + 16 * L.k } : { x: 0, y: 0 }; }
    };
  }

  window.Hands = { create: create, ART: ART };
})();
