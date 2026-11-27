/* ---------- Useful Data ----------
   Reference tables that are expensive to rebuild: the internal prefab name of
   every vehicle, the stock-to-max performance ranges, which tuning categories
   a vehicle has, and the vendor list of a part. The editor already carries all
   of it, so the panel only lays it out.

   `buildUseful()` returns groups of rows; renderUseful() draws them. */

/* The class of a car, straight from the game's own vehicle list. A name the
   list does not carry is "other", and the editor still shows it. */
function usefulClass(car) {
  var c = VEHICLE_CLASS[car];
  return c ? "useful_" + c[0] : "usefulOther";
}

/* "Group 3" as the game writes it; null when the list has no entry. */
function usefulGroup(car) {
  var c = VEHICLE_CLASS[car];
  return c ? t("usefulGroup") + " " + c[1] : "-";
}

/* Bikes are the only class the editor treats as motorcycles. */
function usefulIsBike(car) {
  return !!(VEHICLE_CLASS[car] && VEHICLE_CLASS[car][0] === "bikes");
}

/* null means the game data was never collected for that car. */
function usefulPerf(car) {
  var p = VEHICLE_PERF_STATS[car];
  if (p === null) return null;
  return p || (MOTO[car] ? DEFAULT_MOTO_PERF : DEFAULT_CAR_PERF);
}

/* Stock and max of one performance axis, as the editor shows them. */
function usefulRange(car, axis) {
  var r = usefulPerf(car)[axis];
  return r ? r[0] + " \u2192 " + r[1] : "-";
}

/* The two pictograms, drawn as strokes like the rest of the panel. */
var USEFUL_ICONS = {
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

/* One box per vehicle type that carries the category, styled like the
   Progression checkboxes. A bike has the six in MOTO_CATS, so the rest show
   the car box alone. */
function usefulFits(catIdx) {
  var boxes = '<span class="useful-fit" title="' + t("usefulCar") + '">' +
    '<span class="useful-box">' + USEFUL_ICONS.car + "</span></span>";
  if (MOTO_CATS.indexOf(catIdx) >= 0) {
    boxes += '<span class="useful-fit" title="' + t("usefulMoto") + '">' +
      '<span class="useful-box">' + USEFUL_ICONS.moto + "</span></span>";
  }
  return { html: '<span class="useful-fits">' + boxes + "</span>" };
}

/* The share of the stock-to-max range one level of a category adds, as a
   percentage. A level is `1 / tuneMaxByte` of the category weight, and the
   weights are shares of the whole range, so the product is the answer. */
function usefulShare(catIdx, axis) {
  var w = CAR_PERF_WEIGHTS[catIdx];
  if (!w || !w[axis]) return null;
  var per = w[axis] / tuneMaxByte(0);
  return Math.round(per * 10000) / 100;
}

function usefulPct(v) {
  return v == null ? "-" : (v === 0 ? "0" : "+" + v + "%");
}

/* Where the three bytes of one category live, in the form the game stores
   them: level and vendor as u8, the vendor float as f32. */
function usefulRaw(catIdx) {
  var lv = OFF.tuneLv + catIdx;
  var vd = OFF.tuneVendor + catIdx;
  var fl = OFF.tuneVendorF + catIdx * 4;
  return {
    html: '<span class="useful-raw">' +
      "<span>lv +0x" + lv.toString(16).toUpperCase() + " u8</span>" +
      "<span>vnd +0x" + vd.toString(16).toUpperCase() + " u8</span>" +
      "<span>flt +0x" + fl.toString(16).toUpperCase() + " f32</span>" +
      "</span>"
  };
}

/* The vendor dropdown of one category: stock first, then the collected list.
   The number the game works with is the vendor byte plus the float at +0x27,
   so the readout shows the sum and the option carries both terms. */
function usefulVendorSelect(catIdx) {
  var v = TUNE_VENDORS[catIdx];
  if (!v) return { html: '<span class="useful-none">' + t("usefulNone") + "</span>" };
  /* The index is the position in the vendor list, 0-based: 5zigen is 0 and
     the float at +0x27 is 0.9601, so the game's number is 0.9601. Stock is
     index 0 as well, with the factory float and level 0, which is how a save
     says "no part"; the level byte is what tells the two apart. */
  function opt(idx, name, f) {
    var total = idx + f;
    return '<option value="' + idx + '" data-idx="' + idx + '" data-float="' + f + '"' +
      ' data-total="' + total.toFixed(4) + '">' + name + "</option>";
  }
  /* The readout shows all three numbers: the index byte, the float at +0x27
     and their sum, which is what the game works with. */
  function readout(idx, f) {
    return '<span class="useful-calc">' +
      '<span class="useful-cap">' + t("usefulValue") + "</span>" +
      '<span class="useful-term">idx ' + idx + "</span>" +
      '<span class="useful-term">flt ' + f.toFixed(4) + "</span>" +
      '<span class="useful-total">' + (idx + f).toFixed(4) + "</span></span>";
  }
  var opts = '<option value="stock" data-idx="0" data-float="' + v.stock + '"' +
    ' data-total="' + v.stock.toFixed(4) + '">' + t("usefulStock") + "</option>";
  v.names.forEach(function (n, i) {
    var f = v.floats[i];
    if (f != null) opts += opt(i, n, f);
  });
  return {
    html: '<span class="useful-sel">' +
      '<select class="useful-select" data-cat="' + catIdx + '">' + opts + "</select>" +
      readout(0, v.stock) + "</span>"
  };
}

/* ---------- the tables ---------- */

function buildUseful() {
  var groups = [];

  /* Every vehicle the editor knows, split the way the game splits it: cars
     first, then bikes. Within each, roster order. */
  var cars = [], bikes = [];
  ROSTER.forEach(function (car) {
    var perf = usefulPerf(car);
    var row = {
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
  });
  groups.push({
    k: "usefulRoster",
    note: "usefulRosterNote",
    head: ["usefulInternal", "usefulTitle", "usefulClass", "usefulGroup",
           "usefulAccel", "usefulSpeed", "usefulHand"],
    rows: cars
  });
  groups.push({
    k: "usefulBikes",
    note: "usefulBikesNote",
    head: ["usefulInternal", "usefulTitle", "usefulClass", "usefulGroup",
           "usefulAccel", "usefulSpeed", "usefulHand"],
    rows: bikes
  });

  /* The 13 categories in index order. The third column shows which vehicle
     types carry the part, as boxes drawn like the Progression checkboxes.
     Then what one level adds to each of the three performance stats, where
     the bytes live, and the vendor dropdown where a list exists. */
  var cats = TUNE_CATS.map(function (name, i) {
    var w = CAR_PERF_WEIGHTS[i];
    var dynoPct = w && w.dynoY ? "+" + (Math.round((w.dynoY / tuneMaxByte(0)) * 10000) / 100) + "%" : "0";
    var partName = i === 5 ? name + " / Jet Kits" : name;
    return {
      cells: [
        { text: String(i) },
        { text: partName },
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
    k: "usefulCats",
    note: "usefulCatsNote",
    head: ["usefulIdx", "usefulPart", "usefulFits", "usefulAccel", "usefulSpeed",
           "usefulHand", "usefulDynoY", "usefulRaw", "usefulVendors"],
    rows: cats
  });

  /* Mechanics, encoding rules, formulas and save path. */
  var mechRows = [
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
  ].map(function (r) {
    return { cells: [{ text: t(r[0]) }, { text: r[1], mono: true }] };
  });
  groups.push({
    k: "usefulMech",
    note: "usefulMechNote",
    head: ["usefulTopic", "usefulRule"],
    rows: mechRows
  });

  /* Stock appearance presets (12 scattered bytes per vehicle). */
  var appRows = ROSTER.map(function (car) {
    var p = STOCK_APPEARANCE[car];
    function hexList(arr) {
      return arr.map(function (b) { return "0x" + (b < 16 ? "0" : "") + b.toString(16).toUpperCase(); }).join(" ");
    }
    return {
      cells: [
        { text: car, mono: true },
        { text: CAR_TITLES[car] || "" },
        { text: p ? hexList(p.slice(0, 4)) : t("usefulNoData"), mono: !!p },
        { text: p ? hexList(p.slice(4, 10)) : "-", mono: !!p },
        { text: p ? hexList(p.slice(10, 12)) : "-", mono: !!p }
      ]
    };
  });
  groups.push({
    k: "usefulAppear",
    note: "usefulAppearNote",
    head: ["usefulInternal", "usefulTitle", "usefulAppDetail", "usefulAppWheel", "usefulAppDia"],
    rows: appRows
  });

  /* Stats & Career FourCC reference. */
  if (typeof STAT_NAMES !== "undefined") {
    var fourccRows = Object.keys(STAT_NAMES).map(function (k) {
      var grp = k.charAt(0) === "g" ? "Game" : (k.charAt(0) === "k" ? "Career" : (k.charAt(0) === "v" ? "Vehicle" : "Race"));
      var note = k === "k:TB" ? "x5 (Time Trials)"
               : k === "k$WA" ? "x4 (Wagers)"
               : k === "vWIN" ? "sparse (winners only)"
               : k === "vkDT" ? "x67 (CAR_ORDER_NAMES)"
               : k === "r:TI" ? "x69 (RACE_NAMES, ms)"
               : (k === "ghTC" || k === "ghTP" || k === "khTC") ? "f32 hours (h:mm)"
               : k === "gCOL" ? "synced with LocalOptions+0x3DF84"
               : "-";
      return {
        cells: [
          { text: k, mono: true },
          { text: grp },
          { text: STAT_NAMES[k] },
          { text: note, mono: true }
        ]
      };
    });
    fourccRows.push({
      cells: [
        { text: "a* / t* / x*", mono: true },
        { text: "Unnamed" },
        { text: t("usefulFourccUnnamed") },
        { text: "a* (15), t* (33), x* (14)", mono: true }
      ]
    });
    groups.push({
      k: "usefulFourcc",
      note: "usefulFourccNote",
      head: ["offStatKey", "usefulGroup", "usefulTitle", "usefulNoteCol"],
      rows: fourccRows
    });
  }

  /* Race & Collectable memory order. */
  if (typeof RACE_NAMES !== "undefined" && typeof RACE_GROUPS !== "undefined") {
    var groupByOcc = {};
    RACE_GROUPS.forEach(function (g) {
      g.occ.forEach(function (o) { groupByOcc[o] = t(g.label); });
    });
    var raceRows = RACE_NAMES.map(function (name, i) {
      return {
        cells: [
          { text: String(i), mono: true },
          { text: groupByOcc[i] || "-" },
          { text: name || "(" + t("docRowUnnamed") + ")" }
        ]
      };
    });
    groups.push({
      k: "usefulRaces",
      note: "usefulRacesNote",
      head: ["usefulIdx", "usefulGroup", "usefulTitle"],
      rows: raceRows
    });
  }

  return groups;
}