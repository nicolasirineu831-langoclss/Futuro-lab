export function validateName(raw) {
  const value = String(raw ?? '').trim().replace(/\s+/g, ' ');

  if (!value) return { ok: false, message: 'Digite um nome para continuar.' };
  if (value.length < 2) return { ok: false, message: 'O nome precisa ter pelo menos 2 letras.' };
  if (value.length > 40) return { ok: false, message: 'Use no máximo 40 caracteres.' };
  if (!/^[\p{L}][\p{L} .'-]*$/u.test(value)) {
    return { ok: false, message: 'Use apenas letras, espaços, ponto, hífen ou apóstrofo.' };
  }
  return { ok: true, value };
}

export function validateEmail(raw) {
  const value = String(raw ?? '').trim();
  if (!value) return 'Informe seu e-mail.';
  if (value.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value)) return 'Informe um e-mail válido.';
  return null;
}

export function validatePassword(raw) {
  const value = String(raw ?? '');
  if (!value) return 'Informe uma senha.';
  if (value.length < 8) return 'A senha precisa ter pelo menos 8 caracteres.';
  if (value.length > 72) return 'Use no máximo 72 caracteres.';
  if (!/[A-Za-z]/.test(value) || !/\d/.test(value)) return 'Use letras e números na senha.';
  return null;
}
