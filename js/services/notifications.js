// Avisos só são criados por eventos que realmente aconteceram (aula concluída, prova feita,
// tarefa com prazo próximo, revisão pendente, meta semanal atingida).

import { getState, update, uid, dayKey } from '../store.js';
import { dueCards } from './srs.js';
import { isOverdue, isDueSoon } from './tasks.js';

export function addNotification({ key, title, text, link }) {
  const existing = getState().notifications.some((n) => n.key === key);
  if (existing) return false;
  return update((s) => {
    s.notifications.unshift({ id: uid('notif'), key, title, text, link, at: Date.now(), read: false });
    s.notifications = s.notifications.slice(0, 60);
  });
}

export function markRead(id, read = true) {
  return update((s) => {
    const item = s.notifications.find((n) => n.id === id);
    if (item) item.read = read;
  });
}

export function markAllRead() {
  return update((s) => {
    s.notifications.forEach((n) => (n.read = true));
  });
}

export function removeNotification(id) {
  return update((s) => {
    s.notifications = s.notifications.filter((n) => n.id !== id);
  });
}

// Lembretes que dependem do estado atual. Cada um tem chave diária, então não se repete no mesmo dia.
export function refreshReminders(today = new Date()) {
  const state = getState();
  const day = dayKey(today);

  for (const task of state.tasks) {
    if (task.status === 'concluida') continue;
    if (isOverdue(task, today)) {
      addNotification({
        key: `overdue:${task.id}:${day}`,
        title: 'Tarefa atrasada',
        text: `"${task.title}" passou do prazo.`,
        link: '#/tarefas',
      });
    } else if (isDueSoon(task, today)) {
      addNotification({
        key: `due:${task.id}:${day}`,
        title: 'Prazo próximo',
        text: `"${task.title}" vence em até dois dias.`,
        link: '#/tarefas',
      });
    }
  }

  const reviewCount = state.decks.reduce((sum, deck) => sum + dueCards(deck, today).length, 0);
  if (reviewCount > 0) {
    addNotification({
      key: `review:${day}`,
      title: 'Revisão programada',
      text: `${reviewCount} ${reviewCount === 1 ? 'cartão está pronto' : 'cartões estão prontos'} para revisão hoje.`,
      link: '#/flashcards',
    });
  }
}
