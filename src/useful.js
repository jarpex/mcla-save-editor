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

/* Stock and max of one performance axis, as the editor shows them. */
function usefulRange(car, axis) {
  var p = VEHICLE_PERF_STATS[car];
  if (!p) p = MOTO[car] ? DEFAULT_MOTO_PERF : DEFAULT_CAR_PERF;
  var r = p[axis];
  return r ? r[0] + " \u2192 " + r[1] : "-";
}

function usefulPerf(car) {
  var p = VEHICLE_PERF_STATS[car];
  if (p === null) return null;
  return p || (MOTO[car] ? DEFAULT_MOTO_PERF : DEFAULT_CAR_PERF);
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

  /* The 13 tuning categories and who carries them. */
  var cats = TUNE_CATS.map(function (name, i) {
    var v = TUNE_VENDORS[i];
    return {
      cells: [
        { text: String(i) },
        { text: name },
        { text: t("usefulAllCars") },
        { text: v ? v.names.length + " " + t("usefulVendors") : t("usefulNone") }
      ]
    };
  });
  groups.push({
    k: "usefulCats",
    note: "usefulCatsNote",
    head: ["usefulIdx", "usefulPart", "usefulFits", "usefulVendorCount"],
    rows: cats
  });

  /* The exhaust vendor list, the only one collected so far. */
  var ex = TUNE_VENDORS[0];
  var vrows = [];
  if (ex) {
    vrows.push({
      cells: [
        { text: "0" },
        { text: t("usefulStock") },
        { text: ex.stock.toFixed(4) }
      ]
    });
    ex.names.forEach(function (n, i) {
      vrows.push({
        cells: [
          { text: String(i + 1) },
          { text: n },
          { text: ex.floats[i] != null ? ex.floats[i].toFixed(4) : "-" }
        ]
      });
    });
  }
  groups.push({
    k: "usefulExhaust",
    note: "usefulExhaustNote",
    head: ["usefulIdx", "usefulVendor", "usefulFloat"],
    rows: vrows
  });

  return groups;
}