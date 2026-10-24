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
