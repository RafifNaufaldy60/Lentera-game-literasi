import { test, expect } from '@playwright/test';
import { randomUUID } from 'node:crypto';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { createPool } from '../../server/src/db.js';

const execute = promisify(execFile);
const preservedTables = ['users', 'materials', 'scenarios', 'chat_nodes', 'chat_choices', 'attempts', 'attempt_answers'];
const emails = new Set();
const sessionIds = new Set();
let pool;
let before;

async function snapshot() {
  const result = {};
  for (const table of preservedTables) {
    const { rows } = await pool.query(`SELECT md5(coalesce(jsonb_agg(to_jsonb(t) ORDER BY to_jsonb(t)::text)::text, '[]')) AS fingerprint FROM public.${table} t`);
    result[table] = rows[0].fingerprint;
  }
  return result;
}

async function rememberCookies(context) {
  const cookies = await context.cookies();
  for (const cookie of cookies.filter((item) => item.name === 'literasi.sid')) {
    const signedId = decodeURIComponent(cookie.value);
    sessionIds.add(signedId.slice(2, signedId.lastIndexOf('.')));
  }
  return cookies.find((item) => item.name === 'literasi.sid');
}

async function testEmail() {
  const email = `uji.auth.${randomUUID()}@example.invalid`;
  const existing = await pool.query('SELECT id FROM public.users WHERE email = $1', [email]);
  expect(existing.rowCount).toBe(0);
  emails.add(email);
  return email;
}

test.beforeAll(async () => {
  if (process.env.NODE_ENV === 'production') throw new Error('Pengujian akun hanya untuk database pengembangan.');
  pool = createPool();
  pool.on('error', () => console.error('Koneksi pengujian database tidak tersedia.'));
  before = await snapshot();
});

test.afterEach(async ({ context }) => {
  await rememberCookies(context);
  await pool.query(`DELETE FROM public.user_sessions WHERE sid = ANY($1::text[])
    OR sess->>'userId' IN (SELECT id::text FROM public.users WHERE email = ANY($2::text[]))`, [[...sessionIds], [...emails]]);
  await pool.query('DELETE FROM public.users WHERE email = ANY($1::text[])', [[...emails]]);
  emails.clear();
  sessionIds.clear();
});

test.afterAll(async () => {
  try { expect(await snapshot()).toEqual(before); }
  finally { await pool.end(); }
});

test('daftar, email duplikat, login, refresh, role admin, dan logout melalui browser serta Neon', async ({ page, context }, testInfo) => {
  const email = await testEmail();
  const password = `Kalimat uji ${randomUUID()}`;
  const runtimeErrors = [];
  page.on('pageerror', (error) => runtimeErrors.push(error.message));

  await test.step('daftar dengan formulir Indonesia dan hash di database', async () => {
    await page.goto('/daftar');
    await expect(page.getByRole('heading', { name: 'Daftar', exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Buat akun', exact: true }).click();
    await expect(page.getByRole('alert')).toContainText('Periksa kembali');
    await page.getByLabel('Nama', { exact: true }).fill('Pemain Uji');
    await page.getByLabel('Email', { exact: true }).fill(email);
    await page.getByLabel('Password', { exact: true }).fill(password);
    await page.getByRole('button', { name: 'Tampilkan password' }).click();
    await expect(page.getByLabel('Password', { exact: true })).toHaveAttribute('type', 'text');
    await page.getByRole('button', { name: 'Sembunyikan password' }).click();
    await expect(page.getByLabel('Password', { exact: true })).toHaveAttribute('type', 'password');
    await rememberCookies(context);
    await page.getByRole('button', { name: 'Buat akun', exact: true }).click();
    await expect(page).toHaveURL(/\/masuk$/);
    await expect(page.getByRole('status')).toHaveText('Akun berhasil dibuat. Silakan masuk.');
    const stored = await pool.query("SELECT role, is_active, password_hash LIKE 'scrypt$131072$8$1$%' AS hashed FROM public.users WHERE email = $1", [email]);
    expect(stored.rows[0]).toEqual({ role: 'user', is_active: true, hashed: true });
  });

  await test.step('email yang sama ditolak dan password salah tidak membuka sesi', async () => {
    await page.getByRole('navigation', { name: 'Akun' }).getByRole('link', { name: 'Daftar', exact: true }).click();
    await page.getByLabel('Nama', { exact: true }).fill('Pemain Uji');
    await page.getByLabel('Email', { exact: true }).fill(email.toUpperCase());
    await page.getByLabel('Password', { exact: true }).fill(password);
    await page.getByRole('button', { name: 'Buat akun', exact: true }).click();
    await expect(page.getByRole('alert')).toContainText('Email ini sudah terdaftar');
    await page.locator('.form-alternative').getByRole('link', { name: 'Masuk', exact: true }).click();
    await page.getByLabel('Email', { exact: true }).fill(email);
    await page.getByLabel('Password', { exact: true }).fill('Password yang tidak sesuai');
    await page.getByRole('button', { name: 'Masuk', exact: true }).click();
    await expect(page.getByRole('alert')).toHaveText('Email atau password tidak sesuai.');
  });

  await test.step('login user memutar ID sesi, memakai HttpOnly, dan bertahan saat refresh', async () => {
    const anonymousCookie = await rememberCookies(context);
    await page.getByLabel('Password', { exact: true }).fill(password);
    await page.getByRole('button', { name: 'Masuk', exact: true }).click();
    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(page.locator('.welcome-copy h1')).toContainText('Pemain');
    const cookie = await rememberCookies(context);
    expect(cookie.httpOnly).toBe(true);
    expect(cookie.sameSite).toBe('Lax');
    expect(cookie.value).not.toBe(anonymousCookie.value);
    expect(await page.evaluate(() => document.cookie)).not.toContain('literasi.sid');
    expect(await page.evaluate(() => Object.keys(localStorage))).toEqual([]);
    await page.reload();
    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(page.locator('.welcome-copy h1')).toContainText('Pemain');
    await page.screenshot({ path: testInfo.outputPath('dashboard.png'), fullPage: true });
  });

  await test.step('backend menolak user biasa yang mengakses admin', async () => {
    const denied = await page.request.get('/api/admin');
    expect(denied.status()).toBe(403);
    await page.goto('/admin');
    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(page.getByRole('heading', { name: /Halo, Pemain/ })).toBeVisible();
  });

  await test.step('logout mencabut sesi lama termasuk ketika cookie dipakai kembali', async () => {
    const cookie = await rememberCookies(context);
    await page.getByRole('button', { name: 'Keluar', exact: true }).click();
    await expect(page).toHaveURL(/\/masuk$/);
    const replay = await page.request.get('/api/dashboard', { headers: { Cookie: `literasi.sid=${cookie.value}` } });
    expect(replay.status()).toBe(401);
    await page.reload();
    await expect(page.getByRole('heading', { name: 'Masuk', exact: true })).toBeVisible();
  });

  await test.step('perintah admin mencabut sesi lama, lalu login mengarah ke admin', async () => {
    await page.getByLabel('Email', { exact: true }).fill(email);
    await page.getByLabel('Password', { exact: true }).fill(password);
    await page.getByRole('button', { name: 'Masuk', exact: true }).click();
    await expect(page).toHaveURL(/\/dashboard$/);
    await rememberCookies(context);
    const promotion = await execute(process.execPath, ['server/scripts/promote-admin.js', '--email', email], { windowsHide: true, timeout: 30000 });
    expect(promotion.stdout).toContain('Role admin berhasil diterapkan');
    await page.reload();
    await expect(page).toHaveURL(/\/masuk$/);
    await page.getByLabel('Email', { exact: true }).fill(email);
    await page.getByLabel('Password', { exact: true }).fill(password);
    await page.getByRole('button', { name: 'Masuk', exact: true }).click();
    await expect(page).toHaveURL(/\/admin$/);
    await expect(page.getByRole('heading', { name: 'Dashboard admin' })).toBeVisible();
    await expect(page.locator('.page-description')).toContainText('Pemain Uji');
    const allowed = await page.request.get('/api/admin');
    expect(allowed.status()).toBe(200);
    expect((await allowed.json()).user.role).toBe('admin');
    await page.reload();
    await expect(page.locator('.page-description')).toContainText('Pemain Uji');
    for (const width of [360, 768, 1024, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      for (const route of ['/admin', '/admin/toko']) {
        await page.goto(route);
        await expect(page.locator('#konten .app-page').first()).toBeVisible();
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
          `Panel admin melewati viewport ${width}px pada ${route}`).toBe(true);
      }
    }
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto('/admin');
    await expect(page.getByRole('heading', { name: 'Dashboard admin' })).toBeVisible();
    await page.screenshot({ path: testInfo.outputPath('admin.png'), fullPage: true });
    await rememberCookies(context);
    await page.getByRole('button', { name: 'Keluar', exact: true }).click();
    await expect(page).toHaveURL(/\/masuk$/);
    await page.goto('/admin');
    await expect(page).toHaveURL(/\/masuk$/);
    expect((await page.request.get('/api/admin')).status()).toBe(401);
  });
  expect(runtimeErrors).toEqual([]);
});

test('pendaftaran publik menolak eskalasi role dan permintaan tanpa CSRF', async ({ page, context }) => {
  await page.goto('/daftar');
  await expect(page.getByRole('heading', { name: 'Daftar', exact: true })).toBeVisible();
  const email = await testEmail();
  const data = { name: 'Uji Role', email, password: `Pengujian ${randomUUID()}`, role: 'admin', is_active: false };
  const { csrfToken } = await (await page.request.get('/api/auth/session')).json();
  expect((await page.request.post('/api/auth/register', { data })).status()).toBe(403);
  expect((await page.request.post('/api/auth/register', { data, headers: { 'X-CSRF-Token': csrfToken, Origin: 'https://asing.example.invalid' } })).status()).toBe(403);
  const response = await page.request.post('/api/auth/register', { data, headers: { 'X-CSRF-Token': csrfToken } });
  expect(response.status()).toBe(201);
  const result = await response.json();
  expect(result.user.role).toBe('user');
  expect(result.user).not.toHaveProperty('password_hash');
  const stored = await pool.query('SELECT role, is_active FROM public.users WHERE email = $1', [email]);
  expect(stored.rows[0]).toEqual({ role: 'user', is_active: true });
  await pool.query('UPDATE public.users SET is_active = FALSE WHERE email = $1', [email]);
  const disabled = await page.request.post('/api/auth/login', { data, headers: { 'X-CSRF-Token': csrfToken } });
  expect(disabled.status()).toBe(401);
  await rememberCookies(context);
});

test('formulir responsif, keyboard, status pemuatan, dan pemulihan koneksi', async ({ page }, testInfo) => {
  let releaseLoading;
  const ready = new Promise((resolve) => { releaseLoading = resolve; });
  await page.route('**/api/auth/session', async (route) => { await ready; await route.continue(); });
  await page.goto('/daftar');
  await expect(page.getByRole('heading', { name: 'Memeriksa sesi' })).toBeVisible();
  releaseLoading();
  await expect(page.getByRole('heading', { name: 'Daftar', exact: true })).toBeVisible();
  await page.unroute('**/api/auth/session');

  for (const width of [320, 390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    for (const route of ['/daftar', '/masuk']) {
      await page.goto(route);
      await expect(page.getByRole('heading', { name: route === '/daftar' ? 'Daftar' : 'Masuk', exact: true })).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
      const targets = await page.locator('button, input, nav a, .form-alternative a').evaluateAll((elements) => elements.map((element) => {
        const bounds = element.getBoundingClientRect();
        return { width: bounds.width, height: bounds.height };
      }));
      expect(targets.every((target) => target.width >= 44 && target.height >= 44)).toBe(true);
      if ([390, 1440].includes(width)) await page.screenshot({ path: testInfo.outputPath(`${route.slice(1)}-${width}.png`), fullPage: true });
    }
  }

  await page.goto('/daftar');
  await expect(page.getByRole('heading', { name: 'Daftar', exact: true })).toBeVisible();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Lewati ke konten' })).toBeFocused();
  await page.keyboard.press('Enter');
  await page.getByLabel('Nama', { exact: true }).focus();
  await page.keyboard.press('Tab');
  await expect(page.getByLabel('Email', { exact: true })).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.getByLabel('Password', { exact: true })).toBeFocused();
  expect(await page.getByLabel('Password', { exact: true }).evaluate((element) => getComputedStyle(element).outlineStyle)).toBe('solid');
  await page.keyboard.press('Tab');
  await page.keyboard.press('Enter');
  await expect(page.getByLabel('Password', { exact: true })).toHaveAttribute('type', 'text');
  await page.keyboard.press('Enter');
  await page.setViewportSize({ width: 390, height: 340 });
  await page.getByLabel('Password', { exact: true }).click();
  const focused = await page.getByLabel('Password', { exact: true }).boundingBox();
  expect(focused.y >= 0 && focused.y + focused.height <= 340).toBe(true);
  await page.setViewportSize({ width: 390, height: 1000 });
  await page.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.evaluate(() => { document.documentElement.style.fontSize = ''; });

  await page.route('**/api/auth/session', (route) => route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ error: 'Koneksi pengujian terputus.' }) }));
  await page.reload();
  await expect(page.getByRole('alert')).toHaveText('Koneksi pengujian terputus.');
  await page.unroute('**/api/auth/session');
  await page.getByRole('button', { name: 'Coba lagi' }).click();
  await expect(page.getByRole('heading', { name: 'Daftar', exact: true })).toBeVisible();
  await page.getByRole('link', { name: /^Lentera/ }).click();
  await expect(page).toHaveURL(/\/masuk$/);
  await page.goto('/alamat-tidak-ada');
  await page.getByRole('link', { name: 'Kembali ke beranda' }).click();
  await expect(page).toHaveURL(/\/masuk$/);
});
