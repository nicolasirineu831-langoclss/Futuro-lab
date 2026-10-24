import { el, icon, card, sectionTitle, tag, emptyState, pageHead, textInput, textArea, field, toast, confirmAction, progressBar, select } from '../ui.js';
import { getState, update, uid } from '../store.js';
import { awardOnce } from '../services/gamification.js';
import { syncAchievements } from '../services/achievements.js';
import { addNotification } from '../services/notifications.js';

export const PROJECT_TEMPLATES = [
  { title: 'Página pessoal de apresentação', problem: 'Apresentar quem você é e o que estuda, em uma página web.', objective: 'Praticar HTML e CSS com um projeto real.', checklist: ['Estrutura com HTML', 'Estilos com CSS', 'Seção de projetos', 'Versão para celular'], criteria: 'Página legível em celular e computador, com pelo menos três seções.' },
  { title: 'Calculadora em JavaScript', problem: 'Realizar operações básicas e mostrar o resultado.', objective: 'Praticar eventos e funções.', checklist: ['Interface com botões', 'Operações básicas', 'Tratar divisão por zero', 'Testar com exemplos'], criteria: 'Resultados corretos nos casos de teste e mensagem clara para erros.' },
  { title: 'Lista de tarefas', problem: 'Organizar tarefas do dia.', objective: 'Praticar listas, eventos e persistência simples.', checklist: ['Adicionar tarefa', 'Marcar como concluída', 'Remover tarefa', 'Validar campo vazio'], criteria: 'Adicionar, concluir e remover funcionam sem recarregar a página.' },
  { title: 'Aplicativo simples de estudos', problem: 'Acompanhar quantas horas se estudou por matéria.', objective: 'Praticar formulários e cálculos.', checklist: ['Formulário de registro', 'Total por matéria', 'Resumo final'], criteria: 'Totais calculados corretamente a partir dos registros.' },
  { title: 'Simulador de automação', problem: 'Mostrar como um fluxo repetitivo pode ser automatizado.', objective: 'Modelar regras e entradas.', checklist: ['Descrever o fluxo manual', 'Escrever as regras', 'Simular com exemplos'], criteria: 'O simulador produz a mesma saída que o fluxo manual para os exemplos.' },
  { title: 'Análise de uma profissão afetada pela tecnologia', problem: 'Entender quais tarefas de uma profissão mudam com a tecnologia.', objective: 'Desenvolver pensamento crítico sobre o trabalho.', checklist: ['Escolher a profissão', 'Listar tarefas atuais', 'Identificar tarefas que mudam', 'Propor adaptações'], criteria: 'Análise baseada em fontes identificadas, sem previsões sem fundamento.' },
  { title: 'Proposta de solução digital para um problema local', problem: 'Um problema real da sua comunidade.', objective: 'Aplicar pensamento computacional a um contexto real.', checklist: ['Descrever o problema', 'Definir quem é afetado', 'Propor solução', 'Listar riscos e limites'], criteria: 'Problema descrito com clareza e solução proporcional ao problema.' },
  { title: 'Projeto de inclusão digital', problem: 'Facilitar o acesso de alguém à tecnologia ou à informação.', objective: 'Praticar acessibilidade e linguagem clara.', checklist: ['Público-alvo definido', 'Material em linguagem simples', 'Texto alternativo nas imagens', 'Teste com uma pessoa'], criteria: 'Material compreensível pelo público definido.' },
];

const STATUS = [['planejado', 'Planejados'], ['em-desenvolvimento', 'Em desenvolvimento'], ['concluido', 'Concluídos']];
const STATUS_LABEL = { planejado: 'Planejado', 'em-desenvolvimento': 'Em desenvolvimento', concluido: 'Concluído' };

function projectProgress(p) {
  if (!p.checklist.length) return 0;
  return Math.round((p.checklist.filter((c) => c.done).length / p.checklist.length) * 100);
}

export function renderProjects(outlet, ctx) {
  ctx.setTitle('Projetos');
  const projects = getState().projects;

  const createForm = (() => {
    const choice = select([['', 'Projeto em branco'], ...PROJECT_TEMPLATES.map((t, i) => [String(i), t.title])], '', { id: 'proj-template' });
    const title = textInput({ id: 'proj-title', maxlength: '80', placeholder: 'Nome do projeto' });
    const error = el('p', { class: 'field-error', role: 'alert' });
    return el(
      'form',
      {
        class: 'stack-form',
        novalidate: true,
        onsubmit: (event) => {
          event.preventDefault();
          error.textContent = '';
          const template = choice.value === '' ? null : PROJECT_TEMPLATES[Number(choice.value)];
          const name = title.value.trim() || template?.title || '';
          if (!name) {
            error.textContent = 'Dê um nome ao projeto ou escolha um modelo.';
            title.focus();
            return;
          }
          const id = uid('proj');
          const saved = update((s) => {
            s.projects.push({
              id,
              title: name,
              problem: template?.problem ?? '',
              objective: template?.objective ?? '',
              status: 'planejado',
              checklist: (template?.checklist ?? []).map((label) => ({ id: uid('chk'), label, done: false })),
              observations: '',
              links: '',
              criteria: template?.criteria ?? '',
            });
          });
          if (!saved) {
            error.textContent = 'Não foi possível salvar neste navegador.';
            return;
          }
          toast('Projeto criado.');
          ctx.navigate(`/projetos/${id}`);
        },
      },
      field('Modelo', choice, 'Os modelos trazem objetivo, etapas e critérios prontos.'),
      field('Nome', title),
      error,
      el('button', { class: 'btn btn-primary', type: 'submit' }, 'Criar projeto'),
    );
  })();

  outlet.append(
    pageHead('Aplicação', 'Projetos', 'Aplique o que você aprendeu. Organize cada projeto por estado e acompanhe as etapas.'),
    ...STATUS.map(([status, label]) => {
      const list = projects.filter((p) => p.status === status);
      return card(
        's-12',
        sectionTitle(label, el('small', {}, String(list.length))),
        list.length
          ? el('ul', { class: 'stack-list' }, list.map((p) => el('li', {}, el('a', { class: 'row-link', href: `#/projetos/${p.id}` }, el('div', { class: 'row-main' }, el('strong', {}, p.title), el('span', { class: 'muted' }, `${projectProgress(p)}% das etapas`)), p.demo ? tag('Exemplo') : null))))
          : el('p', { class: 'muted' }, 'Nenhum projeto nesta etapa.'),
      );
    }),
    card('s-12', sectionTitle('Novo projeto'), createForm),
    el('a', { class: 'link-more', href: '#/portfolio' }, 'Ver meu portfólio'),
  );
}

export function renderProject(outlet, ctx) {
  const project = getState().projects.find((p) => p.id === ctx.params.id);
  if (!project) {
    ctx.setTitle('Projeto não encontrado');
    outlet.append(emptyState({ title: 'Este projeto não existe.', text: 'Ele pode ter sido excluído.', action: { label: 'Ver projetos', href: '#/projetos' } }));
    return;
  }
  ctx.setTitle(project.title);

  const checklist = el(
    'ul',
    { class: 'stack-list', 'aria-label': 'Etapas do projeto' },
    project.checklist.map((item) =>
      el(
        'li',
        { class: 'sub-row' },
        el(
          'label',
          { class: 'check' },
          el('input', {
            type: 'checkbox',
            checked: item.done ? true : null,
            onchange: (e) => {
              update((s) => {
                const p = s.projects.find((x) => x.id === project.id);
                const c = p.checklist.find((x) => x.id === item.id);
                if (c) c.done = e.target.checked;
              });
              ctx.navigate(ctx.path);
            },
          }),
          el('span', {}, item.label),
        ),
      ),
    ),
  );

  const obs = textArea(project.observations, { id: 'proj-obs', rows: '4', placeholder: 'Anote dificuldades, decisões e aprendizados.' });
  const links = textInput({ id: 'proj-links', value: project.links, placeholder: 'Link do projeto ou descrição do resultado', maxlength: '300' });
  const saveFields = el('button', {
    class: 'btn btn-primary',
    type: 'button',
    onclick: () => {
      const saved = update((s) => {
        const p = s.projects.find((x) => x.id === project.id);
        p.observations = obs.value.trim();
        p.links = links.value.trim();
      });
      toast(saved ? 'Observações salvas.' : 'Não foi possível salvar.', saved ? 'success' : 'error');
    },
  }, 'Salvar observações');

  const setStatus = (status) => {
    if (status === 'concluido' && project.checklist.some((c) => !c.done) && !confirmAction('Ainda há etapas sem concluir. Marcar o projeto como concluído mesmo assim?')) return;
    update((s) => {
      const p = s.projects.find((x) => x.id === project.id);
      p.status = status;
    });
    if (status === 'concluido') {
      const gained = awardOnce(`project:${project.id}`, 40);
      addNotification({ key: `project:${project.id}`, title: 'Projeto concluído', text: project.title, link: `#/projetos/${project.id}` });
      syncAchievements();
      if (gained) toast('Projeto concluído: +40 XP.');
    }
    ctx.navigate(ctx.path);
  };

  const statusButtons = STATUS.map(([status, label]) =>
    el(
      'button',
      {
        class: `btn ${project.status === status ? 'btn-primary' : 'btn-ghost'}`,
        type: 'button',
        'aria-pressed': project.status === status ? 'true' : 'false',
        onclick: () => setStatus(status),
      },
      label,
    ),
  );

  const remove = el('button', {
    class: 'btn btn-ghost btn-danger',
    type: 'button',
    onclick: () => {
      if (!confirmAction(`Excluir o projeto "${project.title}"?`)) return;
      update((s) => {
        s.projects = s.projects.filter((p) => p.id !== project.id);
      });
      toast('Projeto excluído.');
      ctx.navigate('/projetos');
    },
  }, icon('trash'), 'Excluir projeto');

  outlet.append(
    el('a', { class: 'link-more', href: '#/projetos', style: 'margin-top: 0' }, 'Voltar aos projetos'),
    pageHead(STATUS_LABEL[project.status], project.title),
    el(
      'div',
      { class: 'dash-grid' },
      card('s-7', sectionTitle('Problema e objetivo'), el('p', {}, project.problem || 'Descreva o problema que o projeto resolve.'), el('p', { class: 'muted', style: 'margin-top: 10px' }, project.objective)),
      card(
        's-5',
        sectionTitle('Situação'),
        el('div', { class: 'cta-row' }, statusButtons),
        progressBar(projectProgress(project), 'Etapas concluídas'),
        project.demo ? tag('Exemplo') : null,
      ),
      card('s-6', sectionTitle('Checklist de conclusão'), checklist),
      card(
        's-6',
        sectionTitle('Critérios de avaliação'),
        el('p', { class: 'muted' }, project.criteria || 'Defina como você vai saber que o projeto está bem feito.'),
      ),
      card('s-12', sectionTitle('Registro'), field('Observações', obs), field('Resultado (link ou descrição)', links), el('div', { class: 'cta-row' }, saveFields)),
      card('s-12', sectionTitle('Gerenciar'), remove),
    ),
  );
}

export function renderPortfolio(outlet, ctx) {
  ctx.setTitle('Portfólio');
  const done = getState().projects.filter((p) => p.status === 'concluido');

  outlet.append(
    pageHead('Seus trabalhos', 'Portfólio', 'Projetos concluídos, com o resultado que você registrou.'),
    done.length
      ? el(
          'ul',
          { class: 'course-grid' },
          done.map((p) =>
            el(
              'li',
              {},
              el(
                'article',
                { class: 'course-card' },
                el('h2', {}, p.title),
                el('p', {}, p.objective || 'Sem objetivo registrado.'),
                p.links ? el('p', { class: 'muted' }, `Resultado: ${p.links}`) : el('p', { class: 'help' }, 'Ainda sem resultado registrado. Adicione um link ou descrição no projeto.'),
                el('a', { class: 'btn btn-ghost', href: `#/projetos/${p.id}` }, 'Ver projeto'),
              ),
            ),
          ),
        )
      : emptyState({ title: 'Nenhum projeto concluído ainda.', text: 'Quando um projeto for marcado como concluído, ele aparece aqui.', action: { label: 'Ver projetos', href: '#/projetos' } }),
  );
}
