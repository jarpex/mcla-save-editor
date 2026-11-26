/* Roda o script de dentro do index.html contra um save sintetico e confere que
   render() liga os campos editaveis e que cada um grava onde deve.

   Existe por causa de um bug real: `var t = bytes[o + 8]` dentro de renderStats
   sombreava a funcao t() de traducao, render() estourava na metade, e os
   oninput do dinheiro e da reputacao nunca eram ligados. A tela parecia certa,
   os campos aceitavam digitacao, e nada era gravado. Qualquer excecao no meio
   do render() reproduz essa classe de falha, entao o teste cobre a classe toda,
   nao so aquela linha.

   node tests/render.test.js
   node tests/render.test.js C:\caminho\para\mc4.sav */

var fs = require("fs");
var path = require("path");
var vm = require("vm");
var assert = require("assert");

var ROOT = path.join(__dirname, "..");

var OFF_LABEL = 32, OFF_PLATE = 2186, SLOT_STRIDE = 8176, SLOT0 = 0x24FD;
var TUNE_BASE = 1293, TUNE_LV = 95, TUNE_N = 13, TUNE_PCT = 126;

// ---------- save sintetico ----------
// Mesmo formato do real, pequeno. Nenhum dado do jogo entra no repositorio.

var CAREER = 30000;       // cobre a progressao (0x2E9 + 43*65) e a tabela de alvos (0x727D)
var LOCAL = SLOT0 + SLOT_STRIDE * 2;
var STATS = 2048;         // cobre os recordes de time trial (0x6A8)

function buildSave() {
  var secs = [
    { name: "Stats", flag: 1, size: STATS },
    { name: "LocalOptions", flag: 9, size: LOCAL },
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
  b[at.LocalOptions + 0x53F] = 1;          // contador de carros
  b[at.LocalOptions + 0x543] = 0;

  // bloco de tune do carro 0: meio tunado, pra a leitura ter o que mostrar
  var t0 = at.LocalOptions + TUNE_BASE;
  for (var k = 0; k < TUNE_N; k++) b[t0 + TUNE_LV + k] = 1;
  b[t0 + TUNE_PCT] = 50;

  // slot 0 ocupado, pra ter o que ler na abertura
  var s0 = at.LocalOptions + SLOT0;
  "vp_vw_golf_83".split("").forEach(function (c, i) { b[s0 + i] = c.charCodeAt(0); });
  "83 GOLF/GTI".split("").forEach(function (c, i) { b[s0 + OFF_LABEL + i] = c.charCodeAt(0); });
  // a placa do slot N mora no stride anterior (slotAt(N) - STRIDE + OFF_PLATE),
  // entao a do slot 1 cai em s0 + OFF_PLATE: e o que a abertura le.
  "RSTLESS".split("").forEach(function (c, i) { b[s0 + OFF_PLATE + i] = c.charCodeAt(0); });

  // dois registros de stat, no offset absoluto onde offset % 16 == 2
  var st = at.Stats + (((2 - (at.Stats % 16)) % 16) + 16) % 16;
  ["gWIN", "tPUR"].forEach(function (key, n) {
    var r = st + n * 16;
    for (var i = 0; i < 4; i++) b[r + i] = key.charCodeAt(i);
    b[r + 8] = 0x2C;                       // inteiro, nao float
    dv.setUint32(r + 12, 7 + n);
  });

  /* khTC: horas de jogo, float. A tela mostra h:mm e aceita h:mm de volta,
     entao o teste precisa de uma linha que exista de verdade. */
  var hr = st + 2 * 16;
  "khTC".split("").forEach(function (c, i) { b[hr + i] = c.charCodeAt(0); });
  b[hr + 8] = 0x00;                        // float
  dv.setUint32(hr + 12, 0x3FE00000);       // 1.75 horas = 1:45

  /* ghTC: horas de jogo da tela Statistics, tambem float e tambem h:mm. */
  var gh = st + 3 * 16;
  "ghTC".split("").forEach(function (c, i) { b[gh + i] = c.charCodeAt(0); });
  b[gh + 8] = 0x00;                        // float
  dv.setUint32(gh + 12, 0x3FE00000);       // 1.75 horas = 1:45

  return { buf: buf, at: at };
}

// ---------- DOM minimo ----------
// addEventListener guarda o listener em _on, pra o teste poder disparar.

function noop() {}

/* createElement/appendChild guardam o que a pagina monta, e getElementById acha
   por id: os campos que nascem em JS (o recorde do Career) precisam ser
   alcancaveis pelo teste do mesmo jeito que os do HTML. */
var MADE = [];

function makeEl(id) {
  var e = {
    id: id, value: "", textContent: "", hidden: false,
    className: "", checked: false, dataset: {}, style: {}, files: [], children: [],
    _on: {},
    classList: {
      add: noop, remove: noop, toggle: noop,
      /* contains e real: setTab usa pra saber se a coluna ainda tem painel. */
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
    /* O painel novo mede posicoes pro deslizador das abas; zero e suficiente. */
    getBoundingClientRect: function () { return { left: 0, top: 0, width: 0, height: 0, right: 0, bottom: 0 }; },
    style: {
      setProperty: function () {}, removeProperty: noop,
      getPropertyValue: function () { return ""; }
    }
  };
  /* innerHTML = "" limpa os filhos, como no DOM de verdade: drawStats reescreve
     a lista a cada tecla e o teste conta children pra saber o que sobrou. */
  var html = "";
  Object.defineProperty(e, "innerHTML", {
    get: function () { return html; },
    set: function (v) { html = v; if (v === "") e.children.length = 0; }
  });
  return e;
}

/* As linhas da garagem nascem de innerHTML, que este shim nao interpreta, entao
   nos fabricamos as mesmas linhas que a pagina criaria e devolvemos em
   querySelectorAll. Assim os addEventListener reais do index.html caem em
   elementos que o teste consegue acionar depois. */

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

/* Construido de proposito, nao na primeira chamada: applyLang() roda logo que o
   script carrega e ja chama querySelectorAll, quando ainda nao sabemos quantos
   slots o save tem. */
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
  /* O painel novo tem abas, filtros e botoes de carteira; o teste nao os usa,
     mas o script chama querySelectorAll em cada um ao carregar. */
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
    /* O painel novo espera fonts prontas e uma janela que redimensiona. */
    fonts: { ready: { then: function () {} } },
    activeElement: makeEl("active")
  };
  return { doc: doc, byId: byId };
}

// ---------- montar o contexto ----------

/* index.html so carrega os arquivos de src/ na ordem em que aparecem; o teste
   le a mesma lista de <script src>, pra rodar exatamente o que a pagina roda. */
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
  /* O painel novo escuta resize e pede um frame pra medir as abas. */
  requestAnimationFrame: noop,
  addEventListener: noop,
  removeEventListener: noop,
  console: console
};
ctx.window = ctx;
vm.createContext(ctx);
vm.runInContext(script, ctx, { filename: "src/" });

/* Sem argumento roda no save sintetico. Passando um caminho, roda no seu
   mc4.sav de verdade. O arquivo so e lido, nunca gravado. */
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

// ---------- carteira ----------

var rep = dom.byId.rep, money = dom.byId.money;

assert.strictEqual(typeof rep.oninput, "function",
  "render() terminou sem ligar o campo de reputacao: alguma excecao no meio");
assert.strictEqual(typeof money.oninput, "function",
  "render() terminou sem ligar o campo de dinheiro: alguma excecao no meio");

if (!real) {
  assert.strictEqual(Number(rep.value), 2050, "a rep lida do save esta errada");
  assert.strictEqual(Number(money.value), 1234, "o dinheiro lido do save esta errado");
}

rep.value = "4242";
rep.oninput.call(rep);
assert.strictEqual(ctx.view.getUint32(careerAt + 0x2E1), 4242,
  "digitar na reputacao nao gravou nos bytes");

money.value = "999999";
money.oninput.call(money);
assert.strictEqual(ctx.view.getUint32(careerAt + 0x2D9), 999999,
  "digitar no dinheiro nao gravou nos bytes");

// ---------- stats ----------
// ghTC e ghTP saem em h:mm; o resto continua numero. A conversao e a mesma do
// painel de carreira, entao as duas telas nunca divergem.

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

// ---------- nomes e busca ----------
// A tabela STAT_NAMES e do repositorio; o teste confere que ela casa com o save
// sintetico (gWIN, tPUR) e que a busca pega os dois lados.

assert.strictEqual(typeof ctx.statName({ key: "gWIN" }), "string", "statName nao existe");
assert.strictEqual(ctx.statName({ key: "gWIN" }), "Total Numbers of Wins",
  "o nome de gWIN nao esta na tabela");
assert.strictEqual(ctx.statName({ key: "tPUR" }), "",
  "um codigo sem nome inventou um nome");

var statRows = dom.doc.getElementById("stats").children;
assert.ok(statRows.length >= 2, "drawStats nao montou as linhas");
var first = statRows[0];
/* cursor, codigo, nome, tipo, campo: a seta do HUD conta como coluna. */
assert.ok(first.children.length === 5,
  "a linha do stat nao tem cursor, codigo, nome, tipo e campo: " + first.children.length);
assert.strictEqual(first.children[0].className, "cursor",
  "a linha nao comeca pelo cursor do HUD");
assert.strictEqual(first.children[1].textContent, ctx.STATS[0].key,
  "o codigo da linha nao e o do primeiro registro");
assert.strictEqual(first.children[2].textContent, ctx.statName(ctx.STATS[0]),
  "o nome em jogo nao apareceu na linha");

// busca por codigo e por nome acham a mesma linha
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

// ---------- garagem: trocar o veiculo ----------

function str(at, n) {
  var s = ""; for (var i = 0; i < n; i++) s += String.fromCharCode(ctx.bytes[at + i]);
  return s;
}

var r1 = rows[1];
assert.strictEqual(typeof r1.sel._on.change, "function", "o select do slot nao foi ligado");

r1.sel.value = "vp_aud_r8_08";
r1.sel._on.change.call(r1.sel);

var slot1 = ctx.slotAt(1);
assert.strictEqual(str(slot1, 12), "vp_aud_r8_08", "o nome do prefab nao foi gravado");
assert.strictEqual(ctx.bytes[slot1 + 12], 0, "faltou o terminador depois do nome");
assert.strictEqual(ctx.bytes[slot1 + 13], 0xCD, "o preenchimento depois do nome nao e 0xCD");
assert.ok(r1.lbl.value.length > 0, "o rotulo automatico nao foi preenchido");

// esvaziar de volta grava "blank", que e o que o jogo poe num slot vazio
r1.sel.value = "";
r1.sel._on.change.call(r1.sel);
assert.strictEqual(str(slot1, 5), "blank", "esvaziar o slot nao gravou blank");

// ---------- garagem: rotulo ----------

assert.strictEqual(typeof r1.lbl._on.input, "function", "o campo de rotulo nao foi ligado");
r1.lbl.value = "MEU R8";
r1.lbl._on.input.call(r1.lbl);
assert.strictEqual(str(slot1 + OFF_LABEL, 6), "MEU R8", "o rotulo nao foi gravado");
assert.strictEqual(ctx.bytes[slot1 + OFF_LABEL + 6], 0, "faltou o terminador depois do rotulo");
assert.strictEqual(ctx.bytes[slot1 + OFF_LABEL + 7], 0xCD, "o preenchimento do rotulo nao e 0xCD");

// ---------- garagem: placa ----------
// A placa ocupa 7 bytes exatos. O byte logo depois e de outra coisa e nao pode
// ser tocado, entao marcamos com uma sentinela e conferimos que sobreviveu.

assert.strictEqual(typeof r1.plate._on.input, "function", "o campo de placa nao foi ligado");
var plateAt = slot1 - SLOT_STRIDE + OFF_PLATE;
ctx.bytes[plateAt + 7] = 0x5A;

r1.plate.value = "xyz9876";
r1.plate._on.input.call(r1.plate);
assert.strictEqual(r1.plate.value, "XYZ9876", "a placa nao foi passada pra maiuscula");
assert.strictEqual(str(plateAt, 7), "XYZ9876", "a placa nao foi gravada");
assert.strictEqual(ctx.bytes[plateAt + 7], 0x5A, "a placa invadiu o byte seguinte");

// espaco e gravado como 0x3E (">"), nao 0x20: e o que a jogo usa
r1.plate.value = "WRS 521";
r1.plate._on.input.call(r1.plate);
assert.strictEqual(ctx.bytes[plateAt + 3], 0x3E, "o espaco nao foi gravado como 0x3E");
assert.strictEqual(str(plateAt, 7), "WRS>521", "a placa nao saiu com o byte do jogo");
assert.strictEqual(ctx.bytes[plateAt + 7], 0x5A, "a placa com espaco invadiu o byte seguinte");

// placa incompleta nao pode gravar nada
r1.plate.value = "AB1";
r1.plate._on.input.call(r1.plate);
assert.strictEqual(str(plateAt, 7), "WRS>521", "placa de menos de 7 caracteres gravou mesmo assim");

// caractere invalido e descartado, nao gravado
r1.plate.value = "ab-12/34";
r1.plate._on.input.call(r1.plate);
assert.strictEqual(r1.plate.value, "AB1234", "os caracteres invalidos nao foram filtrados");
assert.strictEqual(str(plateAt, 7), "WRS>521", "a placa filtrada ficou curta e gravou assim mesmo");

// ---------- desempenho ----------
// 13 categorias de 0 a 2 (carro) ou 6 (moto), e a porcentagem que a loja
// mostra e a soma sobre 2*(n-1): a ULTIMA categoria nao conta. Tudo em 2
// num carro marca 100; 11 em 2 com os freios no estoque marca 45.

var loAt = ctx.secs.list.filter(function (s) { return s.name === "LocalOptions"; })[0].data;
function tuneBlock(n) { return loAt + TUNE_BASE + n * SLOT_STRIDE; }

var r0 = rows[0];
assert.strictEqual(typeof r0.tune._on.click, "function", "o botao de tune nao foi ligado");
if (!real) {
  assert.strictEqual(r0.tune.textContent, "50%", "o botao nao mostrou a porcentagem lida do save");
}

/* O botao de tune abre a Performance Shop; quem maxe de fato e o maxTune,
   que a loja chama. Entao o teste maxe por maxTune e confere o botao. */
var t0 = tuneBlock(0);
ctx.maxTune(0);
for (var c = 0; c < TUNE_N; c++) {
  assert.strictEqual(ctx.bytes[t0 + TUNE_LV + c], 2, "categoria " + c + " nao foi para o nivel 2");
}
assert.strictEqual(ctx.bytes[t0 + TUNE_PCT], 100, "a porcentagem nao foi para 100");

// o bloco seguinte nao pode ser tocado: um stride adiante, byte a byte
var t1 = tuneBlock(1);
assert.notStrictEqual(t1, t0, "os blocos de tune colidiram");
assert.strictEqual(ctx.bytes[t0 + TUNE_LV + TUNE_N], 0,
  "escreveu um byte alem das 13 categorias");

// tunar todos
dom.byId.maxAll.onclick();
for (var s2 = 0; s2 < SLOTS; s2++) {
  var nome = "";
  var so = loAt + SLOT0 + s2 * SLOT_STRIDE;
  for (var q = 0; q < 32; q++) { var ch = ctx.bytes[so + q]; if (!ch || ch === 0xCD) break; nome += String.fromCharCode(ch); }
  if (!nome || nome === "blank") continue;
  assert.strictEqual(ctx.bytes[tuneBlock(s2) + TUNE_PCT], 100,
      "tunar todos deixou o slot " + s2 + " de fora");
  }

  // ---------- desempenho: moto tem 6 categorias ----------
  // O save de teste so tem carro, entao troco o slot 1 pra uma moto e confiro
  // que a lista encolheu pras seis categorias certas e que a formula usa /10.

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

    // tres categorias em 1 (nivel 2) -> floor(3*100/10) = 30
    [0, 4, 5].forEach(function (ci) { ctx.tuneSet(1, ci, 2); });
    assert.strictEqual(ctx.tuneInfo(1).pct, 30, "a moto com 3 categorias nao marcou 30%");
    assert.strictEqual(ctx.bytes[tuneBlock(1) + TUNE_PCT], 30,
      "a porcentagem da moto nao chegou ao byte +126");

    // maxTune numa moto escreve so nas seis categorias, nunca nas outras sete
    ctx.maxTune(1);
    var tM = tuneBlock(1);
    [1, 2, 3, 7, 9, 10, 11].forEach(function (ci) {
      assert.strictEqual(ctx.bytes[tM + TUNE_LV + ci], 0,
        "maxTune escreveu a categoria " + ci + ", que a moto nao tem");
    });
    assert.strictEqual(ctx.bytes[tM + TUNE_PCT], 100, "a moto tunada nao marcou 100%");
  }

// ---------- progressao ----------

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

// os campos do Career nascem em JS, entao o teste pega pelo id
var ttTarget = dom.doc.getElementById("ttTarget");
var careerRecord = dom.doc.getElementById("careerRecord");

assert.strictEqual(typeof ttTarget._on.input, "function",
  "render() terminou sem ligar o campo de tempo alvo");
assert.strictEqual(typeof careerRecord._on.input, "function",
  "render() terminou sem ligar o campo de recorde");

if (!real) {
  assert.strictEqual(ttTarget.value, "00:00.00",
    "o alvo lido do save sintetico esta errado");
  assert.strictEqual(careerRecord.value, "00:00.00",
    "o recorde lido do save sintetico esta errado");
}

// 02:08.54 = 128540 ms, o mesmo tempo do save de referencia
ttTarget.value = "02:08.54";
ttTarget._on.input.call(ttTarget);
assert.strictEqual(ctx.view.getUint32(careerAt + 0x727D), 128540,
  "digitar no alvo nao gravou na tabela de Career");
assert.strictEqual(ctx.view.getUint32(statsAt + 0x578), 128540,
  "digitar no alvo nao gravou o recorde em Stats");
assert.strictEqual(ctx.view.getUint32(statsAt + 0x6A8), 128540,
  "digitar no alvo nao gravou a copia do recorde");

// o alvo seguinte da tabela nao pode ser tocado (no save sintetico ele e 0)
if (!real) {
  assert.strictEqual(ctx.view.getUint32(careerAt + 0x7281), 0,
    "o alvo invadiu a entrada seguinte da tabela");
}

// formato invalido nao grava
ttTarget.value = "2:99";
ttTarget._on.input.call(ttTarget);
assert.strictEqual(ctx.view.getUint32(careerAt + 0x727D), 128540,
  "um tempo impossivel foi gravado mesmo assim");

// o recorde tem caminho proprio e escreve nas duas copias
careerRecord.value = "04:15.32";
careerRecord._on.input.call(careerRecord);
assert.strictEqual(ctx.view.getUint32(statsAt + 0x578), 255320,
  "o campo de recorde nao gravou em Stats+0x578");
assert.strictEqual(ctx.view.getUint32(statsAt + 0x6A8), 255320,
  "o campo de recorde nao gravou em Stats+0x6A8");
assert.strictEqual(ctx.view.getUint32(careerAt + 0x727D), 128540,
  "mudar so o recorde mexeu no alvo da missao");

// ---------- horas de jogo (h:mm) ----------
// khTC guarda horas fracionarias; a tela mostra h:mm e aceita h:mm de volta.

assert.strictEqual(ctx.hoursToText(1.9862), "1:59", "1.9862 horas nao virou 1:59");
assert.strictEqual(ctx.hoursToText(2.5), "2:30", "2.5 horas nao virou 2:30");
assert.strictEqual(ctx.textToHours("2:30"), 2.5, "2:30 nao virou 2.5 horas");
assert.strictEqual(ctx.textToHours("2:5"), 2 + 5 / 60, "2:5 nao virou 2:05");
assert.strictEqual(ctx.textToHours("2:99"), null, "minuto 99 foi aceito");
assert.strictEqual(ctx.textToHours("abc"), null, "texto foi aceito como horas");

// o campo existe, le o valor do save e grava de volta
var hoursInput = dom.doc.getElementById("careerHours");
assert.ok(hoursInput, "o campo de horas nao foi montado");
assert.ok(hoursInput._on.input, "o campo de horas nao foi ligado");
assert.ok(hoursInput._on.blur, "o campo de horas nao normaliza ao sair");

hoursInput.value = "2:5";
hoursInput._on.input.call(hoursInput);
hoursInput._on.blur.call(hoursInput);
assert.strictEqual(hoursInput.value, "2:05",
  "sair do campo nao normalizou 2:5 em 2:05");

// lixo nao grava: o valor do save continua o mesmo
var hoursAt = ctx.statValueAt("khTC");
var hoursBefore = ctx.view.getFloat32(hoursAt);
hoursInput.value = "abc";
hoursInput._on.input.call(hoursInput);
assert.strictEqual(ctx.view.getFloat32(hoursAt), hoursBefore,
  "texto invalido mudou as horas no save");

// ---------- o arquivo tem que sobreviver a tudo isso ----------

var after = ctx.parse(ctx.bytes.buffer);
assert.ok(after.valid, "o save ficou invalido depois das edicoes");
assert.strictEqual(ctx.bytes.length, sizeBefore, "o tamanho do arquivo mudou");

console.log("ok - " + (real ? "save real" : "save sintetico") + ": " +
  SLOTS + " slots, " + CELLS + " blocos, " + ctx.STATS.length + " stats. " +
  "Carteira, veiculo, rotulo, placa, desempenho, progressao, alvo e recorde gravam; o save segue valido.");
