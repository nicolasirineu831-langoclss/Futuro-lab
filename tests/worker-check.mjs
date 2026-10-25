// Testa o corpo do Worker de execução (services/sandbox.js) sem precisar de navegador.
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import { CHALLENGES } from '../js/data/challenges.js';

const src = readFileSync(new URL('../js/services/sandbox.js', import.meta.url), 'utf8');
const body = src.match(/const WORKER_BODY = `([\s\S]*?)`;/)[1]
  .replace(/\\\\n/g, '\\n'); // a template literal escapa \n como \\n

function runWorker(payload) {
  return new Promise((resolve) => {
    let out;
    const context = { self: {}, console: { log() {}, error() {}, warn() {} }, JSON, Error, Array, String };
    context.self.postMessage = (m) => { out = m; };
    vm.createContext(context);
    vm.runInContext(body, context);
    context.self.onmessage({ data: payload });
    resolve(out);
  });
}

// 1) Função correta passa nos testes do desafio
const soma = CHALLENGES.find((c) => c.id === 'soma');
let r = await runWorker({ code: soma.solution, fnName: soma.functionName, tests: soma.tests });
assert.equal(r.results.every((x) => x.pass), true, 'solução correta deve passar');

// 2) Função errada falha com a saída esperada e obtida
r = await runWorker({ code: 'function soma(a,b){ return a - b; }', fnName: 'soma', tests: soma.tests });
assert.equal(r.results.some((x) => !x.pass), true);

// 3) Captura de console.log
r = await runWorker({ code: 'console.log("oi", 2);' });
assert.equal(JSON.stringify(r.logs), JSON.stringify(['oi 2']));

// 4) Erro de sintaxe vira mensagem, não exceção
r = await runWorker({ code: 'function (', fnName: null });
assert.ok(r.error, 'erro de sintaxe deve ser reportado');

// 5) Rede removida dentro do worker
r = await runWorker({ code: 'console.log(typeof fetch, typeof XMLHttpRequest);' });
assert.equal(JSON.stringify(r.logs), JSON.stringify(['undefined undefined']));

console.log('Worker de execução: 5 verificações passaram.');
