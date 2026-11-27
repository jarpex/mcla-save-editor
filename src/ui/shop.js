(() => {
  "use strict";

  const {
    CAR_TITLES, getVehiclePerfProfile,
    getDynoPlotRect, calcCarPerformanceStats, calcDynoModel, buildDynoSvgPath
  } = MCLA.data;
  const { readSlot, tuneInfo, tuneSet, tuneVendorSet } = MCLA.format;
  const { el, t, mark, paintXray } = MCLA.ui;

  const isShopOpen = () => !el("shopModal").hidden && MCLA.state.shop !== null;

  function calcShopMetrics() {
    const st = MCLA.state.shop;
    const n = st.cats.length;
    let sum = 0;
    for (let i = 0; i < n - 1; i++) sum += st.cats[i].level - 1;
    const pct = Math.max(0, Math.min(100, Math.floor((sum * 100) / (2 * (n - 1)))));

    const byIdx = {};
    for (const c of st.cats) byIdx[c.idx] = (c.level - 1) / Math.max(1, c.max - 1);

    const avgNorm = (keys) => {
      const acc = keys.reduce((s, k) => s + (byIdx[k] || 0), 0);
      return keys.length ? acc / keys.length : 0;
    };

    const pwr = avgNorm(st.moto ? [0, 4, 5, 6] : [0, 1, 2, 3, 4, 5, 6]);
    const hnd = avgNorm(st.moto ? [8, 12] : [9, 10, 11, 12]);

    const prof = getVehiclePerfProfile(st.car, st.moto);
    const levels = st.cats.map((c) => c.level - 1);
    const maxLevel = st.max - 1;
    let stats;
    let dyno;

    if (st.moto) {
      const ratio = pct / 100;
      const simple = (stock, mx) => {
        const s = Math.max(0, Math.min(100, stock));
        const m = Math.max(s, Math.min(100, mx));
        return { stock: s, max: m, exact: s + (m - s) * ratio, value: Math.round(s + (m - s) * ratio) };
      };
      stats = {
        acc: simple(prof.accel[0], prof.accel[1]),
        spd: simple(prof.speed[0], prof.speed[1]),
        hnd: simple(prof.hand[0], prof.hand[1])
      };
      dyno = null;
    } else {
      stats = calcCarPerformanceStats(
        { acc: prof.accel[0], spd: prof.speed[0], hnd: prof.hand[0] },
        { acc: prof.accel[1], spd: prof.speed[1], hnd: prof.hand[1] },
        levels, maxLevel
      );
      dyno = calcDynoModel(
        { acc: prof.accel[0], spd: prof.speed[0] },
        { acc: prof.accel[1], spd: prof.speed[1] },
        levels, maxLevel
      );
    }

    return {
      pct, pwr, hnd, stats, dyno,
      accelStock: stats.acc.stock, accelTuned: stats.acc.exact, accelMax: stats.acc.max,
      speedStock: stats.spd.stock, speedTuned: stats.spd.exact, speedMax: stats.spd.max,
      handStock: stats.hnd.stock, handTuned: stats.hnd.exact, handMax: stats.hnd.max
    };
  }

  function renderShopTelemetry() {
    const st = MCLA.state.shop;
    const m = calcShopMetrics();
    el("shopPctBadge").textContent = `${m.pct}%`;
    el("shopSummaryPct").textContent = `${m.pct}%`;

    const litCount = m.pct >= 85 ? 4 : (m.pct >= 55 ? 3 : (m.pct >= 25 ? 2 : 1));
    el("shopClassStrip").querySelectorAll(".class-item").forEach((item) => {
      item.classList.toggle("lit", Number(item.dataset.cls) < litCount);
    });

    const activeCat = st.cats[st.activeRow];
    paintXray(activeCat ? activeCat.idx : -1, st.moto);

    const plot = getDynoPlotRect();
    if (m.dyno) {
      el("dynoTorquePath").setAttribute("d", buildDynoSvgPath(m.dyno.torquePoints, plot));
      el("dynoHpPath").setAttribute("d", buildDynoSvgPath(m.dyno.hpPoints, plot));
    } else {
      const lift = (m.pct / 100) * 32;
      const tPts = [[8, 56 - lift * 0.45], [54, 45 - lift * 0.75], [108, 39 - lift * 0.92],
                    [164, 37 - lift], [212, 42 - lift * 0.95], [252, 51 - lift * 0.7]];
      const hPts = [[8, 61 - lift * 0.35], [58, 53 - lift * 0.65], [116, 46 - lift * 0.85],
                    [172, 40 - lift * 0.98], [220, 37 - lift], [252, 44 - lift * 0.82]];
      const toPath = (pts) => pts.map((p, i) =>
        `${i === 0 ? "M" : "L"}${p[0].toFixed(1)} ${Math.max(4, Math.min(66, p[1])).toFixed(1)}`
      ).join(" ");
      el("dynoTorquePath").setAttribute("d", toPath(tPts));
      el("dynoHpPath").setAttribute("d", toPath(hPts));
    }

    el("statAccelMax").style.width = `${m.accelMax.toFixed(1)}%`;
    el("statAccelTuned").style.width = `${m.accelTuned.toFixed(1)}%`;
    el("statAccelStock").style.width = `${m.accelStock.toFixed(1)}%`;

    el("statSpeedMax").style.width = `${m.speedMax.toFixed(1)}%`;
    el("statSpeedTuned").style.width = `${m.speedTuned.toFixed(1)}%`;
    el("statSpeedStock").style.width = `${m.speedStock.toFixed(1)}%`;

    el("statHandMax").style.width = `${m.handMax.toFixed(1)}%`;
    el("statHandTuned").style.width = `${m.handTuned.toFixed(1)}%`;
    el("statHandStock").style.width = `${m.handStock.toFixed(1)}%`;
  }

  function setShopCategoryLevel(rIdx, nextLv) {
    const st = MCLA.state.shop;
    if (!st) return;
    const cat = st.cats[rIdx];
    if (!cat) return;
    cat.level = Math.max(1, Math.min(cat.max, nextLv));
    if (cat.level === 1) cat.vendor = 0;
    renderShopRows();
  }

  function setShopCategoryVendor(rIdx, idx) {
    const st = MCLA.state.shop;
    if (!st) return;
    const cat = st.cats[rIdx];
    if (!cat || !cat.vendors) return;
    cat.vendor = idx;
    renderShopRows();
  }

  function renderShopRows() {
    const st = MCLA.state.shop;
    const list = el("shopList");
    list.innerHTML = "";
    const xSvg = '<svg viewBox="0 0 12 12" fill="none" aria-hidden="true"><path d="M2.2 2.2l7.6 7.6M9.8 2.2l-7.6 7.6"/></svg>';

    st.cats.forEach((cat, rIdx) => {
      const row = document.createElement("div");
      row.className = `shop-row${rIdx === st.activeRow ? " active" : ""}`;
      row.setAttribute("role", "option");
      row.setAttribute("aria-selected", rIdx === st.activeRow ? "true" : "false");
      row.dataset.row = rIdx;

      const cur = document.createElement("span");
      cur.className = "shop-cursor";
      cur.setAttribute("aria-hidden", "true");

      const name = document.createElement("span");
      name.className = "shop-cat-name";
      name.textContent = cat.name;

      const ctrl = document.createElement("div");
      ctrl.className = "lvl-ctrl";

      const prevBtn = document.createElement("button");
      prevBtn.type = "button";
      prevBtn.className = "lvl-arrow";
      prevBtn.tabIndex = -1;
      prevBtn.textContent = "<";
      prevBtn.disabled = cat.level <= 1;
      prevBtn.setAttribute("aria-label", `${cat.name} -1`);
      prevBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        st.activeRow = rIdx;
        setShopCategoryLevel(rIdx, cat.level - 1);
      });

      const cells = document.createElement("div");
      cells.className = "lvl-cells";
      for (let lv = 1; lv <= cat.max; lv++) {
        const cell = document.createElement("button");
        cell.type = "button";
        cell.tabIndex = -1;
        cell.className = `lvl-cell${lv === cat.level ? " current" : (lv < cat.level ? " owned" : "")}`;
        cell.title = lv === 1 ? "Stock" : `Level ${lv}`;
        cell.setAttribute("aria-label", `${cat.name} ${lv === 1 ? "Stock" : `Level ${lv}`}`);
        if (lv === cat.level) cell.innerHTML = xSvg;
        cell.addEventListener("click", (e) => {
          e.stopPropagation();
          st.activeRow = rIdx;
          setShopCategoryLevel(rIdx, lv);
        });
        cells.appendChild(cell);
      }

      const nextBtn = document.createElement("button");
      nextBtn.type = "button";
      nextBtn.className = "lvl-arrow";
      nextBtn.tabIndex = -1;
      nextBtn.textContent = ">";
      nextBtn.disabled = cat.level >= cat.max;
      nextBtn.setAttribute("aria-label", `${cat.name} +1`);
      nextBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        st.activeRow = rIdx;
        setShopCategoryLevel(rIdx, cat.level + 1);
      });

      ctrl.append(prevBtn, cells, nextBtn);

      let badge;
      if (cat.level === 1 || !cat.vendors) {
        badge = document.createElement("span");
        badge.className = `lvl-badge${cat.level > 1 ? " upgraded" : ""}`;
        badge.textContent = cat.level === 1 ? "Stock" : `LVL ${cat.level}`;
      } else {
        badge = document.createElement("select");
        badge.className = "lvl-badge vendor";
        badge.setAttribute("aria-label", `${cat.name} ${t("vendor")}`);
        cat.vendors.forEach((vName, vi) => {
          const op = document.createElement("option");
          op.value = vi;
          op.textContent = vName;
          badge.appendChild(op);
        });
        badge.value = cat.vendor || 0;
        badge.addEventListener("click", (e) => e.stopPropagation());
        badge.addEventListener("change", (e) => {
          e.stopPropagation();
          st.activeRow = rIdx;
          setShopCategoryVendor(rIdx, +badge.value);
        });
      }

      row.append(cur, name, ctrl, badge);
      row.addEventListener("click", () => {
        st.activeRow = rIdx;
        renderShopRows();
      });

      list.appendChild(row);
    });

    const activeEl = list.children[st.activeRow];
    if (activeEl) activeEl.scrollIntoView({ block: "nearest" });
    renderShopTelemetry();
  }

  function openPerformanceShop(slotIdx, triggerBtn) {
    const slotData = readSlot(slotIdx);
    if (!slotData.car) return;
    const info = tuneInfo(slotIdx);
    const title = CAR_TITLES[slotData.car] || slotData.label || slotData.car;

    MCLA.state.shop = {
      slot: slotIdx,
      trigger: triggerBtn || null,
      car: slotData.car,
      moto: info.moto,
      max: info.max,
      activeRow: 0,
      cats: info.cats.map((c) => ({
        idx: c.idx,
        name: c.name,
        level: c.level,
        origLevel: c.level,
        max: c.max,
        vendor: c.vendor,
        origVendor: c.vendor,
        vendors: c.vendors
      }))
    };

    el("shopVehicleSub").textContent = title.toUpperCase();
    el("shopSlotBadge").textContent = `SLOT ${slotIdx < 10 ? "0" : ""}${slotIdx}`;
    el("shopTypeBadge").textContent = t(info.moto ? "shopBikeBadge" : "shopCarBadge");

    renderShopRows();
    el("shopModal").hidden = false;
    el("shopDialog").focus();
  }

  function closePerformanceShop(commit) {
    const st = MCLA.state.shop;
    if (!st) return;
    if (commit) {
      let changed = false;
      for (const c of st.cats) {
        if (c.level !== c.origLevel) changed = true;
        if (c.vendor !== c.origVendor && c.vendor != null) changed = true;
        tuneSet(st.slot, c.idx, c.level);
        if (c.vendors) tuneVendorSet(st.slot, c.idx, c.level === 1 ? null : (c.vendor || 0));
      }
      MCLA.ui.paintTune();
      if (changed) mark();
    }
    MCLA.state.shop = null;
    el("shopModal").hidden = true;
    if (st.trigger && typeof st.trigger.focus === "function") st.trigger.focus();
  }

  function bindShopEvents() {
    el("shopStockBtn").addEventListener("click", () => {
      if (!MCLA.state.shop) return;
      MCLA.state.shop.cats.forEach((c) => { c.level = 1; c.vendor = 0; });
      renderShopRows();
    });

    el("shopAutoBtn").addEventListener("click", () => {
      if (!MCLA.state.shop) return;
      MCLA.state.shop.cats.forEach((c) => { c.level = c.max; });
      renderShopRows();
    });

    el("shopCancelBtn").addEventListener("click", () => closePerformanceShop(false));
    el("shopAcceptBtn").addEventListener("click", () => closePerformanceShop(true));
    el("shopModal").addEventListener("click", (e) => {
      if (e.target === el("shopModal")) closePerformanceShop(false);
    });
  }

  Object.assign(MCLA.ui, {
    isShopOpen,
    openPerformanceShop,
    closePerformanceShop,
    renderShopRows,
    setShopCategoryLevel,
    bindShopEvents
  });
})();
