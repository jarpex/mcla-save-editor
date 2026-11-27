// ---------- Load ----------

function load(file) {
  var r = new FileReader();
  r.onload = function () {
    var p = parse(r.result);
    if (!p.valid) {
      el("err").hidden = false;
      el("err").innerHTML = "<span><strong>" + t("badFileTitle") + "</strong> " +
        t("badFileBody", p.endedAt.toString(16).toUpperCase(), r.result.byteLength.toString(16).toUpperCase()) + "</span>";
      return;
    }
    el("err").hidden = true;
    bytes = new Uint8Array(r.result);
    view = new DataView(r.result);
    secs = p;
    fileName = file.name || "mc4.sav";
    /* A base da tabela de alvos muda de save para save; recalcula no proximo
       paintTimeTrial em vez de reaproveitar a do arquivo anterior. */
    resetTtBase();
    setFileTag();
    el("empty").hidden = true;
    el("editor").hidden = false;
    el("tabsWrap").hidden = false;
    el("actionbar").hidden = false;
    render();
    setTab(ACTIVE_TAB);
  };
  r.readAsArrayBuffer(file);
}
