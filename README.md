# Lentera PLAY — petualangan literasi digital

Game edukasi interaktif berbasis **React + Vite**, **Express/Node.js**, dan **PostgreSQL Neon**. Berangkat dari source project Lentera awal: role `user` dan `admin`, autentikasi dengan cookie HttpOnly, materi, simulasi bercabang, skor dan evaluasi tetap dipertahankan.

## BARU — Cyber Shop dan Cyber Coins

Lentera PLAY kini memiliki **toko digital dengan mata uang virtual Cyber Coins**, katalog 12 item kosmetik, halaman inventaris, pembelian aman di backend, pemakaian item pada profil/game, dan pengelolaan toko untuk admin.

- `/toko` — katalog: bingkai avatar, tema chat, companion, latar profil, gelar, stiker.
- `/inventaris` — barang milik pemain, pasang/lepas, riwayat koin masuk/keluar.
- `/profil` — menampilkan bingkai, companion, wallpaper, stiker, gelar terpasang; avatar cyber lama tetap tersedia.
- `/admin/toko` — tambah/edit/nonaktifkan barang, kelola harga, pantau riwayat koin.
- Reward **18–40 CC untuk skor terbaik misi**. Replay tanpa peningkatan skor tidak memberi koin tambahan; koin hanya untuk kosmetik, tidak memengaruhi XP dan nilai.
- Set aset hasil desain khusus di `public/shop/*.webp` dan `assets/cyber-shop-asset-sheet.png`.

**Database:** jika branch Neon kamu sudah menggunakan migrasi 001–004, **jalankan `db:migrate` untuk migrasi baru `005_cyber_shop.sql`**, kemudian `db:seed:shop` dan `db:verify:shop`. Tidak perlu merestore backup Neon atau membuat database lain. **Lihat [PANDUAN-CYBER-SHOP-NEON.md](PANDUAN-CYBER-SHOP-NEON.md) sebelum menjalankan perintah.**

## Fitur lengkap — tujuh tahap pengembangan

| Tahap | Fitur yang dibuat |
| --- | --- |
| 1. Chat dinamis | Karakter/avatar, gaya percakapan aplikasi ponsel, riwayat gelembung chat, lampiran simulasi, indikator pesan saat jawaban diproses. |
| 2. Cerita dan ending | Cabang cerita server-side, tiga jenis hasil (`safe`, `recovered`, `risky`), tiap pilihan memiliki poin dan evaluasi, riwayat permainan tersimpan otomatis. |
| 3. Gamifikasi | XP dari **skor terbaik tiap skenario** (anti-farming replay), level, bilah progres, delapan badge pencapaian, profil/tujuh avatar cyber pemain. |
| 4. Mini-game berbeda | Inbox email phishing, linimasa komentar cyberbullying, papan investigasi privasi/doxing, marketplace fiktif; tiap mini-game meminta pemain memeriksa dua petunjuk sebelum memilih. |
| 5. Campaign | Peta **5 chapter**, empat topik utama dan Digital Crisis sebagai final chapter, terkunci sampai bab 1–4 dituntaskan. Lima misi baru berisi lima keputusan per sesi. |
| 6. Visual Story Builder | Admin membuat/mengubah node, menyeret posisi, menyusun pilihan dan ending, mengatur poin, preview lokal, menyimpan draf, serta duplikasi skenario yang telah dimainkan. |
| 7. Suara dan sentuhan visual | Tema warna navy, coral, mint, pink, sky, kuning; ilustrasi/ikon SVG original; tujuh avatar cyber; efek suara via Web Audio, opsional dan default nonaktif; animasi responsif. |

Konten selalu tentang **phishing, penipuan online, cyberbullying, dan doxing**; tidak meminta OTP, alamat, pembayaran, atau data pribadi asli. Cerita dibuat sebagai latihan dan seluruh merek/toko/email dalam mini-game adalah fiktif.

## Pembaruan performa navigasi (versi optimasi)

Menu user dan admin sekarang menggunakan cache data **di memori tab browser**, request deduplication, prefetch saat navigasi disentuh pointer/fokus, dan pemanasan data menu secara bertahap setelah login. Kembali ke halaman yang sudah dimuat tidak selalu menunggu respons Neon lagi. Jika data perlu diperbarui, tampilan terakhir tetap tersedia selama refresh berlangsung. Cache dibersihkan ketika logout, login, atau akun pada sesi berubah.

- Dashboard user tidak lagi meminta API `/leaderboard` hanya untuk skor terbaik (skor ini sudah tersedia pada profil pemain).
- Setelah menjawab sebuah pilihan game, detail hasil dari respons backend dipakai langsung oleh halaman `/hasil/:id`; tidak perlu mengunduh detail yang sama untuk kedua kalinya.
- Perubahan skor, badge, profil, materi dan publikasi admin otomatis menandai data terkait agar diperbarui. Cache hanya sementara, tidak menggunakan `localStorage` atau service worker untuk data akun.
- **Optimasi navigasi itu sendiri** tidak mengubah SQL; versi Cyber Shop terbaru **menambah migrasi 005**. Untuk branch `lentera-play-test` yang sudah berhasil migrasi `004`, gunakan `.env` yang sama, **jalankan migrasi 005 dan `db:seed:shop`** sebelum mencoba toko. Setelah itu cache navigasi tetap bekerja seperti sebelumnya.
- Pertama kali membuka menu yang belum pernah diprefetch tetap bisa bergantung pada waktu respons Neon; optimasi ini terutama menghilangkan permintaan ulang dan spinner pada kunjungan berikutnya. Tidak ada janji waktu loading tertentu.

Jalankan pengujian cache sendiri dengan `npm.cmd run test:cache` dan backend dengan `npm.cmd --prefix server test`, termasuk pengujian mata uang virtual.

## Jalankan di Windows (PowerShell)

Disarankan **Node.js 24** (lihat `.nvmrc`). Ekstrak ZIP ke folder baru, buka folder di VS Code, lalu dari terminal root proyek:

```powershell
npm.cmd ci
npm.cmd --prefix server ci
```

Pindahkan file **`server/.env` proyek lama** ke folder `server/` proyek baru (jangan digabung ke GitHub). Atau salin `server/.env.example` menjadi `server/.env` dan isi `DATABASE_URL` dari Neon.

> **Database belum berubah hanya karena mengunduh ZIP ini.** Sebelum migrasi, baca **[NEON-MIGRATION.md](NEON-MIGRATION.md)** untuk langkah aman menggunakan branch Neon pengujian, koneksi direct, pemeriksaan data lama, dan langkah ke production.

Setelah menyiapkan URL Neon di `server/.env`, jalankan:

```powershell
npm.cmd --prefix server run auth:setup
npm.cmd --prefix server run db:check
npm.cmd --prefix server run db:migrate
npm.cmd --prefix server run db:seed
npm.cmd --prefix server run db:seed:game
npm.cmd --prefix server run db:seed:shop
npm.cmd --prefix server run db:verify
npm.cmd --prefix server run db:verify:shop
```

Jalankan dua terminal:

```powershell
# Terminal 1: backend API
npm.cmd --prefix server run dev
```

```powershell
# Terminal 2: React frontend
npm.cmd run dev
```

Buka **http://localhost:5173/masuk** atau **http://localhost:5173/daftar**. API Express default port `3001` dan Vite melakukan proxy `/api` ke backend (lihat `vite.config.js`).

## Alamat halaman

| URL | Pengguna | Keterangan |
| --- | --- | --- |
| `/dashboard` | user | Mission hub, level/XP, ringkasan dan misi rekomendasi |
| `/petualangan` | user | Peta lima chapter & semua misi |
| `/profil` | user | Avatar, pilihan suara, badge dan XP |
| `/materi`, `/materi/:id` | user | Materi literasi digital |
| `/simulasi`, `/simulasi/:id` | user | Katalog dan intro mini-game |
| `/bermain/:id`, `/hasil/:id` | user | Game interaktif, pilihan, skor dan evaluasi |
| `/peringkat` | user | Leaderboard |
| `/toko` | user | Cyber Shop, pembelian dengan Cyber Coins |
| `/inventaris` | user | Inventaris, pemakaian item, riwayat transaksi |
| `/admin` | admin | Ringkasan situs |
| `/admin/materi` | admin | Editor materi dan publikasi |
| `/admin/simulasi` | admin | Daftar skenario/publikasi |
| `/admin/editor`, `/admin/editor/:id` | admin | Editor percabangan dan preview visual |
| `/admin/nilai` | admin | Pencarian, halaman, dan skor peserta |
| `/admin/toko` | admin | Katalog item, harga, status, transaksi koin |
| `/masuk`, `/daftar` | publik | Autentikasi |

### Masuk sebagai admin

Akun admin yang **sudah ada** di Neon tidak perlu dibuat ulang. Login menggunakan akun tersebut. Untuk menaikkan akun terdaftar lainnya, jalankan:

```powershell
npm.cmd --prefix server run admin:promote -- --email "akunmu@example.com"
```

Gunakan email akun sendiri, keluar lalu login kembali. Akun registrasi publik selalu mendapat role `user`, hak admin diperiksa lagi di Express.

### Membuat simulasi baru

1. Admin: buat atau pilih materi di `/admin/materi`.
2. Buka `/admin/editor` dan isi judul, slug, materi, mode tampilan, chapter, dan estimasi.
3. Klik **+ Pesan** dan **+ Ending**; pilih node untuk mengganti isi dan menambah pilihan. Arahkan setiap pilihan ke node tujuan menggunakan daftar **Ke adegan** dan set poin serta evaluasi.
4. Gunakan **Preview cerita** untuk menelusuri cabang secara lokal. Simpan graf sebagai **draf**; server memastikan graf tidak bersiklus, tak ada adegan buntu, semua node terjangkau, serta skor tiap jalur <=100.
5. Setelah selesai, buka `/admin/simulasi` dan **terbitkan** agar pemain dapat melihatnya. Skenario yang telah dimainkan dikunci untuk menjaga referensi jawaban historis; gunakan **Duplikat sebagai draf** untuk revisi.

## Database dan riwayat

- Migrasi game: `003_game_expansion.sql`, migrasi avatar: `004_cyber_avatars.sql`, migrasi ekonomi baru: `005_cyber_shop.sql`. Migrasi lama tidak diubah.
- Data 5 misi baru: `server/seeds/game-campaign.js`, dieksekusi oleh `db:seed:game`.
- Penghitungan pencapaian/level: `server/src/gamification.js`.
- Transaksi ekonomi: `server/src/shop-economy.js` dan `server/src/shop-routes.js`, dengan ledger dan lock wallet PostgreSQL.
- Struktur riwayat tetap menggunakan `attempts` dan `attempt_answers`; final score dihitung oleh backend.
- Perubahan kolom/tabel **tidak** perlu dikerjakan satu per satu melalui SQL Editor. Jalankan migrator sekali per branch Neon.
- Jangan masukkan file backup berisi data akun/kuki ke repository.

Lihat langkah-langkah terperinci pada [NEON-MIGRATION.md](NEON-MIGRATION.md).

## Pengujian

```powershell
npm.cmd --prefix server test
npm.cmd run test:cache
npm.cmd run lint
npm.cmd run build
npm.cmd --prefix server run db:verify
npm.cmd run test:e2e
```

`test:e2e` juga mencakup pembelian Signal Scout (35 CC), pemakaian gelar, dan saldo setelah pembelian. Tes membuat data uji di database; gunakan **branch Neon pengujian**, bukan database utama. Hentikan dua terminal dev sebelum `test:e2e` karena Playwright akan mencoba menjalankan servernya sendiri.

**Hasil saat packaging Cyber Shop:** **35/35 pengujian unit dan cache lulus**, termasuk perhitungan koin; pemeriksaan sintaks JS/JSX dan parsing CSS lulus. Build Vite, lint native dan browser E2E dengan database Neon **tidak berhasil diverifikasi di lingkungan pembuat** karena pemasangan dependensi Linux terhambat dan kredensial Neon tidak tersedia di lingkungan pengujian. Jalankan langkah pengujian di Windows milikmu setelah migrasi di branch uji untuk memastikan fitur bekerja end-to-end.

## Keamanan dan berkas sensitif

Password di-hash menggunakan scrypt. Otentikasi menggunakan sesi PostgreSQL, cookie `HttpOnly`, pemeriksaan CSRF, dan otorisasi per role. XP dan skor dihitung di backend, bukan dari nilai yang dikirim frontend. Pengaturan avatar/efek suara tidak meminta identitas sensitif. Jangan menyimpan `server/.env`, database dump, `node_modules` dan `.git` ke ZIP atau commit publik. Untuk deployment, gunakan HTTPS, `NODE_ENV=production`, dan `APP_ORIGIN` yang benar.

Aset lokal: `public/illustrations/hero-quest.svg`, `public/illustrations/conversation.svg`, `public/app-icons.svg`; tidak mengambil gambar, ikon merek, atau aset berhak cipta dari game komersial. Pedoman warna dan identitas ada di `DESIGN.md`. Aturan kualitas Anti-Slop tetap ada di `.codex/skills/` dan `AGENTS.md`.


## Avatar Cyber (pembaruan)

Halaman Profil menyediakan tujuh avatar dari aset WebP lokal pengguna. Klik avatar dan **Simpan pengaturan**; pilihan juga muncul di kartu dashboard dan bagian navigasi akun.

**Lakukan migrasi tambahan** pada database Neon sebelum menyimpan avatar baru: `npm.cmd --prefix server run db:migrate` (file `004_cyber_avatars.sql`). Detail langkah keamanan dan pengujian tersedia di [`PANDUAN-AVATAR-NEON.md`](PANDUAN-AVATAR-NEON.md). Migrasi ini mempertahankan data profil lama dan tidak memerlukan seed/restore database.


### Cyber Shop: migrasi Neon terbaru

Untuk **instalasi yang sudah memakai migrasi 004**, jalankan tiga perintah saja: `npm.cmd --prefix server run db:migrate`, `npm.cmd --prefix server run db:seed:shop`, `npm.cmd --prefix server run db:verify:shop`. Langkah uji lengkap ada di **PANDUAN-CYBER-SHOP-NEON.md**.

## Pembaruan responsif — navigasi tanpa scroll horizontal

Layout user/admin telah dirapikan untuk desktop, tablet, dan ponsel. Navigasi beradaptasi menjadi **Menu** saat ruang tidak cukup; kartu dan panel menyesuaikan lebar layar, sedangkan tabel admin dan kanvas Story Builder tetap memiliki scroll **internal**. **Tidak perlu migrasi Neon atau seed ulang.** Lihat [PANDUAN-RESPONSIVE.md](PANDUAN-RESPONSIVE.md) untuk pemasangan dan pemeriksaan.
