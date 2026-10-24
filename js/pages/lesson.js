import { el, icon, card, sectionTitle, progressBar, tag, emptyState, textArea, toast, field } from '../ui.js';
import { getState, update, uid } from '../store.js';
import { findLesson } from '../data/courses.js';
import { isLessonDone, setLessonDone, setLastLesson, courseProgress } from '../services/progress.js';
import { recordHistory } from '../services/history.js';

// Vídeos só são incorporados de hosts de incorporação conhecidos. Qualquer outro link é ignorado.
const EMBED_HOSTS = ['www.youtube-nocookie.com', 'player.vimeo.com'];

function safeEmbedUrl(raw) {
  try {
    const url = new URL(raw);
    if (url.protocol !== 'https:') return null;
    return EMBED_HOSTS.includes(url.hostname) ? url.toString() : null;
  } catch {
    return null;
  }
}

export function renderLesson(outlet, ctx) {
  const found = findLesson(ctx.params.courseId, ctx.params.lessonId);

  if (!found) {
    ctx.setTitle('Aula não encontrada');
    outlet.append(emptyState({ title: 'Esta aula não existe.', text: 'Volte ao curso e escolha outra aula.', action: { label: 'Ver cursos', href: '#/cursos' } }));
    return;
  }

  const { course, lesson, previous, next } = found;
  ctx.setTitle(lesson.title);
  setLastLesson(course.id, lesson.id);
  recordHistory('aula', lesson.id);

  const done = isLessonDone(lesson.id);
  const progress = courseProgress(course);
  const embed = lesson.videoUrl ? safeEmbedUrl(lesson.videoUrl) : null;

  // Anotação desta aula
  const existingNote = getState().notes.find((n) => n.lessonId === lesson.id);
  const noteArea = textArea(existingNote?.body ?? '', { id: 'lesson-note', rows: '5', placeholder: 'Escreva o que você quer lembrar desta aula.' });
  const noteStatus = el('p', { class: 'help', role: 'status', 'aria-live': 'polite' });

  const saveNote = () => {
    const body = noteArea.value.trim();
    const saved = update((s) => {
      const index = s.notes.findIndex((n) => n.lessonId === lesson.id);
      if (!body) {
        if (index !== -1) s.notes.splice(index, 1);
        return;
      }
      const entry = { id: index !== -1 ? s.notes[index].id : uid('note'), lessonId: lesson.id, title: lesson.title, body, updatedAt: Date.now() };
      if (index !== -1) s.notes[index] = entry;
      else s.notes.unshift(entry);
    });
    noteStatus.textContent = saved ? (body ? 'Anotação salva neste aparelho.' : 'Anotação removida.') : 'Não foi possível salvar. Verifique o armazenamento do navegador.';
    if (saved) toast(body ? 'Anotação salva.' : 'Anotação removida.');
  };

  const toggle = el('button', {
    class: `btn ${done ? 'btn-ghost' : 'btn-primary'}`,
    type: 'button',
    'aria-pressed': done ? 'true' : 'false',
    onclick: () => {
      const ok = setLessonDone(course, lesson.id, !done);
      if (!ok) toast('Não foi possível salvar o progresso.', 'error');
      else toast(done ? 'Aula marcada como não concluída.' : 'Aula concluída. Bom trabalho!');
      ctx.navigate(ctx.path);
    },
  }, icon('tick'), done ? 'Desmarcar conclusão' : 'Marcar como concluída');

  const moduleList = el(
    'ol',
    { class: 'lesson-list', 'aria-label': 'Aulas do módulo' },
    course.modules
      .find((m) => m.id === lesson.moduleId)
      .lessons.map((item) => {
        const current = item.id === lesson.id;
        return el(
          'li',
          {},
          el(
            'a',
            { href: `#/aula/${course.id}/${item.id}`, class: current ? 'is-current' : '', 'aria-current': current ? 'step' : null },
            el('span', { class: 'module-index', 'aria-hidden': 'true' }, isLessonDone(item.id) ? icon('tick') : ''),
            el('span', {}, item.title),
          ),
        );
      }),
  );

  const navRow = el(
    'nav',
    { class: 'lesson-nav', 'aria-label': 'Navegação entre aulas' },
    previous
      ? el('a', { class: 'btn btn-ghost', href: `#/aula/${course.id}/${previous.id}` }, icon('chevronLeft'), 'Aula anterior')
      : el('span', { class: 'btn btn-ghost is-disabled', 'aria-disabled': 'true' }, icon('chevronLeft'), 'Aula anterior'),
    next
      ? el('a', { class: 'btn btn-primary', href: `#/aula/${course.id}/${next.id}` }, 'Próxima aula', icon('chevronRight'))
      : el('a', { class: 'btn btn-primary', href: `#/provas/${course.id}` }, 'Fazer a prova do curso', icon('chevronRight')),
  );

  outlet.append(
    el(
      'nav',
      { class: 'crumbs', 'aria-label': 'Caminho' },
      el('a', { href: '#/cursos' }, 'Cursos'),
      el('span', { 'aria-hidden': 'true' }, '/'),
      el('a', { href: `#/cursos/${course.id}` }, course.title),
    ),
    el(
      'header',
      { class: 'page-head' },
      el('p', { class: 'lead' }, lesson.moduleTitle),
      el('h1', {}, lesson.title),
    ),
    el(
      'div',
      { class: 'lesson-layout' },
      el(
        'div',
        { class: 'lesson-main' },
        card(
          '',
          embed
            ? el('div', { class: 'video-frame' }, el('iframe', { src: embed, title: `Vídeo: ${lesson.title}`, allow: 'accelerometer; encrypted-media; picture-in-picture', allowfullscreen: true, loading: 'lazy' }))
            : el('div', { class: 'notice' }, icon('info'), el('span', {}, 'Esta aula está em texto. O vídeo ainda não está disponível para este conteúdo.')),
          el('div', { class: 'lesson-body' }, lesson.body.map((p) => el('p', {}, p))),
          lesson.example ? el('div', {}, el('p', { class: 'help' }, 'Exemplo'), el('pre', { class: 'code-block' }, el('code', {}, lesson.example))) : null,
          lesson.exercise
            ? el(
                'div',
                { class: 'exercise' },
                el('strong', {}, 'Exercício'),
                el('p', { class: 'muted' }, lesson.exercise.prompt),
                lesson.exercise.challengeId
                  ? el('a', { class: 'btn btn-ghost', href: `#/laboratorio/${lesson.exercise.challengeId}` }, 'Resolver no laboratório')
                  : null,
              )
            : null,
        ),
        card(
          '',
          sectionTitle('Anotações'),
          field('Suas anotações desta aula', noteArea),
          el('div', { class: 'cta-row' }, el('button', { class: 'btn btn-primary', type: 'button', onclick: saveNote }, 'Salvar anotação')),
          noteStatus,
        ),
        card(
          '',
          sectionTitle('Dúvidas'),
          el('p', { class: 'muted' }, 'Para tirar uma dúvida sobre este conteúdo, use o Tutor IA. Nesta versão ele responde em modo demonstração.'),
          el('a', { class: 'btn btn-ghost', href: '#/tutor' }, 'Perguntar ao tutor'),
        ),
      ),
      el(
        'aside',
        { class: 'lesson-side' },
        card(
          '',
          sectionTitle('Progresso do curso'),
          progressBar(progress, 'Aulas concluídas'),
          el('div', { class: 'cta-row' }, toggle),
          done ? tag('Aula concluída', 'success') : null,
        ),
        card('', sectionTitle(lesson.moduleTitle), moduleList),
      ),
    ),
    navRow,
  );
}
