"use strict";

const fs = require("node:fs");
const path = require("node:path");

class MockClassList {
  constructor(el) { this.el = el; this.set = new Set(); }
  _syncFromAttr(val) {
    this.set = new Set(String(val || "").split(/\s+/).filter(Boolean));
  }
  _syncToAttr() {
    this.el._attrs.class = [...this.set].join(" ");
  }
  add(...cls) { cls.forEach((c) => this.set.add(c)); this._syncToAttr(); }
  remove(...cls) { cls.forEach((c) => this.set.delete(c)); this._syncToAttr(); }
  toggle(c, force) {
    const has = this.set.has(c);
    const next = force !== undefined ? Boolean(force) : !has;
    if (next) this.set.add(c); else this.set.delete(c);
    this._syncToAttr();
    return next;
  }
  contains(c) { return this.set.has(c); }
}

function makeDataset(el) {
  return new Proxy({}, {
    get(_, prop) {
      const attr = "data-" + String(prop).replace(/[A-Z]/g, (m) => "-" + m.toLowerCase());
      return el._attrs[attr];
    },
    set(_, prop, val) {
      const attr = "data-" + String(prop).replace(/[A-Z]/g, (m) => "-" + m.toLowerCase());
      el._attrs[attr] = String(val);
      return true;
    }
  });
}

function matchesSelector(el, sel) {
  sel = sel.trim();
  if (!sel) return false;
  if (sel.startsWith(":scope > ")) sel = sel.slice(9).trim();
  if (sel.startsWith("#")) return el.id === sel.slice(1);
  const tagMatch = /^([a-z0-9]+)/i.exec(sel);
  let rest = sel;
  if (tagMatch) {
    if (el.tagName !== tagMatch[1].toUpperCase()) return false;
    rest = sel.slice(tagMatch[1].length);
  }
  const attrMatches = [...rest.matchAll(/\[([^\]=]+)(?:="([^"]*)")?\]/g)];
  for (const m of attrMatches) {
    const val = el.getAttribute(m[1]);
    if (m[2] !== undefined ? val !== m[2] : val == null) return false;
  }
  rest = rest.replace(/\[[^\]]+\]/g, "");
  const clsMatches = [...rest.matchAll(/\.([A-Za-z0-9_-]+)/g)];
  for (const m of clsMatches) {
    if (!el.classList.contains(m[1])) return false;
  }
  return true;
}

class MockElement {
  constructor(tagName = "div", id = "") {
    this.tagName = tagName.toUpperCase();
    this._attrs = {};
    this.classList = new MockClassList(this);
    this.dataset = makeDataset(this);
    this.style = { setProperty() {} };
    this.children = [];
    this.parentNode = null;
    this.listeners = {};
    this._value = "";
    this._checked = false;
    this._disabled = false;
    this._hidden = false;
    this._textContent = "";
    if (id) this.id = id;
  }

  get id() { return this._attrs.id || ""; }
  set id(v) { this._attrs.id = String(v); }
  get className() { return this._attrs.class || ""; }
  set className(v) { this._attrs.class = String(v); this.classList._syncFromAttr(v); }
  get parentElement() { return this.parentNode; }
  get isConnected() { return true; }
  get value() {
    if (this.tagName === "SELECT" && !this._value && this.children.length) {
      return this.children[0].value;
    }
    return this._value;
  }
  set value(v) { this._value = String(v == null ? "" : v); }
  get options() { return this.children.filter((c) => c.tagName === "OPTION"); }
  get selectedIndex() {
    const opts = this.options;
    const idx = opts.findIndex((o) => o.value === this.value);
    return idx >= 0 ? idx : 0;
  }
  get checked() { return this._checked; }
  set checked(v) { this._checked = Boolean(v); }
  get disabled() { return this._disabled; }
  set disabled(v) { this._disabled = Boolean(v); }
  get hidden() { return this._hidden; }
  set hidden(v) { this._hidden = Boolean(v); }
  get textContent() { return this._textContent; }
  set textContent(v) { this._textContent = String(v == null ? "" : v); }

  setAttribute(k, v) {
    this._attrs[k] = String(v);
    if (k === "class") this.classList._syncFromAttr(v);
  }
  getAttribute(k) { return this._attrs[k] !== undefined ? this._attrs[k] : null; }
  hasAttribute(k) { return this._attrs[k] !== undefined; }
  removeAttribute(k) { delete this._attrs[k]; }

  appendChild(child) {
    if (child._isFragment) {
      for (const c of [...child.children]) this.appendChild(c);
      child.children = [];
      return child;
    }
    child.parentNode = this;
    this.children.push(child);
    return child;
  }
  append(...nodes) { for (const n of nodes) this.appendChild(n); }
  insertBefore(newNode, refNode) {
    const idx = this.children.indexOf(refNode);
    newNode.parentNode = this;
    if (idx < 0) this.children.push(newNode);
    else this.children.splice(idx, 0, newNode);
    return newNode;
  }

  /* Minimal HTML parser for innerHTML so querySelector works on rendered templates. */
  set innerHTML(html) {
    this.children = [];
    this._innerHTML = String(html || "");
    const tagRe = /<(\/?)([a-z0-9-]+)([^>]*)>/gi;
    const stack = [this];
    let m;
    while ((m = tagRe.exec(this._innerHTML)) !== null) {
      const [, isClose, tag, attrStr] = m;
      if (isClose) {
        if (stack.length > 1) stack.pop();
        continue;
      }
      const node = new MockElement(tag);
      const attrRe = /([a-z0-9_-]+)(?:="([^"]*)")?/gi;
      let am;
      while ((am = attrRe.exec(attrStr)) !== null) {
        if (am[1] === "disabled") node.disabled = true;
        else if (am[1] === "hidden") node.hidden = true;
        else node.setAttribute(am[1], am[2] !== undefined ? am[2] : "");
      }
      if (attrStr.includes("value=")) {
        const vm = /value="([^"]*)"/.exec(attrStr);
        if (vm) node.value = vm[1];
      }
      stack[stack.length - 1].appendChild(node);
      const voidTags = ["input", "br", "hr", "img", "path", "line", "circle", "rect"];
      if (!attrStr.trim().endsWith("/") && !voidTags.includes(tag.toLowerCase())) {
        stack.push(node);
      }
    }
  }
  get innerHTML() { return this._innerHTML || ""; }

  querySelectorAll(selector) {
    const parts = selector.split(",").map((s) => s.trim());
    const out = [];
    const walk = (node) => {
      for (const c of node.children) {
        for (const p of parts) {
          if (p.includes(" ")) {
            const [parentSel, childSel] = p.split(/\s+/, 2);
            if (matchesSelector(c, childSel)) {
              let anc = c.parentNode;
              while (anc) {
                if (matchesSelector(anc, parentSel)) { out.push(c); break; }
                anc = anc.parentNode;
              }
            }
          } else if (matchesSelector(c, p)) {
            out.push(c);
            break;
          }
        }
        walk(c);
      }
    };
    walk(this);
    return out;
  }

  querySelector(selector) {
    if (selector.startsWith(":scope > ")) {
      const sub = selector.slice(9).trim();
      const parts = sub.split(">").map((s) => s.trim());
      let cur = [this];
      for (const p of parts) {
        cur = cur.flatMap((n) => n.children.filter((c) => matchesSelector(c, p)));
      }
      return cur[0] || null;
    }
    return this.querySelectorAll(selector)[0] || null;
  }

  closest(selector) {
    let cur = this;
    while (cur && cur.tagName) {
      if (matchesSelector(cur, selector)) return cur;
      cur = cur.parentNode;
    }
    return null;
  }

  addEventListener(type, fn) {
    if (!this.listeners[type]) this.listeners[type] = [];
    this.listeners[type].push(fn);
  }
  dispatchEvent(ev) {
    ev.target = ev.target || this;
    let stopped = false;
    ev.preventDefault = ev.preventDefault || (() => {});
    ev.stopPropagation = () => { stopped = true; };
    let cur = this;
    while (cur) {
      if (typeof cur["on" + ev.type] === "function") cur["on" + ev.type](ev);
      for (const fn of (cur.listeners[ev.type] || [])) fn.call(cur, ev);
      if (stopped || ev.bubbles === false) break;
      cur = cur.parentNode;
    }
  }
  click() { this.dispatchEvent({ type: "click" }); }
  focus() {}
  blur() { this.dispatchEvent({ type: "blur" }); }
  scrollIntoView() {}
  getBoundingClientRect() { return { left: 0, width: 100 }; }
}

function createBrowserEnv(rootDir) {
  const html = fs.readFileSync(path.join(rootDir, "index.html"), "utf8");
  const docEl = new MockElement("html");
  const body = new MockElement("body");
  docEl.appendChild(body);

  /* Populate elements from index.html with their IDs, classes, and data-* attributes. */
  const idMap = new Map();
  const stack = [body];
  const tagRe = /<(\/?)([a-z0-9-]+)([^>]*)>/gi;
  const bodyStart = html.indexOf("<body>");
  const bodyHtml = html.slice(bodyStart + 6, html.indexOf("<script"));
  let m;
  while ((m = tagRe.exec(bodyHtml)) !== null) {
    const [, isClose, tag, attrStr] = m;
    if (isClose) {
      if (stack.length > 1) stack.pop();
      continue;
    }
    const el = new MockElement(tag);
    const attrRe = /([a-z0-9_-]+)(?:="([^"]*)")?/gi;
    let am;
    while ((am = attrRe.exec(attrStr)) !== null) {
      if (am[1] === "hidden") el.hidden = true;
      else if (am[1] === "disabled") el.disabled = true;
      else el.setAttribute(am[1], am[2] !== undefined ? am[2] : "");
    }
    if (el.id) idMap.set(el.id, el);
    stack[stack.length - 1].appendChild(el);
    const voidTags = ["input", "br", "hr", "img", "path", "line", "circle", "rect"];
    if (!attrStr.trim().endsWith("/") && !voidTags.includes(tag.toLowerCase())) {
      stack.push(el);
    }
  }

  const doc = {
    documentElement: docEl,
    body,
    activeElement: body,
    fonts: { ready: Promise.resolve() },
    getElementById: (id) => idMap.get(id) || null,
    createElement: (tag) => new MockElement(tag),
    createDocumentFragment: () => ({ _isFragment: true, children: [], appendChild(c) { this.children.push(c); } }),
    querySelector: (sel) => body.querySelector(sel),
    querySelectorAll: (sel) => body.querySelectorAll(sel),
    addEventListener: (type, fn) => body.addEventListener(type, fn),
    dispatchEvent: (ev) => body.dispatchEvent(ev)
  };

  globalThis.window = globalThis;
  globalThis.addEventListener = () => {};
  globalThis.document = doc;
  Object.defineProperty(globalThis, "navigator", { value: { language: "en-US" }, configurable: true });
  globalThis.localStorage = {
    _m: {},
    getItem(k) { return this._m[k] || null; },
    setItem(k, v) { this._m[k] = String(v); }
  };
  globalThis.requestAnimationFrame = (fn) => fn();
  globalThis.URL = { createObjectURL: () => "blob:mock", revokeObjectURL: () => {} };
  globalThis.Blob = class MockBlob { constructor(parts) { this.parts = parts; } };
  globalThis.FileReader = class MockFileReader {
    readAsArrayBuffer(file) {
      this.result = file._buf;
      if (this.onload) this.onload();
    }
  };

  const scripts = [...html.matchAll(/<script defer src="([^"]+)">/g)].map((x) => x[1]);
  for (const rel of scripts) {
    require(path.join(rootDir, rel));
  }

  return { doc, scripts, MCLA: globalThis.MCLA };
}

module.exports = { createBrowserEnv };
