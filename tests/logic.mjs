import assert from 'node:assert/strict';
import './dom-shim.mjs';
import { validateName, validateEmail, validatePassword } from '../js/services/validate.js';
import { friendlyError } from '../js/services/backend.js';
import { getState, update, dayKey, dayOffset } from '../js/store.js';
import { COURSES, allLessons, findLesson } from '../js/data/courses.js';
import { CHALLENGES } from '../js/data/challenges.js';
import { setLessonDone, courseProgress, courseStatus } from '../js/services/progress.js';
import { currentStreak, awardOnce, totalXp, recordActivity, weekActivity, levelInfo } from '../js/services/gamification.js';
import { gradeQuiz, assocOptions } from '../js/services/quiz.js';
import { scheduleCard, dueCards } from '../js/services/srs.js';
import { isOverdue, isDueSoon, filterTasks, taskCategory, monthGrid } from '../js/services/tasks.js';
import { askTutor } from '../js/services/tutor.js';
import { ACHIEVEMENTS, syncAchievements } from '../js/services/achievements.js';
import { addNotification, markRead } from '../js/services/notifications.js';

let count = 0;
const test = (name, fn) => { fn(); count += 1; };

test('validação do nome', () => {
  assert.equal(validateName('   ').ok, false);
  assert.equal(validateName('A').ok, false);
  assert.equal(validateName('  Maria   José ').value, 'Maria José');
  assert.equal(validateName("João d'Ávila").ok, true);
  assert.equal(validateName('Ana123').ok, false);
  assert.equal(validateName('<b>x</b>').ok, false);
  assert.equal(validateName('a'.repeat(41)).ok, false);
});

test('cada aula conta uma vez para XP e o progresso do curso é derivado', () => {
  const course = COURSES[0];
  const lessons = allLessons(course);
  const xpBefore = totalXp();
  setLessonDone(course, lessons[0].id, true);
  setLessonDone(course, lessons[0].id, true); // repetir não gera XP extra
  assert.equal(totalXp() - xpBefore, 10);
  assert.equal(courseStatus(course), 'em-andamento');
  for (const l of lessons.slice(1)) setLessonDone(course, l.id, true);
  assert.equal(courseProgress(course), 100);
  assert.equal(courseStatus(course), 'concluido');
  // desfazer não remove XP
  const xpAfter = totalXp();
  setLessonDone(course, lessons[0].id, false);
  assert.equal(totalXp(), xpAfter);
  assert.equal(courseProgress(course), 75);
});

test('XP por evento é concedido uma única vez', () => {
  assert.equal(awardOnce('evento-x', 30), true);
  assert.equal(awardOnce('evento-x', 30), false);
});

test('níveis', () => {
  assert.deepEqual(levelInfo(0), { level: 1, into: 0, next: 100 });
  assert.equal(levelInfo(250).level, 3);
});

test('sequência de dias usa datas reais e tolera hoje sem atividade', () => {
  const today = new Date(2026, 9, 24);
  update((s) => { s.activity = {}; });
  for (const off of [-1, -2, -3]) update((s) => { s.activity[dayOffset(off, today)] = { minutes: 10, actions: 1 }; });
  assert.equal(currentStreak(today), 3);       // hoje vazio, conta ontem, anteontem e 3 dias atrás
  update((s) => { s.activity[dayKey(today)] = { minutes: 5, actions: 1 }; });
  assert.equal(currentStreak(today), 4);
  update((s) => { s.activity[dayOffset(-2, today)] = undefined; delete s.activity[dayOffset(-2, today)]; });
  assert.equal(currentStreak(today), 2);      // dia faltando quebra a sequência
  assert.equal(weekActivity(today).length, 7);
});

test('correção de provas por regras, sem aleatoriedade', () => {
  const quiz = COURSES[0].quiz;
  const right = gradeQuiz(quiz, [1, false, [0, 1, 2]]);
  assert.equal(right.score, 3);
  assert.equal(right.passed, true);
  const wrong = gradeQuiz(quiz, [0, true, [1, 0, 2]]);
  assert.equal(wrong.score, 0);
  assert.equal(wrong.passed, false);
  const partial = gradeQuiz(quiz, [1, undefined, [0, 1, 2]]);
  assert.equal(partial.score, 2);
  assert.equal(partial.percent, 67);
  assert.equal(partial.passed, false);      // 67% < 70%
});

test('gabaritos das provas são válidos e a associação é embaralhada', () => {
  for (const c of COURSES) {
    for (const q of c.quiz.questions) {
      assert.ok(q.explanation, `${c.id}: falta explicação`);
      if (q.type === 'mc') assert.ok(q.answer >= 0 && q.answer < q.options.length, `${c.id}: gabarito fora do intervalo`);
      if (q.type === 'assoc') {
        const opts = assocOptions(q);
        assert.equal(opts.length, q.pairs.length);
        assert.notDeepEqual(opts.map((o) => o.index), q.pairs.map((_, i) => i), 'gabarito alinhado');
      }
    }
  }
});

test('todas as soluções de desafios passam nos próprios testes', () => {
  for (const c of CHALLENGES) {
    const fn = new Function(c.solution + `\n;return ${c.functionName};`)();
    for (const t of c.tests) {
      const got = fn(...t.args);
      assert.deepEqual(got, t.expected, `${c.id}: ${JSON.stringify(t.args)}`);
    }
  }
});

test('revisão espaçada: acertar aumenta o intervalo, errar reinicia', () => {
  let card = { id: 'c', front: 'a', back: 'b', ease: 2.5, interval: 0, reps: 0, due: '' };
  const today = new Date(2026, 9, 24);
  card = scheduleCard(card, true, today);
  assert.equal(card.interval, 1);
  card = scheduleCard(card, true, today);
  assert.equal(card.interval, 3);
  const bigger = scheduleCard(card, true, today);
  assert.ok(bigger.interval > 3);
  const reset = scheduleCard(bigger, false, today);
  assert.equal(reset.interval, 1);
  assert.equal(reset.reps, 0);
  assert.equal(reset.ease < bigger.ease, true);
  const deck = { cards: [{ ...card, due: dayKey(today) }, { ...card, id: 'z', due: dayOffset(5, today) }] };
  assert.equal(dueCards(deck, today).length, 1);
});

test('tarefas: atrasada, prazo próximo, filtros e categorias', () => {
  const today = new Date(2026, 9, 24);
  const base = { title: 't', status: 'a-fazer', priority: 'media', subtasks: [] };
  const late = { ...base, id: '1', due: dayOffset(-1, today) };
  const soon = { ...base, id: '2', due: dayOffset(2, today) };
  const far = { ...base, id: '3', due: dayOffset(20, today), priority: 'alta' };
  const done = { ...base, id: '4', due: dayOffset(-5, today), status: 'concluida' };
  assert.equal(isOverdue(late, today), true);
  assert.equal(isOverdue(done, today), false);
  assert.equal(isDueSoon(soon, today), true);
  assert.equal(isDueSoon(far, today), false);
  assert.equal(taskCategory(late, today), 'atrasadas');
  assert.equal(taskCategory(done, today), 'concluidas');
  assert.deepEqual(filterTasks([late, soon, far, done], { deadline: 'atrasadas' }, today).map((t) => t.id), ['1']);
  assert.deepEqual(filterTasks([late, soon, far, done], { priority: 'alta' }, today).map((t) => t.id), ['3']);
  assert.deepEqual(filterTasks([late, soon, far, done], { deadline: 'semana' }, today).map((t) => t.id), ['2']);
});

test('calendário mensal: outubro de 2026 começa na quinta-feira e tem 31 dias', () => {
  const weeks = monthGrid(2026, 9);
  assert.equal(weeks[0][4], '2026-10-01');
  assert.equal(weeks.flat().filter(Boolean).length, 31);
  assert.ok(weeks.every((w) => w.length === 7));
});

test('tutor em modo demonstração responde temas preparados e reconhece o fallback', async () => {
  const a = await askTutor('O que é uma variável?');
  assert.equal(a.mode, 'demo');
  assert.match(a.text, /Variável/);
  const b = await askTutor('Como funciona o formato do bolo?');
  assert.doesNotMatch(b.text, /Laços repetem/); // "for" dentro de "formato" não deve casar com a resposta de laço
  const c = await askTutor('xyzzy');
  assert.match(c.text, /demonstração/);
});

test('conquistas são desbloqueadas uma vez e geram aviso', () => {
  const before = getState().achievements.length;
  update((s) => { s.projects.push({ id: 'p-test', status: 'concluido', checklist: [], title: 'x' }); });
  const newly = syncAchievements();
  assert.ok(newly.some((a) => a.id === 'primeiro-projeto'));
  assert.equal(syncAchievements().length, 0); // segunda chamada não desbloqueia nada de novo
  assert.ok(getState().achievements.length > before);
  assert.equal(ACHIEVEMENTS.every((a) => a.rule && a.title), true);
});

test('avisos: sem duplicar a mesma chave e marcação de leitura', () => {
  addNotification({ key: 'k-1', title: 'a', text: 'b' });
  assert.equal(addNotification({ key: 'k-1', title: 'a', text: 'b' }), false);
  const n = getState().notifications.find((x) => x.key === 'k-1');
  markRead(n.id, true);
  assert.equal(getState().notifications.find((x) => x.key === 'k-1').read, true);
});

test('aula inexistente não é encontrada', () => {
  assert.equal(findLesson('introducao-programacao', 'nada'), null);
  assert.ok(findLesson('introducao-programacao', 'ip-m1-a1'));
});

test('validação de e-mail e senha da conta', () => {
  assert.equal(validateEmail(''), 'Informe seu e-mail.');
  assert.equal(validateEmail('ana@'), 'Informe um e-mail válido.');
  assert.equal(validateEmail(' ana@exemplo.com '), null);
  assert.equal(validatePassword('curta1'), 'A senha precisa ter pelo menos 8 caracteres.');
  assert.equal(validatePassword('somenteletras'), 'Use letras e números na senha.');
  assert.equal(validatePassword('senha12345'), null);
});

test('erros do serviço viram mensagens em português sem vazar detalhes técnicos', () => {
  assert.equal(friendlyError({ message: 'Invalid login credentials' }), 'E-mail ou senha incorretos.');
  assert.equal(friendlyError({ message: 'User already registered' }), 'Já existe uma conta com este e-mail.');
  assert.equal(friendlyError({ code: '42501', message: 'new row violates row-level security' }), 'Você não tem permissão para realizar esta ação.');
  assert.equal(friendlyError({ code: 'P0001', message: 'O prazo desta atividade terminou.' }), 'O prazo desta atividade terminou.');
  assert.equal(friendlyError({ message: 'algo estranho' }), 'Não foi possível concluir a ação. Tente novamente.');
});

console.log(`Testes de lógica: ${count} grupos passaram.`);
