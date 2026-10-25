import { el, card, pageHead, emptyState, notice, tag, textArea, toast, sectionTitle } from '../ui.js';
import { backendEnabled, getSession, friendlyError } from '../services/backend.js';
import * as api from '../services/online.js';

const ACCESS_LABEL = { public: 'Aberto', enrollment: 'Com matrícula', private: 'Privado' };

function fmtDate(iso) {
  return iso ? new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : null;
}

function button(label, primary = false) {
  return el('button', { class: `btn ${primary ? 'btn-primary' : 'btn-ghost'}`, type: 'button' }, label);
}

// Impede envios repetidos enquanto a ação roda.
async function withBusy(node, fn) {
  if (node.disabled) return;
  const label = node.textContent;
  node.disabled = true;
  node.textContent = 'Aguarde...';
  try {
    await fn();
  } finally {
    node.disabled = false;
    node.textContent = label;
  }
}

function gate(outlet) {
  if (!backendEnabled) {
    outlet.append(emptyState({ title: 'Conta online não configurada.', text: 'Esta área depende do serviço de conta configurado pelo administrador do site.', action: { label: 'Voltar ao início', href: '#/' } }));
    return false;
  }
  if (!getSession().user) {
    outlet.append(emptyState({ title: 'Entre para ver os cursos online.', text: 'Seus cursos e entregas ficam associados à sua conta.', action: { label: 'Entrar', href: '#/entrar' } }));
    return false;
  }
  return true;
}

function retryBlock(container, err, retry) {
  container.replaceChildren(
    emptyState({ title: 'Não foi possível carregar.', text: friendlyError(err) }),
    el('div', { class: 'cta-row' }, button('Tentar de novo', true)),
  );
  container.querySelector('button')?.addEventListener?.('click', retry);
}

function enrollButton(course, ctx) {
  const b = button('Matricular-me', true);
  b.addEventListener('click', () =>
    withBusy(b, async () => {
      try {
        await api.enrollSelf(course.id);
        toast('Matrícula realizada.');
        ctx.navigate('/online');
      } catch (err) {
        toast(friendlyError(err), 'error');
      }
    }),
  );
  return b;
}

export function renderOnlineCatalog(outlet, ctx) {
  ctx.setTitle('Cursos online');
  if (!gate(outlet)) return;

  outlet.append(pageHead('Conta', 'Cursos online', 'Cursos publicados pelos professores. Rascunhos não aparecem aqui.'));
  const list = el('div', { class: 'stack-list', role: 'status', 'aria-live': 'polite' }, el('p', { class: 'muted' }, 'Carregando...'));
  outlet.append(list);

  const load = async () => {
    try {
      const [courses, enrollments] = await Promise.all([api.listPublishedCourses(), api.listMyEnrollments()]);
      const enrolled = new Set(enrollments.map((e) => e.course_id));
      list.replaceChildren(
        ...(courses.length
          ? courses.map((c) => {
              const isEnrolled = enrolled.has(c.id);
              const action = isEnrolled
                ? el('a', { class: 'btn btn-primary', href: `#/online/${c.id}` }, 'Abrir curso')
                : c.access === 'public'
                  ? enrollButton(c, ctx)
                  : el('p', { class: 'muted' }, c.access === 'private'
                      ? 'Curso privado. Fale com o professor para receber acesso.'
                      : 'Este curso exige matrícula feita pelo professor. Peça acesso a ele.');
              return card('', el('div', { class: 'tags-row' }, tag(c.category), tag(c.level), tag(ACCESS_LABEL[c.access]), isEnrolled ? tag('Matriculado', 'success') : null), el('h2', {}, c.title), el('p', { class: 'muted' }, c.description), action);
            })
          : [emptyState({ title: 'Nenhum curso publicado ainda.', text: 'Quando um professor publicar um curso, ele aparece aqui.' })]),
      );
    } catch (err) {
      retryBlock(list, err, load);
    }
  };
  load();
}

export function renderOnlineCourse(outlet, ctx) {
  ctx.setTitle('Curso online');
  if (!gate(outlet)) return;

  const wait = el('p', { class: 'muted', role: 'status' }, 'Carregando...');
  outlet.append(wait);

  (async () => {
    try {
      const course = await api.getCourse(ctx.params.id);
      wait.remove();
      if (!course) {
        return outlet.append(emptyState({ title: 'Curso não encontrado ou sem acesso.', text: 'Verifique o endereço. Rascunhos só aparecem para o professor responsável.', action: { label: 'Ver cursos online', href: '#/online' } }));
      }

      outlet.append(
        el('a', { class: 'link-more', href: '#/online', style: 'margin-top: 0' }, 'Voltar aos cursos online'),
        pageHead(ACCESS_LABEL[course.access], course.title, course.description),
      );

      const user = getSession().user;
      if (course.owner_id === user.id) {
        return outlet.append(
          notice('info', 'Você é o professor deste curso.', 'info'),
          el('div', { class: 'cta-row' }, el('a', { class: 'btn btn-primary', href: `#/professor/cursos/${course.id}` }, 'Gerenciar curso')),
        );
      }

      const enrollments = await api.listMyEnrollments();
      if (!enrollments.some((e) => e.course_id === course.id)) {
        return outlet.append(
          card('s-12', sectionTitle('Acesso ao curso'),
            course.access === 'public'
              ? el('div', { class: 'cta-row' }, enrollButton(course, ctx))
              : el('p', { class: 'muted' }, course.access === 'private'
                  ? 'Este curso é privado. Peça ao professor para liberar seu acesso.'
                  : 'Este curso exige matrícula feita pelo professor. Peça acesso a ele.')),
        );
      }

      const [activities, mine] = await Promise.all([api.listActivities(course.id), api.listMySubmissions()]);
      const byActivity = new Map(mine.map((s) => [s.activity_id, s]));
      outlet.append(
        el('div', { class: 'stack-list' },
          activities.length
            ? activities.map((a) => activityCard(a, byActivity.get(a.id), ctx))
            : [emptyState({ title: 'Nenhuma atividade publicada ainda.', text: 'O professor publicará atividades aqui.' })]),
      );
    } catch (err) {
      wait.replaceWith(emptyState({ title: 'Não foi possível carregar o curso.', text: friendlyError(err) }));
    }
  })();
}

function activityCard(a, sub, ctx) {
  const graded = sub?.status === 'graded';
  const sent = sub?.status === 'submitted';
  const overdue = a.due_at && new Date(a.due_at) < new Date() && !sent && !graded;

  const status = graded
    ? tag(`Nota ${sub.grade} de ${a.max_points}`, 'success')
    : sent ? tag('Enviada', 'primary')
    : sub ? tag('Rascunho', 'warning')
    : overdue ? tag('Prazo encerrado', 'warning')
    : tag('Pendente');

  const answer = textArea(sub?.body ?? '', {
    id: `answer-${a.id}`,
    rows: '6',
    maxlength: '10000',
    placeholder: 'Escreva sua resposta ou o texto da entrega.',
    'aria-label': `Resposta da atividade ${a.title}`,
    disabled: graded || overdue ? true : null,
  });
  const saveDraft = button('Salvar rascunho');
  const send = button('Enviar entrega', true);
  const msg = el('p', { class: 'help', role: 'status', 'aria-live': 'polite' });
  if (overdue) send.disabled = true;

  const save = (submit, node) => withBusy(node, async () => {
    const text = answer.value.trim();
    if (submit && !text) {
      msg.textContent = 'Escreva a resposta antes de enviar.';
      return;
    }
    if (submit && !window.confirm('Enviar a entrega agora? Ela ficará disponível para o professor corrigir.')) return;
    try {
      await api.saveSubmission(a.id, text, submit);
      toast(submit ? 'Entrega enviada.' : 'Rascunho salvo.');
      ctx.navigate(ctx.path);
    } catch (err) {
      msg.textContent = friendlyError(err);
    }
  });

  saveDraft.addEventListener('click', () => save(false, saveDraft));
  send.addEventListener('click', () => save(true, send));

  return card('',
    el('div', { class: 'tags-row' }, status),
    el('h2', {}, a.title),
    a.due_at ? el('p', { class: 'muted' }, `Prazo: ${fmtDate(a.due_at)} · Valor: ${a.max_points} pontos`) : el('p', { class: 'muted' }, `Valor: ${a.max_points} pontos`),
    a.instructions ? el('div', { class: 'lesson-body' }, a.instructions.split('\n').filter(Boolean).map((p) => el('p', {}, p))) : null,
    graded && sub.feedback ? notice('success', `Feedback do professor: ${sub.feedback}`, 'info') : null,
    graded ? null : answer,
    graded ? null : el('div', { class: 'cta-row' }, saveDraft, send),
    msg,
  );
}
