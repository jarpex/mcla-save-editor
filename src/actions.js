// ---------- Save & File Input ----------

el("save").addEventListener("click", function () {
  var check = parse(bytes.buffer);
  if (!check.valid) {
    el("status").textContent = t("wouldBreak");
    el("status").className = "status bad";
    return;
  }
  var a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([bytes], { type: "application/octet-stream" }));
  a.download = "mc4.sav";
  a.click();
  setTimeout(function () { URL.revokeObjectURL(a.href); }, 4000);
  el("status").textContent = t("downloaded") + ", " + nf(bytes.length) + " bytes";
  el("status").className = "status good";
});

el("pick").addEventListener("click", function () { el("file").click(); });
el("reopen").addEventListener("click", function () { el("file").click(); });
el("file").addEventListener("change", function (e) {
  if (e.target.files[0]) load(e.target.files[0]);
  e.target.value = "";
});

var dz = el("drop");
["dragenter", "dragover"].forEach(function (ev) {
  dz.addEventListener(ev, function (e) { e.preventDefault(); dz.classList.add("hot"); });
});
["dragleave", "drop"].forEach(function (ev) {
  dz.addEventListener(ev, function (e) { e.preventDefault(); dz.classList.remove("hot"); });
});
dz.addEventListener("drop", function (e) {
  var f = e.dataTransfer.files[0];
  if (f) load(f);
});

document.addEventListener("dragover", function (e) { e.preventDefault(); });
document.addEventListener("drop", function (e) {
  if (e.target.closest("#drop")) return;
  e.preventDefault();
  var f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
  if (f) load(f);
});
