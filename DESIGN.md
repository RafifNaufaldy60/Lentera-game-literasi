# Lentera PLAY — arah desain produk

## Arah visual

**Lentera adalah game petualangan keamanan digital**, bukan dashboard kerja atau buku elektronik. Nuansa visual adalah arcade-story modern yang tetap hangat untuk pembaca Indonesia: **ENERGY 3 / RHYTHM 3 / MOTION 2**. Pilihan desain diperuntukkan bagi pemain yang mempelajari phishing, cyberbullying, doxing, dan penipuan online, tidak mengglorifikasi peretasan.

### Palet dan peran

| Token | Hex | Penggunaan |
| --- | --- | --- |
| Navy / ink | `#13233c` | Teks utama, dasar hero, panel misi |
| Coral | `#ff7562` | CTA utama, penekanan petualangan |
| Yellow | `#ffd46c` | Petunjuk phishing dan poin |
| Mint | `#58d7b6` | Privasi, langkah aman |
| Pink | `#ffaac7` | Cerita cyberbullying dan empati |
| Sky | `#94d9ff` | Marketplace, misi informasi |
| Paper | `#fffaf2` | Konten panjang, ruang baca |

Topik dan prioritas interaksi memiliki aksen berbeda; jangan mengandalkan **warna saja** untuk menyampaikan status. Tombol tindakan memerlukan label. Warna status hasil juga memiliki teks `Aman`, `Pemulihan`, atau `Berisiko`.

### Tipografi, grafis, dan gerak

- Judul: Trebuchet MS / system fallback (rounded, ekspresif tetapi terbaca). Isi: Segoe UI / system sans. Tidak memerlukan unduhan font eksternal.
- Ilustrasi identitas: `public/illustrations/hero-quest.svg` dan ikon SVG lokal di `public/app-icons.svg`. Original, tidak mengambil tangkapan layar berhak cipta dari game lain.
- Geometri: panel rounded yang jelas, bilah progres, badge, dan identitas bab. Bayangan hanya untuk elemen yang perlu mengambang; hindari gradient tanpa fungsi.
- Motion: animasi singkat untuk keputusan, indikator pesan berikutnya, dan feedback; efek suara opsional, **mati secara default**. Hormati `prefers-reduced-motion`.
- Material edukatif tetap ringan, dengan panjang baris, kontras, dan hirarki yang baik. Permainan menggunakan gaya aplikasi fiktif (inbox, sosial, marketplace, investigasi), tidak menyamar sebagai layanan sungguhan.

### Halaman dan struktur

- **Beranda / Mission Hub**: hero, CTA menuju peta misi, progres pengguna berbasis API, satu misi rekomendasi, empat kartu materi, dan riwayat asli (tidak ada angka palsu).
- **Peta lima chapter**: topik berbeda per bab, empat bab awal terbuka; final chapter hanya terbuka setelah satu misi pada bab 1–4 selesai. Penguncian harus berlaku di backend juga.
- **Gameplay**: narasi fiktif dinamis, adegan percabangan, tiga clue yang dapat diinspeksi pada mode non-chat, keputusan dan penjelasan yang disimpan server. Hindari klik tautan fiktif keluar situs.
- **Hasil**: skor yang dihitung backend, ulasan setiap keputusan, konsekuensi ending, dan progres XP.
- **Profil**: tujuh pilihan avatar cyber dari aset WebP lokal pengguna, pengaturan suara, level, XP, dan pencapaian aktual. Avatar dipilih lewat galeri gambar dan tetap terbaca di header setelah disimpan.
- **Story Builder**: node dan edge visual yang dapat ditarik serta diedit, preview lokal, pemeriksaan seluruh jalur oleh backend; adegan yang sudah dimainkan harus diduplikasi alih-alih ditimpa.
- **Admin**: alat bantu pembuatan materi/skenario dan rekap nilai. Data identitas peserta tidak boleh dimasukkan ke media demo atau seed.

### Responsif, aksesibilitas, mutu

- Seluruh UI mendukung desktop, tablet, serta ponsel. Area keputusan berada setelah adegan agar tetap jelas di layar kecil. Pilihan dan input perlu target sentuh nyaman, label, dan fokus terlihat.
- Jangan buat tombol dekoratif tanpa aksi. Gunakan status loading/error ketika API sedang memproses. Pengguna dapat melanjutkan percobaan dari server setelah refresh.
- Cerita fiktif; tidak memerlukan input nomor telepon, lokasi, OTP, atau pembayaran nyata. Aset bertanda data sensitif harus menggunakan placeholder.
- Konten dan angka permainan diperoleh dari PostgreSQL; hanya materi fiktif/ilustrasi yang boleh statis.
- Peraturan gaya `.codex/skills/antislop*` berlaku untuk konten, kode, dan layout. Periksa juga pada browser lokal sebelum deployment.

## Cyber Shop / kosmetik digital

- Zona toko mempunyai identitas **navy arcade** (`#111a38`) dengan fokus **cyan** (`#8de4ff`) dan koin **emas** (`#ffdc78`). Pertahankan aksen item dari lima warna yang didefinisikan; jangan menambah warna untuk setiap kartu secara acak.
- Katalog berorientasi koleksi: satu hero besar, filter kategori, kartu item, preview, dan konfirmasi pembelian. Layout tetap jelas pada lebar ponsel. Aksi pembelian menampilkan saldo, harga, dan state tidak cukup koin secara eksplisit.
- Aset lokal berupa sprite sheet dan enam WebP ringan. Hero toko menggunakan karakter robot holografik, bukan foto stok. Avatar pemain yang sudah ada tetap menjadi identitas profil.
- Cyber Coins berbeda dari XP atau nilai ujian. Tidak ada mekanisme pay-to-win, pembayaran uang sungguhan, lootbox, atau poin yang bisa ditransfer keluar. Semua koin dan kepemilikan dihitung serta disimpan di server.
- Penggunaan kosmetik di profil dan layar chat tidak boleh mengganggu keterbacaan keputusan, pengaturan aksesibilitas, atau evaluasi skor.
