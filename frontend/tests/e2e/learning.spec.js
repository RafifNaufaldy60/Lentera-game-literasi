import { test, expect } from '@playwright/test';
import { randomUUID } from 'node:crypto';
import { createPool } from '../../../backend/src/db.js';

const email = `uji.game.${randomUUID()}@example.invalid`;
const password = `Kalimat uji game ${randomUUID()}`;
let pool;

test.beforeAll(async () => {
  if (process.env.NODE_ENV === 'production') throw new Error('Pengujian game hanya untuk database pengembangan.');
  pool = createPool();
  const existing = await pool.query("SELECT id FROM public.scenarios WHERE slug='paket-tertahan' AND is_published=TRUE");
  if (!existing.rowCount) throw new Error('Jalankan npm.cmd --prefix ../backend run db:seed sebelum pengujian E2E game.');
});

test.afterAll(async () => {
  if (!pool) return;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const users = await client.query('SELECT id FROM public.users WHERE email=$1', [email]);
    if (users.rowCount) {
      const userId = users.rows[0].id;
      await client.query("DELETE FROM public.user_sessions WHERE sess->>'userId'=$1", [userId]);
      await client.query('DELETE FROM public.user_equipment WHERE user_id=$1', [userId]);
      await client.query('DELETE FROM public.user_inventory WHERE user_id=$1', [userId]);
      await client.query('DELETE FROM public.coin_transactions WHERE user_id=$1', [userId]);
      await client.query('DELETE FROM public.coin_reward_progress WHERE user_id=$1', [userId]);
      await client.query('DELETE FROM public.coin_wallets WHERE user_id=$1', [userId]);
      await client.query(`DELETE FROM public.attempt_answers WHERE attempt_id IN
        (SELECT id FROM public.attempts WHERE user_id=$1)`, [userId]);
      await client.query('DELETE FROM public.attempts WHERE user_id=$1', [userId]);
      await client.query('DELETE FROM public.users WHERE id=$1', [userId]);
    }
    await client.query('COMMIT');
  } catch (error) { await client.query('ROLLBACK'); throw error; }
  finally { client.release(); await pool.end(); }
});

test('alur pemain: daftar, materi, chat bercabang, hasil, leaderboard dan refresh', async ({ page }) => {
  await page.goto('/daftar');
  await page.getByLabel('Nama', { exact: true }).fill('Pemain Simulasi');
  await page.getByLabel('Email', { exact: true }).fill(email);
  await page.getByLabel('Password', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Buat akun' }).click();
  await expect(page).toHaveURL(/\/masuk$/);
  await page.getByLabel('Password', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Masuk', exact: true }).click();
  await expect(page).toHaveURL(/\/dashboard$/);

  await page.goto('/profil');
  await expect(page.locator('.avatar-picker button')).toHaveCount(7);
  await page.getByRole('button', { name: /Pilih avatar Nova/ }).click();
  await page.getByRole('button', { name: 'Simpan pengaturan' }).click();
  await expect(page.getByText('Avatar dan pengaturan berhasil disimpan.')).toBeVisible();
  await page.reload();
  await expect(page.locator('.profile-id .player-avatar img')).toHaveAttribute('src', '/avatars/nova.webp');
  await expect(page.locator('.account-avatar-player .player-avatar img')).toHaveAttribute('src', '/avatars/nova.webp');

  await test.step('menu, toko, dan inventaris tidak menyebabkan scroll horizontal', async () => {
    for (const width of [360, 768, 1024, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      for (const route of ['/dashboard', '/toko', '/inventaris', '/profil']) {
        await page.goto(route);
        await expect(page.locator('#konten .app-page').first()).toBeVisible();
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
          `Lebar halaman melewati viewport ${width}px pada ${route}`).toBe(true);
      }
      if (width <= 1260) {
        await page.getByRole('button', { name: 'Menu' }).click();
        await expect(page.getByRole('navigation', { name: 'Navigasi utama' })).toBeVisible();
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
        await page.getByRole('button', { name: 'Menu' }).click();
      }
    }
    await page.setViewportSize({ width: 1440, height: 1000 });
  });

  await page.goto('/materi');
  await expect(page.getByRole('heading', { name: 'Materi literasi digital' })).toBeVisible();
  await expect(page.getByRole('link', { name: /Mengenali phishing lewat pesan paket/ })).toBeVisible();

  await page.goto('/simulasi');
  await page.getByRole('link', { name: /Pesan paket tertahan/ }).click();
  await expect(page.getByRole('heading', { name: 'Pesan paket tertahan' })).toBeVisible();
  await page.getByRole('button', { name: 'Mulai percakapan' }).click();
  await expect(page).toHaveURL(/\/bermain\/[0-9a-f-]+$/);
  await expect(page.getByText('Paket FIK-2048 tertahan', { exact: false })).toBeVisible();

  await page.setViewportSize({ width: 390, height: 800 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.getByRole('button', { name: /Cek resi lewat aplikasi resmi/ }).click();
  await expect(page.getByText('Resi FIK-2048 tercatat masih dalam perjalanan', { exact: false })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('button', { name: /Blokir dan laporkan pesan palsu/ })).toBeVisible();
  await page.getByRole('button', { name: /Blokir dan laporkan pesan palsu/ }).click();
  await page.getByRole('link', { name: /Lihat hasil & evaluasi/ }).click();
  await expect(page).toHaveURL(/\/hasil\/[0-9a-f-]+$/);
  await expect(page.locator('.result-status')).toContainText('Langkah yang lebih aman');
  await expect(page.locator('.score-disc')).toContainText('100');

  await page.goto('/toko');
  await expect(page.getByRole('heading', { name: /CYBER/ })).toBeVisible();
  await expect(page.locator('.coin-header')).toContainText('40');
  await page.locator('.shop-card').filter({hasText:'Signal Scout'}).getByRole('button',{name:'Lihat item'}).click();
  await page.getByRole('button',{name:'Beli dengan Cyber Coins'}).click();
  await expect(page.getByText(/Signal Scout masuk ke inventarismu/)).toBeVisible();
  await page.goto('/inventaris');
  await expect(page.getByText('Signal Scout')).toBeVisible();
  await page.locator('.inventory-card').filter({hasText:'Signal Scout'}).getByRole('button',{name:'Pakai item'}).click();
  await page.goto('/profil');
  await expect(page.locator('.profile-id .eyebrow')).toContainText('Signal Scout');
  await page.reload();
  await expect(page.locator('.profile-id .eyebrow')).toContainText('Signal Scout');
  const economy = await pool.query(`SELECT w.balance,
    (SELECT COUNT(*)::integer FROM public.user_inventory v WHERE v.user_id=u.id) AS items,
    (SELECT COALESCE(SUM(amount),0)::integer FROM public.coin_transactions t WHERE t.user_id=u.id) AS ledger
    FROM public.users u JOIN public.coin_wallets w ON w.user_id=u.id WHERE u.email=$1`, [email]);
  expect(economy.rows).toEqual([{balance:5,items:1,ledger:5}]);

  await page.goto('/peringkat');
  await expect(page.getByRole('heading', { name: 'Papan peringkat' })).toBeVisible();
  await expect(page.locator('.ranking-info').getByText('Pemain Simulasi', { exact: false })).toBeVisible();
  const result = await pool.query(`SELECT a.final_score, COUNT(aa.id)::integer AS responses
    FROM public.attempts a JOIN public.attempt_answers aa ON aa.attempt_id=a.id
    JOIN public.users u ON u.id=a.user_id WHERE u.email=$1
    GROUP BY a.id`, [email]);
  expect(result.rows).toEqual([{ final_score: 100, responses: 2 }]);
});
