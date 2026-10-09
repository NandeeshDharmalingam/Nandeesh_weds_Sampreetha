/* ============================================================================
   "Add to calendar" helpers: nicely written dates and times, a Google Calendar
   link, and a downloadable .ics file (Apple Calendar, Outlook and others).
   Events without a time become all-day events. Events without a date get no
   calendar buttons.
   ========================================================================== */
(function () {
  'use strict';

  var WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  var MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  var DEFAULT_MINUTES = 120;

  function pad(n) { return (n < 10 ? '0' : '') + n; }

  function parseDate(s) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s || '');
    return m ? { y: Number(m[1]), m: Number(m[2]), d: Number(m[3]) } : null;
  }

  function parseTime(s) {
    var m = /^(\d{1,2}):(\d{2})$/.exec(s || '');
    return m ? { h: Number(m[1]), min: Number(m[2]) } : null;
  }

  function hasDate(ev) { return !!parseDate(ev && ev.date); }

  function formatDate(s) {
    var d = parseDate(s);
    if (!d) { return ''; }
    var weekday = WEEKDAYS[new Date(d.y, d.m - 1, d.d).getDay()];
    return weekday + ', ' + d.d + ' ' + MONTHS[d.m - 1] + ' ' + d.y;
  }

  function formatTime(s) {
    var t = parseTime(s);
    if (!t) { return ''; }
    return (t.h % 12 || 12) + ':' + pad(t.min) + ' ' + (t.h < 12 ? 'AM' : 'PM');
  }

  function formatTimeRange(start, end) {
    if (!parseTime(start)) { return ''; }
    return parseTime(end) ? formatTime(start) + ' - ' + formatTime(end) : formatTime(start) + ' onwards';
  }

  // Wall-clock minutes as a UTC timestamp, only used for date arithmetic.
  function wallMs(d, t) { return Date.UTC(d.y, d.m - 1, d.d, t.h, t.min); }

  function span(ev) {
    var d = parseDate(ev.date);
    var st = parseTime(ev.startTime);
    var en = parseTime(ev.endTime);
    var start = wallMs(d, st);
    var end = en ? wallMs(d, en) : start + DEFAULT_MINUTES * 60000;
    if (end <= start) { end += 86400000; }
    return { start: start, end: end };
  }

  function stamp(ms) {
    var x = new Date(ms);
    return x.getUTCFullYear() + pad(x.getUTCMonth() + 1) + pad(x.getUTCDate()) + 'T' + pad(x.getUTCHours()) + pad(x.getUTCMinutes()) + '00';
  }

  function dayStamp(ms) {
    var x = new Date(ms);
    return x.getUTCFullYear() + pad(x.getUTCMonth() + 1) + pad(x.getUTCDate());
  }

  function tzOffsetMs(utcMs, timeZone) {
    var f = new Intl.DateTimeFormat('en-US', {
      timeZone: timeZone, hourCycle: 'h23', year: 'numeric', month: 'numeric', day: 'numeric',
      hour: 'numeric', minute: 'numeric', second: 'numeric'
    });
    var p = {};
    f.formatToParts(new Date(utcMs)).forEach(function (part) { p[part.type] = part.value; });
    return Date.UTC(Number(p.year), Number(p.month) - 1, Number(p.day), Number(p.hour) % 24, Number(p.minute), Number(p.second)) - utcMs;
  }

  // Wall-clock time in a time zone -> real UTC time.
  function toUtc(wall, timeZone) {
    var guess = wall - tzOffsetMs(wall, timeZone);
    return wall - tzOffsetMs(guess, timeZone);
  }

  function title(ev, ctx) {
    return ev.title + ' - Wedding of ' + ctx.groom + ' & ' + ctx.bride;
  }

  function where(ev) {
    return [ev.venueName, ev.address].filter(Boolean).join(', ');
  }

  function details(ev, ctx) {
    return [ev.note, ev.mapUrl && /^https?:\/\//i.test(ev.mapUrl) ? 'Map: ' + ev.mapUrl : ''].filter(Boolean).join('\n') ||
      'Wedding of ' + ctx.groom + ' & ' + ctx.bride;
  }

  function googleUrl(ev, ctx) {
    if (!hasDate(ev)) { return ''; }
    var q = ['action=TEMPLATE', 'text=' + encodeURIComponent(title(ev, ctx))];
    if (parseTime(ev.startTime)) {
      var s = span(ev);
      q.push('dates=' + stamp(s.start) + '/' + stamp(s.end));
      q.push('ctz=' + encodeURIComponent(ctx.timeZone));
    } else {
      var d = parseDate(ev.date);
      var day = Date.UTC(d.y, d.m - 1, d.d);
      q.push('dates=' + dayStamp(day) + '/' + dayStamp(day + 86400000));
    }
    if (where(ev)) { q.push('location=' + encodeURIComponent(where(ev))); }
    q.push('details=' + encodeURIComponent(details(ev, ctx)));
    return 'https://calendar.google.com/calendar/render?' + q.join('&');
  }

  function esc(text) {
    return String(text).replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');
  }

  function fold(line) {
    var out = [];
    while (line.length > 74) { out.push(line.slice(0, 74)); line = ' ' + line.slice(74); }
    out.push(line);
    return out.join('\r\n');
  }

  function buildIcs(ev, ctx) {
    var d = parseDate(ev.date);
    var lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Wedding Invitation//EN', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH', 'BEGIN:VEVENT'];

    lines.push('UID:' + ev.id + '-' + ev.date + '@wedding-invitation');
    lines.push('DTSTAMP:' + new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+/, ''));

    if (parseTime(ev.startTime)) {
      var s = span(ev);
      try {
        lines.push('DTSTART:' + stamp(toUtc(s.start, ctx.timeZone)) + 'Z');
        lines.push('DTEND:' + stamp(toUtc(s.end, ctx.timeZone)) + 'Z');
      } catch (e) {
        lines.push('DTSTART:' + stamp(s.start));
        lines.push('DTEND:' + stamp(s.end));
      }
    } else {
      var day = Date.UTC(d.y, d.m - 1, d.d);
      lines.push('DTSTART;VALUE=DATE:' + dayStamp(day));
      lines.push('DTEND;VALUE=DATE:' + dayStamp(day + 86400000));
    }

    lines.push('SUMMARY:' + esc(title(ev, ctx)));
    if (where(ev)) { lines.push('LOCATION:' + esc(where(ev))); }
    lines.push('DESCRIPTION:' + esc(details(ev, ctx)));
    lines.push('END:VEVENT', 'END:VCALENDAR');
    return lines.map(fold).join('\r\n') + '\r\n';
  }

  function download(ev, ctx) {
    if (!hasDate(ev)) { return; }
    var blob = new Blob([buildIcs(ev, ctx)], { type: 'text/calendar;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = (ev.id || 'event') + '.ics';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
  }

  window.WeddingCalendar = {
    hasDate: hasDate,
    formatDate: formatDate,
    formatTime: formatTime,
    formatTimeRange: formatTimeRange,
    googleUrl: googleUrl,
    buildIcs: buildIcs,
    download: download
  };
}());
