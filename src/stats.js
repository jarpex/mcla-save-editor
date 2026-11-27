// ---------- Statistics ----------

var STATS = [];
/* Sub-listas por tela do jogo, preenchidas em renderStats. */
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

/* ---------- Nomes em ordem de memoria ----------
   A ordem dos registros repetidos e a que a jogo grava, nao a ordem do
   menu. Os nomes vem do dump da propria tela de estatisticas.

   r:TI tem 69 registros: 67 com nome, 2 sem (unordered/landmark, que a
   tela mostra como NO STATS). vWIN tem 21: so os carros com vitoria, na
   ordem do menu. vkDT tem 67: 66 carros do menu + 1 slot extra. */

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
  "",
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

/* As quatro telas de corrida do jogo, na ordem em que aparecem no menu.
   Os indices sao as ocorrencias de r:TI na memoria (a ordem gravada e outra,
   veja RACE_NAMES). Unordered e Landmark ficam vazias: a tela do jogo mostra
   "NO STATS FOR THIS RACE TYPE" e nao ha registro com nome. As duas entradas
   sem nome da memoria (45 e 68) vao para Unknown. */
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
  /* Unknown so aparece se tiver alguma linha: e a categoria do que nao
     deu para reconhecer, entao vazia ela nao diz nada. */
  { key: "stRaceUnknown", label: "stRaceUnknown", hideEmpty: true, occ: [
  45,
  68
]
  }
];

/* Carros que tem registro em vWIN, na ordem em que a jogo grava (a mesma
   ordem do menu, so sem os carros que nunca venceram). A lista e esparsa de
   proposito: nao da para derivar os nomes de CAR_ORDER_NAMES por indice. */
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
  /* Nas corridas o nome proprio basta: a coluna do tipo ja diz "time", e
     "Race Time · Around Hollywood" so repetia o cabecalho da tabela. */
  if (r.key === "r:TI") {
    if (list[r.occ]) return list[r.occ];
    return "#" + (r.occ + 1);
  }
  if (list && list[r.occ]) return base + " \u00b7 " + list[r.occ];
  /* As duas entradas sem nome ficam em Unknown; sem texto proprio, usamos o
     numero da ocorrencia na memoria. */
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
      isHours: statIsHours({ key: k }),
      /* r:TI guarda milisegundos; a tela mostra mm:ss.cc como o jogo. */
      isTime: k === "r:TI"
    });
  }
  /* As quatro telas do jogo: cada prefixo de FourCC pertence a uma. */
  GAME_KEYS = STATS.filter(function (r) { return r.key.charAt(0) === "g"; });
  VEH_KEYS = STATS.filter(function (r) { return r.key === "vWIN" || r.key === "vkDT"; });
  RACE_KEYS = STATS.filter(function (r) { return r.key === "r:TI"; });

  el("statCount").textContent = GAME_KEYS.length + " " + t("nRecords");
  el("vehCount").textContent = VEH_KEYS.length + " " + t("nRecords");
  el("raceCount").textContent = RACE_KEYS.length + " " + t("nRecords");

  /* Uma linha por carro, como a jogo mostra.
     vWIN e esparso: so grava quem tem pelo menos uma vitoria (21 registros
     neste save), e os indices sao comprimidos, sem buraco para carro sem
     vitoria. vkDT nao e esparso: tem um registro por carro (67, um a mais
     que os 66 nomes do menu).
     Por isso o cruzamento e pelo nome do carro, nunca pelo indice: usar o
     indice juntaria "1998 240SX" (vWIN[0]) com "1983 Golf/GTI" (vkDT[0]),
     que e justamente o carro que nunca venceu. Quem nao aparece em vWIN
     fica com win: null e o campo sai travado em 0. */
  VEH_ROWS = [];
  var winByCar = {};
  VEH_KEYS.forEach(function (r) {
    if (r.key === "vWIN") winByCar[WIN_CAR_NAMES[r.occ]] = r;
  });
  VEH_KEYS.forEach(function (r) {
    if (r.key !== "vkDT") return;
    var car = CAR_ORDER_NAMES[r.occ];
    /* vkDT tem 67 registros e a lista de nomes do menu tem 66: o ultimo
       registro nao tem carro e fica de fora. */
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
  if (r.isTime) return msToText(u32(r.at + 12));
  return r.isFloat ? view.getFloat32(r.at + 12).toFixed(4) : u32(r.at + 12);
}

function statWrite(r, val) {
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

/* ---------- Vehicle Stats ---------- */

function drawVehicles(q) {
  q = (q || "").trim().toLowerCase();
  var host = el("vehstats");
  host.innerHTML = "";
  var shown = 0;

  /* O jogo mostra uma linha por carro com os dois numeros: vitórias e
     distância. As duas listas vem de registros diferentes (vWIN so tem
     quem venceu, vkDT tem todos), VEH_ROWS ja cruzou os dois. */
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

    /* Cada campo leva o seu rotulo curto: sem isso, dois inputs lado a
       lado nao dizem qual e vitoria e qual e distancia. */
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

/* Um campo de stat: rotulo + input, os dois na mesma celula. */
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
    /* Carro sem vitoria: o registro nao existe no save (vWIN e esparso),
       entao mostramos 0 como a jogo faz e travamos o campo. */
    inp.value = "0";
    inp.disabled = true;
    inp.title = t("vehNoWins");
  }

  cell.appendChild(lab);
  cell.appendChild(inp);
  return cell;
}

/* ---------- Race Stats ---------- */

/* Estado aberto/fechado de cada grupo, sobrevivendo ao filtro (que redesenha
   a lista inteira). */
var RACE_OPEN = {};

function drawRaces(q) {
  q = (q || "").trim().toLowerCase();
  var host = el("racestats");
  host.innerHTML = "";
  var shown = 0;

  /* As quatro telas do menu: Ordered, Circuit, Unordered, Landmark. Cada uma
     e um spoiler dentro do spoiler do painel: o cabecalho abre e fecha as
     proprias linhas, igual aos paineis de cima. */
  RACE_GROUPS.forEach(function (g) {
    var rows = g.occ.map(function (occ) {
      return RACE_KEYS.filter(function (r) { return r.occ === occ; })[0];
    }).filter(Boolean);

    if (q) rows = rows.filter(function (r) { return statName(r).toLowerCase().indexOf(q) !== -1; });
    /* Grupo vazio continua na tela: a jogo mostra "NO STATS FOR THIS RACE
       TYPE" em vez de esconder a categoria. O filtro e a excecao: se ele
       nao achou nada, a categoria some como qualquer outra. */
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

    /* Duas camadas: o grid anima 0fr -> 1fr na externa, a interna esconde o
       excesso. Com max-height fixo o conteudo cortava (45 linhas nao cabem). */
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

      /* A mascara poe ":" e "." sozinha: enquanto digita so numeros, o
         texto ja sai no formato do jogo. */
      inp.addEventListener("input", function () {
        /* Poe ":" e "." sozinha enquanto se digita so numeros. */
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

    /* O estado vem do mapa, nao do DOM: o filtro recria tudo do zero. */
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

/* Os 60 bytes ficam em LocalOptions, na ordem do menu: Hollywood 20,
   Beach 15, Downtown 15, Hills 10. */
var COLLECT_GROUPS = [
  { key: "colHollywood", n: 20, at: 0 },
  { key: "colBeach", n: 15, at: 20 },
  { key: "colDowntown", n: 15, at: 35 },
  { key: "colHills", n: 10, at: 50 }
];

/* Estado aberto/fechado de cada zona, sobrevivendo a redesenho. */
var COLLECT_OPEN = {};

function drawCollect() {
  var host = el("collect");
  host.innerHTML = "";
  var lo = sec("LocalOptions");
  var base = lo.data + OFF.collect;
  var found = 0;

  COLLECT_GROUPS.forEach(function (g) {
    /* Mesmo spoiler das categorias de corrida: o cabecalho da zona abre e
       fecha as suas linhas. */
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

    /* O contador de achados da zona fica no proprio cabecalho. */
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
      /* A ultima coluna e a caixa (22px), nao os 128px do campo de texto. */
      row.className = "stat plain bool";

      var cur = document.createElement("span");
      cur.className = "cursor";
      cur.setAttribute("aria-hidden", "true");

      var name = document.createElement("span");
      name.className = "name";
      name.textContent = t(g.key) + " " + (i + 1);

      /* E um booleano de verdade: caixa marcada ou nao, sem campo de texto
         para digitar "1"/"0". */
      var kind = document.createElement("span");
      kind.className = "kind";
      kind.textContent = t(isFound ? "colFound" : "colHidden");

      /* O que se ve e o label .check, que e a quarta coluna da linha. O input
         fica invisivel logo antes dele, dentro do mesmo wrapper: assim o
         seletor :checked + .check funciona e o clique no desenho tambem. */
      var wrap = document.createElement("div");
      wrap.className = "check-wrap";

      var box = document.createElement("input");
      box.type = "checkbox";
      box.checked = isFound;
      box.id = "col-" + g.key + "-" + i;
      box.setAttribute("aria-label", name.textContent);

      var mark = document.createElement("label");
      mark.className = "check";
      mark.setAttribute("for", box.id);

      wrap.appendChild(box);
      wrap.appendChild(mark);

      row.appendChild(cur);
      row.appendChild(name);
      row.appendChild(kind);
      row.appendChild(wrap);

      /* `at` vem de um var dentro do for: sem capturar em IIFE todas as
         caixas escreveriam no ultimo endereco da zona. */
      (function (addr) {
        box.addEventListener("change", function () {
          setU8(addr, this.checked ? 1 : 0);
          /* Contador do cabecalho e da zona contam na memoria, nao no DOM. */
          var lo = sec("LocalOptions"), b0 = lo.data + OFF.collect, c = 0;
          for (var q = 0; q < OFF.collectN; q++) if (bytes[b0 + q] === 1) c++;
          el("colCount").textContent = c + " / " + OFF.collectN;
          var z = 0;
          for (var q2 = 0; q2 < g.n; q2++) if (bytes[b0 + g.at + q2] === 1) z++;
          badge.textContent = z + " / " + g.n;
          mark();
        });
      })(at);
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

  /* As duas mesmas acoes da Progressao: marcar ou limpar tudo de uma vez. */
  el("colAll").onclick = function () { collectSet(1); };
  el("colNone").onclick = function () { collectSet(0); };
}

/* Grava 0 ou 1 nos 60 bytes de uma vez e redesenha a lista. */
function collectSet(v) {
  var lo = sec("LocalOptions"), base = lo.data + OFF.collect;
  for (var i = 0; i < OFF.collectN; i++) setU8(base + i, v);
  drawCollect();
  mark();
}
