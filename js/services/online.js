// Acesso aos dados online. Toda regra de permissão é aplicada pelo banco (RLS e triggers).
// Esta camada apenas faz as consultas e propaga os erros.
import { getDb, getSession } from './backend.js';

function db() {
  const c = getDb();
  if (!c) throw new Error('Serviço de conta indisponível.');
  return c;
}

async function run(promise) {
  const { data, error } = await promise;
  if (error) throw error;
  return data;
}

function uid() {
  const s = getSession();
  if (!s.user) throw new Error('Entre na sua conta para continuar.');
  return s.user.id;
}

// ---------- Perfil ----------

export async function updateMyName(name) {
  await run(db().from('profiles').update({ full_name: name }).eq('id', uid()));
}

// ---------- Cursos e matrículas ----------

export function listPublishedCourses() {
  return run(
    db().from('courses')
      .select('id, title, description, category, level, access')
      .eq('status', 'published')
      .order('title'),
  );
}

export function getCourse(id) {
  return run(db().from('courses').select('*').eq('id', id).maybeSingle());
}

export function listMyEnrollments() {
  return run(db().from('enrollments').select('course_id').eq('student_id', uid()));
}

export function enrollSelf(courseId) {
  return run(db().from('enrollments').insert({ course_id: courseId, student_id: uid() }));
}

export function listMyCourses() {
  return run(db().from('courses').select('*').eq('owner_id', uid()).order('created_at', { ascending: false }));
}

export function createCourse(fields) {
  return run(db().from('courses').insert({ ...fields, owner_id: uid() }).select().single());
}

export function updateCourse(id, fields) {
  return run(db().from('courses').update(fields).eq('id', id).select().single());
}

export function listCourseEnrollments(courseId) {
  return run(db().from('enrollments').select('student_id, profiles(full_name)').eq('course_id', courseId));
}

// ---------- Atividades ----------

export function listActivities(courseId) {
  return run(
    db().from('activities').select('*').eq('course_id', courseId)
      .order('due_at', { ascending: true, nullsFirst: false }),
  );
}

export function createActivity(courseId, fields) {
  return run(db().from('activities').insert({ ...fields, course_id: courseId }).select().single());
}

export function setActivityPublished(id, published) {
  return run(db().from('activities').update({ published }).eq('id', id).select().single());
}

// ---------- Entregas ----------

export function listMySubmissions() {
  return run(db().from('submissions').select('*').eq('student_id', uid()));
}

export function saveSubmission(activityId, body, submit) {
  return run(
    db().from('submissions')
      .upsert(
        { activity_id: activityId, student_id: uid(), body, status: submit ? 'submitted' : 'draft' },
        { onConflict: 'activity_id,student_id' },
      )
      .select()
      .single(),
  );
}

export function listSubmissions(activityId) {
  return run(
    db().from('submissions')
      .select('id, student_id, body, status, grade, feedback, submitted_at, profiles(full_name)')
      .eq('activity_id', activityId)
      .order('submitted_at', { ascending: false, nullsFirst: false }),
  );
}

export function gradeSubmission(id, grade, feedback) {
  return run(
    db().from('submissions')
      .update({ grade, feedback, status: 'graded' })
      .eq('id', id)
      .select()
      .single(),
  );
}

// ---------- Avisos ----------

export function listNotifications() {
  return run(
    db().from('notifications').select('*')
      .eq('user_id', uid())
      .order('created_at', { ascending: false })
      .limit(50),
  );
}

export function markNotificationRead(id) {
  return run(db().from('notifications').update({ read: true }).eq('id', id));
}
