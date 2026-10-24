import { el, textInput, field } from './ui.js';
import { update } from './store.js';
import { validateName } from './services/validate.js';

export function nameForm({ value = '', onSaved } = {}) {
  const input = textInput({
    id: 'profile-name',
    name: 'name',
    autocomplete: 'given-name',
    maxlength: '40',
    placeholder: 'Ex.: Ana Souza',
    value,
    'aria-describedby': 'profile-name-error',
  });
  const error = el('p', { id: 'profile-name-error', class: 'field-error', 'aria-live': 'polite' });

  return el(
    'form',
    {
      class: 'stack-form',
      novalidate: true,
      onsubmit: (event) => {
        event.preventDefault();
        error.textContent = '';
        input.removeAttribute('aria-invalid');

        const result = validateName(input.value);
        if (!result.ok) {
          error.textContent = result.message;
          input.setAttribute('aria-invalid', 'true');
          input.focus();
          return;
        }

        const saved = update((s) => {
          s.profile.name = result.value;
        });
        if (!saved) {
          error.textContent = 'Não foi possível salvar neste navegador. Verifique se o armazenamento local está permitido.';
          return;
        }
        onSaved?.(result.value);
      },
    },
    field('Nome de exibição', input, 'De 2 a 40 letras. Fica salvo neste aparelho.'),
    error,
    el('button', { class: 'btn btn-primary', type: 'submit' }, 'Salvar nome'),
  );
}
