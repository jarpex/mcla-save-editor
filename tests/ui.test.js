"use strict";

const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const { ROOT, buildSyntheticSave } = require("./loader.js");
const { createBrowserEnv } = require("./dom-mock.js");

const { doc, scripts, MCLA } = createBrowserEnv(ROOT);

describe("Full browser boot & UI flows (all 22 scripts)", () => {
  it("boots cleanly with English default and all scripts registered", () => {
    assert.equal(scripts.length, 22);
    assert.equal(MCLA.state.lang, "en");
    assert.equal(doc.getElementById("langCode").textContent, "EN");
    assert.equal(typeof MCLA.ui.paintXray, "function");
    assert.equal(typeof MCLA.ui.openPerformanceShop, "function");
  });

  it("loads a save, edits wallet, garage, Performance Shop, career and lazy Hex Sections", () => {
    const { buf } = buildSyntheticSave();
    const { OFF } = MCLA.data;
    const { u32, sec } = MCLA.format;

    /* Simulate file drop/load via FileReader. */
    const fileInput = doc.getElementById("file");
    fileInput.files = [{ name: "mc4.sav", _buf: buf }];
    fileInput.dispatchEvent({ type: "change" });

    assert.equal(doc.getElementById("empty").hidden, true);
    assert.equal(doc.getElementById("editor").hidden, false);
    assert.equal(MCLA.state.sectionsDirty, true);

    /* Wallet preset button */
    const add1M = doc.querySelector('[data-add-money="1000000"]');
    add1M.click();
    assert.equal(u32(sec("Career").data + OFF.money), 1123456);

    /* Assign car to slot 0 and open Performance Shop (exercises xray.js + shop.js) */
    const slot0Select = doc.querySelector('select[data-slot="0"]');
    slot0Select.value = "vp_vw_golf_83";
    slot0Select.dispatchEvent({ type: "change" });

    const tuneBtn = doc.querySelector('button[data-tune="0"]');
    tuneBtn.click();
    assert.equal(MCLA.ui.isShopOpen(), true);
    assert.ok(doc.getElementById("shopSchematic").innerHTML.includes("<svg"));

    /* Auto-upgrade and commit */
    doc.getElementById("shopAutoBtn").click();
    doc.getElementById("shopAcceptBtn").click();
    assert.equal(MCLA.ui.isShopOpen(), false);
    assert.equal(MCLA.format.tunePctAt(0), 100);

    /* Switch to Hex Sections tab -> triggers lazy renderSectionsAsync */
    const sectionsTab = doc.querySelector('.tab-btn[data-tab="sections"]');
    sectionsTab.click();
    assert.equal(MCLA.state.sectionsDirty, false);
    assert.ok(doc.getElementById("almanac").children.length > 0);
    assert.equal(doc.getElementById("useful").children.length, 7);

    /* Expand first Almanac node and first Useful Data group */
    const firstAlnHead = doc.getElementById("almanac").querySelector(".aln-head");
    firstAlnHead.click();
    assert.equal(firstAlnHead.parentElement.classList.contains("open"), true);

    const firstUsefulHead = doc.getElementById("useful").querySelector(".doc-head");
    firstUsefulHead.click();
    assert.equal(firstUsefulHead.parentElement.classList.contains("open"), true);
    assert.ok(firstUsefulHead.parentElement.querySelector("table"));

    /* Switch language to RU and back to EN */
    doc.querySelector('[data-set-lang="ru"]').click();
    assert.equal(MCLA.state.lang, "ru");
    doc.querySelector('[data-set-lang="en"]').click();
    assert.equal(MCLA.state.lang, "en");
  });
});
