# Lentera PLAY — perbaikan loading antar menu

## Cara menggunakan versi baru

1. **Jangan hapus** folder proyek lama sebelum versi baru berhasil diuji. Ekstrak ZIP optimasi ke folder baru lalu buka folder `Lentera-PLAY` di VS Code.
2. Salin berkas `server/.env` dari folder proyek lama ke `server/.env` proyek hasil optimasi. Jangan kirimkan berkas ini ke orang lain atau GitHub. Connection string harus tetap mengarah ke branch Neon `lentera-play-test` saat uji coba.
3. Dari terminal root proyek, jalankan `npm.cmd ci` dan `npm.cmd --prefix server ci` jika `node_modules` belum ada.
4. Di Terminal 1 jalankan `npm.cmd --prefix server run dev`.
5. Di Terminal 2 jalankan `npm.cmd run dev`.
6. Buka `http://localhost:5173/masuk` lalu masuk dengan akun yang sudah terdaftar.
7. Uji berpindah **Beranda → Materi → Simulasi → Peta misi → Beranda** dan kembali ke menu sebelumnya. Konten yang sudah dimuat tidak perlu menunggu fetch ulang setiap kunjungan.
8. Periksa **pilih jawaban simulasi → halaman hasil → profil → peta misi**. Setelah ada skor baru, data terkait diperbarui otomatis. Uji logout dan login dengan akun berbeda agar data tidak tertukar.

## Perlu migrasi Neon lagi?

**Tidak perlu.** Pembaruan ini hanya memodifikasi frontend. Migrasi `003_game_expansion.sql`, lima misi, dan delapan badge yang telah berhasil diterapkan ke branch pengujian tetap dipakai. Jangan menjalankan restore SQL dump atau seed ulang untuk pembaruan performa ini.

## Apa yang diperbaiki?

- Cache memori sementara per alamat API; kunjungan balik menampilkan data yang sudah tersedia.
- Deduplication untuk request API yang diminta serentak.
- Prefetch via hover, keyboard focus, dan loading bertahap setelah login.
- Stale-while-revalidate: ketika data pernah tersedia dan cache kadaluarsa, konten tetap muncul sembari memperbarui data.
- Invalidation setelah aksi POST/PATCH/PUT, penghapusan cache saat pergantian akun, dan pelindung terhadap respons API lama yang datang terlambat.
- Halaman hasil permainan memanfaatkan respons pilihan terakhir; dashboard user mengurangi satu request API.

Performa pertama kali membuka suatu menu masih dipengaruhi oleh respons backend dan jaringan Neon. Untuk optimasi lebih jauh jika masih terasa lambat, ukur request yang paling lama lewat Chrome DevTools → Network → Fetch/XHR dan catat durasi serta endpoint yang lambat (tanpa membagikan cookie atau kredensial).

## Pengujian

```powershell
npm.cmd run test:cache
npm.cmd --prefix server test
npm.cmd run build
npm.cmd run lint
```

Saat pembuatan paket, 8/8 tes cache dan 19/19 tes backend lulus. Build/lint membutuhkan instalasi npm yang lengkap; akses registry npm di lingkungan pengemasan terbatas sehingga belum dapat diverifikasi di sini. Tidak ada perubahan database yang dilakukan oleh paket ZIP.
