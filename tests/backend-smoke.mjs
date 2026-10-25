// Testa as telas da conta online com um cliente falso (sem rede e sem Supabase real).
import { cpSync, mkdtempSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const tmp = mkdtempSync(join(tmpdir(), 'futurolab-backend-'));
cpSync(join(here, '..', 'js'), join(tmp, 'js'), { recursive: true });

// Aponta o SDK para o cliente falso e ativa a configuração no código de teste.
const fakeUrl = pathToFileURL(join(here, 'fixtures', 'fake-supabase.js')).href;
const backendPath = join(tmp, 'js', 'services', 'backend.js');
writeFileSync(backendPath, readFileSync(backendPath, 'utf8').replace(/const SDK_URL = '[^']+';/, `const SDK_URL = '${fakeUrl}';`));
const configPath = join(tmp, 'js', 'config.js');
writeFileSync(configPath, readFileSync(configPath, 'utf8')
  .replace('export const SUPABASE_URL = null;', "export const SUPABASE_URL = 'https://fake.supabase.co';")
  .replace('export const SUPABASE_ANON_KEY = null;', "export const SUPABASE_ANON_KEY = 'anon-de-teste';"));

const shim = await import('./dom-shim.mjs');
const { app, fireHashChange } = shim;
const errors = [];
const unhandled = [];
console.error = (...a) => errors.push(a.map(String).join(' '));
console.warn = () => {};
process.on('unhandledRejection', (e) => unhandled.push(String(e?.stack ?? e)));

location.hash = '#/';
await import(pathToFileURL(join(tmp, 'js', 'main.js')).href);
await new Promise((r) => setTimeout(r, 50));

const routes = ['/', '/perfil', '/mais', '/entrar', '/cadastro', '/esqueci-senha', '/redefinir-senha',
  '/online', '/online/c1', '/professor', '/professor/cursos/c1'];

const failures = [];
for (const r of routes) {
  errors.length = 0;
  location.hash = `#${r}`;
  fireHashChange();
  await new Promise((res) => setTimeout(res, 40));
  if (errors.length) failures.push(`${r}: ${errors[0]}`);
}

// Confirma que o modo conta foi realmente ativado (e não o modo local).
location.hash = '#/professor';
fireHashChange();
await new Promise((res) => setTimeout(res, 40));
const teacherText = app.textContent;
if (!teacherText.includes('Informática básica')) failures.push('área do professor não listou o curso do cliente falso');
if (teacherText.includes('Conta online não configurada')) failures.push('modo conta não foi ativado');

rmSync(tmp, { recursive: true, force: true });
if (unhandled.length) failures.push(`promessas sem tratamento: ${unhandled[0]}`);

if (failures.length) {
  process.stdout.write('FALHAS na conta online:\n' + failures.map((f) => ' - ' + f).join('\n') + '\n');
  process.exit(1);
}
process.stdout.write(`Conta online (cliente falso): ${routes.length} telas renderizadas sem erro.\n`);
