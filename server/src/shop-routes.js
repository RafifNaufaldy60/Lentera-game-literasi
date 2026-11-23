import { SHOP_CATEGORIES, syncMissionCoins, validateShopItem } from './shop-economy.js';

const idPattern = /^[a-z][a-z0-9-]{2,59}$/;
async function transaction(pool, job) {
  const client = await pool.connect();
  try { await client.query('BEGIN'); const value = await job(client); await client.query('COMMIT'); return value; }
  catch(error) { await client.query('ROLLBACK').catch(()=>{}); throw error; }
  finally { client.release(); }
}
class ShopConflict extends Error { constructor(status,message) { super(message); this.status=status; } }
const reject = (status,message) => { throw new ShopConflict(status,message); };
const itemsQuery = `SELECT i.id,i.name,i.description,i.category,i.asset_key,i.price,i.accent,i.is_active,
 EXISTS (SELECT 1 FROM public.user_inventory v WHERE v.item_id=i.id AND v.user_id=$1) AS owned,
 EXISTS (SELECT 1 FROM public.user_equipment e WHERE e.item_id=i.id AND e.user_id=$1) AS equipped
 FROM public.shop_items i`;
async function inventoryState(client,userId) {
  const [wallet,inventory,equipped] = await Promise.all([
    client.query('SELECT balance FROM public.coin_wallets WHERE user_id=$1', [userId]),
    client.query(`SELECT i.id,i.name,i.category,i.asset_key,i.accent,i.description,v.acquired_at
      FROM public.user_inventory v JOIN public.shop_items i ON i.id=v.item_id
      WHERE v.user_id=$1 ORDER BY v.acquired_at DESC`, [userId]),
    client.query(`SELECT e.slot,e.item_id,i.name,i.asset_key,i.accent FROM public.user_equipment e
      JOIN public.shop_items i ON i.id=e.item_id WHERE e.user_id=$1`, [userId]),
  ]);
  return { balance:Number(wallet.rows[0]?.balance??0), inventory:inventory.rows,
    equipment:Object.fromEntries(equipped.rows.map((x)=>[x.slot,x])) };
}
function handleShopError(error,res) { if (error instanceof ShopConflict) return res.status(error.status).json({error:error.message}); throw error; }
export function registerShopRoutes(app,pool,requireUser,requireAdmin) {
  app.get('/api/shop/catalog',requireUser,async(req,res)=>{
    const {rows}=await pool.query(`${itemsQuery} WHERE i.is_active=TRUE ORDER BY i.category,i.price,i.id`,[req.user.id]);
    res.json({items:rows});
  });
  app.get('/api/shop/me',requireUser,async(req,res)=>{
    const state=await transaction(pool,async(client)=>{
      await syncMissionCoins(client,req.user.id);
      return inventoryState(client,req.user.id);
    });
    res.json(state);
  });
  app.get('/api/shop/history',requireUser,async(req,res)=>{
    const transactions=await transaction(pool,async(client)=>{
      await syncMissionCoins(client,req.user.id);
      const {rows}=await client.query(`SELECT id,amount,kind,description,created_at
        FROM public.coin_transactions WHERE user_id=$1 ORDER BY created_at DESC,id DESC LIMIT 80`,[req.user.id]);
      return rows;
    });
    res.json({transactions});
  });
  app.post('/api/shop/purchase',requireUser,async(req,res)=>{
    if(!idPattern.test(req.body?.itemId??'')) return res.status(422).json({error:'ID barang tidak valid.'});
    try {
      const data=await transaction(pool,async(client)=>{
        await syncMissionCoins(client,req.user.id);
        const {rows}=await client.query('SELECT id,name,price FROM public.shop_items WHERE id=$1 AND is_active=TRUE',[req.body.itemId]);
        if(!rows.length) return reject(404,'Barang tidak tersedia.');
        const item=rows[0];
        const already=await client.query('SELECT 1 FROM public.user_inventory WHERE user_id=$1 AND item_id=$2',[req.user.id,item.id]);
        if(already.rowCount) return reject(409,'Barang ini sudah ada di inventarismu.');
        const debit=await client.query(`UPDATE public.coin_wallets SET balance=balance-$2,updated_at=now()
          WHERE user_id=$1 AND balance >= $2 RETURNING balance`,[req.user.id,item.price]);
        if(!debit.rowCount) return reject(409,'Cyber Coins belum cukup untuk membeli barang ini.');
        await client.query('INSERT INTO public.user_inventory(user_id,item_id) VALUES($1,$2)',[req.user.id,item.id]);
        if(item.price>0) await client.query(`INSERT INTO public.coin_transactions(user_id,amount,kind,item_id,description)
          VALUES($1,$2,'purchase',$3,$4)`,[req.user.id,-item.price,item.id,`Pembelian: ${item.name}`]);
        return {...await inventoryState(client,req.user.id),purchased:item.name};
      });
      res.status(201).json(data);
    }catch(error){handleShopError(error,res);}
  });
  app.put('/api/shop/equip',requireUser,async(req,res)=>{
    const {slot,itemId}=req.body??{};
    if(!SHOP_CATEGORIES.includes(slot)||!(itemId===null||idPattern.test(itemId??''))) return res.status(422).json({error:'Slot atau pilihan barang tidak valid.'});
    try {
      const data=await transaction(pool,async(client)=>{
        await client.query('SELECT pg_advisory_xact_lock(hashtext($1))',[req.user.id]);
        if(itemId===null){ await client.query('DELETE FROM public.user_equipment WHERE user_id=$1 AND slot=$2',[req.user.id,slot]); }
        else {
          const {rows}=await client.query(`SELECT i.id,i.category FROM public.user_inventory v JOIN public.shop_items i ON i.id=v.item_id
            WHERE v.user_id=$1 AND v.item_id=$2`,[req.user.id,itemId]);
          if(!rows.length) return reject(403,'Kamu belum memiliki barang ini.');
          if(rows[0].category!==slot) return reject(422,'Barang tidak sesuai dengan slot perlengkapan.');
          await client.query(`INSERT INTO public.user_equipment(user_id,slot,item_id) VALUES($1,$2,$3)
            ON CONFLICT(user_id,slot) DO UPDATE SET item_id=EXCLUDED.item_id,equipped_at=now()`,[req.user.id,slot,itemId]);
        }
        return inventoryState(client,req.user.id);
      });
      res.json(data);
    }catch(error){handleShopError(error,res);}
  });
  app.get('/api/admin/shop/items',requireUser,requireAdmin,async(req,res)=>{
    const {rows}=await pool.query(`${itemsQuery} ORDER BY i.created_at,i.name`,[req.user.id]);
    res.json({items:rows});
  });
  app.post('/api/admin/shop/items',requireUser,requireAdmin,async(req,res)=>{
    if(!validateShopItem(req.body)) return res.status(422).json({error:'Periksa data barang, kategori, aset, dan harga.'});
    const i=req.body;
    const {rows}=await pool.query(`INSERT INTO public.shop_items(id,name,description,category,asset_key,price,accent,is_active)
      VALUES($1,$2,$3,$4,$5,$6,$7,$8) ON CONFLICT DO NOTHING RETURNING id`,
    [i.id,i.name.trim(),i.description.trim(),i.category,i.assetKey,i.price,i.accent,i.isActive]);
    if(!rows.length) return res.status(409).json({error:'ID barang telah digunakan.'});
    res.status(201).json({id:rows[0].id});
  });
  app.patch('/api/admin/shop/items/:id',requireUser,requireAdmin,async(req,res)=>{
    if(!idPattern.test(req.params.id) || !validateShopItem({...req.body,id:req.params.id})) return res.status(422).json({error:'Data barang tidak valid.'});
    const i=req.body;
    const categoryLock=await pool.query(`SELECT 1 FROM public.shop_items i WHERE i.id=$1 AND i.category <> $2
      AND EXISTS (SELECT 1 FROM public.user_inventory WHERE item_id=i.id)`,[req.params.id,i.category]);
    if(categoryLock.rowCount) return res.status(409).json({error:'Kategori barang yang sudah dimiliki pemain tidak boleh diubah.'});
    const {rows}=await pool.query(`UPDATE public.shop_items SET name=$2,description=$3,category=$4,asset_key=$5,
      price=$6,accent=$7,is_active=$8,updated_at=now() WHERE id=$1 RETURNING id`,
    [req.params.id,i.name.trim(),i.description.trim(),i.category,i.assetKey,i.price,i.accent,i.isActive]);
    if(!rows.length) return res.status(404).json({error:'Barang tidak ditemukan.'});
    res.json({id:rows[0].id});
  });
  app.get('/api/admin/shop/transactions',requireUser,requireAdmin,async(req,res)=>{
    const {rows}=await pool.query(`SELECT t.id,t.kind,t.amount,t.description,t.created_at,u.name AS player_name,i.name AS item_name
      FROM public.coin_transactions t JOIN public.users u ON u.id=t.user_id
      LEFT JOIN public.shop_items i ON i.id=t.item_id ORDER BY t.created_at DESC,t.id DESC LIMIT 100`);
    res.json({transactions:rows});
  });
}
