import { el, icon, card, sectionTitle, tag, emptyState, pageHead, textInput, textArea, field, toast, confirmAction, select, progressBar } from '../ui.js';
import { getState, update, uid, dayKey } from '../store.js';
import { COURSES } from '../data/courses.js';
import { scheduleCard, dueCards } from '../services/srs.js';
import { recordActivity, awardOnce } from '../services/gamification.js';
import { syncAchievements } from '../services/achievements.js';
import { refreshReminders } from '../services/notifications.js';

export function renderDecks(outlet, ctx) {
  ctx.setTitle('Flashcards');
  const state = getState();
  const today = new Date();
  const totalDue = state.decks.reduce((sum, d) => sum + dueCards(d, today).length, 0);

  const deckCard = (deck) => {
    const due = dueCards(deck, today).length;
    return el(
      'li',
      {},
      el(
        'a',
        { class: 'row-link', href: `#/flashcards/${deck.id}` },
        el(
          'div',
          { class: 'row-main' },
          el('strong', {}, deck.title),
          el('span', { class: 'muted' }, `${deck.cards.length} cartão(ões) · ${COURSES.find((c) => c.id === deck.courseId)?.title ?? 'Sem curso'}`),
        ),
        due ? tag(`${due} para revisar`, 'primary') : tag('Em dia', 'success'),
        deck.demo ? tag('Exemplo') : null,
      ),
    );
  };

  const newDeckForm = (() => {
    const title = textInput({ id: 'deck-title', maxlength: '60', placeholder: 'Ex.: Termos de automação' });
    const course = select([['', 'Sem curso'], ...COURSES.map((c) => [c.id, c.title])], '', { id: 'deck-course' });
    const error = el('p', { class: 'field-error', role: 'alert' });
    return el(
      'form',
      {
        class: 'stack-form',
        novalidate: true,
        onsubmit: (event) => {
          event.preventDefault();
          error.textContent = '';
          if (!title.value.trim()) {
            error.textContent = 'Dê um título ao conjunto.';
            title.focus();
            return;
          }
          const id = uid('deck');
          const saved = update((s) => {
            s.decks.push({ id, title: title.value.trim(), courseId: course.value || null, cards: [] });
          });
          if (!saved) {
            error.textContent = 'Não foi possível salvar neste navegador.';
            return;
          }
          toast('Conjunto criado. Agora adicione os cartões.');
          ctx.navigate(`/flashcards/${id}`);
        },
      },
      field('Título do conjunto', title),
      field('Curso relacionado', course),
      error,
      el('button', { class: 'btn btn-primary', type: 'submit' }, 'Criar conjunto'),
    );
  })();

  outlet.append(
    pageHead('Revisão espaçada', 'Flashcards', totalDue ? `${totalDue} cartão(ões) para revisar hoje.` : 'Nenhuma revisão pendente hoje.'),
    card(
      's-12',
      sectionTitle('Seus conjuntos'),
      state.decks.length
        ? el('ul', { class: 'stack-list' }, state.decks.map(deckCard))
        : emptyState({ title: 'Nenhum conjunto ainda.', text: 'Crie um conjunto abaixo para começar a revisar.' }),
    ),
    card('s-12', sectionTitle('Novo conjunto'), newDeckForm),
  );
}

export function renderDeck(outlet, ctx) {
  const deck = getState().decks.find((d) => d.id === ctx.params.deckId);
  if (!deck) {
    ctx.setTitle('Conjunto não encontrado');
    outlet.append(emptyState({ title: 'Este conjunto não existe.', text: 'Ele pode ter sido excluído.', action: { label: 'Ver flashcards', href: '#/flashcards' } }));
    return;
  }
  ctx.setTitle(deck.title);

  const today = new Date();
  const due = dueCards(deck, today);
  const study = el('div', { id: 'study-area' });
  const manage = el('div', { class: 'stack-list' });

  outlet.append(
    el('a', { class: 'link-more', href: '#/flashcards', style: 'margin-top: 0' }, 'Voltar aos conjuntos'),
    pageHead('Conjunto de cartões', deck.title),
    study,
    manage,
  );

  const startSession = (cards, label) => {
    study.replaceChildren(sessionView(deck.id, cards, label));
  };

  if (!deck.cards.length) {
    study.append(emptyState({ title: 'Este conjunto ainda não tem cartões.', text: 'Adicione cartões abaixo e volte para estudar.' }));
  } else if (due.length) {
    study.append(
      card(
        '',
        el('p', { class: 'lead' }, 'Revisão de hoje'),
        el('h2', {}, `${due.length} cartão(ões) para revisar`),
        el('div', { class: 'cta-row' }, el('button', { class: 'btn btn-primary', type: 'button', onclick: () => startSession(due, 'Revisão de hoje') }, icon('play'), 'Começar revisão')),
      ),
    );
  } else {
    study.append(
      card(
        '',
        el('p', { class: 'lead' }, 'Em dia'),
        el('h2', {}, 'Nenhum cartão pendente hoje'),
        el('p', { class: 'muted' }, 'Você pode estudar todos os cartões mesmo assim.'),
        el('div', { class: 'cta-row' }, el('button', { class: 'btn btn-ghost', type: 'button', onclick: () => startSession(deck.cards, 'Estudo livre') }, 'Estudar todos os cartões')),
      ),
    );
  }

  manage.append(manageCards(deck, ctx));
}

function sessionView(deckId, cards, label) {
  const queue = cards.map((c) => c.id);
  let index = 0;
  let revealed = false;
  let reviewed = 0;
  let knewCount = 0;

  const host = el('div', { class: 'session', role: 'region', 'aria-label': label });

  const render = () => {
    host.replaceChildren();

    if (index >= queue.length) {
      finish();
      return;
    }

    const cardId = queue[index];
    const current = getState().decks.flatMap((d) => d.cards).find((c) => c.id === cardId);
    if (!current) {
      index += 1;
      render();
      return;
    }

    const counter = el('p', { class: 'help', 'aria-live': 'polite' }, `Cartão ${index + 1} de ${queue.length}`);
    const bar = progressBar(Math.round((index / queue.length) * 100), 'Sessão');

    const face = revealed
      ? el('div', { class: 'flip is-back' }, el('p', { class: 'help' }, 'Resposta'), el('p', { class: 'flip-text' }, current.back))
      : el('div', { class: 'flip' }, el('p', { class: 'help' }, 'Pergunta'), el('p', { class: 'flip-text' }, current.front));

    const actions = revealed
      ? el(
          'div',
          { class: 'cta-row' },
          el('button', { class: 'btn btn-ghost', type: 'button', onclick: () => grade(false) }, 'Preciso revisar'),
          el('button', { class: 'btn btn-primary', type: 'button', onclick: () => grade(true) }, 'Aprendi'),
        )
      : el('div', { class: 'cta-row' }, el('button', { class: 'btn btn-primary', type: 'button', onclick: () => { revealed = true; render(); } }, icon('eye'), 'Mostrar resposta'));

    host.append(card('', counter, bar, face, actions));
  };

  const grade = (knew) => {
    const cardId = queue[index];
    const saved = update((s) => {
      for (const deck of s.decks) {
        const i = deck.cards.findIndex((c) => c.id === cardId);
        if (i !== -1) deck.cards[i] = scheduleCard(deck.cards[i], knew);
      }
    });
    if (!saved) toast('Não foi possível salvar a revisão.', 'error');
    reviewed += 1;
    if (knew) knewCount += 1;
    index += 1;
    revealed = false;
    render();
  };

  const finish = () => {
    if (reviewed > 0) {
      recordActivity({ reviewed });
      const today = dayKey();
      const totalToday = getState().activity[today]?.reviewed ?? 0;
      if (totalToday >= 5) awardOnce(`review:${today}`, 10);
      syncAchievements();
      refreshReminders();
    }
    host.replaceChildren(
      card(
        '',
        el('p', { class: 'lead' }, 'Sessão concluída'),
        el('h2', {}, `${knewCount} de ${reviewed} marcados como aprendidos`),
        el('p', { class: 'muted' }, 'Os cartões que você precisa rever voltam em breve. Os que você aprendeu ficam com intervalos maiores.'),
        el('div', { class: 'cta-row' }, el('a', { class: 'btn btn-ghost', href: `#/flashcards/${deckId}` }, 'Voltar ao conjunto')),
      ),
    );
  };

  render();
  return host;
}

function manageCards(deck, ctx) {
  const front = textInput({ id: 'card-front', maxlength: '120', placeholder: 'Pergunta ou termo' });
  const back = textArea('', { id: 'card-back', rows: '3', maxlength: '400', placeholder: 'Resposta ou explicação' });
  const error = el('p', { class: 'field-error', role: 'alert' });

  const addForm = el(
    'form',
    {
      class: 'stack-form',
      novalidate: true,
      onsubmit: (event) => {
        event.preventDefault();
        error.textContent = '';
        if (!front.value.trim() || !back.value.trim()) {
          error.textContent = 'Preencha a pergunta e a resposta.';
          (front.value.trim() ? back : front).focus();
          return;
        }
        const saved = update((s) => {
          const target = s.decks.find((d) => d.id === deck.id);
          target.cards.push({ id: uid('card'), front: front.value.trim(), back: back.value.trim(), ease: 2.5, interval: 0, reps: 0, due: dayKey() });
        });
        if (!saved) {
          error.textContent = 'Não foi possível salvar neste navegador.';
          return;
        }
        toast('Cartão adicionado.');
        ctx.navigate(ctx.path);
      },
    },
    field('Pergunta', front),
    field('Resposta', back),
    error,
    el('button', { class: 'btn btn-primary', type: 'submit' }, 'Adicionar cartão'),
  );

  const cardRows = deck.cards.map((c) =>
    el(
      'li',
      { class: 'achv' },
      el('div', { class: 'row-main' }, el('strong', {}, c.front), el('span', { class: 'muted' }, c.back)),
      el(
        'button',
        {
          class: 'btn btn-ghost btn-danger',
          type: 'button',
          'aria-label': `Excluir cartão ${c.front}`,
          onclick: () => {
            if (!confirmAction(`Excluir o cartão "${c.front}"?`)) return;
            update((s) => {
              const target = s.decks.find((d) => d.id === deck.id);
              target.cards = target.cards.filter((x) => x.id !== c.id);
            });
            toast('Cartão excluído.');
            ctx.navigate(ctx.path);
          },
        },
        icon('trash'),
      ),
    ),
  );

  return el(
    'div',
    { class: 'stack-list' },
    card('', sectionTitle('Cartões do conjunto', tag(`${deck.cards.length}`)), deck.cards.length ? el('ul', { class: 'stack-list' }, cardRows) : el('p', { class: 'muted' }, 'Nenhum cartão ainda.')),
    card('', sectionTitle('Novo cartão'), addForm),
    card(
      '',
      sectionTitle('Conjunto'),
      el(
        'button',
        {
          class: 'btn btn-ghost btn-danger',
          type: 'button',
          onclick: () => {
            if (!confirmAction(`Excluir o conjunto "${deck.title}" e todos os seus cartões?`)) return;
            update((s) => {
              s.decks = s.decks.filter((d) => d.id !== deck.id);
            });
            toast('Conjunto excluído.');
            ctx.navigate('/flashcards');
          },
        },
        icon('trash'),
        'Excluir conjunto',
      ),
    ),
  );
}
