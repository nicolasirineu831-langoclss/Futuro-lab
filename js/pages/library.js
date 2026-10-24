import { el, icon, card, sectionTitle, tag, emptyState, pageHead, textInput, select, field, toast } from '../ui.js';
import { getState, update } from '../store.js';
import { COURSES } from '../data/courses.js';
import { MATERIALS, REFERENCES } from '../data/library.js';
import { recordHistory } from '../services/history.js';

export function renderLibrary(outlet, ctx) {
  ctx.setTitle('Biblioteca');

  const types = [...new Set(MATERIALS.map((m) => m.type))].sort();
  const search = textInput({ id: 'lib-search', placeholder: 'Buscar em materiais', 'aria-controls': 'lib-results' });
  const typeSel = select([['todos', 'Todos os tipos'], ...types.map((t) => [t, t])], 'todos', { id: 'lib-type' });
  const courseSel = select([['todos', 'Todos os cursos'], ...COURSES.map((c) => [c.id, c.title])], 'todos', { id: 'lib-course' });
  const favOnly = el('input', { type: 'checkbox', id: 'lib-fav' });
  const results = el('ul', { class: 'stack-list', id: 'lib-results', 'aria-live': 'polite' });

  const materialCard = (m) => {
    const isFav = getState().favorites.includes(m.id);
    const course = COURSES.find((c) => c.id === m.courseId);
    return el(
      'li',
      { class: 'material' },
      el('div', { class: 'material-head' }, tag(m.type, 'primary'), el('strong', {}, m.title)),
      el('p', { class: 'muted' }, m.summary),
      el(
        'div',
        { class: 'cta-row' },
        course ? el('a', { class: 'btn btn-ghost', href: `#/cursos/${course.id}`, onclick: () => recordHistory('curso', course.id) }, 'Ver curso relacionado') : null,
        el(
          'button',
          {
            class: `btn btn-ghost ${isFav ? 'is-on' : ''}`.trim(),
            type: 'button',
            'aria-pressed': isFav ? 'true' : 'false',
            onclick: () => {
              const saved = update((s) => {
                s.favorites = isFav ? s.favorites.filter((id) => id !== m.id) : [...s.favorites, m.id];
              });
              if (!saved) toast('Não foi possível salvar o favorito.', 'error');
              else toast(isFav ? 'Removido dos favoritos.' : 'Adicionado aos favoritos.');
              ctx.navigate(ctx.path);
            },
          },
          icon('star'),
          isFav ? 'Favoritado' : 'Favoritar',
        ),
      ),
    );
  };

  const apply = () => {
    const term = search.value.trim().toLowerCase();
    const favorites = getState().favorites;
    const list = MATERIALS.filter((m) => {
      if (term && !`${m.title} ${m.summary} ${m.type}`.toLowerCase().includes(term)) return false;
      if (typeSel.value !== 'todos' && m.type !== typeSel.value) return false;
      if (courseSel.value !== 'todos' && m.courseId !== courseSel.value) return false;
      if (favOnly.checked && !favorites.includes(m.id)) return false;
      return true;
    });
    results.replaceChildren(
      ...(list.length
        ? list.map(materialCard)
        : [el('li', {}, emptyState({ title: 'Nenhum material encontrado.', text: 'Altere a busca ou os filtros.' }))]),
    );
  };

  for (const control of [search, typeSel, courseSel, favOnly]) {
    control.addEventListener(control === search ? 'input' : 'change', apply);
  }

  const refs = el(
    'ul',
    { class: 'stack-list' },
    REFERENCES.map((r) =>
      el(
        'li',
        { class: 'achv' },
        el('div', {}, el('strong', {}, r.title), el('small', {}, `${r.authors}${r.originalYear ? `. Original publicado em ${r.originalYear}` : ''}.`), el('small', {}, r.note)),
      ),
    ),
  );

  outlet.append(
    pageHead('Materiais de apoio', 'Biblioteca', 'Resumos e guias escritos para esta plataforma. Você pode favoritar os materiais que quer rever.'),
    card(
      's-12',
      el('div', { class: 'filters' }, field('Buscar', search), field('Tipo', typeSel), field('Curso', courseSel)),
      el('label', { class: 'check', for: 'lib-fav' }, favOnly, el('span', {}, 'Mostrar apenas favoritos')),
    ),
    results,
    card(
      's-12',
      sectionTitle('Referências do documento-base'),
      el('p', { class: 'muted' }, 'Obras citadas no documento que originou esta plataforma. Os resumos da biblioteca não reproduzem nem atribuem afirmações a elas. Consulte os originais.'),
      refs,
    ),
  );

  apply();
}
