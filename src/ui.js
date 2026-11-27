/* How many slots fit in the section. Plain integer division is not enough:
   the last slot can be truncated in the tail and still be a real car.
   In mc4.sav.COMPLETED the section has 29 full slots plus 7459 bytes, and
   car 30 (vp_lam_murcielago_06) lives right there: name, label, plate and
   tune fit in the first 7459 bytes, only the 717-byte tail the editor never
   reads is missing.
   So the test is that the name (32 bytes) fits, not the whole stride. */
function slotCount() {
  var lo = sec("LocalOptions"), n = 0;
  while (OFF.slot0 + (n + 1) * OFF.slotStride <= lo.size) n++;
  if (OFF.slot0 + n * OFF.slotStride + 32 <= lo.size) n++;
  return n;
}

/* The plate sits in the previous stride (OFF.plateStrideBack), and the game
   writes space as 0x3E (">"), not 0x20. */
function plateAt(n) {
  var at = slotAt(n) - OFF.slotStride * OFF.plateStrideBack + OFF.slotPlate;
  var out = "";
  for (var i = 0; i < 8; i++) {
    var c = bytes[at + i];
    if (c === 0 || c === 0xCD) break;
    out += (c === 0x3E) ? " " : String.fromCharCode(c);
  }
  return out;
}

/* Returns the 7 plate byte codes: space becomes 0x3E, as the game writes. */
function plateFrom(str) {
  var out = [];
  for (var i = 0; i < 7; i++) out.push(i < str.length ? (str[i] === " " ? 0x3E : str.charCodeAt(i)) : 0);
  return out;
}

function readSlot(n) {
  var o = slotAt(n);
  var name = ascii(o, 32);
  return {
    i: n, at: o,
    car: (name === "blank" || name === "") ? "" : name,
    label: ascii(o + OFF.slotLabel, 32),
    plate: plateAt(n)
  };
}

function contiguous() {
  var n = 0, total = slotCount();
  while (n < total && readSlot(n).car) n++;
  return n;
}

/* Strict integer validation: digits only, clamped strictly to [0, 2000000000]. */
function parseClampedInt(raw) {
  var digits = String(raw == null ? "" : raw).replace(/\D+/g, "");
  if (!digits) return 0;
  var n = parseInt(digits, 10);
  if (!isFinite(n) || n < 0) return 0;
  return n > MAX_WALLET ? MAX_WALLET : n;
}

/* Formats the wallet field: fixed prefix (money's "$") and thousands
   separator. The user types digits only; the comma appears by itself.

   The caret is repositioned by counting the digits before it, or formatting
   mid-edit would throw the cursor to the end. */
function maskWallet(inp, prefix) {
  var raw = inp.value;
  var caret = inp.selectionStart == null ? raw.length : inp.selectionStart;
  var digitsBefore = raw.slice(0, caret).replace(/\D+/g, "").length;

  var digits = raw.replace(/\D+/g, "");
  var val = parseClampedInt(digits);
  var body = digits === "" ? "" : nf(val);
  inp.value = (prefix || "") + body;

  var pos = (prefix || "").length, seen = 0;
  while (pos < inp.value.length && seen < digitsBefore) {
    if (/[0-9]/.test(inp.value.charAt(pos))) seen++;
    pos++;
  }
  if (inp.setSelectionRange) inp.setSelectionRange(pos, pos);
  return val;
}

function syncWalletControls() {
  var mVal = parseClampedInt(el("money").value);
  var rVal = parseClampedInt(el("rep").value);
  document.querySelectorAll("[data-add-money]").forEach(function (btn) {
    btn.disabled = mVal >= MAX_WALLET;
  });
  document.querySelectorAll("[data-set-money]").forEach(function (btn) {
    btn.disabled = mVal === parseClampedInt(btn.dataset.setMoney);
  });
  document.querySelectorAll("[data-add-rep]").forEach(function (btn) {
    btn.disabled = rVal >= MAX_WALLET;
  });
  document.querySelectorAll("[data-set-rep]").forEach(function (btn) {
    btn.disabled = rVal === parseClampedInt(btn.dataset.setRep);
  });
  updateRepBar(rVal);
}

function updateRepBar(repVal) {
  var bar = el("repBar");
  if (!bar) return;
  if (!bar.children.length) {
    for (var i = 0; i < 10; i++) {
      var seg = document.createElement("span");
      seg.className = "rank-seg";
      bar.appendChild(seg);
    }
  }
  var level = Math.min(10, Math.floor((Number(repVal) || 0) / 2500));
  for (var j = 0; j < 10; j++) {
    bar.children[j].classList.toggle("on", j < level);
  }
}

// ---------- Tabs & Layout ----------

function updateSliderThumb() {
  var activeBtn = document.querySelector("#navTabs .tab-btn.active");
  var track = el("mclaTrack");
  var thumb = el("sliderThumb");
  if (!activeBtn || !track || !thumb) return;
  var trackRect = track.getBoundingClientRect();
  var btnRect = activeBtn.getBoundingClientRect();
  if (!trackRect.width || !btnRect.width) return;
  thumb.style.left = Math.max(0, Math.round(btnRect.left - trackRect.left)) + "px";
  thumb.style.width = Math.round(btnRect.width) + "px";
}

function setTab(tab) {
  ACTIVE_TAB = tab;
  var tabs = document.querySelectorAll("#navTabs .tab-btn");
  tabs.forEach(function (b) {
    b.classList.toggle("active", b.dataset.tab === tab);
  });

  var panels = document.querySelectorAll("#mainGrid .panel");
  panels.forEach(function (p) {
    var grp = p.getAttribute("data-group");
    p.classList.toggle("is-hidden", grp !== tab);
  });

  var leftCol = el("leftCol");
  var rightCol = el("rightCol");
  var leftVisible = Array.prototype.some.call(leftCol.children, function (c) { return !c.classList.contains("is-hidden"); });
  var rightVisible = Array.prototype.some.call(rightCol.children, function (c) { return !c.classList.contains("is-hidden"); });
  leftCol.classList.toggle("is-hidden", !leftVisible);
  rightCol.classList.toggle("is-hidden", !rightVisible);
  el("mainGrid").classList.toggle("single-col", !leftVisible || !rightVisible);

  requestAnimationFrame(updateSliderThumb);
}

function applyGarageFilter() {
  document.querySelectorAll("[data-gar-filter]").forEach(function (b) {
    b.classList.toggle("active", b.dataset.garFilter === GARAGE_FILTER);
  });
  document.querySelectorAll("#slots .slot").forEach(function (row) {
    var hide = GARAGE_FILTER === "filled" && !row.classList.contains("filled");
    row.classList.toggle("filtered-out", hide);
  });
}
