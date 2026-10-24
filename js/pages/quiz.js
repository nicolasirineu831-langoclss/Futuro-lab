import { el, icon, card, sectionTitle, progressBar, tag, emptyState, pageHead, notice, confirmAction, toast } from '../ui.js';
import { getState, update, uid } from '../store.js';
import { COURSES, findCourse } from '../data/courses.js';
import { gradeQuiz, assocOptions, PASS_PERCENT } from '../services/quiz.js';
import { awardOnce } from '../services/gamification.js';
import { addNotification } from '../services/notifications.js';
import { syncAchievements } from '../services/achievements.js';

const SIMULADO = {
  id: 'simulado',
  title: 'Simulado geral',
  questions: COURSES.map((c) => c.quiz.questions[0]),
};

function quizFor(id) {
  if (id === 'simulado') return { course: null, quiz: SIMULADO };
  const course = findCourse(id);
  return course ? { course, quiz: course.quiz } : null;
}

function attemptsOf(quizId) {
  return getState().quizzes[quizId]?.attempts ?? [];
}

export function renderQuizList(outlet, ctx) {
  ctx.setTitle('Provas');

  const rows = COURSES.map((course) => {
    const attempts = attemptsOf(course.quiz.id);
    const best = attempts.reduce((max, a) => Math.max(max, a.percent), 0);
    return el(
      'li',
      {},
      el(
        'a',
        { class: 'row-link', href: `#/provas/${course.id}` },
        el('div', { class: 'row-main' }, el('strong', {}, course.quiz.title), el('span', { class: 'muted' }, `${course.quiz.questions.length} questões · ${attempts.length} tentativa(s)`)),
        attempts.length ? tag(`Melhor: ${best}%`, best >= PASS_PERCENT ? 'success' : 'warning') : tag('Não realizada'),
      ),
    );
  });

  const simuladoAttempts = attemptsOf('simulado');
  outlet.append(
    pageHead('Avaliação', 'Provas', `Cada prova tem questões corrigidas por regras. Para aprovação, acerte pelo menos ${PASS_PERCENT}%.`),
    card(
      's-12',
      sectionTitle('Provas por curso'),
      el('ul', { class: 'stack-list' }, rows),
    ),
    card(
      's-12',
      sectionTitle('Simulado geral', simuladoAttempts.length ? tag(`${simuladoAttempts.length} tentativa(s)`) : null),
      el('p', { class: 'muted' }, 'Uma questão de cada curso, para revisar o conjunto.'),
      el('a', { class: 'btn btn-ghost', href: '#/provas/simulado' }, 'Fazer simulado'),
    ),
  );
}

export function renderQuiz(outlet, ctx) {
  const target = quizFor(ctx.params.id);
  if (!target) {
    ctx.setTitle('Prova não encontrada');
    outlet.append(emptyState({ title: 'Esta prova não existe.', text: 'Escolha uma prova na lista.', action: { label: 'Ver provas', href: '#/provas' } }));
    return;
  }

  const { course, quiz } = target;
  ctx.setTitle(quiz.title);

  const back = el('a', { class: 'link-more', href: '#/provas', style: 'margin-top: 0' }, 'Voltar às provas');
  const body = el('div', { class: 'stack-list' });
  outlet.append(back, pageHead(course ? course.title : 'Simulado', quiz.title), body);

  renderForm(body, ctx, { course, quiz });
}

function renderForm(container, ctx, { course, quiz }) {
  container.replaceChildren();
  const form = el('form', { class: 'quiz-form', novalidate: true });
  const questionNodes = [];
  const attempts = attemptsOf(quiz.id);

  quiz.questions.forEach((question, index) => {
    const legendId = `q-${index}`;
    let control;
    if (question.type === 'mc') {
      control = el(
        'div',
        { class: 'options', role: 'radiogroup', 'aria-labelledby': legendId },
        question.options.map((opt, optIndex) =>
          el(
            'label',
            { class: 'option' },
            el('input', { type: 'radio', name: `q${index}`, value: String(optIndex) }),
            el('span', {}, opt),
          ),
        ),
      );
    } else if (question.type === 'vf') {
      control = el(
        'div',
        { class: 'options', role: 'radiogroup', 'aria-labelledby': legendId },
        [['true', 'Verdadeiro'], ['false', 'Falso']].map(([val, label]) =>
          el('label', { class: 'option' }, el('input', { type: 'radio', name: `q${index}`, value: val }), el('span', {}, label)),
        ),
      );
    } else {
      const options = assocOptions(question);
      control = el(
        'div',
        { class: 'assoc', role: 'group', 'aria-labelledby': legendId },
        question.pairs.map(([concept], pairIndex) =>
          el(
            'div',
            { class: 'assoc-row' },
            el('span', {}, concept),
            el(
              'select',
              { class: 'control', name: `q${index}-p${pairIndex}`, 'aria-label': `Definição para ${concept}` },
              el('option', { value: '' }, 'Escolha uma definição'),
              options.map((opt) => el('option', { value: String(opt.index) }, opt.text)),
            ),
          ),
        ),
      );
    }

    questionNodes.push({ question, index });
    form.append(
      el(
        'fieldset',
        { class: 'question' },
        el('legend', { id: legendId }, el('span', { class: 'q-num' }, `Questão ${index + 1}`), ' ', question.prompt),
        control,
      ),
    );
  });

  const submit = el('button', { class: 'btn btn-primary', type: 'submit' }, 'Enviar respostas');
  form.append(el('div', { class: 'cta-row' }, submit), el('p', { class: 'help' }, `Aprovação: ${PASS_PERCENT}% ou mais de acerto.`));

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const answers = questionNodes.map(({ question, index }) => {
      if (question.type === 'mc' || question.type === 'vf') {
        const checked = form.querySelector(`input[name="q${index}"]:checked`);
        if (!checked) return undefined;
        if (question.type === 'mc') return Number(checked.value);
        return checked.value === 'true';
      }
      return question.pairs.map((_, pairIndex) => {
        const value = form.querySelector(`select[name="q${index}-p${pairIndex}"]`).value;
        return value === '' ? undefined : Number(value);
      });
    });

    const unanswered = answers.filter((a) => a === undefined || (Array.isArray(a) && a.some((x) => x === undefined))).length;
    if (unanswered && !confirmAction(`Há ${unanswered} questão(ões) sem resposta. Enviar mesmo assim?`)) return;

    const result = gradeQuiz(quiz, answers);
    recordAttempt(quiz, result);
    renderResult(container, ctx, { course, quiz, result, attemptsBefore: attempts.length });
  });

  container.append(card('', form));
}

function recordAttempt(quiz, result) {
  const saved = update((s) => {
    const entry = s.quizzes[quiz.id] ?? { attempts: [] };
    entry.attempts.push({ at: Date.now(), score: result.score, total: result.total, percent: result.percent });
    s.quizzes[quiz.id] = entry;
  });
  if (!saved) {
    toast('Não foi possível salvar o resultado neste navegador.', 'error');
    return;
  }

  if (result.passed) {
    const firstPass = awardOnce(`quiz:${quiz.id}`, 30);
    if (firstPass) toast('Prova aprovada pela primeira vez: +30 XP.');
  }

  addNotification({
    key: `quiz:${quiz.id}:${uid('r')}`,
    title: result.passed ? 'Prova aprovada' : 'Prova concluída',
    text: `${quiz.title}: ${result.score} de ${result.total} corretas (${result.percent}%).`,
    link: '#/provas',
  });
  syncAchievements();
}

function renderResult(container, ctx, { course, quiz, result, attemptsBefore }) {
  container.replaceChildren();

  const summary = card(
    '',
    el('p', { class: 'lead' }, 'Resultado'),
    el('h2', { class: 'hero-title' }, `${result.score} de ${result.total} corretas`),
    progressBar(result.percent, 'Aproveitamento'),
    el(
      'div',
      { class: 'cta-row' },
      tag(result.passed ? 'Aprovado' : 'Ainda não aprovado', result.passed ? 'success' : 'warning'),
      tag(`Tentativa ${attemptsBefore + 1}`),
    ),
    result.passed
      ? notice('success', 'Você atingiu a média. Ótimo trabalho!', 'tick')
      : notice('info', 'Revise as questões erradas abaixo e tente novamente quando quiser.', 'info'),
    el(
      'div',
      { class: 'cta-row' },
      el('button', { class: 'btn btn-primary', type: 'button', onclick: () => renderForm(container, ctx, { course, quiz }) }, 'Refazer prova'),
      course ? el('a', { class: 'btn btn-ghost', href: `#/cursos/${course.id}` }, 'Voltar ao curso') : el('a', { class: 'btn btn-ghost', href: '#/provas' }, 'Voltar às provas'),
    ),
  );

  const review = el(
    'ol',
    { class: 'review-list' },
    result.details.map((detail, index) => {
      const { question, correct, answered } = detail;
      let correctText = '';
      if (question.type === 'mc') correctText = `Resposta correta: ${question.options[question.answer]}`;
      if (question.type === 'vf') correctText = `Resposta correta: ${question.answer ? 'Verdadeiro' : 'Falso'}`;
      if (question.type === 'assoc') correctText = question.pairs.map(([c, d]) => `${c} → ${d}`).join('; ');

      return el(
        'li',
        { class: `review-item ${correct ? 'is-correct' : 'is-wrong'}` },
        el('div', { class: 'review-head' }, tag(correct ? 'Correta' : answered ? 'Incorreta' : 'Sem resposta', correct ? 'success' : 'warning'), el('strong', {}, question.prompt)),
        !correct ? el('p', { class: 'muted' }, correctText) : null,
        el('p', { class: 'help' }, question.explanation),
      );
    }),
  );

  container.append(summary, card('', sectionTitle('Revisão das questões'), review));
  toast(result.passed ? 'Prova aprovada!' : 'Resultado salvo. Revise as questões.', result.passed ? 'success' : 'error');
}
