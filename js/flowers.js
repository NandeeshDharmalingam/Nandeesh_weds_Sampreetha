/* ============================================================================
   Falling flower shower
   - Light on purpose: a few capped petals, animated with CSS transform/opacity.
   - No per-frame JavaScript. A timer adds one petal at a time.
   - Petals never receive clicks, and the shower pauses when the page is hidden.
   - Skipped completely when the guest prefers reduced motion.
   Settings live in config.js -> flowerShower.
   ========================================================================== */
(function () {
  'use strict';

  var cfg = null;
  var layer = null;
  var types = [];
  var totalWeight = 0;
  var enabled = false;
  var paused = false;
  var lite = false;
  var live = 0;
  var timer = 0;
  var burstTimer = 0;
  var sectionLevel = 0;
  var burstLevel = 0;
  var reduceMq = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;

  function rand(min, max) { return min + Math.random() * (max - min); }
  function sign() { return Math.random() < 0.5 ? -1 : 1; }

  function levelValue(level) {
    if (typeof level === 'number') { return level; }
    var v = cfg.levels && cfg.levels[level];
    return typeof v === 'number' ? v : 0;
  }

  function deviceMax() {
    var w = window.innerWidth;
    var m = cfg.maxPetals || {};
    var n = w < 600 ? m.mobile : (w < 1024 ? m.tablet : m.desktop);
    if (typeof n !== 'number') { n = 12; }
    return lite ? Math.ceil(n * 0.6) : n;
  }

  function targetCount() { return deviceMax() * Math.max(sectionLevel, burstLevel) * cfg.intensity; }
  function hardCap() { return Math.ceil(deviceMax() * Math.max(1, cfg.intensity) * 1.6) + 2; }
  function meanFallSeconds() { return 12 / cfg.speed; }
  function ratePerSecond() { return targetCount() / meanFallSeconds(); }

  function pick() {
    var r = Math.random() * totalWeight;
    for (var i = 0; i < types.length; i++) {
      r -= types[i].weight;
      if (r <= 0) { return types[i]; }
    }
    return types[0];
  }

  function spawn() {
    if (!layer || live >= hardCap()) { return; }
    var t = pick();
    var scale = window.innerWidth < 600 ? 0.85 : 1;
    var el = document.createElement('span');
    var body = document.createElement('span');
    var sway = Math.random() < 0.6 ? rand(14, 46) : 0;

    el.className = 'petal';
    el.style.setProperty('--x', rand(-4, 104).toFixed(1) + 'vw');
    el.style.setProperty('--s', (rand(t.size[0], t.size[1]) * scale).toFixed(1) + 'px');
    el.style.setProperty('--dur', (rand(9, 15) / (cfg.speed * t.fall)).toFixed(2) + 's');
    el.style.setProperty('--dx', rand(-16, 16).toFixed(1) + 'vw');
    el.style.setProperty('--a', rand(0.65, 0.95).toFixed(2));

    body.className = 'petal__body petal__body--' + t.motion;
    body.style.backgroundImage = 'url("' + t.image + '")';
    body.style.setProperty('--spin', rand(3.5, 8).toFixed(2) + 's');
    body.style.setProperty('--r0', Math.round(rand(0, 360)) + 'deg');
    body.style.setProperty('--dir', String(sign()));
    body.style.setProperty('--ax', (rand(0.35, 1) * sign()).toFixed(2));
    body.style.setProperty('--ay', (rand(0.35, 1) * sign()).toFixed(2));

    if (sway) {
      var wrap = document.createElement('span');
      wrap.className = 'petal__sway';
      wrap.style.setProperty('--sw', sway.toFixed(0) + 'px');
      wrap.style.setProperty('--swd', rand(3, 6).toFixed(2) + 's');
      wrap.appendChild(body);
      el.appendChild(wrap);
    } else {
      el.appendChild(body);
    }

    layer.appendChild(el);
    live++;
  }

  function onAnimationEnd(e) {
    if (e.animationName !== 'petal-fall') { return; }
    if (e.target.parentNode === layer) {
      layer.removeChild(e.target);
      live = Math.max(0, live - 1);
    }
  }

  function tick() {
    timer = 0;
    if (!enabled || paused) { return; }
    if (ratePerSecond() > 0) { spawn(); }
    schedule();
  }

  function schedule() {
    if (timer || !enabled || paused) { return; }
    var rate = ratePerSecond();
    var mean = rate > 0 ? 1000 / rate : 1000;
    timer = window.setTimeout(tick, Math.max(120, mean * rand(0.55, 1.45)));
  }

  function poke() {
    window.clearTimeout(timer);
    timer = 0;
    schedule();
  }

  function clearLayer() {
    if (layer) { layer.textContent = ''; }
    live = 0;
  }

  function isActive() {
    if (!cfg || cfg.enabled === false || !(cfg.intensity > 0) || !types.length) { return false; }
    if (cfg.respectReducedMotion !== false && reduceMq && reduceMq.matches) { return false; }
    return true;
  }

  function sync() {
    var should = isActive();
    if (should && !enabled) {
      enabled = true;
      if (!layer) {
        layer = document.createElement('div');
        layer.className = 'petal-layer';
        layer.setAttribute('aria-hidden', 'true');
        layer.addEventListener('animationend', onAnimationEnd);
        document.body.appendChild(layer);
      }
      poke();
    } else if (!should && enabled) {
      enabled = false;
      window.clearTimeout(timer);
      timer = 0;
      clearLayer();
    }
  }

  function setPaused(value) {
    paused = value;
    if (layer) { layer.classList.toggle('is-paused', value); }
    if (value) {
      window.clearTimeout(timer);
      timer = 0;
    } else {
      poke();
    }
  }

  function setLevel(level) {
    if (!cfg) { return; }
    sectionLevel = levelValue(level);
    poke();
  }

  function burst(options) {
    if (!cfg || !enabled) { return; }
    var level = levelValue(options && options.level !== undefined ? options.level : 'festive');
    var duration = (options && options.durationMs) || 6000;
    var volley = Math.min(10, Math.round(deviceMax() * level * cfg.intensity * 0.35));

    burstLevel = Math.max(burstLevel, level);
    for (var i = 0; i < volley; i++) { window.setTimeout(spawn, i * 150 + rand(0, 120)); }
    window.clearTimeout(burstTimer);
    burstTimer = window.setTimeout(function () { burstLevel = 0; poke(); }, duration);
    poke();
  }

  function init(config) {
    cfg = {
      enabled: config.enabled !== false,
      intensity: typeof config.intensity === 'number' ? config.intensity : 1,
      speed: config.speed > 0 ? config.speed : 1,
      maxPetals: config.maxPetals || {},
      levels: config.levels || {},
      respectReducedMotion: config.respectReducedMotion,
      pauseWhenHidden: config.pauseWhenHidden !== false
    };

    var flowers = config.flowers || {};
    Object.keys(flowers).forEach(function (key) {
      var f = flowers[key];
      if (!f || f.enabled === false || !f.image) { return; }
      types.push({
        image: f.image,
        weight: f.weight > 0 ? f.weight : 1,
        size: f.size && f.size.length === 2 ? f.size : [14, 24],
        fall: f.fall > 0 ? f.fall : 1,
        motion: f.motion === 'spin' ? 'spin' : 'flutter'
      });
      totalWeight += f.weight > 0 ? f.weight : 1;
    });

    var nav = window.navigator || {};
    lite = !!((nav.connection && nav.connection.saveData) ||
      (nav.deviceMemory && nav.deviceMemory <= 2) ||
      (nav.hardwareConcurrency && nav.hardwareConcurrency <= 2));

    types.forEach(function (t) { var img = new Image(); img.src = t.image; });

    if (reduceMq) {
      if (reduceMq.addEventListener) { reduceMq.addEventListener('change', sync); }
      else if (reduceMq.addListener) { reduceMq.addListener(sync); }
    }
    document.addEventListener('visibilitychange', function () {
      if (cfg.pauseWhenHidden) { setPaused(document.hidden); }
    });
    window.addEventListener('resize', poke);

    sync();
  }

  window.WeddingFlowers = { init: init, setLevel: setLevel, burst: burst, isActive: function () { return enabled; } };
}());
