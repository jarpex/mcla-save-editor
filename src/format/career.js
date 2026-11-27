(() => {
  "use strict";

  const { OFF, RACE_TARGETS } = MCLA.data;
  const { sec, ascii, u32, setU32, f32, setF32 } = MCLA.format;
  const { statsStartOffset, msToText, textToMs, hoursToText, textToHours } = MCLA.format;

  const progBase = (ctx = MCLA.state) => sec("Career", ctx).data + OFF.progBase;
  const progTotal = (ctx = MCLA.state) => u32(sec("Career", ctx).data + OFF.progCount, ctx);
  const progAt = (i, ctx = MCLA.state) => progBase(ctx) + i * OFF.progStride + 64;

  function progSetAll(v, ctx = MCLA.state) {
    const n = progTotal(ctx);
    for (let i = 0; i < n; i++) ctx.bytes[progAt(i, ctx)] = v;
  }

  const ttPlausible = (v) => v >= 10000 && v <= 400000;

  /* 4 time trial targets followed by 16 race targets (u32 ms); base shifts with event count. */
  function ttBase(ctx = MCLA.state) {
    if (ctx.ttBase !== null) return ctx.ttBase;
    const car = sec("Career", ctx);
    let found = -1;
    for (let off = 0; off + 80 < car.size; off++) {
      let ok = true;
      for (let i = 0; i < 4; i++) {
        if (!ttPlausible(u32(car.data + off + i * 4, ctx))) { ok = false; break; }
      }
      if (!ok) continue;
      for (let j = 0; j < RACE_TARGETS; j++) {
        const v = u32(car.data + off + 16 + j * 4, ctx);
        if (!ttPlausible(v) && v !== 0) { ok = false; break; }
      }
      if (ok) { found = off; break; }
    }
    ctx.ttBase = found;
    return found;
  }

  function statAlloc(code, isFloat, ctx = MCLA.state) {
    const s = sec("Stats", ctx);
    const start = statsStartOffset(s);
    for (let o = start; o + 16 <= s.data + s.size; o += 16) {
      const k = ascii(o, 4, ctx);
      if (/^[A-Za-z][A-Za-z0-9$%:]{3}$/.test(k)) continue;
      for (let i = 0; i < 4; i++) ctx.bytes[o + i] = code.charCodeAt(i);
      ctx.bytes[o + 8] = isFloat ? 0x28 : 0x29;
      setU32(o + 12, 0, ctx);
      return o + 12;
    }
    return -1;
  }

  function statValueAt(code, occ = 0, ctx = MCLA.state) {
    const s = sec("Stats", ctx);
    const start = statsStartOffset(s);
    let seen = 0;
    for (let o = start; o + 16 <= s.data + s.size; o += 16) {
      if (ascii(o, 4, ctx) === code) {
        if (seen === occ) return o + 12;
        seen++;
      }
    }
    return -1;
  }

  function careerRead(rec, ctx = MCLA.state) {
    if (rec.read) return rec.read(ctx);
    const at = statValueAt(rec.stat, rec.occ, ctx);
    if (at < 0) return "";
    if (rec.fmt === "time") return msToText(u32(at, ctx));
    if (rec.fmt === "hours") return hoursToText(f32(at, ctx));
    if (rec.fmt === "dec") return f32(at, ctx).toFixed(4);
    return u32(at, ctx);
  }

  function careerWrite(rec, val, ctx = MCLA.state) {
    if (rec.write) return rec.write(val, ctx);
    let at = statValueAt(rec.stat, rec.occ, ctx);
    if (at < 0) at = statAlloc(rec.stat, rec.fmt === "dec", ctx);
    if (at < 0) return false;
    if (rec.fmt === "time") {
      const ms = textToMs(val);
      if (ms === null) return false;
      setU32(at, ms, ctx);
      return true;
    }
    if (rec.fmt === "hours") {
      const h = textToHours(val);
      if (h === null) return false;
      setF32(at, h, ctx);
      return true;
    }
    const n = Number(String(val).replace(",", "."));
    if (!isFinite(n)) return false;
    if (rec.fmt === "dec") setF32(at, n, ctx);
    else setU32(at, Math.max(0, Math.min(4294967295, Math.floor(n))), ctx);
    return true;
  }

  Object.assign(MCLA.format, {
    progBase,
    progTotal,
    progAt,
    progSetAll,
    ttPlausible,
    ttBase,
    statAlloc,
    statValueAt,
    careerRead,
    careerWrite
  });
})();
