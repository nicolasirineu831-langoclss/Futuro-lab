import { el, icon, card, sectionTitle, emptyState, pageHead, textInput, textArea, field, select, toast, confirmAction, progressBar, formatMinutes } from '../ui.js';
import { getState, update, uid, dayKey, dayOffset, parseDay } from '../store.js';
import { COURSES } from '../data/courses.js';
import { recordActivity, awardOnce, weeklyMinutes, XP_RULES } from '../services/gamification.js';
import { syncAchievements } from '../services/achievements.js';
import { addNotification } from '../services/notifications.js';

// ---------- Temporizador ----------
// O estado do temporizador vive fora da tela: ele continua contando mesmo se o estudante
// navegar para outra área. Ao voltar, a tela mostra o tempo atual.

const timer = {
  mode: 'work', // 'work' | 'break'
  status: 'idle', // 'idle' | 'running' | 'paused'
  remainingMs: null,
  endAt: null,
  interval: null,
  onTick: null,
};

function durations() {
  const p = getState().profile;
  return { work: (p.focusWork ?? 25) * 60000, break: (p.focusBreak ?? 5) * 60000 };
}

function ensureRemaining() {
  if (timer.remainingMs === null) timer.remainingMs = durations()[timer.mode];
}

function tick() {
  if (timer.status !== 'running') return;
  const left = timer.endAt - Date.now();
  if (left <= 0) {
    finishCycle();
    return;
  }
  timer.remainingMs = left;
  timer.onTick?.();
}

function startTimer() {
  ensureRemaining();
  timer.endAt = Date.now() + timer.remainingMs;
  timer.status = 'running';
  clearInterval(timer.interval);
  timer.interval = setInterval(tick, 250);
  timer.onTick?.();
}

function pauseTimer() {
  if (timer.status !== 'running') return;
  timer.remainingMs = Math.max(0, timer.endAt - Date.now());
  timer.status = 'paused';
  clearInterval(timer.interval);
  timer.onTick?.();
}

function resetTimer() {
  clearInterval(timer.interval);
  timer.status = 'idle';
  timer.remainingMs = durations()[timer.mode];
  timer.onTick?.();
}

function switchMode(mode) {
  clearInterval(timer.interval);
  timer.mode = mode;
  timer.status = 'idle';
  timer.remainingMs = durations()[mode];
  timer.onTick?.();
}

function finishCycle() {
  clearInterval(timer.interval);
  timer.status = 'idle';
  timer.remainingMs = 0;
  const finishedMode = timer.mode;

  if (finishedMode === 'work') {
    const minutes = Math.round(durations().work / 60000);
    const id = uid('focus');
    const saved = update((s) => {
      s.sessions.push({ id, at: Date.now(), minutes });
    });
    recordActivity({ minutes });
    if (saved && minutes >= 25) awardOnce(`focus:${id}`, XP_RULES.focus.xp);
    addNotification({ key: `focus:${id}`, title: 'Sessão de foco concluída', text: `${minutes} minutos de foco registrados.`, link: '#/planejador' });
    checkWeeklyGoal();
    syncAchievements();
    toast(`Sessão de foco de ${minutes} minutos registrada.`);
  } else {
    toast('Pausa concluída. Quando quiser, volte ao foco.');
  }

  timer.remainingMs = durations()[timer.mode];
  timer.onTick?.();
}

function checkWeeklyGoal() {
  const goal = getState().profile.weeklyGoalMinutes;
  if (!goal) return;
  if (weeklyMinutes() >= goal) {
    const now = new Date();
    const monday = dayOffset(-((now.getDay() + 6) % 7), now);
    addNotification({ key: `goal:${monday}`, title: 'Meta semanal concluída', text: `Você atingiu ${formatMinutes(goal)} de foco nesta semana.`, link: '#/planejador' });
  }
}

function formatClock(ms) {
  const total = Math.ceil(ms / 1000);
  const m = String(Math.floor(total / 60)).padStart(2, '0');
  const s = String(total % 60).padStart(2, '0');
  return `${m}:${s}`;
}

function timerCard() {
  ensureRemaining();
  const display = el('p', { class: 'clock', role: 'timer', 'aria-label': 'Tempo restante' }, formatClock(timer.remainingMs));
  const label = el('p', { class: 'muted' });
  const primary = el('button', { class: 'btn btn-primary', type: 'button' });
  const reset = el('button', { class: 'btn btn-ghost', type: 'button', onclick: resetTimer }, icon('reset'), 'Reiniciar');
  const modeWork = el('button', { class: 'tab', type: 'button', 'aria-pressed': 'false', onclick: () => switchMode('work') }, 'Foco');
  const modeBreak = el('button', { class: 'tab', type: 'button', 'aria-pressed': 'false', onclick: () => switchMode('break') }, 'Pausa');

  const paint = () => {
    display.textContent = formatClock(timer.remainingMs ?? durations()[timer.mode]);
    const running = timer.status === 'running';
    primary.replaceChildren(icon(running ? 'pause' : 'play'), document.createTextNode(running ? 'Pausar' : timer.status === 'paused' ? 'Retomar' : 'Iniciar'));
    primary.className = `btn ${running ? 'btn-ghost' : 'btn-primary'}`;
    primary.onclick = running ? pauseTimer : startTimer;
    label.textContent = timer.mode === 'work' ? `Foco de ${Math.round(durations().work / 60000)} minutos` : `Pausa de ${Math.round(durations().break / 60000)} minutos`;
    modeWork.setAttribute('aria-pressed', timer.mode === 'work' ? 'true' : 'false');
    modeBreak.setAttribute('aria-pressed', timer.mode === 'break' ? 'true' : 'false');
    modeWork.classList.toggle('is-active', timer.mode === 'work');
    modeBreak.classList.toggle('is-active', timer.mode === 'break');
  };

  timer.onTick = paint;
  paint();

  return card(
    's-5',
    sectionTitle('Foco'),
    el('div', { class: 'tabs' }, modeWork, modeBreak),
    el('div', { class: 'timer' }, display, label),
    el('div', { class: 'cta-row' }, primary, reset),
    el('p', { class: 'help' }, 'Sessões de foco concluídas são registradas no seu histórico. Você pode ajustar a duração abaixo.'),
  );
}

// ---------- Página ----------

export function renderPlanner(outlet, ctx) {
  ctx.setTitle('Planejador');
  const state = getState();
  const today = dayKey();
  const week = report();

  const goalInput = el('input', { type: 'number', min: '0', max: '2000', id: 'goal-min', class: 'control', value: String(state.profile.weeklyGoalMinutes ?? '') });
  const workInput = el('input', { type: 'number', min: '1', max: '120', id: 'focus-work', class: 'control', value: String(state.profile.focusWork ?? 25) });
  const breakInput = el('input', { type: 'number', min: '1', max: '60', id: 'focus-break', class: 'control', value: String(state.profile.focusBreak ?? 5) });
  const settingsError = el('p', { class: 'field-error', role: 'alert' });

  const saveSettings = (event) => {
    event.preventDefault();
    settingsError.textContent = '';
    const goal = Number(goalInput.value || 0);
    const work = Number(workInput.value);
    const brk = Number(breakInput.value);
    if (!Number.isFinite(goal) || goal < 0 || goal > 2000) return (settingsError.textContent = 'Meta semanal: use um valor entre 0 e 2000 minutos.');
    if (!Number.isInteger(work) || work < 1 || work > 120) return (settingsError.textContent = 'Foco: use de 1 a 120 minutos.');
    if (!Number.isInteger(brk) || brk < 1 || brk > 60) return (settingsError.textContent = 'Pausa: use de 1 a 60 minutos.');
    const saved = update((s) => {
      s.profile.weeklyGoalMinutes = goal;
      s.profile.focusWork = work;
      s.profile.focusBreak = brk;
    });
    if (!saved) return (settingsError.textContent = 'Não foi possível salvar neste navegador.');
    resetTimer();
    toast('Configurações salvas.');
    ctx.navigate(ctx.path);
  };

  const planForm = planPanel(ctx);

  outlet.append(
    pageHead('Rotina', 'Planejador', 'Sessões de foco, metas semanais e um plano de estudos por curso.'),
    el(
      'div',
      { class: 'dash-grid' },
      timerCard(),
      card(
        's-7',
        sectionTitle('Relatório da semana'),
        el(
          'div',
          { class: 'stats' },
          statBox('Tempo de foco', formatMinutes(week.minutes)),
          statBox('Sessões de foco', String(week.sessions)),
          statBox('Aulas concluídas', String(week.lessons)),
          statBox('Tarefas concluídas', String(week.tasks)),
        ),
        goalInput.value ? progressBar(Math.min(100, Math.round((week.minutes / Number(goalInput.value)) * 100)), 'Meta semanal') : el('p', { class: 'muted' }, 'Defina uma meta semanal para acompanhar o progresso.'),
      ),
      card(
        's-12',
        sectionTitle('Ajustes'),
        el(
          'form',
          { class: 'form-row', novalidate: true, onsubmit: saveSettings },
          field('Meta semanal (min)', goalInput, 'Use 0 para não definir meta.'),
          field('Foco (min)', workInput),
          field('Pausa (min)', breakInput),
          el('div', { class: 'cta-row' }, el('button', { class: 'btn btn-primary', type: 'submit' }, 'Salvar ajustes')),
        ),
        settingsError,
      ),
      card('s-12', sectionTitle('Plano de estudos'), planForm.host),
      card('s-12', sectionTitle('Lembretes de hoje'), remindersList(today)),
    ),
  );

  planForm.draw();
}

function statBox(label, value) {
  return card('stat', el('strong', {}, value), el('span', {}, label));
}

function report(today = new Date()) {
  const state = getState();
  const start = dayOffset(-6, today);
  const sessions = state.sessions.filter((s) => dayKey(new Date(s.at)) >= start);
  const minutes = weeklyMinutes(today);
  const lessons = Object.values(state.lessons).filter((l) => dayKey(new Date(l.doneAt)) >= start).length;
  const tasks = state.tasks.filter((t) => t.completedAt && dayKey(new Date(t.completedAt)) >= start).length;
  return { minutes, sessions: sessions.length, lessons, tasks };
}

function remindersList(today) {
  const items = getState().studyPlan.filter((p) => p.date === today);
  if (!items.length) return el('p', { class: 'muted' }, 'Nenhuma sessão de estudo planejada para hoje.');
  return el(
    'ul',
    { class: 'stack-list' },
    items.map((p) => el('li', { class: 'achv' }, el('div', {}, el('strong', {}, courseName(p.courseId)), el('small', {}, `${p.minutes} min${p.note ? ` · ${p.note}` : ''}`)))),
  );
}

function courseName(id) {
  return COURSES.find((c) => c.id === id)?.title ?? 'Estudo livre';
}

function planPanel(ctx) {
  const host = el('div');
  const draw = () => {
    const items = getState().studyPlan.slice().sort((a, b) => a.date.localeCompare(b.date));
    const date = el('input', { type: 'date', id: 'plan-date', class: 'control', value: dayKey(), required: true });
    const course = select([['', 'Estudo livre'], ...COURSES.map((c) => [c.id, c.title])], '', { id: 'plan-course' });
    const minutes = el('input', { type: 'number', min: '5', max: '480', id: 'plan-min', class: 'control', value: '25' });
    const note = textInput({ id: 'plan-note', maxlength: '80', placeholder: 'Ex.: revisar condicionais' });
    const error = el('p', { class: 'field-error', role: 'alert' });

    host.replaceChildren(
      el(
        'form',
        {
          class: 'form-row',
          novalidate: true,
          onsubmit: (event) => {
            event.preventDefault();
            error.textContent = '';
            const m = Number(minutes.value);
            if (!date.value) return (error.textContent = 'Escolha uma data.');
            if (!Number.isInteger(m) || m < 5 || m > 480) return (error.textContent = 'Use de 5 a 480 minutos.');
            const saved = update((s) => {
              s.studyPlan.push({ id: uid('plan'), date: date.value, courseId: course.value || null, minutes: m, note: note.value.trim() });
            });
            if (!saved) return (error.textContent = 'Não foi possível salvar neste navegador.');
            toast('Sessão adicionada ao plano.');
            draw();
          },
        },
        field('Data', date),
        field('Curso', course),
        field('Minutos', minutes),
        field('Observação', note),
        error,
        el('div', { class: 'cta-row' }, el('button', { class: 'btn btn-primary', type: 'submit' }, icon('plus'), 'Adicionar ao plano')),
      ),
      items.length
        ? el(
            'ul',
            { class: 'stack-list', style: 'margin-top: 16px' },
            items.map((p) =>
              el(
                'li',
                { class: 'task-row' },
                el('span', { class: 'task-date' }, formatDay(p.date)),
                el('div', { class: 'task-main' }, el('strong', {}, courseName(p.courseId)), el('span', { class: 'muted' }, `${p.minutes} min${p.note ? ` · ${p.note}` : ''}`)),
                el(
                  'button',
                  {
                    class: 'btn btn-ghost btn-danger',
                    type: 'button',
                    'aria-label': 'Remover do plano',
                    onclick: () => {
                      if (!confirmAction('Remover esta sessão do plano?')) return;
                      update((s) => {
                        s.studyPlan = s.studyPlan.filter((x) => x.id !== p.id);
                      });
                      draw();
                    },
                  },
                  icon('trash'),
                ),
              ),
            ),
          )
        : emptyState({ title: 'Nenhuma sessão planejada.', text: 'Monte um plano por curso e por dia.' }),
    );
  };
  return { host, draw };
}

function formatDay(key) {
  return parseDay(key).toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' }).replace('.', '');
}

