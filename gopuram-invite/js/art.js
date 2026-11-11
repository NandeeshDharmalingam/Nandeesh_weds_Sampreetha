/* ============================================================================
   Things drawn in code, so the page needs no extra pictures: soft clouds for the
   transition, twinkling stars and a slow kolam (rangoli) behind the heart.
   ========================================================================== */
(function () {
  'use strict';

  function rng(seed) {
    var s = seed >>> 0;
    return function () {
      s = (s + 0x6D2B79F5) >>> 0;
      var t = s;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // A soft round mass of cloud for the cloud transition.
  function mist(w, h, seed) {
    var c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    var g = c.getContext('2d');
    var r = rng(seed);
    var n = Math.round(w / 20);
    for (var i = 0; i < n; i++) {
      var a = r() * Math.PI * 2;
      var d = Math.sqrt(r());
      var x = w * (0.5 + Math.cos(a) * d * 0.36);
      var y = h * (0.5 + Math.sin(a) * d * 0.3);
      var rad = h * (0.2 + 0.2 * r());
      var tint = y > h * 0.56 ? 'rgba(206, 227, 252,' : 'rgba(255, 255, 255,';
      var gr = g.createRadialGradient(x, y, 0, x, y, rad);
      gr.addColorStop(0, tint + '0.95)');
      gr.addColorStop(0.55, tint + '0.55)');
      gr.addColorStop(1, tint + '0)');
      g.fillStyle = gr;
      g.beginPath();
      g.arc(x, y, rad, 0, Math.PI * 2);
      g.fill();
    }
    // fade the outer edge so the sprite never shows a boundary
    g.globalCompositeOperation = 'destination-in';
    g.save();
    g.translate(w / 2, h / 2);
    g.scale(1, h / w);
    var m = g.createRadialGradient(0, 0, 0, 0, 0, w / 2);
    m.addColorStop(0, 'rgba(0, 0, 0, 1)');
    m.addColorStop(0.7, 'rgba(0, 0, 0, 1)');
    m.addColorStop(1, 'rgba(0, 0, 0, 0)');
    g.fillStyle = m;
    g.fillRect(-w / 2, -w / 2, w, w);
    g.restore();
    return c;
  }

  function stars(host, n, seed) {
    var r = rng(seed);
    var frag = document.createDocumentFragment();
    for (var i = 0; i < n; i++) {
      var s = document.createElement('i');
      var size = 1 + r() * 2.2;
      s.className = 'star';
      s.style.cssText = 'left:' + (r() * 100).toFixed(2) + '%;top:' + (r() * 100).toFixed(2) + '%;width:' + size.toFixed(1) +
        'px;height:' + size.toFixed(1) + 'px;animation-delay:' + (-r() * 6).toFixed(2) + 's;animation-duration:' + (3 + r() * 4).toFixed(2) + 's';
      frag.appendChild(s);
    }
    host.appendChild(frag);
  }

  // A rangoli of petals, dots and scallops in gold and pale blue.
  function mandala(canvas, size) {
    canvas.width = canvas.height = size;
    var g = canvas.getContext('2d');
    var k = size / 1024;
    g.translate(size / 2, size / 2);
    g.scale(k, k);
    g.lineCap = 'round';
    g.lineJoin = 'round';
    var gold = 'rgba(255, 226, 150, 0.9)';
    var soft = 'rgba(255, 226, 150, 0.5)';
    var skyA = 'rgba(150, 195, 255, 0.2)';
    var skyB = 'rgba(255, 255, 255, 0.08)';

    function dots(n, rad, dot, fill) {
      g.fillStyle = fill;
      for (var i = 0; i < n; i++) {
        var a = (i / n) * Math.PI * 2;
        g.beginPath();
        g.arc(Math.cos(a) * rad, Math.sin(a) * rad, dot, 0, Math.PI * 2);
        g.fill();
      }
    }
    function petals(n, r0, r1, wid, fill, lw, off) {
      for (var i = 0; i < n; i++) {
        g.save();
        g.rotate((i / n) * Math.PI * 2 + (off || 0));
        g.beginPath();
        g.moveTo(0, -r0);
        g.bezierCurveTo(wid, -(r0 + (r1 - r0) * 0.3), wid * 0.85, -(r0 + (r1 - r0) * 0.8), 0, -r1);
        g.bezierCurveTo(-wid * 0.85, -(r0 + (r1 - r0) * 0.8), -wid, -(r0 + (r1 - r0) * 0.3), 0, -r0);
        g.closePath();
        g.fillStyle = fill;
        g.fill();
        g.strokeStyle = gold;
        g.lineWidth = lw;
        g.stroke();
        g.restore();
      }
    }

    dots(84, 492, 3, soft);
    dots(56, 470, 2.4, soft);
    g.strokeStyle = gold;
    g.lineWidth = 2.6;
    var N = 40;
    for (var i = 0; i < N; i++) {
      var a0 = (i / N) * Math.PI * 2;
      var a1 = ((i + 1) / N) * Math.PI * 2;
      var am = (a0 + a1) / 2;
      g.beginPath();
      g.moveTo(Math.cos(a0) * 436, Math.sin(a0) * 436);
      g.quadraticCurveTo(Math.cos(am) * 462, Math.sin(am) * 462, Math.cos(a1) * 436, Math.sin(a1) * 436);
      g.stroke();
    }
    petals(32, 340, 430, 24, skyB, 2, 0);
    petals(24, 270, 398, 38, skyA, 2.4, 0.06);
    petals(16, 190, 330, 52, skyB, 2.4, 0);
    petals(12, 110, 250, 58, skyA, 2.4, 0.1);
    petals(8, 40, 160, 50, skyB, 2.4, 0);
    g.strokeStyle = soft;
    g.lineWidth = 2.2;
    for (var j = 0; j < 8; j++) {
      var a = (j / 8) * Math.PI * 2;
      g.beginPath();
      g.arc(Math.cos(a) * 86, Math.sin(a) * 86, 64, 0, Math.PI * 2);
      g.stroke();
    }
    dots(8, 150, 5, gold);
    g.fillStyle = gold;
    g.beginPath();
    g.arc(0, 0, 14, 0, Math.PI * 2);
    g.fill();
  }

  window.Art = { mist: mist, stars: stars, mandala: mandala };
})();
