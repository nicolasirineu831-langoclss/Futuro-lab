import { el, icon, card, sectionTitle, tag, pageHead, textArea, textInput, field, toast, notice } from '../ui.js';
import { getState, update } from '../store.js';
import { SCENARIOS } from '../data/careers.js';

export function renderCareers(outlet, ctx) {
  ctx.setTitle('Carreiras');

  outlet.append(
    pageHead(
      'Futuro do trabalho',
      'Carreiras',
      'Analise situações profissionais, identifique tarefas que podem ser automatizadas e pense em formas de adaptação. Não há previsões de emprego aqui.',
    ),
    card(
      's-12',
      sectionTitle('Atividade: analise um cenário'),
      el('p', { class: 'muted' }, 'Escolha um cenário, marque as tarefas que você acha que poderiam ser automatizadas e escreva como a equipe poderia se adaptar.'),
      el(
        'div',
        { class: 'tabs', 'aria-label': 'Ir para um cenário' },
        SCENARIOS.map((s) =>
          el(
            'button',
            {
              class: 'tab',
              type: 'button',
              onclick: () => document.getElementById(`scenario-${s.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' }),
            },
            s.title,
          ),
        ),
      ),
    ),
    ...SCENARIOS.map((s) => scenarioCard(s)),
    card('s-12', sectionTitle('Planejador de carreira'), careerPlanForm(ctx)),
  );
}

function scenarioCard(scenario) {
  const saved = getState().careerActivities[scenario.id] ?? { selected: [], reflection: '' };
  const boxes = scenario.tasks.map((task) =>
    el(
      'label',
      { class: 'option' },
      el('input', { type: 'checkbox', name: `${scenario.id}-task`, value: task.id, checked: saved.selected.includes(task.id) ? true : null }),
      el('span', {}, task.label),
    ),
  );
  const reflection = textArea(saved.reflection, { id: `${scenario.id}-ref`, rows: '4', maxlength: '800', placeholder: 'Por exemplo: que tarefas a equipe poderia aprender a supervisionar?' });
  const result = el('div', { role: 'status', 'aria-live': 'polite' });

  const submit = el('form', {
    class: 'stack-form',
    id: `scenario-${scenario.id}`,
    onsubmit: (event) => {
      event.preventDefault();
      const selected = [...event.currentTarget.querySelectorAll(`input[name="${scenario.id}-task"]:checked`)].map((i) => i.value);
      const saved2 = update((s) => {
        s.careerActivities[scenario.id] = { selected, reflection: reflection.value.trim(), updatedAt: Date.now() };
      });
      if (!saved2) {
        result.replaceChildren(notice('error', 'Não foi possível salvar neste navegador.'));
        return;
      }
      const suggested = scenario.tasks.filter((t) => t.automatable).map((t) => t.id);
      const agree = suggested.filter((id) => selected.includes(id)).length;
      const extra = selected.filter((id) => !suggested.includes(id)).length;
      result.replaceChildren(
        notice(
          'success',
          `Atividade salva. Comparação ilustrativa: a análise de referência aponta ${suggested.length} tarefas como candidatas. Sua seleção coincide em ${agree} delas e inclui ${extra} tarefa(s) que a referência considera de julgamento humano. Não é uma previsão: discuta as diferenças com colegas e com o contexto real.`,
          'tick',
        ),
      );
      toast('Atividade salva.');
    },
  },
  el('fieldset', { class: 'question' }, el('legend', {}, 'Quais tarefas poderiam ser automatizadas?'), el('div', { class: 'options' }, boxes)),
  field('Como a equipe poderia se adaptar?', reflection),
  el('button', { class: 'btn btn-primary', type: 'submit' }, 'Salvar análise'),
  result,
  );

  return card('s-12 scenario', el('h2', {}, scenario.title), el('p', { class: 'muted' }, scenario.context), el('p', { class: 'lead', style: 'margin-top: 12px' }, scenario.prompt), submit);
}

function careerPlanForm(ctx) {
  const plan = getState().careerPlan;
  const fields = [
    ['interest', 'Área de interesse', 'Ex.: desenvolvimento web, análise de dados'],
    ['goal', 'Objetivo profissional', 'Ex.: estagiar em uma empresa de software em dois anos'],
    ['current', 'Competências atuais', 'O que você já sabe fazer'],
    ['toDevelop', 'Competências a desenvolver', 'O que falta para o seu objetivo'],
    ['courses', 'Cursos relacionados', 'Cursos da plataforma ou outros que você quer fazer'],
    ['projects', 'Projetos que pretende concluir', 'Projetos do laboratório ou da seção de projetos'],
    ['nextActions', 'Próximas ações', 'Passos pequenos para as próximas semanas'],
  ];

  const controls = Object.fromEntries(
    fields.map(([key, label, placeholder]) => {
      const control = key === 'interest' || key === 'goal' ? textInput({ id: `plan-${key}`, value: plan[key], maxlength: '160', placeholder }) : textArea(plan[key], { id: `plan-${key}`, rows: '2', maxlength: '500', placeholder });
      return [key, { label, control }];
    }),
  );

  const error = el('p', { class: 'field-error', role: 'alert' });
  return el(
    'form',
    {
      class: 'stack-form',
      novalidate: true,
      onsubmit: (event) => {
        event.preventDefault();
        error.textContent = '';
        if (!controls.goal.control.value.trim()) {
          error.textContent = 'Escreva ao menos o objetivo profissional.';
          controls.goal.control.focus();
          return;
        }
        const values = Object.fromEntries(Object.entries(controls).map(([k, v]) => [k, v.control.value.trim()]));
        const saved = update((s) => {
          s.careerPlan = { ...s.careerPlan, ...values };
        });
        if (!saved) {
          error.textContent = 'Não foi possível salvar neste navegador.';
          return;
        }
        toast('Planejador salvo.');
        ctx.navigate(ctx.path);
      },
    },
    ...Object.values(controls).map(({ label, control }) => field(label, control)),
    error,
    el('div', { class: 'cta-row' }, el('button', { class: 'btn btn-primary', type: 'submit' }, icon('check'), 'Salvar planejamento')),
  );
}
