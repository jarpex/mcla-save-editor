// ---------- Time Trial ----------

/* Targets live in a table of 4 u32 (ms) inside Career, followed at once by
   16 race targets. The base is NOT fixed: in a short save it sits at
   +0x727D, but with more events (mc4.sav.COMPLETED, lancers) it moves to
   +0x7291. So the table is found by pattern, not by constant: 4 plausible
   values (10-400 s) then 16 that are plausible or zero. */
var TT_BASE = null;
var RACE_TARGETS = 16;

function ttBase() {
  if (TT_BASE !== null) return TT_BASE;
  var car = sec("Career");
  TT_BASE = -1;
  for (var off = 0; off + 80 < car.size; off++) {
    var ok = true;
    for (var i = 0; i < 4; i++) {
      if (!ttPlausible(u32(car.data + off + i * 4))) { ok = false; break; }
    }
    if (!ok) continue;
    for (var j = 0; j < RACE_TARGETS; j++) {
      var v = u32(car.data + off + 16 + j * 4);
      if (!ttPlausible(v) && v !== 0) { ok = false; break; }
    }
    if (ok) { TT_BASE = off; break; }
  }
  return TT_BASE;
}

function ttPlausible(v) { return v >= 10000 && v <= 400000; }

/* The [Untested] tag is literal in the label: none of these targets was
   confirmed against the game, they were only found by pattern. */
function ttMark(label) { return label + " [" + t("ttUntested") + "]"; }

var TT_EVENTS = [{ key: "ttHollywood2", label: "Hollywood time trial: '99 Eclipse - Race 2", target: 0, rec: 0 }];

/* The 16 race targets sit right after the 4 time trial ones. Names are not
   mapped yet (the game table was never dumped). */
for (var _r = 0; _r < RACE_TARGETS; _r++) {
  TT_EVENTS.push({ key: "raceTarget" + _r, label: "Race target #" + (_r + 1), target: 4 + _r, rec: 0 });
}

function ttEventName(e) {
  return ttMark(e.label || t(e.key));
}

function resetTtBase() { TT_BASE = null; }

function renderTimeTrial() {
  var host = el("ttEvent");
  host.innerHTML = "";
  TT_EVENTS.forEach(function (e, i) {
    var o = document.createElement("option");
    o.value = i;
    o.textContent = ttEventName(e);
    host.appendChild(o);
  });
  host.onchange = function () { paintTimeTrial(); };
  paintTimeTrial();
}

function paintTimeTrial() {
  var e = TT_EVENTS[+el("ttEvent").value || 0], car = sec("Career");
  var base = ttBase();
  if (base < 0) {
    el("ttAt").textContent = "Career+?";
    el("ttTarget").value = "";
    el("ttTarget").disabled = true;
    return;
  }
  el("ttTarget").disabled = false;
  var at = car.data + base + e.target * OFF.ttTargetStride;
  el("ttAt").textContent = "Career+0x" + (base + e.target * OFF.ttTargetStride).toString(16).toUpperCase();
  el("ttTarget").value = msToText(u32(at));
  el("ttTarget").setAttribute("aria-label", t("ttTarget") + " " + ttEventName(e));
}

el("ttTarget").addEventListener("input", function () {
  var e = TT_EVENTS[+el("ttEvent").value || 0], car = sec("Career");
  var base = ttBase();
  this.value = maskTime(this.value, this.dataset.maskPrev);
  this.dataset.maskPrev = this.value;
  var ms = textToMs(this.value);
  if (ms === null || base < 0) return;
  setU32(car.data + base + e.target * OFF.ttTargetStride, ms);
  mark();
});

// ---------- Career ----------

/* The game's career screen. All of it lives in the Stats section RECORDS,
   not in the header, which is only a cache: one 16-byte row per FourCC with
   the value at +12. Each entry finds its row by code on read.

   `fmt` says how the value is shown and accepted, and is the only source of
   the type label: int, dec, time (mm:ss.cc) or hours (h:mm). */
var FMT_LABEL = { int: "hintInt", dec: "hintDec", time: "timeKind", hours: "hintHours" };

var CAREER_RECORDS = [
  /* The five time trials are one FourCC (k:TB) in five occurrences. */
  { code: "k:TB", occ: 0, id: "careerRecord", titleKey: "ttHollywood", fmt: "time", stat: "k:TB" },
  { code: "k:TB", occ: 1, titleKey: "ttBeach", fmt: "time", stat: "k:TB" },
  { code: "k:TB", occ: 2, titleKey: "ttHills", fmt: "time", stat: "k:TB" },
  { code: "k:TB", occ: 3, titleKey: "ttDowntown", fmt: "time", stat: "k:TB" },
  { code: "k:TB", occ: 4, titleKey: "ttSouthCentral", fmt: "time", stat: "k:TB" },
  { code: "kCCW", titleKey: "careerMostWins", fmt: "int", stat: "kCCW" },
  { code: "kCWN", titleKey: "careerConsec", fmt: "int", stat: "kCWN" },
  { code: "k2ND", titleKey: "careerSecond", fmt: "int", stat: "k2ND" },
  { code: "k3RD", titleKey: "careerThird", fmt: "int", stat: "k3RD" },
  { code: "kRCP", titleKey: "careerRaces", fmt: "int", stat: "kRCP" },
  { code: "kWIN", titleKey: "careerWins", fmt: "int", stat: "kWIN" },
  { code: "kLED", titleKey: "careerLead", fmt: "int", stat: "kLED" },
  { code: "kHOK", titleKey: "careerHookmen", fmt: "int", stat: "kHOK" },
  { code: "kDLT", titleKey: "careerDeliveries", fmt: "int", stat: "kDLT" },
  { code: "kTRS", titleKey: "careerRestarts", fmt: "int", stat: "kTRS" },
  { code: "kARS", titleKey: "careerAvgRestart", fmt: "dec", stat: "kARS" },
  { code: "kFWN", titleKey: "careerFreeway", fmt: "int", stat: "kFWN" },
  { code: "kRLW", titleKey: "careerRedlight", fmt: "int", stat: "kRLW" },
  { code: "kMUW", titleKey: "careerMuscle", fmt: "int", stat: "kMUW" },
  { code: "kTUW", titleKey: "careerTuner", fmt: "int", stat: "kTUW" },
  { code: "kLOW", titleKey: "careerLowrider", fmt: "int", stat: "kLOW" },
  { code: "kLUW", titleKey: "careerLuxury", fmt: "int", stat: "kLUW" },
  { code: "kMOW", titleKey: "careerMoto", fmt: "int", stat: "kMOW" },
  { code: "kMRS", titleKey: "careerMaxRestart", fmt: "int", stat: "kMRS" },
  { code: "kPDS", titleKey: "careerPayback", fmt: "int", stat: "kPDS" },
  { code: "kSUW", titleKey: "careerSuv", fmt: "int", stat: "kSUW" },
  { code: "kEXW", titleKey: "careerExotic", fmt: "int", stat: "kEXW" },
  { code: "k$CE", titleKey: "careerCash", fmt: "int", stat: "k$CE" },
  { code: "k%AG", titleKey: "careerPercent", fmt: "int", stat: "k%AG" },
  { code: "k$WA", occ: 0, titleKey: "careerWagerHollywood", fmt: "int", stat: "k$WA" },
  { code: "k$WA", occ: 1, titleKey: "careerWagerBeach", fmt: "int", stat: "k$WA" },
  { code: "k$WA", occ: 2, titleKey: "careerWagerDowntown", fmt: "int", stat: "k$WA" },
  { code: "k$WA", occ: 3, titleKey: "careerWagerSouthCentral", fmt: "int", stat: "k$WA" },
  { code: "khTC", id: "careerHours", titleKey: "careerHours", fmt: "hours", stat: "khTC" }
];

/* Finds a FourCC row in the Stats section and returns the absolute value
   offset. Rows are 16 bytes and start at the first section offset where
   (offset % 16) == 2, the same math as renderStats. */
/* Finds a free row in the Stats table, writes the FourCC and type there and
   returns the value offset. The table has 1056 rows of 16 bytes and the game
   writes only the ones it used: in a short save (mc4.sav.tuned) half the
   career stats have no row, and without this the field stays empty and
   accepts nothing. */
function statAlloc(code, isFloat) {
  var s = sec("Stats");
  var start = s.data + (((2 - (s.data % 16)) % 16) + 16) % 16;
  for (var o = start; o + 16 <= s.data + s.size; o += 16) {
    var k = ascii(o, 4);
    if (/^[A-Za-z][A-Za-z0-9$%:]{3}$/.test(k)) continue;
    for (var i = 0; i < 4; i++) bytes[o + i] = code.charCodeAt(i);
    bytes[o + 8] = isFloat ? 0x28 : 0x29;
    setU32(o + 12, 0);
    return o + 12;
  }
  return -1;
}

function statValueAt(code, occ) {
  var s = sec("Stats");
  var start = s.data + (((2 - (s.data % 16)) % 16) + 16) % 16;
  var seen = 0;
  for (var o = start; o + 16 <= s.data + s.size; o += 16) {
    if (ascii(o, 4) === code) {
      if (seen === (occ || 0)) return o + 12;
      seen++;
    }
  }
  return -1;
}

/* Play time in clock form: 1.9862 becomes "1:59", 2.5 becomes "2:30".
   The integer part is the hour, the fraction the minute
   (0.9862 * 60 = 59.17). */
function hoursToText(h) {
  var total = Math.max(0, Math.round(h * 60));
  return Math.floor(total / 60) + ":" + (total % 60 < 10 ? "0" : "") + (total % 60);
}

/* Time entry in mm:ss.cc. Accepts "3:15.32" and returns "03:15.32": what
   the player typed is normalized, never rejected just for a missing leading
   zero. null means garbage. */
function textToMs(str) {
  var m = /^\s*(\d{1,3}):(\d{1,2})(?:[.,](\d{1,2}))?\s*$/.exec(str || "");
  if (!m) return null;
  var min = +m[1], sec = +m[2], frac = m[3] || "";
  if (sec > 59) return null;
  /* Two hundredths digits; a single one becomes a ten (".5" = 50). */
  var cs = frac.length === 1 ? +frac * 10 : +frac;
  return Math.max(0, Math.min(4294967295, min * 60000 + sec * 1000 + cs * 10));
}

function textToHours(str) {
  var m = /^\s*(\d{1,3}):(\d{1,2})\s*$/.exec(str || "");
  if (!m) return null;
  var h = +m[1], min = +m[2];
  if (min > 59) return null;
  return h + min / 60;
}

function careerRead(rec) {
  if (rec.read) return rec.read();
  var at = statValueAt(rec.stat, rec.occ);
  if (at < 0) return "";
  /* The five time trials store milliseconds and the screen shows mm:ss.cc. */
  if (rec.fmt === "time") return msToText(u32(at));
  if (rec.fmt === "hours") return hoursToText(view.getFloat32(at));
  if (rec.fmt === "dec") return view.getFloat32(at).toFixed(4);
  return u32(at);
}

function careerWrite(rec, val) {
  if (rec.write) return rec.write(val);
  var at = statValueAt(rec.stat, rec.occ);
  /* With no row in the save (short save), create a free one instead of
     refusing. Works for any occurrence: rows are found by index, so creating
     k:TB 2 works as long as 1 exists. */
  if (at < 0) at = statAlloc(rec.stat, rec.fmt === "dec");
  if (at < 0) return false;
  if (rec.fmt === "time") {
    var ms = textToMs(val);
    if (ms === null) return false;
    setU32(at, ms);
    return true;
  }
  if (rec.fmt === "hours") {
    var h = textToHours(val);
    if (h === null) return false;
    view.setFloat32(at, h);
    return true;
  }
  var n = Number(String(val).replace(",", "."));
  if (!isFinite(n)) return false;
  if (rec.fmt === "dec") view.setFloat32(at, n);
  else setU32(at, Math.max(0, Math.min(4294967295, Math.floor(n))));
  return true;
}

function renderCareer() {
  el("careerCount").textContent = CAREER_RECORDS.length + " " + t("nRecords");
  el("careerFilter").oninput = function () { drawCareer(this.value); };
  drawCareer(el("careerFilter").value);
}

function drawCareer(q) {
  q = (q || "").trim().toLowerCase();
  var host = el("career");
  host.innerHTML = "";
  var shown = 0;

  CAREER_RECORDS.forEach(function (rec) {
    var titleText = t(rec.titleKey);
    var typeText = t(FMT_LABEL[rec.fmt]);
    if (q &&
        rec.code.toLowerCase().indexOf(q) === -1 &&
        titleText.toLowerCase().indexOf(q) === -1 &&
        typeText.toLowerCase().indexOf(q) === -1) {
      return;
    }
    shown++;

    var row = document.createElement("div");
    row.className = "stat wide";

    var cur = document.createElement("span");
    cur.className = "cursor";
    cur.setAttribute("aria-hidden", "true");

    var who = document.createElement("div");
    who.className = "who";

    var key = document.createElement("span");
    key.className = "key";
    key.textContent = titleText;

    /* The type label comes from FMT_LABEL, the same map the reader uses: one
    field, no text repeated on screen. */
    var kind = document.createElement("span");
    kind.className = "kind";
    kind.textContent = typeText;

    who.appendChild(key);
    who.appendChild(kind);

    var inp = document.createElement("input");
    inp.type = "text";
    inp.inputMode = "decimal";
    if (rec.id) inp.id = rec.id;
    inp.value = careerRead(rec);
    inp.setAttribute("aria-label", titleText);

    row.appendChild(cur);
    row.appendChild(who);
    row.appendChild(inp);
    host.appendChild(row);

    inp.addEventListener("input", function () {
      /* Time fields only: int and decimal have no mask. */
      var isTime = rec.fmt === "time";
      if (isTime) {
        this.value = maskTime(this.value, this.dataset.maskPrev);
        this.dataset.maskPrev = this.value;
      }
      var ok = careerWrite(rec, this.value);
      if (ok) mark();
    });

    /* On leaving the field the text returns to canonical form: whoever typed
       "3:15.32" sees "03:15.32". While typing it is left alone so the caret
       does not jump mid-edit. */
    inp.addEventListener("blur", function () {
      inp.value = careerRead(rec);
      inp.dataset.maskPrev = inp.value;
    });
  });

  if (!shown) host.innerHTML = '<p class="empty-note">' + t("noCareer") + "</p>";
}
