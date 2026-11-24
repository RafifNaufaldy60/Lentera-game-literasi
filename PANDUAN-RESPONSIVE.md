# Lentera PLAY — perbaikan responsif tanpa horizontal scroll

> Struktur terbaru: jalankan perintah `npm.cmd --prefix frontend` / `npm.cmd --prefix backend` dari root `Lentera-PLAY`. Jika sudah di dalam folder masing-masing, cukup gunakan `npm.cmd` tanpa `--prefix`.

Pembaruan ini memperbaiki tata letak halaman pemain dan admin. **Tidak mengubah API, database, data pemain, saldo Cyber Coins, migrasi, atau aset.** Migrasi Neon dan seed **tidak perlu** dijalankan ulang.

## Perubahan

- Navigasi dengan delapan tautan tidak lagi memaksa satu baris. Pada desktop lebar, navigasi berada di baris kedua; ketika ruang berkurang, menu berubah menjadi tombol **Menu** yang dapat dibuka dan ditutup.
- Di ponsel, logo dan tombol Menu berada di baris pertama; saldo dan kontrol akun berada pada baris kedua.
- Inventaris, hero Cyber Shop, kartu item, formulir kelola toko, dan panel admin menggunakan lebar fleksibel serta susunan kolom yang menyesuaikan viewport.
- Area graf Story Builder (`.node-viewport`) dan tabel (`.table-scroll`) tetap boleh digeser *di dalam komponennya sendiri* supaya data tidak terpotong; halaman utamanya tidak perlu digeser horizontal.
- Tautan navigasi masih dapat digunakan melalui keyboard, termasuk label Menu dan indikator keadaan `aria-expanded`.

## Instalasi di Windows

1. Ekstrak `Lentera-PLAY-Responsive.zip` ke direktori baru; buka folder **Lentera-PLAY** di VS Code.
2. Salin file **`backend/.env`** yang sekarang kamu gunakan dari proyek lama. Pastikan URL Neon tetap berada pada branch yang dimaksud. Jangan mengirim atau memasukkan file tersebut ke GitHub.
3. Dari folder utama jalankan dependensi jika belum tersedia:

```powershell
npm.cmd --prefix frontend ci
npm.cmd --prefix backend ci
```

4. Jalankan dua terminal terpisah:

```powershell
# Terminal backend
npm.cmd --prefix backend run dev
```

```powershell
# Terminal frontend
npm.cmd --prefix frontend run dev
```

Buka `http://localhost:5173`, login, kemudian coba Beranda, Cyber Shop, Inventaris, Profil, dan halaman admin.

## Pemeriksaan responsif

Di Chrome tekan `F12`, lalu klik **Toggle device toolbar** (`Ctrl + Shift + M`). Coba lebar **320, 360, 390, 600, 768, 1024, 1280, dan 1440 piksel**, termasuk membuka tombol Menu pada layar sempit. Periksa bahwa tidak ada horizontal scrollbar di bagian bawah *halaman*. Gerakan horizontal di **dalam** Story Builder atau tabel admin bersifat disengaja.

Jika ingin memeriksa lewat DevTools Console, jalankan:

```javascript
console.log({ viewport: window.innerWidth, pageWidth: document.documentElement.scrollWidth });
```

`pageWidth` seharusnya tidak lebih besar daripada `viewport` (kecuali akibat ekstensi browser atau perubahan CSS tambahan).

Tes regresi responsif untuk layar user/admin juga ditambahkan ke `frontend/tests/e2e/learning.spec.js` dan `frontend/tests/e2e/auth.spec.js`. Jalankan `npm.cmd --prefix frontend run test:e2e` **hanya pada branch Neon pengujian**, sebab pengujian membuat dan membersihkan akun/percobaan uji.

## Hasil verifikasi dalam paket ini

- Simulasi geometri halaman dengan Chromium: lebar dokumen tidak melebihi viewport pada **320–1920 px**.
- Menu user dan admin saat dibuka: **22 pemeriksaan** pada 11 ukuran layar per role, tanpa overflow.
- 200% ukuran font pada beberapa lebar: tidak menyebabkan scrollbar horizontal dalam simulasi geometri.
- CSS berhasil diparsing; 8/8 tes cache lulus.
- **Build Vite dan E2E dengan server/Neon asli belum dijalankan** dalam lingkungan pengemasan. Tes browser di atas menggunakan markup uji yang merepresentasikan layout, bukan sesi nyata terhadap Neon.

Perubahan CSS ada di `frontend/src/App.css` dan tes regresi ada di dua file E2E tersebut. Migrasi `001`–`005` tidak diubah.
