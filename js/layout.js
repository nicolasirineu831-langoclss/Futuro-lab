import { el, icon, avatar } from './ui.js';
import { getState, subscribe } from './store.js';
import { backendEnabled, getSession } from './services/backend.js';

export const NAV = [
  { path: '/', label: 'Início', icon: 'home' },
  { path: '/cursos', label: 'Cursos', icon: 'book' },
  { path: '/estudos', label: 'Estudos', icon: 'layers' },
  { path: '/tarefas', label: 'Tarefas', icon: 'check' },
  { path: '/laboratorio', label: 'Laboratório', icon: 'code' },
  { path: '/tutor', label: 'Tutor IA', icon: 'chat' },
  { path: '/projetos', label: 'Projetos', icon: 'briefcase' },
  { path: '/carreiras', label: 'Carreiras', icon: 'trend' },
  { path: '/planejador', label: 'Planejador', icon: 'target' },
  { path: '/avisos', label: 'Avisos', icon: 'bell' },
  { path: '/perfil', label: 'Perfil', icon: 'user' },
];

// Navegação inferior no celular: seis destinos principais. "Mais" leva ao restante.
const BOTTOM = [
  { path: '/', label: 'Início', icon: 'home' },
  { path: '/cursos', label: 'Cursos', icon: 'book' },
  { path: '/tarefas', label: 'Tarefas', icon: 'check' },
  { path: '/laboratorio', label: 'Laboratório', icon: 'code' },
  { path: '/tutor', label: 'Tutor', icon: 'chat' },
  { path: '/mais', label: 'Mais', icon: 'layers' },
];

function brand() {
  return el(
    'a',
    { class: 'brand', href: '#/', 'aria-label': 'FuturoLab, ir para o início' },
    el('span', { class: 'brand-mark', 'aria-hidden': 'true' }, 'F'),
    el('span', { class: 'brand-text' }, el('strong', {}, 'FuturoLab'), el('small', {}, 'Aprenda hoje, prepare-se para amanhã')),
  );
}

export function renderShell(root) {
  const links = [];

  const makeLink = (item, kind) => {
    const link = el(
      'a',
      { class: kind === 'side' ? 'side-link' : 'bottom-link', href: `#${item.path}`, dataset: { path: item.path } },
      icon(item.icon),
      el('span', {}, item.label),
    );
    links.push(link);
    return link;
  };

  const sidebar = el(
    'aside',
    { class: 'sidebar', 'aria-label': 'Menu lateral' },
    brand(),
    el('nav', { class: 'side-nav', 'aria-label': 'Principal' }, NAV.map((item) => makeLink(item, 'side'))),
    el('p', { class: 'sidebar-foot' }, 'Seu progresso fica salvo neste aparelho. Não há sincronização entre dispositivos.'),
  );

  const bellSlot = el('span', { class: 'bell-slot' });
  const avatarSlot = el('div', { class: 'account-slot' });
  const topActions = el('div', { class: 'top-actions' }, bellSlot, avatarSlot);
  const topbar = el('header', { class: 'topbar' }, brand(), topActions);

  const main = el('main', { id: 'main', class: 'content', tabindex: '-1' });

  const bottomNav = el(
    'nav',
    { class: 'bottom-nav', 'aria-label': 'Navegação principal' },
    BOTTOM.map((item) => makeLink(item, 'bottom')),
  );

  root.replaceChildren(
    el('div', { class: 'app' }, sidebar, el('div', { class: 'workspace' }, topbar, main), bottomNav),
  );

  function renderTopActions() {
    const state = getState();
    const unread = state.notifications.filter((n) => !n.read).length;
    bellSlot.replaceChildren(
      el(
        'a',
        {
          class: 'bell-link',
          href: '#/avisos',
          'aria-label': unread ? `Avisos, ${unread} não lidos` : 'Avisos',
        },
        icon('bell'),
        unread ? el('span', { class: 'badge', 'aria-hidden': 'true' }, unread > 9 ? '9+' : String(unread)) : null,
      ),
    );
    const session = getSession();
    if (backendEnabled && !session.user) {
      avatarSlot.replaceChildren(el('a', { class: 'btn btn-ghost btn-compact', href: '#/entrar' }, 'Entrar'));
    } else {
      const name = backendEnabled ? session.profile?.full_name ?? '' : state.profile.name;
      avatarSlot.replaceChildren(el('a', { class: 'avatar-link', href: '#/perfil', 'aria-label': 'Abrir perfil', title: name || 'Perfil' }, avatar(name)));
    }
  }

  function refresh(path) {
    const current = path ?? '/';
    for (const link of links) {
      if (link.dataset.path === current) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    }
    renderTopActions();
  }

  subscribe(renderTopActions);
  refresh(location.hash.replace(/^#/, '') || '/');

  return { main, refresh };
}
