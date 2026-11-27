(() => {
  "use strict";

  const { OFF, ROSTER, CAR_TITLES } = MCLA.data;
  const {
    autoLabel, slotAt, slotCount, storedCars, readSlot, contiguous,
    writeField, writeAppearance, writePlate, syncCars,
    tuneInfo, tunePctAt, maxTune, clearTune
  } = MCLA.format;
  const { el, t, mark } = MCLA.ui;

  function paintGarageSlots(n) {
    const total = slotCount();
    let orphan = 0;
    for (let i = n; i < total; i++) {
      if (readSlot(i).car) orphan++;
    }
    const rows = el("slots").children;
    for (let k = 0; k < rows.length; k++) {
      rows[k].classList.toggle("beyond", k >= n);
    }
    el("roCars").textContent = n;
    return orphan;
  }

  function reportCars() {
    const n = storedCars();
    const c = contiguous();
    const orphan = paintGarageSlots(n);
    const box = el("gap");
    if (c > n) {
      box.hidden = false;
      box.innerHTML = `<span><strong>${t("hiddenTitle", c - n)}</strong> ${t("hiddenBody", n, c)}</span>` +
        `<button class="btn mini" id="fixCars" type="button">${t("countThem", c)}</button>`;
      el("fixCars").onclick = () => {
        const count = syncCars();
        el("garCount").textContent = `${count} / ${slotCount()} ${t("nSlots")}`;
        reportCars();
        mark();
      };
    } else if (orphan) {
      box.hidden = false;
      box.innerHTML = `<span><strong>${t("orphanTitle", orphan)}</strong> ${t("orphanBody", n)}</span>`;
    } else {
      box.hidden = true;
    }
  }

  function applyGarageFilter() {
    const filter = MCLA.state.garageFilter;
    document.querySelectorAll("[data-gar-filter]").forEach((b) => {
      b.classList.toggle("active", b.dataset.garFilter === filter);
    });
    document.querySelectorAll("#slots .slot").forEach((row) => {
      const hide = filter === "filled" && !row.classList.contains("filled");
      row.classList.toggle("filtered-out", hide);
    });
  }

  function paintTune() {
    const host = el("slots");
    host.querySelectorAll("button.tune").forEach((b) => {
      const n = +b.dataset.tune;
      const hasCar = Boolean(readSlot(n).car);
      const pct = tunePctAt(n);
      b.disabled = !hasCar;
      b.textContent = `${pct}%`;
      b.style.setProperty("--pct", `${pct}%`);
      if (hasCar && pct === 100) b.setAttribute("data-full", "");
      else b.removeAttribute("data-full");
    });
    host.querySelectorAll(".slot").forEach((r) => {
      const n = +r.querySelector("select").dataset.slot;
      r.classList.toggle("moto", tuneInfo(n).moto);
    });
  }

  function renderGarage() {
    let opts = `<option value="">- ${t("empty")} -</option>`;
    for (const n of ROSTER) {
      const nice = CAR_TITLES[n] ? `${CAR_TITLES[n]} [${n}]` : n;
      opts += `<option value="${n}">${nice}</option>`;
    }

    const total = slotCount();
    el("garCount").textContent = `${storedCars()} / ${total} ${t("nSlots")}`;
    const host = el("slots");
    host.innerHTML = "";

    for (let n = 0; n < total; n++) {
      const s = readSlot(n);
      const ti = tuneInfo(n);
      const idxStr = `${n < 10 ? "0" : ""}${n}`;
      const row = document.createElement("div");
      row.className = `slot${s.car ? " filled" : ""}${ti.moto ? " moto" : ""}`;
      row.innerHTML =
        `<span class="cursor" aria-hidden="true"></span>` +
        `<span class="n">${idxStr}</span>` +
        `<select data-slot="${n}" aria-label="${t("aCar", n)}">${opts}</select>` +
        `<input class="lbl" type="text" maxlength="31" placeholder="LABEL" data-label="${n}" aria-label="${t("aLabel", n)}">` +
        `<input class="plate" type="text" maxlength="7" pattern="[A-Z0-9 ]{7}" placeholder="PLATE" data-plate="${n}" aria-label="${t("aPlate", n)}">` +
        `<button class="btn mini tune" type="button" data-tune="${n}" style="--pct:${ti.pct}%" aria-label="${t("aTune", n)}"` +
        `${!s.car ? " disabled" : ""}${ti.pct === 100 ? " data-full" : ""}>${ti.pct}%</button>` +
        `<button class="btn-clear" type="button" data-clear="${n}" title="${t("aClear", n)}" aria-label="${t("aClear", n)}">x</button>`;
      host.appendChild(row);
      row.querySelector("select").value = s.car;
      row.querySelector("input.lbl").value = s.label;
      row.querySelector("input.plate").value = s.plate;
    }

    const setSlotCar = (n, val, rowEl) => {
      const o = slotAt(n);
      const sel = rowEl.querySelector("select");
      const lbl = rowEl.querySelector("input.lbl");
      const prev = readSlot(n).car;
      sel.value = val;
      if (val) {
        writeField(o, 32, val);
        lbl.value = autoLabel(val);
        writeField(o + OFF.slotLabel, 33, lbl.value);
        writeAppearance(o, val);
      } else {
        if (prev) writeAppearance(o, prev);
        writeField(o, 32, "blank");
        lbl.value = "";
        writeField(o + OFF.slotLabel, 33, "");
        clearTune(n);
      }
      rowEl.classList.toggle("filled", Boolean(val));
      paintTune();
      syncCars();
      el("garCount").textContent = `${storedCars()} / ${total} ${t("nSlots")}`;
      reportCars();
      applyGarageFilter();
      mark();
    };

    host.querySelectorAll("select").forEach((sel) => {
      sel.addEventListener("change", () => setSlotCar(+sel.dataset.slot, sel.value, sel.closest(".slot")));
    });

    host.querySelectorAll("button.btn-clear").forEach((btn) => {
      btn.addEventListener("click", () => setSlotCar(+btn.dataset.clear, "", btn.closest(".slot")));
    });

    host.querySelectorAll("input.lbl").forEach((inp) => {
      inp.addEventListener("input", () => {
        const n = +inp.dataset.label;
        writeField(slotAt(n) + OFF.slotLabel, 33, inp.value.replace(/[^\x20-\x7E]/g, ""));
        mark();
      });
    });

    host.querySelectorAll("input.plate").forEach((inp) => {
      inp.addEventListener("input", () => {
        inp.value = inp.value.toUpperCase().replace(/[^A-Z0-9 ]/g, "").slice(0, 7);
        if (inp.value.length !== 7) return;
        writePlate(+inp.dataset.plate, inp.value);
        mark();
      });
    });

    paintTune();
    host.querySelectorAll("button.tune").forEach((b) => {
      b.addEventListener("click", () => {
        const n = +b.dataset.tune;
        if (!readSlot(n).car) return;
        MCLA.ui.openPerformanceShop(n, b);
      });
    });

    el("maxAll").onclick = () => {
      for (let i = 0; i < total; i++) {
        if (readSlot(i).car) maxTune(i);
      }
      paintTune();
      mark();
    };

    applyGarageFilter();
    reportCars();
  }

  Object.assign(MCLA.ui, {
    renderGarage,
    paintTune,
    reportCars,
    applyGarageFilter
  });
})();
