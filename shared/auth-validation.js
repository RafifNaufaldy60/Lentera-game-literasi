export const PASSWORD_MIN_LENGTH = 15;
export const PASSWORD_MAX_LENGTH = 128;

export function normalizeEmail(value) {
  return typeof value === 'string' ? value.trim().toLowerCase() : '';
}

export function validateAuthInput(input, registering = false) {
  const values = {
    name: typeof input?.name === 'string' ? input.name.trim() : '',
    email: normalizeEmail(input?.email),
    password: typeof input?.password === 'string' ? input.password : '',
  };
  const errors = {};
  if (registering && (!values.name || values.name.length > 80)) errors.name = 'Isi nama Anda, maksimal 80 karakter.';
  if (values.email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) errors.email = 'Masukkan alamat email yang valid.';
  if (!values.password) errors.password = 'Masukkan password Anda.';
  else if (values.password.length > PASSWORD_MAX_LENGTH || (registering && values.password.length < PASSWORD_MIN_LENGTH)) {
    errors.password = `Gunakan password dengan ${PASSWORD_MIN_LENGTH} sampai ${PASSWORD_MAX_LENGTH} karakter.`;
  }
  return { values, errors };
}
