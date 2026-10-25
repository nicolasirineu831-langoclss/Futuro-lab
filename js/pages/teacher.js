import { el, card, pageHead, field, textInput, textArea, select, emptyState, notice, tag, toast, sectionTitle } from '../ui.js';
import { backendEnabled, getSession, friendlyError } from '../services/backend.js';
import { validateName } from '../services/validate.js';
import * as api from '../services/online.js';

const STATUS_LABEL = { draft: 'Rascunho', published: 'Publicado', archived: 'Arquivado' };
const ACCESS_OPTIONS = [['public', 'Aberto (o estudante se matricula)'], ['enrollment', 'Com matrícula (professor libera)'], ['private', 'Privado (somente convidados)']];
const STATUS_OPTIONS = [['draft', 'Rascunho (visível só para você)'], ['published', 'Publicado (visível para estudantes)'], ['archived', 'Arquivado']];

function fmt(iso) {
  return iso ? new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';
}

function errorLine() {
  return el('p', { class: 'field-error', role: 'alert', 'aria-live': 'assertive' });
}

function setErr(input, node, message) {
  node.textContent = message;
  input.setAttribute('aria-invalid', 'true');
  input.focus();
}

function accessDenied(outlet) {
  outlet.append(emptyState({ title: 'Acesso restrito.', text: 'Esta área é exclusiva para professores e administradores.', action: { label: 'Voltar ao início', href: '#/' } }));
}

function gate(outlet) {
  if (!backendEnabled) {
    outlet.append(emptyState({ title: 'Conta online não configurada.', text: 'A área do professor depende do serviço de conta.', action: { label: 'Voltar ao início', href: '#/' } }));
    return false;
  }
  const s = getSession();
  if (!s.user) {
    outlet.append(emptyState({ title: 'Entre na sua conta.', text: 'Use a conta de professor para acessar esta área.', action: { label: 'Entrar', href: '#/entrar' } }));
    return false;
  }
  if (!['teacher', 'admin'].includes(s.profile?.role)) {
    accessDenied(outlet);
    return false;
  }
  return true;
}

export function renderTeacherHome(outlet, ctx) {
  ctx.setTitle('Área do professor');
  if (!gate(outlet)) return;

  outlet.append(pageHead('Professor', 'Meus cursos', 'Crie cursos, publique materiais e acompanhe as entregas dos estudantes.'));

  const list = el('div', { class: 'stack-list', role: 'status' }, el('p', { class: 'muted' }, 'Carregando...'));
  outlet.append(card('s-12', sectionTitle('Cursos'), list));

  (async () => {
    try {
      const courses = await api.listMyCourses();
      list.replaceChildren(
        ...(courses.length
          ? courses.map((c) => el('a', { class: 'row-link', href: `#/professor/cursos/${c.id}` },
              el('div', { class: 'row-main' }, el('strong', {}, c.title), el('span', { class: 'muted' }, `${c.category} · ${c.level}`)),
              tag(STATUS_LABEL[c.status], c.status === 'published' ? 'success' : c.status === 'draft' ? 'warning' : '')))
          : [el('p', { class: 'muted' }, 'Você ainda não criou cursos.')]),
      );
    } catch (err) {
      list.replaceChildren(emptyState({ title: 'Não foi possível carregar seus cursos.', text: friendlyError(err) }));
    }
  })();

  const title = textInput({ id: 'course-title', maxlength: '120' });
  const description = textArea('', { id: 'course-desc', rows: '4', maxlength: '2000' });
  const category = textInput({ id: 'course-category', maxlength: '60', value: 'Geral' });
  const level = textInput({ id: 'course-level', maxlength: '30', value: 'Iniciante' });
  const access = select(ACCESS_OPTIONS, 'enrollment', { id: 'course-access' });
  const error = errorLine();
  const submit = el('button', { class: 'btn btn-primary', type: 'submit' }, 'Criar curso em rascunho');

  outlet.append(card('s-12', sectionTitle('Novo curso'),
    el('form', { class: 'stack-form', novalidate: true, onsubmit: async (event) => {
      event.preventDefault();
      error.textContent = '';
      const t = title.value.trim();
      if (t.length < 3) return setErr(title, error, 'O título precisa ter pelo menos 3 caracteres.');
      if (description.value.length > 2000) return setErr(description, error, 'A descrição pode ter no máximo 2000 caracteres.');
      submit.disabled = true;
      try {
        const course = await api.createCourse({ title: t, description: description.value.trim(), category: category.value.trim() || 'Geral', level: level.value.trim() || 'Iniciante', access: access.value, status: 'draft' });
        toast('Curso criado como rascunho.');
        ctx.navigate(`/professor/cursos/${course.id}`);
      } catch (err) {
        error.textContent = friendlyError(err);
        submit.disabled = false;
      }
    } },
    field('Título', title), field('Descrição', description, 'Explique o que o estudante vai aprender.'),
    el('div', { class: 'form-row' }, field('Categoria', category), field('Nível', level)),
    field('Acesso', access), error, submit)));
}

export function renderTeacherCourse(outlet, ctx) {
  ctx.setTitle('Gerenciar curso');
  if (!gate(outlet)) return;

  const wait = el('p', { class: 'muted', role: 'status' }, 'Carregando...');
  outlet.append(wait);

  (async () => {
    try {
      const course = await api.getCourse(ctx.params.id);
      wait.remove();
      if (!course || course.owner_id !== getSession().user.id) {
        return outlet.append(emptyState({ title: 'Curso não encontrado.', text: 'Ele pode não existir ou não ser seu.', action: { label: 'Meus cursos', href: '#/professor' } }));
      }

      const [enrollments, activities] = await Promise.all([api.listCourseEnrollments(course.id), api.listActivities(course.id)]);

      outlet.append(
        el('a', { class: 'link-more', href: '#/professor', style: 'margin-top: 0' }, 'Voltar aos meus cursos'),
        pageHead(STATUS_LABEL[course.status], course.title),
        el('div', { class: 'dash-grid' },
          courseForm(course, ctx),
          studentsCard(enrollments),
          activitiesCard(course, activities, ctx),
        ),
      );
    } catch (err) {
      wait.replaceWith(emptyState({ title: 'Não foi possível carregar o curso.', text: friendlyError(err) }));
    }
  })();
}

function courseForm(course, ctx) {
  const title = textInput({ id: 'edit-title', maxlength: '120', value: course.title });
  const description = textArea(course.description ?? '', { id: 'edit-desc', rows: '5', maxlength: '2000' });
  const category = textInput({ id: 'edit-category', maxlength: '60', value: course.category });
  const level = textInput({ id: 'edit-level', maxlength: '30', value: course.level });
  const access = select(ACCESS_OPTIONS, course.access, { id: 'edit-access' });
  const status = select(STATUS_OPTIONS, course.status, { id: 'edit-status' });
  const error = errorLine();
  const submit = el('button', { class: 'btn btn-primary', type: 'submit' }, 'Salvar curso');

  return card('s-7', sectionTitle('Dados do curso'),
    el('form', { class: 'stack-form', novalidate: true, onsubmit: async (event) => {
      event.preventDefault();
      error.textContent = '';
      if (title.value.trim().length < 3) return setErr(title, error, 'O título precisa ter pelo menos 3 caracteres.');
      submit.disabled = true;
      try {
        await api.updateCourse(course.id, {
          title: title.value.trim(),
          description: description.value.trim(),
          category: category.value.trim() || 'Geral',
          level: level.value.trim() || 'Iniciante',
          access: access.value,
          status: status.value,
        });
        toast('Curso salvo.');
        ctx.navigate(ctx.path);
      } catch (err) {
        error.textContent = friendlyError(err);
        submit.disabled = false;
      }
    } },
    field('Título', title), field('Descrição', description),
    el('div', { class: 'form-row' }, field('Categoria', category), field('Nível', level)),
    el('div', { class: 'form-row' }, field('Acesso', access), field('Situação', status, 'Só cursos publicados aparecem para estudantes.')),
    error, submit));
}

function studentsCard(enrollments) {
  return card('s-5', sectionTitle('Estudantes', tag(String(enrollments.length))),
    enrollments.length
      ? el('ul', { class: 'stack-list' }, enrollments.map((e) => el('li', { class: 'achv' }, el('strong', {}, e.profiles?.full_name ?? 'Estudante'))))
      : el('p', { class: 'muted' }, 'Nenhum estudante matriculado ainda.'),
    el('p', { class: 'help' }, 'Estudantes entram sozinhos apenas em cursos abertos. Nos demais, a matrícula é feita pelo professor.'));
}

function activitiesCard(course, activities, ctx) {
  const title = textInput({ id: 'act-title', maxlength: '120' });
  const instructions = textArea('', { id: 'act-instructions', rows: '5', maxlength: '5000' });
  const due = el('input', { type: 'datetime-local', id: 'act-due', class: 'control' });
  const points = el('input', { type: 'number', id: 'act-points', class: 'control', min: '1', max: '100', step: '0.5', value: '10' });
  const publish = el('input', { type: 'checkbox', id: 'act-publish' });
  const error = errorLine();
  const submit = el('button', { class: 'btn btn-primary', type: 'submit' }, 'Criar atividade');

  const createForm = el('form', { class: 'stack-form', novalidate: true, onsubmit: async (event) => {
    event.preventDefault();
    error.textContent = '';
    if (title.value.trim().length < 3) return setErr(title, error, 'O título precisa ter pelo menos 3 caracteres.');
    const pts = Number(points.value);
    if (!Number.isFinite(pts) || pts <= 0 || pts > 100) return setErr(points, error, 'Use um valor entre 0 e 100 pontos.');
    submit.disabled = true;
    try {
      await api.createActivity(course.id, {
        title: title.value.trim(),
        instructions: instructions.value.trim(),
        due_at: due.value ? new Date(due.value).toISOString() : null,
        max_points: pts,
        published: publish.checked,
      });
      toast('Atividade criada.');
      ctx.navigate(ctx.path);
    } catch (err) {
      error.textContent = friendlyError(err);
      submit.disabled = false;
    }
  } },
  field('Título', title), field('Instruções', instructions, 'O que o estudante deve fazer e como entregar.'),
  el('div', { class: 'form-row' }, field('Prazo', due, 'Opcional. Depois do prazo, o banco recusa novas entregas.'), field('Pontos', points)),
  el('label', { class: 'check', for: 'act-publish' }, publish, el('span', {}, 'Publicar agora (estudantes matriculados são avisados)')),
  error, submit);

  return card('s-12', sectionTitle('Atividades'),
    activities.length
      ? el('ul', { class: 'stack-list' }, activities.map((a) => activityRow(a, ctx)))
      : el('p', { class: 'muted' }, 'Nenhuma atividade criada ainda.'),
    el('h3', { class: 'out-title' }, 'Nova atividade'),
    createForm);
}

function activityRow(a, ctx) {
  const toggle = el('button', { class: 'btn btn-ghost', type: 'button' }, a.published ? 'Ocultar atividade' : 'Publicar atividade');
  toggle.addEventListener('click', async () => {
    toggle.disabled = true;
    try {
      await api.setActivityPublished(a.id, !a.published);
      toast(a.published ? 'Atividade ocultada.' : 'Atividade publicada.');
      ctx.navigate(ctx.path);
    } catch (err) {
      toast(friendlyError(err), 'error');
      toggle.disabled = false;
    }
  });

  const details = el('details', { class: 'solution' }, el('summary', {}, 'Entregas'), el('div', { class: 'stack-list' }, el('p', { class: 'muted' }, 'Carregando...')));
  let loaded = false;
  details.addEventListener('toggle', async () => {
    if (!details.open || loaded) return;
    loaded = true;
    const box = details.querySelector('.stack-list');
    try {
      const subs = await api.listSubmissions(a.id);
      box.replaceChildren(...(subs.length ? subs.map((s) => submissionRow(s, a, ctx)) : [el('p', { class: 'muted' }, 'Nenhuma entrega ainda.')]));
    } catch (err) {
      box.replaceChildren(el('p', { class: 'field-error', role: 'alert' }, friendlyError(err)));
      loaded = false;
    }
  });

  return el('li', { class: 'task-card' },
    el('div', { class: 'tags-row' }, tag(a.published ? 'Publicada' : 'Oculta', a.published ? 'success' : 'warning'), tag(`${a.max_points} pontos`)),
    el('strong', {}, a.title),
    el('p', { class: 'muted' }, `Prazo: ${fmt(a.due_at)}`),
    el('div', { class: 'cta-row' }, toggle),
    details);
}

function submissionRow(s, a, ctx) {
  const name = s.profiles?.full_name ?? 'Estudante';
  const statusTag = s.status === 'graded' ? tag(`Corrigida: ${s.grade}`, 'success') : s.status === 'submitted' ? tag('Enviada', 'primary') : tag('Rascunho', 'warning');
  const grade = el('input', { type: 'number', id: `g-${s.id}`, class: 'control', min: '0', max: String(a.max_points), step: '0.5', value: s.grade ?? '', 'aria-label': `Nota de ${name}` });
  const feedback = textArea(s.feedback ?? '', { id: `f-${s.id}`, rows: '3', maxlength: '3000', 'aria-label': `Feedback para ${name}` });
  const error = errorLine();
  const save = el('button', { class: 'btn btn-primary', type: 'button' }, 'Salvar correção');

  save.addEventListener('click', async () => {
    error.textContent = '';
    const value = grade.value.trim();
    if (value === '') return setErr(grade, error, 'Informe a nota.');
    const n = Number(value.replace(',', '.'));
    if (!Number.isFinite(n) || n < 0 || n > Number(a.max_points)) return setErr(grade, error, `A nota deve estar entre 0 e ${a.max_points}.`);
    save.disabled = true;
    try {
      await api.gradeSubmission(s.id, n, feedback.value.trim());
      toast('Correção salva. O estudante será avisado.');
      ctx.navigate(ctx.path);
    } catch (err) {
      error.textContent = friendlyError(err);
      save.disabled = false;
    }
  });

  return el('div', { class: 'card-inner' },
    el('div', { class: 'note-head' }, el('strong', {}, name), statusTag),
    s.body ? el('pre', { class: 'code-block' }, el('code', {}, s.body)) : el('p', { class: 'muted' }, 'Sem texto enviado.'),
    el('div', { class: 'form-row' }, field(`Nota (máx. ${a.max_points})`, grade), field('Feedback', feedback)),
    error,
    el('div', { class: 'cta-row' }, save));
}
