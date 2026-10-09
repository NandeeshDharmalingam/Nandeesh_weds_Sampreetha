/* ============================================================================
   Wedding music player + optional temple bell
   - Music never starts by itself: the guest taps "Play" (or "Enter with music").
   - Works without audio files: if a file is missing the player simply hides.
   - Two <audio> elements are used only to crossfade between tracks (when the
     device lets scripts change volume). Otherwise tracks switch one at a time.
   - The temple bell is a soft synthesized sound (Web Audio) or your own file.
   Settings live in config.js -> music, templeBell and text.music.
   ========================================================================== */
(function () {
  'use strict';

  var KEY = 'wedding-invite-music';
  var C = null;
  var BELL = null;
  var T = {};
  var $ = {};
  var avail = {};
  var probing = {};
  var waiting = [];
  var mainChecked = false;
  var elA = null;
  var elB = null;
  var cur = null;
  var volumeSupported = true;
  var panelOpen = false;
  var audioCtx = null;

  var state = {
    role: 'main',
    playing: false,
    off: false,
    muted: false,
    volume: 0.45,
    bell: false,
    started: false,
    openingDone: false,
    locked: false,
    prevRole: null,
    autoPaused: false
  };

  function clamp(v, min, max) { return Math.min(max, Math.max(min, v)); }
  function easeInOut(p) { return p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2; }

  // Waits until the page has finished loading so music checks never slow it down.
  function afterLoad(fn) {
    if (document.readyState === 'complete') { window.setTimeout(fn, 300); }
    else { window.addEventListener('load', function () { window.setTimeout(fn, 300); }); }
  }

  /* ----------------------------- remembering ----------------------------- */
  function persist() {
    if (!C || !C.rememberChoices) { return; }
    try {
      sessionStorage.setItem(KEY, JSON.stringify({
        role: state.role === 'opening' ? 'main' : state.role,
        volume: state.volume,
        muted: state.muted,
        off: state.off,
        bell: state.bell,
        locked: state.locked,
        openingDone: state.openingDone
      }));
    } catch (e) { /* storage unavailable: fine */ }
  }

  function restore() {
    if (!C.rememberChoices) { return; }
    try {
      var saved = JSON.parse(sessionStorage.getItem(KEY) || 'null');
      if (!saved) { return; }
      if (C.tracks[saved.role] && C.tracks[saved.role].src) { state.role = saved.role; }
      if (typeof saved.volume === 'number') { state.volume = clamp(saved.volume, 0, 1); }
      state.muted = !!saved.muted;
      state.bell = !!saved.bell;
      state.locked = !!saved.locked;
      state.openingDone = !!saved.openingDone;
    } catch (e) { /* ignore */ }
  }

  /* ------------------------------ audio basics --------------------------- */
  function makeAudio() {
    var a = new Audio();
    a.preload = 'none';
    a.loop = true;
    a.addEventListener('ended', function () {
      if (a === cur && a._role === 'opening') {
        state.openingDone = true;
        start('main');
      }
    });
    a.addEventListener('error', function () {
      if (a._role) { avail[a._role] = false; }
      if (a === cur && state.playing) {
        state.playing = false;
        render();
        say(T.unavailable);
      }
    });
    return a;
  }

  function load(a, role) {
    var src = C.tracks[role].src;
    a._role = role;
    a.loop = role !== 'opening';
    a.muted = state.muted;
    if (a.getAttribute('src') !== src) { a.src = src; }
  }

  function trackGain(role) {
    var g = C.tracks[role] && C.tracks[role].gain;
    return typeof g === 'number' ? g : 1;
  }

  function targetVolume(role) { return clamp(state.volume * trackGain(role), 0, 1); }
  function setVol(a, v) { if (volumeSupported) { a.volume = clamp(v, 0, 1); } }

  function cancelFade(a) {
    if (a._fade) { window.cancelAnimationFrame(a._fade); a._fade = 0; }
  }

  function fade(a, from, to, seconds, done) {
    cancelFade(a);
    if (!volumeSupported || !(seconds > 0)) {
      setVol(a, to);
      if (done) { done(); }
      return;
    }
    var t0 = window.performance.now();
    function step(now) {
      var p = Math.min(1, (now - t0) / (seconds * 1000));
      setVol(a, from + (to - from) * easeInOut(p));
      if (p < 1) { a._fade = window.requestAnimationFrame(step); }
      else { a._fade = 0; if (done) { done(); } }
    }
    a._fade = window.requestAnimationFrame(step);
  }

  /* ------------------------ is the audio file there? --------------------- */
  function probe(role) {
    var t = C.tracks[role];
    if (!t || !t.src) { return Promise.resolve(false); }
    if (avail[role] !== undefined) { return Promise.resolve(avail[role]); }
    if (probing[role]) { return probing[role]; }
    probing[role] = new Promise(function (resolve) {
      var a = new Audio();
      var done = false;
      function finish(ok) {
        if (done) { return; }
        done = true;
        avail[role] = ok;
        a.removeAttribute('src');
        a.load();
        resolve(ok);
      }
      a.preload = 'metadata';
      a.addEventListener('loadedmetadata', function () { finish(true); });
      a.addEventListener('error', function () { finish(false); });
      window.setTimeout(function () { finish(true); }, 7000);
      a.src = t.src;
    });
    return probing[role];
  }

  /* --------------------------------- playback ---------------------------- */
  function initialRole() {
    var opening = C.tracks.opening;
    if (opening && opening.src && avail.opening !== false && !state.openingDone && !state.locked) { return 'opening'; }
    return state.role === 'opening' ? 'main' : state.role;
  }

  function start(role) {
    if (state.playing && state.role === role) { return Promise.resolve(true); }
    return probe(role).then(function (ok) {
      if (!ok) {
        if (role === 'opening') { state.openingDone = true; return start('main'); }
        if (role !== 'main') { return false; }
        say(T.unavailable);
        return false;
      }
      var from = state.playing ? cur : null;
      var next = from ? (cur === elA ? elB : elA) : cur;
      var crossfade = !!from && volumeSupported && C.crossfadeSeconds > 0;
      if (from && !crossfade) { cancelFade(from); from.pause(); }

      load(next, role);
      cancelFade(next);
      setVol(next, 0);
      return Promise.resolve(next.play()).then(function () {
        fade(next, 0, targetVolume(role), crossfade ? C.crossfadeSeconds : 0.8);
        if (from && crossfade) {
          fade(from, from.volume, 0, C.crossfadeSeconds, function () { from.pause(); });
        }
        cur = next;
        state.role = role;
        state.playing = true;
        state.started = true;
        state.off = false;
        state.autoPaused = false;
        render();
        persist();
        return true;
      }, function () {
        if (from && !crossfade) { state.playing = false; }
        render();
        return false;
      });
    });
  }

  function pause(immediate) {
    if (!state.playing) { return; }
    var a = cur;
    state.playing = false;
    render();
    if (immediate) {
      cancelFade(a);
      a.pause();
    } else {
      fade(a, a.volume, 0, 0.5, function () { a.pause(); });
    }
    persist();
  }

  function resume() {
    if (state.playing || state.off) { return Promise.resolve(false); }
    if (!state.started) { return start(initialRole()); }
    var a = cur;
    cancelFade(a);
    setVol(a, 0);
    return Promise.resolve(a.play()).then(function () {
      fade(a, 0, targetVolume(state.role), 0.6);
      state.playing = true;
      state.autoPaused = false;
      render();
      return true;
    }, function () { render(); return false; });
  }

  function toggle() {
    if (state.playing) { pause(); return; }
    if (state.off) { state.off = false; start(initialRole()); return; }
    resume();
  }

  function turnOff() {
    pause(true);
    try { cur.currentTime = 0; } catch (e) { /* not loaded yet */ }
    state.off = true;
    state.started = false;
    state.locked = false;
    state.autoPaused = false;
    render();
    persist();
  }

  function startFromGesture() {
    if (!C || !C.enabled || !$.root) { return Promise.resolve(false); }
    state.off = false;
    return start(initialRole());
  }

  function onBlessing(entering) {
    if (!C.celebration || !state.playing || state.locked) { return; }
    if (entering && C.celebration.playAtFinalBlessing && state.role !== 'celebration') {
      probe('celebration').then(function (ok) {
        if (ok && state.playing && !state.locked && state.role !== 'celebration') {
          state.prevRole = state.role === 'opening' ? 'main' : state.role;
          start('celebration');
        }
      });
    } else if (!entering && C.celebration.returnToMainWhenLeaving && state.role === 'celebration') {
      start(state.prevRole && state.prevRole !== 'celebration' ? state.prevRole : 'main');
    }
  }

  /* --------------------------------- screen ------------------------------ */
  function say(message) {
    if ($.state && message) { $.state.textContent = message; }
  }

  function render() {
    if (!$.root) { return; }
    var playing = state.playing;
    var track = C.tracks[state.role] || C.tracks.main;

    $.root.classList.toggle('is-playing', playing);
    $.root.classList.toggle('is-off', state.off);
    $.toggle.setAttribute('aria-pressed', playing ? 'true' : 'false');
    $.icon.setAttribute('href', playing ? '#i-pause' : '#i-play');
    $.label.textContent = playing ? T.pause : T.play;
    $.state.textContent = playing ? T.playing : (state.off ? T.off : T.paused);
    $.title.textContent = track.title || '';
    $.artist.textContent = track.artist ? ' - ' + track.artist : '';
    $.mute.setAttribute('aria-pressed', state.muted ? 'true' : 'false');
    $.mute.setAttribute('aria-label', state.muted ? T.unmute : T.mute);
    $.muteIcon.setAttribute('href', state.muted ? '#i-mute' : '#i-volume');
    $.volume.value = String(Math.round(state.volume * 100));
    $.volume.setAttribute('aria-label', T.volume);
    $.off.textContent = state.off ? T.turnOn : T.turnOff;
    if ($.track && !$.trackRow.hidden) { $.track.value = state.role === 'opening' ? 'main' : state.role; }
    if ($.bell) { $.bell.checked = state.bell; }
  }

  function buildTrackSelect() {
    Promise.all(['main', 'alternate', 'celebration'].map(probe)).then(function (results) {
      var roles = ['main', 'alternate', 'celebration'].filter(function (r, i) { return results[i]; });
      if (roles.length < 2) { return; }
      $.track.textContent = '';
      roles.forEach(function (r) {
        var o = document.createElement('option');
        o.value = r;
        o.textContent = C.tracks[r].title || r;
        $.track.appendChild(o);
      });
      $.trackRow.hidden = false;
      render();
    });
  }

  function openPanel() {
    panelOpen = true;
    $.panel.hidden = false;
    $.more.setAttribute('aria-expanded', 'true');
    if ($.trackRow.hidden) { buildTrackSelect(); }
  }

  function closePanel() {
    panelOpen = false;
    $.panel.hidden = true;
    $.more.setAttribute('aria-expanded', 'false');
  }

  function revealControl() {
    if (!C || !C.enabled || !mainChecked || avail.main === false) { return; }
    $.root.hidden = false;
  }

  function whenAvailable(cb) {
    if (mainChecked && avail.main !== false) { cb(); } else if (!mainChecked) { waiting.push(cb); }
  }

  /* ------------------------------ temple bell ---------------------------- */
  function context() {
    if (!audioCtx) {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) { return null; }
      audioCtx = new AC();
    }
    if (audioCtx.state === 'suspended') { audioCtx.resume(); }
    return audioCtx;
  }

  // A soft bell built from a few decaying tones (no audio file needed).
  function synthBell(volume) {
    var ac = context();
    if (!ac) { return; }
    var now = ac.currentTime;
    var out = ac.createGain();
    var tone = ac.createBiquadFilter();
    out.gain.value = volume * 0.5;
    tone.type = 'lowpass';
    tone.frequency.value = 3600;
    tone.connect(out);
    out.connect(ac.destination);
    var base = 587.33;
    [[1, 1, 6.5], [2, 0.55, 4.8], [2.76, 0.38, 3.8], [4.07, 0.2, 2.6], [5.4, 0.14, 2], [8.93, 0.05, 1.2]].forEach(function (p) {
      [0, 1].forEach(function (pair) {
        var osc = ac.createOscillator();
        var env = ac.createGain();
        osc.type = 'sine';
        osc.frequency.value = base * p[0] + (pair ? 1.3 * p[0] : 0);
        env.gain.setValueAtTime(0, now);
        env.gain.linearRampToValueAtTime(p[1] * (pair ? 0.45 : 1) * 0.5, now + 0.008);
        env.gain.exponentialRampToValueAtTime(0.0001, now + p[2]);
        osc.connect(env);
        env.connect(tone);
        osc.start(now);
        osc.stop(now + p[2] + 0.1);
      });
    });
  }

  function bellVolume() {
    var ratio = state.volume / (C && C.volume ? C.volume : 0.45);
    return clamp((BELL.volume || 0.22) * clamp(ratio, 0.3, 1.2), 0, 1);
  }

  function ringBell() {
    if (!BELL || BELL.enabled === false || state.muted) { return; }
    var vol = bellVolume();
    if (!BELL.file) { synthBell(vol); return; }
    var fell = false;
    function fallback() { if (!fell) { fell = true; synthBell(vol); } }
    var a = new Audio(BELL.file);
    a.volume = vol;
    a.addEventListener('error', fallback);
    Promise.resolve(a.play()).catch(fallback);
  }

  function chime(kind) {
    if (!BELL || !state.bell) { return; }
    if (kind === 'enter' && BELL.chimeOnEnter === false) { return; }
    if (kind === 'blessing' && BELL.chimeAtBlessing === false) { return; }
    ringBell();
  }

  /* ---------------------------------- setup ------------------------------ */
  function bind() {
    $.toggle.addEventListener('click', toggle);
    $.more.addEventListener('click', function () { if (panelOpen) { closePanel(); } else { openPanel(); } });
    $.off.addEventListener('click', function () { if (state.off) { toggle(); } else { turnOff(); } });
    $.mute.addEventListener('click', function () {
      state.muted = !state.muted;
      elA.muted = state.muted;
      elB.muted = state.muted;
      render();
      persist();
    });
    $.volume.addEventListener('input', function () {
      state.volume = clamp(Number($.volume.value) / 100, 0, 1);
      if (state.playing) { cancelFade(cur); setVol(cur, targetVolume(state.role)); }
      persist();
    });
    $.track.addEventListener('change', function () {
      state.locked = true;
      persist();
      if (state.playing) { start($.track.value); } else { state.role = $.track.value; render(); persist(); }
    });
    $.bell.addEventListener('change', function () {
      state.bell = $.bell.checked;
      persist();
      if (state.bell) { ringBell(); }
    });
    document.addEventListener('pointerdown', function (e) {
      if (panelOpen && !$.root.contains(e.target)) { closePanel(); }
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && panelOpen) { closePanel(); $.more.focus(); }
    });
    document.addEventListener('visibilitychange', function () {
      if (!C.pauseWhenPageHidden) { return; }
      if (document.hidden) {
        if (state.playing) { state.autoPaused = true; pause(true); }
      } else if (state.autoPaused && !state.off) {
        state.autoPaused = false;
        resume();
      }
    });
  }

  function init(config) {
    C = config.music || { enabled: false };
    BELL = config.templeBell || { enabled: false };
    T = (config.text && config.text.music) || {};
    if (!C.enabled) { return; }

    C.tracks = C.tracks || {};
    ['opening', 'main', 'alternate', 'celebration'].forEach(function (r) { C.tracks[r] = C.tracks[r] || { src: '' }; });
    state.volume = clamp(typeof C.volume === 'number' ? C.volume : 0.45, 0, 1);
    restore();

    $ = {
      root: document.getElementById('music'),
      toggle: document.getElementById('music-toggle'),
      icon: document.getElementById('music-icon'),
      label: document.getElementById('music-label'),
      more: document.getElementById('music-more'),
      panel: document.getElementById('music-panel'),
      title: document.getElementById('music-track-title'),
      artist: document.getElementById('music-track-artist'),
      state: document.getElementById('music-state'),
      mute: document.getElementById('music-mute'),
      muteIcon: document.getElementById('music-mute-icon'),
      volume: document.getElementById('music-volume'),
      deviceVolume: document.getElementById('music-device-volume'),
      trackRow: document.getElementById('music-track-row'),
      trackLabel: document.getElementById('music-track-label'),
      track: document.getElementById('music-track'),
      bellRow: document.getElementById('bell-row'),
      bell: document.getElementById('bell-toggle'),
      bellLabel: document.getElementById('bell-label'),
      off: document.getElementById('music-off')
    };

    var probeAudio = new Audio();
    probeAudio.volume = 0.5;
    volumeSupported = probeAudio.volume === 0.5;

    elA = makeAudio();
    elB = makeAudio();
    cur = elA;
    elA.muted = state.muted;
    elB.muted = state.muted;

    $.trackLabel.textContent = T.track || 'Track';
    $.bellLabel.textContent = T.templeBell || 'Temple bell';
    $.bellRow.hidden = !(BELL && BELL.enabled !== false);
    if (!volumeSupported) {
      $.volume.hidden = true;
      $.deviceVolume.textContent = T.deviceVolume || '';
      $.deviceVolume.hidden = false;
    }

    bind();
    render();

    afterLoad(function () {
      probe('main').then(function (ok) {
        mainChecked = true;
        if (!ok) { return; }
        if (C.showControlInitially) { $.root.hidden = false; }
        waiting.splice(0).forEach(function (cb) { cb(); });
      });
    });
  }

  window.WeddingMusic = {
    init: init,
    whenAvailable: whenAvailable,
    revealControl: revealControl,
    startFromGesture: startFromGesture,
    onBlessing: onBlessing,
    ringBell: ringBell,
    chime: chime,
    isPlaying: function () { return state.playing; }
  };
}());
