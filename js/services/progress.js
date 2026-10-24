import { getState, update } from '../store.js';
import { COURSES, allLessons } from '../data/courses.js';
import { awardOnce, recordActivity } from './gamification.js';
import { addNotification } from './notifications.js';

export function isLessonDone(lessonId) {
  return Boolean(getState().lessons[lessonId]);
}

export function moduleProgress(module) {
  const total = module.lessons.length;
  if (!total) return 0;
  return Math.round((module.lessons.filter((l) => isLessonDone(l.id)).length / total) * 100);
}

export function courseProgress(course) {
  const lessons = allLessons(course);
  if (!lessons.length) return 0;
  const done = lessons.filter((l) => isLessonDone(l.id)).length;
  return Math.round((done / lessons.length) * 100);
}

export function courseStatus(course) {
  const progress = courseProgress(course);
  if (progress === 0) return 'nao-iniciado';
  if (progress === 100) return 'concluido';
  return 'em-andamento';
}

export function startedCourses() {
  return COURSES.filter((c) => courseStatus(c) !== 'nao-iniciado');
}

export function setLastLesson(courseId, lessonId) {
  update((s) => {
    s.lastLesson = { courseId, lessonId };
  });
}

// Marca ou desmarca uma aula. Só concede XP na primeira conclusão.
export function setLessonDone(course, lessonId, done) {
  const lesson = allLessons(course).find((l) => l.id === lessonId);
  if (!lesson) return false;

  const saved = update((s) => {
    if (done) s.lessons[lessonId] = { doneAt: Date.now() };
    else delete s.lessons[lessonId];
    s.lastLesson = { courseId: course.id, lessonId };
  });
  if (!saved) return false;

  if (done) {
    recordActivity({ minutes: 0 });
    awardOnce(`lesson:${lessonId}`, 10);
    addNotification({
      key: `lesson:${lessonId}`,
      title: 'Aula concluída',
      text: `${lesson.title}, em ${course.title}.`,
      link: `#/aula/${course.id}/${lessonId}`,
    });
    if (courseProgress(course) === 100) {
      addNotification({
        key: `course:${course.id}`,
        title: 'Curso concluído',
        text: `Você concluiu ${course.title}. Confira sua prova final.`,
        link: `#/cursos/${course.id}`,
      });
    }
  }
  return true;
}

export function nextPendingLesson(course) {
  return allLessons(course).find((l) => !isLessonDone(l.id)) ?? null;
}
