// ---------- Time Conversion ----------

function msToText(ms) {
  var c = Math.max(0, Math.floor(ms / 10) * 10);
  var m = Math.floor(c / 60000), s = Math.floor(c / 1000) % 60, h = (c % 1000) / 10;
  return (m < 10 ? "0" : "") + m + ":" + (s < 10 ? "0" : "") + s + "." + (h < 10 ? "0" : "") + h;
}

/* Time mask: only digits are typed and the separators appear by themselves.
   The order matches the canonical format (MM:SS.Ms): two minute digits, two
   second digits, two hundredth digits. "3152" becomes "31:52".
   `prev` is what the mask returned on the last key: it tells continued
   typing ("03:01" then "5") from a pasted or fully typed value, which
   passes through untouched. */
function maskTime(str, prev) {
  var raw = String(str == null ? "" : str);
  var digits = raw.replace(/[^0-9]/g, "");

  /* Mask continuation: the new text is the old one plus a digit. */
  if (prev && raw.length === prev.length + 1 && raw.indexOf(prev) === 0) {
    return maskDigits(prev.replace(/[^0-9]/g, "") + raw.slice(-1));
  }
  /* Tudo digito: e digitacao limpa, mascara do zero. */
  if (!/[^0-9]/.test(raw)) return maskDigits(digits);
  /* Has a separator: either a valid time (pasted or typed, kept as is) or
     deliberate garbage, which must not be fixed silently. */
  return raw;
}

/* No padding in the middle: with 3 digits "031" becomes "03:1", not
   "03:01", or the fourth digit would land in the hundredths instead of
   closing the seconds. The canonical form (leading zero) returns on blur. */
function maskDigits(d) {
  if (!d) return "";
  if (d.length > 6) d = d.slice(0, 6);
  if (d.length <= 2) return d;
  if (d.length <= 4) return d.slice(0, 2) + ":" + d.slice(2);
  return d.slice(0, 2) + ":" + d.slice(2, 4) + "." + d.slice(4);
}

function storedCars() { return bytes[sec("LocalOptions").data + OFF.cars]; }

function paint(n) {
  var total = slotCount(), orphan = 0;
  for (var i = n; i < total; i++) if (readSlot(i).car) orphan++;
  var rows = el("slots").children;
  for (var k = 0; k < rows.length; k++) rows[k].classList.toggle("beyond", k >= n);
  el("roCars").textContent = n;
  return orphan;
}

function reportCars() {
  var n = storedCars(), c = contiguous(), orphan = paint(n), box = el("gap");
  if (c > n) {
    box.hidden = false;
    box.innerHTML = "<span><strong>" + t("hiddenTitle", c - n) + "</strong> " + t("hiddenBody", n, c) + "</span>" +
      '<button class="btn mini" id="fixCars" type="button">' + t("countThem", c) + "</button>";
    el("fixCars").onclick = syncCars;
  } else if (orphan) {
    box.hidden = false;
    box.innerHTML = "<span><strong>" + t("orphanTitle", orphan) + "</strong> " + t("orphanBody", n) + "</span>";
  } else {
    box.hidden = true;
  }
}

function syncCars() {
  var lo = sec("LocalOptions"), n = contiguous();
  bytes[lo.data + OFF.cars] = n;
  bytes[lo.data + OFF.carsIdx] = n > 0 ? n - 1 : 0;
  el("garCount").textContent = n + " / " + slotCount() + " " + t("nSlots");
  reportCars();
  mark();
}

function mark() {
  el("roMoney").textContent = "$" + nf(parseClampedInt(el("money").value));
  el("roRep").textContent = nf(parseClampedInt(el("rep").value));
  el("status").textContent = t("unsaved");
  el("status").className = "status";
}

function setFileTag() {
  el("filetag").textContent = bytes
    ? fileName + " - " + nf(bytes.length) + " bytes - " + secs.list.length + " " + t("nSections")
    : t("noFile");
}

function applyLang() {
  document.documentElement.lang = LANG === "pt" ? "pt-BR" : (LANG === "ru" ? "ru" : "en");
  document.querySelectorAll("[data-i18n]").forEach(function (e) {
    e.textContent = t(e.getAttribute("data-i18n"));
  });
  document.querySelectorAll("[data-i18n-ph]").forEach(function (e) {
    e.placeholder = t(e.getAttribute("data-i18n-ph"));
  });
  el("langCode").textContent = LANG.toUpperCase();
  document.querySelectorAll("[data-set-lang]").forEach(function (opt) {
    var active = opt.dataset.setLang === LANG;
    opt.classList.toggle("active", active);
    opt.setAttribute("aria-selected", active ? "true" : "false");
  });
  if (bytes) {
    render();
    setTab(ACTIVE_TAB);
  }
  if (isShopOpen()) {
    el("shopTypeBadge").textContent = t(SHOP_STATE.moto ? "shopBikeBadge" : "shopCarBadge");
  }
  setFileTag();
}
