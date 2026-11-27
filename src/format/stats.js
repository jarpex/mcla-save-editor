(() => {
  "use strict";

  const { OFF, STAT_NAMES, RACE_NAMES, WIN_CAR_NAMES, CAR_ORDER_NAMES } = MCLA.data;
  const { sec, ascii, u32, setU32, f32, setF32, setU8 } = MCLA.format;

  function msToText(ms) {
    const c = Math.max(0, Math.floor(ms / 10) * 10);
    const m = Math.floor(c / 60000);
    const s = Math.floor(c / 1000) % 60;
    const h = (c % 1000) / 10;
    return `${m < 10 ? "0" : ""}${m}:${s < 10 ? "0" : ""}${s}.${h < 10 ? "0" : ""}${h}`;
  }

  function textToMs(str) {
    const m = /^\s*(\d{1,3}):(\d{1,2})(?:[.,](\d{1,2}))?\s*$/.exec(str || "");
    if (!m) return null;
    const min = +m[1];
    const secVal = +m[2];
    const frac = m[3] || "";
    if (secVal > 59) return null;
    const cs = frac.length === 1 ? +frac * 10 : +frac;
    return Math.max(0, Math.min(4294967295, min * 60000 + secVal * 1000 + cs * 10));
  }

  function hoursToText(h) {
    const total = Math.max(0, Math.round(h * 60));
    const mins = total % 60;
    return `${Math.floor(total / 60)}:${mins < 10 ? "0" : ""}${mins}`;
  }

  function textToHours(str) {
    const m = /^\s*(\d{1,3}):(\d{1,2})\s*$/.exec(str || "");
    if (!m) return null;
    const h = +m[1];
    const min = +m[2];
    if (min > 59) return null;
    return h + min / 60;
  }

  const statIsHours = (r) => r.key === "ghTC" || r.key === "ghTP";

  function statName(r) {
    const base = STAT_NAMES[r.key];
    if (!base) return "";
    const list = r.key === "r:TI" ? RACE_NAMES
               : r.key === "vWIN" ? WIN_CAR_NAMES
               : r.key === "vkDT" ? CAR_ORDER_NAMES
               : null;
    if (r.key === "r:TI") {
      return list[r.occ] || `#${r.occ + 1}`;
    }
    if (list && list[r.occ]) return `${base} \u00b7 ${list[r.occ]}`;
    return r.occ ? `${base} #${r.occ + 1}` : base;
  }

  function statsStartOffset(s) {
    return s.data + (((2 - (s.data % 16)) % 16) + 16) % 16;
  }

  function scanStats(ctx = MCLA.state) {
    const s = sec("Stats", ctx);
    const list = [];
    const start = statsStartOffset(s);
    const seen = {};
    for (let o = start; o + 16 <= s.data + s.size; o += 16) {
      const k = ascii(o, 4, ctx);
      if (!/^[A-Za-z][A-Za-z0-9$%:]{3}$/.test(k)) continue;
      const kind = ctx.bytes[o + 8];
      const occ = seen[k] || 0;
      seen[k] = occ + 1;
      list.push({
        at: o,
        key: k,
        occ,
        isFloat: kind === 0x28 || kind === 0x00,
        isHours: statIsHours({ key: k }),
        isTime: k === "r:TI"
      });
    }
    return list;
  }

  function collectFound(ctx = MCLA.state) {
    const lo = sec("LocalOptions", ctx);
    const base = lo.data + OFF.collect;
    let c = 0;
    for (let i = 0; i < OFF.collectN; i++) {
      if (ctx.bytes[base + i] === 1) c++;
    }
    return c;
  }

  function collectSet(v, ctx = MCLA.state) {
    const lo = sec("LocalOptions", ctx);
    const base = lo.data + OFF.collect;
    for (let i = 0; i < OFF.collectN; i++) setU8(base + i, v, ctx);
  }

  function statRead(r, ctx = MCLA.state) {
    if (r.key === "gCOL") return String(collectFound(ctx));
    if (r.isHours) return hoursToText(f32(r.at + 12, ctx));
    if (r.isTime) return msToText(u32(r.at + 12, ctx));
    return r.isFloat ? f32(r.at + 12, ctx).toFixed(4) : u32(r.at + 12, ctx);
  }

  function statWrite(r, val, ctx = MCLA.state) {
    if (r.key === "gCOL") return false;
    if (r.isTime) {
      const ms = textToMs(val);
      if (ms === null) return false;
      setU32(r.at + 12, ms, ctx);
      return true;
    }
    if (r.isHours) {
      const h = textToHours(val);
      if (h === null) return false;
      setF32(r.at + 12, h, ctx);
      return true;
    }
    const v = Number(String(val).replace(",", "."));
    if (String(val).trim() === "" || !isFinite(v)) return false;
    if (r.isFloat) setF32(r.at + 12, v, ctx);
    else setU32(r.at + 12, Math.max(0, Math.min(4294967295, Math.floor(v))), ctx);
    return true;
  }

  function syncGcol(statsList, ctx = MCLA.state) {
    const r = statsList.find((x) => x.key === "gCOL");
    if (!r) return null;
    const n = collectFound(ctx);
    setU32(r.at + 12, n, ctx);
    return n;
  }

  Object.assign(MCLA.format, {
    msToText,
    textToMs,
    hoursToText,
    textToHours,
    statIsHours,
    statName,
    statsStartOffset,
    scanStats,
    collectFound,
    collectSet,
    statRead,
    statWrite,
    syncGcol
  });
})();
