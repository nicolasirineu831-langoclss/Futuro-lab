import { el, icon, card, sectionTitle, avatar, notice, pageHead, tag, toast, confirmAction, progressBar } from '../ui.js';
import { getState, exportData, resetAll, removeDemoData } from '../store.js';
import { nameForm } from '../forms.js';
import { COURSES } from '../data/courses.js';
import { courseStatus, courseProgress } from '../services/progress.js';
import { currentStreak, totalXp, levelInfo } from '../services/gamification.js';
import { achievementStatus } from '../services/achievements.js';

function download(filename, text) {
  const blob = new Blob([text], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = el('a', { href: url, download: filename });
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function renderProfile(outlet, ctx) {
  ctx.setTitle('Perfil');
  const state = getState();
  const started = COURSES.filter((c) => courseStatus(c) !== 'nao-iniciado');
  const completed = COURSES.filter((c) => courseStatus(c) === 'concluido');
  const achievements = achievementStatus();
  const unlocked = achievements.filter((a) => a.unlocked).length;
  const level = levelInfo(totalXp());
  const hasExamples = state.tasks.some((t) => t.demo) || state.decks.some((d) => d.demo) || state.projects.some((p) => p.demo);

  const identity = card(
    's-12',
    el(
      'div',
      { class: 'profile-hero' },
      avatar(state.profile.name),
      el('div', {}, el('h2', {}, state.profile.name || 'Nome não definido'), el('span', { class: 'muted' }, `Nível ${level.level} · ${totalXp()} XP`)),
    ),
    progressBar(Math.round((level.into / level.next) * 100), `Progresso para o nível ${level.level + 1}`),
  );

  const summary = card(
    's-6',
    sectionTitle('Resumo'),
    el(
      'dl',
      { class: 'stat-list' },
      [
        ['Cursos iniciados', String(started.length)],
        ['Cursos concluídos', String(completed.length)],
        ['Sequência de estudo', `${currentStreak()} dia(s)`],
        ['Conquistas', `${unlocked} de ${achievements.length}`],
        ['Tarefas concluídas', String(state.tasks.filter((t) => t.status === 'concluida').length)],
        ['Projetos concluídos', String(state.projects.filter((p) => p.status === 'concluido').length)],
      ].map(([label, value]) => el('div', { class: 'kv' }, el('dt', { class: 'muted' }, label), el('dd', { style: 'margin: 0' }, el('strong', {}, value)))),
    ),
  );

  const courseList = card(
    's-6',
    sectionTitle('Progresso por curso'),
    started.length
      ? el('ul', { class: 'stack-list' }, started.map((c) => el('li', { class: 'row-main' }, el('strong', {}, c.title), progressBar(courseProgress(c), 'Aulas concluídas'))))
      : el('p', { class: 'muted' }, 'Nenhum curso iniciado ainda.'),
  );

  const achievementsCard = card(
    's-12',
    sectionTitle('Conquistas', el('small', {}, `${unlocked} de ${achievements.length}`)),
    el(
      'ul',
      { class: 'stack-list' },
      achievements.map((a) =>
        el('li', { class: `achv ${a.unlocked ? '' : 'is-locked'}`.trim() }, el('span', { class: 'achv-icon', 'aria-hidden': 'true' }, icon(a.unlocked ? 'award' : 'lock')), el('div', {}, el('strong', {}, a.title), el('small', {}, a.rule))),
      ),
    ),
  );

  const nameCard = card(
    's-6',
    sectionTitle('Nome de exibição'),
    nameForm({ value: state.profile.name, onSaved: () => ctx.navigate('/perfil') }),
  );

  const dataCard = card(
    's-6',
    sectionTitle('Seus dados'),
    el('p', { class: 'muted' }, 'Tudo fica salvo neste navegador. Você pode baixar uma cópia ou apagar tudo a qualquer momento.'),
    el(
      'div',
      { class: 'cta-row' },
      el('button', {
        class: 'btn btn-ghost',
        type: 'button',
        onclick: () => {
          download(`futurolab-dados-${new Date().toISOString().slice(0, 10)}.json`, exportData());
          toast('Cópia dos dados preparada para download.');
        },
      }, icon('download'), 'Baixar cópia dos dados'),
    ),
    hasExamples
      ? el(
          'div',
          { class: 'cta-row' },
          el('button', {
            class: 'btn btn-ghost',
            type: 'button',
            onclick: () => {
              if (!confirmAction('Remover os exemplos (tarefas, cartões e projeto de demonstração)? Seus itens não serão afetados.')) return;
              removeDemoData();
              toast('Exemplos removidos.');
              ctx.navigate(ctx.path);
            },
          }, 'Remover exemplos'),
        )
      : null,
    el(
      'div',
      { class: 'cta-row' },
      el('button', {
        class: 'btn btn-ghost btn-danger',
        type: 'button',
        onclick: () => {
          if (!confirmAction('Apagar TODOS os dados deste navegador? Progresso, anotações, tarefas e configurações serão perdidos. Esta ação não pode ser desfeita.')) return;
          resetAll();
          toast('Dados apagados neste navegador.');
          ctx.navigate('/');
        },
      }, icon('trash'), 'Apagar todos os dados'),
    ),
  );

  const accountNotice = notice(
    'info',
    'Esta versão não tem conta online: não há login, senha nem sincronização entre aparelhos. Os dados ficam apenas neste navegador. Para contas reais, é preciso um backend com autenticação no servidor.',
    'info',
  );

  outlet.append(
    pageHead('Sua conta neste aparelho', 'Perfil'),
    accountNotice,
    el('div', { class: 'dash-grid' }, identity, summary, courseList, nameCard, dataCard, achievementsCard),
    el('p', { class: 'help' }, tag('XP', 'accent'), ' Os pontos são concedidos uma única vez por ação. Desfazer uma conclusão não retira o XP já recebido.'),
  );
}
