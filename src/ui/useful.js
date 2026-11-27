(() => {
  "use strict";

  const {
    OFF, TUNE_CATS, MOTO_CATS, MOTO, DEFAULT_CAR_PERF, DEFAULT_MOTO_PERF,
    ROSTER, CAR_TITLES, VEHICLE_CLASS, VEHICLE_PERF_STATS, TUNE_VENDORS, STOCK_APPEARANCE,
    CAR_PERF_WEIGHTS, STAT_NAMES, RACE_NAMES, RACE_GROUPS
  } = MCLA.data;
  const { tuneMaxByte } = MCLA.format;
  const { el, t } = MCLA.ui;

  const USEFUL_ICONS = {
    car: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" ' +
      'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      '<path d="M3 13h18"/><path d="M5 13l1.7-3.5A2 2 0 0 1 8.5 8.3h7a2 2 0 0 1 1.8 1.2L19 13"/>' +
      '<path d="M4 13v3.2h16V13"/><circle cx="7.6" cy="16.4" r="1.5"/>' +
      '<circle cx="16.4" cy="16.4" r="1.5"/></svg>',
    moto: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" ' +
      'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      '<circle cx="5.6" cy="16.2" r="2.7"/><circle cx="18.4" cy="16.2" r="2.7"/>' +
      '<path d="M5.6 16.2l4.2-5.4h3.6l5 5.4"/><path d="M9.8 10.8h3.4"/>' +
      '<path d="M15.2 8.4h2.2"/></svg>'
  };

  const usefulClass = (car) => VEHICLE_CLASS[car] ? `useful_${VEHICLE_CLASS[car][0]}` : "usefulOther";
  const usefulGroup = (car) => VEHICLE_CLASS[car] ? `${t("usefulGroup")} ${VEHICLE_CLASS[car][1]}` : "-";
  const usefulIsBike = (car) => Boolean(VEHICLE_CLASS[car] && VEHICLE_CLASS[car][0] === "bikes");

  function usefulPerf(car) {
    const p = VEHICLE_PERF_STATS[car];
    if (p === null) return null;
    return p || (MOTO[car] ? DEFAULT_MOTO_PERF : DEFAULT_CAR_PERF);
  }

  function usefulRange(car, axis) {
    const r = usefulPerf(car)[axis];
    return r ? `${r[0]} \u2192 ${r[1]}` : "-";
  }

  function usefulFits(catIdx) {
    let boxes = `<span class="useful-fit" title="${t("usefulCar")}"><span class="useful-box">${USEFUL_ICONS.car}</span></span>`;
    if (MOTO_CATS.includes(catIdx)) {
      boxes += `<span class="useful-fit" title="${t("usefulMoto")}"><span class="useful-box">${USEFUL_ICONS.moto}</span></span>`;
    }
    return { html: `<span class="useful-fits">${boxes}</span>` };
  }

  function usefulShare(catIdx, axis) {
    const w = CAR_PERF_WEIGHTS[catIdx];
    if (!w || !w[axis]) return null;
    return Math.round(((w[axis] / tuneMaxByte()) * 10000)) / 100;
  }

  const usefulPct = (v) => v == null ? "-" : (v === 0 ? "0" : `+${v}%`);

  function usefulRaw(catIdx) {
    const lv = (OFF.tuneLv + catIdx).toString(16).toUpperCase();
    const vd = (OFF.tuneVendor + catIdx).toString(16).toUpperCase();
    const fl = (OFF.tuneVendorF + catIdx * 4).toString(16).toUpperCase();
    return {
      html: `<span class="useful-raw"><span>lv +0x${lv} u8</span><span>vnd +0x${vd} u8</span><span>flt +0x${fl} f32</span></span>`
    };
  }

  function usefulVendorSelect(catIdx) {
    const v = TUNE_VENDORS[catIdx];
    if (!v) return { html: `<span class="useful-none">${t("usefulNone")}</span>` };

    const opt = (idx, name, f) =>
      `<option value="${idx}" data-idx="${idx}" data-float="${f}" data-total="${(idx + f).toFixed(4)}">${name}</option>`;
    const readout = (idx, f) =>
      `<span class="useful-calc"><span class="useful-cap">${t("usefulValue")}</span>` +
      `<span class="useful-term">idx ${idx}</span><span class="useful-term">flt ${f.toFixed(4)}</span>` +
      `<span class="useful-total">${(idx + f).toFixed(4)}</span></span>`;

    let opts = `<option value="stock" data-idx="0" data-float="${v.stock}" data-total="${v.stock.toFixed(4)}">${t("usefulStock")}</option>`;
    v.names.forEach((n, i) => {
      if (v.floats[i] != null) opts += opt(i, n, v.floats[i]);
    });
    return {
      html: `<span class="useful-sel"><select class="useful-select" data-cat="${catIdx}">${opts}</select>${readout(0, v.stock)}</span>`
    };
  }

  function buildUseful() {
    const groups = [];
    const cars = [];
    const bikes = [];

    for (const car of ROSTER) {
      const perf = usefulPerf(car);
      const row = {
        cells: [
          { text: car, mono: true },
          { text: CAR_TITLES[car] || "" },
          { text: t(usefulClass(car)) },
          { text: usefulGroup(car) },
          { text: perf ? usefulRange(car, "accel") : t("usefulNoData") },
          { text: perf ? usefulRange(car, "speed") : t("usefulNoData") },
          { text: perf ? usefulRange(car, "hand") : t("usefulNoData") }
        ]
      };
      (usefulIsBike(car) ? bikes : cars).push(row);
    }

    groups.push({
      k: "usefulRoster", note: "usefulRosterNote",
      head: ["usefulInternal", "usefulTitle", "usefulClass", "usefulGroup", "usefulAccel", "usefulSpeed", "usefulHand"],
      rows: cars
    });
    groups.push({
      k: "usefulBikes", note: "usefulBikesNote",
      head: ["usefulInternal", "usefulTitle", "usefulClass", "usefulGroup", "usefulAccel", "usefulSpeed", "usefulHand"],
      rows: bikes
    });

    const cats = TUNE_CATS.map((name, i) => {
      const w = CAR_PERF_WEIGHTS[i];
      const dynoPct = w && w.dynoY ? `+${Math.round((w.dynoY / tuneMaxByte()) * 10000) / 100}%` : "0";
      return {
        cells: [
          { text: String(i) },
          { text: i === 5 ? `${name} / Jet Kits` : name },
          usefulFits(i),
          { text: usefulPct(usefulShare(i, "acc")) },
          { text: usefulPct(usefulShare(i, "spd")) },
          { text: usefulPct(usefulShare(i, "hnd")) },
          { text: dynoPct },
          usefulRaw(i),
          usefulVendorSelect(i)
        ]
      };
    });
    groups.push({
      k: "usefulCats", note: "usefulCatsNote",
      head: ["usefulIdx", "usefulPart", "usefulFits", "usefulAccel", "usefulSpeed", "usefulHand", "usefulDynoY", "usefulRaw", "usefulVendors"],
      rows: cats
    });

    const mechRows = [
      ["usefulMechEndian", "Big-Endian (u16, u32, f32). parse() walks 8-byte header + sections [u32 nameLen(1..64), ASCII, u8 flag, u32 size] to exact EOF."],
      ["usefulMechPath", "userdata\\B13EBABEBABEBABE\\545407F8\\00000001\\mc4.sav\\mc4.sav"],
      ["usefulMechStrings", "0x00 terminator + 0xCD padding (writeField). Empty garage slot = \"blank\". autoLabel: ^vp_[a-z0-9]+_(.+?)_(\\d{2})(_DUB)?$."],
      ["usefulMechPlates", "7 bytes at slotAt(n) - 8176 + 2186 (1 stride back). Space (0x20) is stored as 0x3E ('>'); unused bytes = 0x00 or 0xCD."],
      ["usefulMechGarage", "cars (LocalOptions+0x53F, u8) = contiguous non-blank slots; carsIdx (+0x543, u32) = max(0, n-1). Truncated last slot valid if 32B name fits."],
      ["usefulMechTunePct", "lv = 0..2 (Stock=0, Lv2=1, Lv3=2). pct = floor(sum(min(2, lv[i])) * 100 / (2 * (N-1))), N=13 cars / 6 bikes; Tires (12) excluded."],
      ["usefulMechVendors", "Value = vendor idx (u8 +0x6E) + float (f32 +0x27). Stock = lv 0, idx 0, float = v.stock (0.6789 for Exhaust)."],
      ["usefulMechDyno", "Perf = round(stock + (max-stock) * sum(w * lv/2)). Dyno: Scirocco refPeakY=2.204, stockPeakX=3.60, Electronics +0.90X, torqueExp=0.85, hpExp=1.15, Catmull-Rom. Fallbacks: Car [34..66,38..70,28..56], Moto [65..86,40..56,48..72]."],
      ["usefulMechWallet", "MAX_WALLET = 2,000,000,000 (u32). Reputation bar: 10 segments x 2,500 REP (0..25,000)."],
      ["usefulMechCareer", "progAt(i) = Career+0x2E9 + i*65 + 64 (u8 0/1). ttBase() scans for 4 u32 [10000..400000] + 16 u32 ([10000..400000] or 0); shifts +0x727D -> +0x7291."],
      ["usefulMechStats", "16B rows starting at (absOffset % 16) === 2 (~1056 slots, sparse statAlloc). Kind: 0x29 u32, 0x28/0x00 f32. gCOL = count of 1s in LocalOptions+0x3DF84 (60B)."]
    ].map(([k, rule]) => ({ cells: [{ text: t(k) }, { text: rule, mono: true }] }));
    groups.push({ k: "usefulMech", note: "usefulMechNote", head: ["usefulTopic", "usefulRule"], rows: mechRows });

    const hexList = (arr) => arr.map((b) => `0x${b < 16 ? "0" : ""}${b.toString(16).toUpperCase()}`).join(" ");
    const appRows = ROSTER.map((car) => {
      const p = STOCK_APPEARANCE[car];
      return {
        cells: [
          { text: car, mono: true },
          { text: CAR_TITLES[car] || "" },
          { text: p ? hexList(p.slice(0, 4)) : t("usefulNoData"), mono: Boolean(p) },
          { text: p ? hexList(p.slice(4, 10)) : "-", mono: Boolean(p) },
          { text: p ? hexList(p.slice(10, 12)) : "-", mono: Boolean(p) }
        ]
      };
    });
    groups.push({
      k: "usefulAppear", note: "usefulAppearNote",
      head: ["usefulInternal", "usefulTitle", "usefulAppDetail", "usefulAppWheel", "usefulAppDia"],
      rows: appRows
    });

    const fourccRows = Object.keys(STAT_NAMES).map((k) => {
      const grp = k.startsWith("g") ? "Game" : (k.startsWith("k") ? "Career" : (k.startsWith("v") ? "Vehicle" : "Race"));
      const note = k === "k:TB" ? "x5 (Time Trials)"
                 : k === "k$WA" ? "x4 (Wagers)"
                 : k === "vWIN" ? "sparse (winners only)"
                 : k === "vkDT" ? "x67 (CAR_ORDER_NAMES)"
                 : k === "r:TI" ? "x69 (RACE_NAMES, ms)"
                 : (k === "ghTC" || k === "ghTP" || k === "khTC") ? "f32 hours (h:mm)"
                 : k === "gCOL" ? "synced with LocalOptions+0x3DF84"
                 : "-";
      return { cells: [{ text: k, mono: true }, { text: grp }, { text: STAT_NAMES[k] }, { text: note, mono: true }] };
    });
    fourccRows.push({
      cells: [
        { text: "a* / t* / x*", mono: true },
        { text: "Unnamed" },
        { text: t("usefulFourccUnnamed") },
        { text: "a* (15), t* (33), x* (14)", mono: true }
      ]
    });
    groups.push({ k: "usefulFourcc", note: "usefulFourccNote", head: ["offStatKey", "usefulGroup", "usefulTitle", "usefulNoteCol"], rows: fourccRows });

    const groupByOcc = {};
    for (const g of RACE_GROUPS) {
      for (const o of g.occ) groupByOcc[o] = t(g.label);
    }
    const raceRows = RACE_NAMES.map((name, i) => ({
      cells: [{ text: String(i), mono: true }, { text: groupByOcc[i] || "-" }, { text: name || `(${t("docRowUnnamed")})` }]
    }));
    groups.push({ k: "usefulRaces", note: "usefulRacesNote", head: ["usefulIdx", "usefulGroup", "usefulTitle"], rows: raceRows });

    return groups;
  }

  const USEFUL_DATA = new WeakMap();

  function hydrateUsefulGroup(groupEl) {
    const entry = USEFUL_DATA.get(groupEl);
    if (!entry || entry.hydrated) return;
    entry.hydrated = true;

    const g = entry.group;
    const inner = groupEl.querySelector(".doc-inner");
    const note = g.note ? `<p class="doc-note">${t(g.note)}</p>` : "";
    const cols = g.head.map((h) => `<th>${t(h)}</th>`).join("");
    const body = g.rows.map((row) =>
      `<tr>${row.cells.map((c) => {
        const innerCell = c.html != null ? c.html : `<span class="${c.mono ? "mono" : ""}">${c.text}</span>`;
        return `<td>${innerCell}</td>`;
      }).join("")}</tr>`
    ).join("");
    inner.innerHTML = `${note}<table class="offsets useful-table"><thead><tr>${cols}</tr></thead><tbody>${body}</tbody></table>`;

    inner.querySelectorAll(".useful-select").forEach((sel) => {
      sel.addEventListener("change", () => {
        const opt = sel.options[sel.selectedIndex];
        const box = sel.parentNode.querySelector(".useful-calc");
        if (!box) return;
        const terms = box.querySelectorAll(".useful-term");
        terms[0].textContent = `idx ${opt.getAttribute("data-idx")}`;
        terms[1].textContent = `flt ${Number(opt.getAttribute("data-float")).toFixed(4)}`;
        box.querySelector(".useful-total").textContent = opt.getAttribute("data-total");
      });
    });
  }

  function renderUseful() {
    const host = el("useful");
    if (!host) return;
    const groups = buildUseful();
    host.innerHTML = "";
    const frag = document.createDocumentFragment();
    for (const g of groups) {
      const grp = document.createElement("div");
      grp.className = "doc-group";
      grp.innerHTML =
        `<div class="doc-head"><span class="chev">&gt;</span><span>${t(g.k)}</span><span class="group-count">${g.rows.length}</span></div>` +
        `<div class="doc-body"><div class="doc-inner"></div></div>`;
      USEFUL_DATA.set(grp, { group: g, hydrated: false });
      frag.appendChild(grp);
    }
    host.appendChild(frag);
    el("useCount").textContent = `${groups.length} ${t("alnBlocks")}`;
  }

  Object.assign(MCLA.ui, { buildUseful, renderUseful, hydrateUsefulGroup });
})();
