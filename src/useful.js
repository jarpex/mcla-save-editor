/* ---------- Useful Data ----------
   Reference tables that are expensive to rebuild: the internal prefab name of
   every vehicle, the stock-to-max performance ranges, which tuning categories
   a vehicle has, and the vendor list of a part. The editor already carries all
   of it, so the panel only lays it out.

   `buildUseful()` returns groups of rows; renderUseful() draws them. */

/* The class of a car, read off the prefab name. Nothing here is a guess about
   the game: the name is the only source, so the label says what it saw. */
function usefulClass(car) {
  if (MOTO[car]) return "usefulMoto";
  if (/police|chp|plc/.test(car)) return "usefulPolice";
  if (/citybus/.test(car)) return "usefulBus";
  if (/_DUB$/.test(car)) return "usefulDub";
  return "usefulCar";
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
   The float written at +0x27 rides along as option data, so picking a vendor
   shows the number the game would store. */
function usefulVendorSelect(catIdx) {
  var v = TUNE_VENDORS[catIdx];
  if (!v) return { html: '<span class="useful-none">' + t("usefulNone") + "</span>" };
  var opts = '<option value="0" data-float="' + v.stock.toFixed(4) + '">' +
    t("usefulStock") + "</option>";
  v.names.forEach(function (n, i) {
    var f = v.floats[i];
    opts += '<option value="' + (i + 1) + '"' +
      (f != null ? ' data-float="' + f.toFixed(4) + '"' : "") + ">" + n + "</option>";
  });
  return {
    html: '<span class="useful-sel">' +
      '<select class="useful-select" data-cat="' + catIdx + '">' + opts + "</select>" +
      '<span class="useful-float">' + v.stock.toFixed(4) + "</span></span>"
  };
}

/* ---------- the tables ---------- */

function buildUseful() {
  var groups = [];

  /* Every vehicle the editor knows, in roster order. */
  var rows = ROSTER.map(function (car) {
    var perf = usefulPerf(car);
    return {
      cells: [
        { text: car, mono: true },
        { text: CAR_TITLES[car] || "" },
        { text: t(usefulClass(car)) },
        { text: perf ? usefulRange(car, "accel") : t("usefulNoData") },
        { text: perf ? usefulRange(car, "speed") : t("usefulNoData") },
        { text: perf ? usefulRange(car, "hand") : t("usefulNoData") }
      ]
    };
  });
  groups.push({
    k: "usefulRoster",
    note: "usefulRosterNote",
    head: ["usefulInternal", "usefulTitle", "usefulClass", "usefulAccel", "usefulSpeed", "usefulHand"],
    rows: rows
  });

  /* The 13 categories in index order. The third column shows which vehicle
     types carry the part, as boxes drawn like the Progression checkboxes.
     Then what one level adds to each of the three performance stats, where
     the bytes live, and the vendor dropdown where a list exists. */
  var cats = TUNE_CATS.map(function (name, i) {
    return {
      cells: [
        { text: String(i) },
        { text: name },
        usefulFits(i),
        { text: usefulPct(usefulShare(i, "acc")) },
        { text: usefulPct(usefulShare(i, "spd")) },
        { text: usefulPct(usefulShare(i, "hnd")) },
        usefulRaw(i),
        usefulVendorSelect(i)
      ]
    };
  });
  groups.push({
    k: "usefulCats",
    note: "usefulCatsNote",
    head: ["usefulIdx", "usefulPart", "usefulFits", "usefulAccel", "usefulSpeed",
           "usefulHand", "usefulRaw", "usefulVendors"],
    rows: cats
  });

  return groups;
}