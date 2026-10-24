import { el, icon, card, sectionTitle, tag, emptyState, pageHead, textInput, textArea, field, select, toast, confirmAction, progressBar } from '../ui.js';
import { getState, update, uid, dayKey, parseDay } from '../store.js';
import { COURSES } from '../data/courses.js';
import {
  isOverdue, isDueSoon, taskCategory, CATEGORY_LABEL, PRIORITY_LABEL, STATUS_LABEL,
  subtaskProgress, filterTasks, tasksByDay, monthGrid,
} from '../services/tasks.js';
import { awardOnce, recordActivity } from '../services/gamification.js';
import { syncAchievements } from '../services/achievements.js';
import { refreshReminders } from '../services/notifications.js';

const view = { mode: 'lista', editingId: null, selectedDay: null, month: null, filters: { deadline: 'todos', priority: 'todas', category: 'todas' } };

export function renderTasks(outlet, ctx) {
  ctx.setTitle('Tarefas');
  const today = new Date();
  if (!view.month) view.month = { y: today.getFullYear(), m: today.getMonth() };

  const formHost = el('div');
  const boardHost = el('div', { class: 'stack-list' });

  const modes = [['lista', 'Lista', 'list'], ['calendario', 'Calendário', 'calendar'], ['categorias', 'Categorias', 'columns']];
  const modeBar = el(
    'div',
    { class: 'tabs', role: 'tablist', 'aria-label': 'Visualização' },
    modes.map(([id, label, ic]) =>
      el(
        'button',
        {
          class: `tab ${view.mode === id ? 'is-active' : ''}`.trim(),
          role: 'tab',
          type: 'button',
          'aria-selected': view.mode === id ? 'true' : 'false',
          onclick: () => {
            view.mode = id;
            ctx.navigate(ctx.path);
          },
        },
        icon(ic),
        label,
      ),
    ),
  );

  const newButton = el(
    'button',
    {
      class: 'btn btn-primary',
      type: 'button',
      onclick: () => {
        view.editingId = null;
        openForm(formHost, ctx, null);
      },
    },
    icon('plus'),
    'Nova tarefa',
  );

  outlet.append(
    pageHead('Organização', 'Tarefas', 'Atividades acadêmicas com prazo, prioridade e subtarefas.'),
    el('div', { class: 'cta-row' }, newButton),
    formHost,
    card('', filterBar(ctx)),
    modeBar,
    boardHost,
  );

  const tasks = getState().tasks;
  const visible = filterTasks(tasks, view.filters, today);

  if (view.mode === 'lista') boardHost.append(listView(visible, today, ctx, formHost));
  else if (view.mode === 'calendario') boardHost.append(calendarView(tasks, today, ctx));
  else boardHost.append(categoryView(visible, today, ctx, formHost));

  if (view.editingId) {
    const task = tasks.find((t) => t.id === view.editingId);
    if (task) openForm(formHost, ctx, task);
  }

  refreshReminders(today);
}

// ---------- Filtros ----------

function filterBar(ctx) {
  const deadline = select(
    [['todos', 'Todos os prazos'], ['hoje', 'Vence hoje'], ['semana', 'Próximos 7 dias'], ['atrasadas', 'Atrasadas']],
    view.filters.deadline,
    { id: 'f-deadline' },
  );
  const priority = select([['todas', 'Todas as prioridades'], ['alta', 'Alta'], ['media', 'Média'], ['baixa', 'Baixa']], view.filters.priority, { id: 'f-priority' });
  const category = select([['todas', 'Todas as situações'], ...Object.entries(CATEGORY_LABEL)], view.filters.category, { id: 'f-category-task' });

  const change = () => {
    view.filters = { deadline: deadline.value, priority: priority.value, category: category.value };
    ctx.navigate(ctx.path);
  };
  deadline.addEventListener('change', change);
  priority.addEventListener('change', change);
  category.addEventListener('change', change);

  return el('div', { class: 'filters' }, field('Prazo', deadline), field('Prioridade', priority), field('Situação', category));
}

// ---------- Visualização em lista ----------

function taskRow(task, today, ctx, formHost) {
  const sub = subtaskProgress(task);
  const category = taskCategory(task, today);
  return el(
    'li',
    { class: `task-card ${category === 'atrasadas' ? 'is-overdue' : ''}`.trim() },
    el(
      'div',
      { class: 'task-top' },
      el('div', { class: 'row-main' }, el('strong', {}, task.title), el('span', { class: 'muted' }, courseTitle(task.courseId))),
      el('div', { class: 'tags-row' }, tag(CATEGORY_LABEL[category], category === 'atrasadas' ? 'warning' : category === 'concluidas' ? 'success' : ''), tag(PRIORITY_LABEL[task.priority]), task.demo ? tag('Exemplo') : null),
    ),
    el(
      'div',
      { class: 'task-meta muted' },
      task.due ? el('span', {}, `Prazo: ${formatDay(task.due)}`) : el('span', {}, 'Sem prazo'),
      task.estimate ? el('span', {}, `Estimativa: ${task.estimate} min`) : null,
    ),
    isOverdue(task, today) ? el('p', { class: 'warn-text' }, icon('alert'), ' Passou do prazo.') : isDueSoon(task, today) ? el('p', { class: 'soon-text' }, icon('clock'), ' Prazo próximo.') : null,
    sub ? progressBar(sub.percent, `Subtarefas: ${sub.done} de ${sub.total}`) : null,
    task.description ? el('p', { class: 'muted' }, task.description) : null,
    el(
      'div',
      { class: 'cta-row' },
      task.status !== 'concluida'
        ? el('button', { class: 'btn btn-primary', type: 'button', onclick: () => complete(task, ctx) }, icon('tick'), 'Concluir')
        : el('button', { class: 'btn btn-ghost', type: 'button', onclick: () => reopen(task, ctx) }, 'Reabrir'),
      el('button', { class: 'btn btn-ghost', type: 'button', onclick: () => { view.editingId = task.id; ctx.navigate(ctx.path); } }, icon('edit'), 'Editar'),
      el('button', { class: 'btn btn-ghost btn-danger', type: 'button', onclick: () => remove(task, ctx) }, icon('trash'), 'Excluir'),
    ),
  );
}

function listView(tasks, today, ctx, formHost) {
  if (!tasks.length) {
    return emptyState({ title: 'Nenhuma tarefa com esses filtros.', text: 'Crie uma nova tarefa ou ajuste os filtros.' });
  }
  return el('ul', { class: 'stack-list' }, tasks.map((t) => taskRow(t, today, ctx, formHost)));
}

// ---------- Categorias (colunas) ----------

function categoryView(tasks, today, ctx, formHost) {
  const columns = ['a-fazer', 'em-andamento', 'concluidas', 'atrasadas'];
  return el(
    'div',
    { class: 'board' },
    columns.map((col) => {
      const items = tasks.filter((t) => taskCategory(t, today) === col);
      return el(
        'section',
        { class: 'board-col', 'aria-label': CATEGORY_LABEL[col] },
        el('h2', { class: 'board-title' }, CATEGORY_LABEL[col], el('span', { class: 'count' }, String(items.length))),
        items.length
          ? el('ul', { class: 'stack-list' }, items.map((t) => taskRow(t, today, ctx, formHost)))
          : el('p', { class: 'muted' }, 'Nada aqui.'),
      );
    }),
  );
}

// ---------- Calendário mensal ----------

function calendarView(tasks, today, ctx) {
  const { y, m } = view.month;
  const byDay = tasksByDay(tasks);
  const weeks = monthGrid(y, m);
  const todayKey = dayKey(today);
  const monthName = new Date(y, m, 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

  const move = (delta) => {
    const d = new Date(y, m + delta, 1);
    view.month = { y: d.getFullYear(), m: d.getMonth() };
    view.selectedDay = null;
    ctx.navigate(ctx.path);
  };

  const grid = el(
    'table',
    { class: 'calendar', 'aria-label': `Calendário de ${monthName}` },
    el('thead', {}, el('tr', {}, ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((d) => el('th', { scope: 'col' }, d)))),
    el(
      'tbody',
      {},
      weeks.map((week) =>
        el(
          'tr',
          {},
          week.map((day) => {
            if (!day) return el('td', { class: 'is-empty' });
            const list = byDay[day] ?? [];
            const selected = view.selectedDay === day;
            return el(
              'td',
              { class: `${day === todayKey ? 'is-today' : ''} ${selected ? 'is-selected' : ''}`.trim() },
              el(
                'button',
                {
                  class: 'day-btn',
                  type: 'button',
                  'aria-pressed': selected ? 'true' : 'false',
                  'aria-label': `${formatDay(day)}, ${list.length} tarefa(s)`,
                  onclick: () => {
                    view.selectedDay = selected ? null : day;
                    ctx.navigate(ctx.path);
                  },
                },
                el('span', {}, String(parseDay(day).getDate())),
                list.length ? el('span', { class: 'dot', 'aria-hidden': 'true' }, String(list.length)) : null,
              ),
            );
          }),
        ),
      ),
    ),
  );

  const dayList = view.selectedDay
    ? el(
        'div',
        { class: 'day-panel' },
        el('h2', {}, `Tarefas de ${formatDay(view.selectedDay)}`),
        (byDay[view.selectedDay] ?? []).length
          ? el('ul', { class: 'stack-list' }, (byDay[view.selectedDay] ?? []).map((t) => taskRow(t, today, ctx, el('div'))))
          : el('p', { class: 'muted' }, 'Nenhuma tarefa com prazo neste dia.'),
      )
    : el('p', { class: 'muted' }, 'Toque em um dia para ver as tarefas com prazo nele.');

  return el(
    'div',
    { class: 'stack-list' },
    el(
      'div',
      { class: 'cal-head' },
      el('button', { class: 'btn btn-ghost', type: 'button', 'aria-label': 'Mês anterior', onclick: () => move(-1) }, icon('chevronLeft')),
      el('strong', { 'aria-live': 'polite' }, monthName),
      el('button', { class: 'btn btn-ghost', type: 'button', 'aria-label': 'Próximo mês', onclick: () => move(1) }, icon('chevronRight')),
    ),
    el('div', { class: 'table-wrap' }, grid),
    dayList,
  );
}

// ---------- Formulário ----------

function openForm(host, ctx, task) {
  const isEdit = Boolean(task);
  const draft = task
    ? { ...task, subtasks: task.subtasks.map((s) => ({ ...s })) }
    : { title: '', description: '', courseId: '', due: '', priority: 'media', status: 'a-fazer', estimate: '', subtasks: [], notes: '' };

  const title = textInput({ id: 'task-title', maxlength: '100', value: draft.title, placeholder: 'Ex.: Resolver a lista de condicionais' });
  const description = textArea(draft.description, { id: 'task-desc', rows: '3', maxlength: '500' });
  const course = select([['', 'Sem curso'], ...COURSES.map((c) => [c.id, c.title])], draft.courseId ?? '', { id: 'task-course' });
  const due = el('input', { type: 'date', id: 'task-due', class: 'control', value: draft.due ?? '' });
  const priority = select([['alta', 'Alta'], ['media', 'Média'], ['baixa', 'Baixa']], draft.priority, { id: 'task-priority' });
  const status = select([['a-fazer', 'A fazer'], ['em-andamento', 'Em andamento'], ['concluida', 'Concluída']], draft.status, { id: 'task-status' });
  const estimate = el('input', { type: 'number', min: '0', max: '1000', id: 'task-estimate', class: 'control', value: draft.estimate ?? '' });
  const notes = textArea(draft.notes ?? '', { id: 'task-notes', rows: '2', maxlength: '500' });
  const error = el('p', { class: 'field-error', role: 'alert' });

  const subList = el('ul', { class: 'stack-list', 'aria-label': 'Subtarefas' });
  const renderSubs = () => {
    subList.replaceChildren(
      ...draft.subtasks.map((s, i) =>
        el(
          'li',
          { class: 'sub-row' },
          el('label', { class: 'check' }, el('input', { type: 'checkbox', checked: s.done ? true : null, onchange: (e) => { draft.subtasks[i].done = e.target.checked; } }), el('span', {}, s.title)),
          el('button', { class: 'btn btn-ghost btn-danger', type: 'button', 'aria-label': `Remover subtarefa ${s.title}`, onclick: () => { draft.subtasks.splice(i, 1); renderSubs(); } }, icon('x')),
        ),
      ),
    );
    if (!draft.subtasks.length) subList.append(el('li', { class: 'muted' }, 'Nenhuma subtarefa.'));
  };
  const subInput = textInput({ id: 'sub-new', maxlength: '80', placeholder: 'Nova subtarefa' });
  const addSub = () => {
    const value = subInput.value.trim();
    if (!value) return;
    draft.subtasks.push({ id: uid('sub'), title: value, done: false });
    subInput.value = '';
    renderSubs();
    subInput.focus();
  };
  renderSubs();

  const cancel = () => {
    view.editingId = null;
    host.replaceChildren();
  };

  host.replaceChildren(
    card(
      's-12',
      sectionTitle(isEdit ? 'Editar tarefa' : 'Nova tarefa'),
      el(
        'form',
        {
          class: 'stack-form',
          novalidate: true,
          onsubmit: (event) => {
            event.preventDefault();
            error.textContent = '';
            if (!title.value.trim()) {
              error.textContent = 'Dê um título à tarefa.';
              title.focus();
              return;
            }
            if (due.value && isNaN(parseDay(due.value))) {
              error.textContent = 'Data de prazo inválida.';
              return;
            }
            const estimateNumber = estimate.value === '' ? null : Number(estimate.value);
            if (estimateNumber !== null && (!Number.isFinite(estimateNumber) || estimateNumber < 0)) {
              error.textContent = 'O tempo estimado deve ser um número de minutos, zero ou maior.';
              estimate.focus();
              return;
            }

            const pendingSub = subInput.value.trim();
            if (pendingSub) draft.subtasks.push({ id: uid('sub'), title: pendingSub, done: false });

            const finalStatus = status.value;
            const taskId = task?.id ?? uid('task');
            const saved = update((s) => {
              const entry = {
                id: taskId,
                demo: task?.demo ?? false,
                title: title.value.trim(),
                description: description.value.trim(),
                courseId: course.value || null,
                createdAt: task?.createdAt ?? dayKey(),
                due: due.value || null,
                priority: priority.value,
                status: finalStatus,
                estimate: estimateNumber,
                subtasks: draft.subtasks,
                notes: notes.value.trim(),
                completedAt: finalStatus === 'concluida' ? (task?.completedAt ?? Date.now()) : null,
              };
              const index = s.tasks.findIndex((t) => t.id === entry.id);
              if (index !== -1) s.tasks[index] = entry;
              else s.tasks.push(entry);
            });
            if (!saved) {
              error.textContent = 'Não foi possível salvar neste navegador.';
              return;
            }
            if (finalStatus === 'concluida') awardOnce(`task:${taskId}`, 15);
            toast(isEdit ? 'Tarefa atualizada.' : 'Tarefa criada.');
            cancel();
            ctx.navigate(ctx.path);
          },
        },
        field('Título', title),
        field('Descrição', description),
        field('Curso relacionado', course),
        el(
          'div',
          { class: 'form-row' },
          field('Prazo', due),
          field('Prioridade', priority),
          field('Situação', status),
          field('Tempo estimado (min)', estimate),
        ),
        el('fieldset', { class: 'subtasks' }, el('legend', {}, 'Subtarefas'), subList, el('div', { class: 'cta-row' }, subInput, el('button', { class: 'btn btn-ghost', type: 'button', onclick: addSub }, 'Adicionar'))),
        field('Observações', notes),
        error,
        el('div', { class: 'cta-row' }, el('button', { class: 'btn btn-primary', type: 'submit' }, isEdit ? 'Salvar alterações' : 'Criar tarefa'), el('button', { class: 'btn btn-ghost', type: 'button', onclick: cancel }, 'Cancelar')),
      ),
    ),
  );
  title.focus();
}

// ---------- Ações ----------

function complete(task, ctx) {
  const saved = update((s) => {
    const t = s.tasks.find((x) => x.id === task.id);
    if (!t) return;
    t.status = 'concluida';
    t.completedAt = Date.now();
  });
  if (!saved) {
    toast('Não foi possível concluir a tarefa.', 'error');
    return;
  }
  const isNew = awardOnce(`task:${task.id}`, 15);
  recordActivity({});
  syncAchievements();
  toast(isNew ? 'Tarefa concluída: +15 XP.' : 'Tarefa concluída.');
  ctx.navigate(ctx.path);
}

function reopen(task, ctx) {
  update((s) => {
    const t = s.tasks.find((x) => x.id === task.id);
    if (!t) return;
    t.status = 'em-andamento';
    t.completedAt = null;
  });
  toast('Tarefa reaberta. O XP já recebido é mantido.');
  ctx.navigate(ctx.path);
}

function remove(task, ctx) {
  if (!confirmAction(`Excluir a tarefa "${task.title}"? Essa ação não pode ser desfeita.`)) return;
  update((s) => {
    s.tasks = s.tasks.filter((t) => t.id !== task.id);
  });
  toast('Tarefa excluída.');
  ctx.navigate(ctx.path);
}

function courseTitle(id) {
  return COURSES.find((c) => c.id === id)?.title ?? 'Sem curso relacionado';
}

function formatDay(key) {
  return parseDay(key).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }).replace('.', '');
}
