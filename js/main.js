import { renderShell } from './layout.js';
import { startRouter, route } from './router.js';
import { emptyState } from './ui.js';
import { seedDemoData } from './store.js';
import { initBackend, onSessionChange } from './services/backend.js';
import { syncAchievements } from './services/achievements.js';
import { refreshReminders } from './services/notifications.js';
import { renderDashboard } from './pages/dashboard.js';
import { renderCourses, renderCourseDetail } from './pages/courses.js';
import { renderLesson } from './pages/lesson.js';
import { renderQuizList, renderQuiz } from './pages/quiz.js';
import { renderStudy } from './pages/study.js';
import { renderDecks, renderDeck } from './pages/flashcards.js';
import { renderLibrary } from './pages/library.js';
import { renderTasks } from './pages/tasks.js';
import { renderLabList, renderChallenge } from './pages/lab.js';
import { renderProjects, renderProject, renderPortfolio } from './pages/projects.js';
import { renderCareers } from './pages/careers.js';
import { renderPlanner } from './pages/planner.js';
import { renderTutor } from './pages/tutor.js';
import { renderNotifications } from './pages/notifications.js';
import { renderProfile } from './pages/profile.js';
import { renderMore } from './pages/more.js';
import { renderLogin, renderSignup, renderForgot, renderReset } from './pages/auth.js';
import { renderOnlineCatalog, renderOnlineCourse } from './pages/online.js';
import { renderTeacherHome, renderTeacherCourse } from './pages/teacher.js';

// 1) Sessão da conta (se configurada) antes de qualquer tela.
await initBackend();

// 2) Exemplos locais iniciais (removíveis no Perfil).
seedDemoData();

const app = document.getElementById('app');
const shell = renderShell(app);

route('/', renderDashboard);
route('/cursos', renderCourses);
route('/cursos/:id', renderCourseDetail);
route('/aula/:courseId/:lessonId', renderLesson);
route('/provas', renderQuizList);
route('/provas/:id', renderQuiz);
route('/estudos', renderStudy);
route('/estudos/:tab', renderStudy);
route('/flashcards', renderDecks);
route('/flashcards/:deckId', renderDeck);
route('/biblioteca', renderLibrary);
route('/tarefas', renderTasks);
route('/laboratorio', renderLabList);
route('/laboratorio/:id', renderChallenge);
route('/projetos', renderProjects);
route('/projetos/:id', renderProject);
route('/portfolio', renderPortfolio);
route('/carreiras', renderCareers);
route('/planejador', renderPlanner);
route('/tutor', renderTutor);
route('/avisos', renderNotifications);
route('/perfil', renderProfile);
route('/mais', renderMore);

// Conta online
route('/entrar', renderLogin);
route('/cadastro', renderSignup);
route('/esqueci-senha', renderForgot);
route('/redefinir-senha', renderReset);
route('/online', renderOnlineCatalog);
route('/online/:id', renderOnlineCourse);
route('/professor', renderTeacherHome);
route('/professor/cursos/:id', renderTeacherCourse);

// Quando a sessão muda (entrar, sair, recuperar senha), atualiza o topo e a tela atual.
onSessionChange(() => shell.refresh(location.hash.replace(/^#/, '') || '/'));

startRouter({
  outlet: shell.main,
  onRender: (path) => {
    shell.refresh(path);
    syncAchievements();
    refreshReminders();
  },
  notFound: (outlet, ctx) => {
    ctx.setTitle('Página não encontrada');
    outlet.append(
      emptyState({
        title: 'Página não encontrada.',
        text: 'O endereço não existe ou foi alterado.',
        action: { label: 'Voltar ao início', href: '#/' },
      }),
    );
  },
});

