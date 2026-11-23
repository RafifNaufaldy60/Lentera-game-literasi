import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import { accountHome, useAuth } from '../auth/AuthContext.js';
import { validateAuthInput } from '../../shared/auth-validation.js';

export default function AuthPage({ registering = false }) {
  const { register, login, refreshSession } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [values, setValues] = useState({ name: '', email: location.state?.email || '', password: '' });
  const [fields, setFields] = useState({});
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [visiblePassword, setVisiblePassword] = useState(false);
  const errorRef = useRef(null);
  const title = registering ? 'Daftar' : 'Masuk';

  useEffect(() => { document.title = `${title} | Lentera PLAY`; }, [title]);
  useEffect(() => { if (error) errorRef.current?.focus(); }, [error]);

  function change(event) {
    const { name, value } = event.target;
    setValues((previous) => ({ ...previous, [name]: value }));
    setFields((previous) => ({ ...previous, [name]: undefined }));
  }

  async function submit(event) {
    event.preventDefault();
    if (submitting) return;
    const checked = validateAuthInput(values, registering);
    setFields(checked.errors);
    if (Object.keys(checked.errors).length) {
      setError('Periksa kembali isian formulir.');
      errorRef.current?.focus();
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      if (registering) {
        await register(checked.values);
        navigate('/masuk', { replace: true, state: { registered: true, email: checked.values.email } });
      } else {
        const user = await login(checked.values);
        navigate(accountHome(user), { replace: true });
      }
    } catch (failure) {
      setFields(failure.fields || {});
      setError(failure.message);
      if (failure.code === 'CSRF_EXPIRED') await refreshSession({ silent: true });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-layout">
      <section className="auth-form-section" aria-labelledby="form-title">
        <h1 id="form-title">{title}</h1>
        <p className="form-intro">{registering ? 'Buat akun pemain untuk membuka misi pertamamu.' : 'Selamat datang kembali. Lanjutkan petualangan digitalmu.'}</p>
        {!registering && location.state?.registered && <p className="notice success" role="status">Akun berhasil dibuat. Silakan masuk.</p>}
        {error && <p className="notice error" role="alert" tabIndex={-1} ref={errorRef}>{error}</p>}
        <form onSubmit={submit} noValidate aria-busy={submitting}>
          {registering && <div className="field">
            <label htmlFor="name">Nama</label>
            <input id="name" name="name" autoComplete="name" required maxLength={80} value={values.name} onChange={change} aria-invalid={Boolean(fields.name)} aria-describedby={fields.name ? 'name-error' : undefined} />
            {fields.name && <p className="field-error" id="name-error">{fields.name}</p>}
          </div>}
          <div className="field">
            <label htmlFor="email">Email</label>
            <input id="email" name="email" type="email" inputMode="email" autoComplete="email" autoCapitalize="none" spellCheck={false} required maxLength={254} value={values.email} onChange={change} aria-invalid={Boolean(fields.email)} aria-describedby={fields.email ? 'email-error' : undefined} />
            {fields.email && <p className="field-error" id="email-error">{fields.email}</p>}
          </div>
          <div className="field">
            <label htmlFor="password">Password</label>
            <div className="password-field">
              <input id="password" name="password" type={visiblePassword ? 'text' : 'password'} autoComplete={registering ? 'new-password' : 'current-password'} required minLength={registering ? 15 : undefined} maxLength={128} value={values.password} onChange={change} aria-invalid={Boolean(fields.password)} aria-describedby={[registering ? 'password-help' : '', fields.password ? 'password-error' : ''].filter(Boolean).join(' ') || undefined} />
              <button type="button" className="password-toggle" aria-label={visiblePassword ? 'Sembunyikan password' : 'Tampilkan password'} aria-pressed={visiblePassword} onClick={() => setVisiblePassword((visible) => !visible)}>{visiblePassword ? 'Sembunyikan' : 'Lihat'}</button>
            </div>
            {registering && <p id="password-help" className="field-help">Gunakan 15 sampai 128 karakter. Boleh berupa kalimat yang mudah Anda ingat.</p>}
            {fields.password && <p className="field-error" id="password-error">{fields.password}</p>}
          </div>
          <button className="button primary submit-button" type="submit" disabled={submitting}>{submitting ? (registering ? 'Membuat akun…' : 'Memeriksa akun…') : (registering ? 'Buat akun' : 'Masuk')}</button>
          <p className="form-alternative">{registering ? 'Sudah punya akun?' : 'Belum punya akun?'} <Link to={registering ? '/masuk' : '/daftar'}>{registering ? 'Masuk' : 'Daftar'}</Link></p>
        </form>
      </section>
      <aside className="learning-note" aria-label="Catatan literasi digital">
        <p className="note-label">LENTERA / DIGITAL ADVENTURE</p>
        <h2>Setiap pilihan<br className="desktop-break" /> menentukan cerita.</h2>
        <p>Telusuri kasus phishing, bantu teman menghadapi cyberbullying, dan lindungi data pribadimu melalui misi interaktif.</p>
        <img className="auth-quest-art" src="/illustrations/hero-quest.svg" alt="" />
        <div className="note-bottom"><span>4 topik digital.</span><span>5 chapter cerita.</span><span>Skor & badge pemain.</span></div>
      </aside>
    </div>
  );
}
