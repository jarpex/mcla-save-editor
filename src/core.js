var bytes = null, view = null, secs = null, fileName = "mc4.sav";
var el = function (id) { return document.getElementById(id); };

function autoLabel(prefab) {
  var m = /^vp_[a-z0-9]+_(.+?)_(\d{2})(_DUB)?$/.exec(prefab);
  if (!m) return prefab.toUpperCase();
  return m[2] + " " + m[1].replace(/_/g, " ").toUpperCase() + (m[3] ? " DUB" : "");
}

function ascii(from, len) {
  var out = "";
  for (var i = 0; i < len; i++) {
    var c = bytes[from + i];
    if (c < 0x20 || c > 0x7E) break;
    out += String.fromCharCode(c);
  }
  return out;
}

function writeField(at, width, text) {
  for (var i = 0; i < width; i++) {
    bytes[at + i] = i < text.length ? text.charCodeAt(i) : (i === text.length ? 0 : 0xCD);
  }
}

/* Writes the appearance bytes (wheels and details) the game sets when you
   buy a car. Without this a new car inherits the wheels and kit of the
   slot's previous occupant. */
function writeAppearance(at, prefab) {
  var preset = STOCK_APPEARANCE[prefab];
  if (!preset) return;
  for (var i = 0; i < OFF.appear.length; i++) bytes[at + OFF.appear[i]] = preset[i];
}

function parse(buf) {
  var b = new Uint8Array(buf), dv = new DataView(buf), list = [], o = 8;
  while (o + 4 <= b.length) {
    var nameLen = dv.getUint32(o);
    if (nameLen === 0 || nameLen > 64) break;
    if (o + 4 + nameLen + 5 > b.length) break;
    var name = "", ok = true;
    for (var i = 0; i < nameLen; i++) {
      var c = b[o + 4 + i];
      if (c < 0x20 || c > 0x7E) { ok = false; break; }
      name += String.fromCharCode(c);
    }
    if (!ok) break;
    var size = dv.getUint32(o + 4 + nameLen + 1);
    var data = o + 4 + nameLen + 5;
    if (data + size > b.length) break;
    list.push({ name: name, flag: b[o + 4 + nameLen], size: size, data: data });
    o = data + size;
  }
  return { list: list, endedAt: o, valid: o === b.length && list.length > 0 };
}

function sec(name) {
  for (var i = 0; i < secs.list.length; i++) if (secs.list[i].name === name) return secs.list[i];
  return null;
}
function u32(at) { return view.getUint32(at); }
function setU32(at, v) { view.setUint32(at, v >>> 0); }
function f32(at) { return view.getFloat32(at); }
function setF32(at, v) { view.setFloat32(at, v); }
function setU8(at, v) { view.setUint8(at, v & 0xFF); }

function slotAt(n) { return sec("LocalOptions").data + OFF.slot0 + n * OFF.slotStride; }
function tuneAt(n) { return sec("LocalOptions").data + OFF.tuneBase + n * OFF.slotStride; }

/* ---------- performance upgrades ----------
   Thirteen category bytes at +95, level = byte + 1 (0 stock, 1 level 2,
   2 level 3). Motorcycles use 6 of the same bytes, also 3 levels (byte 0..2).
   The tune % at +126 is derived, not stored by the player:
   the LAST category (Tires) never counts, so the divisor is 2*(n-1). */
