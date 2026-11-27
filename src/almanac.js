/* ---------- Byte-level almanac ----------
   A tree that tiles the whole file: every byte belongs to exactly one node.
   A node is a block with a start, a size, a data type and optional children.
   Gaps between known blocks become `unknown` nodes, so the sum of the tree is
   the file size and nothing is silently skipped.

   Offsets are absolute. `at` is where the block starts, `size` its length in
   bytes, `k` the i18n key of its title, `type` the i18n key of its data type.
   `note` is an optional paragraph, `rows` a table of fields, `children` the
   next level down. */

/* `label` is literal text and wins over the i18n key: the almanac names real
   things (a race, a car slot, one collectable) and those names are data. */
function almanacNode(k, at, size, type, extra) {
  var n = { k: k, at: at, size: size, type: type || "docTUnknown" };
  if (extra) for (var key in extra) n[key] = extra[key];
  return n;
}

/* Shifts every descendant of `n` by `dx` and every `at` inside its rows. */
function almanacShift(n, dx) {
  n.at += dx;
  if (n.rows) n.rows.forEach(function (r) { r.at += dx; });
  if (n.children) n.children.forEach(function (c) { almanacShift(c, dx); });
  return n;
}

/* A node that covers an unclaimed range. */
function almanacUnknown(at, size) {
  return almanacNode("docUnknown", at, size, "docTUnknown");
}

/* Fills the gaps of a sorted list of nodes so they tile [from, to). */
function almanacFill(nodes, from, to) {
  var out = [], cursor = from;
  nodes.forEach(function (n) {
    if (n.at > cursor) out.push(almanacUnknown(cursor, n.at - cursor));
    out.push(n);
    cursor = Math.max(cursor, n.at + n.size);
  });
  if (cursor < to) out.push(almanacUnknown(cursor, to - cursor));
  return out;
}

/* ---------- the tree ---------- */

function buildAlmanac() {
  var fileEnd = secs.endedAt;
  var out = [];

  /* File header: capacity and section count, then the sections back to back. */
  out.push(almanacNode("docFileHead", 0, 8, "docTFileHead", {
    rows: [
      { at: 0, size: 4, type: "docTU32", k: "docFileCap" },
      { at: 4, size: 4, type: "docTU32", k: "docFileNum" }
    ]
  }));

  secs.list.forEach(function (s) {
    var nameLen = 4 + s.name.length + 1 + 4;
    var head = almanacNode("docSecHead", s.data - nameLen, nameLen, "docTSecHead", {
      rows: [
        { at: s.data - nameLen, size: 4, type: "docTU32", k: "docSecNameLen" },
        { at: s.data - nameLen + 4, size: s.name.length, type: "docTAscii", k: s.name },
        { at: s.data - 5, size: 1, type: "docTU8", k: "docSecFlag" },
        { at: s.data - 4, size: 4, type: "docTU32", k: "docSecSize" }
      ]
    });
    var body = almanacNode("docSecBody", s.data, s.size, "docTBytes", {
      children: almanacSection(s.name, s.data, s.size)
    });
    out.push(almanacNode(s.name, s.data - nameLen, nameLen + s.size, "docTSection", {
      children: [head, body]
    }));
  });

  return almanacFill(out, 0, fileEnd);
}

/* Children of one section. Names not covered here stay unknown. */
function almanacSection(name, base, size) {
  var end = base + size;
  if (name === "Stats") return almanacStats(base, size);
  if (name === "LocalOptions") return almanacLocal(base, size);
  if (name === "Career") return almanacCareer(base, size);
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

/* ---------- Stats ---------- */

function almanacStats(base, size) {
  var rowsStart = base + (((2 - (base % 16)) % 16) + 16) % 16;
  var count = Math.floor((base + size - rowsStart) / 16);
  var nodes = [];

  if (rowsStart > base) {
    nodes.push(almanacNode("docStatsPrefix", base, rowsStart - base, "docTUnknown"));
  }

  var table = almanacNode("docStatsTable", rowsStart, count * 16, "docTRecTable", {
    note: "docStatsTableNote",
    children: almanacStatsRows(rowsStart, count)
  });
  nodes.push(table);
  return almanacFill(nodes, base, base + size);
}

/* One node per record: 1056 of them, each with its FourCC and value. */
function almanacStatsRows(start, count) {
  var out = [], seen = {};
  for (var i = 0; i < count; i++) {
    var at = start + i * 16;
    var key = ascii(at, 4);
    var kind = bytes[at + 8];
    var type = kind === 0x28 ? "docTFloat" : (kind === 0x29 ? "docTU32" : "docTUnknown");
    /* The row is named the way the editor names it: a race by its race name,
       a car stat by its car, everything else by its FourCC. */
    var named = /^[A-Za-z][A-Za-z0-9$%:]{3}$/.test(key);
    var occ = named ? (seen[key] || 0) : 0;
    if (named) seen[key] = occ + 1;
    var label = named ? (statName({ key: key, occ: occ }) || key) : "docRowUnnamed";
    out.push(almanacNode(named ? key : "docRowUnnamed", at, 16, "docTRecRow", {
      label: label,
      rows: [
        { at: at, size: 4, type: "docTFourCC", k: "docRowKey" },
        { at: at + 4, size: 4, type: "docTUnknown", k: "docRowPad" },
        { at: at + 8, size: 1, type: "docTU8", k: "docRowKind" },
        { at: at + 9, size: 3, type: "docTUnknown", k: "docRowPad3" },
        { at: at + 12, size: 4, type: type, k: "docRowVal" }
      ]
    }));
  }
  return out;
}

/* ---------- LocalOptions ---------- */

function almanacLocal(base, size) {
  var end = base + size;
  var slot0 = base + OFF.slot0;
  var stride = OFF.slotStride;
  var tune0 = base + OFF.tuneBase;
  var nodes = [];

  nodes.push(almanacNode("docLocalHead", base, OFF.tuneBase, "docTUnknown", {
    rows: [
      { at: base + OFF.cars, size: 1, type: "docTU8", k: "offCars" },
      { at: base + OFF.carsIdx, size: 4, type: "docTU32", k: "offCarsIdx" }
    ]
  }));

  /* The tune array and the slot array are one array of 8176-byte records:
     record n holds the tune of car n and slot n-1. Record 0 is tune only.
     One node per record, with both field sets in its table. */
  var recCount = Math.floor((end - tune0) / stride);
  var recs = [];
  for (var i = 0; i < recCount; i++) {
    var at = tune0 + i * stride;
    var avail = Math.min(stride, end - at);
    var slotAt = slot0 + (i - 1) * stride;
    var hasSlot = i >= 1 && slotAt < end;
    var rows = almanacTuneRows(at, avail);
    if (hasSlot) rows = rows.concat(almanacSlotRows(slotAt, avail));
    /* Record i holds slot i-1, so the slot number is the record index. */
    var slotNo = i;
    var car = hasSlot ? ascii(slotAt, 32) : "";
    if (car === "blank") car = "";
    var nice = car ? (CAR_TITLES[car] || car) : "";
    recs.push(almanacNode("docRecord", at, avail, "docTRecord", {
      note: hasSlot ? "docRecordNote" : "docRecordNote0",
      label: hasSlot
        ? t("docSlotRec") + " " + slotNo + (nice ? " \u00b7 " + nice : " \u00b7 " + t("docSlotEmpty"))
        : t("docRecord"),
      rows: rows
    }));
  }
  nodes.push(almanacNode("docRecordArray", tune0, recCount * stride, "docTRecArray", {
    note: "docRecordArrayNote",
    /* The vendor byte and the float are two halves of one number; the game
       adds them, so the pair is documented once per record. */
    extra: "docTuneFormula",
    children: recs
  }));

  /* The slot array is 30 full strides plus a truncated 31st: the bytes
     between the last whole record and the collectables are that tail. */
  var arrEnd = tune0 + recCount * stride;
  var colAt = base + OFF.collect;
  if (colAt > arrEnd) {
    nodes.push(almanacNode("docSlotTail", arrEnd, colAt - arrEnd, "docTBytes", {
      note: "docSlotTailNote"
    }));
  }

  /* Collectables sit inside the last record, after the slot fields. */
  if (colAt < end) {
    nodes.push(almanacNode("docCollect", colAt, Math.min(OFF.collectN, end - colAt), "docTFlagArray", {
      note: "docCollectNote",
      rows: almanacCollectRows(colAt)
    }));
  }

  return almanacFill(nodes, base, end);
}

function almanacTuneRows(at, avail) {
  var rows = [];
  function add(rel, size, type, k) {
    if (rel + size <= avail) rows.push({ at: at + rel, size: size, type: type, k: k });
  }
  add(OFF.tuneVendorF, 52, "docTFloatArray", "offTuneVendorF");
  add(OFF.tuneLv, 13, "docTU8Array", "offTuneLv");
  add(OFF.tuneVendor, 13, "docTU8Array", "offTuneVendor");
  add(OFF.tunePct, 1, "docTU8", "offTunePct");
  return rows;
}

function almanacSlotRows(at, avail) {
  var rows = [];
  function add(rel, size, type, k) {
    if (rel + size <= avail) rows.push({ at: at + rel, size: size, type: type, k: k });
  }
  add(0, 32, "docTAscii", "offSlotName");
  add(OFF.slotLabel, 32, "docTAscii", "offSlotLabel");
  /* 12 scattered bytes, not a word array: 4 detail bytes, 6 wheel values at
     step 48, then the 2-byte wheel diameter. The last pair is one u16. */
  for (var ai = 0; ai < OFF.appear.length - 1; ai++) {
    var rel = OFF.appear[ai];
    var last = (ai === OFF.appear.length - 2);
    add(rel, last ? 2 : 1, last ? "docTU16" : "docTU8",
        last ? "offAppearDia" : ("offAppearAt" + ai));
  }
  /* The plate lives one stride back, so its offset is outside this record. */
  add(OFF.slotPlate - OFF.slotStride, 7, "docTAscii", "offPlateDoc");
  return rows;
}

/* One row per byte: the zone name plus the number the game gives it, so the
   39th collectable is findable by reading the table. */
function almanacCollectRows(at) {
  var rows = [];
  var zones = [["colHollywood", 20], ["colBeach", 15], ["colDowntown", 15], ["colHills", 10]];
  var rel = 0;
  zones.forEach(function (z) {
    for (var i = 0; i < z[1]; i++) {
      rows.push({
        at: at + rel + i, size: 1, type: "docTU8", k: z[0],
        label: t(z[0]) + " #" + (i + 1)
      });
    }
    rel += z[1];
  });
  return rows;
}

/* ---------- Career ---------- */

function almanacCareer(base, size) {
  var end = base + size;
  var nodes = [];

  /* Money and reputation, then the unknown that fills up to the blocks. */
  nodes.push(almanacNode("docCareerHead", base, OFF.progBase, "docTUnknown", {
    rows: [
      { at: base + OFF.money, size: 4, type: "docTU32", k: "offMoney" },
      { at: base + OFF.rep, size: 4, type: "docTU32", k: "offRep" }
    ]
  }));

  /* One node per progression block: 43 blocks of 65 bytes. */
  var blocks = [];
  for (var i = 0; i < 43; i++) {
    var at = base + OFF.progBase + i * OFF.progStride;
    blocks.push(almanacNode("docProgBlock", at, OFF.progStride, "docTProgBlock", {
      rows: [
        { at: at, size: 4, type: "docTFourCC", k: "docProgId" },
        { at: at + 4, size: 1, type: "docTU8", k: "docProgState" },
        { at: at + 5, size: 4, type: "docTU32", k: "docProgValue" },
        { at: at + 9, size: 56, type: "docTUnknown", k: "docProgPad" }
      ]
    }));
  }
  nodes.push(almanacNode("docCareerProg", base + OFF.progBase, 43 * OFF.progStride, "docTProgArray", {
    note: "docCareerProgNote",
    rows: [{ at: base + OFF.progCount, size: 4, type: "docTU32", k: "offProgCount" }],
    children: blocks
  }));

  nodes.push(almanacNode("docCareerTt", base + OFF.ttTarget, 16, "docTTtTable", {
    note: "docCareerTtNote",
    rows: [
      { at: base + OFF.ttTarget, size: 4, type: "docTU32", k: "docTtTarget" },
      { at: base + OFF.ttTarget + 4, size: 4, type: "docTU32", k: "docTtTarget" },
      { at: base + OFF.ttTarget + 8, size: 4, type: "docTU32", k: "docTtTarget" },
      { at: base + OFF.ttTarget + 12, size: 4, type: "docTU32", k: "docTtTarget" }
    ]
  }));

  nodes.sort(function (a, b) { return a.at - b.at; });
  return almanacFill(nodes, base, end);
}
