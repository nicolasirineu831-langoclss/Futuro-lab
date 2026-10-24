import { el, icon, card, pageHead, emptyState, tag, toast } from '../ui.js';
import { getState } from '../store.js';
import { markRead, markAllRead, removeNotification, refreshReminders } from '../services/notifications.js';

function when(ts) {
  const d = new Date(ts);
  return d.toLocaleString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export function renderNotifications(outlet, ctx) {
  ctx.setTitle('Avisos');
  refreshReminders();
  const items = getState().notifications;
  const unread = items.filter((n) => !n.read).length;

  const list = items.length
    ? el(
        'ul',
        { class: 'stack-list' },
        items.map((n) =>
          el(
            'li',
            { class: `notif ${n.read ? '' : 'is-unread'}`.trim() },
            el('div', { class: 'notif-main' },
              el('div', { class: 'note-head' }, el('strong', {}, n.title), n.read ? null : tag('Novo', 'primary')),
              el('p', { class: 'muted' }, n.text),
              el('small', { class: 'help' }, when(n.at)),
            ),
            el(
              'div',
              { class: 'cta-row' },
              n.link ? el('a', { class: 'btn btn-ghost', href: n.link, onclick: () => markRead(n.id, true) }, 'Abrir') : null,
              el('button', {
                class: 'btn btn-ghost',
                type: 'button',
                onclick: () => {
                  markRead(n.id, !n.read);
                  ctx.navigate(ctx.path);
                },
              }, n.read ? 'Marcar como não lida' : 'Marcar como lida'),
              el('button', {
                class: 'btn btn-ghost btn-danger',
                type: 'button',
                'aria-label': `Remover aviso ${n.title}`,
                onclick: () => {
                  removeNotification(n.id);
                  toast('Aviso removido.');
                  ctx.navigate(ctx.path);
                },
              }, icon('x'), 'Remover'),
            ),
          ),
        ),
      )
    : emptyState({ title: 'Nenhum aviso por enquanto.', text: 'Avisos aparecem quando algo acontece: uma aula concluída, uma prova feita, um prazo próximo ou uma revisão pendente.' });

  outlet.append(
    pageHead('Central', 'Avisos', unread ? `${unread} aviso(s) não lido(s).` : 'Tudo lido.'),
    el('div', { class: 'cta-row' }, unread
      ? el('button', { class: 'btn btn-primary', type: 'button', onclick: () => { markAllRead(); toast('Todos os avisos marcados como lidos.'); ctx.navigate(ctx.path); } }, icon('tick'), 'Marcar todos como lidos')
      : null),
    card('s-12', list),
  );
}
