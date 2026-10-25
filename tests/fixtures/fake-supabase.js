// Cliente falso do Supabase, só para testar as telas online sem rede.
// Não valida RLS nem regras do banco: isso precisa ser verificado no projeto real.
const USER = { id: 't1', email: 'prof@exemplo.com' };
const data = {
  profiles: [{ id: 't1', full_name: 'Prof Carla', role: 'teacher' }],
  courses: [{ id: 'c1', owner_id: 't1', title: 'Informática básica', description: 'Curso de teste', category: 'Informática', level: 'Iniciante', access: 'enrollment', status: 'draft' }],
  activities: [{ id: 'a1', course_id: 'c1', title: 'Atividade 1', instructions: 'Escreva um parágrafo.\nEntregue em texto.', due_at: null, max_points: 10, published: true }],
  enrollments: [{ course_id: 'c1', student_id: 's1', profiles: { full_name: 'Ana' } }],
  submissions: [{ id: 'sub1', activity_id: 'a1', student_id: 's1', body: 'Resposta', status: 'submitted', grade: null, feedback: '', submitted_at: null, profiles: { full_name: 'Ana' } }],
  notifications: [],
};

function builder(table) {
  let rows = (data[table] ?? []).map((r) => ({ ...r }));
  let mode = 'many';
  const api = {
    select() { return api; }, eq() { return api; }, order() { return api; }, limit() { return api; },
    insert(v) { rows = [{ id: 'new', ...v }]; return api; },
    update() { return api; },
    upsert(v) { rows = [{ id: 'new', ...v }]; return api; },
    maybeSingle() { mode = 'maybe'; return api; },
    single() { mode = 'one'; return api; },
    then(resolve, reject) {
      const out = mode === 'many' ? { data: rows, error: null } : { data: rows[0] ?? null, error: null };
      return Promise.resolve(out).then(resolve, reject);
    },
  };
  return api;
}

export function createClient() {
  return {
    auth: {
      getSession: async () => ({ data: { session: { user: USER } } }),
      onAuthStateChange: () => ({ data: {} }),
      signInWithPassword: async () => ({ error: null }),
      signUp: async () => ({ data: { session: null }, error: null }),
      resetPasswordForEmail: async () => ({ error: null }),
      updateUser: async () => ({ error: null }),
      refreshSession: async () => ({ error: null }),
      signOut: async () => ({ error: null }),
    },
    from: (table) => builder(table),
  };
}
