"use strict";

const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.join(__dirname, "..");

let loaded = false;

function loadMCLA() {
  if (loaded) return globalThis.MCLA;
  const files = [
    "src/namespace.js",
    "src/data/offsets.js",
    "src/data/vehicles.js",
    "src/data/stats-meta.js",
    "src/data/perf.js",
    "src/format/binary.js",
    "src/format/slots.js",
    "src/format/tuning.js",
    "src/format/stats.js",
    "src/format/career.js",
    "src/ui/i18n.js",
    "src/ui/almanac.js",
    "src/ui/coverage.js"
  ];
  for (const rel of files) {
    require(path.join(ROOT, rel));
  }
  loaded = true;
  return globalThis.MCLA;
}

function buildSyntheticSave({ careerSize = 30000, localSize = 0x3E000, statsSize = 2048, ttOffset = 0x727D } = {}) {
  const secs = [
    { name: "Stats", flag: 1, size: statsSize },
    { name: "LocalOptions", flag: 9, size: localSize },
    { name: "Career", flag: 11, size: careerSize }
  ];

  let total = 8;
  for (const s of secs) total += 4 + s.name.length + 1 + 4 + s.size;

  const buf = new ArrayBuffer(total);
  const b = new Uint8Array(buf);
  const dv = new DataView(buf);
  const at = {};

  dv.setUint32(0, 0x0E);
  dv.setUint32(4, secs.length);

  let o = 8;
  for (const s of secs) {
    dv.setUint32(o, s.name.length);
    for (let i = 0; i < s.name.length; i++) b[o + 4 + i] = s.name.charCodeAt(i);
    b[o + 4 + s.name.length] = s.flag;
    dv.setUint32(o + 4 + s.name.length + 1, s.size);
    at[s.name] = o + 4 + s.name.length + 5;
    o = at[s.name] + s.size;
  }

  dv.setUint32(at.Career + 0x2D9, 123456);
  dv.setUint32(at.Career + 0x2E1, 2050);
  dv.setUint32(at.Career + 0x2E5, 43);

  [128540, 150000, 137000, 115000].forEach((v, i) => {
    dv.setUint32(at.Career + ttOffset + i * 4, v);
  });

  b[at.LocalOptions + 0x53F] = 1;
  b[at.LocalOptions + 0x543] = 0;

  return { buf, at };
}

module.exports = { ROOT, loadMCLA, buildSyntheticSave };
