(() => {
  "use strict";

  const {
    el, t, setFileTag, pickLang,
    isShopOpen, closePerformanceShop, renderShopRows, setShopCategoryLevel,
    applyGarageFilter
  } = MCLA.ui;

  function updateSliderThumb() {
    const activeBtn = document.querySelector("#navTabs .tab-btn.active");
    const track = el("mclaTrack");
    const thumb = el("sliderThumb");
    if (!activeBtn || !track || !thumb) return;
    const trackRect = track.getBoundingClientRect();
    const btnRect = activeBtn.getBoundingClientRect();
    if (!trackRect.width || !btnRect.width) return;
    thumb.style.left = `${Math.max(0, Math.round(btnRect.left - trackRect.left))}px`;
    thumb.style.width = `${Math.round(btnRect.width)}px`;
  }

  function setTab(tab) {
    MCLA.state.activeTab = tab;
    document.querySelectorAll("#navTabs .tab-btn").forEach((b) => {
      b.classList.toggle("active", b.dataset.tab === tab);
    });

    document.querySelectorAll("#mainGrid .panel").forEach((p) => {
      p.classList.toggle("is-hidden", p.getAttribute("data-group") !== tab);
    });

    const leftCol = el("leftCol");
    const rightCol = el("rightCol");
    const leftVisible = Array.from(leftCol.children).some((c) => !c.classList.contains("is-hidden"));
    const rightVisible = Array.from(rightCol.children).some((c) => !c.classList.contains("is-hidden"));
    leftCol.classList.toggle("is-hidden", !leftVisible);
    rightCol.classList.toggle("is-hidden", !rightVisible);
    el("mainGrid").classList.toggle("single-col", !leftVisible || !rightVisible);

    requestAnimationFrame(() => {
      updateSliderThumb();
      if (tab === "sections" && MCLA.state.bytes && MCLA.state.sectionsDirty) {
        MCLA.ui.renderSectionsAsync();
      }
    });
  }

  function applyLang() {
    const lang = MCLA.state.lang;
    document.documentElement.lang = lang === "pt" ? "pt-BR" : (lang === "ru" ? "ru" : "en");
    document.querySelectorAll("[data-i18n]").forEach((e) => {
      e.textContent = t(e.getAttribute("data-i18n"));
    });
    document.querySelectorAll("[data-i18n-ph]").forEach((e) => {
      e.placeholder = t(e.getAttribute("data-i18n-ph"));
    });
    el("langCode").textContent = lang.toUpperCase();
    document.querySelectorAll("[data-set-lang]").forEach((opt) => {
      const active = opt.dataset.setLang === lang;
      opt.classList.toggle("active", active);
      opt.setAttribute("aria-selected", active ? "true" : "false");
    });
    if (MCLA.state.bytes) {
      MCLA.ui.renderAll();
      setTab(MCLA.state.activeTab);
    }
    if (isShopOpen()) {
      el("shopTypeBadge").textContent = t(MCLA.state.shop.moto ? "shopBikeBadge" : "shopCarBadge");
    }
    setFileTag();
  }

  function closeLangMenu() {
    el("langList").hidden = true;
    el("langBtn").setAttribute("aria-expanded", "false");
  }

  function initCollapsiblePanels() {
    document.querySelectorAll('.panel[data-group="career"]').forEach((panel) => {
      if (!panel.querySelector(".statlist")) return;
      const body = panel.querySelector(".body");
      const head = panel.querySelector("header");
      if (!body || !head) return;

      const wrap = document.createElement("div");
      wrap.className = "body-wrap";
      body.parentNode.insertBefore(wrap, body);
      wrap.appendChild(body);

      const chev = document.createElement("span");
      chev.className = "chev";
      chev.setAttribute("aria-hidden", "true");
      chev.textContent = "\u25B6";
      const count = head.querySelector(".count");
      if (count) head.insertBefore(chev, count);
      else head.appendChild(chev);

      panel.classList.add("collapsible");
      head.setAttribute("role", "button");
      head.setAttribute("tabindex", "0");
      head.setAttribute("aria-expanded", "false");

      const toggle = () => {
        const open = panel.classList.toggle("open");
        head.setAttribute("aria-expanded", open ? "true" : "false");
      };
      head.addEventListener("click", toggle);
      head.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " " || e.key === "Spacebar") {
          e.preventDefault();
          toggle();
        }
      });
    });
  }

  function bindNavEvents() {
    initCollapsiblePanels();

    document.querySelectorAll("#navTabs .tab-btn").forEach((b) => {
      b.addEventListener("click", () => setTab(b.dataset.tab));
    });

    document.querySelectorAll("[data-gar-filter]").forEach((b) => {
      b.addEventListener("click", () => {
        MCLA.state.garageFilter = b.dataset.garFilter;
        applyGarageFilter();
      });
    });

    window.addEventListener("resize", () => { if (MCLA.state.bytes) updateSliderThumb(); });
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => { if (MCLA.state.bytes) updateSliderThumb(); });
    }

    document.addEventListener("keydown", (e) => {
      if (isShopOpen()) {
        const st = MCLA.state.shop;
        const totalCats = st.cats.length;
        if (e.key === "Escape") { e.preventDefault(); closePerformanceShop(false); return; }
        if (e.key === "Enter") {
          if ([el("shopCancelBtn"), el("shopStockBtn"), el("shopAutoBtn")].includes(e.target)) return;
          e.preventDefault();
          closePerformanceShop(true);
          return;
        }
        if (e.key === "ArrowUp") { e.preventDefault(); st.activeRow = (st.activeRow - 1 + totalCats) % totalCats; renderShopRows(); return; }
        if (e.key === "ArrowDown") { e.preventDefault(); st.activeRow = (st.activeRow + 1) % totalCats; renderShopRows(); return; }
        if (e.key === "ArrowLeft") { e.preventDefault(); setShopCategoryLevel(st.activeRow, st.cats[st.activeRow].level - 1); return; }
        if (e.key === "ArrowRight") { e.preventDefault(); setShopCategoryLevel(st.activeRow, st.cats[st.activeRow].level + 1); return; }
        return;
      }

      const active = document.activeElement;
      const tag = (active && active.tagName) || "";
      const isFormField = ["INPUT", "SELECT", "TEXTAREA"].includes(tag);

      if (e.key === "Escape") {
        closeLangMenu();
        if (isFormField && typeof active.blur === "function") active.blur();
        return;
      }

      if (!MCLA.state.bytes || isFormField || e.ctrlKey || e.metaKey || e.altKey) return;

      const order = ["garage", "career", "sections"];
      const cur = order.indexOf(MCLA.state.activeTab);
      if (e.code === "KeyQ" || e.key === "q" || e.key === "Q" || e.key === "[") {
        setTab(order[(cur - 1 + order.length) % order.length]);
      } else if (e.code === "KeyE" || e.key === "e" || e.key === "E" || e.key === "]") {
        setTab(order[(cur + 1) % order.length]);
      }
    });

    el("langBtn").addEventListener("click", (e) => {
      e.stopPropagation();
      const opening = el("langList").hidden;
      el("langList").hidden = !opening;
      el("langBtn").setAttribute("aria-expanded", opening ? "true" : "false");
    });

    document.querySelectorAll("[data-set-lang]").forEach((opt) => {
      opt.addEventListener("click", () => {
        MCLA.state.lang = opt.dataset.setLang;
        try { localStorage.setItem("mcla.lang", MCLA.state.lang); } catch (err) {}
        closeLangMenu();
        applyLang();
      });
    });

    document.addEventListener("click", (e) => {
      if (!e.target.closest("#langMenu")) closeLangMenu();
      const head = e.target.closest(".doc-head");
      if (head) {
        MCLA.ui.hydrateUsefulGroup(head.parentElement);
        head.parentElement.classList.toggle("open");
        return;
      }
      const aln = e.target.closest(".aln-head");
      if (aln) {
        MCLA.ui.hydrateAlmanacNode(aln.parentElement);
        aln.parentElement.classList.toggle("open");
      }
    });

    MCLA.state.lang = pickLang();
    applyLang();
  }

  Object.assign(MCLA.ui, { setTab, updateSliderThumb, applyLang, bindNavEvents });
})();
