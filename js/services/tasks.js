import { dayKey, parseDay } from '../store.js';

export const PRIORITY_LABEL = { alta: 'Alta', media: 'Média', baixa: 'Baixa' };
export const STATUS_LABEL = { 'a-fazer': 'A fazer', 'em-andamento': 'Em andamento', concluida: 'Concluída' };

// Atrasada é derivada: não concluída e com prazo anterior a hoje.
export function isOverdue(task, today = new Date()) {
  return task.status !== 'concluida' && Boolean(task.due) && task.due < dayKey(today);
}

// Prazo próximo: vence hoje ou em até dois dias.
export function isDueSoon(task, today = new Date()) {
  if (task.status === 'concluida' || !task.due || isOverdue(task, today)) return false;
  const diff = (parseDay(task.due) - parseDay(dayKey(today))) / 86400000;
  return diff >= 0 && diff <= 2;
}

// Categoria exibida: Atrasadas tem prioridade sobre a situação salva.
export function taskCategory(task, today = new Date()) {
  if (isOverdue(task, today)) return 'atrasadas';
  if (task.status === 'concluida') return 'concluidas';
  if (task.status === 'em-andamento') return 'em-andamento';
  return 'a-fazer';
}

export const CATEGORY_LABEL = {
  'a-fazer': 'A fazer',
  'em-andamento': 'Em andamento',
  concluidas: 'Concluídas',
  atrasadas: 'Atrasadas',
};

export function subtaskProgress(task) {
  if (!task.subtasks?.length) return null;
  const done = task.subtasks.filter((s) => s.done).length;
  return { done, total: task.subtasks.length, percent: Math.round((done / task.subtasks.length) * 100) };
}

// Filtros: prazo ('todos' | 'hoje' | 'semana' | 'atrasadas'), prioridade ('todas' | 'alta' | ...), situação ('todas' | categoria).
export function filterTasks(tasks, { deadline = 'todos', priority = 'todas', category = 'todas' } = {}, today = new Date()) {
  const todayKey = dayKey(today);
  const weekKey = dayKey(new Date(today.getFullYear(), today.getMonth(), today.getDate() + 7));

  return tasks
    .filter((task) => {
      if (priority !== 'todas' && task.priority !== priority) return false;
      if (category !== 'todas' && taskCategory(task, today) !== category) return false;
      if (deadline === 'hoje' && task.due !== todayKey) return false;
      if (deadline === 'semana' && !(task.due && task.due >= todayKey && task.due <= weekKey)) return false;
      if (deadline === 'atrasadas' && !isOverdue(task, today)) return false;
      return true;
    })
    .sort((a, b) => {
      const aDue = a.due ?? '9999-12-31';
      const bDue = b.due ?? '9999-12-31';
      return aDue.localeCompare(bDue);
    });
}

// Agrupa tarefas por dia (para a visualização de calendário).
export function tasksByDay(tasks) {
  const map = {};
  for (const task of tasks) {
    if (!task.due) continue;
    (map[task.due] ??= []).push(task);
  }
  return map;
}

export function monthGrid(year, month) {
  // Retorna semanas (arrays de 7 dias, ou null para células vazias) do mês informado.
  const first = new Date(year, month, 1);
  const lead = first.getDay();
  const days = new Date(year, month + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < lead; i += 1) cells.push(null);
  for (let d = 1; d <= days; d += 1) cells.push(dayKey(new Date(year, month, d)));
  while (cells.length % 7) cells.push(null);
  const weeks = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}
