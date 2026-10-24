import { update } from '../store.js';

// Histórico de consulta: um item por (tipo, id), sempre com a visita mais recente.
export function recordHistory(type, id) {
  update((s) => {
    s.history = s.history.filter((h) => !(h.type === type && h.id === id));
    s.history.unshift({ type, id, at: Date.now() });
    s.history = s.history.slice(0, 40);
  });
}
