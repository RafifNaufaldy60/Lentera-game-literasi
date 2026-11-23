# Backend Lentera PLAY — Express + Neon PostgreSQL

Panduan lengkap dan urutan migrasi tersedia di [`../README.md`](../README.md) dan [`../NEON-MIGRATION.md`](../NEON-MIGRATION.md). **Jangan mengimpor SQL dump lama ke database yang sudah berisi data.**

## API

| Method | Endpoint | Akses | Fungsi |
| --- | --- | --- | --- |
| GET / POST | `/api/auth/*` | public / user | register, login, logout, session |
| GET | `/api/catalog`, `/api/materials/:id` | user | Materi |
| GET | `/api/scenarios` | user | Daftar simulasi |
| POST | `/api/scenarios/:id/attempts` | user | Mulai sesi, cek chapter final |
| GET | `/api/attempts`, `/api/attempts/:id` | user | Riwayat dan adegan aktif |
| POST | `/api/attempts/:id/choices` | user | Catat keputusan dan evaluasi; beri badge bila selesai |
| GET | `/api/game/profile` | user | XP, level, avatar, pencapaian |
| PATCH | `/api/game/profile` | user | Avatar dan suara |
| GET | `/api/game/chapters` | user | Peta misi, unlock, skor terbaik |
| GET | `/api/shop/catalog` | user | Item aktif, harga, status dimiliki/dipakai |
| GET | `/api/shop/me` | user | Saldo, inventaris, item aktif; rekonsiliasi reward lama idempoten |
| GET | `/api/shop/history` | user | 80 catatan koin terbaru |
| POST | `/api/shop/purchase` | user | Beli barang secara atomik, check saldo dan duplikasi |
| PUT | `/api/shop/equip` | user | Pakai atau lepas item yang dimiliki |
| GET / POST / PATCH | `/api/admin/shop/items` | admin | Katalog item kosmetik, harga, status |
| GET | `/api/admin/shop/transactions` | admin | Aktivitas reward/pembelian terbaru |
| GET | `/api/leaderboard` | user | Peringkat |
| GET | `/api/admin/overview`, `/api/admin/attempts` | admin | Ringkasan dan nilai |
| POST / PATCH | `/api/admin/materials`, `/api/admin/materials/:id` | admin | Kelola materi |
| POST / PATCH | `/api/admin/scenarios`, `/api/admin/scenarios/:id` | admin | Buat dan terbitkan skenario |
| GET | `/api/admin/scenarios/:id/graph` | admin | Baca graf untuk Visual Story Builder |
| PUT | `/api/admin/scenarios/:id/graph` | admin | Edit graf **draf yang belum dimainkan** |

Seluruh aksi tulis dari browser menggunakan token CSRF. Score, kondisi menang, dan penguncian misi final dihitung atau diverifikasi oleh backend. Graf adalah DAG yang seluruh jalurnya mengarah ke node hasil; validator mencegah adegan buntu, siklus, node tidak terjangkau dan skor >100.

## Data Neon

```powershell
npm.cmd --prefix server run auth:setup
npm.cmd --prefix server run db:check
npm.cmd --prefix server run db:migrate
npm.cmd --prefix server run db:seed
npm.cmd --prefix server run db:seed:game
npm.cmd --prefix server run db:seed:shop
npm.cmd --prefix server run db:verify
npm.cmd --prefix server run db:verify:shop
```

Migrasi baru `003_game_expansion.sql` menambah kolom metadata dan 3 tabel pemain tanpa menghapus tabel lama. Seed kampanye menambah 5 misi dengan 5 keputusan masing-masing, idempoten. Jalankan terlebih dahulu di branch Neon test dengan URL **direct** (tanpa pooler). Gunakan `server/.env` milikmu sendiri; jangan sertakan kredensial dalam source control.

Untuk upgrade dari database `004`, baca [`../PANDUAN-CYBER-SHOP-NEON.md`](../PANDUAN-CYBER-SHOP-NEON.md). Tabel baru `shop_items`, `coin_wallets`, `coin_reward_progress`, `coin_transactions`, `user_inventory`, `user_equipment`. Mata uang virtual tidak memengaruhi skor pendidikan.
