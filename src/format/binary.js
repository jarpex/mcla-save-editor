(() => {
  "use strict";

  /* mc4.sav layout (Big-Endian, PowerPC):
     header: u32 capacity | u32 sectionCount
     section: u32 nameLen | ASCII name | u8 flag | u32 size | data[size] */
  function parse(buf) {
    const b = new Uint8Array(buf);
    const dv = new DataView(buf);
    const list = [];
    let o = 8;
    while (o + 4 <= b.length) {
      const nameLen = dv.getUint32(o);
      if (nameLen === 0 || nameLen > 64) break;
      if (o + 4 + nameLen + 5 > b.length) break;
      let name = "";
      let ok = true;
      for (let i = 0; i < nameLen; i++) {
        const c = b[o + 4 + i];
        if (c < 0x20 || c > 0x7E) { ok = false; break; }
        name += String.fromCharCode(c);
      }
      if (!ok) break;
      const size = dv.getUint32(o + 4 + nameLen + 1);
      const data = o + 4 + nameLen + 5;
      if (data + size > b.length) break;
      list.push({ name, flag: b[o + 4 + nameLen], size, data });
      o = data + size;
    }
    return { list, endedAt: o, valid: o === b.length && list.length > 0 };
  }

  function openBuffer(buf, fileName = "mc4.sav") {
    const secs = parse(buf);
    return {
      bytes: new Uint8Array(buf),
      view: new DataView(buf),
      secs,
      fileName,
      ttBase: null
    };
  }

  const sec = (name, ctx = MCLA.state) =>
    ctx.secs.list.find((s) => s.name === name) || null;

  const u32 = (at, ctx = MCLA.state) => ctx.view.getUint32(at);
  const setU32 = (at, v, ctx = MCLA.state) => ctx.view.setUint32(at, v >>> 0);
  const f32 = (at, ctx = MCLA.state) => ctx.view.getFloat32(at);
  const setF32 = (at, v, ctx = MCLA.state) => ctx.view.setFloat32(at, v);
  const setU8 = (at, v, ctx = MCLA.state) => ctx.view.setUint8(at, v & 0xFF);

  function ascii(from, len, ctx = MCLA.state) {
    let out = "";
    for (let i = 0; i < len; i++) {
      const c = ctx.bytes[from + i];
      if (c < 0x20 || c > 0x7E) break;
      out += String.fromCharCode(c);
    }
    return out;
  }

  function writeField(at, width, text, ctx = MCLA.state) {
    for (let i = 0; i < width; i++) {
      ctx.bytes[at + i] = i < text.length
        ? text.charCodeAt(i)
        : (i === text.length ? 0 : 0xCD);
    }
  }

  Object.assign(MCLA.format, {
    parse,
    openBuffer,
    sec,
    u32,
    setU32,
    f32,
    setF32,
    setU8,
    ascii,
    writeField
  });
})();
