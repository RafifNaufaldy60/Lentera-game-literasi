import { Link } from 'react-router';
import { useEffect, useState } from 'react';
import { useResource } from '../hooks/useResource.js';
import { useAuth } from '../auth/AuthContext.js';
import { api } from '../lib/api.js';
import { Icon, TopicMark, LoadingState, ErrorState } from '../components/Icons.jsx';
import { Avatar } from '../components/Avatar.jsx';
import { EquippedAvatar, CyberCompanion } from '../components/ShopCosmetics.jsx';
import { playerAvatars, resolvePlayerAvatar } from '../../shared/avatar-options.js';
import { primeResource } from '../lib/resource-cache.js';

const modes = { chat:'Cerita chat',email:'Detektif email',social:'Drama medsos',privacy:'Investigasi',market:'Marketplace',hybrid:'Misi gabungan' };
export function XPBar({ profile }) {
  return <div className="xp-block"><div className="xp-label"><span>LEVEL {profile.level}</span><strong>{profile.levelProgress} / {profile.levelGoal} XP</strong></div>
    <div className="xp-track" role="progressbar" aria-label="Progres ke level berikutnya" aria-valuenow={profile.levelProgress} aria-valuemin="0" aria-valuemax={profile.levelGoal}>
      <span style={{width:`${profile.levelProgress/profile.levelGoal*100}%`}} /></div></div>;
}
export function Campaign() {
  const r=useResource('/game/chapters');
  useEffect(()=>{document.title='Peta petualangan | Lentera';},[]);
  if(r.loading)return <LoadingState label="Menyiapkan peta misi…"/>;
  if(r.error)return <ErrorState error={r.error} retry={r.reload}/>;
  const complete=r.data.chapters.filter((c)=>c.completed).length;
  return <div className="app-page campaign-page">
    <header className="quest-intro"><div><p className="eyebrow">LENTERA / STORY MODE</p><h1>Petualangan digitalmu <span>dimulai di sini.</span></h1><p>Jelajahi lima chapter. Pilihanmu menentukan jalannya cerita, nilai yang kamu dapatkan, dan badge yang bisa dibuka.</p></div>
      <div className="quest-progress"><strong>{complete}<small> / 5</small></strong><span>Chapter diselesaikan</span><div className="quest-dots">{r.data.chapters.map((c)=><i key={c.number} className={c.completed?'done':''}/>)}</div></div></header>
    <div className="quest-track">
      {r.data.chapters.map((chapter,i)=><section key={chapter.number} className={`chapter-block chapter-${chapter.color} ${chapter.unlocked?'':'chapter-locked'}`}>
        <div className="chapter-number"><span>{String(chapter.number).padStart(2,'0')}</span><Icon name={chapter.completed?'check':chapter.unlocked?'play':'lock'} size={18}/></div>
        <div className="chapter-info"><div className="chapter-heading"><p>CHAPTER {String(chapter.number).padStart(2,'0')} · {chapter.topic.toUpperCase()}</p><h2>{chapter.title}</h2><span className="chapter-state">{chapter.completed?'Misi selesai':chapter.unlocked?'Siap dimainkan':'Terkunci'}</span></div>
          <p className="chapter-tagline">{chapter.tagline}</p>
          {chapter.unlocked ? <div className="chapter-missions">{chapter.scenarios.map((s)=><Link to={`/simulasi/${s.id}`} className="chapter-mission" key={s.id}>
            <TopicMark topic={`${s.slug} ${chapter.topic}`}/><span><strong>{s.title}</strong><small>{modes[s.play_mode]} · {s.estimated_minutes} menit · {s.best_score===null?'Belum dimainkan':`Skor terbaik ${s.best_score}/100`}</small></span>
            <Icon name="chevron-right" size={20}/></Link>)}</div> : <div className="chapter-lock-copy"><Icon name="lock" size={20}/><span>Selesaikan satu simulasi pada setiap chapter 1–4 untuk membuka final chapter.</span></div>}
        </div></section>)}
    </div>
    <p className="mission-disclaimer">Semua karakter, email, produk, dan situasi dalam permainan ini bersifat fiktif. Kamu tidak perlu mengunjungi tautan atau memberikan data pribadi.</p>
  </div>;
}
export function Profile() {
  const r=useResource('/game/profile');
  const shop=useResource('/shop/me');
  const {csrfToken,refreshSession,user}=useAuth();
  const [settings,setSettings]=useState(null),[saving,setSaving]=useState(false),[message,setMessage]=useState('');
  const p=r.data?.profile;
  const chosen=settings|| (p ? {avatarKey:p.settings.avatar_key,soundEnabled:p.settings.sound_enabled}:null);
  useEffect(()=>{document.title='Profil pemain | Lentera';},[]);
  if(r.loading)return <LoadingState/>;
  if(r.error)return <ErrorState error={r.error} retry={r.reload}/>;
  async function save(){setSaving(true);setMessage('');try{
    const updated = await api('/game/profile',{method:'PATCH',body:chosen,csrfToken});primeResource('/game/profile',updated);setMessage('Avatar dan pengaturan berhasil disimpan.');setSettings(null);
  }catch(error){setMessage(error.message);if(error.code==='CSRF_EXPIRED')await refreshSession({silent:true});}
  finally{setSaving(false);}}
  return <div className="app-page profile-page"><div className="page-heading"><div><p className="eyebrow">IDENTITAS PEMAIN</p><h1>Markas pemain</h1><p className="page-description">Sesuaikan avatar, kendalikan efek suara, dan lihat pencapaian yang benar-benar kamu peroleh.</p></div></div>
    <div className="profile-layout"><section className={`profile-panel ${shop.data?.equipment?.background?.item_id==='bg-mooncity'?'wallpaper-moon':shop.data?.equipment?.background?'wallpaper-skyline':''}`}><div className="profile-id"><EquippedAvatar name={chosen.avatarKey} frame={shop.data?.equipment?.frame} size="large"/><div><p className="eyebrow">{shop.data?.equipment?.title?.name||'DIGITAL EXPLORER'}</p><h2>{user.name}</h2><p>Level {p.level} · {p.uniqueMissions} misi unik selesai</p></div></div><XPBar profile={p}/>
      <div className="profile-shop-equipped"><div className="profile-shop-balance"><span className="coin-mini">C</span><span>{shop.data?Number(shop.data.balance).toLocaleString('id-ID'):'—'} CC</span></div><Link to="/inventaris" className="text-link">Atur koleksi <Icon name="chevron-right" size={15}/></Link></div>
      <CyberCompanion item={shop.data?.equipment?.companion}/>
      {shop.data?.equipment?.stickers&&<div className="profile-sticker"><img src="/shop/stickers.webp" width="70" height="70" alt="Stiker koleksi terpasang"/><span>{shop.data.equipment.stickers.name}</span></div>}
      <div className="avatar-picker-heading"><div><h3>Pilih avatar</h3><p>Pilih karakter yang paling cocok untuk petualangan digitalmu.</p></div><span className="avatar-count">7 KARAKTER</span></div>
      <div className="avatar-picker" role="group" aria-label="Pilih avatar pemain">{playerAvatars.map((avatar)=>{
        const isChosen=resolvePlayerAvatar(chosen.avatarKey).key === avatar.key;
        return <button type="button" key={avatar.key} className={isChosen?'selected':''}
          aria-label={`Pilih avatar ${avatar.label}, ${avatar.detail}`}
          aria-pressed={isChosen} onClick={()=>setSettings({...chosen,avatarKey:avatar.key})}>
          <Avatar name={avatar.key}/><strong>{avatar.label}</strong><small>{avatar.detail}</small>
          <span className="avatar-selected-indicator" aria-hidden="true">{isChosen?'✓':''}</span>
        </button>;
      })}</div>
      <p className="avatar-selection-copy" aria-live="polite">Dipilih: <strong>{resolvePlayerAvatar(chosen.avatarKey).label}</strong>. Klik <strong>Simpan pengaturan</strong> untuk menerapkan avatar pada akunmu.</p>
      <label className="sound-toggle"><input type="checkbox" checked={chosen.soundEnabled} onChange={(e)=>setSettings({...chosen,soundEnabled:e.target.checked})}/><Icon name="volume-2"/><span><strong>Efek suara interaktif</strong><small>Nada singkat saat memilih keputusan. Mati secara default.</small></span></label>
      {message&&<p className="notice" role="status">{message}</p>}<button className="button primary" type="button" disabled={saving || !settings} onClick={save}>{saving?'Menyimpan…':'Simpan pengaturan'}</button>
    </section><section className="achievements"><div className="section-heading"><div><p className="eyebrow">KOLEKSI PENCAPAIAN</p><h2>Badge yang kamu raih</h2><p>{p.badges.length} dari 8 badge terbuka</p></div></div>
      <div className="badge-gallery">{p.badges.length?p.badges.map((b)=><div className={`achievement achievement-${b.accent}`} key={b.badge_key}><span className="achievement-symbol"><Icon name={b.icon_key} size={24}/></span><div><h3>{b.title}</h3><p>{b.description}</p></div></div>):<div className="empty-badges"><Icon name="trophy" size={36}/><h3>Badge pertamamu menunggu</h3><p>Selesaikan satu misi untuk memulai koleksimu.</p><Link to="/petualangan" className="button secondary">Pilih misi</Link></div>}</div>
    </section></div>
  </div>;
}
