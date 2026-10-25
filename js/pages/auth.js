import { el, card, pageHead, field, textInput, notice, emptyState, toast, sectionTitle, tag } from '../ui.js';
import { getSession, backendEnabled, signIn, signUp, signOut, requestPasswordReset, setNewPassword, friendlyError, reloadSession } from '../services/backend.js';
import { updateMyName } from '../services/online.js';
import { validateEmail, validatePassword, validateName } from '../services/validate.js';

export const ROLE_LABEL = { student: 'Estudante', teacher: 'Professor', admin: 'Administrador' };

function setError(input, errorEl, message) {
  errorEl.textContent = message;
  input.setAttribute('aria-invalid', 'true');
  input.focus();
}

// Desativa o botão durante a ação, para evitar envios duplicados.
async function busy(button, fn) {
  if (button.disabled) return;
  const label = button.textContent;
  button.disabled = true;
  button.textContent = 'Aguarde...';
  try {
    return await fn();
  } finally {
    button.disabled = false;
    button.textContent = label;
  }
}

function backendOff(ctx) {
  return emptyState({
    title: 'Conta online não configurada.',
    text: 'Esta função precisa do serviço de conta. Quem publica o site deve configurar as chaves em js/config.js (veja o README).',
    action: { label: 'Voltar ao início', href: '#/' },
  });
}

function errorLine() {
  return el('p', { class: 'field-error', role: 'alert', 'aria-live': 'assertive' });
}

export function renderLogin(outlet, ctx) {
  ctx.setTitle('Entrar');
  if (!backendEnabled) return outlet.append(backendOff(ctx));
  if (getSession().user) return ctx.navigate('/');

  const email = textInput({ id: 'login-email', type: 'email', autocomplete: 'email', inputmode: 'email' });
  const password = textInput({ id: 'login-password', type: 'password', autocomplete: 'current-password' });
  const error = errorLine();
  const button = el('button', { class: 'btn btn-primary', type: 'submit' }, 'Entrar');

  const form = el(
    'form',
    {
      class: 'stack-form',
      novalidate: true,
      onsubmit: async (event) => {
        event.preventDefault();
        error.textContent = '';
        const emailProblem = validateEmail(email.value);
        if (emailProblem) return setError(email, error, emailProblem);
        if (!password.value) return setError(password, error, 'Informe sua senha.');
        await busy(button, async () => {
          try {
            await signIn(email.value.trim(), password.value);
            toast('Bem-vindo de volta!');
            ctx.navigate('/');
          } catch (err) {
            error.textContent = friendlyError(err);
          }
        });
      },
    },
    field('E-mail', email),
    field('Senha', password),
    error,
    button,
  );

  outlet.append(
    pageHead('Conta', 'Entrar', 'Use o e-mail e a senha da sua conta.'),
    card('s-6', form),
    el('p', { class: 'muted' }, 'Ainda não tem conta? ', el('a', { href: '#/cadastro' }, 'Criar conta')),
    el('p', { class: 'muted' }, el('a', { href: '#/esqueci-senha' }, 'Esqueci minha senha')),
  );
}

export function renderSignup(outlet, ctx) {
  ctx.setTitle('Criar conta');
  if (!backendEnabled) return outlet.append(backendOff(ctx));

  const name = textInput({ id: 'signup-name', autocomplete: 'name', maxlength: '40' });
  const email = textInput({ id: 'signup-email', type: 'email', autocomplete: 'email', inputmode: 'email' });
  const password = textInput({ id: 'signup-password', type: 'password', autocomplete: 'new-password' });
  const confirm = textInput({ id: 'signup-confirm', type: 'password', autocomplete: 'new-password' });
  const error = errorLine();
  const result = el('div', { role: 'status', 'aria-live': 'polite' });
  const button = el('button', { class: 'btn btn-primary', type: 'submit' }, 'Criar conta');

  const form = el(
    'form',
    {
      class: 'stack-form',
      novalidate: true,
      onsubmit: async (event) => {
        event.preventDefault();
        error.textContent = '';
        const nameCheck = validateName(name.value);
        if (!nameCheck.ok) return setError(name, error, nameCheck.message);
        const emailProblem = validateEmail(email.value);
        if (emailProblem) return setError(email, error, emailProblem);
        const passProblem = validatePassword(password.value);
        if (passProblem) return setError(password, error, passProblem);
        if (password.value !== confirm.value) return setError(confirm, error, 'As senhas não coincidem.');

        await busy(button, async () => {
          try {
            const { needsConfirmation } = await signUp({ email: email.value.trim(), password: password.value, name: nameCheck.value });
            form.replaceWith(
              notice(
                'success',
                needsConfirmation
                  ? 'Conta criada. Enviamos um link de confirmação para o seu e-mail. Confirme e depois entre na sua conta.'
                  : 'Conta criada com sucesso. Você já está conectado.',
                'tick',
              ),
            );
            if (!needsConfirmation) setTimeout(() => ctx.navigate('/'), 800);
          } catch (err) {
            error.textContent = friendlyError(err);
          }
        });
      },
    },
    field('Nome completo', name, 'Como você quer aparecer na plataforma.'),
    field('E-mail', email),
    field('Senha', password, 'Mínimo de 8 caracteres, com letras e números.'),
    field('Confirmar senha', confirm),
    error,
    button,
  );

  outlet.append(
    pageHead('Conta', 'Criar conta', 'Ao se cadastrar, você entra como estudante. Professores são cadastrados pela administração.'),
    card('s-6', form, result),
    el('p', { class: 'muted' }, 'Já tem conta? ', el('a', { href: '#/entrar' }, 'Entrar')),
  );
}

export function renderForgot(outlet, ctx) {
  ctx.setTitle('Recuperar senha');
  if (!backendEnabled) return outlet.append(backendOff(ctx));

  const email = textInput({ id: 'forgot-email', type: 'email', autocomplete: 'email', inputmode: 'email' });
  const error = errorLine();
  const button = el('button', { class: 'btn btn-primary', type: 'submit' }, 'Enviar link');

  const form = el(
    'form',
    {
      class: 'stack-form',
      novalidate: true,
      onsubmit: async (event) => {
        event.preventDefault();
        error.textContent = '';
        const problem = validateEmail(email.value);
        if (problem) return setError(email, error, problem);
        await busy(button, async () => {
          try {
            await requestPasswordReset(email.value.trim());
            form.replaceWith(notice('success', 'Se este e-mail estiver cadastrado, o link foi enviado. Confira também a caixa de spam.', 'info'));
          } catch (err) {
            error.textContent = friendlyError(err);
          }
        });
      },
    },
    field('E-mail da conta', email),
    error,
    button,
  );

  outlet.append(
    pageHead('Conta', 'Recuperar senha', 'Informe o e-mail da conta. Se ele existir, enviaremos um link para criar uma nova senha.'),
    card('s-6', form),
  );
}

export function renderReset(outlet, ctx) {
  ctx.setTitle('Nova senha');
  if (!backendEnabled) return outlet.append(backendOff(ctx));
  if (!getSession().user) {
    return outlet.append(
      emptyState({
        title: 'Link inválido ou expirado.',
        text: 'Solicite um novo link de recuperação de senha.',
        action: { label: 'Solicitar novo link', href: '#/esqueci-senha' },
      }),
    );
  }

  const password = textInput({ id: 'reset-password', type: 'password', autocomplete: 'new-password' });
  const confirm = textInput({ id: 'reset-confirm', type: 'password', autocomplete: 'new-password' });
  const error = errorLine();
  const button = el('button', { class: 'btn btn-primary', type: 'submit' }, 'Salvar nova senha');

  outlet.append(
    pageHead('Conta', 'Definir nova senha'),
    card(
      's-6',
      el(
        'form',
        {
          class: 'stack-form',
          novalidate: true,
          onsubmit: async (event) => {
            event.preventDefault();
            error.textContent = '';
            const problem = validatePassword(password.value);
            if (problem) return setError(password, error, problem);
            if (password.value !== confirm.value) return setError(confirm, error, 'As senhas não coincidem.');
            await busy(button, async () => {
              try {
                await setNewPassword(password.value);
                toast('Senha alterada com sucesso.');
                ctx.navigate('/');
              } catch (err) {
                error.textContent = friendlyError(err);
              }
            });
          },
        },
        field('Nova senha', password, 'Mínimo de 8 caracteres, com letras e números.'),
        field('Confirmar nova senha', confirm),
        error,
        button,
      ),
    ),
  );
}

// Cartão de conta exibido no perfil: dados, edição do nome e saída.
export function renderAccountCard(parent) {
  const s = getSession();
  if (!backendEnabled) {
    parent.append(card('s-12', sectionTitle('Conta online'), notice('info', 'Conta online não configurada neste site. Os dados ficam apenas neste navegador.', 'info')));
    return;
  }
  if (!s.user) {
    parent.append(
      card(
        's-12',
        sectionTitle('Conta online'),
        el('p', { class: 'muted' }, 'Entre ou crie uma conta para salvar seu progresso e acessar cursos online.'),
        el('div', { class: 'cta-row' }, el('a', { class: 'btn btn-primary', href: '#/entrar' }, 'Entrar'), el('a', { class: 'btn btn-ghost', href: '#/cadastro' }, 'Criar conta')),
      ),
    );
    return;
  }

  const roleName = ROLE_LABEL[s.profile?.role] ?? 'Estudante';
  const nameInput = textInput({ id: 'account-name', maxlength: '40', value: s.profile?.full_name ?? '' });
  const error = errorLine();
  const saveBtn = el('button', { class: 'btn btn-primary', type: 'submit' }, 'Salvar nome');

  const logout = el('button', {
    class: 'btn btn-ghost btn-danger',
    type: 'button',
    onclick: async () => {
      if (!window.confirm('Encerrar a sessão neste aparelho?')) return;
      try {
        await signOut();
        toast('Sessão encerrada.');
        location.hash = '#/';
      } catch (err) {
        toast(friendlyError(err), 'error');
      }
    },
  }, 'Sair da conta');

  parent.append(
    card(
      's-12',
      sectionTitle('Conta online', tag(roleName, 'primary')),
      el('p', { class: 'muted' }, `E-mail: ${s.user.email ?? '—'}`),
      el(
        'form',
        {
          class: 'stack-form',
          novalidate: true,
          onsubmit: async (event) => {
            event.preventDefault();
            error.textContent = '';
            const check = validateName(nameInput.value);
            if (!check.ok) return setError(nameInput, error, check.message);
            await busy(saveBtn, async () => {
              try {
                await updateMyName(check.value);
                await reloadSession();
                toast('Nome atualizado.');
              } catch (err) {
                error.textContent = friendlyError(err);
              }
            });
          },
        },
        field('Nome de exibição', nameInput),
        error,
        saveBtn,
      ),
      el('div', { class: 'cta-row' }, logout),
    ),
  );
}
