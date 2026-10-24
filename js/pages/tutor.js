import { el, icon, card, sectionTitle, pageHead, notice, toast, confirmAction, textArea } from '../ui.js';
import { getState, update } from '../store.js';
import { askTutor, tutorMode } from '../services/tutor.js';

export function renderTutor(outlet, ctx) {
  ctx.setTitle('Tutor IA');
  const mode = tutorMode();
  const log = el('div', { class: 'chat-log', role: 'log', 'aria-live': 'polite', 'aria-label': 'Conversa com o tutor' });
  const status = el('p', { class: 'help', role: 'status' });
  const input = textArea('', { id: 'tutor-input', rows: '2', maxlength: '500', placeholder: 'Pergunte sobre um conceito, um erro ou um exercício.' });
  const sendBtn = el('button', { class: 'btn btn-primary', type: 'submit' }, icon('send'), 'Enviar');

  const draw = () => {
    const chats = getState().tutorChats;
    if (!chats.length) {
      log.replaceChildren(
        el('div', { class: 'bubble is-tutor' }, 'Oi! Eu posso explicar conceitos, dar exemplos e sugerir uma aula. Experimente perguntar sobre variáveis, condicionais ou automação.'),
      );
    } else {
      log.replaceChildren(
        ...chats.map((m) =>
          el(
            'div',
            { class: `bubble ${m.role === 'user' ? 'is-user' : 'is-tutor'}` },
            el('p', {}, m.text),
            m.suggestion ? el('a', { class: 'link-more', href: m.suggestion.href }, m.suggestion.label) : null,
          ),
        ),
      );
    }
    log.scrollTop = log.scrollHeight;
  };

  const append = (entry) => {
    update((s) => {
      s.tutorChats = [...s.tutorChats, { ...entry, at: Date.now() }].slice(-60);
    });
  };

  const form = el(
    'form',
    {
      class: 'chat-form',
      onsubmit: async (event) => {
        event.preventDefault();
        const question = input.value.trim();
        if (!question) {
          status.textContent = 'Escreva uma pergunta antes de enviar.';
          input.focus();
          return;
        }
        append({ role: 'user', text: question });
        input.value = '';
        input.disabled = true;
        sendBtn.disabled = true;
        status.textContent = 'O tutor está respondendo...';
        draw();

        const answer = await askTutor(question);
        append({ role: 'tutor', text: answer.text, suggestion: answer.suggestion ?? null });
        input.disabled = false;
        sendBtn.disabled = false;
        status.textContent = answer.mode === 'error' ? 'Não foi possível responder agora.' : '';
        draw();
        input.focus();
      },
    },
    el('div', { class: 'field' }, el('label', { for: 'tutor-input' }, 'Sua pergunta'), input),
    el('div', { class: 'cta-row' }, sendBtn, el('button', {
      class: 'btn btn-ghost',
      type: 'button',
      onclick: () => {
        if (!getState().tutorChats.length) return;
        if (!confirmAction('Apagar toda a conversa com o tutor?')) return;
        update((s) => {
          s.tutorChats = [];
        });
        toast('Conversa apagada.');
        draw();
      },
    }, 'Apagar conversa')),
    status,
  );

  const banner =
    mode === 'demo'
      ? notice('info', 'Modo demonstração: as respostas são pré-preparadas para alguns temas. Não há inteligência artificial real conectada nesta versão.', 'info')
      : notice('success', 'Tutor conectado a um serviço de IA pelo servidor da plataforma.', 'tick');

  outlet.append(
    pageHead('Apoio aos estudos', 'Tutor IA', 'Tire dúvidas e receba orientações para resolver os exercícios com as próprias mãos.'),
    banner,
    card('s-12 chat-card', sectionTitle('Conversa'), log, form),
  );

  draw();
}
