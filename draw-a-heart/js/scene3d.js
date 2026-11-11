/* ============================================================================
   The glossy 3D heart (Three.js, loaded from assets/vendor/three.min.js).
   It appears when the guest finishes drawing, floats up to the top of the page
   and settles behind Ganesha as a softly glowing halo. It is built in code, so
   there are no 3D model files to download.
   ========================================================================== */
(function () {
  'use strict';

  var T = window.THREE;
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function lerp(a, b, t) { return a + (b - a) * t; }

  // Add light without making the see-through canvas any more opaque (otherwise dark specks appear).
  var GLOW_BLEND = {
    blending: T ? T.CustomBlending : 0,
    blendEquation: T ? T.AddEquation : 0,
    blendSrc: T ? T.SrcAlphaFactor : 0,
    blendDst: T ? T.OneFactor : 0,
    blendSrcAlpha: T ? T.ZeroFactor : 0,
    blendDstAlpha: T ? T.OneFactor : 0
  };

  function supported() {
    if (!T) { return false; }
    try {
      var c = document.createElement('canvas');
      return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl')));
    } catch (e) { return false; }
  }

  /* ---------- matcap: a painted ball that tells a surface how to look ---------- */
  function rgb(hex) {
    var h = hex.replace('#', '');
    if (h.length === 3) { h = h.charAt(0) + h.charAt(0) + h.charAt(1) + h.charAt(1) + h.charAt(2) + h.charAt(2); }
    return [parseInt(h.substr(0, 2), 16), parseInt(h.substr(2, 2), 16), parseInt(h.substr(4, 2), 16)];
  }
  function mix(a, b, t) { return [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)]; }

  // o: { deep, shade, base, hi, rim, rimAmt, spec }  (hex colours)
  function matcap(o) {
    var S = 256;
    var cv = document.createElement('canvas');
    cv.width = cv.height = S;
    var g = cv.getContext('2d');
    var img = g.createImageData(S, S);
    var d = img.data;
    var deep = rgb(o.deep || o.shade);
    var shade = rgb(o.shade);
    var base = rgb(o.base);
    var hi = rgb(o.hi);
    var rim = rgb(o.rim || o.hi);
    var rimAmt = o.rimAmt === undefined ? 0.3 : o.rimAmt;
    var spec = o.spec === undefined ? 0.4 : o.spec;
    var lx = -0.5;
    var ly = 0.62;
    var lz = 0.6;
    var ll = Math.sqrt(lx * lx + ly * ly + lz * lz);
    lx /= ll; ly /= ll; lz /= ll;
    var hx = lx;
    var hy = ly;
    var hz = lz + 1;
    var hl = Math.sqrt(hx * hx + hy * hy + hz * hz);
    hx /= hl; hy /= hl; hz /= hl;
    for (var y = 0; y < S; y++) {
      for (var x = 0; x < S; x++) {
        var nx = ((x + 0.5) / S) * 2 - 1;
        var ny = -(((y + 0.5) / S) * 2 - 1);
        var r2 = nx * nx + ny * ny;
        if (r2 > 1) { var m = 1 / Math.sqrt(r2); nx *= m; ny *= m; r2 = 1; }
        var nz = Math.sqrt(Math.max(0, 1 - r2));
        var ndl = nx * lx + ny * ly + nz * lz;
        var w = clamp((ndl + 0.4) / 1.4, 0, 1);
        var c;
        if (w < 0.3) { c = mix(deep, shade, w / 0.3); }
        else if (w < 0.62) { c = mix(shade, base, (w - 0.3) / 0.32); }
        else { c = mix(base, hi, (w - 0.62) / 0.38); }
        var fr = Math.pow(1 - nz, 2.4) * rimAmt;
        c = mix(c, rim, fr);
        var ndh = Math.max(0, nx * hx + ny * hy + nz * hz);
        var sp = Math.pow(ndh, 48) * spec + Math.pow(ndh, 10) * spec * 0.12;
        var i = (y * S + x) * 4;
        d[i] = clamp(c[0] + sp * 255, 0, 255);
        d[i + 1] = clamp(c[1] + sp * 255, 0, 255);
        d[i + 2] = clamp(c[2] + sp * 255, 0, 255);
        d[i + 3] = 255;
      }
    }
    g.putImageData(img, 0, 0);
    var tex = new T.CanvasTexture(cv);
    tex.encoding = T.sRGBEncoding;
    return tex;
  }

  function glowTexture(color) {
    var c = document.createElement('canvas');
    c.width = c.height = 128;
    var g = c.getContext('2d');
    var gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    gr.addColorStop(0, 'rgba(' + color + ',1)');
    gr.addColorStop(0.35, 'rgba(' + color + ',0.35)');
    gr.addColorStop(1, 'rgba(' + color + ',0)');
    g.fillStyle = gr;
    g.fillRect(0, 0, 128, 128);
    var t = new T.CanvasTexture(c);
    t.encoding = T.sRGBEncoding;
    return t;
  }

  /* ---------- the scene ---------- */
  // opts: { heartPoints: [[x, y], ...] (unit width, y down) }
  function create(canvas, opts) {
    var renderer = new T.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true, powerPreference: 'low-power' });
    renderer.outputEncoding = T.sRGBEncoding;
    renderer.setClearColor(0x000000, 0);
    renderer.autoClear = false;

    var W = 1;
    var H = 1;
    // a flat (orthographic) scene in screen pixels
    var scene = new T.Scene();
    var cam = new T.OrthographicCamera(0, 1, 1, 0, -2000, 2000);
    var heart = null;
    var group = new T.Group();
    scene.add(group);
    var flare = new T.Sprite(new T.SpriteMaterial(Object.assign({ map: glowTexture('255,176,176'), transparent: true, depthTest: false }, GLOW_BLEND)));
    group.add(flare);
    if (opts.heartPoints) {
      var shape = new T.Shape();
      opts.heartPoints.forEach(function (p, i) {
        if (i % 3 !== 0) { return; }
        if (i === 0) { shape.moveTo(p[0] * 0.86, -p[1] * 0.86); } else { shape.lineTo(p[0] * 0.86, -p[1] * 0.86); }
      });
      var geo = new T.ExtrudeGeometry(shape, { depth: 0.1, bevelEnabled: true, bevelThickness: 0.13, bevelSize: 0.07, bevelOffset: 0, bevelSegments: 10, curveSegments: 1, steps: 1 });
      geo.center();
      var mat = new T.MeshMatcapMaterial({ matcap: matcap({ deep: '#b04a66', shade: '#e0728b', base: '#f7a6b6', hi: '#ffe3e8', rim: '#ffd9ae', rimAmt: 0.5, spec: 0.9 }), transparent: true });
      heart = new T.Mesh(geo, mat);
      group.add(heart);
    }
    group.visible = false;

    var S = { heart: { x: 0, y: 0, size: 200, glow: 0, show: false } };
    var bloomStart = -1;

    function resize(w, h) {
      W = w;
      H = h;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, w < 700 ? 1.75 : 2));
      renderer.setSize(W, H);
      cam.left = 0; cam.right = W; cam.top = H; cam.bottom = 0;
      cam.updateProjectionMatrix();
    }

    // heart: { show, x, y, size, glow, alpha } in screen pixels (y down)
    function set(next) { if (next.heart) { S.heart = next.heart; } }
    function bloom() { bloomStart = performance.now(); }

    function render() {
      var now = performance.now();
      var t = now / 1000;
      var h = S.heart;
      var fade = h.alpha === undefined ? 1 : h.alpha;
      group.visible = !!h.show && !!heart && fade > 0.01;
      if (group.visible) {
        var b = 1;
        if (bloomStart >= 0) { b = 1 - Math.pow(1 - clamp((now - bloomStart) / 1300, 0, 1), 3); }
        var beat = 1;
        if (bloomStart >= 0) {
          var bt = (now - bloomStart) / 1000 - 1.1;
          if (bt > 0 && bt < 1.5) { beat = 1 + 0.07 * Math.max(0, Math.sin(bt * 8.5)) * (1 - bt / 1.5); }
        }
        var size = h.size * (0.55 + 0.45 * b) * beat;
        group.position.set(h.x, H - h.y, 0);
        heart.scale.setScalar(size);
        heart.rotation.set(Math.sin(t * 0.7) * 0.07, (1 - b) * Math.PI * 2 + Math.sin(t * 0.5) * 0.28, Math.sin(t * 0.4) * 0.04);
        flare.scale.setScalar(size * (2.1 + 0.4 * Math.sin(t * 1.3)));
        flare.material.opacity = (0.35 + 0.6 * (h.glow || 0)) * (bloomStart >= 0 ? b : 1) * fade;
        heart.material.opacity = fade;
      }
      renderer.clear();
      renderer.render(scene, cam);
    }

    return { resize: resize, set: set, render: render, bloom: bloom, dispose: function () { renderer.dispose(); } };
  }

  window.Scene3D = { create: create, supported: supported };
})();
