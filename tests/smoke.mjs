import { fireHashChange, app } from './dom-shim.mjs';

const errors = [];
const origError = console.error;
console.error = (...args) => { errors.push(args.map(String).join(' ')); };
const origWarn = console.warn;
console.warn = () => {};

// Primeira rota antes do import: o main renderiza o hash atual.
location.hash = '#/';
await import('../js/main.js');

const store = await import('../js/store.js');
const state = store.getState();
const deck = state.decks[0];
const task = state.tasks[0];
const project = state.projects[0];

const routes = [
  '/', '/cursos', '/cursos/introducao-programacao', '/cursos/nao-existe',
  '/aula/introducao-programacao/ip-m1-a1', '/aula/logica-algoritmos/la-m1-a2', '/aula/x/y',
  '/provas', '/provas/introducao-programacao', '/provas/simulado',
  '/estudos', '/estudos/favoritos', '/estudos/historico', '/estudos/objetivos', '/estudos/conceitos',
  '/flashcards', `/flashcards/${deck.id}`, '/flashcards/inexistente',
  '/biblioteca', '/tarefas', '/laboratorio', '/laboratorio/soma', '/laboratorio/maior-da-lista', '/laboratorio/nope',
  '/projetos', `/projetos/${project.id}`, '/portfolio', '/carreiras', '/planejador',
  '/tutor', '/avisos', '/perfil', '/mais', '/pagina-inexistente',
  '/entrar', '/cadastro', '/esqueci-senha', '/redefinir-senha', '/online', '/online/abc', '/professor', '/professor/cursos/abc',
];

const failures = [];
for (const r of routes) {
  errors.length = 0;
  location.hash = `#${r}`;
  fireHashChange();
  if (errors.length) failures.push({ route: r, error: errors[0] });
  if (!app.childNodes.length) failures.push({ route: r, error: 'shell vazio' });
}

// Rota de tarefa com ID real (lista de tarefas renderiza o formulário de edição via view)
console.error = origError;
console.warn = origWarn;

if (failures.length) {
  console.log('FALHAS:');
  for (const f of failures) console.log(' -', f.route, '=>', f.error);
  process.exit(1);
}
console.log(`Smoke test: ${routes.length} rotas renderizadas sem erro.`);
