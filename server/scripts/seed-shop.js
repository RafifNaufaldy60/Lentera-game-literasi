import { runDatabaseTask, setupTransaction } from '../src/database-tasks.js';
const items = [
 ['frame-nyan','Nyan Circuit','Bingkai neon dengan telinga kucing holografik.','frame','frame',80,'violet'],
 ['frame-pulse','Pulse Halo','Bingkai cyan dengan denyut cahaya digital.','frame','frame',110,'cyan'],
 ['chat-holo','Holo Messenger','Tema pesan ungu holografik untuk cerita chat.','chat','chat',120,'violet'],
 ['chat-candy','Candy Signal','Tema pesan pink dan biru dengan nuansa arcade.','chat','chat',95,'pink'],
 ['pet-nyan','Neko Byte','Robot kucing mini yang menemanimu di markas.','companion','companion',150,'cyan'],
 ['pet-aurora','Aurora Bot','Teman hologram dengan kilau ungu ceria.','companion','companion',175,'violet'],
 ['bg-mooncity','Moon City','Latar kota digital saat bulan terbit.','background','background',100,'pink'],
 ['bg-skyline','Neon Skyline','Latar profil kota futuristik berwarna cyan.','background','background',130,'cyan'],
 ['title-signal','Signal Scout','Gelar digital untuk penjelajah yang teliti.','title','nameplate',35,'gold'],
 ['title-guardian','Cyber Guardian','Gelar untuk agen pelindung dunia digital.','title','nameplate',90,'gold'],
 ['sticker-shield','Guardian Sticker','Stiker khusus profil bertema keamanan digital.','stickers','stickers',30,'mint'],
 ['sticker-pixel','Pixel Mood','Koleksi stiker warna-warni untuk kartu pemain.','stickers','stickers',60,'pink'],
];
await runDatabaseTask('Seed Cyber Shop', async (client) => {
  await setupTransaction(client, async () => {
    for(const item of items) {
      await client.query(`INSERT INTO public.shop_items(id,name,description,category,asset_key,price,accent)
        VALUES ($1,$2,$3,$4,$5,$6,$7) ON CONFLICT(id) DO NOTHING`, item);
    }
    console.log('Cyber Shop: 12 item tersedia; barang yang sudah diedit admin tidak ditimpa.');
  });
});
