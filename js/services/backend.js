// Conta e sessão (Supabase). Quando a configuração não existe, o site segue em modo local.
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../config.js';

// Versão fixa do SDK. Atualize deliberadamente, testando antes.
const SDK_URL = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/+esm';

export const backendEnabled = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

let client = null;
const session = { user: null, profile: null, ready: false, error: null };
const listeners = new Set();

export function getSession() {
  return { ...session };
}

export function getDb() {
  return client;
}

export function onSessionChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function emit() {
  for (const fn of listeners) fn(getSession());
}

async function fetchProfile(userId) {
  const { data, error } = await client
    .from('profiles')
    .select('id, full_name, role')
    .eq('id', userId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

async function refreshFromClient() {
  const { data } = await client.auth.getSession();
  session.user = data.session?.user ?? null;
  session.profile = session.user ? await fetchProfile(session.user.id) : null;
  emit();
}

export async function initBackend() {
  if (!backendEnabled) {
    session.ready = true;
    return;
  }
  try {
    const { createClient } = await import(SDK_URL);
    client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, flowType: 'pkce' },
    });
    client.auth.onAuthStateChange(async (event) => {
      if (event === 'PASSWORD_RECOVERY') {
        location.hash = '#/redefinir-senha';
      }
      await refreshFromClient();
    });
    await refreshFromClient();
  } catch (error) {
    client = null;
    session.error = 'Não foi possível conectar ao serviço de conta. O site segue em modo local.';
    console.warn('FuturoLab: falha ao iniciar a conta.', error);
  }
  session.ready = true;
  emit();
}

function requireClient() {
  if (!client) throw new Error('Serviço de conta indisponível.');
  return client;
}

function appUrl(hash) {
  return `${location.origin}${location.pathname}${hash}`;
}

// Mensagens em português para os erros mais comuns do serviço.
export function friendlyError(error) {
  if (error?.code === 'P0001') return error.message; // mensagem lançada pelo próprio banco, já em português
  if (error?.code === '42501') return 'Você não tem permissão para realizar esta ação.';
  const m = String(error?.message ?? '').toLowerCase();
  if (m.includes('invalid login')) return 'E-mail ou senha incorretos.';
  if (m.includes('already registered') || m.includes('already been registered')) return 'Já existe uma conta com este e-mail.';
  if (m.includes('email not confirmed')) return 'Confirme seu e-mail antes de entrar. Verifique sua caixa de entrada.';
  if (m.includes('password should be at least')) return 'A senha precisa ter pelo menos 8 caracteres.';
  if (m.includes('rate limit') || m.includes('too many') || m.includes('security purposes')) {
    return 'Muitas tentativas. Aguarde alguns minutos e tente novamente.';
  }
  if (m.includes('failed to fetch') || m.includes('network') || m.includes('serviço de conta')) {
    return 'Sem conexão com o serviço. Verifique sua internet e tente novamente.';
  }
  return 'Não foi possível concluir a ação. Tente novamente.';
}

export async function signUp({ email, password, name }) {
  const { data, error } = await requireClient().auth.signUp({
    email,
    password,
    options: { data: { full_name: name }, emailRedirectTo: appUrl('#/entrar') },
  });
  if (error) throw error;
  return { needsConfirmation: !data.session };
}

export async function signIn(email, password) {
  const { error } = await requireClient().auth.signInWithPassword({ email, password });
  if (error) throw error;
  await refreshFromClient();
}

export async function signOut() {
  const { error } = await requireClient().auth.signOut();
  if (error) throw error;
  await refreshFromClient();
}

// Resposta idêntica para e-mails existentes e inexistentes, para não revelar quais contas existem.
export async function requestPasswordReset(email) {
  const { error } = await requireClient().auth.resetPasswordForEmail(email, {
    redirectTo: appUrl('#/redefinir-senha'),
  });
  if (error && !String(error.message).toLowerCase().includes('rate limit')) throw error;
}

export async function setNewPassword(password) {
  const { error } = await requireClient().auth.updateUser({ password });
  if (error) throw error;
}

// Recarrega usuário e perfil da sessão atual (ex.: depois de alterar o nome).
export async function reloadSession() {
  if (client) await refreshFromClient();
}
