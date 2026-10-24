import { el, icon, card, sectionTitle, tag, emptyState, pageHead, textArea, progressBar, toast, notice } from '../ui.js';
import { getState, update } from '../store.js';
import { CHALLENGES, findChallenge } from '../data/challenges.js';
import { runInWorker } from '../services/sandbox.js';
import { awardOnce } from '../services/gamification.js';
import { syncAchievements } from '../services/achievements.js';
import { addNotification } from '../services/notifications.js';

function labOf(id) {
  return getState().labs[id] ?? { attempts: [], hintsUsed: 0, completedAt: null, lastCode: null };
}

export function renderLabList(outlet, ctx) {
  ctx.setTitle('Laboratório');

  const rows = CHALLENGES.map((c) => {
    const lab = labOf(c.id);
    return el(
      'li',
      {},
      el(
        'a',
        { class: 'row-link', href: `#/laboratorio/${c.id}` },
        el('div', { class: 'row-main' }, el('strong', {}, c.title), el('span', { class: 'muted' }, `${c.level} · ${lab.attempts.length} tentativa(s)`)),
        lab.completedAt ? tag('Resolvido', 'success') : tag('Pendente'),
      ),
    );
  });

  const solved = CHALLENGES.filter((c) => labOf(c.id).completedAt).length;

  outlet.append(
    pageHead('Prática', 'Laboratório', 'Escreva código, execute e teste. Cada desafio tem casos de teste que verificam a sua função.'),
    card('s-12', sectionTitle('Progresso', el('small', {}, `${solved} de ${CHALLENGES.length} resolvidos`)), progressBar(Math.round((solved / CHALLENGES.length) * 100), 'Desafios resolvidos')),
    card('s-12', sectionTitle('Desafios'), el('ul', { class: 'stack-list' }, rows)),
    notice('info', 'O código roda no seu navegador, em um executor separado da página, com limite de tempo de dois segundos. Ele não acessa a internet nem os seus dados salvos.', 'info'),
  );
}

export function renderChallenge(outlet, ctx) {
  const challenge = findChallenge(ctx.params.id);
  if (!challenge) {
    ctx.setTitle('Desafio não encontrado');
    outlet.append(emptyState({ title: 'Este desafio não existe.', text: 'Escolha outro na lista do laboratório.', action: { label: 'Voltar ao laboratório', href: '#/laboratorio' } }));
    return;
  }
  ctx.setTitle(challenge.title);

  const lab = labOf(challenge.id);
  const startCode = lab.lastCode ?? challenge.starter;
  const editor = textArea(startCode, {
    id: 'code-editor',
    rows: '14',
    spellcheck: 'false',
    autocapitalize: 'off',
    autocorrect: 'off',
    'aria-label': 'Editor de código JavaScript',
    class: 'control code-editor',
  });
  const output = el('pre', { class: 'output', role: 'log', 'aria-live': 'polite', 'aria-label': 'Saída da execução' }, 'A saída aparece aqui.');
  const status = el('p', { class: 'help', role: 'status', 'aria-live': 'polite' });
  let running = false;

  const setBusy = (busy, text) => {
    running = busy;
    runBtn.disabled = busy;
    testBtn.disabled = busy;
    status.textContent = text ?? '';
  };

  const saveCode = () => {
    update((s) => {
      s.labs[challenge.id] = { ...labOf(challenge.id), lastCode: editor.value };
    });
  };

  const runBtn = el('button', {
    class: 'btn btn-ghost',
    type: 'button',
    onclick: async () => {
      if (running) return;
      saveCode();
      setBusy(true, 'Executando...');
      const result = await runInWorker({ code: editor.value });
      setBusy(false, '');
      output.textContent = formatRun(result);
    },
  }, icon('play'), 'Executar');

  const testBtn = el('button', {
    class: 'btn btn-primary',
    type: 'button',
    onclick: async () => {
      if (running) return;
      saveCode();
      setBusy(true, 'Testando sua função...');
      const result = await runInWorker({ code: editor.value, fnName: challenge.functionName, tests: challenge.tests });
      setBusy(false, '');
      const passed = !result.error && !result.timeout && result.results.length === challenge.tests.length && result.results.every((r) => r.pass);
      output.textContent = formatTests(result, challenge);
      recordAttempt(challenge, passed, result);
      if (passed) toast('Todos os testes passaram!');
      ctx.navigate(ctx.path);
    },
  }, icon('check'), 'Testar solução');

  const reset = el('button', {
    class: 'btn btn-ghost',
    type: 'button',
    onclick: () => {
      editor.value = challenge.starter;
      saveCode();
      output.textContent = 'Código reiniciado.';
    },
  }, icon('reset'), 'Reiniciar código');

  // Dicas progressivas: uma por vez, contadas no estado.
  const hintsShown = lab.hintsUsed;
  const hintList = el('ol', { class: 'hint-list' }, challenge.hints.slice(0, hintsShown).map((h) => el('li', {}, h)));
  const hintBtn = el('button', {
    class: 'btn btn-ghost',
    type: 'button',
    disabled: hintsShown >= challenge.hints.length ? true : null,
    onclick: () => {
      update((s) => {
        s.labs[challenge.id] = { ...labOf(challenge.id), hintsUsed: Math.min(challenge.hints.length, labOf(challenge.id).hintsUsed + 1) };
      });
      ctx.navigate(ctx.path);
    },
  }, icon('bulb'), hintsShown >= challenge.hints.length ? 'Todas as dicas exibidas' : `Mostrar dica ${hintsShown + 1} de ${challenge.hints.length}`);

  const canSeeSolution = lab.completedAt || lab.attempts.length >= 1 || hintsShown >= challenge.hints.length;
  const solutionBlock = canSeeSolution
    ? el(
        'details',
        { class: 'solution' },
        el('summary', {}, 'Ver solução comentada'),
        el('pre', { class: 'code-block' }, el('code', {}, challenge.solution)),
      )
    : el('p', { class: 'help' }, 'A solução comentada aparece depois da primeira tentativa ou quando todas as dicas forem exibidas.');

  const historyList = lab.attempts.length
    ? el(
        'ul',
        { class: 'stack-list' },
        lab.attempts.slice(-8).reverse().map((a) =>
          el('li', { class: 'achv' }, el('div', {}, el('strong', {}, a.passed ? 'Aprovado nos testes' : 'Não passou nos testes'), el('small', {}, `${new Date(a.at).toLocaleString('pt-BR')} · ${a.passedCount} de ${a.total}`)), tag(a.passed ? 'Sucesso' : 'Tentativa', a.passed ? 'success' : 'warning')),
        ),
      )
    : el('p', { class: 'muted' }, 'Nenhuma tentativa ainda.');

  outlet.append(
    el('a', { class: 'link-more', href: '#/laboratorio', style: 'margin-top: 0' }, 'Voltar ao laboratório'),
    el('header', { class: 'page-head' }, el('div', { class: 'tags-row' }, tag(challenge.level, 'primary'), lab.completedAt ? tag('Resolvido', 'success') : null), el('h1', {}, challenge.title)),
    el(
      'div',
      { class: 'dash-grid' },
      card('s-7', sectionTitle('Enunciado'), el('p', {}, challenge.statement), el('p', { class: 'help' }, `Função esperada: ${challenge.functionName}()`)),
      card(
        's-5',
        sectionTitle('Dicas'),
        hintList.childNodes.length ? hintList : el('p', { class: 'muted' }, 'Nenhuma dica exibida ainda.'),
        el('div', { class: 'cta-row' }, hintBtn),
      ),
      card(
        's-12',
        sectionTitle('Código'),
        el('div', { class: 'field' }, el('label', { for: 'code-editor' }, 'Seu código'), editor),
        el('div', { class: 'cta-row' }, runBtn, testBtn, reset),
        status,
        el('h3', { class: 'out-title' }, 'Saída e resultados'),
        output,
      ),
      card('s-6', sectionTitle('Solução'), solutionBlock),
      card('s-6', sectionTitle('Histórico de tentativas'), historyList),
    ),
  );
}

function recordAttempt(challenge, passed, result) {
  const passedCount = (result.results ?? []).filter((r) => r.pass).length;
  const isFirstSuccess = passed && !labOf(challenge.id).completedAt;
  update((s) => {
    const lab = labOf(challenge.id);
    lab.attempts = [...lab.attempts, { at: Date.now(), passed, passedCount, total: challenge.tests.length }].slice(-30);
    if (passed && !lab.completedAt) lab.completedAt = Date.now();
    s.labs[challenge.id] = lab;
  });
  if (isFirstSuccess) {
    const gained = awardOnce(`lab:${challenge.id}`, 25);
    addNotification({ key: `lab:${challenge.id}`, title: 'Desafio resolvido', text: challenge.title, link: `#/laboratorio/${challenge.id}` });
    if (gained) toast('Primeiro sucesso neste desafio: +25 XP.');
  }
  syncAchievements();
}

function formatRun(result) {
  if (result.timeout) return result.error;
  const lines = [];
  if (result.logs?.length) lines.push(...result.logs);
  if (result.error) lines.push(`Erro: ${result.error}`);
  if (!lines.length) lines.push('O código rodou sem mostrar nada. Use console.log(...) para ver valores.');
  return lines.join('\n');
}

function formatTests(result, challenge) {
  if (result.timeout) return result.error;
  if (result.error) return `Erro ao executar: ${result.error}`;
  const lines = [];
  if (result.logs?.length) lines.push('Saída do console:', ...result.logs, '');
  result.results.forEach((r, i) => {
    const args = r.args.map((a) => JSON.stringify(a)).join(', ');
    lines.push(`Teste ${i + 1}: ${challenge.functionName}(${args}) ${r.pass ? '✔ passou' : '✘ falhou'}`);
    if (!r.pass) lines.push(`   esperado: ${JSON.stringify(r.expected)}\n   obtido:   ${JSON.stringify(r.got)}`);
  });
  const passedCount = result.results.filter((r) => r.pass).length;
  lines.push('', `${passedCount} de ${challenge.tests.length} testes passaram.`);
  return lines.join('\n');
}

