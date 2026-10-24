import { el, icon, card, sectionTitle, tag, emptyState, pageHead, textInput, textArea, field, toast, confirmAction } from '../ui.js';
import { getState, update, uid } from '../store.js';
import { COURSES } from '../data/courses.js';
import { MATERIALS } from '../data/library.js';
import { courseStatus, courseProgress } from '../services/progress.js';

const TABS = [
  ['notas', 'Anotações'],
  ['favoritos', 'Favoritos'],
  ['historico', 'Histórico'],
  ['objetivos', 'Objetivos'],
  ['conceitos', 'Conceitos'],
];

function tabButton(id, label, active, onSelect) {
  return el(
    'button',
    {
      class: `tab ${active ? 'is-active' : ''}`.trim(),
      role: 'tab',
      type: 'button',
      id: `tab-${id}`,
      'aria-selected': active ? 'true' : 'false',
      'aria-controls': 'study-panel',
      tabindex: active ? '0' : '-1',
      onclick: () => onSelect(id),
    },
    label,
  );
}

export function renderStudy(outlet, ctx) {
  ctx.setTitle('Estudos');
  let current = ctx.params.tab && TABS.some(([id]) => id === ctx.params.tab) ? ctx.params.tab : 'notas';

  const tabList = el('div', { class: 'tabs', role: 'tablist', 'aria-label': 'Seções de estudo' });
  const panel = el('div', { id: 'study-panel', role: 'tabpanel', 'aria-labelledby': `tab-${current}` });

  const select = (id) => {
    current = id;
    draw();
  };

  const draw = () => {
    tabList.replaceChildren(...TABS.map(([id, label]) => tabButton(id, label, id === current, select)));
    panel.setAttribute('aria-labelledby', `tab-${current}`);
    panel.replaceChildren(
      current === 'notas' ? notesPanel(() => draw()) :
      current === 'favoritos' ? favoritesPanel() :
      current === 'historico' ? historyPanel() :
      current === 'objetivos' ? objectivesPanel() :
      conceptsPanel(),
    );
  };

  outlet.append(
    pageHead('Ambiente de estudo', 'Estudos', 'Anotações, favoritos e revisões em um só lugar.'),
    tabList,
    panel,
  );
  draw();
}

// ---------- Anotações e cadernos ----------

function notesPanel(redraw) {
  const state = getState();
  const notebooks = [...new Set(state.notes.map((n) => n.notebook || 'Geral'))];

  const formRef = { editingId: null };
  const formHost = el('div');

  const openForm = (note = null) => {
    formRef.editingId = note?.id ?? null;
    const title = textInput({ id: 'note-title', value: note?.title ?? '', maxlength: '80', placeholder: 'Ex.: Conceitos de condicionais' });
    const notebook = textInput({ id: 'note-notebook', value: note?.notebook ?? 'Geral', maxlength: '40', placeholder: 'Caderno' });
    const body = textArea(note?.body ?? '', { id: 'note-body', rows: '6', placeholder: 'Escreva com suas palavras.' });
    const error = el('p', { class: 'field-error', role: 'alert' });

    formHost.replaceChildren(
      card(
        '',
        sectionTitle(note ? 'Editar anotação' : 'Nova anotação'),
        el(
          'form',
          {
            class: 'stack-form',
            novalidate: true,
            onsubmit: (event) => {
              event.preventDefault();
              error.textContent = '';
              if (!title.value.trim() || !body.value.trim()) {
                error.textContent = 'Preencha o título e o texto da anotação.';
                (title.value.trim() ? body : title).focus();
                return;
              }
              const saved = update((s) => {
                const entry = {
                  id: note?.id ?? uid('note'),
                  title: title.value.trim(),
                  notebook: notebook.value.trim() || 'Geral',
                  body: body.value.trim(),
                  lessonId: note?.lessonId ?? null,
                  updatedAt: Date.now(),
                };
                const index = s.notes.findIndex((n) => n.id === entry.id);
                if (index !== -1) s.notes[index] = { ...s.notes[index], ...entry };
                else s.notes.unshift(entry);
              });
              if (!saved) {
                error.textContent = 'Não foi possível salvar neste navegador.';
                return;
              }
              toast('Anotação salva.');
              formHost.replaceChildren();
              redraw();
            },
          },
          field('Título', title),
          field('Caderno', notebook, 'Use para agrupar anotações por tema.'),
          field('Anotação', body),
          error,
          el(
            'div',
            { class: 'cta-row' },
            el('button', { class: 'btn btn-primary', type: 'submit' }, 'Salvar anotação'),
            el('button', { class: 'btn btn-ghost', type: 'button', onclick: () => formHost.replaceChildren() }, 'Cancelar'),
          ),
        ),
      ),
    );
    title.focus();
  };

  const removeNote = (note) => {
    if (!confirmAction(`Excluir a anotação "${note.title}"? Essa ação não pode ser desfeita.`)) return;
    update((s) => {
      s.notes = s.notes.filter((n) => n.id !== note.id);
    });
    toast('Anotação excluída.');
    redraw();
  };

  const noteItem = (note) =>
    el(
      'li',
      { class: 'note' },
      el(
        'div',
        { class: 'note-head' },
        el('strong', {}, note.title),
        note.lessonId ? tag('Da aula') : null,
      ),
      el('p', { class: 'muted note-body' }, note.body),
      el(
        'div',
        { class: 'cta-row' },
        el('button', { class: 'btn btn-ghost', type: 'button', onclick: () => openForm(note) }, icon('edit'), 'Editar'),
        el('button', { class: 'btn btn-ghost btn-danger', type: 'button', onclick: () => removeNote(note) }, icon('trash'), 'Excluir'),
        note.lessonId ? el('a', { class: 'btn btn-ghost', href: lessonHref(note.lessonId) }, 'Abrir aula') : null,
      ),
    );

  const groups = notebooks.length
    ? notebooks.map((nb) =>
        card(
          '',
          sectionTitle(nb, el('small', {}, `${state.notes.filter((n) => (n.notebook || 'Geral') === nb).length} nota(s)`)),
          el('ul', { class: 'stack-list' }, state.notes.filter((n) => (n.notebook || 'Geral') === nb).map(noteItem)),
        ),
      )
    : [emptyState({ title: 'Nenhuma anotação ainda.', text: 'Crie uma anotação ou escreva uma nota dentro de uma aula.' })];

  return el(
    'div',
    { class: 'stack-list' },
    el('div', { class: 'cta-row' }, el('button', { class: 'btn btn-primary', type: 'button', onclick: () => openForm() }, icon('plus'), 'Nova anotação')),
    formHost,
    ...groups,
  );
}

function lessonHref(lessonId) {
  for (const course of COURSES) {
    for (const module of course.modules) {
      const lesson = module.lessons.find((l) => l.id === lessonId);
      if (lesson) return `#/aula/${course.id}/${lesson.id}`;
    }
  }
  return '#/cursos';
}

// ---------- Favoritos ----------

function favoritesPanel() {
  const state = getState();
  const items = state.favorites
    .map((id) => MATERIALS.find((m) => m.id === id))
    .filter(Boolean);

  if (!items.length) {
    return emptyState({
      title: 'Nenhum favorito ainda.',
      text: 'Na biblioteca, use a estrela para guardar materiais que você quer rever.',
      action: { label: 'Ir para a biblioteca', href: '#/biblioteca' },
    });
  }

  return el(
    'ul',
    { class: 'stack-list' },
    items.map((m) =>
      el(
        'li',
        { class: 'row-link' },
        el('div', { class: 'row-main' }, el('strong', {}, m.title), el('span', { class: 'muted' }, m.type)),
        el('a', { class: 'btn btn-ghost', href: '#/biblioteca' }, 'Abrir na biblioteca'),
      ),
    ),
  );
}

// ---------- Histórico ----------

function historyPanel() {
  const history = getState().history;
  if (!history.length) {
    return emptyState({ title: 'Nenhum histórico ainda.', text: 'Os cursos e aulas que você abrir aparecem aqui.' });
  }

  return el(
    'ul',
    { class: 'stack-list' },
    history.slice(0, 20).map((h) => {
      let label = h.id;
      let href = '#/cursos';
      if (h.type === 'curso') {
        const course = COURSES.find((c) => c.id === h.id);
        label = course?.title ?? h.id;
        href = `#/cursos/${h.id}`;
      } else if (h.type === 'aula') {
        const found = COURSES.flatMap((c) => c.modules.flatMap((m) => m.lessons.map((l) => ({ c, l })))).find((x) => x.l.id === h.id);
        if (found) {
          label = found.l.title;
          href = `#/aula/${found.c.id}/${found.l.id}`;
        }
      }
      return el(
        'li',
        {},
        el('a', { class: 'row-link', href }, el('div', { class: 'row-main' }, el('strong', {}, label), el('span', { class: 'muted' }, `${h.type === 'curso' ? 'Curso' : 'Aula'} · ${new Date(h.at).toLocaleDateString('pt-BR')}`))),
      );
    }),
  );
}

// ---------- Objetivos ----------

function objectivesPanel() {
  return el(
    'ul',
    { class: 'stack-list' },
    COURSES.map((course) => {
      const status = courseStatus(course);
      return el(
        'li',
        { class: 'card-inner' },
        el('div', { class: 'row-main' }, el('strong', {}, course.title), el('span', { class: 'muted' }, `Progresso: ${courseProgress(course)}%`)),
        el('ul', { class: 'objectives', style: 'margin-top: 10px' }, course.objectives.map((o) => el('li', {}, icon('target'), el('span', {}, o)))),
        status === 'concluido' ? tag('Objetivos atingidos', 'success') : null,
      );
    }),
  );
}

// ---------- Conceitos importantes (a partir dos cartões de estudo) ----------

function conceptsPanel() {
  const decks = getState().decks;
  const concepts = decks.flatMap((d) => d.cards.map((c) => ({ deck: d.title, front: c.front, back: c.back })));
  if (!concepts.length) {
    return emptyState({ title: 'Nenhum conceito salvo ainda.', text: 'Crie um conjunto de flashcards para reunir os conceitos importantes.', action: { label: 'Abrir flashcards', href: '#/flashcards' } });
  }
  return el(
    'dl',
    { class: 'concepts' },
    concepts.map((c) => el('div', { class: 'concept' }, el('dt', {}, c.front), el('dd', { class: 'muted' }, c.back))),
  );
}

