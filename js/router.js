// Roteador simples por hash (#/rota). Funciona em qualquer host estático.
import { emptyState } from './ui.js';

const routes = [];
let outlet = null;
let afterRender = () => {};
let notFoundHandler = null;

export function route(pattern, handler) {
  routes.push({ segments: pattern.split('/').filter(Boolean), handler });
}

export function currentPath() {
  const raw = location.hash.replace(/^#/, '').split('?')[0];
  return raw || '/';
}

function match(path) {
  const parts = path.split('/').filter(Boolean);

  for (const candidate of routes) {
    if (candidate.segments.length !== parts.length) continue;

    const params = {};
    let ok = true;

    for (let i = 0; i < parts.length && ok; i += 1) {
      const segment = candidate.segments[i];
      if (segment.startsWith(':')) {
        try {
          params[segment.slice(1)] = decodeURIComponent(parts[i]);
        } catch {
          ok = false;
        }
      } else if (segment !== parts[i]) {
        ok = false;
      }
    }

    if (ok) return { handler: candidate.handler, params };
  }
  return null;
}

export function navigate(path) {
  const target = `#${path}`;
  if (location.hash === target) render();
  else location.hash = target;
}

function render() {
  const path = currentPath();
  const found = match(path);
  const context = {
    path,
    params: found?.params ?? {},
    navigate,
    setTitle(title) {
      document.title = `${title} · FuturoLab`;
    },
  };

  outlet.replaceChildren();

  try {
    if (found) found.handler(outlet, context);
    else if (notFoundHandler) notFoundHandler(outlet, context);
  } catch (error) {
    console.error('FuturoLab: erro ao renderizar', path, error);
    outlet.replaceChildren(
      emptyState({
        title: 'Não foi possível carregar esta página.',
        text: 'Recarregue a página. Se o problema continuar, verifique o console do navegador.',
        action: { label: 'Voltar ao início', href: '#/' },
      }),
    );
  }

  outlet.focus({ preventScroll: true });
  window.scrollTo({ top: 0 });
  afterRender(path);
}

export function refresh() {
  render();
}

export function startRouter({ outlet: target, onRender, notFound }) {
  outlet = target;
  afterRender = onRender ?? (() => {});
  notFoundHandler = notFound ?? null;
  window.addEventListener('hashchange', render);
  render();
  if (!location.hash) location.hash = '#/';
}
