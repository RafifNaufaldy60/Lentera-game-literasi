# Catatan Uji Cyber Shop — paket source

Pengujian yang berhasil pada lingkungan pembuatan:

- **35/35 pengujian Node.js lulus** (`node --test server/test/*.test.js tests/resource-cache.test.js`). Termasuk reward skor 0/50/100, reward hanya selisih progres terbaik, validasi katalog item, rekonsiliasi idempoten, pengujian cerita/backend lama, dan cache frontend.
- **42 file JS/JSX** dapat di-parse dan tidak memiliki import relatif yang hilang.
- **CSS valid menurut parser PostCSS**.
- **Migrasi lama `001`–`004` tidak berubah** (byte-for-byte dibanding ZIP avatar sebelumnya).
- **Enam WebP ukuran 448×448** tersedia dan dibaca dengan sukses.

Belum dapat diverifikasi di lingkungan pembuat:

- Build Vite lengkap dan lint native dari dependensi npm (akses instalasi Linux terhambat; dependensi pada ZIP sumber lama memakai binding Windows).
- Uji Playwright secara langsung dengan Neon (lingkungan tidak mempunyai `server/.env` maupun akses database pemilik).
- Eksekusi SQL migrasi 005 terhadap branch Neon asli; migrasi disediakan tetapi database eksternal tidak diubah dari sini.

Untuk menguji sendiri pada laptop Windows (branch Neon test):

```powershell
npm.cmd ci
npm.cmd --prefix server ci
npm.cmd --prefix server run db:migrate
npm.cmd --prefix server run db:seed:shop
npm.cmd --prefix server run db:verify:shop
npm.cmd --prefix server test
npm.cmd run test:cache
npm.cmd run build
```

Jalankan `npm.cmd run test:e2e` **hanya di branch Neon pengujian**; script membuat dan menghapus akun permainan sementara. Sebelum menjalankannya, pastikan dependensi sudah diinstal dan migrasi + seed toko sudah selesai. Jika ada error, kirim potongan output terminal yang tidak memuat password/URL database.
