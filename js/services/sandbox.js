// Executa o código do estudante em um Web Worker separado da página.
// - Não acessa o DOM, localStorage nem a página principal.
// - Rede (fetch, XMLHttpRequest, WebSocket) é removida dentro do worker.
// - Um limite de tempo encerra o worker (ex.: laço infinito).
// AVISO: isso é uma proteção prática para código do próprio estudante, não uma barreira de
// segurança para código hostil. Não substitui execução em servidor isolado.

const TIME_LIMIT_MS = 2000;

const WORKER_BODY = `
'use strict';
for (const k of ['fetch', 'XMLHttpRequest', 'WebSocket', 'importScripts', 'indexedDB', 'caches']) {
  try { self[k] = undefined; } catch (e) {}
}
const logs = [];
const show = (v) => {
  if (typeof v === 'string') return v;
  try { return JSON.stringify(v); } catch (e) { return String(v); }
};
console.log = (...args) => logs.push(args.map(show).join(' '));
console.error = console.log;
console.warn = console.log;

self.onmessage = (event) => {
  const { code, fnName, tests } = event.data;
  const out = { logs, results: [], error: null, returned: undefined };
  try {
    const body = code + '\\n;return typeof ' + (fnName || 'undefined') + ' === "function" ? ' + (fnName || 'null') + ' : null;';
    const fn = fnName ? new Function(body)() : null;
    if (!tests || !tests.length) {
      if (!fnName) new Function(code)();
    } else {
      if (!fn) throw new Error('A função "' + fnName + '" não foi encontrada. Verifique o nome.');
      for (const t of tests) {
        let got;
        try {
          got = fn(...t.args);
        } catch (err) {
          out.results.push({ pass: false, got: 'erro: ' + err.message, expected: t.expected, args: t.args });
          continue;
        }
        const pass = JSON.stringify(got) === JSON.stringify(t.expected);
        out.results.push({ pass, got, expected: t.expected, args: t.args });
      }
    }
  } catch (err) {
    out.error = err && err.message ? err.message : String(err);
  }
  self.postMessage({ ...out, logs: logs.slice() });
};
`;

export function runInWorker({ code, fnName = null, tests = null }) {
  return new Promise((resolve) => {
    let worker;
    let finished = false;
    let timer;

    const finish = (payload) => {
      if (finished) return;
      finished = true;
      clearTimeout(timer);
      worker?.terminate();
      URL.revokeObjectURL(url);
      resolve(payload);
    };

    const url = URL.createObjectURL(new Blob([WORKER_BODY], { type: 'text/javascript' }));

    try {
      worker = new Worker(url);
    } catch (error) {
      finish({ timeout: false, error: 'Seu navegador não permitiu iniciar o executor de código.', logs: [], results: [] });
      return;
    }

    worker.onmessage = (event) => finish({ timeout: false, ...event.data });
    worker.onerror = (event) =>
      finish({ timeout: false, error: event.message || 'Erro ao executar o código.', logs: [], results: [] });

    timer = setTimeout(() => {
      finish({
        timeout: true,
        error: `A execução passou de ${TIME_LIMIT_MS / 1000} segundos e foi interrompida. Verifique se há um laço que nunca termina.`,
        logs: [],
        results: [],
      });
    }, TIME_LIMIT_MS);

    worker.postMessage({ code, fnName, tests });
  });
}

export const RUN_TIME_LIMIT_MS = TIME_LIMIT_MS;
