(() => {
  "use strict";

  const { OFF, RACE_TARGETS, CAR_TITLES } = MCLA.data;
  const { ascii, progTotal, ttBase, statName, statsStartOffset } = MCLA.format;
  const { el, t, nf } = MCLA.ui;

  const almanacNode = (k, at, size, type = "docTUnknown", extra = null) =>
    Object.assign({ k, at, size, type }, extra);

  const almanacUnknown = (at, size) => almanacNode("docUnknown", at, size, "docTUnknown");

  function almanacFill(nodes, from, to) {
    const out = [];
    let cursor = from;
    for (const n of nodes) {
      if (n.at > cursor) out.push(almanacUnknown(cursor, n.at - cursor));
      out.push(n);
      cursor = Math.max(cursor, n.at + n.size);
    }
    if (cursor < to) out.push(almanacUnknown(cursor, to - cursor));
    return out;
  }

  function almanacStatsRows(start, count, ctx) {
    const out = [];
    const seen = {};
    for (let i = 0; i < count; i++) {
      const at = start + i * 16;
      const key = ascii(at, 4, ctx);
      const kind = ctx.bytes[at + 8];
      const type = (kind === 0x28 || kind === 0x00) ? "docTFloat"
                 : (kind === 0x29 ? "docTU32" : "docTUnknown");
      const named = /^[A-Za-z][A-Za-z0-9$%:]{3}$/.test(key);
      const occ = named ? (seen[key] || 0) : 0;
      if (named) seen[key] = occ + 1;
      const label = named ? (statName({ key, occ }) || key) : "docRowUnnamed";
      out.push(almanacNode(named ? key : "docRowUnnamed", at, 16, "docTRecRow", {
        label,
        rows: [
          { at, size: 4, type: "docTFourCC", k: "docRowKey" },
          { at: at + 4, size: 4, type: "docTUnknown", k: "docRowPad" },
          { at: at + 8, size: 1, type: "docTU8", k: "docRowKind" },
          { at: at + 9, size: 3, type: "docTUnknown", k: "docRowPad3" },
          { at: at + 12, size: 4, type, k: "docRowVal" }
        ]
      }));
    }
    return out;
  }

  function almanacStats(base, size, ctx) {
    const rowsStart = statsStartOffset({ data: base });
    const count = Math.floor((base + size - rowsStart) / 16);
    const nodes = [];
    if (rowsStart > base) {
      nodes.push(almanacNode("docStatsPrefix", base, rowsStart - base, "docTUnknown"));
    }
    nodes.push(almanacNode("docStatsTable", rowsStart, count * 16, "docTRecTable", {
      note: "docStatsTableNote",
      children: almanacStatsRows(rowsStart, count, ctx)
    }));
    return almanacFill(nodes, base, base + size);
  }

  function almanacTuneRows(at, avail) {
    const rows = [];
    const add = (rel, size, type, k) => {
      if (rel + size <= avail) rows.push({ at: at + rel, size, type, k });
    };
    add(OFF.tuneVendorF, 52, "docTFloatArray", "offTuneVendorF");
    add(OFF.tuneLv, 13, "docTU8Array", "offTuneLv");
    add(OFF.tuneVendor, 13, "docTU8Array", "offTuneVendor");
    add(OFF.tunePct, 1, "docTU8", "offTunePct");
    return rows;
  }

  function almanacSlotRows(at, avail) {
    const rows = [];
    const add = (rel, size, type, k) => {
      if (rel + size <= avail) rows.push({ at: at + rel, size, type, k });
    };
    add(0, 32, "docTAscii", "offSlotName");
    add(OFF.slotLabel, 32, "docTAscii", "offSlotLabel");
    for (let ai = 0; ai < OFF.appear.length - 1; ai++) {
      const rel = OFF.appear[ai];
      const last = ai === OFF.appear.length - 2;
      add(rel, last ? 2 : 1, last ? "docTU16" : "docTU8",
        last ? "offAppearDia" : `offAppearAt${ai}`);
    }
    add(OFF.slotPlate - OFF.slotStride, 7, "docTAscii", "offPlateDoc");
    return rows;
  }

  function almanacCollectRows(at) {
    const rows = [];
    const zones = [["colHollywood", 20], ["colBeach", 15], ["colDowntown", 15], ["colHills", 10]];
    let rel = 0;
    for (const [key, count] of zones) {
      for (let i = 0; i < count; i++) {
        rows.push({
          at: at + rel + i,
          size: 1,
          type: "docTU8",
          k: key,
          label: `${t(key)} #${i + 1}`
        });
      }
      rel += count;
    }
    return rows;
  }

  function almanacLocal(base, size, ctx) {
    const end = base + size;
    const slot0 = base + OFF.slot0;
    const stride = OFF.slotStride;
    const tune0 = base + OFF.tuneBase;
    const nodes = [];

    nodes.push(almanacNode("docLocalHead", base, OFF.tuneBase, "docTUnknown", {
      rows: [
        { at: base + OFF.cars, size: 1, type: "docTU8", k: "offCars" },
        { at: base + OFF.carsIdx, size: 4, type: "docTU32", k: "offCarsIdx" }
      ]
    }));

    const recCount = Math.floor((end - tune0) / stride);
    const recs = [];
    for (let i = 0; i < recCount; i++) {
      const at = tune0 + i * stride;
      const avail = Math.min(stride, end - at);
      const slotAt = slot0 + (i - 1) * stride;
      const hasSlot = i >= 1 && slotAt < end;
      let rows = almanacTuneRows(at, avail);
      if (hasSlot) rows = rows.concat(almanacSlotRows(slotAt, avail));
      let car = hasSlot ? ascii(slotAt, 32, ctx) : "";
      if (car === "blank") car = "";
      const nice = car ? (CAR_TITLES[car] || car) : "";
      recs.push(almanacNode("docRecord", at, avail, "docTRecord", {
        note: hasSlot ? "docRecordNote" : "docRecordNote0",
        label: hasSlot
          ? `${t("docSlotRec")} ${i} \u00b7 ${nice || t("docSlotEmpty")}`
          : t("docRecord"),
        rows
      }));
    }

    nodes.push(almanacNode("docRecordArray", tune0, recCount * stride, "docTRecArray", {
      note: "docRecordArrayNote",
      extra: "docTuneFormula",
      children: recs
    }));

    const arrEnd = tune0 + recCount * stride;
    const colAt = base + OFF.collect;
    if (colAt > arrEnd) {
      nodes.push(almanacNode("docSlotTail", arrEnd, colAt - arrEnd, "docTBytes", {
        note: "docSlotTailNote"
      }));
    }
    if (colAt < end) {
      nodes.push(almanacNode("docCollect", colAt, Math.min(OFF.collectN, end - colAt), "docTFlagArray", {
        note: "docCollectNote",
        rows: almanacCollectRows(colAt)
      }));
    }

    return almanacFill(nodes, base, end);
  }

  function almanacCareer(base, size, ctx) {
    const end = base + size;
    const nodes = [];

    nodes.push(almanacNode("docCareerHead", base, OFF.progBase, "docTUnknown", {
      rows: [
        { at: base + OFF.money, size: 4, type: "docTU32", k: "offMoney" },
        { at: base + OFF.rep, size: 4, type: "docTU32", k: "offRep" },
        { at: base + OFF.ttRecord, size: 4, type: "docTU32", k: "offTtRecord" },
        { at: base + OFF.ttEventRec, size: 4, type: "docTU32", k: "offTtEventRec" }
      ]
    }));

    const pCount = progTotal(ctx);
    const blocks = [];
    for (let i = 0; i < pCount; i++) {
      const at = base + OFF.progBase + i * OFF.progStride;
      blocks.push(almanacNode("docProgBlock", at, OFF.progStride, "docTProgBlock", {
        rows: [
          { at, size: 4, type: "docTFourCC", k: "docProgId" },
          { at: at + 4, size: 1, type: "docTU8", k: "docProgState" },
          { at: at + 5, size: 4, type: "docTU32", k: "docProgValue" },
          { at: at + 9, size: 55, type: "docTUnknown", k: "docProgPad" },
          { at: at + 64, size: 1, type: "docTU8", k: "docProgDone" }
        ]
      }));
    }
    nodes.push(almanacNode("docCareerProg", base + OFF.progBase, pCount * OFF.progStride, "docTProgArray", {
      note: "docCareerProgNote",
      rows: [{ at: base + OFF.progCount, size: 4, type: "docTU32", k: "offProgCount" }],
      children: blocks
    }));

    let tOff = ttBase(ctx);
    if (tOff < 0) tOff = OFF.ttTarget;
    const totalTargets = OFF.ttTargetCount + RACE_TARGETS;
    const ttRows = [];
    for (let ti = 0; ti < OFF.ttTargetCount; ti++) {
      ttRows.push({ at: base + tOff + ti * OFF.ttTargetStride, size: 4, type: "docTU32", k: "docTtTarget" });
    }
    for (let ri = 0; ri < RACE_TARGETS; ri++) {
      ttRows.push({
        at: base + tOff + (OFF.ttTargetCount + ri) * OFF.ttTargetStride,
        size: 4,
        type: "docTU32",
        k: "docRaceTarget",
        label: `${t("docRaceTarget")} #${ri + 1}`
      });
    }
    nodes.push(almanacNode("docCareerTt", base + tOff, totalTargets * OFF.ttTargetStride, "docTTtTable", {
      note: "docCareerTtNote",
      rows: ttRows
    }));

    nodes.sort((a, b) => a.at - b.at);
    return almanacFill(nodes, base, end);
  }

  function almanacSection(name, base, size, ctx) {
    if (name === "Stats") return almanacStats(base, size, ctx);
    if (name === "LocalOptions") return almanacLocal(base, size, ctx);
    if (name === "Career") return almanacCareer(base, size, ctx);
    if (name === "ColorData") {
      return [almanacNode("docColorData", base, size, "docTColor", {
        note: "docColorNote",
        rows: [{ at: base, size: 4, type: "docTColor", k: "docColor0" }]
      })];
    }
    if (name === "RubberbandMgr") {
      return [almanacNode("docRubberband", base, size, "docTU32Array", {
        note: "docRubberbandNote",
        rows: [
          { at: base, size: 4, type: "docTU32", k: "docRubber0" },
          { at: base + 4, size: 4, type: "docTU32", k: "docRubber1" },
          { at: base + 8, size: 4, type: "docTU32", k: "docRubber2" }
        ]
      })];
    }
    if (name === "EditorData") {
      return [almanacNode("docEditorData", base, size, "docTBytes", {
        note: "docEditorNote",
        rows: [
          { at: base, size: 4, type: "docTU32", k: "docEditor0" },
          { at: base + 4, size: 12, type: "docTAscii", k: "docEditorName" }
        ]
      })];
    }
    if (name === "UserVinylData") {
      return [almanacNode("docVinyl", base, size, "docTBytes", {
        note: "docVinylNote",
        rows: [{ at: base, size: 4, type: "docTU32", k: "docVinyl0" }]
      })];
    }
    if (name === "RaceFavorites") {
      return [almanacNode("docRaceFav", base, size, "docTBytes", {
        note: "docRaceFavNote",
        rows: [{ at: base, size: 4, type: "docTU32", k: "docRaceFav0" }]
      })];
    }
    if (name === "enableGps") {
      return [almanacNode("docGps", base, size, "docTU8", { note: "docGpsNote" })];
    }
    return [almanacNode("docUnknownSection", base, size, "docTUnknown")];
  }

  function buildAlmanac(ctx = MCLA.state) {
    const fileEnd = ctx.secs.endedAt;
    const out = [
      almanacNode("docFileHead", 0, 8, "docTFileHead", {
        rows: [
          { at: 0, size: 4, type: "docTU32", k: "docFileCap" },
          { at: 4, size: 4, type: "docTU32", k: "docFileNum" }
        ]
      })
    ];

    for (const s of ctx.secs.list) {
      const nameLen = 4 + s.name.length + 1 + 4;
      const head = almanacNode("docSecHead", s.data - nameLen, nameLen, "docTSecHead", {
        rows: [
          { at: s.data - nameLen, size: 4, type: "docTU32", k: "docSecNameLen" },
          { at: s.data - nameLen + 4, size: s.name.length, type: "docTAscii", k: s.name },
          { at: s.data - 5, size: 1, type: "docTU8", k: "docSecFlag" },
          { at: s.data - 4, size: 4, type: "docTU32", k: "docSecSize" }
        ]
      });
      const body = almanacNode("docSecBody", s.data, s.size, "docTBytes", {
        children: almanacSection(s.name, s.data, s.size, ctx)
      });
      out.push(almanacNode(s.name, s.data - nameLen, nameLen + s.size, "docTSection", {
        children: [head, body]
      }));
    }

    return almanacFill(out, 0, fileEnd);
  }

  const NODE_DATA = new WeakMap();

  function almanacRows(n) {
    if (!n.rows || !n.rows.length) return "";
    const rowsHtml = n.rows.map((r) => {
      const label = r.label != null ? r.label : (r.k ? t(r.k) : "");
      return `<tr><td>0x${r.at.toString(16).toUpperCase()}</td>` +
        `<td>${r.size}</td><td>${r.type ? t(r.type) : ""}</td>` +
        `<td>${label}</td></tr>`;
    }).join("");
    return `<table class="offsets aln-rows">${rowsHtml}</table>`;
  }

  function createAlmanacNodeEl(n, depth) {
    const kids = n.children || [];
    const hasKids = kids.length > 0;
    const wrap = document.createElement("div");
    wrap.className = `aln-node${hasKids ? " has-kids" : ""}`;

    const head = document.createElement("div");
    head.className = "aln-head";
    head.style.setProperty("--d", depth);
    head.innerHTML =
      (hasKids ? '<span class="chev">&gt;</span>' : '<span class="chev"></span>') +
      `<span class="aln-name">${n.label != null ? n.label : t(n.k)}</span>` +
      `<span class="aln-range">0x${n.at.toString(16).toUpperCase()}..0x${(n.at + n.size).toString(16).toUpperCase()}</span>` +
      `<span class="aln-size">${nf(n.size)} B</span>` +
      `<span class="aln-type">${n.type ? t(n.type) : ""}</span>`;

    const body = document.createElement("div");
    body.className = "aln-body";
    const inner = document.createElement("div");
    inner.className = "aln-inner";
    body.appendChild(inner);

    wrap.append(head, body);
    NODE_DATA.set(wrap, { node: n, depth, hydrated: false });
    return wrap;
  }

  function hydrateAlmanacNode(wrap) {
    const entry = NODE_DATA.get(wrap);
    if (!entry || entry.hydrated) return;
    entry.hydrated = true;

    const { node: n, depth } = entry;
    const inner = wrap.querySelector(":scope > .aln-body > .aln-inner");
    const kids = n.children || [];
    let html = "";
    if (n.note) html += `<p class="aln-note">${t(n.note)}</p>`;
    if (n.extra) html += `<p class="aln-note">${t(n.extra)}</p>`;
    html += almanacRows(n);
    if (!kids.length && !n.note && !n.rows) {
      html += `<p class="aln-note">${t("docUnknownNote")}</p>`;
    }
    if (html) inner.innerHTML = html;

    if (!kids.length) return;

    const CHUNK = 80;
    const appendChunk = (start) => {
      if (!wrap.isConnected) return;
      const frag = document.createDocumentFragment();
      const end = Math.min(kids.length, start + CHUNK);
      for (let i = start; i < end; i++) {
        frag.appendChild(createAlmanacNodeEl(kids[i], depth + 1));
      }
      inner.appendChild(frag);
      if (end < kids.length) {
        requestAnimationFrame(() => appendChunk(end));
      }
    };
    appendChunk(0);
  }

  function renderAlmanac() {
    const host = el("almanac");
    if (!host) return;
    const tree = buildAlmanac();
    host.innerHTML = "";
    const frag = document.createDocumentFragment();
    for (const n of tree) frag.appendChild(createAlmanacNodeEl(n, 0));
    host.appendChild(frag);
    el("alnCount").textContent = `${tree.length} ${t("alnBlocks")}`;
  }

  Object.assign(MCLA.ui, { buildAlmanac, renderAlmanac, hydrateAlmanacNode });
})();
