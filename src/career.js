// ---------- Time Trial ----------

var TT_EVENTS = [
  { key: "ttHollywood2", label: "Hollywood time trial: '99 Eclipse - Race 2", target: 0, rec: 0 }
];

function ttEventName(e) {
  return e.label || t(e.key);
}

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
  var at = car.data + OFF.ttTarget + e.target * OFF.ttTargetStride;
  el("ttAt").textContent = "Career+0x" + (OFF.ttTarget + e.target * OFF.ttTargetStride).toString(16).toUpperCase();
  el("ttTarget").value = msToText(u32(at));
  el("ttTarget").setAttribute("aria-label", t("ttTarget") + " " + ttEventName(e));
}

el("ttTarget").addEventListener("input", function () {
  var e = TT_EVENTS[+el("ttEvent").value || 0], car = sec("Career"), st = sec("Stats");
  this.value = maskTime(this.value, this.dataset.maskPrev);
  this.dataset.maskPrev = this.value;
  var ms = textToMs(this.value);
  if (ms === null) return;
  setU32(car.data + OFF.ttTarget + e.target * OFF.ttTargetStride, ms);
  mark();
});

// ---------- Career ----------

/* A tela de carreira do jogo. Tudo isso mora nas RECORDS da secao Stats (nao
   no cabecalho, que e so um cache): uma linha de 16 bytes por FourCC, com o
   valor em +12. Cada entrada acha a sua linha pelo codigo na leitura.

   `fmt` diz como o valor e mostrado e aceito, e e a unica fonte do rotulo do
   tipo: int, dec, time (mm:ss.cc) ou hours (h:mm). */
var FMT_LABEL = { int: "hintInt", dec: "hintDec", time: "timeKind", hours: "hintHours" };

var CAREER_RECORDS = [
  /* Os cinco time trials sao o mesmo FourCC (k:TB) em cinco ocorrencias. */
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

/* Acha a linha de um FourCC na secao Stats e devolve o offset absoluto do
   valor. As linhas tem 16 bytes e comecam no primeiro offset da secao onde
   (offset % 16) == 2, o mesmo calculo de renderStats. */
/* Acha uma linha livre na tabela de Stats e grava o FourCC + tipo nela,
   devolvendo o offset do valor. A tabela tem 1056 linhas de 16 bytes e a
   jogo so grava as que usou: num save curto (mc4.sav.tuned) metade das
   estatisticas de carreira nao tem linha, e sem isso o campo fica vazio e
   nao aceita nada. */
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

/* Horas de jogo no formato do relogio: 1.9862 vira "1:59", 2.5 vira "2:30".
   A parte inteira e a hora, a fracao e o minuto (0.9862 * 60 = 59.17). */
function hoursToText(h) {
  var total = Math.max(0, Math.round(h * 60));
  return Math.floor(total / 60) + ":" + (total % 60 < 10 ? "0" : "") + (total % 60);
}

/* Entrada de tempo no formato mm:ss.cc. Aceita "3:15.32" e devolve
   "03:15.32": o que o jogador digitou e normalizado, nunca recusado so por
   falta de um zero a esquerda. null significa lixo. */
function textToMs(str) {
  var m = /^\s*(\d{1,3}):(\d{1,2})(?:[.,](\d{1,2}))?\s*$/.exec(str || "");
  if (!m) return null;
  var min = +m[1], sec = +m[2], frac = m[3] || "";
  if (sec > 59) return null;
  /* Dois digitos de centesimos; um unico vira dezena (".5" = 50). */
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
  /* Os cinco time trials guardam milisegundos e a tela mostra mm:ss.cc. */
  if (rec.fmt === "time") return msToText(u32(at));
  if (rec.fmt === "hours") return hoursToText(view.getFloat32(at));
  if (rec.fmt === "dec") return view.getFloat32(at).toFixed(4);
  return u32(at);
}

function careerWrite(rec, val) {
  if (rec.write) return rec.write(val);
  var at = statValueAt(rec.stat, rec.occ);
  /* Sem linha no save (save curto), cria uma livre em vez de recusar. Vale
     para qualquer ocorrencia: as linhas sao achadas por indice, entao criar
     a de k:TB 2 funciona desde que a 1 exista. */
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

    /* O rotulo do tipo sai de FMT_LABEL, o mesmo mapa que o leitor usa: um
    campo so, sem texto repetido na tela. */
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
      /* So nos campos de tempo: int e decimal nao tem mascara. */
      var isTime = rec.fmt === "time";
      if (isTime) {
        this.value = maskTime(this.value, this.dataset.maskPrev);
        this.dataset.maskPrev = this.value;
      }
      var ok = careerWrite(rec, this.value);
      if (ok) mark();
    });

    /* Ao sair do campo o texto volta ao formato canonico: quem digitou
       "3:15.32" ve "03:15.32". Enquanto digita nao mexo, pra o cursor nao
       pular no meio da edicao. */
    inp.addEventListener("blur", function () {
      inp.value = careerRead(rec);
      inp.dataset.maskPrev = inp.value;
    });
  });

  if (!shown) host.innerHTML = '<p class="empty-note">' + t("noCareer") + "</p>";
}
