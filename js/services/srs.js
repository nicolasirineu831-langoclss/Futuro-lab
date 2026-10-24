// Revisão espaçada simplificada, inspirada no SM-2:
// - "Revisar" (não lembrei): volta amanhã e reduz a facilidade do cartão.
// - "Aprendi": o intervalo cresce (1, 3, depois intervalo x facilidade).
import { dayKey, dayOffset } from '../store.js';

export function scheduleCard(card, knew, today = new Date()) {
  const next = { ...card };
  if (knew) {
    next.reps += 1;
    if (next.reps === 1) next.interval = 1;
    else if (next.reps === 2) next.interval = 3;
    else next.interval = Math.round(next.interval * next.ease);
    next.ease = Math.min(3.0, next.ease + 0.05);
  } else {
    next.reps = 0;
    next.interval = 1;
    next.ease = Math.max(1.3, next.ease - 0.2);
  }
  next.due = dayOffset(next.interval, today);
  next.lastReviewed = dayKey(today);
  return next;
}

// Cartões com revisão devida hoje ou atrasada.
export function dueCards(deck, today = new Date()) {
  const todayKey = dayKey(today);
  return deck.cards.filter((card) => card.due <= todayKey);
}
