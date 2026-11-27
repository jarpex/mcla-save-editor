(() => {
  "use strict";

  const {
    OFF, RACE_TARGETS, RACE_GROUPS, WIN_CAR_NAMES, CAR_ORDER_NAMES,
    COLLECT_GROUPS, CAREER_RECORDS, FMT_LABEL
  } = MCLA.data;
  const {
    sec, u32, setU32, setU8,
    progTotal, progAt, progSetAll, ttBase,
    msToText, textToMs, statName, scanStats, statRead, statWrite,
    collectFound, collectSet, syncGcol, careerRead, careerWrite
  } = MCLA.format;
  const { el, t, maskTime, mark, createCollapsibleGroup } = MCLA.ui;

  /* ---------- Progression ---------- */

  function progTally() {
    const n = progTotal();
    let done = 0;
    for (let i = 0; i < n; i++) if (MCLA.state.bytes[progAt(i)]) done++;
    el("progCount").textContent = `${done} ${t("of")} ${n}`;
  }

  function progPaint() {
    el("prog").querySelectorAll(".cell").forEach((b) => {
      b.setAttribute("aria-pressed", MCLA.state.bytes[progAt(+b.dataset.prog)] ? "true" : "false");
    });
    progTally();
  }

  function renderProg() {
    const n = progTotal();
    const host = el("prog");
    host.innerHTML = "";
    for (let i = 0; i < n; i++) {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "cell";
      b.textContent = i;
      b.dataset.prog = i;
      b.setAttribute("aria-label", t("aProg", i));
      host.appendChild(b);
    }
    host.onclick = (e) => {
      const b = e.target.closest(".cell");
      if (!b) return;
      const at = progAt(+b.dataset.prog);
      MCLA.state.bytes[at] = MCLA.state.bytes[at] ? 0 : 1;
      b.setAttribute("aria-pressed", MCLA.state.bytes[at] ? "true" : "false");
      progTally();
      mark();
    };
    const setAll = (v) => { progSetAll(v); progPaint(); mark(); };
    el("progAll").onclick = () => setAll(1);
    el("progNone").onclick = () => setAll(0);
    progPaint();
  }

  /* ---------- Time Trial & Race Targets ---------- */

  const TT_EVENTS = [
    { key: "ttHollywood2", label: "Hollywood time trial: '99 Eclipse - Race 2", target: 0 }
  ];
  for (let r = 0; r < RACE_TARGETS; r++) {
    TT_EVENTS.push({ key: `raceTarget${r}`, label: `Race target #${r + 1}`, target: 4 + r });
  }

  const ttEventName = (e) => `${e.label || t(e.key)} [${t("ttUntested")}]`;

  function paintTimeTrial() {
    const e = TT_EVENTS[+el("ttEvent").value || 0];
    const car = sec("Career");
    const base = ttBase();
    const inp = el("ttTarget");
    if (base < 0) {
      el("ttAt").textContent = "Career+?";
      inp.value = "";
      inp.disabled = true;
      return;
    }
    inp.disabled = false;
    const rel = base + e.target * OFF.ttTargetStride;
    el("ttAt").textContent = `Career+0x${rel.toString(16).toUpperCase()}`;
    inp.value = msToText(u32(car.data + rel));
    inp.setAttribute("aria-label", `${t("ttTarget")} ${ttEventName(e)}`);
  }

  function renderTimeTrial() {
    const host = el("ttEvent");
    host.innerHTML = "";
    TT_EVENTS.forEach((e, i) => {
      const o = document.createElement("option");
      o.value = i;
      o.textContent = ttEventName(e);
      host.appendChild(o);
    });
    host.onchange = paintTimeTrial;
    el("ttTarget").oninput = function () {
      const e = TT_EVENTS[+el("ttEvent").value || 0];
      const car = sec("Career");
      const base = ttBase();
      this.value = maskTime(this.value, this.dataset.maskPrev);
      this.dataset.maskPrev = this.value;
      const ms = textToMs(this.value);
      if (ms === null || base < 0) return;
      setU32(car.data + base + e.target * OFF.ttTargetStride, ms);
      mark();
    };
    paintTimeTrial();
  }

  /* ---------- Statistics ---------- */

  function renderStats() {
    const st = MCLA.state;
    st.stats = scanStats();
    st.gameKeys = st.stats.filter((r) => r.key.startsWith("g"));
    st.vehKeys = st.stats.filter((r) => r.key === "vWIN" || r.key === "vkDT");
    st.raceKeys = st.stats.filter((r) => r.key === "r:TI");

    el("statCount").textContent = `${st.gameKeys.length} ${t("nRecords")}`;
    el("vehCount").textContent = `${st.vehKeys.length} ${t("nRecords")}`;
    el("raceCount").textContent = `${st.raceKeys.length} ${t("nRecords")}`;

    const winByCar = {};
    for (const r of st.vehKeys) {
      if (r.key === "vWIN") winByCar[WIN_CAR_NAMES[r.occ]] = r;
    }
    st.vehRows = [];
    for (const r of st.vehKeys) {
      if (r.key !== "vkDT") continue;
      const car = CAR_ORDER_NAMES[r.occ];
      if (!car) continue;
      st.vehRows.push({ car, dist: r, win: winByCar[car] || null });
    }

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
    const host = el("stats");
    host.innerHTML = "";
    let shown = 0;

    for (const r of MCLA.state.gameKeys) {
      if (q && !r.key.toLowerCase().includes(q) && !statName(r).toLowerCase().includes(q)) continue;
      shown++;
      const row = document.createElement("div");
      row.className = "stat";

      const cur = document.createElement("span");
      cur.className = "cursor";
      cur.setAttribute("aria-hidden", "true");

      const key = document.createElement("span");
      key.className = "key";
      key.textContent = r.key;

      const name = document.createElement("span");
      name.className = "name";
      name.textContent = statName(r);

      const kind = document.createElement("span");
      kind.className = "kind";
      kind.textContent = t(r.isHours ? "hintHours" : (r.isFloat ? "decimal" : "integer"));

      const inp = document.createElement("input");
      inp.type = "text";
      inp.inputMode = "decimal";
      inp.setAttribute("aria-label", t("aValue", r.key));
      inp.value = statRead(r);

      if (r.key === "gCOL") {
        inp.disabled = true;
        inp.title = t("gColSynced");
        row.title = t("gColSynced");
      }

      row.append(cur, key, name, kind, inp);
      inp.addEventListener("input", () => { if (statWrite(r, inp.value)) mark(); });
      inp.addEventListener("blur", () => { inp.value = statRead(r); });
      host.appendChild(row);
    }
    if (!shown) host.innerHTML = `<p class="empty-note">${t("noStat")}</p>`;
  }

  function statField(r, labelKey) {
    const cell = document.createElement("div");
    cell.className = "stat-cell";

    const lab = document.createElement("span");
    lab.className = "cell-label";
    lab.textContent = t(labelKey);

    const inp = document.createElement("input");
    inp.type = "text";
    inp.inputMode = "decimal";
    inp.setAttribute("aria-label", t(labelKey));
    if (r) {
      inp.value = statRead(r);
      inp.addEventListener("input", () => { if (statWrite(r, inp.value)) mark(); });
      inp.addEventListener("blur", () => { inp.value = statRead(r); });
    } else {
      inp.value = "0";
      inp.disabled = true;
      inp.title = t("vehNoWins");
    }

    cell.append(lab, inp);
    return cell;
  }

  function drawVehicles(q) {
    q = (q || "").trim().toLowerCase();
    const host = el("vehstats");
    host.innerHTML = "";
    let shown = 0;

    for (const row of MCLA.state.vehRows) {
      if (q && !row.car.toLowerCase().includes(q)) continue;
      shown++;

      const elRow = document.createElement("div");
      elRow.className = "stat plain veh";

      const cur = document.createElement("span");
      cur.className = "cursor";
      cur.setAttribute("aria-hidden", "true");

      const name = document.createElement("span");
      name.className = "name";
      name.textContent = row.car;

      elRow.append(cur, name, statField(row.win, "vehWins"), statField(row.dist, "vehDist"));
      host.appendChild(elRow);
    }
    if (!shown) host.innerHTML = `<p class="empty-note">${t("noStat")}</p>`;
  }

  function drawRaces(q) {
    q = (q || "").trim().toLowerCase();
    const host = el("racestats");
    host.innerHTML = "";
    let shown = 0;

    for (const g of RACE_GROUPS) {
      let rows = g.occ
        .map((occ) => MCLA.state.raceKeys.find((r) => r.occ === occ))
        .filter(Boolean);

      if (q) rows = rows.filter((r) => statName(r).toLowerCase().includes(q));
      if (!rows.length && (q || g.hideEmpty)) continue;

      const { group, inner } = createCollapsibleGroup({
        titleText: t(g.label),
        openMap: MCLA.state.raceOpen,
        key: g.key
      });

      if (!rows.length) {
        const note = document.createElement("p");
        note.className = "empty-note";
        note.textContent = t("raceNoStats");
        inner.appendChild(note);
      }

      for (const r of rows) {
        shown++;
        const row = document.createElement("div");
        row.className = "stat plain";

        const cur = document.createElement("span");
        cur.className = "cursor";
        cur.setAttribute("aria-hidden", "true");

        const name = document.createElement("span");
        name.className = "name";
        name.textContent = statName(r);

        const kind = document.createElement("span");
        kind.className = "kind";
        kind.textContent = t("timeKind");

        const inp = document.createElement("input");
        inp.type = "text";
        inp.inputMode = "decimal";
        inp.setAttribute("aria-label", t("aValue", r.key));
        inp.value = statRead(r);

        row.append(cur, name, kind, inp);
        inp.addEventListener("input", () => {
          inp.value = maskTime(inp.value, inp.dataset.maskPrev);
          inp.dataset.maskPrev = inp.value;
          if (statWrite(r, inp.value)) mark();
        });
        inp.addEventListener("blur", () => {
          inp.value = statRead(r);
          inp.dataset.maskPrev = inp.value;
        });
        inner.appendChild(row);
      }
      host.appendChild(group);
    }

    if (!shown) host.innerHTML = `<p class="empty-note">${t("noStat")}</p>`;
  }

  function syncGcolDom() {
    const n = syncGcol(MCLA.state.stats);
    if (n == null) return;
    const row = [...el("stats").children].find((c) => {
      const k = c.querySelector(".key");
      return k && k.textContent === "gCOL";
    });
    if (row) row.querySelector("input").value = String(n);
  }

  function drawCollect() {
    const host = el("collect");
    host.innerHTML = "";
    const lo = sec("LocalOptions");
    const base = lo.data + OFF.collect;
    let found = 0;

    for (const g of COLLECT_GROUPS) {
      let zoneFound = 0;
      for (let k = 0; k < g.n; k++) {
        if (MCLA.state.bytes[base + g.at + k] === 1) zoneFound++;
      }

      const { group, inner, badge } = createCollapsibleGroup({
        titleText: t(g.key),
        badgeText: `${zoneFound} / ${g.n}`,
        openMap: MCLA.state.collectOpen,
        key: g.key
      });

      for (let i = 0; i < g.n; i++) {
        const addr = base + g.at + i;
        const isFound = MCLA.state.bytes[addr] === 1;
        if (isFound) found++;

        const row = document.createElement("div");
        row.className = "stat plain bool";

        const cur = document.createElement("span");
        cur.className = "cursor";
        cur.setAttribute("aria-hidden", "true");

        const name = document.createElement("span");
        name.className = "name";
        name.textContent = `${t(g.key)} ${i + 1}`;

        const kind = document.createElement("span");
        kind.className = "kind";
        kind.textContent = t(isFound ? "colFound" : "colHidden");

        const wrap = document.createElement("div");
        wrap.className = "check-wrap";

        const box = document.createElement("input");
        box.type = "checkbox";
        box.checked = isFound;
        box.id = `col-${g.key}-${i}`;
        box.setAttribute("aria-label", name.textContent);

        const boxLabel = document.createElement("label");
        boxLabel.className = "check";
        boxLabel.setAttribute("for", box.id);

        wrap.append(box, boxLabel);
        row.append(cur, name, kind, wrap);

        box.addEventListener("change", () => {
          setU8(addr, box.checked ? 1 : 0);
          kind.textContent = t(box.checked ? "colFound" : "colHidden");
          el("colCount").textContent = `${collectFound()} / ${OFF.collectN}`;
          syncGcolDom();
          let z = 0;
          for (let q = 0; q < g.n; q++) if (MCLA.state.bytes[base + g.at + q] === 1) z++;
          badge.textContent = `${z} / ${g.n}`;
          mark();
        });

        inner.appendChild(row);
      }

      host.appendChild(group);
    }

    el("colCount").textContent = `${found} / ${OFF.collectN}`;
    syncGcolDom();

    el("colAll").onclick = () => { collectSet(1); drawCollect(); mark(); };
    el("colNone").onclick = () => { collectSet(0); drawCollect(); mark(); };
  }

  /* ---------- Career ---------- */

  function renderCareer() {
    el("careerCount").textContent = `${CAREER_RECORDS.length} ${t("nRecords")}`;
    el("careerFilter").oninput = function () { drawCareer(this.value); };
    drawCareer(el("careerFilter").value);
  }

  function drawCareer(q) {
    q = (q || "").trim().toLowerCase();
    const host = el("career");
    host.innerHTML = "";
    let shown = 0;

    for (const rec of CAREER_RECORDS) {
      const titleText = t(rec.titleKey);
      const typeText = t(FMT_LABEL[rec.fmt]);
      if (q && !rec.code.toLowerCase().includes(q) &&
          !titleText.toLowerCase().includes(q) &&
          !typeText.toLowerCase().includes(q)) {
        continue;
      }
      shown++;

      const row = document.createElement("div");
      row.className = "stat wide";

      const cur = document.createElement("span");
      cur.className = "cursor";
      cur.setAttribute("aria-hidden", "true");

      const who = document.createElement("div");
      who.className = "who";

      const key = document.createElement("span");
      key.className = "key";
      key.textContent = titleText;

      const kind = document.createElement("span");
      kind.className = "kind";
      kind.textContent = typeText;

      who.append(key, kind);

      const inp = document.createElement("input");
      inp.type = "text";
      inp.inputMode = "decimal";
      if (rec.id) inp.id = rec.id;
      inp.value = careerRead(rec);
      inp.setAttribute("aria-label", titleText);

      row.append(cur, who, inp);
      host.appendChild(row);

      inp.addEventListener("input", () => {
        if (rec.fmt === "time") {
          inp.value = maskTime(inp.value, inp.dataset.maskPrev);
          inp.dataset.maskPrev = inp.value;
        }
        if (careerWrite(rec, inp.value)) mark();
      });

      inp.addEventListener("blur", () => {
        inp.value = careerRead(rec);
        inp.dataset.maskPrev = inp.value;
      });
    }

    if (!shown) host.innerHTML = `<p class="empty-note">${t("noCareer")}</p>`;
  }

  Object.assign(MCLA.ui, {
    renderProg,
    renderTimeTrial,
    renderStats,
    renderCareer
  });
})();
