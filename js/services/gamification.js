// Regras de pontuação transparentes. Cada evento só concede XP uma vez (chave única),
// então repetir uma ação não gera pontos extras.

import { getState, update, dayKey, dayOffset, parseDay } from '../store.js';

export const XP_RULES = {
  lesson: { xp: 10, label: 'Aula concluída' },
  quizPass: { xp: 30, label: 'Prova aprovada pela primeira vez (70% ou mais)' },
  lab: { xp: 25, label: 'Desafio de código resolvido pela primeira vez' },
  task: { xp: 15, label: 'Tarefa concluída' },
  project: { xp: 40, label: 'Projeto concluído' },
  focus: { xp: 5, label: 'Sessão de foco de 25 minutos concluída' },
  review: { xp: 10, label: 'Revisão de flashcards com 5 cartões ou mais, uma vez por dia' },
};

export function awardOnce(eventKey, xp) {
  const state = getState();
  if (state.xp.events[eventKey] !== undefined) return false;
  update((s) => {
    s.xp.events[eventKey] = xp;
  });
  return true;
}

export function totalXp() {
  return Object.values(getState().xp.events).reduce((sum, value) => sum + value, 0);
}

export function levelInfo(xp = totalXp()) {
  const level = Math.floor(xp / 100) + 1;
  const into = xp % 100;
  return { level, into, next: 100 };
}

// Registra atividade do dia (usada para sequência e para o gráfico semanal).
export function recordActivity({ minutes = 0, reviewed = 0 } = {}) {
  const key = dayKey();
  update((s) => {
    const day = s.activity[key] ?? { minutes: 0, actions: 0, reviewed: 0 };
    day.minutes += minutes;
    day.reviewed = (day.reviewed ?? 0) + reviewed;
    day.actions += 1;
    s.activity[key] = day;
  });
}

export function weekActivity(today = new Date()) {
  const days = [];
  for (let i = 6; i >= 0; i -= 1) {
    const key = dayOffset(-i, today);
    const entry = getState().activity[key];
    const date = parseDay(key);
    const label = date.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '');
    days.push({
      key,
      label: label.charAt(0).toUpperCase() + label.slice(1),
      minutes: entry?.minutes ?? 0,
      actions: entry?.actions ?? 0,
      isToday: i === 0,
    });
  }
  return days;
}

// Sequência: dias seguidos com alguma atividade. Se hoje ainda não teve nada, conta a partir de ontem.
export function currentStreak(today = new Date()) {
  const activity = getState().activity;
  let streak = 0;
  let offset = 0;
  if (!activity[dayKey(today)]?.actions) offset = -1;
  while (activity[dayOffset(offset, today)]?.actions) {
    streak += 1;
    offset -= 1;
  }
  return streak;
}

export function weeklyMinutes(today = new Date()) {
  return weekActivity(today).reduce((sum, day) => sum + day.minutes, 0);
}
