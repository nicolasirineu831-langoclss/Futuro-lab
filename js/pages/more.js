import { el, icon, pageHead, card } from '../ui.js';
import { NAV } from '../layout.js';
import { backendEnabled, getSession } from '../services/backend.js';

const EXTRA = [
  { path: '/provas', label: 'Provas', icon: 'flag', text: 'Provas por curso e simulado geral.' },
  { path: '/flashcards', label: 'Flashcards', icon: 'layers', text: 'Revisão espaçada de conceitos.' },
  { path: '/biblioteca', label: 'Biblioteca', icon: 'book', text: 'Resumos, guias e referências.' },
  { path: '/portfolio', label: 'Portfólio', icon: 'award', text: 'Projetos concluídos.' },
];

export function renderMore(outlet, ctx) {
  ctx.setTitle('Mais');
  const session = getSession();
  const online = backendEnabled
    ? [{ path: '/online', label: 'Cursos online', icon: 'book' }]
    : [];
  const teacher = ['teacher', 'admin'].includes(session.profile?.role)
    ? [{ path: '/professor', label: 'Área do professor', icon: 'briefcase' }]
    : [];
  const items = [...NAV.filter((n) => !['/', '/cursos', '/tarefas', '/laboratorio', '/tutor'].includes(n.path)), ...EXTRA, ...online, ...teacher];
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
