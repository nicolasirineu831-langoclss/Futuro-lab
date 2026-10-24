import { el, icon, card, sectionTitle, progressBar, tag, emptyState, notice, formatMinutes, timeGreeting } from '../ui.js';
import { getState } from '../store.js';
import { nameForm } from '../forms.js';
import { COURSES, findLesson } from '../data/courses.js';
import { courseProgress, courseStatus, startedCourses, nextPendingLesson } from '../services/progress.js';
import { weekActivity, currentStreak, weeklyMinutes, levelInfo, totalXp } from '../services/gamification.js';
import { achievementStatus } from '../services/achievements.js';
import { isOverdue, isDueSoon, subtaskProgress, STATUS_LABEL } from '../services/tasks.js';
import { dueCards } from '../services/srs.js';

function statCard(iconName, value, label) {
  return card(
    'stat',
    el('span', { class: 'stat-icon', 'aria-hidden': 'true' }, icon(iconName)),
    el('strong', {}, value),
    el('span', {}, label),
  );
}

export function renderDashboard(outlet, ctx) {
  ctx.setTitle('Início');
  const state = getState();
  const today = new Date();

  const streak = currentStreak(today);
  const week = weekActivity(today);
  const weekMin = weeklyMinutes(today);
  const maxMinutes = Math.max(60, ...week.map((d) => d.minutes));
  const started = startedCourses();
  const goal = state.profile.weeklyGoalMinutes || 0;
  const goalPercent = goal ? Math.min(100, Math.round((weekMin / goal) * 100)) : 0;
  const level = levelInfo(totalXp());
  const achievements = achievementStatus();
  const unlocked = achievements.filter((a) => a.unlocked).length;
  const reviewCount = state.decks.reduce((sum, d) => sum + dueCards(d, today).length, 0);

  // Continuar de onde parou: última aula aberta, se ainda existir; senão, a próxima pendente.
  let continueTarget = null;
  if (state.lastLesson) {
    const found = findLesson(state.lastLesson.courseId, state.lastLesson.lessonId);
    if (found) continueTarget = { course: found.course, lesson: found.lesson };
  }
  if (!continueTarget && started.length) {
    const course = started[0];
    const next = nextPendingLesson(course);
    if (next) continueTarget = { course, lesson: next };
  }

  const hero = card(
    'hero s-8',
    el('p', { class: 'lead' }, 'Continue de onde parou'),
    continueTarget
      ? el(
          'div',
          { class: 'hero-body' },
          el(
            'div',
            {},
            el('h2', { class: 'hero-title' }, continueTarget.lesson.title),
            el('p', { class: 'muted' }, `${continueTarget.course.title}`),
            el(
              'div',
              { class: 'hero-actions' },
              el('a', { class: 'btn btn-primary', href: `#/aula/${continueTarget.course.id}/${continueTarget.lesson.id}` }, 'Abrir aula'),
              el('a', { class: 'btn btn-ghost', href: `#/cursos/${continueTarget.course.id}` }, 'Ver curso'),
            ),
          ),
          el(
            'div',
            {},
            progressBar(courseProgress(continueTarget.course), 'Progresso do curso'),
          ),
        )
      : emptyState({
          title: 'Nenhuma aula iniciada ainda.',
          text: 'Escolha um curso no catálogo para começar sua primeira aula.',
          action: { label: 'Ver cursos', href: '#/cursos' },
        }),
  );

  const motivation = card(
    'motivation s-4',
    el('span', { class: 'stat-icon', 'aria-hidden': 'true' }, icon('trend')),
    el('h2', { style: 'margin-top: 14px' }, 'Para o futuro do trabalho'),
    el(
      'p',
      { class: 'muted', style: 'margin-top: 8px' },
      'A automação muda tarefas, mas também cria funções para quem entende programação, dados e processos. Aprender a criar e supervisionar sistemas ajuda você a participar dessa transição.',
    ),
    el('a', { class: 'link-more', href: '#/carreiras' }, 'Ver carreiras e requalificação'),
  );

  const stats = el(
    'section',
    { class: 's-12', 'aria-label': 'Resumo' },
    el(
      'div',
      { class: 'stats' },
      statCard('flame', `${streak} ${streak === 1 ? 'dia' : 'dias'}`, 'Sequência de estudo'),
      statCard('clock', formatMinutes(weekMin), 'Foco nesta semana'),
      statCard('award', `Nível ${level.level}`, `${level.into} de ${level.next} XP`),
      statCard('book', `${unlocked} de ${achievements.length}`, 'Conquistas desbloqueadas'),
    ),
  );

  const weekly = card(
    's-5',
    sectionTitle('Atividade da semana', el('small', {}, `Meta: ${goal ? formatMinutes(goal) : 'não definida'}`)),
    el(
      'div',
      {
        class: 'bars',
        role: 'img',
        'aria-label': `Minutos de foco por dia: ${week.map((d) => `${d.label} ${d.minutes}`).join(', ')}`,
      },
      week.map((day) =>
        el(
          'div',
          { class: 'bar-col' },
          el('div', {
            class: `bar ${day.isToday ? 'is-today' : ''}`.trim(),
            style: `height: ${Math.round((day.minutes / maxMinutes) * 100)}%`,
            title: `${day.minutes} min`,
          }),
          el('span', { class: 'bar-label' }, day.label),
        ),
      ),
    ),
    goal ? progressBar(goalPercent, 'Meta semanal de foco') : el('a', { class: 'link-more', href: '#/planejador' }, 'Definir meta semanal'),
    reviewCount ? el('a', { class: 'link-more', href: '#/flashcards' }, `${reviewCount} cartões para revisar hoje`) : null,
  );

  const continueCard = card(
    's-7',
    sectionTitle('Seus cursos'),
    started.length
      ? el(
          'ul',
          { class: 'stack-list' },
          started.map((course) =>
            el(
              'li',
              {},
              el(
                'a',
                { class: 'row-link', href: `#/cursos/${course.id}` },
                el(
                  'div',
                  { class: 'row-main' },
                  el('strong', {}, course.title),
                  el('span', { class: 'muted' }, `${course.category} · ${courseStatus(course) === 'concluido' ? 'Concluído' : 'Em andamento'}`),
                ),
                progressBar(courseProgress(course), 'Progresso'),
              ),
            ),
          ),
        )
      : emptyState({ title: 'Nenhum curso iniciado.', text: 'Abra um curso para começar.', action: { label: 'Ver cursos', href: '#/cursos' } }),
  );

  // Tarefas: as mais urgentes primeiro (atrasadas, depois com prazo próximo)
  const pendingTasks = state.tasks
    .filter((t) => t.status !== 'concluida')
    .sort((a, b) => (a.due ?? '9999').localeCompare(b.due ?? '9999'))
    .slice(0, 4);

  const tasksCard = card(
    's-7',
    sectionTitle('Próximas tarefas'),
    pendingTasks.length
      ? el(
          'ul',
          { class: 'stack-list' },
          pendingTasks.map((task) => {
            const sub = subtaskProgress(task);
            return el(
              'li',
              { class: 'task-row' },
              el('div', { class: 'task-main' }, el('strong', {}, task.title), el('span', { class: 'muted' }, sub ? `${STATUS_LABEL[task.status]} · ${sub.done}/${sub.total} subtarefas` : STATUS_LABEL[task.status])),
              el(
                'div',
                { class: 'task-side' },
                isOverdue(task, today) ? tag('Atrasada', 'warning') : isDueSoon(task, today) ? tag('Prazo próximo', 'accent') : null,
                task.demo ? tag('Exemplo') : null,
              ),
            );
          }),
        )
      : emptyState({ title: 'Nenhuma tarefa pendente.', text: 'Crie uma tarefa para organizar seus estudos.', action: { label: 'Abrir tarefas', href: '#/tarefas' } }),
    el('a', { class: 'link-more', href: '#/tarefas' }, 'Ver todas as tarefas'),
  );

  const shortcuts = card(
    's-5',
    sectionTitle('Atalhos'),
    el(
      'nav',
      { class: 'shortcuts', 'aria-label': 'Atalhos para áreas da plataforma' },
      [
        ['Laboratório', '#/laboratorio', 'code'],
        ['Provas', '#/provas', 'flag'],
        ['Flashcards', '#/flashcards', 'layers'],
        ['Projetos', '#/projetos', 'briefcase'],
      ].map(([label, href, iconName]) => el('a', { class: 'shortcut', href }, icon(iconName), el('span', {}, label))),
    ),
  );

  const recommended = COURSES.filter((c) => courseStatus(c) === 'nao-iniciado').slice(0, 3);
  const recommendations = card(
    's-7',
    sectionTitle('Recomendados para você'),
    recommended.length
      ? el(
          'ul',
          { class: 'stack-list' },
          recommended.map((course) =>
            el(
              'li',
              {},
              el(
                'a',
                { class: 'course-row', href: `#/cursos/${course.id}` },
                el('strong', {}, course.title),
                el('div', { class: 'tags-row' }, tag(course.level), tag(`${course.hours} h`), tag(course.category, 'primary')),
              ),
            ),
          ),
        )
      : emptyState({ title: 'Você já iniciou todos os cursos.', text: 'Confira seu progresso no perfil.' }),
  );

  const lastQuiz = Object.entries(state.quizzes)
    .flatMap(([quizId, q]) => q.attempts.map((a) => ({ quizId, ...a })))
    .sort((a, b) => b.at - a.at)
    .slice(0, 3);

  const performance = card(
    's-5',
    sectionTitle('Desempenho recente'),
    lastQuiz.length
      ? el(
          'ul',
          { class: 'stack-list' },
          lastQuiz.map((a) => {
            const title = COURSES.find((c) => c.quiz.id === a.quizId)?.quiz.title ?? 'Prova';
            return el(
              'li',
              { class: 'achv' },
              el('div', {}, el('strong', {}, title), el('small', {}, `${a.score} de ${a.total} corretas (${a.percent}%)`)),
              tag(a.percent >= 70 ? 'Aprovado' : 'Revisar', a.percent >= 70 ? 'success' : 'warning'),
            );
          }),
        )
      : emptyState({ title: 'Nenhuma prova realizada ainda.', text: 'Os resultados aparecem aqui depois da primeira prova.' }),
  );

  const achievementsCard = card(
    's-7',
    sectionTitle('Conquistas', el('small', {}, `${unlocked} de ${achievements.length}`)),
    el(
      'ul',
      { class: 'stack-list' },
      achievements.slice(0, 5).map((item) =>
        el(
          'li',
          { class: `achv ${item.unlocked ? '' : 'is-locked'}`.trim() },
          el('span', { class: 'achv-icon', 'aria-hidden': 'true' }, icon(item.unlocked ? 'award' : 'lock')),
          el('div', {}, el('strong', {}, item.title), el('small', {}, item.rule)),
        ),
      ),
    ),
  );

  const nameCard = state.profile.name
    ? null
    : card('s-12', sectionTitle('Como você quer ser chamado?'), el('p', { class: 'muted', style: 'margin-bottom: 14px' }, 'Seu nome aparece na saudação e no perfil.'), nameForm({ onSaved: () => ctx.navigate(ctx.path) }));

  const hasExamples = state.tasks.some((t) => t.demo) || state.decks.some((d) => d.demo) || state.projects.some((p) => p.demo);
  const exampleNotice = hasExamples
    ? notice('info', 'Alguns itens são exemplos para você explorar. Você pode removê-los em Perfil, na seção de dados.', 'info')
    : null;

  outlet.append(
    el(
      'header',
      { class: 'page-head' },
      el('h1', {}, `${timeGreeting()}${state.profile.name ? `, ${state.profile.name}` : ''}`),
      el('p', { class: 'muted' }, `Você tem ${totalXp()} XP acumulados. Cada passo conta.`),
    ),
    exampleNotice,
    nameCard,
    el(
      'div',
      { class: 'dash-grid' },
      hero,
      motivation,
      stats,
      weekly,
      continueCard,
      tasksCard,
      shortcuts,
      recommendations,
      performance,
      achievementsCard,
    ),
  );

}
