/* ============================================================================
   Scroll progress for the story. The page scrolls normally (no scroll
   hijacking); we only read how far through the story the guest is, as a number
   from 0 to 1, and ease towards it so the hands move smoothly.
   ========================================================================== */
(function () {
  'use strict';

  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }

  // opts: { story, stage, still, onFrame(progress) }
  function create(opts) {
    var top = 0;
    var range = 1;
    var target = 0;
    var current = 0;
    var raf = 0;
    var raw = 0;

    function measure() {
      top = opts.story.getBoundingClientRect().top + window.pageYOffset;
      range = Math.max(1, opts.story.offsetHeight - opts.stage.offsetHeight);
    }

    function read() { raw = (window.pageYOffset - top) / range; target = clamp(raw, 0, 1); }

    function loop() {
      raf = 0;
      var d = target - current;
      if (opts.still || Math.abs(d) < 0.0004) {
        current = target;
        opts.onFrame(current, raw);
        return;
      }
      current += d * 0.16;
      opts.onFrame(current, raw);
      raf = window.requestAnimationFrame(loop);
    }

    function poke() {
      read();
      if (!raf) { raf = window.requestAnimationFrame(loop); }
    }

    window.addEventListener('scroll', poke, { passive: true });
    window.addEventListener('resize', function () { measure(); poke(); });
    measure();
    read();
    current = target;

    return {
      measure: function () { measure(); poke(); },
      poke: poke,
      jump: function (p) { window.scrollTo(0, top + clamp(p, 0, 1) * range); current = clamp(p, 0, 1); poke(); },
      progress: function () { return current; }
    };
  }

  window.StoryScroll = { create: create };
})();
