# Catatan Uji Cyber Shop — paket source

> Struktur terbaru: jalankan perintah `npm.cmd --prefix frontend` / `npm.cmd --prefix backend` dari root `Lentera-PLAY`. Jika sudah di dalam folder masing-masing, cukup gunakan `npm.cmd` tanpa `--prefix`.

Pengujian yang berhasil pada lingkungan pembuatan:

- **35/35 pengujian Node.js lulus** (`node --test backend/test/*.test.js frontend/tests/resource-cache.test.js`). Termasuk reward skor 0/50/100, reward hanya selisih progres terbaik, validasi katalog item, rekonsiliasi idempoten, pengujian cerita/backend lama, dan cache frontend.
- **42 file JS/JSX** dapat di-parse dan tidak memiliki import relatif yang hilang.
- **CSS valid menurut parser PostCSS**.
- **Migrasi lama `001`–`004` tidak berubah** (byte-for-byte dibanding ZIP avatar sebelumnya).
- **Enam WebP ukuran 448×448** tersedia dan dibaca dengan sukses.

Belum dapat diverifikasi di lingkungan pembuat:

- Build Vite lengkap dan lint native dari dependensi npm (akses instalasi Linux terhambat; dependensi pada ZIP sumber lama memakai binding Windows).
- Uji Playwright secara langsung dengan Neon (lingkungan tidak mempunyai `backend/.env` maupun akses database pemilik).
- Eksekusi SQL migrasi 005 terhadap branch Neon asli; migrasi disediakan tetapi database eksternal tidak diubah dari sini.

Untuk menguji sendiri pada laptop Windows (branch Neon test):

```powershell
npm.cmd --prefix frontend ci
npm.cmd --prefix backend ci
npm.cmd --prefix backend run db:migrate
npm.cmd --prefix backend run db:seed:shop
npm.cmd --prefix backend run db:verify:shop
npm.cmd --prefix backend test
npm.cmd --prefix frontend run test:cache
npm.cmd --prefix frontend run build
```

Jalankan `npm.cmd --prefix frontend run test:e2e` **hanya di branch Neon pengujian**; script membuat dan menghapus akun permainan sementara. Sebelum menjalankannya, pastikan dependensi sudah diinstal dan migrasi + seed toko sudah selesai. Jika ada error, kirim potongan output terminal yang tidak memuat password/URL database.
