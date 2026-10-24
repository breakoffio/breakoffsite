/*
 * BreakOff invite pages: the BREAK DETAILS partial.
 *
 * Web twin of the app's lib/breakDetails.ts + BreakDetailsCard.tsx
 * (BreakOff repo). Same formatters, same model, same card:
 *
 *   current (a break running now)   hero "58 min left"; Ends at, Mode
 *   future  (a break on a schedule) hero "1 hour"; Date or Repeats, Time, Mode
 *
 * Usage: BreakDetails.render(containerEl, BreakDetails.current({...}))
 */
(function (root) {
  var DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  function modeLabel(mode) { return mode === 'locked' ? 'Locked' : 'Flexible'; }

  function durationLong(minutes) {
    var m = Math.max(0, Math.round(minutes || 0));
    if (m < 60) return m + ' min';
    var h = Math.floor(m / 60);
    var rest = m % 60;
    if (rest === 0) return h + (h === 1 ? ' hour' : ' hours');
    return h + ' hr ' + rest + ' min';
  }

  function timeLeft(ms) {
    var total = Math.max(0, Math.floor(ms / 60000));
    if (total < 1) return 'Less than a minute left';
    var h = Math.floor(total / 60);
    var m = total % 60;
    if (h === 0) return m + ' min left';
    if (m === 0) return h + ' hr left';
    return h + ' hr ' + m + ' min left';
  }

  function repeatDays(days) {
    var seen = {};
    var sorted = (days || []).filter(function (d) {
      if (typeof d !== 'number' || d < 0 || d > 6 || seen[d]) return false;
      seen[d] = true;
      return true;
    }).sort(function (a, b) { return a - b; });
    if (sorted.length === 0) return '';
    if (sorted.length === 7) return 'Every day';
    if (sorted.length === 2 && sorted[0] === 0 && sorted[1] === 6) return 'Sat, Sun';
    var out = [];
    var runStart = sorted[0];
    var prev = sorted[0];
    function flush() {
      if (runStart === prev) out.push(DAY_NAMES[runStart]);
      else if (prev - runStart === 1) out.push(DAY_NAMES[runStart] + ', ' + DAY_NAMES[prev]);
      else out.push(DAY_NAMES[runStart] + ' to ' + DAY_NAMES[prev]);
    }
    for (var i = 1; i < sorted.length; i++) {
      if (sorted[i] === prev + 1) { prev = sorted[i]; continue; }
      flush();
      runStart = sorted[i];
      prev = sorted[i];
    }
    flush();
    return out.join(', ');
  }

  function isoDate(iso) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || '');
    if (!m) return iso || '';
    var d = new Date(+m[1], +m[2] - 1, +m[3]);
    return DAY_NAMES[d.getDay()] + ', ' + MONTHS[d.getMonth()] + ' ' + d.getDate();
  }

  function dateList(isos) {
    var seen = {};
    var sorted = (isos || []).filter(function (x) {
      if (!x || seen[x]) return false;
      seen[x] = true;
      return true;
    }).sort();
    if (sorted.length === 0) return '';
    if (sorted.length === 1) return isoDate(sorted[0]);
    var short = function (iso) { return isoDate(iso).replace(/^\w{3}, /, ''); };
    if (sorted.length <= 3) return sorted.map(short).join(', ');
    return short(sorted[0]) + ' to ' + short(sorted[sorted.length - 1]);
  }

  function clock(hour, minute) {
    var ampm = hour < 12 ? 'AM' : 'PM';
    var h12 = hour % 12 === 0 ? 12 : hour % 12;
    return h12 + ':' + String(minute || 0).padStart(2, '0') + ' ' + ampm;
  }
  function clockOfDate(d) { return clock(d.getHours(), d.getMinutes()); }

  function current(args) {
    return {
      emphasis: 'current',
      hero: timeLeft(args.remainingMs),
      rows: [
        { label: 'Ends at', value: args.endsAt || 'With the host' },
        { label: 'Mode', value: modeLabel(args.mode) }
      ]
    };
  }

  function future(args) {
    var rows = [];
    if (args.dateLabel) {
      rows.push({
        label: args.dateRowLabel || (args.repeats ? 'Repeats' : 'Date'),
        value: args.dateLabel
      });
    }
    if (args.timeLabel) rows.push({ label: 'Time', value: args.timeLabel });
    rows.push({ label: 'Mode', value: modeLabel(args.mode) });
    return {
      emphasis: 'future',
      hero: args.durationMinutes > 0 ? durationLong(args.durationMinutes) : 'Phone-free break',
      rows: rows
    };
  }

  function headline(name) {
    var n = (name || '').trim();
    return n ? n + ' invited you to a break' : "You're invited to a break";
  }

  function render(container, model) {
    var card = document.createElement('section');
    card.className = 'inv-card bd-card';
    card.setAttribute('aria-label', 'Break details');
    card.setAttribute('data-emphasis', model.emphasis);
    var eyebrow = document.createElement('div');
    eyebrow.className = 'inv-eyebrow';
    eyebrow.textContent = 'Break details';
    var hero = document.createElement('div');
    hero.className = 'bd-hero';
    hero.textContent = model.hero;
    var dl = document.createElement('dl');
    dl.className = 'bd-rows';
    model.rows.forEach(function (r) {
      var row = document.createElement('div');
      row.className = 'bd-row';
      var dt = document.createElement('dt');
      dt.textContent = r.label;
      var dd = document.createElement('dd');
      dd.textContent = r.value;
      row.appendChild(dt);
      row.appendChild(dd);
      dl.appendChild(row);
    });
    card.appendChild(eyebrow);
    card.appendChild(hero);
    card.appendChild(dl);
    container.replaceChildren(card);
    container.classList.remove('hidden');
  }

  root.BreakDetails = {
    modeLabel: modeLabel,
    durationLong: durationLong,
    timeLeft: timeLeft,
    repeatDays: repeatDays,
    isoDate: isoDate,
    dateList: dateList,
    clock: clock,
    clockOfDate: clockOfDate,
    current: current,
    future: future,
    headline: headline,
    render: render
  };
})(window);
