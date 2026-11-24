# Panduan perubahan database Lentera PLAY — Neon PostgreSQL

> Struktur terbaru: jalankan perintah `npm.cmd --prefix frontend` / `npm.cmd --prefix backend` dari root `Lentera-PLAY`. Jika sudah di dalam folder masing-masing, cukup gunakan `npm.cmd` tanpa `--prefix`.

> Bacalah sebelum menjalankan migrasi. Berkas `backup-neon.sql` yang diunggah adalah acuan untuk kompatibilitas, **bukan berkas yang perlu diimpor ulang**. ZIP hasil tidak berisi cadangan database, cookie login, email peserta, password hash, maupun kredensial `backend/.env`.

## Apa yang berubah

Migrasi baru adalah `backend/migrations/003_game_expansion.sql`. Migrasi lama **001** dan **002** dipertahankan tanpa perubahan, dan checksum keduanya cocok dengan riwayat `schema_migrations` dalam cadangan yang diberikan.

- `scenarios`: kolom `play_mode` (`chat`, `email`, `social`, `privacy`, `market`, `hybrid`), `chapter_number`, `difficulty`, dan `estimated_minutes`.
- `chat_nodes`: kolom `scene_type` dan metadata `meta` (JSONB), untuk layout node, avatar, dan informasi lampiran fiktif.
- `user_profiles`: avatar pemain dan pilihan efek suara.
- `badge_definitions`: delapan jenis pencapaian yang didefinisikan melalui migrasi.
- `user_badges`: pencapaian yang telah diperoleh tiap user, dengan batasan unik agar tidak bisa diulang untuk XP.
- Lima misi kampanye baru yang terdiri atas empat misi lanjutan dan satu **Digital Crisis** (lima keputusan masing-masing). Disediakan melalui seed `backend/scripts/seed-game.js` **setelah** migrasi.

Tabel `users`, `materials`, `attempts`, `attempt_answers`, `chat_choices`, `user_sessions` dan data historis **tidak dibuang atau ditimpa**. `db:seed:game` mengecek slug agar pemanggilan ulang tidak membuat duplikat. Badge lama akan dihitung dari riwayat nilai yang ada ketika profil dibuka.

## Langkah paling aman: uji pada branch Neon terpisah

1. Buka [Neon Console](https://console.neon.tech/), pilih project dan branch database yang dipakai Lentera saat ini.
2. Di tab **Branches**, buat branch baru dari branch aktif yang berisi data Lentera, misalnya `lentera-play-test`. Pastikan memilih parent/branch yang benar. Neon membuat branch database untuk pengujian tanpa harus mengubah tabel di branch utama.
3. Pada branch uji, pilih **Connect** lalu pilih koneksi PostgreSQL **direct** (**Connection pooling OFF**). URL direct biasanya tidak mengandung `-pooler` pada host. Salin `postgresql://...` yang diperlihatkan Neon (jangan dibagikan di chat, repository, atau screenshot).
4. Simpan salinan lokal `backend/.env` lama, lalu ubah **hanya** `DATABASE_URL` dalam `backend/.env` proyek baru sehingga menunjuk ke branch uji. Biarkan `SESSION_SECRET` milikmu tetap sama. Jika file belum ada, buat dari `backend/.env.example`, isi URL dan jalankan `auth:setup` seperti di bawah.
5. Di PowerShell, pada folder utama proyek yang telah diekstrak dan telah menjalankan `npm.cmd --prefix frontend ci` serta `npm.cmd --prefix backend ci`, jalankan perintah berikut **berurutan**:

```powershell
npm.cmd --prefix backend run auth:setup
npm.cmd --prefix backend run db:check
npm.cmd --prefix backend run db:migrate
npm.cmd --prefix backend run db:seed
npm.cmd --prefix backend run db:seed:game
npm.cmd --prefix backend run db:verify
```

6. Jalankan frontend/backend (lihat `README.md`), login dengan akun dari branch uji, dan uji: dashboard, peta chapter, tiap jenis mini-game, lima keputusan dan 3 ending, XP/level/badge, profil suara/avatar, panel admin dan duplikat/editor draf, leaderboard serta riwayat lama.
7. Jika sudah lolos pengujian, buat backup terbaru/branch pemulihan dari **branch utama** Neon. Ganti `DATABASE_URL` di `backend/.env` ke URL **direct** branch utama (bukan branch uji), kemudian jalankan lagi perintah pada langkah 5. Periksa hasil, lalu jalankan aplikasi dengan URL utama. Simpan/putar kembali kredensial secara aman.

**Penting:** pengujian `npm.cmd --prefix frontend run test:e2e` dapat membuat akun/percobaan pada database uji. Jangan jalankan pengujian E2E pada branch produksi. `npm.cmd --prefix backend test` menjalankan unit test backend tanpa memerlukan database Neon.

## Kenapa cukup menjalankan `db:migrate` dan `db:seed:game`?

Proyek sudah memiliki sistem `schema_migrations`. Perintah `db:migrate` membaca migration SQL bernomor, mengecek hash migrasi lama, dan hanya menerapkan migration baru dalam transaksi. Pada database yang sesuai cadangan:

- `001_initial_schema.sql` → sudah tercatat, dilewati.
- `002_login_sessions.sql` → sudah tercatat, dilewati.
- `003_game_expansion.sql` → diterapkan satu kali.

`db:seed` mempertahankan konten awal dan memastikan empat materi/topik tersedia. `db:seed:game` memasukkan lima skenario baru **tanpa mengganti** empat skenario semula. Jika perintah gagal, perbaiki penyebabnya lalu jalankan ulang; hindari menjalankan SQL satu per satu secara manual karena migrator memakai transaksi dan catatan checksum.

## Cara memeriksa dari SQL Editor Neon

Setelah menjalankan perintah di atas, di branch yang benar buka **SQL Editor** dan gunakan query baca-saja:

```sql
SELECT filename, applied_at
FROM public.schema_migrations
ORDER BY filename;

SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('user_profiles', 'badge_definitions', 'user_badges');

SELECT chapter_number, play_mode, COUNT(*) AS jumlah_misi
FROM public.scenarios
WHERE is_published = TRUE
GROUP BY chapter_number, play_mode
ORDER BY chapter_number, play_mode;

SELECT COUNT(*) AS jumlah_badge FROM public.badge_definitions;

SELECT COUNT(*) AS total_peserta FROM public.users;
SELECT COUNT(*) AS total_percobaan FROM public.attempts;
```

Harus ada catatan untuk migrasi 003, tiga tabel baru, delapan definisi badge, serta tambahan misi (jika data awal sesuai cadangan, total sembilan skenario, empat lama dan lima baru). Jumlah user dan riwayat percobaan tidak boleh berkurang setelah migrasi.

## Yang sebaiknya tidak dilakukan

- **Jangan** mengimpor `backup-neon.sql` ke database yang sudah terisi untuk "update"; itu adalah *full dump*, bukan perubahan inkremental, dan dapat bentrok dengan objek/data lama.
- **Jangan** menghapus tabel, menjalankan `DROP SCHEMA`, mengubah migrasi 001/002, atau memakai `npm run db:seed` sebagai pengganti migrasi.
- **Jangan** memasukkan URL database ke frontend, `.env` yang dilacak Git, atau berbagi screenshot koneksi.
- Saat ingin membuat fitur DB baru di kemudian hari, buat `004_nama_perubahan.sql`, bukan menyunting `003_game_expansion.sql` setelah diterapkan.

Dokumentasi resmi: [Neon Branching](https://neon.com/docs/introduction/branching), [Neon connection strings](https://neon.com/docs/connect/connect-from-any-app), [Neon connection pooling](https://neon.com/docs/connect/connection-pooling).


## Ekstensi Cyber Shop (005)

Dokumen ini sebelumnya membahas migrasi 003; avatar 004 dan ekonomi 005 kini tersedia. **Jangan menulis ulang 003/004 yang sudah diterapkan.** Untuk upgrade ke Cyber Shop pada branch `lentera-play-test`, baca **[PANDUAN-CYBER-SHOP-NEON.md](PANDUAN-CYBER-SHOP-NEON.md)** dan jalankan migrasi 005 serta seed item.
