# Catatan validasi Avatar Cyber

Konteks desain: galeri avatar untuk pemain platform edukasi keamanan siber Lentera PLAY. Mengikuti `DESIGN.md` dengan ENERGY 3 / RHYTHM 3 / MOTION 2.

## Yang sudah diperiksa

- Node test: 29 dari 29 lulus; termasuk tujuh file gambar tersedia, ID avatar valid, dan empat ID lama tetap dapat dipetakan.
- JavaScript backend/shared: `node --check` lulus.
- Enam file JSX yang berubah diperiksa dengan TypeScript `transpileModule`: sintaks lulus.
- CSS `src/App.css` diperiksa dengan parser PostCSS: sintaks lulus.
- Gambar asli dari pengguna dikonversi menjadi WebP 448 × 448 tanpa mengubah subjek atau gaya. Ukuran gabungan aset baru sekitar 323 KiB.
- Migrasi `004_cyber_avatars.sql` hanya menyesuaikan `CHECK`/default `avatar_key`; migrasi `001`, `002`, `003` tidak disentuh.

## Batasan pengujian

- **Belum diuji end-to-end di browser dan Neon.** Instalasi dependensi npm penuh tidak berhasil dalam lingkungan kerja ini, sehingga Vite build dan klik kontrol secara langsung belum terverifikasi.
- Pengujian Playwright untuk alur pilih, simpan, refresh avatar ditambahkan ke `tests/e2e/learning.spec.js` dan harus diuji di branch Neon khusus pengembangan.
- Uji desktop/mobile di browser tetap diperlukan untuk memastikan tampilan dan fokus keyboard tidak bermasalah.

## Pemeriksaan Anti-Slop / delivery gate

- R-23 PASS: hanya menggunakan tujuh gambar yang secara eksplisit diberikan pengguna.
- R-37 PASS: palet, font, dan gaya diambil dari `DESIGN.md`, tidak mengubah identitas visual situs lain.
- R-39 PASS (inspeksi kode): tombol avatar memiliki nama aksesibel, `aria-pressed`, fokus terlihat, dan gambar dekoratif ber-alt kosong.
- R-40 PASS (inspeksi kode): gambar punya dimensi, WebP ringan, `decoding=async`, dan ukuran thumbnail disediakan di CSS.
- R-35 BELUM LOLOS: pengujian navigasi langsung di browser dan build Vite belum dapat dilakukan di lingkungan ini; lakukan sebelum men-deploy.

## Alasan desain

- Foto karakter disajikan di lingkaran karena ketujuh aset memang disusun sebagai avatar melingkar.
- Grid dua kolom di ponsel menampilkan karakter cukup besar tanpa scroll horizontal.
- Biru neon hanya untuk ring/penanda pilihan, bukan untuk setiap permukaan, menjaga fokus pada karakter yang dipilih.
- Simbol avatar NPC tetap memakai glyph lama agar identitas karakter dalam simulasi tidak terganti oleh avatar pemain.
