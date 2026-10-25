// Mini-DOM apenas para smoke test de renderização (não é um DOM completo).
class Node { constructor() { this.childNodes = []; this.parentNode = null; } }
class TextNode extends Node {
  constructor(t) { super(); this.nodeValue = String(t); }
  get textContent() { return this.nodeValue; }
}
class Element extends Node {
  constructor(tag) {
    super();
    this.tagName = tag.toUpperCase();
    this.attrs = {};
    this._cls = '';
    this.dataset = {};
    this.listeners = {};
    this.style = {};
    this.value = '';
    this.disabled = false;
    this.checked = false;
    this.scrollTop = 0;
    this.scrollHeight = 0;
    this.classList = { add() {}, remove() {}, toggle() {} };
    this.title = '';
  }
  get className() { return this._cls; }
  set className(v) { this._cls = String(v); }
  get id() { return this.attrs.id ?? ''; }
  get textContent() { return this.childNodes.map((c) => c.textContent).join(''); }
  set textContent(v) { this.replaceChildren(String(v)); }
  append(...nodes) {
    for (const n of nodes.flat()) {
      if (n === null || n === undefined || n === false) continue;
      const child = n instanceof Node ? n : new TextNode(n);
      child.parentNode = this;
      this.childNodes.push(child);
    }
  }
  replaceChildren(...nodes) {
    this.childNodes.forEach((c) => (c.parentNode = null));
    this.childNodes = [];
    this.append(...nodes);
  }
  setAttribute(k, v) {
    this.attrs[k] = String(v);
    if (k === 'class') this._cls = String(v);
  }
  removeAttribute(k) { delete this.attrs[k]; }
  getAttribute(k) { return this.attrs[k] ?? null; }
  addEventListener(type, fn) { (this.listeners[type] ??= []).push(fn); }
  focus() {}
  click() {}
  remove() { this.parentNode?.childNodes?.splice(this.parentNode.childNodes.indexOf(this), 1); }
  querySelector() { return null; }
  querySelectorAll() { return []; }
  get children() { return this.childNodes; }
}
const elements = {};
const app = new Element('div'); app.attrs.id = 'app';
const body = new Element('body');
const doc = {
  body,
  createElement: (t) => new Element(t),
  createElementNS: (_, t) => new Element(t),
  createTextNode: (t) => new TextNode(t),
  getElementById: (id) => (id === 'app' ? app : elements[id] ?? null),
};
const winListeners = {};
const storage = new Map();
globalThis.Node = Node;
globalThis.document = doc;
globalThis.window = {
  addEventListener: (t, fn) => { (winListeners[t] ??= []).push(fn); },
  scrollTo() {},
  confirm: () => true,
};
globalThis.localStorage = {
  getItem: (k) => (storage.has(k) ? storage.get(k) : null),
  setItem: (k, v) => storage.set(k, String(v)),
  removeItem: (k) => storage.delete(k),
};
let hash = '';
globalThis.location = {
  get hash() { return hash; },
  set hash(v) { hash = v; },
};
globalThis.Blob = class { constructor(parts) { this.parts = parts; } };
globalThis.URL.createObjectURL = () => 'blob:test';
globalThis.URL.revokeObjectURL = () => {};
export function fireHashChange() { (winListeners.hashchange ?? []).forEach((fn) => fn()); }
export { app };
