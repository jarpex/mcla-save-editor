// ---------- Statistics ----------

var STATS = [];
/* Sub-lists per game screen, filled by renderStats. */
var GAME_KEYS = [], VEH_KEYS = [], RACE_KEYS = [], VEH_ROWS = [];

var STAT_NAMES = {
  /* Game Stats */
  gBRN: "Total Burnout",
  gCOL: "Collectables",
  gCPA: "Total Cops Activated",
  gCPL: "Total Cops Lost",
  gCPR: "Total Arrests",
  gCWN: "Non Career Consecutive Wins",
  gDAM: "Total Damage Points",
  gHOP: "Total Opponents Hit",
  gHPR: "Total Props Hit",
  gHTR: "Total Traffic Hit",
  gNIT: "Total Nitrous",
  gOUT: "Total Damage Out",
  gRCP: "Races Completed",
  gSST: "Total SST",
  gWIN: "Total Numbers of Wins",
  gWIP: "Total Wipeouts",
  gZON: "Total Zone Special Ability",
  ghTC: "Total Hours Cruising",
  ghTP: "Total Hours Played",
  gk2W: "Two Wheel Driving Distance (miles)",
  gkDS: "Total Distance Traveled (miles)",
  gkWL: "Total Wheelie Distance (miles)",
  gmJD: "Max. Jump Distance (meters)",
  gsJT: "Total Jump Time (seconds)",

  /* Career Stats */
  "k$CE": "Total Cash Earned",
  k$WA: "Wager Win Amount",
  "k%AG": "Percent Completed",
  k2ND: "Number of Second Place",
  k3RD: "Number of Third Place",
  "k:TB": "Time Trial Record",
  kARS: "Average Restarts",
  kCCW: "Most Consecutive Wins",
  kCWN: "Career Consecutive Wins",
  kDLT: "Total Deliveries",
  kEXW: "Exotic Wins",
  kFWN: "Freeway Wins",
  kHOK: "Hookmen Beaten",
  kLED: "Most Lead Changes",
  kLOW: "Lowrider Wins",
  kLUW: "Luxury Wins",
  kMOW: "Motorcycle Wins",
  kMRS: "Max Restarts in a Race",
  kMUW: "Muscle Wins",
  kPDS: "Payback Destroyed",
  kRCP: "Races Completed",
  kRLW: "Red Light Wins",
  kSUW: "SUV Wins",
  kTRS: "Total Restarts",
  kTUW: "Tuner Wins",
  kWIN: "Number of Wins",
  khTC: "Hours Cruising",

  /* Vehicle Stats */
  vWIN: "Number of Wins",
  vkDT: "Distance Traveled (miles)",

  /* Race Stats */
  "r:TI": "Race Time"
};

/* ---------- Names in memory order ----------
   Repeated records keep the order the game writes, not the menu order.
   Names come from a dump of the stats screen itself.

   r:TI has 69 records: 68 named, 1 not (unordered/landmark, which the
   screen shows as NO STATS). vWIN has 21: only cars with a win, in menu
   order. vkDT has one record per car, 67 in a full save. */

var RACE_NAMES = [
  "Century Mall",
  "Hollywood and Downtown",
  "Laurel Canyon Loop",
  "Promenade",
  "Theater Circuit",
  "University Loop",
  "Westwood",
  "Around Hollywood",
  "Central LA Showdown",
  "Century City Jumps",
  "Fairfax and Sunset",
  "Hollywood Drifts",
  "Laurel Canyon Run",
  "Macarthur Cut",
  "Old Hollywood Shortcuts",
  "Sunset and Vine",
  "Sunset River Run",
  "Valley Freeways",
  "Welcome to Hollywood",
  "West LA Challenge",
  "Wilshire Blvd.",
  "Wishire Sprint",
  "California Incline Loop",
  "Santa Monica Loop",
  "Under the 405",
  "Beaches and Beverly Run",
  "Ocean to LA River",
  "Old Route 66",
  "Sand and Surf",
  "University Cut",
  "Westside Ride",
  "Westwood and Brentwood",
  "6th St.",
  "Downtown Freeway Loop",
  "LA River Run",
  "Midtown",
  "Railyard",
  "4th Street Meet",
  "Civic Center Race",
  "Crossblocks",
  "Downtown to Pier",
  "Downtown Tour",
  "Downtown Vistas",
  "Figueroa and Grand",
  "Rags to Riches",
  "Coldwater Canyon",
  "Mullholland",
  "Hollywood, Valley and Beaches",
  "Mullholland and Beverly",
  "Mullholland Drive East",
  "Mullholland Drive West",
  "River Valley",
  "Up and Over Coldwater",
  "Ventura Loop",
  "10 and 405 is 110",
  "Figueroa and Vermont",
  "Round Baldwin",
  "South Central Speedway",
  "Track Circuit",
  "West Adams Loop",
  "Baldwin Crenshaw Run",
  "Campus Orientation",
  "Creenshaw and Back",
  "SC Touring Time",
  "South Central Tour",
  "Southeast Run",
  "Under the 10",
  "West Adams Match",
  ""
];

/* The four race screens, in menu order. The indexes are r:TI occurrences
   in memory (the written order differs, see RACE_NAMES). Unordered and
   Landmark stay empty: the game screen shows "NO STATS FOR THIS RACE TYPE"
   and no record carries a name. The single unnamed memory entry (68)
   goes to Unknown. */
var RACE_GROUPS = [
  { key: "stRaceOrdered", label: "stRaceOrdered", occ: [
  7,
  8,
  9,
  10,
  11,
  12,
  13,
  14,
  15,
  16,
  17,
  18,
  19,
  20,
  21,
  25,
  26,
  27,
  28,
  29,
  30,
  31,
  37,
  38,
  39,
  40,
  41,
  42,
  43,
  44,
  47,
  48,
  49,
  50,
  51,
  52,
  53,
  60,
  61,
  62,
  63,
  64,
  65,
  66,
  67
]
  },
  { key: "stRaceCircuit", label: "stRaceCircuit", occ: [
  0,
  1,
  2,
  3,
  4,
  5,
  6,
  22,
  23,
  24,
  32,
  33,
  34,
  35,
  36,
  45,
  46,
  54,
  55,
  56,
  57,
  58,
  59
]
  },
  { key: "stRaceUnordered", label: "stRaceUnordered", occ: [] },
  { key: "stRaceLandmark", label: "stRaceLandmark", occ: [] },
  /* Unknown shows only when it has a row: it holds what was not
     recognized, so empty it says nothing. */
  { key: "stRaceUnknown", label: "stRaceUnknown", hideEmpty: true, occ: [
  68
]
  }
];

/* Cars with a vWIN record, in the order the game writes (menu order minus
   the cars that never won). The list is sparse on purpose: names cannot be
   derived from CAR_ORDER_NAMES by index. */
var WIN_CAR_NAMES = [
  "1998 240SX",
  "1969 Camaro RS SS",
  "1969 BOSS 302",
  "2004 SVT Focus",
  "1999 Eclipse GSX",
  "2006 RX-8 \"SHINKA\"",
  "CHALLENGER CONCEPT \"DUB EDITION\"",
  "2008 R32",
  "1999 3000GT VR-4",
  "2006 S600 \"DUB EDITION\"",
  "1971 MIURA SV",
  "2008 R8",
  "2004 MURCIELAGO ROADSTER",
  "2004 MURCIELAGO \"DUB EDITION\"",
  "2007 S7",
  "2007 NINJA ZX14",
  "1964 IMPALA",
  "1965 MALIBU",
  "RANGE ROVER SPORT",
  "2008 S5",
  "2008 1098R"
];

var CAR_ORDER_NAMES = [
  "1983 Golf/GTI",
  "1998 240SX",
  "1975 280Z",
  "1988 Scirocco",
  "1969 Camaro RS SS",
  "1969 BOSS 302",
  "1979 FIREBIRD",
  "1996 IMPALA SS",
  "1987 GRAND NATIONAL GNX",
  "1970 Challenger R/T",
  "2004 SVT Focus",
  "2006 SOLSTICE",
  "1999 Eclipse GSX",
  "2006 Cobalt SS",
  "2006 RX-8 \"SHINKA\"",
  "2007 MONSTER S4RS",
  "2005 Mustang GT Convertible",
  "Camaro Concept",
  "CAMARO CONCEPT \"DUB EDITION\"",
  "Charger SRT-8",
  "Challenger Concept",
  "CHALLENGER CONCEPT \"DUB EDITION\"",
  "2007 300C SRT-8",
  "2008 R32",
  "2006 350Z ROADSTER",
  "1999 3000GT VR-4",
  "1995 RX-7",
  "1999 SKYLINE GT-R V-SPEC",
  "2008 RS4",
  "2006 LANCER EVOLUTION IX",
  "2006 999R",
  "2006 S600",
  "2006 S600 \"DUB EDITION\"",
  "1971 MIURA SV",
  "2008 R8",
  "2007 V8 Vantage Roadster",
  "2007 SL65 AMG",
  "2007 Z06",
  "2008 S302 EXTREME",
  "2006 GALLARDO SPYDER",
  "2004 MURCIELAGO ROADSTER",
  "2004 MURCIELAGO \"DUB EDITION\"",
  "COBRA CONCEPT",
  "2006 GT",
  "2007 S7",
  "2007 NINJA ZX14",
  "1955 BEL AIR",
  "1963 RIVIERA",
  "1964 IMPALA",
  "1965 MALIBU",
  "1966 GTO",
  "1970 CHEVELLE SS",
  "RANGE ROVER SUPERCHARGED",
  "RANGE ROVER SPORT",
  "2009 ECLIPSE SPYDER GT",
  "2008 S5",
  "2008 EVOLUTION X",
  "2008 XLRV",
  "2008 CLK63 AMG BLACK",
  "2008 CL65 AMG",
  "2007 DB9",
  "2008 1098R",
  "1996 IMPALA SS POLICE",
  "1996 IMPALA SS POLICE CHP",
  "CHARGER POLICE",
  "CHARGER POLICE BP",
  "CHARGER POLICE CHP",
];

/* Name of a repeated record: the name list follows memory order. */
function statName(r) {
  var base = STAT_NAMES[r.key];
  if (!base) return "";
  var list = r.key === "r:TI" ? RACE_NAMES
           : r.key === "vWIN" ? WIN_CAR_NAMES
           : r.key === "vkDT" ? CAR_ORDER_NAMES
           : null;
  /* For races the name alone is enough: the type column already says
     "time", and "Race Time Around Hollywood" repeated the header. */
  if (r.key === "r:TI") {
    if (list[r.occ]) return list[r.occ];
    return "#" + (r.occ + 1);
  }
  if (list && list[r.occ]) return base + " \u00b7 " + list[r.occ];
  /* The two unnamed entries go to Unknown; with no text of their own, the
     memory occurrence number is used. */
  return r.occ ? base + " #" + (r.occ + 1) : base;
}

function renderStats() {
  var s = sec("Stats");
  STATS = [];
  var start = s.data + (((2 - (s.data % 16)) % 16) + 16) % 16;
  var seen = {};
  for (var o = start; o + 16 <= s.data + s.size; o += 16) {
    var k = ascii(o, 4);
    /* Accept $, % and : in the code: k$CE, k%AG, k:TB and r:TI are real
       and the old regex, [A-Za-z0-9] only, dropped them. */
    if (!/^[A-Za-z][A-Za-z0-9$%:]{3}$/.test(k)) continue;
    var kind = bytes[o + 8];
    var occ = seen[k] || 0;
    seen[k] = occ + 1;
    STATS.push({
      at: o, key: k, occ: occ,
      isFloat: kind === 0x28 || kind === 0x00,
      isHours: statIsHours({ key: k }),
      /* r:TI stores milliseconds; the screen shows mm:ss.cc like the game. */
      isTime: k === "r:TI"
    });
  }
  /* The four game screens: each FourCC prefix belongs to one. */
  GAME_KEYS = STATS.filter(function (r) { return r.key.charAt(0) === "g"; });
  VEH_KEYS = STATS.filter(function (r) { return r.key === "vWIN" || r.key === "vkDT"; });
  RACE_KEYS = STATS.filter(function (r) { return r.key === "r:TI"; });

  el("statCount").textContent = GAME_KEYS.length + " " + t("nRecords");
  el("vehCount").textContent = VEH_KEYS.length + " " + t("nRecords");
  el("raceCount").textContent = RACE_KEYS.length + " " + t("nRecords");

  /* One row per car, as the game shows.
     vWIN is sparse: it writes only cars with at least one win (21 records
     in this save) and the indexes are packed, with no gap for a car that
     never won. vkDT is not sparse: one record per car (67, one more than
     the 66 menu names).
     So the join is by car name, never by index: by index "1998 240SX"
     (vWIN[0]) would pair with "1983 Golf/GTI" (vkDT[0]), which is exactly
     the car that never won. A car absent from vWIN gets win: null and the
     field stays locked at 0. */
  VEH_ROWS = [];
  var winByCar = {};
  VEH_KEYS.forEach(function (r) {
    if (r.key === "vWIN") winByCar[WIN_CAR_NAMES[r.occ]] = r;
  });
  VEH_KEYS.forEach(function (r) {
    if (r.key !== "vkDT") return;
    var car = CAR_ORDER_NAMES[r.occ];
    /* vkDT has one record per car, in menu order, so the list and the
       records are the same length; a missing name still drops the row. */
    if (!car) return;
    VEH_ROWS.push({ car: car, dist: r, win: winByCar[car] || null });
  });

  el("statFilter").oninput = function () { drawStats(this.value); };
  el("vehFilter").oninput = function () { drawVehicles(this.value); };
  el("raceFilter").oninput = function () { drawRaces(this.value); };

  drawStats(el("statFilter").value);
  drawVehicles(el("vehFilter").value);
  drawRaces(el("raceFilter").value);
  drawCollect();
}

function drawStats(q) {
  q = (q || "").trim().toLowerCase();
  var host = el("stats");
  host.innerHTML = "";
  var shown = 0;
  GAME_KEYS.forEach(function (r) {
    if (q && r.key.toLowerCase().indexOf(q) === -1 && statName(r).toLowerCase().indexOf(q) === -1) return;
    shown++;
    var row = document.createElement("div");
    row.className = "stat";

    var cur = document.createElement("span");
    cur.className = "cursor";
    cur.setAttribute("aria-hidden", "true");

    var key = document.createElement("span");
    key.className = "key";
    key.textContent = r.key;

    var name = document.createElement("span");
    name.className = "name";
    name.textContent = statName(r);

    var kind = document.createElement("span");
    kind.className = "kind";
    kind.textContent = t(r.isHours ? "hintHours" : (r.isFloat ? "decimal" : "integer"));

    var inp = document.createElement("input");
    inp.type = "text";
    inp.inputMode = "decimal";
    inp.setAttribute("aria-label", t("aValue", r.key));
    inp.value = statRead(r);

    /* gCOL is not editable: the box is locked and the title says why. */
    if (r.key === "gCOL") {
      inp.disabled = true;
      inp.title = t("gColSynced");
      row.title = t("gColSynced");
    }

    row.appendChild(cur);
    row.appendChild(key);
    row.appendChild(name);
    row.appendChild(kind);
    row.appendChild(inp);

    inp.addEventListener("input", function () {
      if (statWrite(r, inp.value)) mark();
    });

    /* Leaving the field returns the text to canonical form: "2:5" becomes "2:05". */
    inp.addEventListener("blur", function () {
      inp.value = statRead(r);
    });
    host.appendChild(row);
  });
  if (!shown) host.innerHTML = '<p class="empty-note">' + t("noStat") + "</p>";
}

/* ghTC and ghTP hold fractional hours and the game shows h:mm; the rest of
   the list is a plain number. The conversion lives in one place so
   Statistics and Career never disagree. */
function statIsHours(r) { return r.key === "ghTC" || r.key === "ghTP"; }

function statRead(r) {
  /* gCOL is derived: it counts the checked boxes, like the game screen. */
  if (r.key === "gCOL") return String(collectFound());
  if (r.isHours) return hoursToText(view.getFloat32(r.at + 12));
  if (r.isTime) return msToText(u32(r.at + 12));
  return r.isFloat ? view.getFloat32(r.at + 12).toFixed(4) : u32(r.at + 12);
}

function statWrite(r, val) {
  /* gCOL is never written: it follows the Collectables checkboxes. */
  if (r.key === "gCOL") return false;
  if (r.isTime) {
    var ms = textToMs(val);
    if (ms === null) return false;
    setU32(r.at + 12, ms);
    return true;
  }
  if (r.isHours) {
    var h = textToHours(val);
    if (h === null) return false;
    view.setFloat32(r.at + 12, h);
    return true;
  }
  var v = Number(String(val).replace(",", "."));
  if (String(val).trim() === "" || !isFinite(v)) return false;
  if (r.isFloat) view.setFloat32(r.at + 12, v);
  else setU32(r.at + 12, Math.max(0, Math.min(4294967295, Math.floor(v))));
  return true;
}

/* Keeps gCOL (raw and on-screen field) in step with the checked boxes. */
function syncGcol() {
  var r = STATS.filter(function (x) { return x.key === "gCOL"; })[0];
  if (!r) return;
  var n = collectFound();
  setU32(r.at + 12, n);
  var row = [...el("stats").children].find(function (c) {
    return c.querySelector(".key") && c.querySelector(".key").textContent === "gCOL";
  });
  if (row) row.querySelector("input").value = String(n);
}

/* How many boxes are checked in LocalOptions. gCOL is the same count. */
function collectFound() {
  var lo = sec("LocalOptions"), base = lo.data + OFF.collect, c = 0;
  for (var i = 0; i < OFF.collectN; i++) if (bytes[base + i] === 1) c++;
  return c;
}

/* ---------- Vehicle Stats ---------- */

function drawVehicles(q) {
  q = (q || "").trim().toLowerCase();
  var host = el("vehstats");
  host.innerHTML = "";
  var shown = 0;

  /* One row per car with both numbers: wins and distance. The lists come
     from different records (vWIN has only winners, vkDT has all cars);
     VEH_ROWS already joined the two. */
  VEH_ROWS.forEach(function (row) {
    if (q && row.car.toLowerCase().indexOf(q) === -1) return;
    shown++;

    var elRow = document.createElement("div");
    elRow.className = "stat plain veh";

    var cur = document.createElement("span");
    cur.className = "cursor";
    cur.setAttribute("aria-hidden", "true");

    var name = document.createElement("span");
    name.className = "name";
    name.textContent = row.car;

    /* Each field carries its short label: without it, two side-by-side
       inputs do not say which is wins and which is distance. */
    var wins = statField(row.win, "vehWins", "integer");
    var dist = statField(row.dist, "vehDist", "decimal");

    elRow.appendChild(cur);
    elRow.appendChild(name);
    elRow.appendChild(wins);
    elRow.appendChild(dist);

    host.appendChild(elRow);
  });
  if (!shown) host.innerHTML = '<p class="empty-note">' + t("noStat") + "</p>";
}

/* One stat field: label plus input, both in the same cell. */
function statField(r, labelKey, kindKey) {
  var cell = document.createElement("div");
  cell.className = "stat-cell";

  var lab = document.createElement("span");
  lab.className = "cell-label";
  lab.textContent = t(labelKey);

  var inp = document.createElement("input");
  inp.type = "text";
  inp.inputMode = "decimal";
  inp.setAttribute("aria-label", t(labelKey));
  if (r) {
    inp.value = statRead(r);
    inp.addEventListener("input", function () {
      if (statWrite(r, inp.value)) mark();
    });
    inp.addEventListener("blur", function () { inp.value = statRead(r); });
  } else {
    /* Car with no win: the record does not exist in the save (vWIN is
       sparse), so 0 is shown as the game does and the field is locked. */
    inp.value = "0";
    inp.disabled = true;
    inp.title = t("vehNoWins");
  }

  cell.appendChild(lab);
  cell.appendChild(inp);
  return cell;
}

/* ---------- Race Stats ---------- */

/* Open/closed state of each group, surviving the filter (which redraws the
   whole list). */
var RACE_OPEN = {};

function drawRaces(q) {
  q = (q || "").trim().toLowerCase();
  var host = el("racestats");
  host.innerHTML = "";
  var shown = 0;

  /* The four menu screens: Ordered, Circuit, Unordered, Landmark. Each is
     a spoiler inside the panel spoiler: its header opens and closes its own
     rows, like the panels above. */
  RACE_GROUPS.forEach(function (g) {
    var rows = g.occ.map(function (occ) {
      return RACE_KEYS.filter(function (r) { return r.occ === occ; })[0];
    }).filter(Boolean);

    if (q) rows = rows.filter(function (r) { return statName(r).toLowerCase().indexOf(q) !== -1; });
    /* An empty group stays on screen: the game shows "NO STATS FOR THIS
       RACE TYPE" instead of hiding the category. The filter is the
       exception: when it finds nothing, the group goes like any other. */
    if (!rows.length && (q || g.hideEmpty)) return;

    var group = document.createElement("div");
    group.className = "stat-group";

    var head = document.createElement("div");
    head.className = "stat-head";

    var chev = document.createElement("span");
    chev.className = "chev";
    chev.setAttribute("aria-hidden", "true");
    chev.textContent = "\u25B6";

    var label = document.createElement("span");
    label.textContent = t(g.label);

    head.appendChild(chev);
    head.appendChild(label);

    /* Two layers: the outer grid animates 0fr -> 1fr, the inner one hides
       the overflow. A fixed max-height clipped the content (45 rows do not
       fit). */
    var body = document.createElement("div");
    body.className = "stat-group-body";

    var inner = document.createElement("div");
    inner.className = "stat-group-inner";
    body.appendChild(inner);

    if (!rows.length) {
      var note = document.createElement("p");
      note.className = "empty-note";
      note.textContent = t("raceNoStats");
      inner.appendChild(note);
    }

    rows.forEach(function (r) {
      shown++;

      var row = document.createElement("div");
      row.className = "stat plain";

      var cur = document.createElement("span");
      cur.className = "cursor";
      cur.setAttribute("aria-hidden", "true");

      var name = document.createElement("span");
      name.className = "name";
      name.textContent = statName(r);

      var kind = document.createElement("span");
      kind.className = "kind";
      kind.textContent = t("timeKind");

      var inp = document.createElement("input");
      inp.type = "text";
      inp.inputMode = "decimal";
      inp.setAttribute("aria-label", t("aValue", r.key));
      inp.value = statRead(r);

      row.appendChild(cur);
      row.appendChild(name);
      row.appendChild(kind);
      row.appendChild(inp);

      /* The mask adds ":" and "." itself: typing digits alone already
         yields the game format. */
      inp.addEventListener("input", function () {
        /* Adds ":" and "." while only digits are typed. */
        inp.value = maskTime(inp.value, inp.dataset.maskPrev);
        inp.dataset.maskPrev = inp.value;
        if (statWrite(r, inp.value)) mark();
      });
      inp.addEventListener("blur", function () {
        inp.value = statRead(r);
        inp.dataset.maskPrev = inp.value;
      });

      inner.appendChild(row);
    });

    group.appendChild(head);
    group.appendChild(body);
    host.appendChild(group);

    /* State comes from the map, not the DOM: the filter rebuilds from scratch. */
    if (RACE_OPEN[g.key]) group.classList.add("open");
    head.setAttribute("role", "button");
    head.setAttribute("tabindex", "0");
    head.setAttribute("aria-expanded", RACE_OPEN[g.key] ? "true" : "false");

    function toggle() {
      var open = group.classList.toggle("open");
      RACE_OPEN[g.key] = open;
      head.setAttribute("aria-expanded", open ? "true" : "false");
    }

    head.addEventListener("click", toggle);
    head.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " " || e.key === "Spacebar") {
        e.preventDefault();
        toggle();
      }
    });
  });

  if (!shown) host.innerHTML = '<p class="empty-note">' + t("noStat") + "</p>";
}

/* ---------- Collectables ---------- */

/* The 60 bytes live in LocalOptions, in menu order: Hollywood 20,
   Beach 15, Downtown 15, Hills 10. */
var COLLECT_GROUPS = [
  { key: "colHollywood", n: 20, at: 0 },
  { key: "colBeach", n: 15, at: 20 },
  { key: "colDowntown", n: 15, at: 35 },
  { key: "colHills", n: 10, at: 50 }
];

/* Open/closed state of each zone, surviving a redraw. */
var COLLECT_OPEN = {};

function drawCollect() {
  var host = el("collect");
  host.innerHTML = "";
  var lo = sec("LocalOptions");
  var base = lo.data + OFF.collect;
  var found = 0;

  COLLECT_GROUPS.forEach(function (g) {
    /* Same spoiler as the race categories: the zone header opens and
       closes its own rows. */
    var group = document.createElement("div");
    group.className = "stat-group";

    var head = document.createElement("div");
    head.className = "stat-head";

    var chev = document.createElement("span");
    chev.className = "chev";
    chev.setAttribute("aria-hidden", "true");
    chev.textContent = "\u25B6";

    var label = document.createElement("span");
    label.textContent = t(g.key);

    /* The zone found-counter sits in its own header. */
    var zoneFound = 0;
    for (var k = 0; k < g.n; k++) if (bytes[base + g.at + k] === 1) zoneFound++;

    var badge = document.createElement("span");
    badge.className = "group-count";
    badge.textContent = zoneFound + " / " + g.n;

    head.appendChild(chev);
    head.appendChild(label);
    head.appendChild(badge);

    var body = document.createElement("div");
    body.className = "stat-group-body";

    var inner = document.createElement("div");
    inner.className = "stat-group-inner";
    body.appendChild(inner);

    for (var i = 0; i < g.n; i++) {
      var at = base + g.at + i;
      var isFound = bytes[at] === 1;
      if (isFound) found++;

      var row = document.createElement("div");
      /* The last column is the box (22px), not the 128px text field. */
      row.className = "stat plain bool";

      var cur = document.createElement("span");
      cur.className = "cursor";
      cur.setAttribute("aria-hidden", "true");

      var name = document.createElement("span");
      name.className = "name";
      name.textContent = t(g.key) + " " + (i + 1);

      /* A real boolean: checked or not, with no text field to type
         "1"/"0" into. */
      var kind = document.createElement("span");
      kind.className = "kind";
      kind.textContent = t(isFound ? "colFound" : "colHidden");

      /* What shows is the .check label, the fourth column of the row. The
         input sits invisible just before it, in the same wrapper, so
         :checked + .check works and a click on the drawing lands too. */
      var wrap = document.createElement("div");
      wrap.className = "check-wrap";

      var box = document.createElement("input");
      box.type = "checkbox";
      box.checked = isFound;
      box.id = "col-" + g.key + "-" + i;
      box.setAttribute("aria-label", name.textContent);

      /* Not named `mark`: that collides with the global mark(). */
      var boxLabel = document.createElement("label");
      boxLabel.className = "check";
      boxLabel.setAttribute("for", box.id);

      wrap.appendChild(box);
      wrap.appendChild(boxLabel);

      row.appendChild(cur);
      row.appendChild(name);
      row.appendChild(kind);
      row.appendChild(wrap);

      /* `at` comes from a var inside the for: without an IIFE capture
         every box would write to the zone's last address. */
      (function (addr, word) {
        box.addEventListener("change", function () {
          setU8(addr, this.checked ? 1 : 0);
          /* The word next to the box is a label, not decoration: it has to
             follow the box in both directions. `word` is captured because
             `var kind` is shared by every row of the zone. */
          word.textContent = t(this.checked ? "colFound" : "colHidden");
          /* Header and zone counters count in memory, not in the DOM. */
          var lo = sec("LocalOptions"), b0 = lo.data + OFF.collect, c = 0;
          for (var q = 0; q < OFF.collectN; q++) if (bytes[b0 + q] === 1) c++;
          el("colCount").textContent = c + " / " + OFF.collectN;
          syncGcol();
          var z = 0;
          for (var q2 = 0; q2 < g.n; q2++) if (bytes[b0 + g.at + q2] === 1) z++;
          badge.textContent = z + " / " + g.n;
          mark();
        });
      })(at, kind);
      inner.appendChild(row);
    }

    group.appendChild(head);
    group.appendChild(body);
    host.appendChild(group);

    if (COLLECT_OPEN[g.key]) group.classList.add("open");
    head.setAttribute("role", "button");
    head.setAttribute("tabindex", "0");
    head.setAttribute("aria-expanded", COLLECT_OPEN[g.key] ? "true" : "false");

    function toggle() {
      var open = group.classList.toggle("open");
      COLLECT_OPEN[g.key] = open;
      head.setAttribute("aria-expanded", open ? "true" : "false");
    }

    head.addEventListener("click", toggle);
    head.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " " || e.key === "Spacebar") {
        e.preventDefault();
        toggle();
      }
    });
  });

  el("colCount").textContent = found + " / " + OFF.collectN;

  /* gCOL in the stats table follows the same count. */
  syncGcol();

  /* The same two actions as Progression: mark or clear everything at once. */
  el("colAll").onclick = function () { collectSet(1); };
  el("colNone").onclick = function () { collectSet(0); };
}

/* Writes 0 or 1 to all 60 bytes at once and redraws the list. */
function collectSet(v) {
  var lo = sec("LocalOptions"), base = lo.data + OFF.collect;
  for (var i = 0; i < OFF.collectN; i++) setU8(base + i, v);
  drawCollect();
  mark();
}
