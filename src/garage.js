var TUNE_CATS = [
  "Exhaust system", "Headers", "Cold Air Intake", "Forced Induction",
  "Engine Upgrade", "Electronics", "Nitrous", "Clutch", "Gear Kit",
  "Shocks/Springs", "Swaybars", "Brakes", "Tires"
];

/* Motorcycle categories, as indexes into TUNE_CATS. */
var MOTO_CATS = [0, 4, 5, 6, 8, 12];

var MOTO = { vp_duc_999r_06: 1, vp_duc_monster_s4r_07: 1, vp_kaw_ninja_zx14_06: 1 };

function isMoto(car) { return !!MOTO[car]; }

/* The category list a vehicle actually has, as TUNE_CATS indexes. */
function tuneCatIdx(car) { return isMoto(car) ? MOTO_CATS : TUNE_CATS.map(function (_, i) { return i; }); }

/* Highest byte value the vehicle accepts: 2 (3 levels: Stock, LVL 2, LVL 3). */
function tuneMaxByte(car) { return 2; }

/* Human level, 1-based, straight from the byte. */
function tuneLevel(byte) { return byte + 1; }

function tunePctAt(n) {
  var car = readSlot(n).car;
  var idx = tuneCatIdx(car);
  var sum = 0;
  for (var i = 0; i < idx.length - 1; i++) sum += Math.min(2, bytes[tuneAt(n) + OFF.tuneLv + idx[i]]);
  return Math.max(0, Math.min(100, Math.floor(sum * 100 / (2 * (idx.length - 1)))));
}

function tuneOf(n) { return tunePctAt(n); }

/* Write one category of one slot. `level` is 1-based (1 = stock). */
function tuneSet(n, catIdx, level) {
  var v = Math.max(0, Math.min(tuneMaxByte(readSlot(n).car), level - 1));
  bytes[tuneAt(n) + OFF.tuneLv + catIdx] = v;
  bytes[tuneAt(n) + OFF.tunePct] = tunePctAt(n);
  return v + 1;
}

/* Max every category the vehicle has. Returns the resulting percent. */
function maxTune(n) {
  var car = readSlot(n).car;
  var idx = tuneCatIdx(car);
  var top = tuneMaxByte(car);
  for (var i = 0; i < idx.length; i++) bytes[tuneAt(n) + OFF.tuneLv + idx[i]] = top;
  bytes[tuneAt(n) + OFF.tunePct] = tunePctAt(n);
  return tunePctAt(n);
}

/* Everything the UI needs about one slot's tune, in one object. */
/* Zera o bloco de tune do slot: 13 niveis em +95 e a porcentagem em +126.
   O bloco fica fisicamente no stride anterior (tuneAt), entao usamos tuneAt
   pra ler e pra escrever -- os dois tem que concordar. */
function clearTune(n) {
  var at = tuneAt(n);
  for (var i = 0; i < OFF.tuneN; i++) bytes[at + OFF.tuneLv + i] = 0;
  bytes[at + OFF.tunePct] = 0;
}

function tuneInfo(n) {
  var car = readSlot(n).car;
  var moto = isMoto(car);
  var idx = tuneCatIdx(car);
  var max = tuneMaxByte(car);
  var cats = idx.map(function (ci) {
    var catTitle = (moto && ci === 5) ? "Jet Kits" : TUNE_CATS[ci];
    var rawLv = tuneLevel(bytes[tuneAt(n) + OFF.tuneLv + ci]);
    return {
      idx: ci,
      name: catTitle,
      level: Math.max(1, Math.min(max + 1, rawLv)),
      max: max + 1
    };
  });
  return { car: car, moto: moto, cats: cats, pct: tunePctAt(n), max: max + 1 };
}
