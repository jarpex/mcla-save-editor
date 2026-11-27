/* Runs the script from inside index.html against a synthetic save and checks
   that render() wires the editable fields and that each one writes where it
   should.

   It exists because of a real bug: `var t = bytes[o + 8]` inside renderStats
   shadowed the t() translation function, render() blew up halfway, and the
   money and reputation oninput handlers were never attached. The screen looked
   right, the fields accepted typing, and nothing was written. Any exception
   mid-render() reproduces that class of failure, so the test covers the whole
   class, not just that line.

   node tests/render.test.js
   node tests/render.test.js C:\path\to\mc4.sav */

var fs = require("fs");
var path = require("path");
var vm = require("vm");
var assert = require("assert");

var ROOT = path.join(__dirname, "..");

var OFF_LABEL = 32, OFF_PLATE = 2186, SLOT_STRIDE = 8176, SLOT0 = 0x24FD;
var TUNE_BASE = 1293, TUNE_LV = 95, TUNE_N = 13, TUNE_PCT = 126;

// ---------- synthetic save ----------
// Same shape as the real one, small. No game data enters the repository.

var CAREER = 30000;       // cobre a progressao (0x2E9 + 43*65) e a tabela de alvos (0x727D)
var LOCAL = SLOT0 + SLOT_STRIDE * 2;
/* Collectables live at LocalOptions+0x3DF84, so the section must be larger
   than that for the synthetic save to match the real layout. */
var LOCAL_MIN = 0x3E000;
var STATS = 2048;         // cobre os recordes de time trial (0x6A8)

function buildSave() {
  var secs = [
    { name: "Stats", flag: 1, size: STATS },
    { name: "LocalOptions", flag: 9, size: Math.max(LOCAL, LOCAL_MIN) },
    { name: "Career", flag: 11, size: CAREER }
  ];

  var total = 8;
  secs.forEach(function (s) { total += 4 + s.name.length + 1 + 4 + s.size; });

  var buf = new ArrayBuffer(total);
  var b = new Uint8Array(buf);
  var dv = new DataView(buf);
  var at = {};

  dv.setUint32(0, 0x0E);
  dv.setUint32(4, secs.length);

  var o = 8;
  secs.forEach(function (s) {
    dv.setUint32(o, s.name.length);
    for (var i = 0; i < s.name.length; i++) b[o + 4 + i] = s.name.charCodeAt(i);
    b[o + 4 + s.name.length] = s.flag;
    dv.setUint32(o + 4 + s.name.length + 1, s.size);
    at[s.name] = o + 4 + s.name.length + 5;
    o = at[s.name] + s.size;
  });
  assert.strictEqual(o, total, "o walk das secoes tem que fechar no fim do arquivo");

  dv.setUint32(at.Career + 0x2D9, 1234);   // dinheiro
  dv.setUint32(at.Career + 0x2E1, 2050);   // reputacao
  dv.setUint32(at.Career + 0x2E5, 43);     // blocos de progressao

  /* Target table: 4 time trial + 16 race. The base is found by pattern (4
     plausible values then 16 plausible or zero), so the synthetic save needs
     it or the panel stays disabled. */
  [128540, 150000, 137000, 115000].forEach(function (v, i) {
    dv.setUint32(at.Career + 0x727D + i * 4, v);
  });
  b[at.LocalOptions + 0x53F] = 1;          // contador de carros
  b[at.LocalOptions + 0x543] = 0;

  // car 0's tune block: half tuned, so the read has something to show
  var t0 = at.LocalOptions + TUNE_BASE;
  for (var k = 0; k < TUNE_N; k++) b[t0 + TUNE_LV + k] = 1;
  b[t0 + TUNE_PCT] = 50;

  // slot 0 occupied, so the opening has something to read
  var s0 = at.LocalOptions + SLOT0;
  "vp_vw_golf_83".split("").forEach(function (c, i) { b[s0 + i] = c.charCodeAt(0); });
  "83 GOLF/GTI".split("").forEach(function (c, i) { b[s0 + OFF_LABEL + i] = c.charCodeAt(0); });
  // slot N's plate lives in the previous stride (slotAt(N) - STRIDE +
  // OFF_PLATE), so slot 1's lands at s0 + OFF_PLATE: what the opening reads.
  "RSTLESS".split("").forEach(function (c, i) { b[s0 + OFF_PLATE + i] = c.charCodeAt(0); });

  // two stat records, at the absolute offset where offset % 16 == 2
  var st = at.Stats + (((2 - (at.Stats % 16)) % 16) + 16) % 16;
  ["gWIN", "tPUR"].forEach(function (key, n) {
    var r = st + n * 16;
    for (var i = 0; i < 4; i++) b[r + i] = key.charCodeAt(i);
    b[r + 8] = 0x2C;                       // inteiro, nao float
    dv.setUint32(r + 12, 7 + n);
  });

  /* khTC: play hours, float. The screen shows h:mm and accepts h:mm back, so
     the test needs a row that really exists. */
  var hr = st + 2 * 16;
  "khTC".split("").forEach(function (c, i) { b[hr + i] = c.charCodeAt(0); });
  b[hr + 8] = 0x00;                        // float
  dv.setUint32(hr + 12, 0x3FE00000);       // 1.75 horas = 1:45

  /* ghTC: play hours from the Statistics screen, also float and h:mm. */
  var gh = st + 3 * 16;
  "ghTC".split("").forEach(function (c, i) { b[gh + i] = c.charCodeAt(0); });
  b[gh + 8] = 0x00;                        // float
  dv.setUint32(gh + 12, 0x3FE00000);       // 1.75 horas = 1:45

  return { buf: buf, at: at };
}

// ---------- minimal DOM ----------
// addEventListener stores the listener in _on so the test can fire it.

function noop() {}

/* createElement/appendChild keep what the page builds, and getElementById
   finds by id: fields born in JS (the Career record) must be reachable by the
   test the same way the HTML ones are. */
var MADE = [];

function makeEl(id) {
  var e = {
    id: id, value: "", textContent: "", hidden: false,
    className: "", checked: false, dataset: {}, style: {}, files: [], children: [],
    _on: {},
    classList: {
      add: noop, remove: noop, toggle: noop,
      /* contains is real: setTab uses it to know if the column still has a panel. */
      contains: function (c) { return e.className.split(/\s+/).indexOf(c) !== -1; }
    },
    addEventListener: function (type, fn) { e._on[type] = fn; },
    removeEventListener: noop,
    appendChild: function (c) { e.children.push(c); MADE.push(c); return c; },
    removeChild: noop, remove: noop,
    setAttribute: function (k, v) { e.dataset[k] = v; },
    removeAttribute: noop, focus: noop, blur: noop,
    click: noop, scrollIntoView: noop,
    getAttribute: function (k) { return e.dataset[k] !== undefined ? e.dataset[k] : null; },
    closest: function () { return e; },
    querySelector: function () { return makeEl("x"); },
    querySelectorAll: function (sel) { return group(sel); },
    /* The new panel measures positions for the tab slider; zero is enough. */
    getBoundingClientRect: function () { return { left: 0, top: 0, width: 0, height: 0, right: 0, bottom: 0 }; },
    style: {
      setProperty: function () {}, removeProperty: noop,
      getPropertyValue: function () { return ""; }
    }
  };
  /* innerHTML = "" clears the children, as in a real DOM: drawStats rewrites
     the list on every key and the test counts children to see what is left. */
  var html = "";
  Object.defineProperty(e, "innerHTML", {
    get: function () { return html; },
    set: function (v) { html = v; if (v === "") e.children.length = 0; }
  });
  return e;
}

/* The garage rows are born from innerHTML, which this shim does not parse, so
   we build the same rows the page would and return them from
   querySelectorAll. The real addEventListener calls from index.html then land
   on elements the test can trigger later. */

var SLOTS = 0, CELLS = 0, rows = null, cells = null;

function buildRow(i) {
  var sel = makeEl("sel" + i), lbl = makeEl("lbl" + i), plate = makeEl("plate" + i);
  var tune = makeEl("tune" + i);
  var row = makeEl("row" + i);
  sel.dataset.slot = String(i);
  lbl.dataset.label = String(i);
  plate.dataset.plate = String(i);
  tune.dataset.tune = String(i);
  row.tune = tune;
  row.querySelector = function (s) { return s === "select" ? sel : s === "input.plate" ? plate : lbl; };
  sel.closest = lbl.closest = plate.closest = function () { return row; };
  return { row: row, sel: sel, lbl: lbl, plate: plate, tune: tune };
}

function buildCell(i) {
  var c = makeEl("cell" + i);
  c.dataset.prog = String(i);
  c.closest = function () { return c; };
  return c;
}

/* Built on purpose, not on the first call: applyLang() runs as soon as the
   script loads and already calls querySelectorAll, before we know how many
   slots the save has. */
function buildGroups() {
  rows = []; for (var i = 0; i < SLOTS; i++) rows.push(buildRow(i));
  cells = []; for (var k = 0; k < CELLS; k++) cells.push(buildCell(k));
}

function group(sel) {
  if (!rows) return [];
  if (sel === "select") return rows.map(function (r) { return r.sel; });
  if (sel === "input.lbl") return rows.map(function (r) { return r.lbl; });
  if (sel === "input.plate") return rows.map(function (r) { return r.plate; });
  if (sel === "button.tune") return rows.map(function (r) { return r.tune; });
  if (sel === ".cell") return cells;
  /* The new panel has tabs, filters and wallet buttons; the test does not use
     them, but the script calls querySelectorAll on each at load. */
  return [];
}

function makeDom() {
  var byId = {};
  var doc = {
    getElementById: function (id) {
      if (!byId[id]) {
        for (var i = 0; i < MADE.length; i++) if (MADE[i].id === id) { byId[id] = MADE[i]; break; }
      }
      if (!byId[id]) byId[id] = makeEl(id);
      return byId[id];
    },
    createElement: function () { return makeEl("created"); },
    querySelectorAll: function (sel) { return group(sel); },
    querySelector: function () { return makeEl("x"); },
    addEventListener: noop,
    documentElement: makeEl("html"),
    body: makeEl("body"),
    /* The new panel expects fonts ready and a window that resizes. */
    fonts: { ready: { then: function () {} } },
    activeElement: makeEl("active")
  };
  return { doc: doc, byId: byId };
}

// ---------- montar o contexto ----------

/* index.html loads the src/ files in the order they appear; the test reads
   the same <script src> list, to run exactly what the page runs. */
var html = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");
var srcs = [];
var re = /<script src="([^"]+)"><\/script>/g;
var m;
while ((m = re.exec(html))) srcs.push(m[1]);
assert.ok(srcs.length >= 10, "index.html nao carrega os scripts de src/");

var script = srcs.map(function (rel) {
  return fs.readFileSync(path.join(ROOT, rel), "utf8");
}).join("\n;\n");
assert.ok(script.length > 1000, "os scripts de src/ vieram vazios");

var dom = makeDom();
var ctx = {
  document: dom.doc,
  navigator: { language: "pt-BR" },
  localStorage: { getItem: function () { return null; }, setItem: noop },
  URL: { createObjectURL: function () { return "blob:x"; }, revokeObjectURL: noop },
  Blob: function () {},
  FileReader: function () {},
  setTimeout: noop,
  /* The new panel listens for resize and asks for a frame to measure tabs. */
  requestAnimationFrame: noop,
  addEventListener: noop,
  removeEventListener: noop,
  console: console
};
ctx.window = ctx;
vm.createContext(ctx);
vm.runInContext(script, ctx, { filename: "src/" });

/* With no argument it runs on the synthetic save. Given a path, it runs on
   your real mc4.sav. The file is only read, never written. */
var real = process.argv[2];
var save;
if (real) {
  var raw = fs.readFileSync(real);
  save = { buf: raw.buffer.slice(raw.byteOffset, raw.byteOffset + raw.byteLength) };
} else {
  save = buildSave();
}

ctx.bytes = new Uint8Array(save.buf);
ctx.view = new DataView(save.buf);
ctx.secs = ctx.parse(save.buf);
assert.ok(ctx.secs.valid, "o save tem que passar no parse");

var careerAt = ctx.secs.list.filter(function (s) { return s.name === "Career"; })[0].data;
var sizeBefore = ctx.bytes.length;

SLOTS = ctx.slotCount();
CELLS = ctx.progTotal();
assert.ok(SLOTS >= 2, "preciso de pelo menos dois slots pra testar");
assert.ok(CELLS >= 10, "preciso de blocos de progressao pra testar");
buildGroups();

ctx.render();

/* The target table base is found by pattern (0x727D in a short save, 0x7291
   with more events), so the test asks the editor. */
var ttAt = careerAt + ctx.ttBase();

// ---------- carteira ----------

var rep = dom.byId.rep, money = dom.byId.money;

assert.strictEqual(typeof rep.oninput, "function",
  "render() terminou sem ligar o campo de reputacao: alguma excecao no meio");
assert.strictEqual(typeof money.oninput, "function",
  "render() terminou sem ligar o campo de dinheiro: alguma excecao no meio");

/* The wallet fields come out formatted: "$1.234" and "2.050". The test
   strips non-digits before comparing. */
function plainNum(str) { return Number(String(str).replace(/\D+/g, "")); }

if (!real) {
  assert.strictEqual(plainNum(rep.value), 2050, "a rep lida do save esta errada");
  assert.strictEqual(plainNum(money.value), 1234, "o dinheiro lido do save esta errado");
  assert.ok(money.value.indexOf("$") === 0, "o dinheiro nao comeca com $");
}

rep.value = "4242";
rep.oninput.call(rep);
/* The separator depends on the language (pt-BR uses a dot), so one is enough. */
assert.ok(/[^0-9]/.test(rep.value), "a rep nao foi formatada com separador");
assert.strictEqual(ctx.view.getUint32(careerAt + 0x2E1), 4242,
  "digitar na reputacao nao gravou nos bytes");

money.value = "999999";
money.oninput.call(money);
assert.strictEqual(ctx.view.getUint32(careerAt + 0x2D9), 999999,
  "digitar no dinheiro nao gravou nos bytes");

// ---------- tuning vendor ----------
// The vendor byte lives at tuneBase+0x6E and the multiplier at tuneBase+0x27.
// Only the Escape (category 0) has a table; the other categories have no
// dropdown.
{
  var t0 = ctx.tuneAt(0);
  assert.strictEqual(typeof ctx.tuneVendorAt, "function",
    "o editor nao tem leitura de fornecedor");
  /* In the synthetic save the byte is zero; a real save carries what the
     game wrote (the HKS test set has 7). */
  if (!real) {
    assert.strictEqual(ctx.tuneVendorAt(0, 0), 0,
      "o fornecedor do save sintetico nao comeca em zero");
  }

  ctx.tuneVendorSet(0, 0, 2);
  assert.strictEqual(ctx.bytes[t0 + ctx.OFF.tuneVendor], 2,
    "o indice do fornecedor nao foi gravado em +0x6E");
  /* Float32 does not hold 1.4018 exactly; compare with a tolerance. */
  assert.ok(Math.abs(ctx.f32(t0 + ctx.OFF.tuneVendorF) - ctx.TUNE_VENDORS[0].floats[2]) < 1e-4,
    "o multiplicador nao foi gravado em +0x27");

  // null = no part: byte zero and the factory float, not vendor 0's
  ctx.tuneVendorSet(0, 0, null);
  assert.strictEqual(ctx.bytes[t0 + ctx.OFF.tuneVendor], 0,
    "stock nao zerou o byte do fornecedor");
  assert.ok(Math.abs(ctx.f32(t0 + ctx.OFF.tuneVendorF) - ctx.TUNE_VENDORS[0].stock) < 1e-4,
    "stock nao devolveu o multiplicador de fabrica");

  // a category with no table takes the byte but leaves the float alone
  ctx.tuneVendorSet(0, 1, 5);
  assert.strictEqual(ctx.bytes[t0 + ctx.OFF.tuneVendor + 1], 5,
    "categoria sem tabela nao gravou o byte");
}

// ---------- stats ----------
// ghTC and ghTP come out as h:mm; the rest stay numbers. The conversion is
// the same as the career panel, so the two screens never disagree.

assert.ok(ctx.STATS.length >= 2, "renderStats nao achou os registros");
assert.notStrictEqual(dom.byId.roRep.textContent, "", "o rodape nao foi preenchido");

var ghTC = ctx.STATS.filter(function (r) { return r.key === "ghTC"; })[0];
assert.ok(ghTC && ghTC.isHours, "ghTC nao foi marcado como horas");
assert.strictEqual(ctx.statRead(ghTC), ctx.hoursToText(ctx.view.getFloat32(ghTC.at + 12)),
  "ghTC nao leu em h:mm");

var ghTCInput = dom.doc.getElementById("stats").children
  .filter(function (row) { return row.children[1].textContent === "ghTC"; })[0].children[4];
ghTCInput.value = "2:5";
ghTCInput._on.input.call(ghTCInput);
ghTCInput._on.blur.call(ghTCInput);
assert.strictEqual(ghTCInput.value, "2:05", "sair do campo nao normalizou 2:5 em 2:05");

// ---------- names and search ----------
// STAT_NAMES comes from the repository; the test checks it matches the
// synthetic save (gWIN, tPUR) and that search hits both sides.

assert.strictEqual(typeof ctx.statName({ key: "gWIN" }), "string", "statName nao existe");
assert.strictEqual(ctx.statName({ key: "gWIN" }), "Total Numbers of Wins",
  "o nome de gWIN nao esta na tabela");
assert.strictEqual(ctx.statName({ key: "tPUR" }), "",
  "um codigo sem nome inventou um nome");

var statRows = dom.doc.getElementById("stats").children;
assert.ok(statRows.length >= 2, "drawStats nao montou as linhas");
var first = statRows[0];
/* cursor, code, name, type, field: the HUD arrow counts as a column. */
assert.ok(first.children.length === 5,
  "a linha do stat nao tem cursor, codigo, nome, tipo e campo: " + first.children.length);
assert.strictEqual(first.children[0].className, "cursor",
  "a linha nao comeca pelo cursor do HUD");
/* drawStats now shows only the Game Stats screen: the row is the first g*
   record, not the section's first record (aB1T, which is an achievement). */
assert.strictEqual(first.children[1].textContent, ctx.GAME_KEYS[0].key,
  "o codigo da linha nao e o do primeiro registro de jogo");
assert.strictEqual(first.children[2].textContent, ctx.statName(ctx.GAME_KEYS[0]),
  "o nome em jogo nao apareceu na linha");

// search by code and by name find the same row
var filter = dom.doc.getElementById("statFilter");
filter.value = "gwin";
filter.oninput.call(filter);
assert.ok(dom.doc.getElementById("stats").children.length >= 1,
  "buscar pelo codigo nao achou nada");
filter.value = "numbers of wins";
filter.oninput.call(filter);
assert.ok(dom.doc.getElementById("stats").children.length >= 1,
  "buscar pelo nome em jogo nao achou nada");
filter.value = "zzz";
filter.oninput.call(filter);
assert.strictEqual(dom.doc.getElementById("stats").children.length, 0,
  "busca sem resultado deveria esvaziar a lista");
filter.value = "";
filter.oninput.call(filter);

// ---------- garage: swap the vehicle ----------

function str(at, n) {
  var s = ""; for (var i = 0; i < n; i++) s += String.fromCharCode(ctx.bytes[at + i]);
  return s;
}

var r1 = rows[1];
assert.strictEqual(typeof r1.sel._on.change, "function", "o select do slot nao foi ligado");

r1.sel.value = "vp_aud_rs4_07";
r1.sel._on.change.call(r1.sel);

var slot1 = ctx.slotAt(1);
assert.strictEqual(str(slot1, 13), "vp_aud_rs4_07", "o nome do prefab nao foi gravado");
assert.strictEqual(ctx.bytes[slot1 + 13], 0, "faltou o terminador depois do nome");
assert.strictEqual(ctx.bytes[slot1 + 14], 0xCD, "o preenchimento depois do nome nao e 0xCD");
assert.ok(r1.lbl.value.length > 0, "o rotulo automatico nao foi preenchido");

// the appearance (wheels and details) must come from the stock preset, or
// the new car inherits the wheels and kit of the previous slot occupant
var APPEAR = [446, 450, 454, 458, 1734, 1782, 1830, 1878, 1926, 1974, 2177, 2178];
var preset = ctx.STOCK_APPEARANCE["vp_aud_rs4_07"];
assert.ok(preset, "a tabela STOCK_APPEARANCE nao carregou");
{
  for (var ai = 0; ai < APPEAR.length; ai++) {
    assert.strictEqual(ctx.bytes[slot1 + APPEAR[ai]], preset[ai],
      "a aparencia nao foi gravada em +" + APPEAR[ai]);
  }
}

/* Before emptying, dirty the appearance on purpose: the real case of a tuned
   car. Emptying must return the stock, not just erase the name. */
var dirty = [11, 22, 33, 44, 55, 66, 77, 88, 99, 111, 222, 233];
for (var di = 0; di < APPEAR.length; di++) ctx.bytes[slot1 + APPEAR[di]] = dirty[di];

// emptying back writes "blank", which is what the game puts in an empty slot
r1.sel.value = "";
r1.sel._on.change.call(r1.sel);
assert.strictEqual(str(slot1, 5), "blank", "esvaziar o slot nao gravou blank");

/* The appearance returns to the stock of the car that left (vp_aud_rs4_07),
   along with the name. Without this the tuned wheels and kit stay in the
   slot. */
for (var ai2 = 0; ai2 < APPEAR.length; ai2++) {
  assert.strictEqual(ctx.bytes[slot1 + APPEAR[ai2]], preset[ai2],
    "esvaziar nao devolveu a aparencia de stock em +" + APPEAR[ai2]);
}

// and it must clear the tune too: or the next car inherits the level
var t1 = ctx.tuneAt(1);
for (var ti2 = 0; ti2 < ctx.OFF.tuneN; ti2++) {
  assert.strictEqual(ctx.bytes[t1 + ctx.OFF.tuneLv + ti2], 0,
    "o slot vazio ficou com nivel de tune em +%d" % (ctx.OFF.tuneLv + ti2));
}
assert.strictEqual(ctx.bytes[t1 + ctx.OFF.tunePct], 0,
  "o slot vazio ficou com a porcentagem de tune");

// ---------- garagem: rotulo ----------

assert.strictEqual(typeof r1.lbl._on.input, "function", "o campo de rotulo nao foi ligado");
r1.lbl.value = "MEU R8";
r1.lbl._on.input.call(r1.lbl);
assert.strictEqual(str(slot1 + OFF_LABEL, 6), "MEU R8", "o rotulo nao foi gravado");
assert.strictEqual(ctx.bytes[slot1 + OFF_LABEL + 6], 0, "faltou o terminador depois do rotulo");
assert.strictEqual(ctx.bytes[slot1 + OFF_LABEL + 7], 0xCD, "o preenchimento do rotulo nao e 0xCD");

// ---------- secoes hex: offsets conhecidos ----------

assert.ok(ctx.SECTION_NOTES, "a tabela SECTION_NOTES nao carregou");
var known = Object.keys(ctx.SECTION_NOTES);
/* File is the file header, the rest are real sections. */
assert.strictEqual(known.length, 4, "devia haver notas para 4 blocos");
assert.ok(ctx.SECTION_NOTES.Career.length > 0, "Career sem notas");
assert.ok(ctx.SECTION_NOTES.LocalOptions.length > 0, "LocalOptions sem notas");

// every group has a title, rows, and a translation; every `at` fits its section
Object.keys(ctx.SECTION_NOTES).forEach(function (name) {
  var sec = ctx.sec(name);
  if (name !== "File") assert.ok(sec, "a secao " + name + " nao existe no save");
  ctx.SECTION_NOTES[name].forEach(function (g) {
    assert.ok(typeof ctx.t(g.k) === "string" && ctx.t(g.k).length > 0,
      "a traducao do grupo " + g.k + " nao existe");
    assert.ok(Array.isArray(g.rows) && g.rows.length > 0, "grupo " + g.k + " sem linhas");
    g.rows.forEach(function (n) {
      if (n.text) {   // prose, not an offset
        assert.ok(typeof ctx.t(n.k) === "string" && ctx.t(n.k).length > 0,
          "a traducao " + n.k + " nao existe");
        return;
      }
      if (n.sub) return;   // a field inside the block above, no base of its own
      assert.ok(Number.isInteger(n.at) && n.at >= 0, name + ": offset ruim " + n.at);
      if (sec) assert.ok(n.at < sec.size, name + ": offset fora da secao " + n.at);
      assert.ok(typeof ctx.t(n.k) === "string" && ctx.t(n.k).length > 0,
        "a traducao " + n.k + " nao existe");
    });
  });
});

// ---------- garage: plate ----------
// The plate takes exactly 7 bytes. The byte right after belongs to something
// else and must not be touched, so we mark it with a sentinel and check it
// survived.

assert.strictEqual(typeof r1.plate._on.input, "function", "o campo de placa nao foi ligado");
var plateAt = slot1 - SLOT_STRIDE + OFF_PLATE;
ctx.bytes[plateAt + 7] = 0x5A;

r1.plate.value = "xyz9876";
r1.plate._on.input.call(r1.plate);
assert.strictEqual(r1.plate.value, "XYZ9876", "a placa nao foi passada pra maiuscula");
assert.strictEqual(str(plateAt, 7), "XYZ9876", "a placa nao foi gravada");
assert.strictEqual(ctx.bytes[plateAt + 7], 0x5A, "a placa invadiu o byte seguinte");

// space is written as 0x3E (">"), not 0x20: that is what the game uses
r1.plate.value = "WRS 521";
r1.plate._on.input.call(r1.plate);
assert.strictEqual(ctx.bytes[plateAt + 3], 0x3E, "o espaco nao foi gravado como 0x3E");
assert.strictEqual(str(plateAt, 7), "WRS>521", "a placa nao saiu com o byte do jogo");
assert.strictEqual(ctx.bytes[plateAt + 7], 0x5A, "a placa com espaco invadiu o byte seguinte");

// an incomplete plate cannot write anything
r1.plate.value = "AB1";
r1.plate._on.input.call(r1.plate);
assert.strictEqual(str(plateAt, 7), "WRS>521", "placa de menos de 7 caracteres gravou mesmo assim");

// an invalid character is dropped, not written
r1.plate.value = "ab-12/34";
r1.plate._on.input.call(r1.plate);
assert.strictEqual(r1.plate.value, "AB1234", "os caracteres invalidos nao foram filtrados");
assert.strictEqual(str(plateAt, 7), "WRS>521", "a placa filtrada ficou curta e gravou assim mesmo");

// ---------- performance ----------
// 13 categories of 0 to 2 (car) or 6 (moto), and the percent the shop shows
// is the sum over 2*(n-1): the LAST category does not count. All 2 in a car
// reads 100; 11 at 2 with the brakes at stock reads 45.

var loAt = ctx.secs.list.filter(function (s) { return s.name === "LocalOptions"; })[0].data;
function tuneBlock(n) { return loAt + TUNE_BASE + n * SLOT_STRIDE; }

var r0 = rows[0];
assert.strictEqual(typeof r0.tune._on.click, "function", "o botao de tune nao foi ligado");
if (!real) {
  assert.strictEqual(r0.tune.textContent, "50%", "o botao nao mostrou a porcentagem lida do save");
}

/* The tune button opens the Performance Shop; what actually maxes is
   maxTune, which the shop calls. So the test maxes via maxTune and checks
   the button. */
var t0 = tuneBlock(0);
ctx.maxTune(0);
/* The save may have a moto in slot 0: 6 categories at scattered indexes
   (0,4,5,6,8,12), not the 13 in a row of a car. The test uses the same list
   the page uses instead of counting 0 to 13. */
var cats0 = ctx.tuneCatIdx(ctx.readSlot(0).car);
cats0.forEach(function (c) {
  assert.strictEqual(ctx.bytes[t0 + TUNE_LV + c], 2, "categoria " + c + " nao foi para o nivel 2");
});
assert.strictEqual(ctx.bytes[t0 + TUNE_PCT], 100, "a porcentagem nao foi para 100");

// the next block must not be touched: one stride ahead, byte by byte
var t1 = tuneBlock(1);
assert.notStrictEqual(t1, t0, "os blocos de tune colidiram");
assert.strictEqual(ctx.bytes[t0 + TUNE_LV + TUNE_N], 0,
  "escreveu um byte alem das 13 categorias");

// max everything
dom.byId.maxAll.onclick();
for (var s2 = 0; s2 < SLOTS; s2++) {
  var nome = "";
  var so = loAt + SLOT0 + s2 * SLOT_STRIDE;
  for (var q = 0; q < 32; q++) { var ch = ctx.bytes[so + q]; if (!ch || ch === 0xCD) break; nome += String.fromCharCode(ch); }
  if (!nome || nome === "blank") continue;
  assert.strictEqual(ctx.bytes[tuneBlock(s2) + TUNE_PCT], 100,
      "tunar todos deixou o slot " + s2 + " de fora");
  }

  // ---------- performance: a moto has 6 categories ----------
  // The test save has only cars, so slot 1 becomes a moto and the list must
  // shrink to the right six categories and the formula use /10.

  if (!real) {
    var m1 = rows[1];
    m1.sel.value = "vp_duc_monster_s4r_07";
    m1.sel._on.change.call(m1.sel);

    var info = ctx.tuneInfo(1);
    assert.strictEqual(info.moto, true, "a moto nao foi reconhecida como moto");
    assert.strictEqual(info.cats.length, 6, "a moto ficou com " + info.cats.length + " categorias");
    assert.strictEqual(info.cats.map(function (c) { return c.idx; }).join(","), "0,4,5,6,8,12",
      "as categorias da moto nao sao as seis certas");
    assert.strictEqual(info.cats[2].name, "Jet Kits",
      "a categoria 5 da moto nao virou Jet Kits");

    // three categories at 1 (level 2) -> floor(3*100/10) = 30
    [0, 4, 5].forEach(function (ci) { ctx.tuneSet(1, ci, 2); });
    assert.strictEqual(ctx.tuneInfo(1).pct, 30, "a moto com 3 categorias nao marcou 30%");
    assert.strictEqual(ctx.bytes[tuneBlock(1) + TUNE_PCT], 30,
      "a porcentagem da moto nao chegou ao byte +126");

    // maxTune on a moto writes only the six categories, never the other seven
    ctx.maxTune(1);
    var tM = tuneBlock(1);
    [1, 2, 3, 7, 9, 10, 11].forEach(function (ci) {
      assert.strictEqual(ctx.bytes[tM + TUNE_LV + ci], 0,
        "maxTune escreveu a categoria " + ci + ", que a moto nao tem");
    });
    assert.strictEqual(ctx.bytes[tM + TUNE_PCT], 100, "a moto tunada nao marcou 100%");
  }

// ---------- progression ----------

var prog = dom.byId.prog;
assert.strictEqual(typeof prog.onclick, "function", "a grade de progressao nao foi ligada");

var cell = cells[5], at5 = ctx.progAt(5), was = ctx.bytes[at5];
prog.onclick({ target: cell });
assert.notStrictEqual(ctx.bytes[at5], was, "clicar no bloco de progressao nao mudou o flag");
prog.onclick({ target: cell });
assert.strictEqual(ctx.bytes[at5], was, "clicar de novo nao voltou o flag");

dom.byId.progAll.onclick();
for (var i = 0; i < CELLS; i++) {
  assert.strictEqual(ctx.bytes[ctx.progAt(i)], 1, "marcar tudo deixou o bloco " + i + " de fora");
}
dom.byId.progNone.onclick();
for (var j = 0; j < CELLS; j++) {
  assert.strictEqual(ctx.bytes[ctx.progAt(j)], 0, "limpar tudo deixou o bloco " + j + " marcado");
}

// ---------- time trial e career ----------

var statsAt = ctx.secs.list.filter(function (s) { return s.name === "Stats"; })[0].data;

// the Career fields are born in JS, so the test grabs them by id
var ttTarget = dom.doc.getElementById("ttTarget");
var careerRecord = dom.doc.getElementById("careerRecord");

assert.strictEqual(typeof ttTarget._on.input, "function",
  "render() terminou sem ligar o campo de tempo alvo");
assert.strictEqual(typeof careerRecord._on.input, "function",
  "render() terminou sem ligar o campo de recorde");

if (!real) {
  /* 128540 ms = 02:08.54, the first target in the synthetic save table. */
  assert.strictEqual(ttTarget.value, "02:08.54",
    "o alvo lido do save sintetico esta errado");
  /* The synthetic save has no stats table, so the record stays empty: there
     is no k:TB row to read. */
  assert.strictEqual(careerRecord.value, "",
    "o recorde devia estar vazio sem a tabela de Stats");
}

// 02:08.54 = 128540 ms, the reference save's time
ttTarget.value = "02:08.54";
ttTarget._on.input.call(ttTarget);
assert.strictEqual(ctx.view.getUint32(ttAt), 128540,
  "digitar no alvo nao gravou na tabela de Career");
/* The target lives only in Career: Stats+0x578 is gWIP (total wipeouts) and
   must not be touched, or the wipeout stat goes with it. The real save holds
   180 there; what matters is that it does not become 128540. */
assert.notStrictEqual(ctx.view.getUint32(statsAt + 0x578), 128540,
  "o alvo invadiu Stats+0x578, que e gWIP");

// the table's next target must not be touched (0 in the synthetic save)
if (!real) {
  /* The synthetic save table has 4 targets; writing the first must not move
     the second (150000). */
  assert.strictEqual(ctx.view.getUint32(ttAt + 4), 150000,
    "o alvo invadiu a entrada seguinte da tabela");
}

// an invalid format does not write
ttTarget.value = "2:99";
ttTarget._on.input.call(ttTarget);
assert.strictEqual(ctx.view.getUint32(ttAt), 128540,
  "um tempo impossivel foi gravado mesmo assim");

// the record is a k:TB row like the other four
if (real) {
  var tb0 = ctx.statValueAt("k:TB", 0);
  careerRecord.value = "04:15.32";
  careerRecord._on.input.call(careerRecord);
  assert.strictEqual(ctx.view.getUint32(tb0), 255320,
    "o campo de recorde nao gravou na primeira linha k:TB");
  assert.strictEqual(ctx.view.getUint32(ttAt), 128540,
    "mudar so o recorde mexeu no alvo da missao");
}

// ---------- play hours (h:mm) ----------
// khTC holds fractional hours; the screen shows h:mm and accepts h:mm back.

assert.strictEqual(ctx.hoursToText(1.9862), "1:59", "1.9862 horas nao virou 1:59");
assert.strictEqual(ctx.hoursToText(2.5), "2:30", "2.5 horas nao virou 2:30");
assert.strictEqual(ctx.textToHours("2:30"), 2.5, "2:30 nao virou 2.5 horas");
assert.strictEqual(ctx.textToHours("2:5"), 2 + 5 / 60, "2:5 nao virou 2:05");
assert.strictEqual(ctx.textToHours("2:99"), null, "minuto 99 foi aceito");
assert.strictEqual(ctx.textToHours("abc"), null, "texto foi aceito como horas");

// the field exists, reads the save value and writes it back
var hoursInput = dom.doc.getElementById("careerHours");
assert.ok(hoursInput, "o campo de horas nao foi montado");
assert.ok(hoursInput._on.input, "o campo de horas nao foi ligado");
assert.ok(hoursInput._on.blur, "o campo de horas nao normaliza ao sair");

hoursInput.value = "2:5";
hoursInput._on.input.call(hoursInput);
hoursInput._on.blur.call(hoursInput);
assert.strictEqual(hoursInput.value, "2:05",
  "sair do campo nao normalizou 2:5 em 2:05");

// garbage does not write: the save value stays the same
var hoursAt = ctx.statValueAt("khTC");
var hoursBefore = ctx.view.getFloat32(hoursAt);
hoursInput.value = "abc";
hoursInput._on.input.call(hoursInput);
assert.strictEqual(ctx.view.getFloat32(hoursAt), hoursBefore,
  "texto invalido mudou as horas no save");

// ---------- the file must survive all of this ----------

var after = ctx.parse(ctx.bytes.buffer);
assert.ok(after.valid, "o save ficou invalido depois das edicoes");
assert.strictEqual(ctx.bytes.length, sizeBefore, "o tamanho do arquivo mudou");

console.log("ok - " + (real ? "save real" : "save sintetico") + ": " +
  SLOTS + " slots, " + CELLS + " blocos, " + ctx.STATS.length + " stats. " +
  "Carteira, veiculo, rotulo, placa, desempenho, progressao, alvo e recorde gravam; o save segue valido.");
