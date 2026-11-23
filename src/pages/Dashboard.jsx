import { Link } from 'react-router';
import { useEffect } from 'react';
import { useAuth } from '../auth/AuthContext.js';
import { useResource } from '../hooks/useResource.js';
import { EmptyState, ErrorState, Icon, LoadingState, Score, TopicMark, dateTime } from '../components/Icons.jsx';
import { XPBar } from './Missions.jsx';
import { EquippedAvatar, CyberCompanion } from '../components/ShopCosmetics.jsx';

export default function Dashboard(){
  const {user}=useAuth();
  const catalog=useResource('/catalog'),attempts=useResource('/attempts'),profile=useResource('/game/profile'),chapters=useResource('/game/chapters');
  const shop=useResource('/shop/me');
  useEffect(()=>{document.title='Mission hub | Lentera';},[]);
  const all=[catalog,attempts,profile,chapters];
  if(all.some((r)=>r.loading))return <LoadingState label="Menyiapkan markasmu…"/>;
  if(all.some((r)=>r.error))return <ErrorState error={all.find((r)=>r.error)?.error} retry={()=>all.forEach((r)=>r.reload())}/>;
  const materials=catalog.data.materials,logs=attempts.data.attempts,p=profile.data.profile;
  const active=logs.find((a)=>a.status==='in_progress');
  const recent=logs.filter((a)=>a.status==='completed').slice(0,3);
  const ready=chapters.data.chapters.flatMap((c)=>c.unlocked?c.scenarios:[]);
  const next=ready.find((s)=>s.best_score==null)||ready[0];
  return <div className="app-page hub-page">
    <section className="arcade-hero"><div className="arcade-copy"><p className="arcade-kicker"><span>●</span> DIGITAL ADVENTURE / MISSION HUB</p>
      <h1>Halo, {user.name.split(' ')[0]}!<br/><span>Dunia digital butuh kamu.</span></h1>
      <p>Jadilah pemain yang peka terhadap penipuan, berani membela teman, dan menjaga privasi. Pilihanmu menentukan cerita.</p>
      <div className="welcome-actions"><Link className="button primary" to="/petualangan"><Icon name="play" size={19}/> Jelajahi misi</Link><Link className="hero-link" to="/materi">Belajar dulu <Icon name="chevron-right" size={17}/></Link></div>
      <div className="arcade-safety"><Icon name="shield" size={16}/> Semua kasus hanya simulasi. Keputusanmu memiliki evaluasi.</div>
    </div><div className="arcade-art"><img src="/illustrations/hero-quest.svg" alt=""/><span className="art-label">THINK · CHECK · ACT</span></div></section>
    <div className="hub-overview"><Link to="/profil" className="player-card"><div className="player-card-top"><EquippedAvatar name={p.settings.avatar_key} frame={shop.data?.equipment?.frame} size="large"/><div><span className="eyebrow">KARTU PEMAIN</span><h2>{user.name}</h2><small>{shop.data?.equipment?.title?.name||'Digital Explorer'} · {p.badges.length} badge terbuka</small></div><Icon name="chevron-right" size={20}/></div><XPBar profile={p}/></Link>
      <div className="hub-stats"><div><span>SKOR TERBAIK</span><strong>{p.bestScore}<small>/100</small></strong></div><div><span>MISI SELESAI</span><strong>{p.uniqueMissions}</strong></div><div><span>MATERI TERBUKA</span><strong>{materials.length}</strong></div></div></div>
    <section className="hub-shop-teaser"><div className="hub-shop-message"><span className="eyebrow">COLLECT / CYBER SHOP</span><h2>Hadiah buat keputusan cermat.</h2><p>Kumpulkan Cyber Coins dari skor terbaik, lalu dapatkan bingkai avatar, companion, dan tema chat.</p><Link to="/toko" className="button primary">Jelajahi Cyber Shop <Icon name="chevron-right" size={17}/></Link></div><CyberCompanion item={shop.data?.equipment?.companion||{name:'Neko Byte'}} preview={!shop.data?.equipment?.companion}/></section>
    {active&&<section className="continue-banner"><span className="continue-icon"><Icon name="clock" size={23}/></span><div><p className="eyebrow">MISI BELUM SELESAI</p><strong>{active.scenario_title}</strong><p>Dimulai {dateTime(active.started_at)}</p></div><Link className="button secondary" to={`/bermain/${active.id}`}>Lanjutkan</Link></section>}
    <section className="section-block featured-mission"><div className="section-heading"><div><p className="eyebrow">NEXT UP / MISI UNTUKMU</p><h2>Siap menghadapi tantangan?</h2></div><Link className="text-link" to="/petualangan">Lihat peta <Icon name="chevron-right" size={17}/></Link></div>
      {next?<Link className="next-card" to={`/simulasi/${next.id}`}><div className="next-card-art"><TopicMark topic={next.slug} size="large"/><span>MISSION SELECT</span></div><div className="next-card-info"><p className="eyebrow">CHAPTER {String(next.chapter_number).padStart(2,'0')} · {next.play_mode.toUpperCase()}</p><h3>{next.title}</h3><p>{next.description}</p><small>{next.best_score==null?'Belum dimainkan':`Skor terbaikmu ${next.best_score}/100`} · {next.estimated_minutes} menit</small></div><span className="next-arrow"><Icon name="play" size={23}/></span></Link>:<EmptyState title="Belum ada misi">Admin dapat menerbitkan misi baru melalui panel pengelolaan.</EmptyState>}
    </section>
    <section className="section-block"><div className="section-heading"><div><p className="eyebrow">TOOLKIT PEMAIN</p><h2>Materi untuk bertahan di dunia digital</h2></div><Link className="text-link" to="/materi">Semua materi <Icon name="chevron-right" size={17}/></Link></div>
      <div className="topic-grid">{materials.slice(0,4).map((m,i)=><Link className={`topic-card hub-topic topic-accent-${['yellow','pink','mint','sky'][i]}`} key={m.id} to={`/materi/${m.id}`}><div className="topic-card-top"><TopicMark topic={m.slug}/><span className="topic-number">0{i+1}</span></div><h3>{m.title}</h3><p>{m.summary}</p><span className="card-bottom">Buka materi <Icon name="chevron-right" size={17}/></span></Link>)}</div>
    </section>
    <section className="section-block history-block"><div className="section-heading"><div><p className="eyebrow">REKAM PERJALANAN</p><h2>Petualangan terakhirmu</h2></div><Link className="text-link" to="/peringkat">Papan peringkat <Icon name="chevron-right" size={17}/></Link></div>
      {recent.length?<div className="history-list">{recent.map((a)=><Link className="history-item" to={`/hasil/${a.id}`} key={a.id}><span className="history-status"><Icon name="check"/></span><span className="history-info"><strong>{a.scenario_title}</strong><small>{dateTime(a.completed_at)}</small></span><Score value={a.final_score} small/><Icon name="chevron-right" size={17}/></Link>)}</div>:<EmptyState title="Belum ada riwayat" to="/petualangan" action="Mulai petualangan">Selesaikan misi pertamamu untuk melihat skor dan evaluasi.</EmptyState>}
    </section>
  </div>;
}
