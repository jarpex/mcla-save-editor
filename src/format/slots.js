(() => {
  "use strict";

  const { OFF, STOCK_APPEARANCE } = MCLA.data;
  const { sec, ascii, writeField } = MCLA.format;

  function autoLabel(prefab) {
    const m = /^vp_[a-z0-9]+_(.+?)_(\d{2})(_DUB)?$/.exec(prefab);
    if (!m) return prefab.toUpperCase();
    return `${m[2]} ${m[1].replace(/_/g, " ").toUpperCase()}${m[3] ? " DUB" : ""}`;
  }

  const slotAt = (n, ctx = MCLA.state) =>
    sec("LocalOptions", ctx).data + OFF.slot0 + n * OFF.slotStride;

  const tuneAt = (n, ctx = MCLA.state) =>
    sec("LocalOptions", ctx).data + OFF.tuneBase + n * OFF.slotStride;

  const storedCars = (ctx = MCLA.state) =>
    ctx.bytes[sec("LocalOptions", ctx).data + OFF.cars];

  /* Last slot is still valid if its 32-byte prefab name fits, even when
     the trailing bytes of the 8176-byte stride are truncated. */
  function slotCount(ctx = MCLA.state) {
    const lo = sec("LocalOptions", ctx);
    let n = 0;
    while (OFF.slot0 + (n + 1) * OFF.slotStride <= lo.size) n++;
    if (OFF.slot0 + n * OFF.slotStride + 32 <= lo.size) n++;
    return n;
  }

  /* Plate sits one stride back; space is stored as 0x3E ('>'). */
  function plateAt(n, ctx = MCLA.state) {
    const at = slotAt(n, ctx) - OFF.slotStride * OFF.plateStrideBack + OFF.slotPlate;
    let out = "";
    for (let i = 0; i < 8; i++) {
      const c = ctx.bytes[at + i];
      if (c === 0 || c === 0xCD) break;
      out += c === 0x3E ? " " : String.fromCharCode(c);
    }
    return out;
  }

  function plateFrom(str) {
    const out = [];
    for (let i = 0; i < 7; i++) {
      out.push(i < str.length ? (str[i] === " " ? 0x3E : str.charCodeAt(i)) : 0);
    }
    return out;
  }

  function writePlate(n, str, ctx = MCLA.state) {
    const at = slotAt(n, ctx) - OFF.slotStride * OFF.plateStrideBack + OFF.slotPlate;
    const enc = plateFrom(str);
    for (let i = 0; i < 7; i++) ctx.bytes[at + i] = enc[i];
  }

  function readSlot(n, ctx = MCLA.state) {
    const o = slotAt(n, ctx);
    const name = ascii(o, 32, ctx);
    return {
      i: n,
      at: o,
      car: (name === "blank" || name === "") ? "" : name,
      label: ascii(o + OFF.slotLabel, 32, ctx),
      plate: plateAt(n, ctx)
    };
  }

  function contiguous(ctx = MCLA.state) {
    let n = 0;
    const total = slotCount(ctx);
    while (n < total && readSlot(n, ctx).car) n++;
    return n;
  }

  function writeAppearance(at, prefab, ctx = MCLA.state) {
    const preset = STOCK_APPEARANCE[prefab];
    if (!preset) return;
    for (let i = 0; i < OFF.appear.length; i++) {
      ctx.bytes[at + OFF.appear[i]] = preset[i];
    }
  }

  function syncCars(ctx = MCLA.state) {
    const lo = sec("LocalOptions", ctx);
    const n = contiguous(ctx);
    ctx.bytes[lo.data + OFF.cars] = n;
    ctx.bytes[lo.data + OFF.carsIdx] = n > 0 ? n - 1 : 0;
    return n;
  }

  Object.assign(MCLA.format, {
    autoLabel,
    slotAt,
    tuneAt,
    storedCars,
    slotCount,
    plateAt,
    plateFrom,
    writePlate,
    readSlot,
    contiguous,
    writeAppearance,
    syncCars
  });
})();
