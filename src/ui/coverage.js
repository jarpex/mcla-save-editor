(() => {
  "use strict";

  const { OFF, RACE_TARGETS, CAREER_RECORDS } = MCLA.data;
  const { sec, slotCount, progTotal, ttBase, statName } = MCLA.format;
  const { el, nf, buildAlmanac } = MCLA.ui;

  function computeCoverage(ctx = MCLA.state, stats = MCLA.state.stats) {
    const total = ctx.bytes.length;
    const st = sec("Stats", ctx);
    const slots = slotCount(ctx);
    const progCount = progTotal(ctx);
    const slotBytes = slots * OFF.slotStride;
    const progBytes = progCount * OFF.progStride;

    let named = 0;
    let unnamed = 0;
    for (const r of stats) {
      if (statName(r)) named++;
      else unnamed++;
    }
    const statsBytes = named * 16;

    const ttBytes = ttBase(ctx) >= 0 ? (OFF.ttTargetCount + RACE_TARGETS) * OFF.ttTargetStride : 0;
    const known = slotBytes + OFF.collectN + statsBytes + progBytes + 25 + ttBytes;
    const potential = known - statsBytes + st.size;

    let fields = CAREER_RECORDS.length;
    const countAln = (nodes) => {
      for (const n of nodes) {
        if (n.rows) fields += n.rows.length;
        if (n.children) countAln(n.children);
      }
    };
    countAln(buildAlmanac(ctx));

    let container = 8;
    for (const s of ctx.secs.list) container += 9 + s.name.length;

    const unknown = Math.max(0, total - known - container);
    const pct = total ? (known / total) * 100 : 0;
    const potPct = total ? (potential / total) * 100 : 0;

    return {
      total, slots, progCount, named, unnamed, statsTotal: stats.length,
      known, potential, container, unknown, pct, potPct, fields
    };
  }

  function renderCoverage() {
    if (!MCLA.state.bytes) return;
    const c = computeCoverage();
    el("covPct").textContent = `${c.pct.toFixed(1)}%`;
    el("covFill").style.width = `${c.pct}%`;
    el("covPot").style.width = `${c.potPct}%`;
    el("covKnown").textContent = `${nf(c.known)} B`;
    el("covContainer").textContent = `${nf(c.container)} B`;
    el("covUnknown").textContent = `${nf(c.unknown)} B`;
    el("covFields").textContent = nf(c.fields);
    el("covSlots").textContent = `${c.slots} \u00d7 ${nf(OFF.slotStride)} B`;
    el("covStats").textContent = `${c.named} / ${c.statsTotal}`;
    el("covProg").textContent = `${c.progCount} \u00d7 65 B`;
    el("covUnnamed").textContent = nf(c.unnamed);
  }

  Object.assign(MCLA.ui, { computeCoverage, renderCoverage });
})();
