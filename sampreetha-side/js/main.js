/* ============================================================================
   Puts the pieces together.
   1. The guest draws a heart.  2. The heart rises and settles between the two
   names while the sky, the gopuram and the trees appear.  3. Scrolling lifts the
   temple doorway (the two events) over the gopuram.
   Everything the guest reads comes from config.js.
   ========================================================================== */
(function () {
  'use strict';

  var CFG = window.INVITE_CONFIG;
  var Cal = window.WeddingCalendar;
  if (!CFG) { return; }

  var root = document.documentElement;
  var body = document.body;
  var effects = CFG.effects || {};
  var reduced = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  var still = effects.animations === false || reduced;
  if (still) { root.classList.add('no-anim'); }
  var skip = /[?&]skip\b/.test(window.location.search);

  // index.html shows the 'both' version, reception.html the 'reception' version (see config.js).
  var VERSION = root.getAttribute('data-version') || 'both';
  var VERSIONS = CFG.versions || {};
  var V = VERSIONS[VERSION] || VERSIONS.both || { events: CFG.events.map(function (e) { return e.id; }), invite: '', title: 'Wedding Invitation' };

  function $(sel) { return document.querySelector(sel); }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function wait(ms) { return new Promise(function (resolve) { window.setTimeout(resolve, ms); }); }
  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) { n.className = cls; }
    if (text !== undefined) { n.textContent = text; }
    return n;
  }

  var hero = $('#hero');
  var tower = $('#tower');
  var slotHeart = $('#slot svg');
  var heartWrap = $('#heartwrap');
  var gateEl = $('#gate');
  var drawCanvas = $('#draw');
  var spacer = $('#spacer');
  var frame = $('#frame');
  var invite = $('#invite');

  if ('scrollRestoration' in window.history) { window.history.scrollRestoration = 'manual'; }
  window.scrollTo(0, 0);

  /* ---------- the words ---------- */
  function setLetters(target, word) {
    target.textContent = '';
    target.setAttribute('aria-hidden', 'true');
    Array.prototype.forEach.call(word, function (ch, i) {
      var s = el('span', 'ch', ch);
      s.style.setProperty('--i', String(i));
      target.appendChild(s);
    });
  }

  function dotted(iso) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || '');
    return m ? m[3] + ' \u00b7 ' + m[2] + ' \u00b7 ' + m[1] : '';
  }

  /* ---------- page 2: each name with its parents beneath ---------- */
  // "Smt. A & Sri. B" becomes two blocks that never split inside a name; the & stays at the end of the first line.
  function parentsLine(text) {
    var line = el('p', 'who__parents');
    var parts = String(text).split('&').map(function (s) { return s.trim(); }).filter(Boolean);
    parts.forEach(function (part, i) {
      if (i) { line.appendChild(document.createTextNode(' ')); }
      line.appendChild(el('span', 'who__unit', part + (i < parts.length - 1 ? '\u00a0&' : '')));
    });
    return line;
  }

  function who(name, family) {
    var box = el('div', 'who reveal');
    box.appendChild(el('h2', 'who__name', name));
    if (family && family.parents) {
      if (family.relation) { box.appendChild(el('p', 'who__relation', family.relation)); }
      box.appendChild(parentsLine(family.parents));
    }
    return box;
  }

  // The two people in the order they are shown: couple.first in config.js is 'groom' or 'bride'.
  function people() {
    var C = CFG.couple;
    var F = CFG.families || {};
    var g = { name: C.groom, family: F.groom };
    var b = { name: C.bride, family: F.bride };
    return C.first === 'bride' ? [b, g] : [g, b];
  }

  function renderCouple() {
    var P = people();
    var host = $('#couple');
    host.appendChild(who(P[0].name, P[0].family));
    var amp = el('p', 'couple__amp reveal', '&');
    amp.setAttribute('aria-hidden', 'true');
    host.appendChild(amp);
    host.appendChild(who(P[1].name, P[1].family));
  }

  function applyText() {
    var T = CFG.text;
    var P = people();
    document.title = P[0].name + ' & ' + P[1].name + ' | ' + (V.title || 'Wedding Invitation');

    $('#hg-shape').setAttribute('d', window.HeartGate.Heart.pathData());

    $('#names').setAttribute('aria-label', P[0].name + ' and ' + P[1].name);
    setLetters($('#groom'), P[0].name);
    setLetters($('#bride'), P[1].name);
    $('#line').textContent = T.hero.line || '';
    $('#date').textContent = dotted(CFG.wedding.date);
    $('#cue-text').textContent = T.hero.scroll || '';

    $('#gate-title').textContent = T.gate.title;
    $('#gate-auto').textContent = T.gate.auto;

    $('#ganesha').textContent = T.blessing || '';
    $('#lead').textContent = T.page2.lead || '';
    renderCouple();
    $('#invite-line').textContent = V.invite || '';
    $('#closing').textContent = T.page2.closing || '';
  }

  function iconRow(icon, build) {
    var row = el('div', 'event__row');
    var ic = el('span', 'event__icon');
    ic.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><use href="#ico-' + icon + '"/></svg>';
    row.appendChild(ic);
    var text = el('div', 'event__text');
    build(text);
    row.appendChild(text);
    return row;
  }

  function renderEvents() {
    var T = CFG.text;
    var P = people();
    var cal = { first: P[0].name, second: P[1].name, timeZone: (CFG.wedding && CFG.wedding.timeZone) || 'Asia/Kolkata' };
    var wrap = $('#events');

    var shown = [];
    (V.events || []).forEach(function (id) {
      CFG.events.forEach(function (ev) { if (ev.id === id) { shown.push(ev); } });
    });

    shown.forEach(function (ev, idx) {
      var card = el('article', 'event reveal');
      card.style.setProperty('--n', String(idx));
      card.appendChild(el('h3', 'event__title', ev.title));
      if (ev.titleLocal) {
        var local = el('p', 'event__local', ev.titleLocal);
        local.lang = 'kn';
        card.appendChild(local);
      }
      card.appendChild(el('i', 'event__rule'));

      var dateText = Cal && ev.date ? Cal.formatDate(ev.date) : '';
      card.appendChild(iconRow('date', function (t) {
        t.textContent = dateText || T.toFollow;
        if (!dateText) { t.classList.add('event__text--muted'); }
      }));

      var exactTime = Cal ? Cal.formatTimeRange(ev.startTime, ev.endTime) : '';
      var timeShown = exactTime || ev.timeText || '';
      card.appendChild(iconRow('time', function (t) {
        t.textContent = timeShown || T.toFollow;
        if (!timeShown) { t.classList.add('event__text--muted'); }
      }));

      card.appendChild(iconRow('place', function (t) {
        if (ev.venueName || ev.address) {
          if (ev.venueName) { t.appendChild(document.createTextNode(ev.venueName)); }
          if (ev.address) { t.appendChild(el('small', '', ev.address)); }
        } else {
          t.textContent = T.toFollow;
          t.classList.add('event__text--muted');
        }
      }));

      if (ev.note) { card.appendChild(el('p', 'event__note', ev.note)); }

      var btns = el('div', 'event__btns');
      if (/^https?:\/\//i.test(ev.mapUrl || '')) {
        var map = el('a', 'btn btn--solid', T.labels.map);
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
      if (btns.childNodes.length) { card.appendChild(btns); }
      wrap.appendChild(card);
    });
  }

  function observeReveals() {
    var items = document.querySelectorAll('.reveal');
    if ('IntersectionObserver' in window && !still) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
        });
      }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
      Array.prototype.forEach.call(items, function (n, i) {
        if (!n.style.getPropertyValue('--n')) { n.style.setProperty('--n', String(i % 3)); }
        io.observe(n);
      });
    } else {
      Array.prototype.forEach.call(items, function (n) { n.classList.add('is-in'); });
    }
  }

  /* ---------- page 2: the picture grows by whole pillar sections to fit the words ---------- */
  var FRAME = { top: 770, tile: 378, bottom: 522, textTop: 436, bottomMargin: 398 };
  var slack = 0; // spare cream space (px), shared out by the stylesheet: 30% above the events, 40% above the closing line
  function sizeFrame() {
    var fw = frame.offsetWidth;
    if (!fw) { return; }
    var u = fw / 1365;
    var need = FRAME.textTop * u + (invite.offsetHeight - slack * 0.7) + FRAME.bottomMargin * u + 10;
    var base = (FRAME.top + FRAME.bottom) * u;
    var n = Math.max(2, Math.ceil((need - base) / (FRAME.tile * u)));
    slack = Math.max(0, base + n * FRAME.tile * u - need);
    frame.style.setProperty('--n', String(n));
    invite.style.setProperty('--slack', slack.toFixed(1) + 'px');
  }

  /* ---------- page 1: one picture covers the screen; the gopuram sits just under the words and the trees start low ---------- */
  var CROWN = 163 / 2048; // where the top of the gopuram sits inside its picture
  var BRANCH = 0.22; // where the first branches start inside the trees picture
  function fitScene() {
    var w = hero.clientWidth;
    var h = hero.clientHeight;
    if (!w || !h) { return; }
    var sh = Math.max(h, Math.ceil(w * 2048 / 1355) + 2); // a tall screen scales the picture to its height, a wide one to its width
    var bottom = 0;
    ['#names', '#line', '#date'].forEach(function (sel) {
      var n = $(sel);
      if (n && n.offsetHeight) { bottom = Math.max(bottom, n.offsetTop + n.offsetHeight); }
    });
    hero.style.setProperty('--sh', sh + 'px');
    hero.style.setProperty('--ty', Math.round(Math.max(h - sh, bottom + 6 - sh * CROWN)) + 'px');
    hero.style.setProperty('--ly', Math.round(Math.max(h - sh, h * 0.62 - sh * BRANCH)) + 'px');
  }

  /* ---------- scrolling: the guest descends from the sky while page 2 rises over page 1 ---------- */
  var span = 1;
  var ticking = false;
  var lastP = -1;
  function measure() { span = Math.max(1, spacer.offsetHeight); }
  function update() {
    ticking = false;
    var p = still ? 0 : clamp(window.pageYOffset / span, 0, 1);
    if (Math.abs(p - lastP) < 0.0005) { return; }
    lastP = p;
    hero.style.setProperty('--p', p.toFixed(4));
    spacer.style.setProperty('--p', p.toFixed(4));
  }
  function onScroll() {
    if (!ticking) {
      ticking = true;
      window.requestAnimationFrame(update);
    }
  }
  window.addEventListener('scroll', onScroll, { passive: true });

  $('#cue').addEventListener('click', function (e) {
    e.preventDefault();
    window.scrollTo({ top: span, behavior: still ? 'auto' : 'smooth' });
  });

  /* ---------- music ---------- */
  window.Sound.init(CFG.music, $('#sound'), CFG.text.music);
  var gestures = ['pointerdown', 'pointerup', 'touchend', 'click', 'keydown'];
  function onGesture(e) {
    // a finger only counts when it lifts; a mouse counts when it presses
    if (e.type === 'pointerdown' && e.pointerType && e.pointerType !== 'mouse') { return; }
    if (e.target && e.target.closest && e.target.closest('#sound')) { return; }
    window.Sound.unlock();
    if (window.Sound.isRunning()) {
      gestures.forEach(function (n) { document.removeEventListener(n, onGesture, true); });
    }
  }
  gestures.forEach(function (n) { document.addEventListener(n, onGesture, { capture: true, passive: true }); });

  /* ---------- the opening ---------- */
  var opened = false;
  var landed = false;

  function fontsReady() {
    return document.fonts && document.fonts.ready ? document.fonts.ready.then(function () {}, function () {}) : Promise.resolve();
  }
  function decoded(img) {
    function dec() { return img.decode ? img.decode().then(function () {}, function () {}) : Promise.resolve(); }
    if (img.complete && img.naturalWidth) { return dec(); }
    return new Promise(function (resolve) {
      img.addEventListener('load', function () { dec().then(resolve); }, { once: true });
      img.addEventListener('error', resolve, { once: true });
    });
  }
  function artReady() {
    return Promise.all([fontsReady(), decoded(tower), decoded($('#img-clouds')), decoded($('#img-leaves'))]);
  }

  function gateLayout() {
    var W = drawCanvas.clientWidth;
    var H = drawCanvas.clientHeight;
    var size = Math.min(W * 0.7, H * 0.4, 440);
    root.style.setProperty('--hw', size.toFixed(1) + 'px');
    return { cx: W / 2, cy: H / 2, w: size };
  }

  function finish() {
    body.classList.add('is-done');
    body.classList.remove('is-gate', 'is-opening');
    gateEl.classList.add('is-gone');
    measure();
    update();
  }

  function land() {
    if (landed) { return; }
    landed = true;
    body.classList.add('is-landed');
    heartWrap.classList.add('is-out');
    window.setTimeout(function () { heartWrap.hidden = true; }, 500);
    window.setTimeout(finish, still ? 150 : 900);
  }

  function startOpen() {
    var hr = heartWrap.getBoundingClientRect();
    var sr = slotHeart.getBoundingClientRect();
    var dx = sr.left + sr.width / 2 - (hr.left + hr.width / 2);
    var dy = sr.top + sr.height / 2 - (hr.top + hr.height / 2);
    var s = hr.width ? sr.width / hr.width : 0.15;

    body.classList.add('is-open');
    window.setTimeout(function () { root.classList.remove('is-locked'); measure(); }, still ? 200 : 2200);

    if (still || !heartWrap.animate) {
      land();
      return;
    }
    var flight = heartWrap.animate(
      [
        { transform: 'translate3d(0, 0, 0) scale(1)' },
        { transform: 'translate3d(' + dx.toFixed(2) + 'px, ' + dy.toFixed(2) + 'px, 0) scale(' + s.toFixed(4) + ')' }
      ],
      { duration: 1500, easing: 'cubic-bezier(0.62, 0, 0.2, 1)', fill: 'forwards' }
    );
    if (flight.finished) { flight.finished.then(land, land); } else { flight.onfinish = land; }
    window.setTimeout(land, 3200);
  }

  function onSuccess(g) {
    if (opened) { return; }
    opened = true;
    var box = g.size * 1.16;
    heartWrap.hidden = false;
    heartWrap.style.left = (g.cx - box / 2).toFixed(2) + 'px';
    heartWrap.style.top = (g.cy - box / 2).toFixed(2) + 'px';
    heartWrap.style.width = box.toFixed(2) + 'px';
    heartWrap.style.height = box.toFixed(2) + 'px';
    root.style.setProperty('--sw', (4.4 / g.size).toFixed(5));
    heartWrap.classList.add('is-on');
    window.requestAnimationFrame(function () { heartWrap.classList.add('is-lit'); });
    body.classList.add('is-opening');
    window.Sound.chime();

    var settle = wait(still ? 120 : 1450);
    var ready = Promise.race([artReady(), wait(3500)]);
    Promise.all([settle, ready]).then(startOpen);
  }

  /* ---------- the clouds the guest passes through ---------- */
  // x, y: position (vw, vh); w: width (vmax); ix, iy: where it drifts in from; ox, oy: where it drifts to.
  var MIST = [
    { x: -26, y: 34, w: 120, ix: -28, iy: 4, ox: -44, oy: 24 },
    { x: 22, y: 44, w: 116, ix: 28, iy: 4, ox: 42, oy: 26 },
    { x: -24, y: -10, w: 118, ix: -26, iy: -8, ox: -40, oy: 18 },
    { x: 0, y: 62, w: 124, ix: 6, iy: 12, ox: 6, oy: 34 },
    { x: 24, y: -6, w: 114, ix: 28, iy: -8, ox: 44, oy: 16 },
    { x: -30, y: 58, w: 118, ix: -30, iy: 10, ox: -46, oy: 30 },
    { x: -2, y: 18, w: 112, ix: 0, iy: 0, ox: 4, oy: 22 }
  ];
  function buildMist() {
    var host = $('#mist');
    var lite = (navigator.deviceMemory && navigator.deviceMemory <= 2) || (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4);
    MIST.slice(0, lite ? 4 : MIST.length).forEach(function (m, i) {
      var c = window.Art.mist(640, 360, 31 + i * 17);
      c.style.setProperty('--x', m.x + 'vw');
      c.style.setProperty('--y', m.y + 'vh');
      c.style.setProperty('--w', m.w + 'vmax');
      c.style.setProperty('--ix', m.ix + 'vw');
      c.style.setProperty('--iy', m.iy + 'vh');
      c.style.setProperty('--ox', m.ox + 'vw');
      c.style.setProperty('--oy', m.oy + 'vh');
      c.style.setProperty('--k', String(i));
      host.appendChild(c);
    });
  }

  /* ---------- start ---------- */
  applyText();
  renderEvents();
  observeReveals();

  window.Art.stars($('#stars'), 46, 7);
  window.Art.mandala($('#mandala'), 900);
  buildMist();

  var gate = window.HeartGate.create({
    canvas: drawCanvas,
    gate: gateEl,
    hint: $('#gate-hint'),
    auto: $('#gate-auto'),
    text: CFG.text.gate,
    reduced: still,
    layout: gateLayout,
    onSuccess: onSuccess
  });

  measure();
  sizeFrame();
  fitScene();
  var resizeTimer = 0;
  window.addEventListener('resize', function () {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(function () {
      measure();
      sizeFrame();
      fitScene();
      update();
    }, 150);
  });
  if (document.fonts && document.fonts.ready) { document.fonts.ready.then(function () { sizeFrame(); fitScene(); measure(); }); }
  if ('ResizeObserver' in window) { new ResizeObserver(sizeFrame).observe(invite); }

  // Add ?skip to the address to go straight to the invitation (handy for checking page 2).
  if (skip) {
    opened = true;
    landed = true;
    body.classList.add('is-open', 'is-landed');
    heartWrap.hidden = true;
    root.classList.remove('is-locked');
    gateEl.classList.add('is-gone');
    finish();
  }
})();
