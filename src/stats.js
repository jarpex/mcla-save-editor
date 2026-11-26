// ---------- Statistics ----------

var STATS = [];

var STAT_NAMES = {
  gBRN: "Total Burnouts",
  gCOL: "Collectables",
  gCPA: "Totals Cops Activated",
  gCPL: "Total Cops Lost",
  gCWN: "Non Career Consecutive Wins",
  gDAM: "Total damage points",
  gHOP: "Total Opponents Hit",
  gHPR: "Total Props Hit",
  gHTR: "Total Traffic Hit",
  gNIT: "Total Nitrous",
  gOUT: "Total Damage Out",
  gRCP: "Races Completed",
  gROR: "Total Roar Special Ability",
  gSST: "Total Slipstream Turbo",
  gWIN: "Total Numbers of Wins",
  gWIP: "Total Wipeouts",
  ghTC: "Total Hours Cruising",
  ghTP: "Total Hours Played",
  gk2W: "Two Wheel Driving Distance (miles)",
  gkDS: "Total Distance Traveled (miles)",
  gmJD: "Max. Jump Distance (meters)",
  gsJT: "Total Jump Time (seconds)"
};

function statName(r) { return STAT_NAMES[r.key] || ""; }

function renderStats() {
  var s = sec("Stats");
  STATS = [];
  var start = s.data + (((2 - (s.data % 16)) % 16) + 16) % 16;
  for (var o = start; o + 16 <= s.data + s.size; o += 16) {
    var k = ascii(o, 4);
    if (!/^[A-Za-z][A-Za-z0-9]{3}$/.test(k)) continue;
    var kind = bytes[o + 8];
    STATS.push({
      at: o, key: k,
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
