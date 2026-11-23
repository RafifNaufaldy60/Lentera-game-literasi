import { runDatabaseTask } from '../src/database-tasks.js';
await runDatabaseTask('Verifikasi Cyber Shop',async(client)=>{
  const {rows}=await client.query(`SELECT
    (SELECT COUNT(*)::integer FROM public.shop_items) AS items,
    (SELECT COUNT(*)::integer FROM public.coin_wallets) AS wallets,
    (SELECT COUNT(*)::integer FROM public.user_inventory) AS owned_items,
    (SELECT COUNT(*)::integer FROM public.coin_transactions) AS transactions,
    (SELECT COUNT(*)::integer FROM public.user_equipment) AS equipped`);
  const {rows:diff}=await client.query(`SELECT COUNT(*)::integer AS mismatched FROM public.coin_wallets w WHERE
    w.balance <> (SELECT COALESCE(SUM(t.amount),0)::integer FROM public.coin_transactions t WHERE t.user_id=w.user_id)`);
  console.table(rows);
  console.log('Saldo tidak sesuai ledger:',diff[0].mismatched);
  if(rows[0].items<12 || diff[0].mismatched>0)throw new Error('Katalog belum di-seed atau saldo tidak sesuai ledger.');
  console.log('Cyber Shop siap. XP dan skor pendidikan tetap menggunakan tabel lama.');
});
