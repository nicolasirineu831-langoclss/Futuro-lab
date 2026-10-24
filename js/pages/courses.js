import { el, icon, card, sectionTitle, progressBar, tag, emptyState, pageHead, select, textInput, field } from '../ui.js';
import { COURSES, findCourse } from '../data/courses.js';
import { courseProgress, courseStatus, moduleProgress, isLessonDone } from '../services/progress.js';
import { recordHistory } from '../services/history.js';

const STATUS_LABEL = { 'nao-iniciado': 'Não iniciado', 'em-andamento': 'Em andamento', concluido: 'Concluído' };
const STATUS_TONE = { 'nao-iniciado': '', 'em-andamento': 'primary', concluido: 'success' };

function cover(course) {
  return el('div', { class: 'cover', style: `--h: ${course.hue}`, 'aria-hidden': 'true' }, course.category);
}

function durationBucket(hours) {
  if (hours <= 4) return 'curto';
  if (hours <= 6) return 'medio';
  return 'longo';
}

const DURATION_LABEL = { curto: 'Até 4 horas', medio: '5 a 6 horas', longo: 'Mais de 6 horas' };

export function renderCourses(outlet, ctx) {
  ctx.setTitle('Cursos');

  const categories = [...new Set(COURSES.map((c) => c.category))].sort();
  const levels = [...new Set(COURSES.map((c) => c.level))];

  const search = textInput({ id: 'course-search', placeholder: 'Buscar por título, tema ou palavra', 'aria-controls': 'course-results' });
  const categorySel = select([['todas', 'Todas'], ...categories.map((c) => [c, c])], 'todas', { id: 'f-category' });
  const levelSel = select([['todos', 'Todos'], ...levels.map((l) => [l, l])], 'todos', { id: 'f-level' });
  const durationSel = select([['todas', 'Qualquer'], ...Object.entries(DURATION_LABEL)], 'todas', { id: 'f-duration' });
  const statusSel = select([['todos', 'Todos'], ['nao-iniciado', 'Não iniciado'], ['em-andamento', 'Em andamento'], ['concluido', 'Concluído']], 'todos', { id: 'f-status' });
  const count = el('p', { class: 'muted', role: 'status', 'aria-live': 'polite' });
  const results = el('ul', { class: 'course-grid', id: 'course-results' });

  const cardFor = (course) => {
    const status = courseStatus(course);
    return el(
      'li',
      {},
      el(
        'a',
        { class: 'course-card', href: `#/cursos/${course.id}` },
        cover(course),
        el('h2', {}, course.title),
        el('p', {}, course.description),
        el('div', { class: 'tags-row' }, tag(course.level), tag(`${course.hours} h`), tag(STATUS_LABEL[status], STATUS_TONE[status])),
        status === 'nao-iniciado' ? el('span', { class: 'muted' }, `${course.modules.length} módulos`) : progressBar(courseProgress(course), 'Progresso'),
      ),
    );
  };

  const applyFilters = () => {
    const term = search.value.trim().toLowerCase();
    const filtered = COURSES.filter((course) => {
      const haystack = `${course.title} ${course.description} ${course.category} ${course.objectives.join(' ')}`.toLowerCase();
      if (term && !haystack.includes(term)) return false;
      if (categorySel.value !== 'todas' && course.category !== categorySel.value) return false;
      if (levelSel.value !== 'todos' && course.level !== levelSel.value) return false;
      if (durationSel.value !== 'todas' && durationBucket(course.hours) !== durationSel.value) return false;
      if (statusSel.value !== 'todos' && courseStatus(course) !== statusSel.value) return false;
      return true;
    });

    results.replaceChildren(...filtered.map(cardFor));
    count.textContent = filtered.length
      ? `${filtered.length} ${filtered.length === 1 ? 'curso encontrado' : 'cursos encontrados'}.`
      : '';

    if (!filtered.length) {
      results.replaceChildren();
      count.textContent = '';
      results.append(
        el('li', { class: 'span-all' }, emptyState({ title: 'Nenhum curso com esses filtros.', text: 'Limpe um filtro ou use outro termo de busca.' })),
      );
    }
  };

  const reset = el('button', {
    class: 'btn btn-ghost',
    type: 'button',
    onclick: () => {
      search.value = '';
      categorySel.value = 'todas';
      levelSel.value = 'todos';
      durationSel.value = 'todas';
      statusSel.value = 'todos';
      applyFilters();
      search.focus();
    },
  }, 'Limpar filtros');

  for (const control of [search, categorySel, levelSel, durationSel, statusSel]) {
    control.addEventListener(control === search ? 'input' : 'change', applyFilters);
  }

  outlet.append(
    pageHead('Trilhas introdutórias', 'Cursos', 'Programação, automação, inteligência artificial e o futuro do trabalho, com aulas curtas e provas de verificação.'),
    card(
      '',
      el(
        'div',
        { class: 'filters' },
        field('Buscar', search),
        field('Categoria', categorySel),
        field('Nível', levelSel),
        field('Duração', durationSel),
        field('Situação', statusSel),
      ),
      el('div', { class: 'filters-foot' }, count, reset),
    ),
    results,
  );

  applyFilters();
}

export function renderCourseDetail(outlet, ctx) {
  const course = findCourse(ctx.params.id);

  if (!course) {
    ctx.setTitle('Curso não encontrado');
    outlet.append(
      emptyState({ title: 'Este curso não existe.', text: 'Verifique o endereço ou escolha outro curso.', action: { label: 'Ver cursos', href: '#/cursos' } }),
    );
    return;
  }

  ctx.setTitle(course.title);
  recordHistory('curso', course.id);

  const status = courseStatus(course);
  const progress = courseProgress(course);
  const nextLesson = course.modules.flatMap((m) => m.lessons).find((l) => !isLessonDone(l.id));
  const firstLesson = course.modules[0].lessons[0];
  const startTarget = nextLesson ?? firstLesson;

  outlet.append(
    el('a', { class: 'link-more', href: '#/cursos', style: 'margin-top: 0' }, 'Voltar aos cursos'),
    el('header', { class: 'page-head' }, el('p', { class: 'lead' }, course.category), el('h1', {}, course.title)),
    cover(course),
    el(
      'div',
      { class: 'dash-grid' },
      card(
        's-7',
        sectionTitle('Sobre o curso'),
        el('p', { class: 'muted' }, course.description),
        el('div', { class: 'tags-row', style: 'margin-top: 16px' }, tag(course.level), tag(`${course.hours} h estimadas`), tag(STATUS_LABEL[status], STATUS_TONE[status])),
        el(
          'div',
          { class: 'cta-row' },
          el(
            'a',
            { class: 'btn btn-primary', href: `#/aula/${course.id}/${startTarget.id}` },
            status === 'concluido' ? 'Revisar aulas' : status === 'nao-iniciado' ? 'Começar curso' : 'Continuar curso',
          ),
          el('a', { class: 'btn btn-ghost', href: `#/provas/${course.id}` }, 'Fazer prova do curso'),
        ),
      ),
      card(
        's-5',
        sectionTitle('Seu progresso'),
        progressBar(progress, 'Aulas concluídas'),
        el('p', { class: 'muted', style: 'margin-top: 14px' }, nextLesson ? `Próxima aula: ${nextLesson.title}.` : 'Todas as aulas concluídas.'),
      ),
      card(
        's-6',
        sectionTitle('O que você vai aprender'),
        el('ul', { class: 'objectives' }, course.objectives.map((o) => el('li', {}, icon('tick'), el('span', {}, o)))),
      ),
      card(
        's-6',
        sectionTitle('Módulos'),
        el(
          'ol',
          { class: 'module-list' },
          course.modules.map((module, index) => {
            const mp = moduleProgress(module);
            return el(
              'li',
              { class: mp === 100 ? 'is-done' : '' },
              el('span', {}, el('span', { class: 'module-index', 'aria-hidden': 'true' }, mp === 100 ? icon('tick') : String(index + 1)), el('span', {}, module.title)),
              tag(`${mp}%`, mp === 100 ? 'success' : mp > 0 ? 'primary' : ''),
            );
          }),
        ),
      ),
      card(
        's-12',
        sectionTitle('Aulas'),
        el(
          'ul',
          { class: 'stack-list' },
          course.modules.flatMap((module) =>
            module.lessons.map((lesson) =>
              el(
                'li',
                {},
                el(
                  'a',
                  { class: 'row-link lesson-link', href: `#/aula/${course.id}/${lesson.id}` },
                  el('div', { class: 'row-main' }, el('strong', {}, lesson.title), el('span', { class: 'muted' }, module.title)),
                  isLessonDone(lesson.id) ? tag('Concluída', 'success') : tag('Abrir'),
                ),
              ),
            ),
          ),
        ),
      ),
    ),
  );

}
