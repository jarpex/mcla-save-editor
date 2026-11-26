// ---------- Progression ----------

function progBase() { return sec("Career").data + OFF.progBase; }
function progTotal() { return u32(sec("Career").data + OFF.progCount); }
function progAt(i) { return progBase() + i * OFF.progStride + 64; }

function progTally() {
  var n = progTotal(), done = 0;
  for (var i = 0; i < n; i++) if (bytes[progAt(i)]) done++;
  el("progCount").textContent = done + " " + t("of") + " " + n;
}

function progPaint() {
  el("prog").querySelectorAll(".cell").forEach(function (b) {
    b.setAttribute("aria-pressed", bytes[progAt(+b.dataset.prog)] ? "true" : "false");
  });
  progTally();
}

function progSet(v) {
  var n = progTotal();
  for (var i = 0; i < n; i++) bytes[progAt(i)] = v;
  progPaint();
  mark();
}

function renderProg() {
  var n = progTotal(), host = el("prog");
  host.innerHTML = "";
  for (var i = 0; i < n; i++) {
    var b = document.createElement("button");
    b.type = "button";
    b.className = "cell";
    b.textContent = i;
    b.dataset.prog = i;
    b.setAttribute("aria-label", t("aProg", i));
    host.appendChild(b);
  }
  host.onclick = function (e) {
    var b = e.target.closest(".cell");
    if (!b) return;
    var at = progAt(+b.dataset.prog);
    bytes[at] = bytes[at] ? 0 : 1;
    b.setAttribute("aria-pressed", bytes[at] ? "true" : "false");
    progTally();
    mark();
  };
  el("progAll").onclick = function () { progSet(1); };
  el("progNone").onclick = function () { progSet(0); };
  progPaint();
}
