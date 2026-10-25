// Clica nas abas da página de tarefas (lista, calendário e categorias) e verifica que renderizam sem erro.
import './dom-shim.mjs';
import assert from 'node:assert/strict';
import { app, fireHashChange } from './dom-shim.mjs';

const errors = [];
const origError = console.error;
console.error = (...a) => errors.push(a.map(String).join(' '));

location.hash = '#/';
await import('../js/main.js');

function findButton(node, text) {
  if (node.tagName === 'BUTTON' && node.textContent.trim() === text) return node;
  for (const c of node.childNodes) {
    const found = findButton(c, text);
    if (found) return found;
  }
  return null;
}

location.hash = '#/tarefas';
fireHashChange();

for (const label of ['Calendário', 'Categorias', 'Lista']) {
  const btn = findButton(app, label);
  assert.ok(btn, `botão "${label}" não encontrado`);
  (btn.listeners.click ?? []).forEach((fn) => fn());
  assert.equal(errors.length, 0, `erro na visão ${label}: ${errors[0]}`);
}

// Clicar em um dia do calendário mostra a lista daquele dia
(function clickFirstDay() {
  location.hash = '#/tarefas';
  fireHashChange();
  (findButton(app, 'Calendário').listeners.click ?? []).forEach((fn) => fn());
  const dayButtons = [];
  (function collect(n) {
    if (n.tagName === 'BUTTON' && n.attrs['aria-label']?.includes('tarefa')) dayButtons.push(n);
    n.childNodes.forEach(collect);
  })(app);
  assert.ok(dayButtons.length >= 28, 'calendário deve ter os dias do mês');
  (dayButtons[0].listeners.click ?? []).forEach((fn) => fn());
  assert.equal(errors.length, 0, errors[0]);
})();

console.error = origError;
console.log('Visões de tarefas: lista, calendário, categorias e seleção de dia renderizam sem erro.');
