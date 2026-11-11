/* ============================================================================
   Music.
   Your own song: put the file in assets/audio and write its path in config.js
   (music.src). Until it exists, a soft tune generated in the browser plays so
   the round button still works (turn that off with music.ambientIfMissing: false).
   Browsers only allow sound after a touch or click, so it starts with the guest's
   first touch (drawing the heart) and the round button turns it off and on.
   ========================================================================== */
(function () {
  'use strict';

  var cfg = { enabled: true, src: '', volume: 0.45, autoStart: true, ambient: true };
  var labels = { turnOn: 'Turn music on', turnOff: 'Turn music off' };
  var button = null;

  var ctx = null;
  var master, fx, padFilter;
  var timer = 0;
  var on = false; // sound is playing (or fading in)
  var userOff = false; // the guest turned it off
  var nextChord = 0;
  var nextStrum = 0;
  var nextPluck = 0;
  var noteIdx = 4;

  var fileEl = null;
  var fileState = 'none'; // none | loading | ready | failed
  var usingFile = false;
  var fadeRaf = 0;
  var canFade = true; // iPhones ignore audio.volume

  // A tanpura-style drone on D (Sa) and A (Pa), with a veena-like melody in raga Hamsadhwani
  // (D E F# A C#). MIDI note numbers.
  var STRINGS = [45, 50, 50, 38];
  var STRUM_LEN = 6.2;
  var DRONE = [38, 45, 50, 57, 62];
  var SCALE = [62, 64, 66, 69, 73, 74, 76, 78, 81, 85, 86];

  function mtof(m) { return 440 * Math.pow(2, (m - 69) / 12); }

  /* ---------- generated soundtrack ---------- */

  function impulse(seconds, decay) {
    var rate = ctx.sampleRate;
    var len = Math.floor(rate * seconds);
    var buf = ctx.createBuffer(2, len, rate);
    for (var c = 0; c < 2; c++) {
      var d = buf.getChannelData(c);
      for (var i = 0; i < len; i++) { d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay); }
    }
    return buf;
  }

  function ensureContext() {
    if (ctx) { return true; }
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) { return false; }
    try {
      // iPhones mute Web Audio when the silent switch is on, unless the session is "playback".
      if (navigator.audioSession) { navigator.audioSession.type = 'playback'; }
    } catch (e) { /* not supported */ }

    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0;
    var comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -22;
    comp.knee.value = 20;
    comp.ratio.value = 3;
    comp.attack.value = 0.02;
    comp.release.value = 0.35;

    fx = ctx.createGain();
    padFilter = ctx.createBiquadFilter();
    padFilter.type = 'lowpass';
    padFilter.frequency.value = 1500;
    padFilter.Q.value = 0.3;

    var dry = ctx.createGain();
    dry.gain.value = 0.75;
    var conv = ctx.createConvolver();
    conv.buffer = impulse(3.6, 2.4);
    var tone = ctx.createBiquadFilter();
    tone.type = 'lowpass';
    tone.frequency.value = 3200;
    var wet = ctx.createGain();
    wet.gain.value = 0.5;

    padFilter.connect(fx);
    fx.connect(dry);
    fx.connect(conv);
    conv.connect(tone);
    tone.connect(wet);
    dry.connect(comp);
    wet.connect(comp);
    comp.connect(master);
    master.connect(ctx.destination);

    // The pad's brightness drifts slowly on its own.
    var lfo = ctx.createOscillator();
    var lfoGain = ctx.createGain();
    lfo.frequency.value = 0.045;
    lfoGain.gain.value = 240;
    lfo.connect(lfoGain);
    lfoGain.connect(padFilter.frequency);
    lfo.start();
    return true;
  }

  function padNote(midi, t0, dur, level) {
    var f = mtof(midi);
    var g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.linearRampToValueAtTime(level, t0 + 3.4);
    g.gain.setValueAtTime(level, t0 + dur);
    g.gain.linearRampToValueAtTime(0.0001, t0 + dur + 4.2);
    g.connect(padFilter);
    [['sine', -5], ['triangle', 6]].forEach(function (v) {
      var o = ctx.createOscillator();
      o.type = v[0];
      o.frequency.value = f;
      o.detune.value = v[1];
      o.connect(g);
      o.start(t0);
      o.stop(t0 + dur + 4.4);
    });
  }

  // A soft bell: a pure tone with two faint overtones, sent through the reverb.
  function bell(freq, t, level, ring, pan) {
    var g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(level, t + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, t + ring);
    var out = g;
    if (ctx.createStereoPanner) {
      var p = ctx.createStereoPanner();
      p.pan.value = pan || 0;
      g.connect(p);
      out = p;
    }
    out.connect(fx);
    [[1, 1], [2.01, 0.26], [3.97, 0.08]].forEach(function (part) {
      var o = ctx.createOscillator();
      o.type = 'sine';
      o.frequency.value = freq * part[0];
      var og = ctx.createGain();
      og.gain.value = part[1];
      o.connect(og);
      og.connect(g);
      o.start(t);
      o.stop(t + ring + 0.1);
    });
  }

  // One tanpura strum: four buzzing strings, plucked one after another.
  function strum(t0) {
    STRINGS.forEach(function (m, i) {
      var t = t0 + i * 0.24;
      var f = mtof(m);
      var g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(m < 45 ? 0.06 : 0.05, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 5.8);
      var lp = ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.Q.value = 2.2;
      lp.frequency.setValueAtTime(2800, t);
      lp.frequency.exponentialRampToValueAtTime(650, t + 3.2);
      lp.connect(g);
      g.connect(fx);
      [-4, 4].forEach(function (cents) {
        var o = ctx.createOscillator();
        o.type = 'sawtooth';
        o.frequency.value = f;
        o.detune.value = cents;
        o.connect(lp);
        o.start(t);
        o.stop(t + 6);
      });
    });
  }

  // A plucked string with a small slide up into the note, like a veena.
  function veena(freq, t, level, pan) {
    var g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(level, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 2.6);
    var lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 3600;
    lp.Q.value = 0.5;
    lp.connect(g);
    if (ctx.createStereoPanner) {
      var p = ctx.createStereoPanner();
      p.pan.value = pan;
      g.connect(p);
      p.connect(fx);
    } else {
      g.connect(fx);
    }
    [['triangle', 1, 1], ['sine', 2, 0.32], ['sine', 3.01, 0.1]].forEach(function (v) {
      var o = ctx.createOscillator();
      o.type = v[0];
      o.frequency.setValueAtTime(freq * v[1] * 0.982, t);
      o.frequency.exponentialRampToValueAtTime(freq * v[1], t + 0.1);
      var og = ctx.createGain();
      og.gain.value = v[2];
      o.connect(og);
      og.connect(lp);
      o.start(t);
      o.stop(t + 2.8);
    });
  }

  function pluck(t) {
    if (Math.random() < 0.28) { return; } // rests keep it calm
    var step = [-2, -1, -1, 1, 1, 2][Math.floor(Math.random() * 6)];
    noteIdx = Math.max(0, Math.min(SCALE.length - 1, noteIdx + step));
    veena(mtof(SCALE[noteIdx]), t, 0.055 + Math.random() * 0.04, (Math.random() - 0.5) * 0.9);
  }

  function schedule() {
    if (!ctx || ctx.state !== 'running') { return; }
    var now = ctx.currentTime;
    while (nextChord < now + 3) {
      var t0 = Math.max(nextChord, now + 0.05);
      DRONE.forEach(function (m, i) { padNote(m, t0 + i * 0.35, 14, i === 0 ? 0.06 : 0.04); });
      nextChord = t0 + 16;
    }
    while (nextStrum < now + 2) {
      var ts = Math.max(nextStrum, now + 0.05);
      strum(ts);
      nextStrum = ts + STRUM_LEN;
    }
    while (nextPluck < now + 1.2) {
      pluck(Math.max(nextPluck, now + 0.05));
      nextPluck += 1.6 + Math.random() * 2.6;
    }
  }

  function playGenerated() {
    if (!ensureContext()) { return; }
    var go = function () {
      if (!on || ctx.state !== 'running') { return; }
      var now = ctx.currentTime;
      if (!timer) {
        nextChord = now + 0.1;
        nextStrum = now + 0.5;
        nextPluck = now + 2.6;
        timer = window.setInterval(schedule, 400);
      }
      schedule();
      master.gain.cancelScheduledValues(now);
      master.gain.setTargetAtTime(cfg.volume, now, 1.2);
    };
    var p = ctx.resume();
    if (p && p.then) { p.then(go, function () { /* needs a tap first */ }); } else { go(); }
  }

  /* ---------- your own audio file ---------- */

  function initFile() {
    if (!cfg.src) { return; }
    fileState = 'loading';
    var a = new Audio();
    a.preload = 'auto';
    a.loop = true;
    a.volume = 0;
    a.addEventListener('loadedmetadata', function () { if (fileState === 'loading') { fileState = 'ready'; } });
    a.addEventListener('error', function () {
      fileState = 'failed';
      if (usingFile) {
        usingFile = false;
        if (on && cfg.ambient) { playGenerated(); } else { on = false; paint(); }
      }
    });
    a.src = cfg.src;
    fileEl = a;
  }

  function fadeFile(target, ms, done) {
    window.cancelAnimationFrame(fadeRaf);
    if (!canFade) {
      if (done) { done(); }
      return;
    }
    var from = fileEl.volume;
    var t0 = performance.now();
    (function step(now) {
      var k = Math.min(1, (now - t0) / ms);
      try { fileEl.volume = from + (target - from) * k; } catch (e) { /* some phones fix the volume */ }
      if (k < 1) { fadeRaf = window.requestAnimationFrame(step); } else if (done) { done(); }
    })(t0);
  }

  function playFile() {
    usingFile = true;
    var p = fileEl.play();
    if (p && p.catch) { p.catch(function () { /* the error event decides about falling back */ }); }
    fadeFile(cfg.volume, 1800);
  }

  /* ---------- controls ---------- */

  function paint() {
    if (!button) { return; }
    button.classList.toggle('is-on', on);
    button.setAttribute('aria-pressed', on ? 'true' : 'false');
    button.setAttribute('aria-label', on ? labels.turnOff : labels.turnOn);
  }

  function start() {
    if (!cfg.enabled) { return; }
    userOff = false;
    if (fileEl && fileState !== 'failed') {
      on = true;
      playFile();
    } else if (cfg.ambient) {
      on = true;
      usingFile = false;
      playGenerated();
    } else {
      on = false;
    }
    if (button && on) { button.classList.remove('is-idle'); }
    paint();
  }

  function stop() {
    userOff = true;
    on = false;
    if (ctx) {
      var now = ctx.currentTime;
      master.gain.cancelScheduledValues(now);
      master.gain.setTargetAtTime(0, now, 0.15);
      window.setTimeout(function () { if (!on && ctx.state === 'running') { ctx.suspend(); } }, 800);
    }
    if (fileEl && usingFile) { fadeFile(0, 700, function () { if (!on) { fileEl.pause(); } }); }
    paint();
  }

  function toggle() { if (on) { stop(); } else { start(); } }

  // Called on the guest's first touches until sound is running (phones sometimes need a second tap).
  function unlock() {
    if (!cfg.enabled || !cfg.autoStart || userOff) { return; }
    if (!on) { start(); return; }
    if (usingFile) {
      if (fileEl.paused) { playFile(); }
    } else if (ctx && ctx.state !== 'running') {
      playGenerated();
    }
  }

  function isRunning() {
    if (!on) { return false; }
    return usingFile ? !!fileEl && !fileEl.paused : !!ctx && ctx.state === 'running';
  }

  function chime() {
    if (!on || usingFile || !ctx || ctx.state !== 'running') { return; }
    var t = ctx.currentTime + 0.03;
    bell(880, t, 0.11, 3.2, -0.15);
    bell(1318.51, t + 0.2, 0.09, 3.6, 0.15);
    bell(1760, t + 0.42, 0.05, 3.2, 0);
  }

  function init(music, btn, text) {
    cfg = {
      enabled: !music || music.enabled !== false,
      src: (music && music.src) || '',
      volume: music && typeof music.volume === 'number' ? Math.max(0, Math.min(1, music.volume)) : 0.45,
      autoStart: !music || music.autoStart !== false,
      ambient: !music || music.ambientIfMissing !== false
    };
    if (text) {
      labels.turnOn = text.turnOn || labels.turnOn;
      labels.turnOff = text.turnOff || labels.turnOff;
    }
    try {
      var probe = new Audio();
      probe.volume = 0.5;
      canFade = probe.volume === 0.5;
    } catch (e) { canFade = true; }

    button = btn || null;
    if (button) {
      if (!cfg.enabled) { button.hidden = true; }
      button.addEventListener('click', toggle);
    }
    initFile();

    document.addEventListener('visibilitychange', function () {
      if (!on) { return; }
      if (document.hidden) {
        if (usingFile) { fileEl.pause(); return; }
        if (ctx) {
          master.gain.setTargetAtTime(0, ctx.currentTime, 0.1);
          window.setTimeout(function () { if (document.hidden && ctx.state === 'running') { ctx.suspend(); } }, 400);
        }
      } else if (usingFile) {
        playFile();
      } else {
        playGenerated();
      }
    });
    paint();
  }

  window.Sound = {
    init: init,
    unlock: unlock,
    toggle: toggle,
    chime: chime,
    isOn: function () { return on; },
    isRunning: isRunning
  };
})();
