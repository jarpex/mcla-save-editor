"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const { ROOT, loadMCLA, buildSyntheticSave } = require("./loader.js");

const MCLA = loadMCLA();
const { OFF, CAREER_RECORDS, CAR_ORDER_NAMES, RACE_NAMES } = MCLA.data;
const {
  openBuffer, sec, setU32, setU8, u32,
  scanStats, statName, statRead, statWrite, collectFound, collectSet, syncGcol,
  progTotal, progAt, progSetAll, ttBase, statAlloc, careerRead, careerWrite
} = MCLA.format;
const { STR, buildAlmanac, computeCoverage } = MCLA.ui;

describe("Stats, Career, Almanac & i18n", () => {
  it("scans Stats rows aligned to (absOffset % 16) === 2 and syncs gCOL", () => {
    const { buf, at } = buildSyntheticSave();
    const ctx = openBuffer(buf);
    const start = at.Stats + (((2 - (at.Stats % 16)) % 16) + 16) % 16;

    const writeRow = (idx, code, kind, val) => {
      const o = start + idx * 16;
      for (let i = 0; i < 4; i++) ctx.bytes[o + i] = code.charCodeAt(i);
      ctx.bytes[o + 8] = kind;
      setU32(o + 12, val, ctx);
    };

    writeRow(0, "gWIN", 0x29, 12);
    writeRow(1, "gCOL", 0x29, 0);
    setU8(at.LocalOptions + OFF.collect + 3, 1, ctx);
    setU8(at.LocalOptions + OFF.collect + 10, 1, ctx);

    const stats = scanStats(ctx);
    assert.equal(stats.length, 2);
    assert.equal(statRead(stats[0], ctx), 12);
    assert.equal(statRead(stats[1], ctx), "2");
    assert.equal(statWrite(stats[1], "99", ctx), false);

    assert.equal(syncGcol(stats, ctx), 2);
    assert.equal(u32(stats[1].at + 12, ctx), 2);

    collectSet(1, ctx);
    assert.equal(collectFound(ctx), 60);
  });

  it("toggles progression at +64 and finds shifted ttBase", () => {
    const { buf } = buildSyntheticSave({ ttOffset: 0x7291 });
    const ctx = openBuffer(buf);
    assert.equal(progTotal(ctx), 43);
    progSetAll(1, ctx);
    assert.equal(ctx.bytes[progAt(0, ctx)], 1);
    assert.equal(ctx.bytes[progAt(42, ctx)], 1);

    assert.equal(ttBase(ctx), 0x7291);
  });

  it("allocates missing career rows via statAlloc and formats time/hours", () => {
    const { buf } = buildSyntheticSave();
    const ctx = openBuffer(buf);
    const ttRec = CAREER_RECORDS.find((r) => r.code === "k:TB" && r.occ === 0);
    const hrsRec = CAREER_RECORDS.find((r) => r.code === "khTC");

    assert.equal(careerRead(ttRec, ctx), "");
    assert.equal(careerWrite(ttRec, "2:11.83", ctx), true);
    assert.equal(careerRead(ttRec, ctx), "02:11.83");

    assert.equal(careerWrite(hrsRec, "10:35", ctx), true);
    assert.equal(careerRead(hrsRec, ctx), "10:35");
  });

  it("tiles the entire file in buildAlmanac with zero gaps or overlaps", () => {
    const { buf } = buildSyntheticSave();
    const ctx = openBuffer(buf);
    const tree = buildAlmanac(ctx);
    let cursor = 0;
    for (const node of tree) {
      assert.equal(node.at, cursor);
      cursor += node.size;
    }
    assert.equal(cursor, buf.byteLength);

    const cov = computeCoverage(ctx, scanStats(ctx));
    assert.equal(cov.total, buf.byteLength);
    assert.ok(cov.known > 0 && cov.pct > 0);
  });

  it("keeps complete vehicle/race lists and i18n key parity", () => {
    assert.equal(CAR_ORDER_NAMES.length, 67);
    assert.equal(RACE_NAMES.length, 69);
    assert.equal(RACE_NAMES.filter(Boolean).length, 68);

    const enKeys = Object.keys(STR.en);
    for (const lang of ["ru", "pt"]) {
      const missing = enKeys.filter((k) => !(k in STR[lang]));
      assert.deepEqual(missing, [], `Missing keys in STR.${lang}`);
    }
  });

  const textedPath = path.join(ROOT, "Saves example", "mc4.sav.TEXTED");
  it("reads real fixture mc4.sav.TEXTED accurately", { skip: !fs.existsSync(textedPath) }, () => {
    const raw = fs.readFileSync(textedPath);
    const buf = raw.buffer.slice(raw.byteOffset, raw.byteOffset + raw.byteLength);
    const ctx = openBuffer(buf, "mc4.sav.TEXTED");
    assert.equal(ctx.secs.valid, true);

    const stats = scanStats(ctx);
    const vkdt = stats.filter((r) => r.key === "vkDT");
    const rti = stats.filter((r) => r.key === "r:TI");
    assert.equal(vkdt.length, 67);
    assert.equal(rti.length, 69);
    assert.equal(statName(rti[45]), "Coldwater Canyon");
    assert.equal(statRead(rti[45], ctx), "03:15.59");
    assert.equal(collectFound(ctx), 6);

    const tree = buildAlmanac(ctx);
    assert.equal(tree.reduce((s, n) => s + n.size, 0), raw.byteLength);
  });
});
