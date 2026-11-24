import { randomBytes, timingSafeEqual } from 'node:crypto';
import express from 'express';
import session from 'express-session';
import connectPgSimple from 'connect-pg-simple';
import { rateLimit } from 'express-rate-limit';
import { validateAuthInput } from '../shared/auth-validation.js';
import { hashPassword, verifyPassword } from './passwords.js';
import { registerLearningRoutes } from './learning-routes.js';
import { registerShopRoutes } from './shop-routes.js';

const PgSessionStore = connectPgSimple(session);
const sessionAction = (request, action) => new Promise((resolve, reject) => {
  request.session[action]((error) => error ? reject(error) : resolve());
});
const publicUser = ({ id, name, email, role }) => ({ id, name, email, role });

export async function createApp({ pool, sessionSecret, appOrigin = 'http://localhost:5173', isProduction = false, trustProxy = false }) {
  if (typeof sessionSecret !== 'string' || sessionSecret.length < 32) {
    throw new Error('SESSION_SECRET belum siap. Jalankan npm.cmd run auth:setup.');
  }
  const origin = new URL(appOrigin).origin;
  const app = express();
  const cookieName = isProduction ? '__Host-literasi.sid' : 'literasi.sid';
  const cookieOptions = { httpOnly: true, sameSite: 'lax', secure: isProduction, path: '/' };
  const store = new PgSessionStore({
    pool, schemaName: 'public', tableName: 'user_sessions', createTableIfMissing: false,
    pruneSessionInterval: 900,
    errorLog: () => console.error('Penyimpanan sesi tidak tersedia.'),
  });
  const dummyHash = await hashPassword(randomBytes(32).toString('hex'));

  app.disable('x-powered-by');
  if (trustProxy) app.set('trust proxy', 1);
  app.get('/health', async (_req, res) => {
    await pool.query('SELECT 1');
    res.json({ status: 'connected' });
  });
  app.use('/api', (_req, res, next) => {
    res.set('Cache-Control', 'no-store');
    next();
  });
  app.use('/api', express.json({ limit: '64kb' }), session({
    name: cookieName, secret: sessionSecret, store,
    resave: false, saveUninitialized: false,
    cookie: { ...cookieOptions, maxAge: 8 * 60 * 60 * 1000 },
  }));

  function csrfToken(req) {
    req.session.csrfToken ??= randomBytes(32).toString('hex');
    return req.session.csrfToken;
  }

  async function sessionUser(req) {
    if (!req.session.userId) return null;
    const result = await pool.query('SELECT id, name, email, role FROM public.users WHERE id = $1 AND is_active = TRUE', [req.session.userId]);
    if (!result.rowCount) {
      await sessionAction(req, 'regenerate');
      return null;
    }
    return publicUser(result.rows[0]);
  }

  app.use('/api', (req, res, next) => {
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
    if ((req.get('origin') && req.get('origin') !== origin) || req.get('sec-fetch-site') === 'cross-site') {
      return res.status(403).json({ error: 'Asal permintaan tidak diizinkan.' });
    }
    const submitted = req.get('x-csrf-token');
    const expected = req.session.csrfToken;
    if (!/^[a-f0-9]{64}$/.test(submitted ?? '') || !expected || !timingSafeEqual(Buffer.from(submitted), Buffer.from(expected))) {
      return res.status(403).json({ error: 'Sesi formulir sudah berakhir. Muat ulang halaman dan coba lagi.', code: 'CSRF_EXPIRED' });
    }
    if (!req.is('application/json')) return res.status(415).json({ error: 'Permintaan harus menggunakan JSON.' });
    next();
  });

  const limitAttempts = rateLimit({
    windowMs: 15 * 60 * 1000, limit: 20, skipSuccessfulRequests: true,
    standardHeaders: 'draft-8', legacyHeaders: false,
    message: { error: 'Terlalu banyak percobaan. Tunggu 15 menit sebelum mencoba lagi.' },
  });

  app.get('/api/auth/session', async (req, res) => {
    const user = await sessionUser(req);
    const token = csrfToken(req);
    await sessionAction(req, 'save');
    res.json({ user, csrfToken: token });
  });

  app.post('/api/auth/register', limitAttempts, async (req, res) => {
    const { values, errors } = validateAuthInput(req.body, true);
    if (Object.keys(errors).length) return res.status(422).json({ error: 'Periksa kembali isian formulir.', fields: errors });
    const passwordHash = await hashPassword(values.password);
    const result = await pool.query(`INSERT INTO public.users (name, email, password_hash, role)
      VALUES ($1, $2, $3, 'user') ON CONFLICT (email) DO NOTHING RETURNING id, name, email, role`,
    [values.name, values.email, passwordHash]);
    if (!result.rowCount) {
      return res.status(409).json({ error: 'Email ini sudah terdaftar. Silakan masuk.', fields: { email: 'Email ini sudah terdaftar. Silakan masuk.' } });
    }
    res.status(201).json({ message: 'Akun berhasil dibuat. Silakan masuk.', user: publicUser(result.rows[0]) });
  });

  app.post('/api/auth/login', limitAttempts, async (req, res) => {
    const { values, errors } = validateAuthInput(req.body);
    if (Object.keys(errors).length) return res.status(422).json({ error: 'Periksa kembali isian formulir.', fields: errors });
    const result = await pool.query('SELECT id, name, email, role, password_hash, is_active FROM public.users WHERE email = $1', [values.email]);
    const account = result.rows[0];
    const validPassword = await verifyPassword(values.password, account?.password_hash ?? dummyHash);
    if (!account?.is_active || !validPassword) return res.status(401).json({ error: 'Email atau password tidak sesuai.' });
    await sessionAction(req, 'regenerate');
    req.session.userId = account.id;
    const token = csrfToken(req);
    await sessionAction(req, 'save');
    res.json({ user: publicUser(account), csrfToken: token });
  });

  app.post('/api/auth/logout', async (req, res) => {
    await sessionAction(req, 'destroy');
    res.clearCookie(cookieName, cookieOptions);
    res.status(204).end();
  });

  async function requireUser(req, res, next) {
    const user = await sessionUser(req);
    if (!user) return res.status(401).json({ error: 'Silakan masuk untuk membuka halaman ini.' });
    req.user = user;
    next();
  }

  function requireAdmin(req, res, next) {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Halaman ini hanya dapat diakses oleh admin.' });
    next();
  }

  app.get('/api/dashboard', requireUser, (req, res) => res.json({ user: req.user }));
  app.get('/api/admin', requireUser, requireAdmin, (req, res) => res.json({ user: req.user }));
  registerLearningRoutes(app, pool, requireUser, requireAdmin);
  registerShopRoutes(app, pool, requireUser, requireAdmin);
  app.use('/api', (_req, res) => res.status(404).json({ error: 'Alamat API tidak ditemukan.' }));
  app.use((error, _req, res, _next) => {
    if (error.type === 'entity.parse.failed') return res.status(400).json({ error: 'Format permintaan tidak valid.' });
    if (error.type === 'entity.too.large') return res.status(413).json({ error: 'Isian formulir terlalu panjang.' });
    console.error('Permintaan backend gagal.');
    res.status(503).json({ error: 'Layanan belum dapat dihubungi. Coba lagi sebentar.' });
  });

  return { app, store };
}
