// ---------- Collapsible stat panels ----------
// As cinco telas de tabela (Game/Vehicle/Race/Collectables/Career) comecam
// so com o cabecalho. Um clique abre a altura com animacao; o estado fica
// marcado no proprio painel, entao nada de duplicar markup em body.html.

(function () {
  var panels = document.querySelectorAll('.panel[data-group="career"]');
  Array.prototype.forEach.call(panels, function (panel) {
    if (!panel.querySelector(".statlist")) return;

    var body = panel.querySelector(".body");
    if (!body) return;

    var wrap = document.createElement("div");
    wrap.className = "body-wrap";
    body.parentNode.insertBefore(wrap, body);
    wrap.appendChild(body);

    var head = panel.querySelector("header");
    if (!head) return;

    /* O chevron fica antes do contador, senao o margin-left:auto do
       contador empurra a seta para a extrema direita. */
    var chev = document.createElement("span");
    chev.className = "chev";
    chev.setAttribute("aria-hidden", "true");
    chev.textContent = "\u25B6";
    var count = head.querySelector(".count");
    if (count) head.insertBefore(chev, count);
    else head.appendChild(chev);

    panel.classList.add("collapsible");
    head.setAttribute("role", "button");
    head.setAttribute("tabindex", "0");
    head.setAttribute("aria-expanded", "false");

    function toggle() {
      var open = panel.classList.toggle("open");
      head.setAttribute("aria-expanded", open ? "true" : "false");
    }

    head.addEventListener("click", toggle);
    head.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " " || e.key === "Spacebar") {
        e.preventDefault();
        toggle();
      }
    });
  });
})();

// ---------- Tabs, Filter & Keyboard Navigation ----------

document.querySelectorAll("#navTabs .tab-btn").forEach(function (b) {
  b.addEventListener("click", function () { setTab(b.dataset.tab); });
});

document.querySelectorAll("[data-gar-filter]").forEach(function (b) {
  b.addEventListener("click", function () {
    GARAGE_FILTER = b.dataset.garFilter;
    applyGarageFilter();
  });
});

window.addEventListener("resize", function () {
  if (bytes) updateSliderThumb();
});

if (document.fonts && document.fonts.ready) {
  document.fonts.ready.then(function () {
    if (bytes) updateSliderThumb();
  });
}

document.addEventListener("keydown", function (e) {
  if (isShopOpen()) {
    var totalCats = SHOP_STATE.cats.length;
    if (e.key === "Escape") {
      e.preventDefault();
      closePerformanceShop(false);
      return;
    }
    if (e.key === "Enter") {
      if (e.target === el("shopCancelBtn") || e.target === el("shopStockBtn") || e.target === el("shopAutoBtn")) {
        return;
      }
      e.preventDefault();
      closePerformanceShop(true);
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      SHOP_STATE.activeRow = (SHOP_STATE.activeRow - 1 + totalCats) % totalCats;
      renderShopRows();
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      SHOP_STATE.activeRow = (SHOP_STATE.activeRow + 1) % totalCats;
      renderShopRows();
      return;
    }
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      setShopCategoryLevel(SHOP_STATE.activeRow, SHOP_STATE.cats[SHOP_STATE.activeRow].level - 1);
      return;
    }
    if (e.key === "ArrowRight") {
      e.preventDefault();
      setShopCategoryLevel(SHOP_STATE.activeRow, SHOP_STATE.cats[SHOP_STATE.activeRow].level + 1);
      return;
    }
    return;
  }

  var active = document.activeElement;
  var tag = (active && active.tagName) || "";
  var isFormField = tag === "INPUT" || tag === "SELECT" || tag === "TEXTAREA";

  if (e.key === "Escape") {
    closeLangMenu();
    if (isFormField && typeof active.blur === "function") {
      active.blur();
    }
    return;
  }

  if (!bytes || isFormField || e.ctrlKey || e.metaKey || e.altKey) return;

  var order = ["garage", "career", "sections"];
  var cur = order.indexOf(ACTIVE_TAB);
  if (e.code === "KeyQ" || e.key === "q" || e.key === "Q" || e.key === "[") {
    setTab(order[(cur - 1 + order.length) % order.length]);
  } else if (e.code === "KeyE" || e.key === "e" || e.key === "E" || e.key === "]") {
    setTab(order[(cur + 1) % order.length]);
  }
});

// ---------- Language Dropdown ----------

function closeLangMenu() {
  el("langList").hidden = true;
  el("langBtn").setAttribute("aria-expanded", "false");
}

el("langBtn").addEventListener("click", function (e) {
  e.stopPropagation();
  var opening = el("langList").hidden;
  el("langList").hidden = !opening;
  el("langBtn").setAttribute("aria-expanded", opening ? "true" : "false");
});

document.querySelectorAll("[data-set-lang]").forEach(function (opt) {
  opt.addEventListener("click", function () {
    LANG = opt.dataset.setLang;
    try { localStorage.setItem("mcla.lang", LANG); } catch (err) {}
    closeLangMenu();
    applyLang();
  });
});

document.addEventListener("click", function (e) {
  if (!e.target.closest("#langMenu")) closeLangMenu();

  /* Hex Sections: clicar na linha da secao abre os offsets conhecidos. */
  var row = e.target.closest(".sec-row");
  if (row) {
    var detail = el("secBody").querySelector('.sec-detail[data-for="' + row.dataset.sec + '"]');
    if (!detail) return;
    var open = detail.hasAttribute("hidden");
    if (open) detail.removeAttribute("hidden");
    else detail.setAttribute("hidden", "");
    row.classList.toggle("open", open);
  }
});

function pickLang() {
  try {
    var saved = localStorage.getItem("mcla.lang");
    if (saved === "pt" || saved === "en" || saved === "ru") return saved;
  } catch (err) {}
  var nav = (navigator.language || "").toLowerCase();
  if (nav.indexOf("pt") === 0) return "pt";
  if (nav.indexOf("ru") === 0) return "ru";
  return "en";
}

LANG = pickLang();
applyLang();
