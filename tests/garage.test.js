"use strict";

const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const { loadMCLA, buildSyntheticSave } = require("./loader.js");

const MCLA = loadMCLA();
const { OFF, TUNE_VENDORS, calcCarPerformanceStats, calcDynoModel } = MCLA.data;
const {
  openBuffer, writeField, f32,
  slotAt, slotCount, contiguous, syncCars, readSlot, plateAt, plateFrom, writePlate, writeAppearance, autoLabel,
  tuneAt, tunePctAt, tuneSet, maxTune, clearTune, tuneVendorAt, tuneVendorSet, tuneInfo
} = MCLA.format;

describe("Garage slots, plates, appearance & tuning", () => {
  it("counts truncated final slot when 32-byte prefab fits", () => {
    const { buf } = buildSyntheticSave({ localSize: OFF.slot0 + OFF.slotStride + 32 });
    const ctx = openBuffer(buf);
    assert.equal(slotCount(ctx), 2);

    const { buf: bufShort } = buildSyntheticSave({ localSize: OFF.slot0 + OFF.slotStride + 31 });
    assert.equal(slotCount(openBuffer(bufShort)), 1);
  });

  it("encodes and decodes license plates with 0x3E space", () => {
    const { buf } = buildSyntheticSave();
    const ctx = openBuffer(buf);
    assert.deepEqual(plateFrom("MC LA 1"), [77, 67, 0x3E, 76, 65, 0x3E, 49]);
    writePlate(0, "MC LA 1", ctx);
    assert.equal(plateAt(0, ctx), "MC LA 1");
  });

  it("tracks contiguous cars and syncs cars / carsIdx", () => {
    const { buf } = buildSyntheticSave();
    const ctx = openBuffer(buf);
    writeField(slotAt(0, ctx), 32, "vp_vw_golf_83", ctx);
    writeField(slotAt(1, ctx), 32, "vp_nsn_240sx_98", ctx);
    writeField(slotAt(2, ctx), 32, "blank", ctx);
    writeField(slotAt(3, ctx), 32, "vp_aud_r8_08", ctx);

    assert.equal(contiguous(ctx), 2);
    const n = syncCars(ctx);
    assert.equal(n, 2);
    assert.equal(ctx.bytes[MCLA.format.sec("LocalOptions", ctx).data + OFF.cars], 2);
    assert.equal(ctx.bytes[MCLA.format.sec("LocalOptions", ctx).data + OFF.carsIdx], 1);
    assert.equal(readSlot(2, ctx).car, "");
  });

  it("computes tune percentage excluding Tires (cars 13 vs bikes 6)", () => {
    const { buf } = buildSyntheticSave();
    const ctx = openBuffer(buf);
    writeField(slotAt(0, ctx), 32, "vp_vw_golf_83", ctx);
    writeField(slotAt(1, ctx), 32, "vp_duc_999r_06", ctx);

    /* Setting Tires (index 12) alone must leave pct at 0%. */
    tuneSet(0, 12, 3, ctx);
    assert.equal(tunePctAt(0, ctx), 0);

    assert.equal(maxTune(0, ctx), 100);
    assert.equal(maxTune(1, ctx), 100);
    assert.equal(tuneInfo(1, ctx).cats.find((c) => c.idx === 5).name, "Jet Kits");

    clearTune(0, ctx);
    assert.equal(tunePctAt(0, ctx), 0);
    assert.equal(ctx.bytes[tuneAt(0, ctx) + OFF.tunePct], 0);
  });

  it("writes vendor byte + float and resets to stock float", () => {
    const { buf } = buildSyntheticSave();
    const ctx = openBuffer(buf);
    tuneVendorSet(0, 0, 2, ctx);
    assert.equal(tuneVendorAt(0, 0, ctx), 2);
    assert.ok(Math.abs(f32(tuneAt(0, ctx) + OFF.tuneVendorF, ctx) - TUNE_VENDORS[0].floats[2]) < 1e-4);

    tuneVendorSet(0, 0, null, ctx);
    assert.equal(tuneVendorAt(0, 0, ctx), 0);
    assert.ok(Math.abs(f32(tuneAt(0, ctx) + OFF.tuneVendorF, ctx) - TUNE_VENDORS[0].stock) < 1e-4);
  });

  it("writes stock appearance and generates autoLabel", () => {
    const { buf } = buildSyntheticSave();
    const ctx = openBuffer(buf);
    writeAppearance(slotAt(0, ctx), "vp_vw_golf_83", ctx);
    assert.equal(ctx.bytes[slotAt(0, ctx) + OFF.appear[0]], 0x03);
    assert.equal(autoLabel("vp_lam_murcielago_06_DUB"), "06 MURCIELAGO DUB");
  });

  it("calculates car performance stats and dyno curve", () => {
    const stock = { acc: 23, spd: 30, hand: 13 };
    const max = { acc: 37, spd: 48, hand: 27 };
    const lv = new Array(13).fill(2);
    const res = calcCarPerformanceStats(
      { acc: stock.acc, spd: stock.spd, hnd: stock.hand },
      { acc: max.acc, spd: max.spd, hnd: max.hand },
      lv, 2
    );
    assert.equal(res.acc.value, 37);
    assert.equal(res.spd.value, 48);
    assert.equal(res.hnd.value, 27);

    const dyno = calcDynoModel({ acc: stock.acc, spd: stock.spd }, { acc: max.acc, spd: max.spd }, lv, 2);
    assert.ok(Math.abs(dyno.xPeak - 4.5) < 1e-6);
    assert.ok(dyno.torquePoints.length > 10);
  });
});
