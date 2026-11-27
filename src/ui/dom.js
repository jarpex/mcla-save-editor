(() => {
  "use strict";

  const { MAX_WALLET } = MCLA.data;
  const { sec, u32 } = MCLA.format;
  const { t, nf } = MCLA.ui;

  const el = (id) => document.getElementById(id);

  function parseClampedInt(raw) {
    const digits = String(raw == null ? "" : raw).replace(/\D+/g, "");
    if (!digits) return 0;
    const n = parseInt(digits, 10);
    if (!isFinite(n) || n < 0) return 0;
    return Math.min(MAX_WALLET, n);
  }

  function maskWallet(inp, prefix) {
    const raw = inp.value;
    const caret = inp.selectionStart == null ? raw.length : inp.selectionStart;
    const digitsBefore = raw.slice(0, caret).replace(/\D+/g, "").length;
    const digits = raw.replace(/\D+/g, "");
    const val = parseClampedInt(digits);
    const body = digits === "" ? "" : nf(val);
    inp.value = `${prefix || ""}${body}`;

    let pos = (prefix || "").length;
    let seen = 0;
    while (pos < inp.value.length && seen < digitsBefore) {
      if (/[0-9]/.test(inp.value.charAt(pos))) seen++;
      pos++;
    }
    if (inp.setSelectionRange) inp.setSelectionRange(pos, pos);
    return val;
  }

  function maskDigits(d) {
    if (!d) return "";
    if (d.length > 6) d = d.slice(0, 6);
    if (d.length <= 2) return d;
    if (d.length <= 4) return `${d.slice(0, 2)}:${d.slice(2)}`;
    return `${d.slice(0, 2)}:${d.slice(2, 4)}.${d.slice(4)}`;
  }

  function maskTime(str, prev) {
    const raw = String(str == null ? "" : str);
    const digits = raw.replace(/[^0-9]/g, "");
    if (prev && raw.length === prev.length + 1 && raw.startsWith(prev)) {
      return maskDigits(prev.replace(/[^0-9]/g, "") + raw.slice(-1));
    }
    if (!/[^0-9]/.test(raw)) return maskDigits(digits);
    return raw;
  }

  function mark() {
    MCLA.state.sectionsDirty = true;
    el("roMoney").textContent = `$${nf(parseClampedInt(el("money").value))}`;
    el("roRep").textContent = nf(parseClampedInt(el("rep").value));
    el("status").textContent = t("unsaved");
    el("status").className = "status";
  }

  function setFileTag() {
    const { bytes, secs, fileName } = MCLA.state;
    el("filetag").textContent = bytes
      ? `${fileName} - ${nf(bytes.length)} bytes - ${secs.list.length} ${t("nSections")}`
      : t("noFile");
  }

  /* Shared collapsible group builder used by Race Stats and Collectables. */
  function createCollapsibleGroup({ titleText, badgeText, openMap, key }) {
    const group = document.createElement("div");
    group.className = "stat-group";

    const head = document.createElement("div");
    head.className = "stat-head";

    const chev = document.createElement("span");
    chev.className = "chev";
    chev.setAttribute("aria-hidden", "true");
    chev.textContent = "\u25B6";

    const label = document.createElement("span");
    label.textContent = titleText;

    head.append(chev, label);

    let badge = null;
    if (badgeText != null) {
      badge = document.createElement("span");
      badge.className = "group-count";
      badge.textContent = badgeText;
      head.appendChild(badge);
    }

    const body = document.createElement("div");
    body.className = "stat-group-body";
    const inner = document.createElement("div");
    inner.className = "stat-group-inner";
    body.appendChild(inner);

    group.append(head, body);

    if (openMap[key]) group.classList.add("open");
    head.setAttribute("role", "button");
    head.setAttribute("tabindex", "0");
    head.setAttribute("aria-expanded", openMap[key] ? "true" : "false");

    const toggle = () => {
      const open = group.classList.toggle("open");
      openMap[key] = open;
      head.setAttribute("aria-expanded", open ? "true" : "false");
    };

    head.addEventListener("click", toggle);
    head.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " " || e.key === "Spacebar") {
        e.preventDefault();
        toggle();
      }
    });

    return { group, inner, badge };
  }

  function updateReadouts() {
    const car = sec("Career");
    if (!car) return;
    el("roMoney").textContent = `$${nf(parseClampedInt(u32(car.data + MCLA.data.OFF.money)))}`;
    el("roRep").textContent = nf(parseClampedInt(u32(car.data + MCLA.data.OFF.rep)));
  }

  Object.assign(MCLA.ui, {
    el,
    parseClampedInt,
    maskWallet,
    maskTime,
    mark,
    setFileTag,
    createCollapsibleGroup,
    updateReadouts
  });
})();
