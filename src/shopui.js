function calcShopMetrics() {
  var st = SHOP_STATE;
  var n = st.cats.length;
  var sum = 0;
  for (var i = 0; i < n - 1; i++) sum += (st.cats[i].level - 1);
  var pct = Math.max(0, Math.min(100, Math.floor(sum * 100 / (2 * (n - 1)))));

  /* Normalized progress for schematic highlights */
  var byIdx = {};
  st.cats.forEach(function (c) {
    byIdx[c.idx] = (c.level - 1) / Math.max(1, c.max - 1);
  });

  var pwrKeys = st.moto ? [0, 4, 5, 6] : [0, 1, 2, 3, 4, 5, 6];
  var hndKeys = st.moto ? [8, 12] : [9, 10, 11, 12];

  function avgNorm(keys) {
    var acc = 0;
    for (var k = 0; k < keys.length; k++) acc += (byIdx[keys[k]] || 0);
    return keys.length ? acc / keys.length : 0;
  }

  var pwr = avgNorm(pwrKeys);
  var hnd = avgNorm(hndKeys);

  /* Bars and dyno. Cars use the weighted 13-category model; a bike has six
     categories and no table, so it keeps the plain proportional path. */
  var prof = getVehiclePerfProfile(st.car, st.moto);
  var levels = st.cats.map(function (c) { return c.level - 1; });
  var maxLevel = st.max - 1;
  var stats, dyno;

  if (st.moto) {
    var ratio = pct / 100;
    function simple(stock, mx) {
      var s = Math.max(0, Math.min(100, stock));
      var m = Math.max(s, Math.min(100, mx));
      return { stock: s, max: m, exact: s + (m - s) * ratio, value: Math.round(s + (m - s) * ratio) };
    }
    stats = { acc: simple(prof.accel[0], prof.accel[1]),
              spd: simple(prof.speed[0], prof.speed[1]),
              hnd: simple(prof.hand[0], prof.hand[1]) };
    dyno = null;
  } else {
    stats = calcCarPerformanceStats(
      { acc: prof.accel[0], spd: prof.speed[0], hnd: prof.hand[0] },
      { acc: prof.accel[1], spd: prof.speed[1], hnd: prof.hand[1] },
      levels, maxLevel);
    dyno = calcDynoModel(
      { acc: prof.accel[0], spd: prof.speed[0] },
      { acc: prof.accel[1], spd: prof.speed[1] },
      levels, maxLevel);
  }

  return {
    pct: pct,
    pwr: pwr,
    hnd: hnd,
    stats: stats,
    dyno: dyno,
    accelStock: stats.acc.stock, accelTuned: stats.acc.exact, accelMax: stats.acc.max,
    speedStock: stats.spd.stock, speedTuned: stats.spd.exact, speedMax: stats.spd.max,
    handStock: stats.hnd.stock, handTuned: stats.hnd.exact, handMax: stats.hnd.max
  };
}

function renderShopTelemetry() {
  var m = calcShopMetrics();
  el("shopPctBadge").textContent = m.pct + "%";
  el("shopSummaryPct").textContent = m.pct + "%";

  /* Class indicator strip (D, C, B, A) */
  var litCount = m.pct >= 85 ? 4 : (m.pct >= 55 ? 3 : (m.pct >= 25 ? 2 : 1));
  el("shopClassStrip").querySelectorAll(".class-item").forEach(function (item) {
    var idx = +item.dataset.cls;
    item.classList.toggle("lit", idx < litCount);
  });

  /* X-ray: the shared base layer plus the active category's own drawing. */
  var activeCat = SHOP_STATE.cats[SHOP_STATE.activeRow];
  paintXray(activeCat ? activeCat.idx : -1, SHOP_STATE.moto);

  /* Dyno: the weighted model for cars, the old proportional curve for bikes. */
  var plot = getDynoPlotRect();
  if (m.dyno) {
    el("dynoTorquePath").setAttribute("d", buildDynoSvgPath(m.dyno.torquePoints, plot));
    el("dynoHpPath").setAttribute("d", buildDynoSvgPath(m.dyno.hpPoints, plot));
  } else {
    var lift = (m.pct / 100) * 32;
    var tPts = [[8, 56 - lift * 0.45], [54, 45 - lift * 0.75], [108, 39 - lift * 0.92],
                [164, 37 - lift], [212, 42 - lift * 0.95], [252, 51 - lift * 0.7]];
    var hPts = [[8, 61 - lift * 0.35], [58, 53 - lift * 0.65], [116, 46 - lift * 0.85],
                [172, 40 - lift * 0.98], [220, 37 - lift], [252, 44 - lift * 0.82]];
    function toPath(pts) {
      return pts.map(function (p, i) {
        return (i === 0 ? "M" : "L") + p[0].toFixed(1) + " " + Math.max(4, Math.min(66, p[1])).toFixed(1);
      }).join(" ");
    }
    el("dynoTorquePath").setAttribute("d", toPath(tPts));
    el("dynoHpPath").setAttribute("d", toPath(hPts));
  }

  /* 3-layer Performance Bars */
  el("statAccelMax").style.width   = m.accelMax.toFixed(1) + "%";
  el("statAccelTuned").style.width = m.accelTuned.toFixed(1) + "%";
  el("statAccelStock").style.width = m.accelStock.toFixed(1) + "%";

  el("statSpeedMax").style.width   = m.speedMax.toFixed(1) + "%";
  el("statSpeedTuned").style.width = m.speedTuned.toFixed(1) + "%";
  el("statSpeedStock").style.width = m.speedStock.toFixed(1) + "%";

  el("statHandMax").style.width    = m.handMax.toFixed(1) + "%";
  el("statHandTuned").style.width  = m.handTuned.toFixed(1) + "%";
  el("statHandStock").style.width  = m.handStock.toFixed(1) + "%";
}

function renderShopRows() {
  var list = el("shopList");
  list.innerHTML = "";
  var xSvg = '<svg viewBox="0 0 12 12" fill="none" aria-hidden="true"><path d="M2.2 2.2l7.6 7.6M9.8 2.2l-7.6 7.6"/></svg>';

  SHOP_STATE.cats.forEach(function (cat, rIdx) {
    var row = document.createElement("div");
    row.className = "shop-row" + (rIdx === SHOP_STATE.activeRow ? " active" : "");
    row.setAttribute("role", "option");
    row.setAttribute("aria-selected", rIdx === SHOP_STATE.activeRow ? "true" : "false");
    row.dataset.row = rIdx;

    var cur = document.createElement("span");
    cur.className = "shop-cursor";
    cur.setAttribute("aria-hidden", "true");

    var name = document.createElement("span");
    name.className = "shop-cat-name";
    name.textContent = cat.name;

    var ctrl = document.createElement("div");
    ctrl.className = "lvl-ctrl";

    var prevBtn = document.createElement("button");
    prevBtn.type = "button";
    prevBtn.className = "lvl-arrow";
    prevBtn.tabIndex = -1;
    prevBtn.textContent = "<";
    prevBtn.disabled = cat.level <= 1;
    prevBtn.setAttribute("aria-label", cat.name + " -1");
    prevBtn.addEventListener("click", function (e) {
      e.stopPropagation();
      SHOP_STATE.activeRow = rIdx;
      setShopCategoryLevel(rIdx, cat.level - 1);
    });

    var cells = document.createElement("div");
    cells.className = "lvl-cells";
    for (var lv = 1; lv <= cat.max; lv++) {
      (function (targetLv) {
        var cell = document.createElement("button");
        cell.type = "button";
        cell.tabIndex = -1;
        cell.className = "lvl-cell" +
          (targetLv === cat.level ? " current" : (targetLv < cat.level ? " owned" : ""));
        cell.title = targetLv === 1 ? "Stock" : ("Level " + targetLv);
        cell.setAttribute("aria-label", cat.name + " " + (targetLv === 1 ? "Stock" : ("Level " + targetLv)));
        if (targetLv === cat.level) cell.innerHTML = xSvg;
        cell.addEventListener("click", function (e) {
          e.stopPropagation();
          SHOP_STATE.activeRow = rIdx;
          setShopCategoryLevel(rIdx, targetLv);
        });
        cells.appendChild(cell);
      })(lv);
    }

    var nextBtn = document.createElement("button");
    nextBtn.type = "button";
    nextBtn.className = "lvl-arrow";
    nextBtn.tabIndex = -1;
    nextBtn.textContent = ">";
    nextBtn.disabled = cat.level >= cat.max;
    nextBtn.setAttribute("aria-label", cat.name + " +1");
    nextBtn.addEventListener("click", function (e) {
      e.stopPropagation();
      SHOP_STATE.activeRow = rIdx;
      setShopCategoryLevel(rIdx, cat.level + 1);
    });

    ctrl.appendChild(prevBtn);
    ctrl.appendChild(cells);
    ctrl.appendChild(nextBtn);

    var badge = document.createElement("span");
    badge.className = "lvl-badge" + (cat.level > 1 ? " upgraded" : "");
    badge.textContent = cat.level === 1 ? "Stock" : ("LVL " + cat.level);

    row.appendChild(cur);
    row.appendChild(name);
    row.appendChild(ctrl);
    row.appendChild(badge);

    row.addEventListener("click", function () {
      SHOP_STATE.activeRow = rIdx;
      renderShopRows();
    });

    list.appendChild(row);
  });

  var activeEl = list.children[SHOP_STATE.activeRow];
  if (activeEl) activeEl.scrollIntoView({ block: "nearest" });
  renderShopTelemetry();
}

function setShopCategoryLevel(rIdx, nextLv) {
  if (!SHOP_STATE) return;
  var cat = SHOP_STATE.cats[rIdx];
  if (!cat) return;
  cat.level = Math.max(1, Math.min(cat.max, nextLv));
  renderShopRows();
}

function openPerformanceShop(slotIdx, triggerBtn) {
  var slotData = readSlot(slotIdx);
  if (!slotData.car) return;
  var info = tuneInfo(slotIdx);
  var title = CAR_TITLES[slotData.car] || slotData.label || slotData.car;

  SHOP_STATE = {
    slot: slotIdx,
    trigger: triggerBtn || null,
    car: slotData.car,
    moto: info.moto,
    max: info.max,
    activeRow: 0,
    cats: info.cats.map(function (c) {
      return {
        idx: c.idx,
        name: c.name,
        level: c.level,
        origLevel: c.level,
        max: c.max
      };
    })
  };

  el("shopVehicleSub").textContent = title.toUpperCase();
  el("shopSlotBadge").textContent = "SLOT " + (slotIdx < 10 ? "0" : "") + slotIdx;
  el("shopTypeBadge").textContent = t(info.moto ? "shopBikeBadge" : "shopCarBadge");

  renderShopRows();
  el("shopModal").hidden = false;
  el("shopDialog").focus();
}

function closePerformanceShop(commit) {
  if (!SHOP_STATE) return;
  var st = SHOP_STATE;
  if (commit) {
    var changed = false;
    st.cats.forEach(function (c) {
      if (c.level !== c.origLevel) changed = true;
      tuneSet(st.slot, c.idx, c.level);
    });
    if (typeof window.refreshGarageTune === "function") window.refreshGarageTune();
    if (changed) mark();
  }
  SHOP_STATE = null;
  el("shopModal").hidden = true;
  if (st.trigger && typeof st.trigger.focus === "function") st.trigger.focus();
}

el("shopStockBtn").addEventListener("click", function () {
  if (!SHOP_STATE) return;
  SHOP_STATE.cats.forEach(function (c) { c.level = 1; });
  renderShopRows();
});

el("shopAutoBtn").addEventListener("click", function () {
  if (!SHOP_STATE) return;
  SHOP_STATE.cats.forEach(function (c) { c.level = c.max; });
  renderShopRows();
});

el("shopCancelBtn").addEventListener("click", function () {
  closePerformanceShop(false);
});

el("shopAcceptBtn").addEventListener("click", function () {
  closePerformanceShop(true);
});

el("shopModal").addEventListener("click", function (e) {
  if (e.target === el("shopModal")) closePerformanceShop(false);
});
