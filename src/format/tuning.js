(() => {
  "use strict";

  const { OFF, TUNE_CATS, MOTO_CATS, MOTO, TUNE_VENDORS } = MCLA.data;
  const { setF32 } = MCLA.format;
  const { tuneAt, readSlot } = MCLA.format;

  const isMoto = (car) => Boolean(MOTO[car]);
  const tuneCatIdx = (car) => isMoto(car) ? MOTO_CATS : TUNE_CATS.map((_, i) => i);
  const tuneMaxByte = () => 2;
  const tuneLevel = (byte) => byte + 1;

  /* Tires (last category) are excluded from the percentage divisor 2*(n-1). */
  function tunePctAt(n, ctx = MCLA.state) {
    const { car } = readSlot(n, ctx);
    const idx = tuneCatIdx(car);
    const base = tuneAt(n, ctx);
    let sum = 0;
    for (let i = 0; i < idx.length - 1; i++) {
      sum += Math.min(2, ctx.bytes[base + OFF.tuneLv + idx[i]]);
    }
    return Math.max(0, Math.min(100, Math.floor((sum * 100) / (2 * (idx.length - 1)))));
  }

  function tuneSet(n, catIdx, level, ctx = MCLA.state) {
    const v = Math.max(0, Math.min(tuneMaxByte(), level - 1));
    const base = tuneAt(n, ctx);
    ctx.bytes[base + OFF.tuneLv + catIdx] = v;
    ctx.bytes[base + OFF.tunePct] = tunePctAt(n, ctx);
    return v + 1;
  }

  function maxTune(n, ctx = MCLA.state) {
    const { car } = readSlot(n, ctx);
    const idx = tuneCatIdx(car);
    const top = tuneMaxByte();
    const base = tuneAt(n, ctx);
    for (const ci of idx) ctx.bytes[base + OFF.tuneLv + ci] = top;
    const pct = tunePctAt(n, ctx);
    ctx.bytes[base + OFF.tunePct] = pct;
    return pct;
  }

  function clearTune(n, ctx = MCLA.state) {
    const at = tuneAt(n, ctx);
    for (let i = 0; i < OFF.tuneN; i++) {
      ctx.bytes[at + OFF.tuneLv + i] = 0;
      ctx.bytes[at + OFF.tuneVendor + i] = 0;
      const v = TUNE_VENDORS[i];
      if (v) setF32(at + OFF.tuneVendorF + i * 4, v.stock, ctx);
    }
    ctx.bytes[at + OFF.tunePct] = 0;
  }

  const tuneVendorAt = (n, catIdx, ctx = MCLA.state) =>
    ctx.bytes[tuneAt(n, ctx) + OFF.tuneVendor + catIdx];

  function tuneVendorSet(n, catIdx, idx, ctx = MCLA.state) {
    const at = tuneAt(n, ctx);
    const v = TUNE_VENDORS[catIdx];
    if (idx == null) {
      ctx.bytes[at + OFF.tuneVendor + catIdx] = 0;
      if (v) setF32(at + OFF.tuneVendorF + catIdx * 4, v.stock, ctx);
      return 0;
    }
    ctx.bytes[at + OFF.tuneVendor + catIdx] = idx;
    if (v && v.floats[idx] != null) setF32(at + OFF.tuneVendorF + catIdx * 4, v.floats[idx], ctx);
    return idx;
  }

  function tuneInfo(n, ctx = MCLA.state) {
    const { car } = readSlot(n, ctx);
    const moto = isMoto(car);
    const idx = tuneCatIdx(car);
    const max = tuneMaxByte();
    const base = tuneAt(n, ctx);
    const cats = idx.map((ci) => {
      const name = (moto && ci === 5) ? "Jet Kits" : TUNE_CATS[ci];
      const rawLv = tuneLevel(ctx.bytes[base + OFF.tuneLv + ci]);
      const vend = TUNE_VENDORS[ci];
      return {
        idx: ci,
        name,
        level: Math.max(1, Math.min(max + 1, rawLv)),
        max: max + 1,
        vendor: vend ? tuneVendorAt(n, ci, ctx) : null,
        vendors: vend ? vend.names : null
      };
    });
    return { car, moto, cats, pct: tunePctAt(n, ctx), max: max + 1 };
  }

  Object.assign(MCLA.format, {
    isMoto,
    tuneCatIdx,
    tuneMaxByte,
    tuneLevel,
    tunePctAt,
    tuneSet,
    maxTune,
    clearTune,
    tuneVendorAt,
    tuneVendorSet,
    tuneInfo
  });
})();
