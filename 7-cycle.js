/* Saheli - cycle logic (pure, no DOM). Runs in browser and node (for tests). */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.SaheliCycle = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  const DAY = 86400000;
  function parseDate(s) { const p = s.split('-').map(Number); return new Date(Date.UTC(p[0], p[1]-1, p[2])); }
  function fmt(dt) { return dt.toISOString().slice(0, 10); }
  function addDays(d, n) { return new Date(d.getTime() + n * DAY); }
  function diffDays(a, b) { return Math.round((parseDate(a) - parseDate(b)) / DAY); }

  function isFlowDay(log) { return !!(log && log.flow && log.flow !== 'none'); }

  function periodStarts(logs) {
    const dates = Object.keys(logs).filter(function (d) { return isFlowDay(logs[d]); }).sort();
    const starts = [];
    for (const d of dates) {
      const prev = fmt(addDays(parseDate(d), -1));
      if (!isFlowDay(logs[prev])) starts.push(d);
    }
    return starts;
  }

  function periodLengths(logs, starts) {
    const lens = [];
    for (const s of starts) {
      let n = 0; let d = s;
      while (isFlowDay(logs[d]) && n < 15) { n++; d = fmt(addDays(parseDate(d), 1)); }
      if (n > 0) lens.push(n);
    }
    return lens;
  }

  function cycleStats(logs) {
    const starts = periodStarts(logs);
    if (starts.length < 2) return { count: starts.length, avg: null, min: null, max: null, lengths: [], starts: starts };
    const lengths = [];
    for (let i = 1; i < starts.length; i++) lengths.push(diffDays(starts[i], starts[i - 1]));
    const avg = lengths.reduce(function (a, b) { return a + b; }, 0) / lengths.length;
    return { count: starts.length, avg: Math.round(avg * 10) / 10, min: Math.min.apply(null, lengths), max: Math.max.apply(null, lengths), lengths: lengths, starts: starts };
  }

  function avgPeriodLen(logs, starts) {
    const lens = periodLengths(logs, starts);
    if (!lens.length) return 5;
    return Math.round(lens.reduce(function (a, b) { return a + b; }, 0) / lens.length);
  }

  function confidence(stats) {
    if (!stats.avg) return { level: 'low', reason: 'Log at least 2 periods for predictions.' };
    if (stats.lengths.length < 2) return { level: 'low', reason: 'One more full cycle makes predictions steadier.' };
    const spread = stats.max - stats.min;
    if (spread <= 4) return { level: 'high', reason: 'Cycles are regular (vary by ' + spread + ' days).' };
    if (spread <= 8) return { level: 'medium', reason: 'Cycles vary by ' + spread + ' days - predictions are approximate.' };
    return { level: 'low', reason: 'Cycles vary by ' + spread + ' days - irregular; calendar predictions are weak. Irregular cycles can be a PCOS clue worth asking a doctor about.' };
  }

  function bandDays(stats) {
    if (!stats.avg) return 7;
    if (stats.lengths.length < 2) return 4;
    return Math.max(2, Math.ceil((stats.max - stats.min) / 2) + 1);
  }

  function predict(logs, today) {
    const stats = cycleStats(logs);
    const conf = confidence(stats);
    const avgLen = stats.avg ? Math.round(stats.avg) : 28;
    const lastStart = stats.starts.length ? stats.starts[stats.starts.length - 1] : null;
    const band = bandDays(stats);
    let nextStart = null, ovulation = null, fertileStart = null, fertileEnd = null, lateBy = 0;
    if (lastStart) {
      nextStart = fmt(addDays(parseDate(lastStart), avgLen));
      while (diffDays(nextStart, today) < 0) { lateBy++; nextStart = fmt(addDays(parseDate(nextStart), avgLen)); }
      if (lateBy > 0) { const raw = fmt(addDays(parseDate(lastStart), avgLen)); lateBy = diffDays(today, raw); }
      ovulation = fmt(addDays(parseDate(nextStart), -14));
      fertileStart = fmt(addDays(parseDate(ovulation), -5));
      fertileEnd = fmt(addDays(parseDate(ovulation), 1));
    }
    return { stats: stats, conf: conf, avgLen: avgLen, periodLen: avgPeriodLen(logs, stats.starts), lastStart: lastStart, band: band, nextStart: nextStart, ovulation: ovulation, fertileStart: fertileStart, fertileEnd: fertileEnd, lateBy: lateBy };
  }

  function dayOfCycle(logs, today) {
    const starts = periodStarts(logs).filter(function (s) { return diffDays(today, s) >= 0; });
    if (!starts.length) return null;
    return diffDays(today, starts[starts.length - 1]) + 1;
  }

  function phaseForDay(logs, today) {
    const p = predict(logs, today);
    const doc = dayOfCycle(logs, today);
    if (doc == null) return { phase: 'unknown', dayOfCycle: null, p: p };
    const log = logs[today];
    if (isFlowDay(log)) return { phase: 'period', dayOfCycle: doc, p: p };
    if (p.ovulation && today === p.ovulation) return { phase: 'ovulation', dayOfCycle: doc, p: p };
    if (p.fertileStart && diffDays(today, p.fertileStart) >= 0 && diffDays(today, p.fertileEnd) <= 0) return { phase: 'fertile', dayOfCycle: doc, p: p };
    if (p.ovulation && diffDays(today, p.ovulation) < 0) return { phase: 'follicular', dayOfCycle: doc, p: p };
    return { phase: 'luteal', dayOfCycle: doc, p: p };
  }

  return { parseDate: parseDate, fmt: fmt, addDays: addDays, diffDays: diffDays, isFlowDay: isFlowDay, periodStarts: periodStarts, periodLengths: periodLengths, cycleStats: cycleStats, avgPeriodLen: avgPeriodLen, confidence: confidence, bandDays: bandDays, predict: predict, dayOfCycle: dayOfCycle, phaseForDay: phaseForDay };
});
