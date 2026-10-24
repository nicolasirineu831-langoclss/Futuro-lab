import { getState, update } from '../store.js';
import { COURSES, allLessons } from '../data/courses.js';
import { currentStreak } from './gamification.js';
import { addNotification } from './notifications.js';

// Cada conquista tem uma regra objetiva, exibida ao estudante.
export const ACHIEVEMENTS = [
  {
    id: 'primeiro-curso',
    title: 'Primeiro curso iniciado',
    rule: 'Abrir a página de um curso pela primeira vez.',
    check: (s) => s.history.some((h) => h.type === 'curso'),
  },
  {
    id: 'primeira-aula',
    title: 'Primeira aula concluída',
    rule: 'Marcar uma aula como concluída.',
    check: (s) => Object.keys(s.lessons).length > 0,
  },
  {
    id: 'primeiro-desafio',
    title: 'Primeiro exercício resolvido',
    rule: 'Passar em todos os testes de um desafio do laboratório.',
    check: (s) => Object.values(s.labs).some((lab) => lab.completedAt),
  },
  {
    id: 'primeira-avaliacao',
    title: 'Primeira avaliação realizada',
    rule: 'Enviar uma prova, aprovada ou não.',
    check: (s) => Object.values(s.quizzes).some((q) => q.attempts.length > 0),
  },
  {
    id: 'cinco-dias',
    title: 'Cinco dias de estudo',
    rule: 'Ter atividade em cinco dias seguidos.',
    check: () => currentStreak() >= 5,
  },
  {
    id: 'primeiro-projeto',
    title: 'Primeiro projeto concluído',
    rule: 'Marcar um projeto como concluído.',
    check: (s) => s.projects.some((p) => p.status === 'concluido'),
  },
  {
    id: 'curso-finalizado',
    title: 'Curso finalizado',
    rule: 'Concluir todas as aulas de um curso.',
    check: (s) => COURSES.some((c) => allLessons(c).every((l) => s.lessons[l.id])),
  },
  {
    id: 'sequencia-revisoes',
    title: 'Primeira sequência de revisões',
    rule: 'Revisar pelo menos cinco cartões em uma única sessão.',
    check: (s) => Object.values(s.activity).some((day) => (day.reviewed ?? 0) >= 5),
  },
];

// Desbloqueia o que passou a valer e avisa uma única vez por conquista.
export function syncAchievements() {
  const state = getState();
  const newlyUnlocked = ACHIEVEMENTS.filter((a) => !state.achievements.includes(a.id) && a.check(state));
  if (!newlyUnlocked.length) return [];

  update((s) => {
    for (const a of newlyUnlocked) s.achievements.push(a.id);
  });

  for (const a of newlyUnlocked) {
    addNotification({ key: `achv:${a.id}`, title: 'Conquista desbloqueada', text: a.title, link: '#/perfil' });
  }
  return newlyUnlocked;
}

export function achievementStatus() {
  const unlocked = new Set(getState().achievements);
  return ACHIEVEMENTS.map((a) => ({ ...a, unlocked: unlocked.has(a.id) }));
}
