function slotCount() {
  var lo = sec("LocalOptions");
  return Math.floor((lo.size - OFF.slot0) / OFF.slotStride);
}

function readSlot(n) {
  var o = slotAt(n);
  var name = ascii(o, 32);
  return {
    i: n, at: o,
    car: (name === "blank" || name === "") ? "" : name,
    label: ascii(o + OFF.slotLabel, 32),
    plate: ascii(o + OFF.slotPlate, 12)
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
