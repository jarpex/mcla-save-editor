(() => {
  "use strict";

  const { OFF, MAX_WALLET } = MCLA.data;
  const { sec, u32, setU32 } = MCLA.format;
  const { el, nf, parseClampedInt, maskWallet, mark } = MCLA.ui;

  function updateRepBar(repVal) {
    const bar = el("repBar");
    if (!bar) return;
    if (!bar.children.length) {
      for (let i = 0; i < 10; i++) {
        const seg = document.createElement("span");
        seg.className = "rank-seg";
        bar.appendChild(seg);
      }
    }
    const level = Math.min(10, Math.floor((Number(repVal) || 0) / 2500));
    for (let j = 0; j < 10; j++) {
      bar.children[j].classList.toggle("on", j < level);
    }
  }

  function syncWalletControls() {
    const mVal = parseClampedInt(el("money").value);
    const rVal = parseClampedInt(el("rep").value);
    document.querySelectorAll("[data-add-money]").forEach((btn) => { btn.disabled = mVal >= MAX_WALLET; });
    document.querySelectorAll("[data-set-money]").forEach((btn) => { btn.disabled = mVal === parseClampedInt(btn.dataset.setMoney); });
    document.querySelectorAll("[data-add-rep]").forEach((btn) => { btn.disabled = rVal >= MAX_WALLET; });
    document.querySelectorAll("[data-set-rep]").forEach((btn) => { btn.disabled = rVal === parseClampedInt(btn.dataset.setRep); });
    updateRepBar(rVal);
  }

  function bindIntField(inp, offset, prefix) {
    inp.onkeydown = (e) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const allowed = ["Backspace", "Delete", "Tab", "Escape", "Enter", "ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End"];
      if (allowed.includes(e.key)) return;
      if (!/^[0-9]$/.test(e.key)) e.preventDefault();
    };
    const commit = () => {
      const val = maskWallet(inp, prefix);
      setU32(offset, val);
      syncWalletControls();
      mark();
    };
    inp.oninput = commit;
    inp.onblur = commit;
  }

  function renderWallet() {
    const car = sec("Career");
    const moneyVal = parseClampedInt(u32(car.data + OFF.money));
    const repVal = parseClampedInt(u32(car.data + OFF.rep));
    el("money").value = `$${nf(moneyVal)}`;
    el("rep").value = nf(repVal);
    syncWalletControls();

    bindIntField(el("money"), car.data + OFF.money, "$");
    bindIntField(el("rep"), car.data + OFF.rep, "");

    const wirePreset = (selector, inputId, offset, prefix, isAdd) => {
      document.querySelectorAll(selector).forEach((btn) => {
        btn.onclick = () => {
          const raw = isAdd
            ? parseClampedInt(el(inputId).value) + Number(btn.dataset[isAdd])
            : btn.dataset[inputId === "money" ? "setMoney" : "setRep"];
          const next = parseClampedInt(raw);
          el(inputId).value = `${prefix}${nf(next)}`;
          setU32(offset, next);
          syncWalletControls();
          mark();
        };
      });
    };

    wirePreset("[data-add-money]", "money", car.data + OFF.money, "$", "addMoney");
    wirePreset("[data-set-money]", "money", car.data + OFF.money, "$", null);
    wirePreset("[data-add-rep]", "rep", car.data + OFF.rep, "", "addRep");
    wirePreset("[data-set-rep]", "rep", car.data + OFF.rep, "", null);
  }

  Object.assign(MCLA.ui, { renderWallet, syncWalletControls, updateRepBar });
})();
