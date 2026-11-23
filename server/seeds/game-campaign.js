const stories = [
  {
    slug: 'email-beasiswa-palsu', material: 'mengenali-phishing-paket', chapter: 1, playMode: 'email', title: 'Beasiswa yang Menghilang',
    description: 'Lima keputusan untuk menguji email beasiswa, lampiran, domain pengirim, dan permintaan kode masuk.',
    steps: [
      { speaker:'Kotak masuk', prompt:'PENGUMUMAN SELEKSI! Kamu terpilih menerima beasiswa. Klik tautan dalam 15 menit atau kesempatan hangus.', safe:'Periksa domain pengirim dan alamat balasannya', risk:'Langsung percaya karena ada logo kampus', tip:'Logo mudah disalin. Alamat dan domain pengirim perlu diverifikasi.' },
      { speaker:'Portal akademik (fiktif)', prompt:'Email itu memakai domain yang mirip, tetapi ada satu huruf tambahan. Situs resmi akademik memiliki alamat berbeda.', safe:'Buka portal kampus dari bookmark sendiri', risk:'Klik tautan dalam email supaya lebih cepat', tip:'Membuka situs resmi secara mandiri mengurangi risiko situs tiruan.' },
      { speaker:'Panitia Beasiswa (fiktif)', prompt:'Formulir meminta kata sandi akun akademik dan kode OTP, bukan hanya berkas pendaftaran.', safe:'Tolak memasukkan kata sandi dan OTP', risk:'Masukkan data latihan supaya dapat lanjut', tip:'Beasiswa resmi tidak perlu meminta kata sandi pribadi atau kode autentikasi.' },
      { speaker:'Teman sekelas', prompt:'Temanmu meminta tautannya agar bisa ikut mendaftar. Ia tidak tahu kalau email itu mencurigakan.', safe:'Peringatkan teman tanpa meneruskan tautan', risk:'Teruskan email agar mereka memutuskan sendiri', tip:'Meneruskan tautan palsu dapat memperluas jumlah korban.' },
      { speaker:'Pusat bantuan', prompt:'Kamu telah mengumpulkan bukti email palsu. Apa keputusan terakhir?', safe:'Laporkan phishing melalui kanal resmi', risk:'Diamkan saja dan simpan sebagai arsip', tip:'Laporan dapat membantu layanan menindak tautan penipuan.' },
    ],
  },
  {
    slug:'komentar-yang-menyakitkan', material:'berani-menghadapi-cyberbullying', chapter:2, playMode:'social', title:'Satu Unggahan, Seribu Komentar',
    description:'Berperan sebagai teman Naya yang menghadapi komentar kasar, doxxing terselubung, dan tekanan dalam sebuah grup.',
    steps:[
      {speaker:'Beranda komunitas',prompt:'Sebuah akun anonim mengunggah foto Naya dengan caption yang mempermalukannya. Kolom komentar makin ramai.',safe:'Jangan ikut berkomentar menghina',risk:'Ikut menyukai agar terlihat akrab',tip:'Like dan komentar dapat memperluas paparan konten merundung.'},
      {speaker:'Naya',prompt:'Aku jadi takut berangkat sekolah. Aku tidak tahu harus bercerita kepada siapa.',safe:'Tanya apa dukungan yang Naya perlukan',risk:'Katakan bahwa Naya terlalu sensitif',tip:'Dengarkan dan hormati kebutuhan korban tanpa menyalahkan.'},
      {speaker:'Pengelola grup',prompt:'Seorang moderator meminta laporan yang jelas dan bukti terbatas.',safe:'Simpan bukti dengan aman dan laporkan',risk:'Sebarkan ulang screenshot di akun publik',tip:'Bukti untuk laporan tidak perlu disebarkan ke publik.'},
      {speaker:'Reno',prompt:'Kalau kamu protes, aku akan unggah hal yang lebih memalukan tentang Naya!',safe:'Jangan balas ancaman dengan hinaan',risk:'Ajak teman menyerang Reno balik',tip:'Membalas dengan perundungan bisa memperbesar konflik dan risiko.'},
      {speaker:'Guru BK (fiktif)',prompt:'Naya merasa sedikit lebih tenang, tetapi membutuhkan dukungan lanjutan.',safe:'Bantu menghubungi orang dewasa tepercaya',risk:'Anggap semuanya sudah selesai',tip:'Dukungan konsisten penting, terlebih bila ada ancaman dan gangguan berulang.'},
    ],
  },
  {
    slug:'jejak-profil-terbuka', material:'jaga-privasi-dari-doxing',chapter:3,playMode:'privacy',title:'Misteri Jejak Aira',
    description:'Periksa jejak informasi pribadi yang tersebar dalam komunitas dan bantu Aira tanpa ikut membocorkannya.',
    steps:[
      {speaker:'Papan bukti',prompt:'Profil publik Aira menampilkan sekolah, nama lengkap, dan unggahan dengan lokasi yang mudah dikenali.',safe:'Identifikasi informasi sensitif tanpa menyalin',risk:'Sebarkan tangkapan layar sebagai peringatan',tip:'Menyebarkan ulang data membuat jejak pribadi semakin luas.'},
      {speaker:'Aira',prompt:'Seorang anggota grup menebak lokasi rumahku dan membagikannya dalam pesan ramai.',safe:'Minta moderator menghapus pesan tersebut',risk:'Kutip alamat itu dalam komentar protes',tip:'Melapor tanpa mengutip informasi melindungi korban.'},
      {speaker:'Pengaturan akun',prompt:'Beberapa unggahan lama terlihat publik serta menampilkan jadwal kegiatan Aira.',safe:'Bantu evaluasi pengaturan privasi',risk:'Abaikan karena unggahannya sudah lama',tip:'Unggahan lama tetap bisa menyimpan petunjuk sensitif.'},
      {speaker:'Ruang laporan',prompt:'Moderator menanyakan bukti untuk menindak penyebaran data pribadi.',safe:'Kirim bukti terbatas melalui laporan tertutup',risk:'Unggah bukti ke linimasa agar semua melihat',tip:'Laporan tertutup membatasi penyebaran informasi.'},
      {speaker:'Aira',prompt:'Ada pesan ancaman yang membuatku khawatir bertemu orang tak dikenal.',safe:'Dorong Aira mencari bantuan tepercaya',risk:'Balas dengan mencari alamat si pelaku',tip:'Saat ada ancaman langsung, prioritaskan keselamatan dan bantuan yang berwenang.'},
    ],
  },
  {
    slug:'konsol-impian-diskon-besar',material:'waspada-penipuan-belanja-online',chapter:4,playMode:'market',title:'Flash Sale atau Jebakan?',
    description:'Jelajahi toko, evaluasi promo, dan hindari transaksi yang mengalihkanmu keluar dari marketplace.',
    steps:[
      {speaker:'Marketplace fiktif',prompt:'Konsol impian ditawarkan 85% lebih murah. Toko dibuat kemarin, belum mempunyai ulasan pembeli terverifikasi.',safe:'Bandingkan harga dan periksa reputasi toko',risk:'Beli segera karena stok tinggal satu',tip:'Penawaran jauh di bawah harga pasar dan ulasan kosong merupakan tanda yang perlu diverifikasi.'},
      {speaker:'Penjual FlashGim',prompt:'Kak, chat lewat nomor pribadi saja ya, nanti dapat potongan lebih besar.',safe:'Tetap gunakan chat di marketplace',risk:'Pindah ke nomor pribadi penjual',tip:'Berkomunikasi di platform menjaga bukti transaksi dan mekanisme perlindungan.'},
      {speaker:'Penjual FlashGim',prompt:'Kami hanya bisa terima transfer ke rekening pribadi, ya. Jangan lewat checkout.',safe:'Tolak transfer di luar platform',risk:'Kirim uang ke rekening yang diminta',tip:'Transaksi di luar sistem platform berisiko kehilangan perlindungan pembeli.'},
      {speaker:'Ulasan produk',prompt:'Lima ulasan terbaru sama persis dan diunggah pada menit yang berdekatan.',safe:'Curigai ulasan tidak autentik',risk:'Anggap semua ulasan itu bukti kepercayaan',tip:'Ulasan berulang dengan pola tidak wajar belum tentu berasal dari pembeli asli.'},
      {speaker:'Pusat resolusi',prompt:'Kamu menemukan alasan kuat untuk tidak membeli dari toko tersebut.',safe:'Batalkan dan laporkan penawaran palsu',risk:'Simpan toko untuk dibagikan ke teman',tip:'Melaporkan toko mencurigakan lebih aman daripada mengarahkan teman untuk ikut mencoba.'},
    ],
  },
  {
    slug:'digital-crisis-final',material:'mengenali-phishing-paket',chapter:5,playMode:'hybrid',title:'Digital Crisis: Malam Terakhir',
    description:'Misi final menggabungkan phishing, cyberbullying, doxing, dan penipuan. Bantu Naya dan Aira menghadapi serangan berantai.',
    steps:[
      {speaker:'Kotak masuk',prompt:'Naya menerima email reset akun dari alamat palsu. Email mengancam akan menghapus semua unggahannya dalam 10 menit.',safe:'Minta Naya membuka aplikasi resmi sendiri',risk:'Sarankan Naya mengklik tombol dalam email',tip:'Periksa akun lewat aplikasi resmi, jangan gunakan tautan yang mendesak.'},
      {speaker:'Grup Kelas 10B',prompt:'Komentar kasar tentang Naya muncul kembali dan beberapa teman ingin membagikan screenshot sebagai balasan.',safe:'Dukung korban dan laporkan tanpa menyebar ulang',risk:'Sebarkan screenshot untuk membuktikan masalah',tip:'Simpan bukti secara terbatas, bukan dengan memviralkan konten berbahaya.'},
      {speaker:'Aira',prompt:'Alamat rumahku sekarang beredar. Ada akun yang mengancam datang malam ini.',safe:'Minta bantuan tepercaya dan laporkan ancaman',risk:'Cari alamat pelaku untuk dibalas',tip:'Ancaman terhadap keselamatan harus ditangani dengan bantuan pihak berwenang.'},
      {speaker:'Toko FlashGim',prompt:'Akun palsu mengaku bisa menghapus semua postingan berbahaya jika dibayar lewat transfer pribadi.',safe:'Jangan membayar dan verifikasi layanan resmi',risk:'Kirim uang supaya masalah cepat hilang',tip:'Pihak mencurigakan bisa memanfaatkan kepanikan korban untuk pemerasan.'},
      {speaker:'Pusat Bantuan Digital',prompt:'Kamu berhasil mengumpulkan kronologi, bukti, dan kontak bantuan. Apa langkah penutup?',safe:'Amankan akun, simpan bukti, dan laporkan',risk:'Tutup semua laporan dan berharap masalah hilang',tip:'Pemulihan memerlukan pengamanan akun, dokumentasi terbatas, dan pelaporan yang tepat.'},
    ],
  },
];

export function makeCampaignGraph(story) {
  const nodes = [], choices = [];
  const modes = story.playMode === 'hybrid' ? ['email','social','privacy','market','chat'] : Array(5).fill(story.playMode);
  for (let step = 0; step < 5; step++) {
    for (const variant of step === 0 ? ['start'] : ['careful','rushed']) {
      const content = story.steps[step];
      nodes.push({ id: `step_${step}_${variant}`, title: `Tahap ${step + 1}: ${content.speaker}`,
        speaker: content.speaker, message: content.prompt, node_type: 'message', outcome: null,
        scene_type: modes[step], meta: { x: step * 280 + 40, y: variant === 'rushed' ? 320 : 80,
          avatar: variant === 'rushed' ? 'pixel' : 'spark', attachment: modes[step] === 'email' ? 'Periksa informasi pengirim dan isi pesan' : '' } });
    }
  }
  for (const [key,title,message,outcome] of [
    ['safe','Jalan yang lebih aman','Pilihan penutupmu melindungi diri dan orang lain. Tinjau kembali keputusan sebelumnya untuk melihat apakah masih ada risiko yang perlu dipulihkan.','safe'],
    ['recovered','Langkah pemulihan','Kamu mengambil tindakan korektif. Periksa kembali keputusan sebelumnya dan dampaknya agar tidak mengulangi risiko yang sama.','recovered'],
    ['risky','Tanda bahaya yang terlewat','Keputusan akhir menyisakan risiko. Seluruh peristiwa dalam latihan ini fiktif. Baca evaluasi, lalu coba pendekatan yang lebih aman.','risky'],
  ]) nodes.push({ id:`result_${key}`,title,speaker:'Evaluasi akhir',message,node_type:'result',outcome,
    scene_type:'system',meta:{x:1500,y:({safe:50,recovered:250,risky:450})[key],avatar:'shield'} });
  for (let step=0;step<5;step++) {
    for (const variant of step === 0 ? ['start'] : ['careful','rushed']) {
      const source=`step_${step}_${variant}`;
      const p=story.steps[step];
      if (step < 4) {
        choices.push({id:`${source}_safe`,node_id:source,next_node_id:`step_${step+1}_careful`,
          label:p.safe,points:20,evaluation:p.tip,position:1});
        choices.push({id:`${source}_risk`,node_id:source,next_node_id:`step_${step+1}_rushed`,
          label:p.risk,points:0,evaluation:`Keputusan ini meningkatkan risiko. ${p.tip}`,position:2});
      } else {
        choices.push({id:`${source}_safe`,node_id:source,next_node_id:'result_safe',label:p.safe,
          points:20,evaluation:p.tip,position:1});
        choices.push({id:`${source}_recover`,node_id:source,next_node_id:'result_recovered',
          label:'Hentikan situasi, lalu minta bantuan pihak tepercaya',points:10,
          evaluation:`Mengambil waktu untuk memperbaiki langkah adalah pilihan yang lebih baik. ${p.tip}`,position:2});
        choices.push({id:`${source}_risk`,node_id:source,next_node_id:'result_risky',label:p.risk,
          points:0,evaluation:`Ini dapat memperbesar risikonya. ${p.tip}`,position:3});
      }
    }
  }
  return { entryNodeId:'step_0_start',nodes,choices };
}
export const campaignStories=stories;
