# Lentera PLAY — Panduan Cyber Shop & Migrasi Neon

> Struktur terbaru: jalankan perintah `npm.cmd --prefix frontend` / `npm.cmd --prefix backend` dari root `Lentera-PLAY`. Jika sudah di dalam folder masing-masing, cukup gunakan `npm.cmd` tanpa `--prefix`.

Dokumen ini untuk **proyek Lentera PLAY yang sudah menjalankan migrasi 001–004** pada branch Neon `lentera-play-test`. Jangan memulihkan `backup-neon.sql` atau mengganti isi migrasi lama.

## 1. Pindahkan proyek dan pastikan koneksi aman

1. Ekstrak ZIP terbaru ke folder berbeda, misalnya `D:\Lentera-PLAY-Shop`.
2. Buka folder `Lentera-PLAY` hasil ekstrak di VS Code.
3. Salin **hanya `backend/.env`** dari proyek sebelumnya. Jangan masukkan `.env` dalam ZIP atau GitHub.
4. Di Neon Console pastikan branch `lentera-play-test` terpilih. Gunakan **connection string direct** dengan *Connection pooling OFF* dan ganti nilai `DATABASE_URL` pada `backend/.env` bila masih memakai production. Jangan kirim URL dengan password kepada siapa pun.
5. Instal dependensi frontend dan backend di folder baru:

```powershell
npm.cmd --prefix frontend ci
npm.cmd --prefix backend ci
```

> Jika `dotenv` tidak ditemukan saat backend dinyalakan, biasanya `npm.cmd --prefix backend ci` belum dijalankan di folder yang baru.

## 2. Migrasi baru 005 — aditif

Tidak perlu membuat database baru atau menghapus tabel. Script `backend/migrations/005_cyber_shop.sql` akan membuat **enam tabel baru** tanpa mengubah materi, role, sesi, avatar, `attempts`, `attempt_answers`, `chat_nodes`, atau `chat_choices`.

| Tabel | Kegunaan |
| --- | --- |
| `shop_items` | Barang kosmetik, kategori, harga, aset lokal, status aktif |
| `coin_wallets` | Saldo Cyber Coins per pengguna |
| `coin_reward_progress` | Skor terbaik yang sudah diberi hadiah untuk setiap misi |
| `coin_transactions` | Buku besar koin masuk/keluar, dapat diaudit |
| `user_inventory` | Item milik pengguna dan waktu perolehan |
| `user_equipment` | Satu item aktif per kategori; FK memastikan milik pengguna |

Jalankan dari folder root proyek (terminal VS Code):

```powershell
npm.cmd --prefix backend run db:check
npm.cmd --prefix backend run db:migrate
npm.cmd --prefix backend run db:seed:shop
npm.cmd --prefix backend run db:verify:shop
```

Hasil yang diharapkan adalah **`Migrasi diterapkan: 005_cyber_shop.sql`**, katalog **12 item**, dan `Saldo tidak sesuai ledger: 0`. Migrator memakai `schema_migrations` sehingga ketika dijalankan ulang tidak menerapkan migrasi yang sama dua kali. `db:seed:shop` memakai `ON CONFLICT DO NOTHING`: barang yang telah diedit admin tidak ditimpa.

Tidak perlu menjalankan ulang `db:seed`, `db:seed:game`, `auth:setup`, atau promosi akun admin jika semuanya sudah bekerja pada branch pengujian.

## 3. Jalankan frontend dan backend

Buka dua terminal berbeda:

```powershell
# Terminal 1: backend
npm.cmd --prefix backend run dev
```

```powershell
# Terminal 2: frontend
npm.cmd --prefix frontend run dev
```

Buka `http://localhost:5173/masuk`, lalu login menggunakan akun lama pada branch Neon pengujian.

| Halaman | URL | Hak akses |
| --- | --- | --- |
| Cyber Shop | `http://localhost:5173/toko` | User |
| Inventaris | `http://localhost:5173/inventaris` | User |
| Profil + kosmetik terpasang | `http://localhost:5173/profil` | User |
| Kelola Cyber Shop | `http://localhost:5173/admin/toko` | Admin |

## 4. Cara kerja Cyber Coins

- **Skor permainan** dan **XP** tetap menjadi ukuran pembelajaran; tidak dapat dibeli.
- Saat pemain menyelesaikan skenario pertama kali, reward kumulatif untuk skenario tersebut: **`18 + floor(skor_terbaik × 22 / 100)`** Cyber Coins (18–40 CC).
- Replay yang tidak meningkatkan skor terbaik **tidak memberikan koin**. Replay yang memperbaiki skor mendapat **selisih** reward lama versus reward baru. Satu skenario maksimal menyumbang 40 CC sepanjang umur akun.
- Pengguna yang **sudah pernah menyelesaikan misi sebelum fitur toko** menerima reward sesuai skor terbaik lama secara otomatis ketika membuka wallet/toko pertama kali. Tidak ada penggandaan reward saat refresh.
- Penghitungan, saldo, dan transaksi pembelian **hanya terjadi di server**, di dalam transaksi PostgreSQL dengan lock baris wallet. Harga dikirim dari database, bukan dari browser. Item yang dibeli tidak bisa dibeli ulang; item yang dimiliki dapat dipakai/dilepas.
- Koin bukan uang, tidak dapat dicairkan, dan tidak memberi keuntungan pada skor atau nilai ujian.

## 5. Uji fungsional di branch `lentera-play-test`

1. **User baru:** setelah daftar, buka toko; saldo awal 0 CC. Lihat 12 item dari enam kategori.
2. **Mendapat koin:** selesaikan `Pesan paket tertahan` dengan skor 100; saldo akan menjadi 40 CC (apabila belum pernah menyelesaikan misi sebelumnya).
3. **Beli barang:** di Cyber Shop, pilih item **Signal Scout** (35 CC). Saldo menjadi 5 CC.
4. **Inventaris:** buka `/inventaris`, lihat Signal Scout, lalu klik **Pakai item**.
5. **Profil:** buka `/profil`; gelar Signal Scout tampil. Refresh; gelar tetap tampil.
6. **Keamanan:** ulangi misi tanpa memperbaiki skor, saldo tidak boleh bertambah. Pembelian barang yang sama tidak boleh memotong saldo dua kali. Item yang belum dibeli tidak bisa dipakai.
7. **Admin:** login dengan role admin, buka `/admin/toko`. Tambahkan item baru memakai salah satu dari enam aset yang disediakan, ubah harganya, nonaktifkan, lalu cek tampilan toko user. Jangan mengubah kategori item yang sudah dimiliki pemain.
8. Uji mobile dan efek item tambahan: bingkai profil/header, tema chat, companion, wallpaper, dan stiker.

Opsional pada branch uji: `npm.cmd --prefix backend test`, `npm.cmd --prefix frontend run test:cache`, `npm.cmd --prefix frontend run build`, dan `npm.cmd --prefix frontend run test:e2e`. Pengujian E2E membuat dan menghapus akun uji, sehingga **jangan jalankan pada production**.

## 6. Pemeriksaan SQL baca-saja di Neon Console

Setelah migrasi dan seed pada branch pengujian, buka **SQL Editor**:

```sql
SELECT filename, applied_at FROM public.schema_migrations ORDER BY filename;
SELECT category, COUNT(*) AS jumlah FROM public.shop_items GROUP BY category ORDER BY category;
SELECT COUNT(*) AS jumlah_wallet FROM public.coin_wallets;
SELECT COUNT(*) AS jumlah_transaksi FROM public.coin_transactions;
SELECT COUNT(*) AS jumlah_inventaris FROM public.user_inventory;
```

Tabel saldo mungkin belum memiliki isi untuk user yang belum pernah membuka wallet; itu normal. Data transaksi, inventaris, dan pemakaian item baru akan muncul seiring aktivitas pemain.

## 7. Memindahkan ke production (jangan lakukan sebelum uji selesai)

Buat backup terbaru atau *recovery branch* dari `production` di Neon. Pastikan migrasi `004_cyber_avatars.sql` sudah ada di production; apabila belum, migrator akan menerapkan migrasi yang memang masih tertinggal. Ganti `DATABASE_URL` backend ke connection string **direct** branch production, jalankan `db:check` → `db:migrate` → `db:seed:shop` → `db:verify:shop`, lalu uji aplikasi lagi.

Jika terjadi masalah, gunakan recovery branch/backup yang sudah disiapkan. Jangan mengeksekusi `DROP TABLE` atau mengimpor ulang dump ke database production yang berisi data. Tidak ada migrasi *down* otomatis karena transaksi koin yang sah harus dipertahankan.

## 8. Aset dan pengembangan katalog

- Aset siap pakai: `frontend/public/shop/frame.webp`, `chat.webp`, `companion.webp`, `background.webp`, `nameplate.webp`, `stickers.webp`.
- Lembar sumber resolusi tinggi: `frontend/assets/cyber-shop-asset-sheet.png` (3×2 panel).
- Seluruh aset lokal **WebP 448×448** untuk mengurangi loading. Avatar cyber dari update sebelumnya tetap tersedia di `frontend/public/avatars/`.
- Admin saat ini dapat memilih aset dari **enam tipe yang tersedia**, bukan mengunggah gambar sembarang dari browser. Untuk menambah tipe aset baru, tempatkan file gambar yang aman di `frontend/public/shop/`, perbarui whitelist aset di `backend/src/shop-economy.js` dan CHECK `shop_items.asset_key` lewat migrasi baru (jangan edit `005` setelah diterapkan), lalu tambahkan pilihan di editor admin.

Pengaturan `backend/.env` dan credential Neon **tidak** disertakan di ZIP.
