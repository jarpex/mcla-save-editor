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

  /* The 13 categories, split by who carries them: a bike has the six in
     MOTO_CATS, so the rest are cars only. The vendor column is a dropdown
     where a list exists, plain text where none was collected. */
  var all = [], carOnly = [];
  TUNE_CATS.forEach(function (name, i) {
    var row = {
      cells: [
        { text: String(i) },
        { text: name },
        usefulVendorSelect(i)
      ]
    };
    (MOTO_CATS.indexOf(i) >= 0 ? all : carOnly).push(row);
  });
  groups.push({
    k: "usefulCatsAll",
    note: "usefulCatsAllNote",
    head: ["usefulIdx", "usefulPart", "usefulVendors"],
    rows: all
  });
  groups.push({
    k: "usefulCatsCar",
    note: "usefulCatsCarNote",
    head: ["usefulIdx", "usefulPart", "usefulVendors"],
    rows: carOnly
  });

  return groups;
}