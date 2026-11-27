"use strict";

const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const { loadMCLA, buildSyntheticSave } = require("./loader.js");

const MCLA = loadMCLA();
const { parse, openBuffer, sec, u32, setU32, f32, setF32, ascii, writeField } = MCLA.format;

describe("Binary container & primitives", () => {
  it("parses a valid synthetic save to exact EOF", () => {
    const { buf } = buildSyntheticSave();
    const res = parse(buf);
    assert.equal(res.valid, true);
    assert.equal(res.endedAt, buf.byteLength);
    assert.deepEqual(res.list.map((s) => s.name), ["Stats", "LocalOptions", "Career"]);
  });

  it("rejects truncated or trailing-garbage saves", () => {
    const { buf } = buildSyntheticSave();
    const truncated = buf.slice(0, buf.byteLength - 10);
    assert.equal(parse(truncated).valid, false);

    const extended = new Uint8Array(buf.byteLength + 4);
    extended.set(new Uint8Array(buf));
    assert.equal(parse(extended.buffer).valid, false);
  });

  it("reads and writes big-endian u32/f32 and 0xCD-padded ASCII fields", () => {
    const { buf, at } = buildSyntheticSave();
    const ctx = openBuffer(buf);
    assert.equal(sec("Career", ctx).data, at.Career);

    setU32(at.Career + 0x2D9, 987654321, ctx);
    assert.equal(u32(at.Career + 0x2D9, ctx), 987654321);

    setF32(at.Stats, 12.5, ctx);
    assert.equal(f32(at.Stats, ctx), 12.5);

    writeField(at.LocalOptions + 0x24FD, 16, "vp_vw_golf_83", ctx);
    assert.equal(ascii(at.LocalOptions + 0x24FD, 16, ctx), "vp_vw_golf_83");
    assert.equal(ctx.bytes[at.LocalOptions + 0x24FD + 13], 0x00);
    assert.equal(ctx.bytes[at.LocalOptions + 0x24FD + 14], 0xCD);
    assert.equal(ctx.bytes[at.LocalOptions + 0x24FD + 15], 0xCD);
  });
});
