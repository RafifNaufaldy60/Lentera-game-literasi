# Lentera PLAY — struktur frontend dan backend

## Menjalankan aplikasi

1. Ekstrak ZIP di folder baru. Buka folder `Lentera-PLAY` di VS Code.
2. Salin `server/.env` dari versi lama ke `backend/.env` (jangan commit). Pertahankan `SESSION_SECRET` dan URL branch Neon yang sesuai.
3. Terminal 1: `cd backend`, `npm ci`, `npm run db:check`, `npm run dev`.
4. Terminal 2 dari root: `cd frontend`, `npm ci`, `npm run dev`.
5. Buka http://localhost:5173. API tetap port 3001; proxy Vite tidak berubah. Gunakan `npm.cmd` jika PowerShell memblokir `npm.ps1`.

Tidak ada migrasi tambahan. File migrasi 001–005 dan aset di public identik dengan proyek asal. Jika database belum lengkap, ikuti README untuk migrasi/seed yang tertinggal.

## Memperbarui repo GitHub lama

ZIP ini tidak mengandung `.git` atau `.env`. Jika memakai repo lokal lama, buat backup di luar repo terlebih dahulu. Pertahankan `.git`, salin `.env` lama ke `backend/.env`, lalu pindahkan source ke struktur baru. Hapus duplikat struktur lama (`server`, `src`, `public`, `assets`, `shared`, `tests`, package/config root yang telah dipindahkan) setelah memastikan file hasil pindah lengkap. Jangan menghapus perubahan lokal yang belum dicadangkan. Jalankan `git check-ignore -v backend/.env`, `git add -A`, `git diff --cached --name-only`, pastikan tidak ada rahasia, lalu commit dan push. Jangan membuat repo baru bila ingin mempertahankan histori.

## Pengujian pemisahan folder

- Backend: 27/27 unit test lulus (`cd backend; npm test`).
- Frontend: 9/9 tes cache dan konsistensi kontrak lulus (`cd frontend; npm run test:cache`).
- SQL 001–005, aset public dan kedua package-lock.json sama persis dengan file sumber.
- Build Vite dan pengujian browser terhadap Neon belum dijalankan di lingkungan ini. Jalankan `npm run build` dari frontend dan uji aplikasi lokal sebelum commit.
