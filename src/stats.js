// ---------- Statistics ----------

var STATS = [];

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

/* Areas, na ordem em que a jogo grava os registros repetidos. */
var AREA_NAMES = ["Hollywood", "Beaches", "Downtown", "South Central"];
var TT_NAMES = [
  "Hollywood: '99 Eclipse",
  "Beach: '69 Mustang",
  "Hills: '71 Miura SV",
  "Downtown: '99 3000GT",
  "South Central: '64 Impala"
];

/* Chaves que aparecem mais de uma vez: k$WA (4 areas), k:TB (5 time trials),
   tMTP (14), vWIN (21), vkDT (67), r:TI (69). O numero da ocorrencia entra
   no nome, senao as quatro apostas ficam todas "Wager Win Amount". */
var REPEATED = { "k$WA": 1, "k:TB": 1, tMTP: 1, vWIN: 1, vkDT: 1, "r:TI": 1 };

function statName(r) {
  var base = STAT_NAMES[r.key];
  if (!base) return "";
  if (!REPEATED[r.key]) return base;
  var names = r.key === "k$WA" ? AREA_NAMES
            : r.key === "k:TB" ? TT_NAMES
            : null;
  if (names && names[r.occ]) return base + " \u00b7 " + names[r.occ];
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
  el("statCount").textContent = STATS.length + " " + t("nRecords");
  el("statFilter").oninput = function () { drawStats(this.value); };
  drawStats(el("statFilter").value);
}

function drawStats(q) {
  q = (q || "").trim().toLowerCase();
  var host = el("stats");
  host.innerHTML = "";
  var shown = 0;
  STATS.forEach(function (r) {
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
