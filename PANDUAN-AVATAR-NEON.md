# Avatar pemain Lentera PLAY

> Struktur terbaru: jalankan perintah `npm.cmd --prefix frontend` / `npm.cmd --prefix backend` dari root `Lentera-PLAY`. Jika sudah di dalam folder masing-masing, cukup gunakan `npm.cmd` tanpa `--prefix`.

## Yang berubah

Ketujuh avatar WebP dari pengguna berada di `frontend/public/avatars/` dan dapat dipilih melalui **Profil → Pilih avatar**. Avatar terpilih ditampilkan di profil, kartu dashboard, dan ikon akun pada navigasi. Pilihan lama (`orbit`, `pixel`, `spark`, `shield`) masih dapat dibaca; tampilannya dipetakan ke empat gambar baru pertama hingga pemain menyimpan pilihan baru.

Aset dikecilkan menjadi 448 × 448 piksel berformat WebP untuk mengurangi waktu muat. Berkas SVG simbolik untuk tokoh simulasi tidak diubah.

## Perbarui database Neon (WAJIB SEKALI)

Migrasi `004_cyber_avatars.sql` diperlukan karena constraint PostgreSQL awal hanya menerima empat nilai avatar. Jalankan terhadap branch **`lentera-play-test`** dahulu:

```powershell
npm.cmd --prefix backend ci
npm.cmd --prefix frontend ci
npm.cmd --prefix backend run db:check
npm.cmd --prefix backend run db:migrate
npm.cmd --prefix backend run db:verify
```

Pastikan `DATABASE_URL` dalam `backend/.env` mengarah ke branch uji yang benar; `db:check` hanya memeriksa koneksi dan nama database, bukan identitas branch. Jangan menampilkan password atau URL koneksi kepada orang lain.

Migrasi ini hanya mengganti batasan nilai `avatar_key` dan default-nya. **Tidak menghapus profil lama, tidak mengubah `avatar_key` milik pengguna yang sudah disimpan**, tidak perlu restore backup SQL, dan **tidak perlu menjalankan `db:seed`**. Saat aplikasi disiapkan untuk production, terapkan migrasi yang sama pada branch production setelah backup dan pengujian berhasil.

## Jalankan website

Terminal pertama:

```powershell
npm.cmd --prefix backend run dev
```

Terminal kedua:

```powershell
npm.cmd --prefix frontend run dev
```

Buka `http://localhost:5173/profil`, pilih satu dari tujuh avatar, lalu tekan **Simpan pengaturan**. Refresh halaman dan pastikan avatar tetap tampil. Jika error "Pilihan avatar atau pengaturan suara tidak valid", pastikan backend dijalankan dari paket terbaru. Jika error constraint PostgreSQL, pastikan migrasi `004` sudah diterapkan pada branch yang dipakai backend.
