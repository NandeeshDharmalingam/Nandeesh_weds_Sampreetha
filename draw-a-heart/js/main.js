/* ============================================================================
   Puts the pieces together:
   1. Draw a heart (gate)  ->  2. the heart floats up and settles into the
   Venkatramana emblem; as the guest scrolls, his hand and her hand slide in
   from the sides until their fingertips touch and flower petals pour down
   ->  3. the names, date and events, framed by the two Ganesha pictures, which
   drift gently as the guest scrolls.
   Everything the guest reads comes from config.js. If the phone cannot do 3D,
   a flat heart takes its place so the invitation always works.
   ========================================================================== */
(function () {
  'use strict';

  var CFG = window.HEART_CONFIG;
  var Cal = window.WeddingCalendar;
  if (!CFG) { return; }

  var EMBLEM_RATIO = 520 / 468; // width / height of assets/art/venkatramana-logo.png

  function $(sel) { return document.querySelector(sel); }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function range(p, a, b) { return clamp((p - a) / (b - a), 0, 1); }
  function ease(t) { return t * t * (3 - 2 * t); }
  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) { n.className = cls; }
    if (text !== undefined) { n.textContent = text; }
    return n;
  }

  var root = document.documentElement;
  var body = document.body;
  var effects = CFG.effects || {};
  var petalsOn = effects.petals !== false;
  var still = effects.animations === false || (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  if (still) { root.classList.add('no-anim'); }

  var stage = $('#stage');
  var story = $('#story');
  var details = $('#details');
  var heartSvg = $('#heart');
  var namesEl = $('#names');
  var sceneCanvas = $('#scene');
  var handsCanvas = $('#hands');
  var cascadeCanvas = $('#cascade');
  var drawCanvas = $('#draw');
  var emblem = $('#emblem');

  if ('scrollRestoration' in history) { history.scrollRestoration = 'manual'; }
  window.scrollTo(0, 0);

  /* ---------- words ---------- */
  function applyText() {
    var T = CFG.text;
    var C = CFG.couple;
    document.title = C.groom + ' & ' + C.bride + ' | Wedding Invitation';
    $('#groom').textContent = C.groom;
    $('#bride').textContent = C.bride;
    $('#blessing').textContent = T.blessing || '';
    $('#invite').textContent = T.invite;
    $('#cue-text').textContent = T.scroll;
    $('#gate-title').textContent = T.gate.title;
    $('#gate-auto').textContent = T.gate.auto;
    var d = window.HeartGate.Heart.pathData();
    $('#heart-line').setAttribute('d', d);
    $('#heart-fill').setAttribute('d', d);
  }

  function row(parent, label, value, muted) {
    var r = el('p', 'event__row');
    r.appendChild(el('span', 'event__label', label));
    r.appendChild(el('span', 'event__value' + (muted ? ' event__value--muted' : ''), value));
    parent.appendChild(r);
    return r;
  }

  function renderDetails() {
    var T = CFG.text;
    var C = CFG.couple;
    var iso = CFG.wedding.date;
    var cal = { groom: C.groom, bride: C.bride, timeZone: CFG.wedding.timeZone || 'Asia/Kolkata' };

    var dateEl = $('#date');
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || '');
    if (m) {
      dateEl.appendChild(el('span', 'date__num', m[3] + '.' + m[2] + '.' + m[1]));
      if (Cal) { dateEl.appendChild(el('span', 'date__day', Cal.formatDate(iso).split(',')[0])); }
    }

    var wrap = $('#events');
    CFG.events.forEach(function (ev) {
      if (!(ev.date || ev.venueName || ev.address || ev.startTime)) {
        var q = el('p', 'event event--quiet reveal');
        q.appendChild(el('strong', '', ev.title));
        q.appendChild(document.createTextNode(' \u00b7 ' + T.toFollow.toLowerCase()));
        wrap.appendChild(q);
        return;
      }
      var a = el('article', 'event reveal');
      a.appendChild(el('h2', 'event__title', ev.title));
      if (ev.titleLocal) {
        var l = el('p', 'event__local', ev.titleLocal);
        l.lang = 'kn';
        a.appendChild(l);
      }
      if (Cal && ev.date && ev.date !== iso) { row(a, 'Date', Cal.formatDate(ev.date)); }

      var time = Cal ? Cal.formatTimeRange(ev.startTime, ev.endTime) : '';
      row(a, T.labels.time, time || T.toFollow, !time);

      var vr = el('p', 'event__row');
      vr.appendChild(el('span', 'event__label', T.labels.venue));
      if (ev.venueName || ev.address) {
        if (ev.venueName) { vr.appendChild(el('span', 'event__value', ev.venueName)); }
        if (ev.address) { vr.appendChild(el('span', 'event__value', ev.address)); }
      } else {
        vr.appendChild(el('span', 'event__value event__value--muted', T.toFollow));
      }
      a.appendChild(vr);

      var btns = el('div', 'btns');
      if (/^https?:\/\//i.test(ev.mapUrl || '')) {
        var map = el('a', 'btn', T.labels.map);
        map.href = ev.mapUrl;
        map.target = '_blank';
        map.rel = 'noopener';
        btns.appendChild(map);
      }
      if (Cal && Cal.hasDate(ev)) {
        var g = el('a', 'btn', T.labels.google);
        g.href = Cal.googleUrl(ev, cal);
        g.target = '_blank';
        g.rel = 'noopener';
        btns.appendChild(g);
        var ics = el('button', 'btn', T.labels.ics);
        ics.type = 'button';
        ics.addEventListener('click', function () { Cal.download(ev, cal); });
        btns.appendChild(ics);
      }
      if (btns.childNodes.length) { a.appendChild(btns); }
      wrap.appendChild(a);
    });

    var closing = $('#closing');
    closing.appendChild(document.createTextNode(T.closing));
    closing.appendChild(el('span', 'closing__names', C.groom + ' & ' + C.bride));

    var items = document.querySelectorAll('.reveal, .art');
    if ('IntersectionObserver' in window && !still) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
        });
      }, { threshold: 0.2 });
      Array.prototype.forEach.call(items, function (n) { io.observe(n); });
    } else {
      Array.prototype.forEach.call(items, function (n) { n.classList.add('is-in'); });
    }
  }

  /* ---------- South Indian ornaments, drawn in code ---------- */
  // A rangoli (kolam) that turns slowly behind the hands.
  function buildMandala() {
    var S = 1024;
    var c = document.createElement('canvas');
    c.width = c.height = S;
    var g = c.getContext('2d');
    g.translate(S / 2, S / 2);
    g.lineCap = 'round';
    g.lineJoin = 'round';
    var gold = 'rgba(184, 136, 44, 0.85)';
    var soft = 'rgba(184, 136, 44, 0.45)';
    var blush = 'rgba(228, 130, 156, 0.16)';
    var mint = 'rgba(120, 190, 160, 0.16)';

    function dots(n, r, size, fill) {
      g.fillStyle = fill;
      for (var i = 0; i < n; i++) {
        var a = (i / n) * Math.PI * 2;
        g.beginPath();
        g.arc(Math.cos(a) * r, Math.sin(a) * r, size, 0, Math.PI * 2);
        g.fill();
      }
    }
    function petals(n, r0, r1, w, fill, lw, off) {
      for (var i = 0; i < n; i++) {
        g.save();
        g.rotate((i / n) * Math.PI * 2 + (off || 0));
        g.beginPath();
        g.moveTo(0, -r0);
        g.bezierCurveTo(w, -(r0 + (r1 - r0) * 0.3), w * 0.85, -(r0 + (r1 - r0) * 0.8), 0, -r1);
        g.bezierCurveTo(-w * 0.85, -(r0 + (r1 - r0) * 0.8), -w, -(r0 + (r1 - r0) * 0.3), 0, -r0);
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
    // scalloped border
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
    petals(32, 340, 430, 24, mint, 2, 0);
    petals(24, 270, 398, 38, blush, 2.4, 0.06);
    petals(16, 190, 330, 52, mint, 2.4, 0);
    petals(12, 110, 250, 58, blush, 2.4, 0.1);
    petals(8, 40, 160, 50, mint, 2.4, 0);
    // looping kolam circles
    g.strokeStyle = soft;
    g.lineWidth = 2.2;
    for (var k = 0; k < 8; k++) {
      var a = (k / 8) * Math.PI * 2;
      g.beginPath();
      g.arc(Math.cos(a) * 86, Math.sin(a) * 86, 64, 0, Math.PI * 2);
      g.stroke();
    }
    dots(8, 150, 5, gold);
    g.fillStyle = gold;
    g.beginPath();
    g.arc(0, 0, 14, 0, Math.PI * 2);
    g.fill();
    $('#mandala').src = c.toDataURL('image/png');
  }

  // Three temple towers (gopurams) in pale mist.
  function buildGopuram() {
    function tower(cx, base, w, tiers, th, fill) {
      var s = '';
      for (var t = 0; t < tiers; t++) {
        var tw = w * (1 - t * 0.1);
        var nw = w * (1 - (t + 1) * 0.1);
        var y0 = base - t * th;
        var y1 = y0 - th;
        s += '<path d="M' + (cx - tw / 2) + ' ' + y0 + ' L' + (cx - nw / 2) + ' ' + y1 + ' L' + (cx + nw / 2) + ' ' + y1 + ' L' + (cx + tw / 2) + ' ' + y0 + 'Z" fill="' + fill + '"/>';
        s += '<rect x="' + (cx - nw / 2 - 5) + '" y="' + (y1 - 2) + '" width="' + (nw + 10) + '" height="5" rx="2.5" fill="' + fill + '"/>';
      }
      var top = base - tiers * th;
      s += '<path d="M' + (cx - w * 0.2) + ' ' + top + ' Q' + cx + ' ' + (top - th * 1.8) + ' ' + (cx + w * 0.2) + ' ' + top + 'Z" fill="' + fill + '"/>';
      s += '<ellipse cx="' + cx + '" cy="' + (top - th * 1.9) + '" rx="4" ry="7" fill="' + fill + '"/>';
      return s;
    }
    var svg = '<svg viewBox="0 0 1200 300" preserveAspectRatio="xMidYMax slice" xmlns="http://www.w3.org/2000/svg">' +
      '<defs><linearGradient id="gp-mist" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#fff" stop-opacity="0.85"/></linearGradient></defs>' +
      '<g opacity="0.7">' + tower(190, 300, 150, 7, 24, '#cfe8da') + tower(1010, 300, 190, 8, 24, '#cfe8da') + '</g>' +
      '<g opacity="0.78">' + tower(600, 300, 270, 9, 26, '#f4d4db') + tower(420, 300, 120, 5, 22, '#f9e1c9') + tower(790, 300, 130, 6, 22, '#f9e1c9') + '</g>' +
      '<rect x="0" y="150" width="1200" height="150" fill="url(#gp-mist)"/></svg>';
    $('#gopuram').innerHTML = svg;
  }

  /* ---------- layout: where everything sits ---------- */
  var L = {};
  function computeLayout() {
    var W = stage.clientWidth;
    var H = stage.clientHeight;
    var portrait = H / W >= 1.05;
    var ART = window.Hands.ART;

    // the emblem sits at the top; the hands are centred in the space below it
    var eH = portrait ? clamp(H * 0.16, 110, 150) : clamp(H * 0.19, 100, 186);
    var eW = eH * EMBLEM_RATIO;
    var eY = H * (portrait ? 0.05 : 0.045);

    // as large as the height allows, and long enough that both arms run past the screen edges
    var cx = W / 2;
    var kH = (H * (portrait ? 0.34 : 0.4)) / ART.bride.h;
    var kFill = Math.max(cx / ART.groom.px, (W - cx) / (ART.bride.w - ART.bride.px));
    var k = Math.min(Math.max(kH, kFill), (H * 0.44) / ART.bride.h);
    var zoneTop = eY + eH + H * 0.03;
    var zoneBottom = H * 0.9;
    var cy = (zoneTop + zoneBottom) / 2 + 30 * k; // where the fingertips meet

    L = {
      W: W,
      H: H,
      eW: eW,
      eH: eH,
      eY: eY,
      cx: cx,
      cy: cy,
      k: k,
      gateW: Math.min(W * 0.7, H * 0.4, 460), // width of the heart on the drawing screen
      endW: eW * 0.92, // the heart shrinks to the size of the emblem
      endY: eY + eH * 0.5
    };
  }

  /* ---------- 3D heart (or the flat fallback), hands and petals ---------- */
  var scene3d = null;
  if (window.Scene3D && window.Scene3D.supported() && !/[?&]flat\b/.test(window.location.search)) {
    try { scene3d = window.Scene3D.create(sceneCanvas, { heartPoints: window.HeartGate.Heart.points }); } catch (err) { scene3d = null; }
  }
  if (!scene3d) {
    sceneCanvas.hidden = true;
    heartSvg.removeAttribute('hidden');
  }
  var hands = window.Hands.create(handsCanvas, function () { dirty = true; if (still) { drawStill(); } });
  var cascade = window.Cascade.create(cascadeCanvas, {
    still: still,
    petalSrc: 'assets/hands/petals.webp',
    petalFrames: [[0, 0, 105, 87], [105, 0, 71, 85], [176, 0, 91, 68], [267, 0, 86, 92]]
  });

  function applyLayout() {
    root.style.setProperty('--heart-w', (L.gateW * 1.16).toFixed(1) + 'px');
    root.style.setProperty('--e-w', L.eW.toFixed(1) + 'px');
    root.style.setProperty('--e-h', L.eH.toFixed(1) + 'px');
    root.style.setProperty('--e-y', L.eY.toFixed(1) + 'px');
    root.style.setProperty('--m-y', L.cy.toFixed(1) + 'px');
    root.style.setProperty('--m-size', clamp(Math.max(L.W * 1.3, L.H * 0.75), 420, 1500).toFixed(0) + 'px');
    if (scene3d) { scene3d.resize(L.W, L.H); }
    hands.resize(L.W, L.H, { cx: L.cx, cy: L.cy, k: L.k });
    cascade.resize(L.W, L.H);
  }

  /* ---------- the story, driven by scroll ---------- */
  var S = { reach: 0, join: 0 };
  var storyOn = false;
  var heartOn = false;
  var running = false;
  var stageVisible = true;
  var dirty = true;
  var lastP = 0;
  var lastRaw = 0;
  var emblemOn = false;
  var chimed = false;
  var whooshed = false;
  var pouring = false;
  var raf = 0;
  var lastT = 0;
  var lastGl = 0;
  var lastMove = 0;
  var heartA = 1; // how visible the heart is; it fades out as the emblem appears
  var stageAlive = 1; // 1 while the hands are on screen, 0 once the stage has scrolled away
  var heartS = { show: false, x: 0, y: 0, size: 0, glow: 0, alpha: 1 };

  function setHeart(p, glow) {
    var hp = ease(range(p, 0, 0.1));
    heartS.show = heartOn;
    heartS.x = L.W / 2;
    heartS.y = lerp(L.H / 2, L.endY, hp);
    heartS.size = lerp(L.gateW, L.endW, hp);
    heartS.glow = glow;
    if (scene3d) {
      scene3d.set({ heart: heartS });
    } else {
      var hs = lerp(1, L.endW / L.gateW, hp);
      heartSvg.style.setProperty('--hy', ((L.endY - L.H / 2) * hp).toFixed(1) + 'px');
      heartSvg.style.setProperty('--hs', hs.toFixed(4));
      heartSvg.style.setProperty('--sw', (2.6 / (L.gateW * hs)).toFixed(5));
      heartSvg.style.setProperty('--glow', (0.25 + 0.75 * glow).toFixed(3));
    }
  }

  function setHeartAlpha(a) {
    heartA = a;
    heartS.alpha = a;
    if (scene3d) { scene3d.set({ heart: heartS }); } else { heartSvg.style.setProperty('--ho', a.toFixed(3)); }
  }

  function frame(p) {
    lastP = p;
    lastMove = performance.now();
    var glow = ease(range(p, 0.05, 0.2));
    S.reach = range(p, 0.14, 0.52);
    S.join = ease(range(p, 0.5, 0.6));
    setHeart(p, glow);

    // the emblem appears as the heart settles into it
    var wantOn = emblemOn ? p > 0.05 : p > 0.09;
    if (wantOn !== emblemOn) {
      emblemOn = wantOn;
      emblem.classList.toggle('is-on', emblemOn);
      if (emblemOn && storyOn) { window.Sound.chime('bell'); }
    }

    stage.style.setProperty('--cue-o', storyOn && p < 0.03 ? '1' : '0');
    window.Sound.setIntensity(ease(range(p, 0.2, 0.7)));
    if (storyOn && S.reach > 0.04 && !whooshed) { whooshed = true; window.Sound.whoosh(); }
    if (S.reach < 0.01) { whooshed = false; }
    if (S.join > 0.5 && !chimed) { chimed = true; window.Sound.chime('hold'); }
    if (S.join < 0.2) { chimed = false; }
    pouring = S.join > 0.8;
    dirty = true;
  }

  // Things that depend on how far the page has scrolled (not only on the story)
  var lastVars = {};
  function setVar(name, val) {
    if (lastVars[name] !== val) {
      lastVars[name] = val;
      root.style.setProperty(name, val);
    }
  }
  function pageEffects() {
    var sr = stage.getBoundingClientRect();
    var away = clamp((L.H - sr.bottom) / (L.H * 0.8), 0, 1); // 0 while the story is pinned, 1 once it has scrolled away
    var gone = ease(away);
    setVar('--paper-o', gone.toFixed(3));
    stageAlive = 1 - ease(clamp(away * 1.6, 0, 1));
    setVar('--stage-o', stageAlive.toFixed(3));
    var keep = 1 - gone;
    setVar('--m-o', (0.3 * ease(range(lastP, 0.12, 0.6)) * keep).toFixed(3));
    setVar('--g-o', (ease(range(lastP, 0.3, 0.8)) * keep).toFixed(3));
    // 0 as the names arrive, 1 as they leave: the Ganesha pictures drift a little slower than the words
    var dr = details.getBoundingClientRect();
    setVar('--dp', clamp((L.H - dr.top) / (L.H + dr.height), 0, 1).toFixed(3));
    return sr;
  }

  function pathFor(sr) {
    var a = hands.anchor();
    var nr = namesEl.getBoundingClientRect();
    cascade.setPath(sr.left + a.x, sr.top + a.y, nr.left + nr.width / 2, nr.top - 6);
    return sr.top + a.y;
  }

  function drawStill() {
    hands.render({ reach: 1, join: 1, t: 0 });
    setHeartAlpha(emblemOn ? 0 : 1);
    var sr = pageEffects();
    pathFor(sr);
    if (petalsOn) { cascade.fillStill(); }
    cascade.redraw();
    if (scene3d) { scene3d.render(); }
  }

  function tick(now) {
    raf = 0;
    if (!running || document.hidden) { return; }
    var dt = Math.min(0.05, (now - lastT) / 1000 || 0.016);
    lastT = now;

    var sr = pageEffects();
    if (stageVisible) { hands.render({ reach: S.reach, join: S.join, t: now }); }

    pathFor(sr);
    cascade.setAmount(pouring && storyOn && petalsOn ? stageAlive : 0);
    if (cascade.active()) { cascade.step(dt); }

    // the heart gives way to the emblem; it turns slowly, drawn every frame while things move, otherwise every other frame
    var target = emblemOn ? 0 : 1;
    if (Math.abs(heartA - target) > 0.002) {
      setHeartAlpha(heartA + (target - heartA) * Math.min(1, dt * 3.4));
      lastMove = now;
    }
    if (scene3d && heartOn) {
      var moving = now - lastMove < 500;
      if (moving || now - lastGl > 30) { scene3d.render(); lastGl = now; }
    }
    raf = window.requestAnimationFrame(tick);
  }

  function start() {
    if (still || running) { return; }
    running = true;
    lastT = performance.now();
    if (!raf) { raf = window.requestAnimationFrame(tick); }
  }

  var scroller = window.StoryScroll.create({
    story: story,
    stage: stage,
    still: still,
    onFrame: function (p) {
      frame(still ? 1 : p);
      if (still) { drawStill(); }
    }
  });
  if (still) { window.addEventListener('scroll', function () { var sr = pageEffects(); pathFor(sr); cascade.redraw(); }, { passive: true }); }

  /* ---------- sound: starts with the first touch ---------- */
  window.Sound.init(CFG.music, $('#sound'));
  var gestures = ['pointerdown', 'pointerup', 'touchend', 'click', 'keydown'];
  function onGesture(e) {
    if (e.target && e.target.closest && e.target.closest('#sound')) { return; }
    window.Sound.unlock();
    if (window.Sound.isRunning()) { gestures.forEach(function (n) { document.removeEventListener(n, onGesture, true); }); }
  }
  gestures.forEach(function (n) { document.addEventListener(n, onGesture, { capture: true, passive: true }); });

  /* ---------- the drawing screen ---------- */
  var entered = false;
  function unlockStory() {
    body.classList.remove('is-gate');
    body.classList.add('is-story');
    story.removeAttribute('inert');
    details.removeAttribute('inert');
    storyOn = true;
    scroller.measure();
  }

  function enterStory() {
    if (entered) { return; }
    entered = true;
    heartOn = true;
    if (scene3d) {
      if (!still) { scene3d.bloom(); }
      frame(lastP);
      scene3d.render();
    } else {
      heartSvg.classList.add('is-bloom');
    }
    start();
    window.Sound.chime('heart');
    window.setTimeout(unlockStory, still ? 250 : 2000);
  }

  function relayout() {
    computeLayout();
    applyLayout();
    scroller.measure();
    frame(still ? 1 : scroller.progress());
    if (still) { drawStill(); }
  }

  applyText();
  renderDetails();
  buildMandala();
  buildGopuram();
  computeLayout();
  applyLayout();
  frame(still ? 1 : 0);
  if (scene3d) { scene3d.render(); } // warms up the 3D engine while the guest is still drawing

  var gate = window.HeartGate.create({
    canvas: drawCanvas,
    gate: $('#gate'),
    hint: $('#gate-hint'),
    auto: $('#gate-auto'),
    text: CFG.text.gate,
    reduced: still,
    layout: function () {
      computeLayout();
      return { cx: drawCanvas.clientWidth / 2, cy: drawCanvas.clientHeight / 2, w: L.gateW };
    },
    onSuccess: enterStory
  });

  var resizeTimer = 0;
  window.addEventListener('resize', function () {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(relayout, 160);
  });
  document.addEventListener('visibilitychange', function () {
    if (!document.hidden && running && !raf) { lastT = performance.now(); raf = window.requestAnimationFrame(tick); }
  });
  if (document.fonts && document.fonts.ready) { document.fonts.ready.then(function () { scroller.measure(); }); }
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) { stageVisible = entries[0].isIntersecting; }).observe(stage);
  }
  if (still) { drawStill(); }

  // For testing: add ?debug to the address to jump around, or ?flat to try the flat heart.
  if (/[?&]debug\b/.test(window.location.search)) {
    window.__heart = {
      gate: gate,
      sound: window.Sound,
      mode: scene3d ? '3d' : '2d',
      skipGate: function () {
        entered = true;
        heartOn = true;
        if (!scene3d) { heartSvg.classList.add('is-bloom'); }
        $('#gate').classList.add('is-done');
        unlockStory();
        start();
      },
      setProgress: function (p) { scroller.jump(p); },
      progress: function () { return lastP; },
      layout: function () { return L; }
    };
  }
})();
