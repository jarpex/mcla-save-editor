// ---------- Render ----------

function render() {
  var car = sec("Career");

  var moneyVal = parseClampedInt(u32(car.data + OFF.money));
  var repVal = parseClampedInt(u32(car.data + OFF.rep));
  el("money").value = "$" + nf(moneyVal);
  el("rep").value = nf(repVal);
  syncWalletControls();

  el("secCount").textContent = secs.list.length + " " + t("nSections");
  var rows = "";
  secs.list.forEach(function (s) {
    var notes = SECTION_NOTES[s.name] || [];
    rows += "<tr class=\"sec-row\" data-sec=\"" + s.name + "\">" +
      "<td>" + s.name + (notes.length ? '<span class="chev">&gt;</span>' : "") + "</td>" +
      "<td>0x" + s.data.toString(16).toUpperCase() + "</td>" +
      "<td>" + nf(s.size) + "</td>" +
      "</tr>";
    if (notes.length) {
      rows += "<tr class=\"sec-detail\" data-for=\"" + s.name + "\" hidden><td colspan=\"3\">" +
        "<table class=\"offsets\">" +
        notes.map(function (n) {
          var at = n.sub ? (n.add || 0) : n.at;
          var label = t(n.k);
          if (n.sub && at) label += " \u00b7 +" + at;
          if (n.back) label += " \u00b7 \u2212" + n.back + " stride";
          return "<tr><td>0x" + at.toString(16).toUpperCase() + "</td>" +
            "<td>" + n.size + "</td><td>" + label + "</td></tr>";
        }).join("") +
        "</table></td></tr>";
    }
  });
  el("secBody").innerHTML = rows;

  var opts = '<option value="">- ' + t("empty") + " -</option>";
  ROSTER.forEach(function (n) {
    var nice = CAR_TITLES[n] ? (CAR_TITLES[n] + " [" + n + "]") : n;
    opts += '<option value="' + n + '">' + nice + "</option>";
  });

  var total = slotCount();
  el("garCount").textContent = storedCars() + " / " + total + " " + t("nSlots");
  var host = el("slots");
  host.innerHTML = "";
  for (var n = 0; n < total; n++) {
    var s = readSlot(n);
    var ti = tuneInfo(n);
    var idxStr = (n < 10 ? "0" : "") + n;
    var row = document.createElement("div");
    row.className = "slot" + (s.car ? " filled" : "") + (ti.moto ? " moto" : "");
    row.innerHTML =
      '<span class="cursor" aria-hidden="true"></span>' +
      '<span class="n">' + idxStr + '</span>' +
      '<select data-slot="' + n + '" aria-label="' + t("aCar", n) + '">' + opts + "</select>" +
      '<input class="lbl" type="text" maxlength="31" placeholder="LABEL" data-label="' + n + '" aria-label="' + t("aLabel", n) + '">' +
      '<input class="plate" type="text" maxlength="7" pattern="[A-Z0-9 ]{7}" placeholder="PLATE" data-plate="' + n + '" aria-label="' + t("aPlate", n) + '">' +
      '<button class="btn mini tune" type="button" data-tune="' + n + '" style="--pct:' + ti.pct + '%" aria-label="' + t("aTune", n) + '"' +
      (!s.car ? " disabled" : "") + (ti.pct === 100 ? " data-full" : "") + ">" + ti.pct + "%</button>" +
      '<button class="btn-clear" type="button" data-clear="' + n + '" title="' + t("aClear", n) + '" aria-label="' + t("aClear", n) + '">x</button>';
    host.appendChild(row);
    row.querySelector("select").value = s.car;
    row.querySelector("input.lbl").value = s.label;
    row.querySelector("input.plate").value = s.plate;
  }

  function setSlotCar(n, val, rowEl) {
    var o = slotAt(n);
    var sel = rowEl.querySelector("select");
    var lbl = rowEl.querySelector("input.lbl");
    /* The car that was there before: the base for the appearance reset. */
    var prev = readSlot(n).car;
    sel.value = val;
    if (val) {
      writeField(o, 32, val);
      lbl.value = autoLabel(val);
      writeField(o + OFF.slotLabel, 33, lbl.value);
      writeAppearance(o, val);
    } else {
      /* First the appearance returns to the stock of the car that left:
         erasing only the name leaves the tuned wheels and kit in the slot
         and the next car inherits them. Only then the slot becomes "blank"
         and the tune zeroes. */
      if (prev) writeAppearance(o, prev);
      writeField(o, 32, "blank");
      lbl.value = "";
      writeField(o + OFF.slotLabel, 33, "");
      /* Without this an empty slot keeps the previous car's tune, and the
         level comes back with the next car placed there. */
      clearTune(n);
    }
    rowEl.classList.toggle("filled", !!val);
    /* The new vehicle may be a bike with six categories instead of a car
       with thirteen, so the tune button has to be repainted from scratch. */
    paintTune();
    syncCars();
    el("garCount").textContent = storedCars() + " / " + total + " " + t("nSlots");
    applyGarageFilter();
  }

  host.querySelectorAll("select").forEach(function (sel) {
    sel.addEventListener("change", function () {
      setSlotCar(+sel.dataset.slot, sel.value, sel.closest(".slot"));
    });
  });

  host.querySelectorAll("button.btn-clear").forEach(function (btn) {
    btn.addEventListener("click", function () {
      setSlotCar(+btn.dataset.clear, "", btn.closest(".slot"));
    });
  });

  host.querySelectorAll("input.lbl").forEach(function (inp) {
    inp.addEventListener("input", function () {
      var n = +inp.dataset.label;
      writeField(slotAt(n) + OFF.slotLabel, 33, inp.value.replace(/[^\x20-\x7E]/g, ""));
      mark();
    });
  });

  host.querySelectorAll("input.plate").forEach(function (inp) {
    inp.addEventListener("input", function () {
      inp.value = inp.value.toUpperCase().replace(/[^A-Z0-9 ]/g, "").slice(0, 7);
      if (inp.value.length !== 7) return;
      var at = slotAt(+inp.dataset.plate) - OFF.slotStride * OFF.plateStrideBack + OFF.slotPlate;
      var enc = plateFrom(inp.value);
      for (var i = 0; i < 7; i++) bytes[at + i] = enc[i];
      mark();
    });
  });

  function paintTune() {
    host.querySelectorAll("button.tune").forEach(function (b) {
      var n = +b.dataset.tune;
      var hasCar = !!readSlot(n).car;
      var pct = tuneOf(n);
      b.disabled = !hasCar;
      b.textContent = pct + "%";
      b.style.setProperty("--pct", pct + "%");
      if (hasCar && pct === 100) b.setAttribute("data-full", ""); else b.removeAttribute("data-full");
    });
    /* A slot's vehicle type decides how many categories it has, so the
       row's moto class has to follow the select, not just the initial paint. */
    host.querySelectorAll(".slot").forEach(function (r) {
      var n = +r.querySelector("select").dataset.slot;
      r.classList.toggle("moto", tuneInfo(n).moto);
    });
  }

  window.refreshGarageTune = paintTune;

  paintTune();
  host.querySelectorAll("button.tune").forEach(function (b) {
    b.addEventListener("click", function () {
      var n = +b.dataset.tune;
      if (!readSlot(n).car) return;
      openPerformanceShop(n, b);
    });
  });

  el("maxAll").onclick = function () {
    for (var i = 0; i < total; i++) if (readSlot(i).car) maxTune(i);
    paintTune();
    mark();
  };

  renderProg();
  renderStats();
  /* After renderStats: coverage counts the named Stats rows. */
  renderCoverage();
  renderCareer();
  renderTimeTrial();

  bindIntField(el("money"), car.data + OFF.money, "$");
  bindIntField(el("rep"), car.data + OFF.rep, "");

  document.querySelectorAll("[data-add-money]").forEach(function (btn) {
    btn.onclick = function () {
      var cur = parseClampedInt(el("money").value);
      var next = parseClampedInt(cur + Number(btn.dataset.addMoney));
      el("money").value = "$" + nf(next);
      setU32(car.data + OFF.money, next);
      syncWalletControls();
      mark();
    };
  });
  document.querySelectorAll("[data-set-money]").forEach(function (btn) {
    btn.onclick = function () {
      var next = parseClampedInt(btn.dataset.setMoney);
      el("money").value = "$" + nf(next);
      setU32(car.data + OFF.money, next);
      syncWalletControls();
      mark();
    };
  });
  document.querySelectorAll("[data-add-rep]").forEach(function (btn) {
    btn.onclick = function () {
      var cur = parseClampedInt(el("rep").value);
      var next = parseClampedInt(cur + Number(btn.dataset.addRep));
      el("rep").value = nf(next);
      setU32(car.data + OFF.rep, next);
      syncWalletControls();
      mark();
    };
  });
  document.querySelectorAll("[data-set-rep]").forEach(function (btn) {
    btn.onclick = function () {
      var next = parseClampedInt(btn.dataset.setRep);
      el("rep").value = nf(next);
      setU32(car.data + OFF.rep, next);
      syncWalletControls();
      mark();
    };
  });

  applyGarageFilter();
  reportCars();
  el("roMoney").textContent = "$" + nf(parseClampedInt(u32(car.data + OFF.money)));
  el("roRep").textContent = nf(parseClampedInt(u32(car.data + OFF.rep)));
  el("status").textContent = "";
  el("status").className = "status";
}

/* `prefix` is the fixed text in front of the number (the "$" of money). */
function bindIntField(inp, offset, prefix) {
  inp.onkeydown = function (e) {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    var allowed = ["Backspace", "Delete", "Tab", "Escape", "Enter", "ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End"];
    if (allowed.indexOf(e.key) !== -1) return;
    if (!/^[0-9]$/.test(e.key)) e.preventDefault();
  };
  inp.oninput = function () {
    var val = maskWallet(inp, prefix);
    setU32(offset, val);
    syncWalletControls();
    mark();
  };
  inp.onblur = function () {
    var val = maskWallet(inp, prefix);
    setU32(offset, val);
    syncWalletControls();
    mark();
  };
}

/* ---------- Save coverage ----------

   Counts byte by byte what the editor understands. The offset list alone is
   not enough: it holds single fields, but the editor reads and writes whole
   blocks, and those give almost all the coverage.

   Each block counts its real size:
     - LocalOptions: the slot array (8176 bytes each) plus the 60 collectable
       bytes. Inside a slot the editor touches name, label, tune, appearance
       and plate.
     - Stats: only the named rows. An unnamed row (a*, t*, x*) never shows on
       screen and cannot be edited, so it does not count as understood.
     - Career: the 65 bytes of each progression block (progCount * 65) plus
       money, reputation and the counter.
   What is left is file structure (8 bytes plus each section header) and what
   nobody mapped yet: the body of Career and of LocalOptions. */
function renderCoverage() {
  if (!bytes) return;

  var total = bytes.length;
  var st = sec("Stats");

  var slots = slotCount();
  var slotBytes = slots * OFF.slotStride;
  var progBytes = progTotal() * OFF.progStride;

  /* Of the 304 Stats rows, only the ones the screen can name count. */
  var named = 0, unnamed = 0;
  STATS.forEach(function (r) { if (statName(r)) named++; else unnamed++; });
  var statsBytes = named * 16;

  var known = slotBytes + OFF.collectN + statsBytes + progBytes + 12;
  /* Potential: the whole Stats table counts, because its structure (16-byte
     row, FourCC, type, value) is known; what is missing is the meaning of
     the unnamed rows. The bar shows both: teal behind, cyan in front. */
  var potential = known - statsBytes + st.size;
  var fields = 0;
  secs.list.forEach(function (s) {
    (SECTION_NOTES[s.name] || []).forEach(function (n) { if (!n.sub) fields++; });
  });
  fields += CAREER_RECORDS.length;

  /* Structure: 8 bytes of file header plus 9 plus name per section. */
  var container = 8;
  secs.list.forEach(function (s) { container += 9 + s.name.length; });

  var unknown = Math.max(0, total - known - container);
  var pct = total ? (known / total) * 100 : 0;

  var potPct = total ? (potential / total) * 100 : 0;
  el("covPct").textContent = pct.toFixed(1) + "%";
  el("covFill").style.width = pct + "%";
  el("covPot").style.width = potPct + "%";
  el("covKnown").textContent = nf(known) + " B";
  el("covContainer").textContent = nf(container) + " B";
  el("covUnknown").textContent = nf(unknown) + " B";
  el("covFields").textContent = nf(fields);
  el("covSlots").textContent = slots + " \u00d7 " + nf(OFF.slotStride) + " B";
  el("covStats").textContent = named + " / " + STATS.length + " linhas";
  el("covProg").textContent = progTotal() + " \u00d7 65 B";
  el("covUnnamed").textContent = nf(unnamed);
}
