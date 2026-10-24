import { el, icon, pageHead, card } from '../ui.js';
import { NAV } from '../layout.js';

const EXTRA = [
  { path: '/provas', label: 'Provas', icon: 'flag', text: 'Provas por curso e simulado geral.' },
  { path: '/flashcards', label: 'Flashcards', icon: 'layers', text: 'Revisão espaçada de conceitos.' },
  { path: '/biblioteca', label: 'Biblioteca', icon: 'book', text: 'Resumos, guias e referências.' },
  { path: '/portfolio', label: 'Portfólio', icon: 'award', text: 'Projetos concluídos.' },
];

export function renderMore(outlet, ctx) {
  ctx.setTitle('Mais');
  const items = [...NAV.filter((n) => !['/', '/cursos', '/tarefas', '/laboratorio', '/tutor'].includes(n.path)), ...EXTRA];
  outlet.append(
    pageHead('Todas as áreas', 'Mais'),
    card(
      's-12',
      el(
        'ul',
        { class: 'shortcuts' },
        items.map((item) =>
          el('li', {}, el('a', { class: 'shortcut', href: `#${item.path}` }, icon(item.icon), el('span', {}, item.label))),
        ),
      ),
    ),
  );
}
