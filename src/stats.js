// ---------- Statistics ----------

var STATS = [];
/* Sub-listas por tela do jogo, preenchidas em renderStats. */
var GAME_KEYS = [], VEH_KEYS = [], RACE_KEYS = [];

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

/* ---------- Nomes em ordem de memoria ----------
   A ordem dos registros repetidos e a que a jogo grava, nao a ordem do
   menu. Os nomes vem do dump da propria tela de estatisticas.

   r:TI tem 69 registros: 67 com nome, 2 sem (unordered/landmark, que a
   tela mostra como NO STATS). vWIN tem 21: so os carros com vitoria, na
   ordem do menu. vkDT tem 67: 66 carros do menu + 1 slot extra. */

var RACE_NAMES = [
  "CENTURY MALL",
  "HOLLYWOOD AND DOWNTOWN",
  "LAUREL CANYON LOOP",
  "PROMENADE",
  "THEATER CIRCUIT",
  "UNIVERSITY LOOP",
  "WESTWOOD",
  "Around Hollywood",
  "Central LA Showdown",
  "Century City Jumps",
  "Fairfax and Sunset",
  "Hollywood Drifts",
  "Laurel Canyon Run",
  "Macarthur Cut",
  "OLD HOLLYWOOD SHORTCUTS",
  "SUNSET AND VINE",
  "SUNSET RIVER RUN",
  "VALLEY FREEWAYS",
  "WELCOME TO HOLLYWOOD",
  "WEST LA CHALLENGE",
  "WILSHIRE BLVD.",
  "WISHIRE SPRINT",
  "CALIFORNIA INCLINE LOOP",
  "SANTA MONICA LOOP",
  "UNDER THE 405",
  "BEACHES AND BEVERLY RUN",
  "OCEAN TO LA RIVER",
  "OLD ROUTE 66",
  "SAND AND SURF",
  "UNIVERSITY CUT",
  "WESTSIDE RIDE",
  "WESTWOOD AND BRENTWOOD",
  "6TH ST.",
  "DOWNTOWN FREEWAY LOOP",
  "LA RIVER RUN",
  "MIDTOWN",
  "RAILYARD",
  "4TH STREET MEET",
  "CIVIC CENTER RACE",
  "CROSSBLOCKS",
  "DOWNTOWN TO PIER",
  "DOWNTOWN TOUR",
  "DOWNTOWN VISTAS",
  "FIGUEROA AND GRAND",
  "RAGS TO RICHES",
  "",
  "MULLHOLLAND",
  "HOLLYWOOD, VALLEY AND BEACHES",
  "MULLHOLLAND AND BEVERLY",
  "MULLHOLLAND DRIVE EAST",
  "MULLHOLLAND DRIVE WEST",
  "RIVER VALLEY",
  "UP AND OVER COLDWATER",
  "VENTURA LOOP",
  "10 AND 405 IS 110",
  "FIGUEROA AND VERMONT",
  "ROUND BALDWIN",
  "SOUTH CENTRAL SPEEDWAY",
  "TRACK CIRCUIT",
  "WEST ADAMS LOOP",
  "BALDWIN CRENSHAW RUN",
  "CAMPUS ORIENTATION",
  "CREENSHAW AND BACK",
  "SC TOURING TIME",
  "SOUTH CENTRAL TOUR",
  "SOUTHEAST RUN",
  "UNDER THE 10",
  "WEST ADAMS MATCH",
  ""
];

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
  "CHARGER POLICE CHP"
];

/* Nome de um registro repetido: a lista de nomes segue a ordem da memoria. */
function statName(r) {
  var base = STAT_NAMES[r.key];
  if (!base) return "";
  var list = r.key === "r:TI" ? RACE_NAMES
           : r.key === "vWIN" ? WIN_CAR_NAMES
           : r.key === "vkDT" ? CAR_ORDER_NAMES
           : null;
  if (list && list[r.occ]) return base + " \u00b7 " + list[r.occ];
  return r.occ ? base + " #" + (r.occ + 1) : base;
}

function renderStats() {
  var s = sec("Stats");
  STATS = [];
  var start = s.data + (((2 - (s.data % 16)) % 16) + 16) % 16;
  var seen = {};
  for (var o = start; o + 16 <= s.data + s.size; o += 16) {
    var k = ascii(o, 4);
    /* Aceita $, % e : no codigo: k$CE, k%AG, k:TB e r:TI sao reais e ficavam
       de fora da regex antiga, que so deixava [A-Za-z0-9]. */
    if (!/^[A-Za-z][A-Za-z0-9$%:]{3}$/.test(k)) continue;
    var kind = bytes[o + 8];
    var occ = seen[k] || 0;
    seen[k] = occ + 1;
    STATS.push({
      at: o, key: k, occ: occ,
      isFloat: kind === 0x28 || kind === 0x00,
      isHours: statIsHours({ key: k })
    });
  }
  /* As quatro telas do jogo: cada prefixo de FourCC pertence a uma. */
  GAME_KEYS = STATS.filter(function (r) { return r.key.charAt(0) === "g"; });
  VEH_KEYS = STATS.filter(function (r) { return r.key === "vWIN" || r.key === "vkDT"; });
  RACE_KEYS = STATS.filter(function (r) { return r.key === "r:TI"; });

  el("statCount").textContent = GAME_KEYS.length + " " + t("nRecords");
  el("vehCount").textContent = VEH_KEYS.length + " " + t("nRecords");
  el("raceCount").textContent = RACE_KEYS.length + " " + t("nRecords");

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

    row.appendChild(cur);
    row.appendChild(key);
    row.appendChild(name);
    row.appendChild(kind);
    row.appendChild(inp);

    inp.addEventListener("input", function () {
      if (statWrite(r, inp.value)) mark();
    });

    /* Sair do campo devolve o texto ao formato canonico: "2:5" vira "2:05". */
    inp.addEventListener("blur", function () {
      inp.value = statRead(r);
    });
    host.appendChild(row);
  });
  if (!shown) host.innerHTML = '<p class="empty-note">' + t("noStat") + "</p>";
}

/* ghTC e ghTP guardam horas fracionarias e o jogo mostra h:mm; o resto da
   lista e numero puro. A conversao fica num lugar so, pra Statistics e Career
   nao divergirem. */
function statIsHours(r) { return r.key === "ghTC" || r.key === "ghTP"; }

function statRead(r) {
  if (r.isHours) return hoursToText(view.getFloat32(r.at + 12));
  return r.isFloat ? view.getFloat32(r.at + 12).toFixed(4) : u32(r.at + 12);
}

function statWrite(r, val) {
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

/* ---------- Vehicle Stats ---------- */

function drawVehicles(q) {
  q = (q || "").trim().toLowerCase();
  var host = el("vehstats");
  host.innerHTML = "";
  var shown = 0;

  VEH_KEYS.forEach(function (r) {
    var label = statName(r);
    if (q && label.toLowerCase().indexOf(q) === -1) return;
    shown++;

    var row = document.createElement("div");
    row.className = "stat";

    var cur = document.createElement("span");
    cur.className = "cursor";
    cur.setAttribute("aria-hidden", "true");

    var name = document.createElement("span");
    name.className = "name";
    name.textContent = label;

    var kind = document.createElement("span");
    kind.className = "kind";
    kind.textContent = t(r.isFloat ? "decimal" : "integer");

    var inp = document.createElement("input");
    inp.type = "text";
    inp.inputMode = "decimal";
    inp.setAttribute("aria-label", t("aValue", r.key));
    inp.value = statRead(r);

    row.appendChild(cur);
    row.appendChild(name);
    row.appendChild(kind);
    row.appendChild(inp);

    inp.addEventListener("input", function () {
      if (statWrite(r, inp.value)) mark();
    });
    inp.addEventListener("blur", function () { inp.value = statRead(r); });

    host.appendChild(row);
  });
  if (!shown) host.innerHTML = '<p class="empty-note">' + t("noStat") + "</p>";
}

/* ---------- Race Stats ---------- */

function drawRaces(q) {
  q = (q || "").trim().toLowerCase();
  var host = el("racestats");
  host.innerHTML = "";
  var shown = 0;

  RACE_KEYS.forEach(function (r) {
    var label = statName(r);
    if (q && label.toLowerCase().indexOf(q) === -1) return;
    shown++;

    var row = document.createElement("div");
    row.className = "stat";

    var cur = document.createElement("span");
    cur.className = "cursor";
    cur.setAttribute("aria-hidden", "true");

    var name = document.createElement("span");
    name.className = "name";
    name.textContent = label;

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

    inp.addEventListener("input", function () {
      if (statWrite(r, inp.value)) mark();
    });
    inp.addEventListener("blur", function () { inp.value = statRead(r); });

    host.appendChild(row);
  });
  if (!shown) host.innerHTML = '<p class="empty-note">' + t("noStat") + "</p>";
}

/* ---------- Collectables ---------- */

/* Os 60 bytes ficam em LocalOptions, na ordem do menu: Hollywood 20,
   Beach 15, Downtown 15, Hills 10. */
var COLLECT_GROUPS = [
  { key: "colHollywood", n: 20, at: 0 },
  { key: "colBeach", n: 15, at: 20 },
  { key: "colDowntown", n: 15, at: 35 },
  { key: "colHills", n: 10, at: 50 }
];

function drawCollect() {
  var host = el("collect");
  host.innerHTML = "";
  var lo = sec("LocalOptions");
  var base = lo.data + OFF.collect;
  var found = 0;

  COLLECT_GROUPS.forEach(function (g) {
    var head = document.createElement("div");
    head.className = "stat-head";
    head.textContent = t(g.key);
    host.appendChild(head);

    for (var i = 0; i < g.n; i++) {
      var at = base + g.at + i;
      var isFound = bytes[at] === 1;
      if (isFound) found++;

      var row = document.createElement("div");
      row.className = "stat";

      var cur = document.createElement("span");
      cur.className = "cursor";
      cur.setAttribute("aria-hidden", "true");

      var name = document.createElement("span");
      name.className = "name";
      name.textContent = t(g.key) + " " + (i + 1);

      var kind = document.createElement("span");
      kind.className = "kind";
      kind.textContent = t(isFound ? "colFound" : "colHidden");

      var inp = document.createElement("input");
      inp.type = "text";
      inp.inputMode = "numeric";
      inp.value = isFound ? "1" : "0";
      inp.setAttribute("aria-label", name.textContent);

      row.appendChild(cur);
      row.appendChild(name);
      row.appendChild(kind);
      row.appendChild(inp);

      inp.addEventListener("input", function () {
        var n = Number(String(this.value).replace(",", "."));
        if (!isFinite(n)) return;
        setU8(at, n >= 1 ? 1 : 0);
        /* O contador do cabecalho conta os achados na memoria, nao no DOM. */
        var lo = sec("LocalOptions"), b0 = lo.data + OFF.collect, c = 0;
        for (var k = 0; k < OFF.collectN; k++) if (bytes[b0 + k] === 1) c++;
        el("colCount").textContent = c + " / " + OFF.collectN;
        mark();
      });
      inp.addEventListener("blur", function () {
        this.value = bytes[at] === 1 ? "1" : "0";
      });

      host.appendChild(row);
    }
  });

  el("colCount").textContent = found + " / " + OFF.collectN;
}
