# Perlengkapan Cyber Shop di profil

Perubahan frontend untuk memastikan semua enam slot perlengkapan dapat dilihat ketika dipakai:

- Bingkai: ilustrasi WebP toko mengelilingi avatar, termasuk pada kartu dashboard dan header. Varian menggunakan aksen item.
- Latar profil: ilustrasi wallpaper terlihat di kartu identitas, dengan lapisan gelap untuk keterbacaan.
- Gelar: gambar nameplate dan nama gelar yang dipakai.
- Companion: gambar dan nama pendamping yang aktif, bukan sekadar pratinjau toko.
- Stiker: gambar dan nama stiker yang dipasang.
- Tema chat: contoh percakapan di profil, dengan tema yang sama seperti di simulasi.

Data perlengkapan tetap bersumber dari GET `/api/shop/me` dan PUT `/api/shop/equip`. Respons mutasi langsung memperbarui cache bersama; respons GET terdahulu tidak boleh menimpa keadaan terbaru. Item dilepas dengan mengirim `itemId: null`. Setiap kategori hanya dapat memiliki satu item yang aktif, tetapi semua kategori bisa aktif bersamaan. Pembelian tetap hanya memberi kepemilikan, bukan otomatis memasang item.

## Menjalankan

Gunakan folder `frontend` dari versi ini bersama `backend` yang sudah ada, atau ekstrak seluruh ZIP ke folder baru. Jangan menimpa `backend/.env` maupun folder `.git` milikmu. Salin `.env` lama jika menggunakan folder baru. Tidak ada perubahan dependensi, SQL, seed, atau backend. Tidak perlu migrasi ulang.

Backend: `cd backend`, `npm ci` (jika belum terinstal), `npm run dev`.
Frontend: `cd frontend`, `npm ci` (jika belum terinstal), `npm run dev`.

## Pengujian di laptop

1. Login menggunakan akun pemain. Buka Inventaris dan tekan **Pakai item** pada item yang sudah dibeli. Tunggu pesan berhasil dan status **Sedang dipakai**.
2. Klik **Lihat profil**. Periksa efek sesuai kategori dan daftar Perlengkapan aktif. Refresh dan pastikan masih aktif.
3. Kembali ke Inventaris, pasang item lain pada kategori yang sama. Item lama harus dilepas otomatis. Uji **Lepas item** dan cek bahwa efek visual menghilang.
4. Jika memasang tema chat, buka simulasi. Tema yang terlihat pada contoh percakapan di profil harus sama dengan tema pada layar permainan.
5. Tes di layar ponsel dan desktop.

Jika item tidak muncul, cek Network di DevTools untuk `GET /api/shop/me` dan `PUT /api/shop/equip`. Pastikan respons HTTP sukses, `equipment` memuat slot yang dipakai, dan akun serta database Neon yang digunakan sama seperti saat membeli. Jangan membagikan cookie, token CSRF, `.env`, atau data rahasia.

## Hasil pengujian di lingkungan penyusunan

- 12 tes cache/kontrak dan 27 tes backend lulus, termasuk respons equip yang menimpa GET lama, lepas item, pembelian dan pergantian akun.
- Pemeriksaan sintaks JSX/JS dan CSS lulus.
- Layout profil dirender dengan komponen aktual dan data uji lokal di Chromium pada 320, 360, 390, 768, 1024, 1440, 1920 px: semua enam slot tampil, aset berhasil dimuat, tidak ada overflow horizontal pada halaman uji.
- Ditambahkan `frontend/tests/e2e/equipment.spec.js` untuk alur pasang/ganti/lepas dan refresh dengan API tiruan. Belum dieksekusi sebagai aplikasi React penuh karena paket Vite tidak tersedia di cache lingkungan ini. Koneksi Neon tidak diuji langsung. Uji dengan `npm run test:e2e -- equipment.spec.js` dari frontend setelah instalasi, dengan konfigurasi pengembangan yang valid.

Desain mengikuti identitas yang sudah ada: ilustrasi cyber asli menjadi fokus identitas, aksen warna menunjukkan varian item, dan gradien gelap menjaga kontras teks pada wallpaper. Tidak ada aset eksternal baru.
