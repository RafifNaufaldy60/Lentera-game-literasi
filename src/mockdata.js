// src/mockdata.js
export const scenariosData = [
  {
    id: "kasus-1",
    title: "Doxing KTP di Grup Kelas",
    category: "Perlindungan Data Pribadi & Doxing",
    difficulty: "Menengah",
    groupName: "Grup SI Angkatan 2024 (38 Anggota)",
    description:
      "Seorang anggota grup menyebarkan foto KTP dan alamat rumah teman sekelas karena emosi soal pembagian tugas.",
    initialNodeId: "node_1",
    nodes: {
      node_1: {
        id: "node_1",
        isEnding: false,
        messages: [
          {
            id: "m1",
            sender: "Raka",
            role: "Anggota Grup",
            time: "19:40",
            text: "Dina mana nih?! Bagian laporan belum di-upload juga dari sore.",
          },
          {
            id: "m2",
            sender: "Raka",
            role: "Anggota Grup",
            time: "19:41",
            text: "[Mengirim Foto KTP & Alamat Rumah Dina] Biar tau rasa, sebarin aja sekalian datanya biar semua orang tahu!",
            isAlert: true,
          },
          {
            id: "m3",
            sender: "Dina",
            role: "Korban",
            time: "19:42",
            text: "Raka tolong hapus!! Itu ada NIK dan alamat rumahku 😭 Tadi laptopku mati mendadak.",
          },
        ],
        choices: [
          {
            id: "c1_a",
            text: "Marahi Raka balik di grup dengan kata-kata kasar supaya dia kapok.",
            nextNodeId: "node_2a",
            score: 5,
            behaviorTag: "Konfrontatif Agresif",
          },
          {
            id: "c1_b",
            text: "Screenshot bukti chat, ingatkan di grup bahwa sebar KTP melanggar UU PDP, lalu japri Dina.",
            nextNodeId: "node_2b",
            score: 15,
            behaviorTag: "Active Upstander",
          },
          {
            id: "c1_c",
            text: "Diam saja dan hanya menyimak karena takut ikut diserang Raka.",
            nextNodeId: "node_2c",
            score: 0,
            behaviorTag: "Passive Bystander",
          },
        ],
      },

      node_2a: {
        id: "node_2a",
        isEnding: false,
        messages: [
          {
            id: "m4",
            sender: "Raka",
            role: "Anggota Grup",
            time: "19:44",
            text: "Apa lo ikut campur?! Mau gue bongkar juga data lo di sini?!",
          },
          {
            id: "m5",
            sender: "Sistem",
            role: "Situasi Grup",
            time: "19:45",
            text: "Suasana grup semakin ricuh karena debat terbuka, sementara foto KTP Dina masih belum dihapus.",
            isSystem: true,
          },
        ],
        choices: [
          {
            id: "c2a_1",
            text: "Berhenti berdebat, amankan screenshot bukti, dan ajak Dina melapor ke Satgas/Kaprodi.",
            nextNodeId: "end_neutral",
            score: 10,
            behaviorTag: "Koreksi Taktis",
          },
          {
            id: "c2a_2",
            text: "Lanjutkan adu argumen di grup sampai Raka mengalah.",
            nextNodeId: "end_bad",
            score: -5,
            behaviorTag: "Eskalasi Konflik",
          },
        ],
      },

      node_2b: {
        id: "node_2b",
        isEnding: false,
        messages: [
          {
            id: "m6",
            sender: "Sistem",
            role: "Situasi Grup",
            time: "19:44",
            text: "Raka menghapus pesan foto KTP tersebut setelah membaca peringatan sanksi UU PDP darimu.",
            isSystem: true,
          },
          {
            id: "m7",
            sender: "Dina (Chat Pribadi)",
            role: "Korban",
            time: "19:46",
            text: "Makasih banyak ya udah belain aku... Tapi aku masih gemetaran, takut fotonya tadi sempat di-save anak lain.",
          },
        ],
        choices: [
          {
            id: "c2b_1",
            text: "Kirimkan bukti screenshot yang sudah kamu simpan ke Dina untuk membuat tiket laporan resmi kampus.",
            nextNodeId: "end_best",
            score: 15,
            behaviorTag: "Pendamping Empatik",
          },
          {
            id: "c2b_2",
            text: "Bilang 'Sabar ya, kan pesannya udah dihapus Raka' lalu akhiri percakapan.",
            nextNodeId: "end_neutral",
            score: 5,
            behaviorTag: "Empati Parsial",
          },
        ],
      },

      node_2c: {
        id: "node_2c",
        isEnding: false,
        messages: [
          {
            id: "m8",
            sender: "Sistem",
            role: "Keesokan Harinya",
            time: "08:15",
            text: "Dina tidak masuk kuliah hari ini. Beredar kabar nomor HP dan datanya disalahgunakan oleh pihak luar karena tidak ada yang menghentikan Raka semalam.",
            isSystem: true,
          },
        ],
        choices: [
          {
            id: "c2c_1",
            text: "Cari riwayat chat semalam, ambil screenshot, dan kirim laporan insiden ke pihak kampus.",
            nextNodeId: "end_neutral",
            score: 10,
            behaviorTag: "Intervensi Terlambat",
          },
          {
            id: "c2c_2",
            text: "Tetap diam dan fokus kuliah seperti biasa karena merasa bukan urusanmu.",
            nextNodeId: "end_bad",
            score: -10,
            behaviorTag: "Abaikan Insiden",
          },
        ],
      },

      end_best: {
        id: "end_best",
        isEnding: true,
        endingType: "Best Ending — Active Upstander",
        evaluationText:
          "Langkahmu sangat tepat! Kamu mengamankan bukti digital sebelum dihapus pelaku, melakukan de-eskalasi berbasis aturan (UU PDP) tanpa memicu keributan baru, serta memberikan dukungan psikologis dan bukti valid bagi korban untuk melapor.",
      },
      end_neutral: {
        id: "end_neutral",
        isEnding: true,
        endingType: "Neutral Ending — Partial Intervention",
        evaluationText:
          "Kamu sudah berusaha membantu korban, namun respons awalmu sempat memicu eskalasi atau terlambat mencegah penyebaran data. Dalam kasus doxing, kecepatan mengamankan bukti dan menenangkan situasi sangat krusial.",
      },
      end_bad: {
        id: "end_bad",
        isEnding: true,
        endingType: "Bad Ending — Bystander Effect / Escalation",
        evaluationText:
          "Sikap diam (bystander pasif) atau kemarahan tanpa strategi membuat korban semakin terisolasi dan datanya terlanjur bocor luas. Saksi di ruang digital memegang peran kunci untuk memutus rantai perundungan siber.",
      },
    },
  },
  {
    id: "kasus-2",
    title: "Intimidasi di Grup Kepanitiaan Kampus",
    category: "Etika Komunikasi & Anti-Cyberbullying",
    difficulty: "Dasar",
    groupName: "Panitia Divisi Acara (24 Anggota)",
    description:
      "Koordinator divisi mempermalukan staf maba secara terbuka di grup WhatsApp menggunakan stiker ejekan dan kata-kata merendahkan.",
    initialNodeId: "node_1",
    nodes: {
      node_1: {
        id: "node_1",
        isEnding: true,
        endingType: "Skenario Segera Hadir",
        evaluationText:
          "Skenario kedua ini disiapkan sebagai contoh katalog dinamis dan dapat kamu isi dengan pola node yang sama seperti Kasus 1.",
      },
    },
  },
];