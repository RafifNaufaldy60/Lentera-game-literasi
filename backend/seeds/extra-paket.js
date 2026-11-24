const lesson = (slug, title, summary, paragraphs) => ({ slug, title, summary, content: paragraphs.join('\n\n') });
const message = (id, title, speaker, text) => ({ id, title, speaker, message: text, node_type: 'message', outcome: null });
const result = (id, title, text, outcome) => ({ id, title, speaker: 'Evaluasi latihan', message: text, node_type: 'result', outcome });
const choice = (id, from, to, position, label, points, evaluation) => ({
  id, node_id: from, next_node_id: to, position, label, points, evaluation,
});

export const extraPackages = [
  {
    material: lesson('berani-menghadapi-cyberbullying', 'Menghadapi cyberbullying dengan aman',
      'Kenali perundungan digital dan bantu korban tanpa memperburuk situasi.', [
        'Cyberbullying adalah tindakan menyakiti, mempermalukan, atau mengintimidasi seseorang melalui ruang digital, misalnya grup percakapan atau komentar media sosial.',
        'Jika melihat teman dirundung, jangan ikut menyebarkan konten yang merendahkan. Dukungan langsung kepada korban, seperti pesan pribadi yang tidak menyalahkan, bisa membantu.',
        'Simpan bukti yang diperlukan tanpa menyebarkannya di publik. Gunakan fitur laporkan dan blokir pada platform, serta beri tahu orang dewasa atau pihak tepercaya jika situasinya mengancam.',
        'Hindari membalas dengan hinaan atau mengajak massa untuk menyerang pelaku. Tindakan itu dapat memperluas konflik dan menambah paparan korban.',
        'Bila kamu atau orang lain menghadapi ancaman keselamatan, utamakan bantuan langsung dari orang tepercaya dan layanan yang berwenang. Semua contoh di latihan ini fiktif.',
      ]),
    scenario: {
      slug: 'grup-kelas-mengejek-teman', title: 'Grup kelas yang mulai menyerang',
      description: 'Percakapan grup kelas berubah menjadi ejekan terhadap seorang teman. Apa yang kamu lakukan?',
      entryNodeId: 'awal',
      nodes: [
        message('awal', 'Pesan di grup kelas', 'Grup Kelas 10B', 'Reno mengirim meme yang mengejek foto Naya. Anggota grup mulai memberi komentar kasar. Naya keluar dari grup.'),
        message('dukung', 'Teman meminta bantuan', 'Naya', 'Terima kasih sudah menghubungi. Aku takut masuk kelas besok. Aku masih punya tangkapan layar pesannya.'),
        message('ikut', 'Ejekan makin meluas', 'Reno', 'Wah, kamu ikut ketawa juga. Aku kirim ke grup sekolah lain, ya?'),
        result('aman', 'Kamu membantu tanpa memperluas perundungan', 'Kamu mendukung Naya secara pribadi, tidak menyebarkan meme, dan membantunya melapor lewat jalur tepercaya. Korban merasa didengar dan bukti tetap aman.', 'safe'),
        result('pulih', 'Kamu berhenti ikut mengejek', 'Setelah ikut tertawa, kamu menolak penyebaran lanjutan, meminta maaf, dan mendukung korban. Langkah pemulihan baik, tetapi komentar awal sudah memperburuk situasi.', 'recovered'),
        result('risiko', 'Ejekan menyebar ke lebih banyak orang', 'Meme menjadi viral di grup lain dan memperberat tekanan pada korban. Di dunia nyata, jangan meneruskan konten yang merundung dan laporkan kejadian kepada pihak tepercaya.', 'risky'),
      ],
      choices: [
        choice('hubungi', 'awal', 'dukung', 1, 'Kirim dukungan lewat pesan pribadi', 50, 'Menghubungi korban tanpa menarik perhatian publik membantu menjaga ruang amannya.'),
        choice('tertawa', 'awal', 'ikut', 2, 'Ikut menertawakan di grup', 0, 'Komentar yang dianggap bercanda tetap bisa memperkuat perundungan.'),
        choice('lapor', 'dukung', 'aman', 1, 'Bantu simpan bukti dan laporkan dengan aman', 50, 'Bukti dan laporan yang proporsional bisa membantu menghentikan perundungan.'),
        choice('tolak', 'ikut', 'pulih', 1, 'Tolak penyebaran, minta maaf, lalu bantu Naya', 40, 'Memperbaiki kesalahan tetap penting meski tidak menghapus dampak komentar sebelumnya.'),
        choice('bagikan', 'ikut', 'risiko', 2, 'Teruskan meme ke grup lain', 0, 'Menyebarkan ulang konten perundungan memperluas jumlah orang yang melihatnya.'),
      ],
    },
  },
  {
    material: lesson('jaga-privasi-dari-doxing', 'Menjaga privasi dari doxing',
      'Pelajari cara mencegah dan merespons penyebaran data pribadi tanpa izin.', [
        'Doxing berarti mengungkap informasi pribadi seseorang tanpa izin, terutama untuk membuat mereka rentan terhadap gangguan atau ancaman.',
        'Informasi seperti alamat rumah, nomor telepon, jadwal sekolah, dan identitas anggota keluarga tidak semestinya disebarkan tanpa persetujuan.',
        'Saat informasi pribadi tersebar, jangan ikut mengutip atau mengunggah ulang datanya. Simpan bukti dengan aman, laporkan unggahan ke platform, dan minta penghapusan.',
        'Periksa kembali pengaturan privasi akun dan batasi informasi yang terlihat publik. Bila ada ancaman langsung, cari bantuan dari orang tepercaya atau pihak berwenang.',
        'Jangan mencoba membalas dengan membocorkan data pihak lain. Latihan ini hanya menggunakan identitas dan percakapan fiktif.',
      ]),
    scenario: {
      slug: 'alamat-tersebar-di-komunitas', title: 'Alamat tersebar di komunitas gim',
      description: 'Data pribadi seorang anggota komunitas muncul dalam ruang obrolan gim. Pilih respons yang tidak memperluas kebocoran.',
      entryNodeId: 'awal',
      nodes: [
        message('awal', 'Kiriman mengejutkan', 'Komunitas Guild', 'Seseorang membagikan alamat rumah dan nomor telepon pemain bernama Aira di grup. Pesannya bertuliskan: “Biar semua tahu tempat tinggalnya!”'),
        message('hapus', 'Pesan pribadi dari korban', 'Aira', 'Aku panik. Aku tidak mengizinkan data itu dibagikan. Apa yang bisa kita lakukan?'),
        message('balas', 'Perdebatan jadi ramai', 'Anggota komunitas', 'Kamu mengunggah ulang tangkapan layar yang masih menampilkan alamat Aira. Orang lain mulai meneruskannya.'),
        result('aman', 'Kamu membantu menjaga privasi korban', 'Kamu meminta admin menghapus unggahan, melaporkannya, menyimpan bukti secara terbatas, dan menyarankan Aira mencari bantuan tepercaya. Data tidak kamu sebar ulang.', 'safe'),
        result('pulih', 'Kamu mengoreksi tindakan yang berisiko', 'Kamu menghapus unggahan ulang, meminta orang lain berhenti menyebarkan, dan melapor. Ini langkah baik, meskipun data sempat terlihat lebih luas.', 'recovered'),
        result('risiko', 'Informasi pribadi makin tersebar', 'Membalas dengan unggahan terbuka memperluas doxing. Saat menemui data sensitif, hindari menyebarkannya walau tujuanmu membela korban.', 'risky'),
      ],
      choices: [
        choice('privat', 'awal', 'hapus', 1, 'Hubungi Aira secara pribadi dan jangan sebar data', 50, 'Privasi korban harus menjadi prioritas sejak awal.'),
        choice('unggah', 'awal', 'balas', 2, 'Unggah screenshot berisi data agar orang marah', 0, 'Membagikan ulang tangkapan layar tetap menyebarkan data pribadi.'),
        choice('lapor', 'hapus', 'aman', 1, 'Minta admin menghapus unggahan dan laporkan', 50, 'Laporan dan penghapusan dapat mengurangi paparan tanpa menyebarkan datanya.'),
        choice('perbaiki', 'balas', 'pulih', 1, 'Hapus posting ulang dan bantu laporan tertutup', 40, 'Menghapus konten dan menghentikan penyebaran merupakan langkah pemulihan.'),
        choice('viralkan', 'balas', 'risiko', 2, 'Terus viralkan screenshot agar ramai', 0, 'Viralitas justru dapat meningkatkan bahaya bagi pemilik data.'),
      ],
    },
  },
  {
    material: lesson('waspada-penipuan-belanja-online', 'Waspada penipuan belanja online',
      'Berlatih memeriksa toko dan menghindari pembayaran berisiko.', [
        'Penipuan online sering memanfaatkan rasa terburu-buru, harga yang terlalu menarik, dan permintaan pembayaran di luar sistem yang melindungi pembeli.',
        'Periksa identitas serta riwayat penjual, ulasan yang masuk akal, kebijakan pengembalian, dan saluran pembayaran resmi pada platform yang digunakan.',
        'Jangan mudah percaya pada tangkapan layar bukti transfer, testimoni yang tidak terverifikasi, atau penawaran yang hanya berlaku beberapa menit.',
        'Jika diminta memindahkan transaksi ke rekening pribadi atau mengirim kode OTP, hentikan dan verifikasi lewat kanal resmi. Kode verifikasi tidak boleh diberikan kepada penjual.',
        'Jika sudah telanjur membayar, simpan bukti dan segera hubungi penyedia pembayaran serta layanan resmi platform. Cerita, toko, dan akun dalam latihan ini fiktif.',
      ]),
    scenario: {
      slug: 'flash-sale-toko-palsu', title: 'Flash sale yang terlalu bagus',
      description: 'Penjual menawarkan konsol gim dengan harga sangat murah, tetapi mengajak pindah transaksi ke chat pribadi.',
      entryNodeId: 'awal',
      nodes: [
        message('awal', 'Penawaran mendadak', 'Toko FlashGim (fiktif)', 'Konsol terbaru diskon 80%! Stok terakhir, hanya lima menit. Chat pribadi untuk transfer langsung agar tidak kena biaya platform.'),
        message('cek', 'Temuan saat memeriksa', 'Halaman toko di marketplace', 'Toko baru dibuat kemarin, belum punya ulasan pembeli yang terverifikasi. Harga produk jauh di bawah harga umum.'),
        message('buru', 'Penjual memberi tekanan', 'Toko FlashGim (fiktif)', 'Cepat transfer ke rekening ini! Kalau tidak sekarang, promonya hangus. Jangan lewat marketplace ya.'),
        result('aman', 'Kamu menghindari transaksi mencurigakan', 'Kamu menemukan tanda bahaya, tidak mentransfer uang, dan melaporkan toko melalui platform. Kamu tetap bisa mencari penjual lain yang bisa diverifikasi.', 'safe'),
        result('pulih', 'Kamu berhasil menghindari transfer', 'Kamu sempat mengikuti percakapan pribadi, tetapi akhirnya menolak transfer di luar platform dan memeriksa reputasi toko. Tindakan korektifmu mengurangi risiko.', 'recovered'),
        result('risiko', 'Uang berisiko tidak kembali', 'Dalam skenario ini, penjual palsu menghilang setelah transfer di luar platform. Jika terjadi sungguhan, simpan bukti transaksi dan hubungi bank serta platform terkait.', 'risky'),
      ],
      choices: [
        choice('cek_toko', 'awal', 'cek', 1, 'Periksa reputasi toko dan harga terlebih dahulu', 50, 'Memeriksa rekam jejak penjual membantu mengenali penawaran tidak wajar.'),
        choice('dm', 'awal', 'buru', 2, 'Ikuti ajakan chat pribadi karena diskon', 0, 'Bertransaksi di luar platform dapat menghilangkan perlindungan pembeli.'),
        choice('lapor', 'cek', 'aman', 1, 'Batalkan transaksi dan laporkan toko', 50, 'Tidak melanjutkan transaksi mencurigakan mencegah risiko finansial.'),
        choice('tolak', 'buru', 'pulih', 1, 'Tolak transfer dan periksa toko resmi', 40, 'Menolak desakan pembayaran adalah keputusan pemulihan yang baik.'),
        choice('transfer', 'buru', 'risiko', 2, 'Transfer di luar platform dalam simulasi', 0, 'Transfer langsung ke rekening asing sangat berisiko tanpa jaminan dari platform.'),
      ],
    },
  },
];
