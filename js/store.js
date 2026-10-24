// Estado central do FuturoLab, salvo neste navegador (localStorage).
// Não há sincronização entre aparelhos nem autenticação real: ver README, seção "Limites".

const KEY = 'futurolab:v2';
const LEGACY_KEY = 'futurolab:v1';

// ---------- Datas (sempre no fuso local, formato YYYY-MM-DD) ----------

export function dayKey(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function parseDay(key) {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function dayOffset(days, from = new Date()) {
  return dayKey(new Date(from.getFullYear(), from.getMonth(), from.getDate() + days));
}

export function uid(prefix = 'id') {
  return `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
}

// ---------- Estado ----------

function defaults() {
  return {
    version: 2,
    seeded: false,
    profile: { name: '', weeklyGoalMinutes: 120 },
    lessons: {}, // lessonId -> { doneAt }
    lastLesson: null, // { courseId, lessonId }
    notes: [], // anotações pessoais: { id, title, body, lessonId?, updatedAt }
    favorites: [], // ids de materiais da biblioteca
    history: [], // { id, at }
    tasks: [],
    decks: [], // conjuntos de flashcards
    quizzes: {}, // quizId -> { attempts: [{ at, score, total, percent }], firstPassAwarded }
    labs: {}, // challengeId -> { attempts: [{ at, passed }], hintsUsed, completedAt, lastCode }
    projects: [],
    careerPlan: { interest: '', goal: '', current: '', toDevelop: '', courses: '', projects: '', nextActions: '' },
    careerActivities: {}, // scenarioId -> { selected: [], reflection: '' }
    sessions: [], // sessões de foco concluídas: { id, at, minutes }
    studyPlan: [], // { id, date, courseId, minutes, note }
    activity: {}, // dayKey -> { minutes, actions }
    xp: { events: {} }, // eventKey -> xp
    achievements: [], // ids já desbloqueadas
    notifications: [], // { id, key, title, text, link, at, read }
    tutorChats: [], // { role: 'user'|'tutor', text, at }
  };
}

function merge(base, saved) {
  return {
    ...base,
    ...saved,
    profile: { ...base.profile, ...(saved?.profile ?? {}) },
    careerPlan: { ...base.careerPlan, ...(saved?.careerPlan ?? {}) },
  };
}

function load() {
  try {
    const raw = globalThis.localStorage?.getItem(KEY);
    if (raw) return merge(defaults(), JSON.parse(raw));

    // Migração da versão 1 (só guardava o nome)
    const legacy = globalThis.localStorage?.getItem(LEGACY_KEY);
    if (legacy) {
      const base = defaults();
      base.profile.name = JSON.parse(legacy)?.profile?.name ?? '';
      return base;
    }
  } catch (error) {
    console.warn('FuturoLab: não foi possível ler os dados salvos.', error);
  }
  return defaults();
}

let state = load();
const listeners = new Set();

export function getState() {
  return state;
}

export function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

// Aplica uma mudança, salva e avisa os assinantes. Retorna false se não foi possível salvar.
export function update(mutator) {
  mutator(state);
  let saved = true;
  try {
    globalThis.localStorage?.setItem(KEY, JSON.stringify(state));
  } catch (error) {
    saved = false;
    console.warn('FuturoLab: não foi possível salvar os dados.', error);
  }
  listeners.forEach((listener) => listener(state));
  return saved;
}

export function exportData() {
  return JSON.stringify({ exportedAt: new Date().toISOString(), data: state }, null, 2);
}

export function resetAll() {
  state = defaults();
  try {
    globalThis.localStorage?.removeItem(KEY);
    globalThis.localStorage?.removeItem(LEGACY_KEY);
  } catch (error) {
    console.warn(error);
  }
  listeners.forEach((listener) => listener(state));
}

// ---------- Exemplos iniciais (marcados com demo: true, removíveis) ----------

export function seedDemoData() {
  if (state.seeded) return;
  const today = new Date();
  update((s) => {
    s.tasks.push(
      {
        id: uid('task'),
        demo: true,
        title: 'Exercício: condicionais',
        description: 'Resolver os dois primeiros desafios do módulo de condicionais.',
        courseId: 'logica-algoritmos',
        createdAt: dayKey(today),
        due: dayOffset(1, today),
        priority: 'alta',
        status: 'a-fazer',
        estimate: 40,
        subtasks: [
          { id: uid('sub'), title: 'Ler o enunciado', done: false },
          { id: uid('sub'), title: 'Escrever o código', done: false },
        ],
        notes: '',
        completedAt: null,
      },
      {
        id: uid('task'),
        demo: true,
        title: 'Questionário do módulo 1',
        description: '',
        courseId: 'introducao-programacao',
        createdAt: dayKey(today),
        due: dayOffset(3, today),
        priority: 'media',
        status: 'a-fazer',
        estimate: 20,
        subtasks: [],
        notes: '',
        completedAt: null,
      },
    );

    s.decks.push({
      id: uid('deck'),
      demo: true,
      title: 'Conceitos básicos de programação',
      courseId: 'introducao-programacao',
      cards: [
        ['Variável', 'Espaço nomeado na memória que guarda um valor que pode mudar.'],
        ['Algoritmo', 'Sequência finita de passos para resolver um problema.'],
        ['Condicional', 'Estrutura que executa um bloco de código somente se uma condição for verdadeira.'],
        ['Laço de repetição', 'Estrutura que repete um bloco enquanto uma condição for verdadeira.'],
        ['Função', 'Bloco de código nomeado, que recebe dados e pode devolver um resultado.'],
      ].map(([front, back]) => ({
        id: uid('card'),
        front,
        back,
        ease: 2.5,
        interval: 0,
        reps: 0,
        due: dayKey(today),
      })),
    });

    s.projects.push({
      id: uid('proj'),
      demo: true,
      title: 'Página pessoal de apresentação',
      problem: 'Apresentar quem você é e o que estuda, em uma página web.',
      objective: 'Praticar HTML e CSS com um projeto real.',
      status: 'planejado',
      checklist: [
        { id: uid('chk'), label: 'Estrutura da página com HTML', done: false },
        { id: uid('chk'), label: 'Estilos com CSS', done: false },
        { id: uid('chk'), label: 'Seção de projetos', done: false },
        { id: uid('chk'), label: 'Publicar ou salvar o arquivo', done: false },
      ],
      observations: '',
      links: '',
      criteria: 'Página legível em celular e computador, com pelo menos três seções.',
    });

    s.seeded = true;
  });
}

// Remove apenas os exemplos, mantendo o que o estudante criou.
export function removeDemoData() {
  update((s) => {
    s.tasks = s.tasks.filter((t) => !t.demo);
    s.decks = s.decks.filter((d) => !d.demo);
    s.projects = s.projects.filter((p) => !p.demo);
  });
}
