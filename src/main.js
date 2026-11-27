(() => {
  "use strict";

  const { parse } = MCLA.format;
  const {
    el, t, nf, setFileTag, updateReadouts,
    renderWallet, renderGarage, renderProg, renderStats,
    renderCareer, renderTimeTrial, renderAlmanac, renderUseful, renderCoverage,
    setTab, bindNavEvents, bindShopEvents
  } = MCLA.ui;

  function renderSectionsAsync() {
    if (!MCLA.state.bytes || !MCLA.state.sectionsDirty) return;
    MCLA.state.sectionsDirty = false;
    renderCoverage();
    renderAlmanac();
    requestAnimationFrame(() => {
      if (MCLA.state.bytes) renderUseful();
    });
  }

  function renderAll() {
    renderWallet();
    renderGarage();
    renderProg();
    renderStats();
    renderCareer();
    renderTimeTrial();
    updateReadouts();
    MCLA.state.sectionsDirty = true;
    if (MCLA.state.activeTab === "sections") {
      requestAnimationFrame(renderSectionsAsync);
    }
    el("status").textContent = "";
    el("status").className = "status";
  }

  function loadFile(file) {
    const reader = new FileReader();
    reader.onload = () => {
      const p = parse(reader.result);
      if (!p.valid) {
        el("err").hidden = false;
        el("err").innerHTML = `<span><strong>${t("badFileTitle")}</strong> ` +
          `${t("badFileBody", p.endedAt.toString(16).toUpperCase(), reader.result.byteLength.toString(16).toUpperCase())}</span>`;
        return;
      }
      el("err").hidden = true;
      Object.assign(MCLA.state, {
        bytes: new Uint8Array(reader.result),
        view: new DataView(reader.result),
        secs: p,
        fileName: file.name || "mc4.sav",
        ttBase: null
      });
      setFileTag();
      el("empty").hidden = true;
      el("editor").hidden = false;
      el("tabsWrap").hidden = false;
      el("actionbar").hidden = false;
      renderAll();
      setTab(MCLA.state.activeTab);
    };
    reader.readAsArrayBuffer(file);
  }

  function bindFileActions() {
    el("save").addEventListener("click", () => {
      const { bytes } = MCLA.state;
      const check = parse(bytes.buffer);
      if (!check.valid) {
        el("status").textContent = t("wouldBreak");
        el("status").className = "status bad";
        return;
      }
      const a = document.createElement("a");
      a.href = URL.createObjectURL(new Blob([bytes], { type: "application/octet-stream" }));
      a.download = "mc4.sav";
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 4000);
      el("status").textContent = `${t("downloaded")}, ${nf(bytes.length)} bytes`;
      el("status").className = "status good";
    });

    el("pick").addEventListener("click", () => el("file").click());
    el("reopen").addEventListener("click", () => el("file").click());
    el("file").addEventListener("change", (e) => {
      if (e.target.files[0]) loadFile(e.target.files[0]);
      e.target.value = "";
    });

    const dz = el("drop");
    ["dragenter", "dragover"].forEach((ev) => {
      dz.addEventListener(ev, (e) => { e.preventDefault(); dz.classList.add("hot"); });
    });
    ["dragleave", "drop"].forEach((ev) => {
      dz.addEventListener(ev, (e) => { e.preventDefault(); dz.classList.remove("hot"); });
    });
    dz.addEventListener("drop", (e) => {
      const f = e.dataTransfer.files[0];
      if (f) loadFile(f);
    });

    document.addEventListener("dragover", (e) => e.preventDefault());
    document.addEventListener("drop", (e) => {
      if (e.target.closest("#drop")) return;
      e.preventDefault();
      const f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
      if (f) loadFile(f);
    });
  }

  Object.assign(MCLA.ui, { renderAll, renderSectionsAsync });

  bindShopEvents();
  bindFileActions();
  bindNavEvents();
})();
