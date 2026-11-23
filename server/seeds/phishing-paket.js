export const phishingMaterial = {
  slug: 'mengenali-phishing-paket',
  title: 'Mengenali phishing lewat pesan paket',
  summary: 'Latih cara memeriksa pesan pengiriman tanpa membagikan data pribadi atau kode verifikasi.',
  content: [
    'Phishing adalah upaya menyamar sebagai pihak tepercaya untuk meminta data atau mendorong tindakan yang merugikan.',
    'Pesan tentang paket tertahan perlu diperiksa, terutama jika pengirim mendesak, meminta biaya mendadak, atau mengarahkan ke situs yang tidak dikenal.',
    'Buka sendiri aplikasi pengiriman atau toko tempat kamu berbelanja. Cocokkan nomor resi dan hubungi layanan bantuan yang tersedia di aplikasi tersebut.',
    'Jangan membagikan password atau kode verifikasi kepada pengirim pesan. Membalas pesan tidak membuktikan bahwa pengirimnya petugas resmi.',
    'Jika pesan mencurigakan, hentikan percakapan, lalu gunakan fitur blokir dan laporkan. Jika sudah membagikan data, segera amankan akun melalui aplikasi resmi dan hubungi dukungannya.',
    'Seluruh nama, nomor resi, situs, dan kejadian pada simulasi ini fiktif. Tautan berakhiran .invalid hanya teks latihan dan tidak perlu dibuka.',
  ].join('\n\n'),
};

export const phishingScenario = {
  slug: 'paket-tertahan',
  title: 'Pesan paket tertahan',
  description: 'Latihan fiktif: pesan dari nomor tidak dikenal mengaku sebagai Kurir Latihan dan meminta pembaruan alamat paket. Pilih responsmu, lalu lihat konsekuensi dan evaluasinya. Tidak ada pengiriman data sungguhan.',
  entryNodeId: 'pesan_awal',
  nodes: [
    {
      id: 'pesan_awal',
      title: 'Pesan dari nomor tidak dikenal',
      speaker: 'Kurir Latihan (pengirim fiktif)',
      message: 'Paket FIK-2048 tertahan karena alamat belum lengkap. Perbarui alamat hari ini di https://paket-latihan.invalid/alamat agar paket tidak dikembalikan.',
      node_type: 'message',
      outcome: null,
    },
    {
      id: 'cek_resi_resmi',
      title: 'Status paket di aplikasi resmi',
      speaker: 'Aplikasi pengiriman (fiktif)',
      message: 'Kamu membuka aplikasi pengiriman sendiri. Resi FIK-2048 tercatat masih dalam perjalanan. Tidak ada permintaan biaya tambahan atau pembaruan alamat. Pesan dari nomor tadi tidak sesuai dengan informasi di aplikasi.',
      node_type: 'message',
      outcome: null,
    },
    {
      id: 'balasan_pengirim',
      title: 'Pengirim meminta kode verifikasi',
      speaker: 'Kurir Latihan (pengirim fiktif)',
      message: 'Alamat harus dikonfirmasi sekarang. Isi formulir di tautan tadi, lalu kirim kode verifikasi yang masuk ke ponselmu. Kalau lewat 10 menit, paket akan kami kembalikan.',
      node_type: 'message',
      outcome: null,
    },
    {
      id: 'hasil_aman',
      title: 'Kamu memeriksa pesan melalui kanal resmi',
      speaker: 'Evaluasi latihan',
      message: 'Kamu memeriksa resi lewat aplikasi yang dibuka sendiri, lalu memblokir dan melaporkan pesan palsu. Data dan kode verifikasi tidak dibagikan. Saat menerima pesan serupa, periksa informasi lewat kanal resmi sebelum bertindak.',
      node_type: 'result',
      outcome: 'safe',
    },
    {
      id: 'hasil_pulih',
      title: 'Kamu menghentikan percakapan berisiko',
      speaker: 'Evaluasi latihan',
      message: 'Setelah membalas, kamu mengenali desakan dan permintaan kode verifikasi sebagai tanda bahaya. Kamu menghentikan percakapan, memeriksa aplikasi resmi, lalu memblokir dan melaporkan pengirim. Belum ada data sensitif yang dibagikan. Berikutnya, lakukan pemeriksaan lewat kanal resmi sejak awal.',
      node_type: 'result',
      outcome: 'recovered',
    },
    {
      id: 'hasil_berisiko',
      title: 'Permintaan pengirim ternyata jebakan',
      speaker: 'Evaluasi latihan',
      message: 'Dalam cerita latihan ini, kamu mengikuti tautan palsu dan membagikan kode contoh. Pengirim mencoba memakai kode itu untuk mengambil alih akun. Tidak ada data nyata yang dikirim. Jika hal serupa terjadi, segera buka aplikasi resmi, ganti password, keluarkan sesi yang tidak dikenal, dan hubungi dukungan akun tersebut.',
      node_type: 'result',
      outcome: 'risky',
    },
  ],
  choices: [
    {
      id: 'cek_resi', node_id: 'pesan_awal', next_node_id: 'cek_resi_resmi', position: 1,
      label: 'Cek resi lewat aplikasi resmi', points: 50,
      evaluation: 'Memeriksa lewat aplikasi yang kamu buka sendiri membantu mencocokkan klaim pengirim tanpa mengikuti tautan pesannya.',
    },
    {
      id: 'minta_penjelasan', node_id: 'pesan_awal', next_node_id: 'balasan_pengirim', position: 2,
      label: 'Balas pesan untuk meminta penjelasan', points: 0,
      evaluation: 'Balasan pengirim belum membuktikan identitasnya. Percakapan berlanjut dan pengirim mendapat kesempatan meminta kode verifikasi.',
    },
    {
      id: 'laporkan', node_id: 'cek_resi_resmi', next_node_id: 'hasil_aman', position: 1,
      label: 'Blokir dan laporkan pesan palsu', points: 50,
      evaluation: 'Informasi sudah diperiksa melalui kanal resmi. Memblokir dan melaporkan mengakhiri interaksi dengan pengirim mencurigakan.',
    },
    {
      id: 'hentikan', node_id: 'balasan_pengirim', next_node_id: 'hasil_pulih', position: 1,
      label: 'Hentikan percakapan dan cek aplikasi resmi', points: 50,
      evaluation: 'Kamu mengenali permintaan kode verifikasi sebagai tanda bahaya dan beralih ke kanal resmi sebelum membagikan data.',
    },
    {
      id: 'ikuti', node_id: 'balasan_pengirim', next_node_id: 'hasil_berisiko', position: 2,
      label: 'Ikuti permintaan pengirim dalam simulasi', points: 0,
      evaluation: 'Tautan dan permintaan kode verifikasi dapat dipakai untuk mengambil alih akun. Pilihan ini hanya menggambarkan konsekuensi dalam latihan fiktif.',
    },
  ],
};
