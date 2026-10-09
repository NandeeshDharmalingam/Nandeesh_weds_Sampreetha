/* ============================================================================
   Wedding invitation: puts config.js onto the page and runs the experience
   (welcome screen, sections, flower shower, music, calendar buttons).
   You normally never need to edit this file. Use config.js instead.
   ========================================================================== */
(function () {
  'use strict';

  var CFG = window.WEDDING_CONFIG;
  var Flowers = window.WeddingFlowers;
  var Music = window.WeddingMusic;
  var Cal = window.WeddingCalendar;
  var reduceMq = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
  var SVG_NS = 'http://www.w3.org/2000/svg';

  function reduced() { return !!(reduceMq && reduceMq.matches) || !!(CFG && CFG.animations === false); }
  function byId(id) { return document.getElementById(id); }
  function all(selector, root) { return Array.prototype.slice.call((root || document).querySelectorAll(selector)); }
  function kebab(s) { return s.replace(/([A-Z])/g, '-$1').toLowerCase(); }
  function safeUrl(u) { return /^https?:\/\//i.test(u || '') ? u : ''; }
  function safe(fn) { try { fn(); } catch (e) { if (window.console) { window.console.error(e); } } }

  function get(path) {
    return path.split('.').reduce(function (o, k) { return o === null || o === undefined ? o : o[k]; }, CFG);
  }

  function fill(text) {
    return String(text).replace(/\{groom\}/g, CFG.couple.groom).replace(/\{bride\}/g, CFG.couple.bride);
  }

  function make(tag, className, text) {
    var el = document.createElement(tag);
    if (className) { el.className = className; }
    if (text !== undefined && text !== null) { el.textContent = text; }
    return el;
  }

  function icon(id) {
    var svg = document.createElementNS(SVG_NS, 'svg');
    var use = document.createElementNS(SVG_NS, 'use');
    svg.setAttribute('class', 'icon');
    svg.setAttribute('aria-hidden', 'true');
    use.setAttribute('href', '#' + id);
    svg.appendChild(use);
    return svg;
  }

  function decoImage(key, className, group) {
    var el = make('img', className);
    el.alt = '';
    el.setAttribute('aria-hidden', 'true');
    el.loading = 'lazy';
    el.decoding = 'async';
    el.setAttribute('data-img', key);
    if (group) { el.setAttribute('data-deco', group); }
    el.src = (CFG.images && CFG.images[key]) || '';
    return el;
  }

  function decoBand(className, group) {
    var el = make('div', className);
    el.setAttribute('data-deco', group);
    el.setAttribute('aria-hidden', 'true');
    return el;
  }

  /* ------------------------------ page content ------------------------------ */
  function bindText() {
    all('[data-text]').forEach(function (el) {
      var value = get(el.getAttribute('data-text'));
      if (value === null || value === undefined || value === '') { el.hidden = true; }
      else { el.textContent = fill(value); }
    });
    all('[data-bell-label]').forEach(function (el) {
      var value = get(el.getAttribute('data-bell-label'));
      if (value) { el.setAttribute('aria-label', value); }
    });
  }

  function bindImages() {
    var root = document.documentElement;
    Object.keys(CFG.images || {}).forEach(function (key) {
      var path = CFG.images[key];
      if (!path) { return; }
      root.style.setProperty('--img-' + kebab(key), 'url("' + new URL(path, document.baseURI).href + '")');
      all('img[data-img="' + key + '"]').forEach(function (img) {
        if (img.getAttribute('src') !== path) { img.setAttribute('src', path); }
      });
    });
  }

  // Flame flicker is drawn inside these SVG files; the #still address switches it off.
  function stillFlames() {
    if (!reduced()) { return; }
    ['kuthuvilakku', 'templeIllustration'].forEach(function (key) {
      all('img[data-img="' + key + '"]').forEach(function (img) {
        var src = img.getAttribute('src');
        if (src && src.indexOf('#') === -1) { img.setAttribute('src', src + '#still'); }
      });
    });
  }

  function bindDecorations() {
    var d = CFG.decorations || {};
    Object.keys(d).forEach(function (key) {
      if (d[key] === false) {
        all('[data-deco="' + key + '"]').forEach(function (el) { el.hidden = true; });
      }
    });
  }

  function renderHeroDate() {
    var el = byId('hero-date');
    var text = Cal.formatDate(CFG.wedding && CFG.wedding.date);
    if (text) { el.textContent = text; } else { el.hidden = true; }
  }

  function renderFamily() {
    var f = CFG.text.family;
    var wrap = byId('family-parents');
    byId('family-message').textContent = fill(f.message || '');
    wrap.textContent = '';
    [['groom', CFG.couple.groom], ['bride', CFG.couple.bride]].forEach(function (pair) {
      var p = f[pair[0]];
      if (!p || !p.parents) { return; }
      var col = make('div', 'parent');
      col.appendChild(make('p', 'parent__name', pair[1]));
      col.appendChild(make('p', 'parent__relation', p.relation));
      col.appendChild(make('p', 'parent__people', p.parents));
      wrap.appendChild(col);
    });
    wrap.hidden = !wrap.children.length;
  }

  function addRow(list, label, parts) {
    var row = make('div', 'details__row');
    var dd = make('dd');
    row.appendChild(make('dt', null, label));
    parts.forEach(function (part, i) { dd.appendChild(make('span', i === 0 ? 'details__main' : 'details__extra', part)); });
    row.appendChild(dd);
    list.appendChild(row);
  }

  function eventDecorations(ev, section) {
    if (ev.theme === 'muhurtha') {
      section.appendChild(decoBand('toran toran--top', 'toran'));
      section.appendChild(decoImage('kuthuvilakku', 'deco deco--lamp deco--lamp-l', 'lamps'));
      section.appendChild(decoImage('kuthuvilakku', 'deco deco--lamp deco--lamp-r', 'lamps'));
      section.appendChild(decoImage('bananaLeaf', 'deco deco--leaf deco--leaf-l', 'banana'));
      section.appendChild(decoImage('bananaLeaf', 'deco deco--leaf deco--leaf-r', 'banana'));
      section.appendChild(decoBand('silk silk--bottom', 'silkBorders'));
    } else if (ev.theme === 'reception') {
      section.appendChild(decoBand('garland garland--top', 'garlands'));
      section.appendChild(decoImage('kolam', 'deco deco--kolam', 'kolam'));
      section.appendChild(decoImage('marigoldJasmine', 'deco deco--bloom deco--bloom-tl', 'arrangements'));
      section.appendChild(decoImage('marigoldJasmine', 'deco deco--bloom deco--bloom-br', 'arrangements'));
      section.appendChild(decoBand('silk silk--bottom', 'silkBorders'));
    }
  }

  function renderEvents() {
    var host = byId('events');
    var L = CFG.text.labels;
    var ctx = { groom: CFG.couple.groom, bride: CFG.couple.bride, timeZone: (CFG.wedding && CFG.wedding.timeZone) || 'Asia/Kolkata' };

    (CFG.events || []).forEach(function (ev) {
      var section = make('section', 'section event event--' + (ev.theme || 'plain'));
      var inner = make('div', 'section__inner');
      var heading = make('h2', 'h2', ev.title);

      section.id = ev.id;
      section.setAttribute('data-section', ev.id);
      section.setAttribute('data-theme', ev.theme || 'plain');
      section.setAttribute('aria-labelledby', ev.id + '-title');
      heading.id = ev.id + '-title';
      eventDecorations(ev, section);

      if (ev.theme === 'muhurtha') { inner.appendChild(decoImage('kalash', 'event__kalash', 'kalash')); }
      if (ev.titleLocal) {
        var local = make('p', 'eyebrow eyebrow--local', ev.titleLocal);
        local.lang = 'kn';
        inner.appendChild(local);
      }
      inner.appendChild(heading);
      if (ev.tagline) { inner.appendChild(make('p', 'sub', ev.tagline)); }
      inner.appendChild(decoImage('lotus', 'event__lotus', 'kolam'));

      var list = make('dl', 'details');
      addRow(list, L.date, [Cal.hasDate(ev) ? Cal.formatDate(ev.date) : L.toBeAnnounced]);
      addRow(list, L.time, [Cal.formatTimeRange(ev.startTime, ev.endTime) || L.toBeAnnounced]);
      var venue = [ev.venueName, ev.address].filter(Boolean);
      addRow(list, L.venue, venue.length ? venue : [L.venueToFollow]);
      inner.appendChild(list);
      if (ev.note) { inner.appendChild(make('p', 'event__note', ev.note)); }

      var actions = make('div', 'actions');
      if (Cal.hasDate(ev)) {
        var google = make('a', 'btn btn--gold');
        google.href = Cal.googleUrl(ev, ctx);
        google.target = '_blank';
        google.rel = 'noopener noreferrer';
        google.appendChild(icon('i-calendar'));
        google.appendChild(make('span', null, L.addToGoogle));
        actions.appendChild(google);

        var ics = make('button', 'btn btn--ghost');
        ics.type = 'button';
        ics.appendChild(icon('i-calendar'));
        ics.appendChild(make('span', null, L.addToCalendar));
        ics.addEventListener('click', function () { Cal.download(ev, ctx); });
        actions.appendChild(ics);
      }
      var mapUrl = safeUrl(ev.mapUrl);
      if (mapUrl) {
        var map = make('a', 'btn btn--ghost');
        map.href = mapUrl;
        map.target = '_blank';
        map.rel = 'noopener noreferrer';
        map.appendChild(icon('i-pin'));
        map.appendChild(make('span', null, L.viewMap));
        actions.appendChild(map);
      }
      if (actions.children.length) { inner.appendChild(actions); }

      if (ev.theme === 'muhurtha') { inner.appendChild(decoImage('mandapam', 'event__mandapam', 'mandapam')); }

      section.appendChild(inner);
      host.appendChild(section);
    });
  }

  /* ------------------------------ scroll effects ------------------------------ */
  function setupReveal() {
    var counts = {};
    var items = all('[data-reveal]');
    items.forEach(function (el) {
      var section = el.closest('.section');
      var key = section ? section.id : 'page';
      counts[key] = (counts[key] || 0) + 1;
      el.style.setProperty('--d', (Math.min(counts[key] - 1, 6) * 0.1).toFixed(1) + 's');
    });

    if (!('IntersectionObserver' in window) || CFG.animations === false) {
      items.forEach(function (el) { el.classList.add('is-in'); });
      return;
    }
    document.documentElement.classList.add('reveal-ready');
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in');
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
    items.forEach(function (el) { io.observe(el); });
  }

  function sectionLevel(id) {
    var levels = (CFG.flowerShower && CFG.flowerShower.sectionLevels) || {};
    var section = byId(id);
    var theme = section && section.getAttribute('data-theme');
    return levels[id] || (theme && levels[theme]) || 'gentle';
  }

  function trackSections() {
    if (!('IntersectionObserver' in window)) { return; }
    var shares = {};
    var current = null;
    var inBlessing = false;
    var celebrated = false;
    var fs = CFG.flowerShower || {};

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        shares[entry.target.getAttribute('data-section')] = entry.intersectionRect.height / window.innerHeight;
      });

      var best = null;
      var bestShare = 0;
      Object.keys(shares).forEach(function (id) {
        if (shares[id] > bestShare) { best = id; bestShare = shares[id]; }
      });
      if (best && best !== current) {
        current = best;
        Flowers.setLevel(sectionLevel(best));
      }

      var blessing = shares.blessing || 0;
      if (blessing > 0.3 && !inBlessing) {
        inBlessing = true;
        Music.onBlessing(true);
        if (!celebrated) {
          celebrated = true;
          if (fs.closingShower && fs.closingShower.enabled) {
            Flowers.burst({ level: fs.closingShower.level, durationMs: fs.closingShower.durationMs });
          }
          Music.chime('blessing');
        }
      } else if (blessing < 0.1 && inBlessing) {
        inBlessing = false;
        Music.onBlessing(false);
      }
    }, { threshold: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1] });

    all('[data-section]').forEach(function (el) { io.observe(el); });
  }

  /* ------------------------------ welcome screen ------------------------------ */
  function setupWelcome() {
    var welcome = byId('welcome');
    var main = byId('main');
    var enter = byId('enter');
    var enterMusic = byId('enter-music');
    var entered = false;
    var fs = CFG.flowerShower || {};

    function focusables() {
      return all('button:not([hidden]):not([tabindex="-1"])', welcome).filter(function (b) { return !b.closest('[hidden]'); });
    }

    function enterInvitation(withMusic) {
      if (entered) { return; }
      entered = true;

      if (withMusic) { Music.startFromGesture(); }
      Music.chime('enter');
      Music.revealControl();

      main.removeAttribute('inert');
      main.removeAttribute('aria-hidden');
      welcome.classList.add('is-leaving');
      document.body.classList.remove('is-locked');
      window.scrollTo(0, 0);

      setupReveal();
      Flowers.setLevel(sectionLevel('opening'));
      if (fs.openingShower && fs.openingShower.enabled) {
        Flowers.burst({ level: fs.openingShower.level, durationMs: fs.openingShower.durationMs });
      }
      trackSections();

      window.setTimeout(function () {
        if (welcome.parentNode) { welcome.parentNode.removeChild(welcome); }
        main.focus({ preventScroll: true });
      }, reduced() ? 0 : 1000);
    }

    enter.addEventListener('click', function () { enterInvitation(false); });
    enterMusic.addEventListener('click', function () { enterInvitation(true); });
    Music.whenAvailable(function () { enterMusic.hidden = false; });

    all('[data-bell]', welcome).forEach(function (bell) {
      bell.addEventListener('click', function () {
        Music.ringBell();
        all('[data-bell]', welcome).forEach(function (b) {
          b.classList.remove('is-ringing');
          void b.offsetWidth;
          b.classList.add('is-ringing');
        });
      });
    });

    welcome.addEventListener('keydown', function (e) {
      if (e.key !== 'Tab') { return; }
      var items = focusables();
      if (!items.length) { return; }
      var first = items[0];
      var last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });

    window.setTimeout(function () {
      if (!entered) {
        welcome.setAttribute('tabindex', '-1');
        welcome.focus({ preventScroll: true });
      }
    }, 600);
  }

  /* ----------------------------------- start ----------------------------------- */
  function start() {
    if (!CFG) {
      if (window.console) { window.console.error('config.js did not load.'); }
      var w = byId('welcome');
      if (w) { w.hidden = true; }
      document.body.classList.remove('is-locked');
      return;
    }

    document.title = CFG.pageTitle || document.title;
    if (CFG.animations === false) { document.documentElement.classList.add('no-motion'); }

    safe(renderFamily);
    safe(renderEvents);
    safe(renderHeroDate);
    safe(bindText);
    safe(bindImages);
    safe(stillFlames);
    safe(bindDecorations);

    safe(function () {
      Flowers.init(CFG.animations === false ? { enabled: false } : (CFG.flowerShower || { enabled: false }));
      Flowers.setLevel(sectionLevel('welcome'));
      window.setTimeout(function () { Flowers.burst({ level: 'gentle', durationMs: 4500 }); }, 700);
    });
    safe(function () { Music.init(CFG); });
    safe(setupWelcome);
  }

  if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', start); }
  else { start(); }
}());
