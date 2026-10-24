// Helpers de interface. Textos do usuário sempre entram como textContent (nunca innerHTML).

const ICONS = {
  home: '<path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
  book: '<path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v15H6.5A2.5 2.5 0 0 0 4 19.5z"/><path d="M4 19.5V21h16v-2"/>',
  layers: '<path d="M12 3l9 5-9 5-9-5z"/><path d="M3 13l9 5 9-5"/>',
  check: '<rect x="3" y="3" width="18" height="18" rx="4"/><path d="M8 12l3 3 5-6"/>',
  tick: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  code: '<path d="M16 18l6-6-6-6"/><path d="M8 6l-6 6 6 6"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  flame: '<path d="M12 2c1 4 5 6 5 11a5 5 0 0 1-10 0c0-2 1-3 2-4 0 2 1 3 2 3 0-4 0-6 1-10z"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  award: '<circle cx="12" cy="9" r="6"/><path d="M8.5 14.5L7 22l5-3 5 3-1.5-7.5"/>',
  lock: '<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5"/><path d="M12 8h.01"/>',
  alert: '<path d="M12 3l10 18H2z"/><path d="M12 10v4"/><path d="M12 17h.01"/>',
  trend: '<path d="M3 17l6-6 4 4 8-8"/><path d="M14 7h7v7"/>',
  briefcase: '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"/>',
  play: '<path d="M8 5v14l11-7z"/>',
  pause: '<path d="M9 5v14M15 5v14"/>',
  reset: '<path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 4v5h5"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  trash: '<path d="M4 7h16"/><path d="M9 7V4h6v3"/><path d="M6 7l1 13h10l1-13"/>',
  edit: '<path d="M4 20h4L19 9l-4-4L4 16z"/>',
  star: '<path d="M12 3l2.8 5.7 6.2.9-4.5 4.4 1 6.2L12 17.3 6.5 20.2l1-6.2L3 9.6l6.2-.9z"/>',
  bell: '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/>',
  calendar: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
  columns: '<rect x="3" y="4" width="5" height="16" rx="1"/><rect x="10" y="4" width="5" height="16" rx="1"/><rect x="17" y="4" width="4" height="16" rx="1"/>',
  list: '<path d="M9 6h12M9 12h12M9 18h12"/><path d="M4 6h.01M4 12h.01M4 18h.01"/>',
  chat: '<path d="M21 12a8 8 0 0 1-11.6 7.1L4 21l1.9-5.4A8 8 0 1 1 21 12z"/>',
  send: '<path d="M22 2L11 13"/><path d="M22 2l-7 20-4-9-9-4z"/>',
  flag: '<path d="M5 21V4"/><path d="M5 4h12l-2 4 2 4H5"/>',
  target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r="1"/>',
  download: '<path d="M12 3v12"/><path d="M7 10l5 5 5-5"/><path d="M5 21h14"/>',
  folder: '<path d="M3 6a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
  bulb: '<path d="M9 18h6"/><path d="M10 21h4"/><path d="M12 3a6 6 0 0 0-4 10.5c.8.7 1 1.5 1 2.5h6c0-1 .2-1.8 1-2.5A6 6 0 0 0 12 3z"/>',
  eye: '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  chevronLeft: '<path d="M15 6l-6 6 6 6"/>',
  chevronRight: '<path d="M9 6l6 6-6 6"/>',
  x: '<path d="M6 6l12 12M18 6L6 18"/>',
};

export function icon(name, className = 'icon') {
  const wrapper = document.createElement('span');
  wrapper.innerHTML =
    `<svg class="${className}" viewBox="0 0 24 24" fill="none" stroke="currentColor" ` +
    `stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">` +
    `${ICONS[name] ?? ''}</svg>`;
  return wrapper.firstElementChild;
}

export function el(tag, props = {}, ...children) {
  const node = document.createElement(tag);

  for (const [key, value] of Object.entries(props ?? {})) {
    if (value === null || value === undefined || value === false) continue;

    if (key === 'class') node.className = value;
    else if (key === 'text') node.textContent = String(value);
    else if (key === 'value') node.value = String(value);
    else if (key.startsWith('on') && typeof value === 'function') node.addEventListener(key.slice(2).toLowerCase(), value);
    else if (key === 'dataset') Object.assign(node.dataset, value);
    else node.setAttribute(key, value === true ? '' : String(value));
  }

  for (const child of children.flat()) {
    if (child === null || child === undefined || child === false) continue;
    node.append(child instanceof Node ? child : document.createTextNode(String(child)));
  }

  return node;
}

export function card(className, ...children) {
  return el('div', { class: `card ${className ?? ''}`.trim() }, ...children);
}

export function sectionTitle(title, aside = null) {
  return el('div', { class: 'card-title' }, el('h2', {}, title), aside);
}

export function pageHead(kicker, title, text = '') {
  return el(
    'header',
    { class: 'page-head' },
    kicker ? el('p', { class: 'lead' }, kicker) : null,
    el('h1', {}, title),
    text ? el('p', { class: 'muted' }, text) : null,
  );
}

export function progressBar(value, label = 'Progresso') {
  const percent = Math.max(0, Math.min(100, Math.round(Number(value) || 0)));
  return el(
    'div',
    { class: 'progress-wrap' },
    el('div', { class: 'progress-meta' }, el('span', {}, label), el('strong', {}, `${percent}%`)),
    el(
      'div',
      {
        class: 'progress',
        role: 'progressbar',
        'aria-label': label,
        'aria-valuemin': '0',
        'aria-valuemax': '100',
        'aria-valuenow': String(percent),
      },
      el('span', { style: `width: ${percent}%` }),
    ),
  );
}

export function tag(text, tone = '') {
  return el('span', { class: `tag ${tone ? `tag--${tone}` : ''}`.trim() }, text);
}

export function avatar(name) {
  const initials = String(name ?? '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join('');
  return el('span', { class: 'avatar', 'aria-hidden': 'true' }, initials || icon('user'));
}

export function emptyState({ title, text, action = null }) {
  return el(
    'div',
    { class: 'empty-state' },
    el('strong', {}, title),
    text ? el('p', {}, text) : null,
    action ? el('a', { class: 'btn btn-ghost', href: action.href }, action.label) : null,
  );
}

export function notice(kind, text, iconName = 'info') {
  const role = kind === 'error' ? 'alert' : 'status';
  const modifier = kind === 'error' ? 'notice--error' : kind === 'success' ? 'notice--success' : '';
  return el('div', { class: `notice ${modifier}`.trim(), role }, icon(iconName), el('span', {}, text));
}

// ---------- Campos de formulário ----------

export function field(label, control, help = '') {
  return el(
    'div',
    { class: 'field' },
    el('label', { for: control.id }, label),
    control,
    help ? el('p', { class: 'help' }, help) : null,
  );
}

export function textInput(props = {}) {
  return el('input', { type: 'text', class: 'control', ...props });
}

export function textArea(value = '', props = {}) {
  const node = el('textarea', { class: 'control', rows: '4', ...props });
  node.value = value;
  return node;
}

export function select(options, value = '', props = {}) {
  return el(
    'select',
    { class: 'control', ...props },
    options.map((opt) => {
      const [val, label] = Array.isArray(opt) ? opt : [opt, opt];
      return el('option', { value: val, selected: String(val) === String(value) }, label);
    }),
  );
}

// ---------- Feedback temporário ----------

export function toast(text, kind = 'success') {
  let host = document.getElementById('toasts');
  if (!host) {
    host = el('div', { id: 'toasts', class: 'toasts', 'aria-live': 'polite' });
    document.body.append(host);
  }
  const item = el('div', { class: `toast toast--${kind}` }, icon(kind === 'error' ? 'alert' : 'tick'), el('span', {}, text));
  host.append(item);
  setTimeout(() => item.remove(), 3200);
}

export function formatMinutes(total) {
  const minutes = Math.max(0, Math.round(total));
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours === 0) return `${rest} min`;
  return rest ? `${hours} h ${rest} min` : `${hours} h`;
}

export function timeGreeting(date = new Date()) {
  const hour = date.getHours();
  if (hour < 12) return 'Bom dia';
  if (hour < 18) return 'Boa tarde';
  return 'Boa noite';
}

export function confirmAction(message) {
  return window.confirm(message);
}
