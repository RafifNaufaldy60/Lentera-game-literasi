import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router';
import { useAuth } from '../auth/AuthContext.js';
import { Icon, LoadingState, ErrorState, dateTime } from '../components/Icons.jsx';
import { ShopArtwork, shopCategories } from '../components/ShopCosmetics.jsx';
import { useResource } from '../hooks/useResource.js';
import { api } from '../lib/api.js';
import { primeResource } from '../lib/resource-cache.js';

const tabs = [['all','Semua item'], ...Object.entries(shopCategories)];
const allAssets = ['frame','chat','companion','background','nameplate','stickers'];
const accents = ['cyan','violet','pink','gold','mint'];
const blankItem = {id:'',name:'',description:'',category:'frame',assetKey:'frame',accent:'cyan',price:80,isActive:true};
const coinText = (n) => `${Number(n||0).toLocaleString('id-ID')} CC`;

function WalletSpot({balance}) {
  return <div className="shop-wallet"><span className="coin-medallion" aria-hidden="true">C</span><div><small>SALDO CYBER COINS</small><strong>{coinText(balance)}</strong></div></div>;
}
function ShopItemCard({item,onChoose}) {
  return <article className={`shop-card shop-accent-${item.accent}`}>
    <div className="shop-card-visual"><ShopArtwork item={item}/><span className="shop-category-label">{shopCategories[item.category]}</span></div>
    <div className="shop-card-info"><h3>{item.name}</h3><p>{item.description}</p>
      <div className="shop-card-bottom"><strong className="shop-price"><span className="coin-mini">C</span>{coinText(item.price)}</strong>
        <button type="button" className="shop-action" onClick={()=>onChoose(item)}>{item.equipped?'Dipakai':item.owned?'Dimiliki':'Lihat item'}</button>
      </div>
    </div>
  </article>;
}
export function Shop() {
  const {csrfToken,refreshSession}=useAuth();
  const catalog=useResource('/shop/catalog'),wallet=useResource('/shop/me');
  const [category,setCategory]=useState('all'),[selected,setSelected]=useState(null),[busy,setBusy]=useState(false),[error,setError]=useState(''),[success,setSuccess]=useState('');
  useEffect(()=>{document.title='Cyber Shop | Lentera PLAY';},[]);
  useEffect(()=>{if(!selected)return undefined;const onEscape=(event)=>{if(event.key==='Escape')setSelected(null);};window.addEventListener('keydown',onEscape);return ()=>window.removeEventListener('keydown',onEscape);},[selected]);
  const items=catalog.data?.items??[];
  const selectedItem=items.find((x)=>x.id===selected?.id)??selected;
  const available=items.filter((x)=>category==='all'||x.category===category);
  const balance=wallet.data?.balance??0;
  async function purchase(){
    if(!selectedItem||busy)return;
    setBusy(true);setError('');setSuccess('');
    try{
      const result=await api('/shop/purchase',{method:'POST',body:{itemId:selectedItem.id},csrfToken});
      primeResource('/shop/me',result);catalog.reload();
      setSelected(null);setSuccess(`${result.purchased} masuk ke inventarismu. Buka inventaris untuk memakainya.`);
    }catch(err){setError(err.message);if(err.code==='CSRF_EXPIRED')await refreshSession({silent:true});}
    finally{setBusy(false);}
  }
  if(catalog.loading&&!catalog.data||wallet.loading&&!wallet.data)return <LoadingState label="Membuka toko Cyber Shop…"/>;
  if(catalog.error&&!catalog.data||wallet.error&&!wallet.data)return <ErrorState error={catalog.error||wallet.error} retry={()=>{catalog.reload();wallet.reload();}}/>;
  return <div className="app-page shop-page">
    <section className="shop-hero"><div className="shop-hero-copy"><span className="shop-kicker">LENTERA PLAY / REWARD STORE</span><h1>CYBER<br/><em>SHOP.</em></h1>
      <p>Selesaikan misi, kumpulkan Cyber Coins, dan personalisasi markasmu. Semua barang adalah kosmetik—tidak ada jalan pintas untuk skor.</p>
      <div className="shop-hero-actions"><WalletSpot balance={balance}/><Link to="/inventaris" className="shop-hero-link"><Icon name="shopping-bag"/> Inventarisku <Icon name="chevron-right" size={16}/></Link></div>
      <p className="shop-earning-note">Hadiah tiap misi dihitung dari skor terbaikmu. Mengulang tanpa peningkatan skor tidak menambah koin.</p>
    </div><div className="shop-feature-art"><img src="/shop/companion.webp" width="448" height="448" alt="Neko Byte, companion hologram dari Cyber Shop"/><span>COLLECT / CUSTOMIZE / PLAY</span></div></section>
    <div className="shop-section-heading"><div><p className="eyebrow">KOLEKSI DIGITAL</p><h2>Pilih gayamu.</h2><p>{items.length} barang tersedia. Ketuk item untuk melihat detail dan membelinya.</p></div><Link to="/inventaris" className="button secondary">Buka inventaris</Link></div>
    <div className="shop-tabs" role="group" aria-label="Filter kategori barang">{tabs.map(([key,label])=><button key={key} type="button" aria-pressed={category===key} className={category===key?'active':''} onClick={()=>setCategory(key)}>{label}</button>)}</div>
    {success&&<div className="notice success" role="status">{success}</div>}
    {available.length?<div className="shop-product-grid">{available.map((item)=><ShopItemCard key={item.id} item={item} onChoose={(x)=>{setSelected(x);setError('');}}/>)}</div>:<p className="shop-empty">Belum ada item aktif dalam kategori ini. Admin dapat menambahkannya melalui pengelolaan toko.</p>}
    <div className="shop-fairness"><Icon name="shield" size={25}/><div><strong>Skill tetap nomor satu.</strong><p>Item tidak memengaruhi kualitas keputusan, nilai simulasi, XP, atau leaderboard. Cyber Coins tidak dapat ditukar menjadi uang.</p></div></div>
    {selectedItem&&<div className="shop-modal-backdrop" onClick={()=>setSelected(null)}>
      <section className="shop-modal" role="dialog" aria-modal="true" aria-labelledby="shop-item-heading" onClick={(e)=>e.stopPropagation()}>
        <button type="button" className="shop-modal-close" aria-label="Tutup detail item" onClick={()=>setSelected(null)}>×</button>
        <div className={`shop-modal-art shop-accent-${selectedItem.accent}`}><ShopArtwork item={selectedItem}/></div>
        <div className="shop-modal-copy"><span className="eyebrow">{shopCategories[selectedItem.category]} / DIGITAL COLLECTIBLE</span><h2 id="shop-item-heading">{selectedItem.name}</h2><p>{selectedItem.description}</p>
          <div className="shop-modal-cost"><span>Harga</span><strong><span className="coin-mini">C</span> {coinText(selectedItem.price)}</strong></div>
          <div className="shop-modal-cost"><span>Saldo saat ini</span><strong>{coinText(balance)}</strong></div>
          {error&&<p className="notice error" role="alert">{error}</p>}
          {selectedItem.owned?<Link to="/inventaris" className="button primary">Sudah dimiliki — buka inventaris</Link>:<button type="button" className="button primary" disabled={busy||balance<selectedItem.price} onClick={purchase}>{busy?'Memproses pembelian…':balance<selectedItem.price?'Koin belum cukup':'Beli dengan Cyber Coins'}</button>}
          <button type="button" className="shop-cancel" onClick={()=>setSelected(null)}>Kembali ke katalog</button>
        </div>
      </section>
    </div>}
  </div>;
}
export function Inventory(){
  const {csrfToken,refreshSession}=useAuth();
  const r=useResource('/shop/me');const history=useResource('/shop/history');
  const [busy,setBusy]=useState(''),[msg,setMsg]=useState(''),[error,setError]=useState('');
  useEffect(()=>{document.title='Inventaris | Lentera PLAY';},[]);
  async function equip(slot,itemId){setBusy(slot);setMsg('');setError('');try{
    const updated=await api('/shop/equip',{method:'PUT',body:{slot,itemId},csrfToken});primeResource('/shop/me',updated);
    setMsg(itemId?'Perlengkapan berhasil dipakai. Buka profil atau permainan untuk melihatnya.':'Perlengkapan dilepas.');
  }catch(err){setError(err.message);if(err.code==='CSRF_EXPIRED')await refreshSession({silent:true});}finally{setBusy('');}}
  if(r.loading&&!r.data)return <LoadingState label="Mengambil barang koleksimu…"/>;
  if(r.error&&!r.data)return <ErrorState error={r.error} retry={r.reload}/>;
  const {inventory,equipment,balance}=r.data;
  return <div className="app-page shop-page inventory-page"><header className="inventory-header"><div><p className="eyebrow">PLAYER COLLECTION</p><h1>Inventarisku</h1><p>Atur perlengkapan yang tampil di profil dan layar permainan.</p></div><WalletSpot balance={balance}/></header>
    <div className="inventory-toolbar"><span>{inventory.length} item dimiliki · {Object.keys(equipment).length} sedang dipakai</span><Link to="/toko" className="button primary">Jelajahi Cyber Shop</Link></div>
    {msg&&<p role="status" className="notice success">{msg}</p>}{error&&<p role="alert" className="notice error">{error}</p>}
    {inventory.length?<div className="inventory-grid">{inventory.map((item)=>{const worn=equipment[item.category]?.item_id===item.id;
      return <article className="inventory-card" key={item.id}><ShopArtwork item={item}/><div><small>{shopCategories[item.category]}</small><h3>{item.name}</h3><p>{item.description}</p>
        <button type="button" className={`button ${worn?'secondary':'primary'}`} disabled={Boolean(busy)} onClick={()=>equip(item.category,worn?null:item.id)}>{busy===item.category?'Menyimpan…':worn?'Lepas item':'Pakai item'}</button></div></article>;
    })}</div>:<div className="shop-inventory-empty"><img src="/shop/companion.webp" alt="Robot Neko Byte" width="180" height="180"/><h2>Inventarismu masih kosong</h2><p>Ambil Cyber Coins dari misi, kemudian pilih barang pertamamu.</p><Link to="/toko" className="button primary">Buka Cyber Shop</Link></div>}
    <section className="shop-history"><h2>Riwayat Cyber Coins</h2><p>Catatan hadiah misi dan pembelian item—bukan uang sungguhan.</p>
      {history.loading&&!history.data?<LoadingState label="Mengambil riwayat…"/>:history.error&&!history.data?<ErrorState error={history.error} retry={history.reload}/>:<div className="coin-history-list">{(history.data?.transactions??[]).map((t)=><div className="coin-history-row" key={t.id}><div><strong>{t.description}</strong><small>{dateTime(t.created_at)}</small></div><strong className={t.amount>0?'coin-positive':'coin-negative'}>{t.amount>0?'+':''}{t.amount} CC</strong></div>)}{!history.data?.transactions?.length&&<p>Belum ada transaksi. Selesaikan misi pertamamu!</p>}</div>}
    </section>
  </div>;
}
export function AdminShop(){
  const items=useResource('/admin/shop/items'),history=useResource('/admin/shop/transactions');
  const {csrfToken,refreshSession}=useAuth();
  const [draft,setDraft]=useState(blankItem),[editing,setEditing]=useState(false),[saving,setSaving]=useState(false),[error,setError]=useState(''),[success,setSuccess]=useState('');
  const activeItems=items.data?.items??[];
  const preview=useMemo(()=>({...draft,asset_key:draft.assetKey}),[draft]);
  useEffect(()=>{document.title='Kelola Cyber Shop | Lentera';},[]);
  function edit(item){setDraft({id:item.id,name:item.name,description:item.description,category:item.category,assetKey:item.asset_key,accent:item.accent,price:item.price,isActive:item.is_active});setEditing(true);setSuccess('');setError('');window.scrollTo({top:0,behavior:'smooth'});}
  function reset(){setEditing(false);setDraft(blankItem);setError('');}
  async function save(e){e.preventDefault();setSaving(true);setError('');setSuccess('');try{
    await api(editing?`/admin/shop/items/${draft.id}`:'/admin/shop/items',{method:editing?'PATCH':'POST',body:draft,csrfToken});items.reload();reset();setSuccess('Barang berhasil disimpan. Perubahan katalog sudah tersedia untuk pemain.');
  }catch(err){setError(err.message);if(err.code==='CSRF_EXPIRED')await refreshSession({silent:true});}finally{setSaving(false);}}
  if(items.loading&&!items.data)return <LoadingState label="Memuat katalog toko…"/>;
  if(items.error&&!items.data)return <ErrorState error={items.error} retry={items.reload}/>;
  return <div className="app-page shop-admin"><header className="page-heading"><div><p className="eyebrow">ADMIN / CYBER SHOP</p><h1>Kelola toko digital</h1><p className="page-description">Atur item kosmetik, harga Cyber Coins, dan ketersediaan. Pembelian peserta tetap tersimpan saat item dinonaktifkan.</p></div></header>
    <section className="admin-shop-editor"><form onSubmit={save}><h2>{editing?'Edit barang':'Tambah barang baru'}</h2><div className="admin-shop-fields">
      <label>ID barang<input required disabled={editing} pattern="[a-z][a-z0-9-]{2,59}" minLength={3} maxLength={60} value={draft.id} onChange={(e)=>setDraft({...draft,id:e.target.value})} placeholder="frame-nova"/></label>
      <label>Nama barang<input required minLength={3} maxLength={80} value={draft.name} onChange={(e)=>setDraft({...draft,name:e.target.value})}/></label>
      <label>Kategori<select value={draft.category} onChange={(e)=>setDraft({...draft,category:e.target.value})}>{Object.entries(shopCategories).map(([key,label])=><option value={key} key={key}>{label}</option>)}</select></label>
      <label>Aset gambar<select value={draft.assetKey} onChange={(e)=>setDraft({...draft,assetKey:e.target.value})}>{allAssets.map((key)=><option key={key} value={key}>{key}</option>)}</select></label>
      <label>Harga Cyber Coins<input type="number" min="0" max="100000" required value={draft.price} onChange={(e)=>setDraft({...draft,price:Number(e.target.value)})}/></label>
      <label>Warna aksen<select value={draft.accent} onChange={(e)=>setDraft({...draft,accent:e.target.value})}>{accents.map((key)=><option key={key} value={key}>{key}</option>)}</select></label>
      <label className="admin-shop-desc">Deskripsi item<textarea required minLength={8} maxLength={240} rows={3} value={draft.description} onChange={(e)=>setDraft({...draft,description:e.target.value})}/></label>
      <label className="admin-shop-check"><input type="checkbox" checked={draft.isActive} onChange={(e)=>setDraft({...draft,isActive:e.target.checked})}/> Tersedia untuk dibeli</label>
    </div>{error&&<p role="alert" className="notice error">{error}</p>}{success&&<p role="status" className="notice success">{success}</p>}
    <div className="admin-shop-buttons"><button type="submit" className="button primary" disabled={saving}>{saving?'Menyimpan…':editing?'Simpan perubahan':'Tambahkan ke katalog'}</button>{editing&&<button type="button" className="button secondary" onClick={reset}>Batal edit</button>}</div></form>
    <div className="admin-shop-preview"><ShopArtwork item={preview}/><strong>{draft.name||'Preview item'}</strong><span>{coinText(draft.price)}</span></div></section>
    <section className="shop-admin-list"><h2>Katalog ({activeItems.length})</h2><div className="admin-shop-rows">{activeItems.map((item)=><article key={item.id}><ShopArtwork item={item}/><div><strong>{item.name}</strong><small>{shopCategories[item.category]} · {coinText(item.price)} · {item.is_active?'Aktif':'Nonaktif'}</small></div><button type="button" className="button secondary" onClick={()=>edit(item)}>Edit</button></article>)}</div></section>
    <section className="shop-history"><h2>Aktivitas koin terbaru</h2><p>100 transaksi terbaru. Nilai peserta tetap dinilai terpisah dari saldo koin.</p>
    {history.loading&&!history.data?<LoadingState/>:history.error&&!history.data?<ErrorState error={history.error} retry={history.reload}/>:<div className="coin-history-list">{(history.data?.transactions??[]).map((t)=><div className="coin-history-row" key={t.id}><div><strong>{t.player_name} · {t.description}</strong><small>{dateTime(t.created_at)}</small></div><strong className={t.amount>0?'coin-positive':'coin-negative'}>{t.amount>0?'+':''}{t.amount} CC</strong></div>)}</div>}</section>
  </div>;
}
