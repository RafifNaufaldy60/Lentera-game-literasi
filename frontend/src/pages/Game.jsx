import { Link, Navigate, useParams } from 'react-router';
import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../auth/AuthContext.js';
import { api } from '../lib/api.js';
import { useResource } from '../hooks/useResource.js';
import { ErrorState, Icon, LoadingState, Score, dateTime } from '../components/Icons.jsx';
import { SceneAvatar } from '../components/Avatar.jsx';
import { chatThemeClass } from '../components/ShopCosmetics.jsx';

const clueBook={
  email:[['Pengirim','Periksa alamat pengirim, bukan hanya nama yang terlihat.'],['Tautan','Bandingkan domain yang tampil dengan layanan resmi. Jangan kunjungi tautan latihan.'],['Tekanan','Waspadai tenggat palsu, ancaman, dan permintaan kode OTP.']],
  social:[['Unggahan','Perhatikan konteks asli dan apakah konten menyakiti seseorang.'],['Komentar','Jangan menambah hinaan atau menyebarkan konten bermasalah.'],['Bantuan','Pertimbangkan dukungan privat dan fitur laporan platform.']],
  privacy:[['Data terbuka','Cari tanda informasi pribadi atau lokasi yang terlalu mudah diidentifikasi.'],['Paparan','Jangan menyalin atau menyebarkan ulang data sensitif.'],['Pemulihan','Gunakan pengaturan privasi, laporan tertutup, dan bantuan tepercaya.']],
  market:[['Harga','Periksa apakah diskon masuk akal dibanding harga umum.'],['Reputasi','Ulasan tanpa verifikasi dan toko baru perlu pemeriksaan tambahan.'],['Pembayaran','Hindari transfer ke rekening pribadi di luar sistem platform.']],
  chat:[['Konteks','Baca pesan lengkap, termasuk apa yang diminta pembicara.'],['Keaslian','Periksa identitas tanpa mengikuti instruksi pihak mencurigakan.'],['Dampak','Bayangkan akibat keputusanmu bagi diri dan orang lain.']],
};
const modeLabel={email:'INBOX DETECTIVE',social:'SOCIAL QUEST',privacy:'PRIVACY INVESTIGATOR',market:'MARKETPLACE MISSION',chat:'STORY CHAT',system:'FINAL OUTCOME'};
function playNote(enabled,good=false){
  if(!enabled)return;
  try{
    const Audio=window.AudioContext||window.webkitAudioContext;
    if(!Audio)return;
    const context=new Audio(),osc=context.createOscillator(),gain=context.createGain();
    osc.type='sine';osc.frequency.value=good?660:490;gain.gain.value=.028;
    osc.connect(gain);gain.connect(context.destination);osc.start();
    gain.gain.exponentialRampToValueAtTime(.001,context.currentTime+.16);osc.stop(context.currentTime+.16);
    osc.onended=()=>context.close();
  }catch{ /* Audio is optional, gameplay still works when playback is unavailable. */ }
}
function EvidencePanel({mode,seen,onInspect,disabled}){
  const clues=clueBook[mode]||clueBook.chat;
  return <section className="case-evidence" aria-label="Panel petunjuk">
    <div className="evidence-title"><span><Icon name="search" size={17}/> PEMERIKSAAN BUKTI</span><small>{seen.size}/3 terbuka</small></div>
    <div className="evidence-buttons">{clues.map(([label,tip],i)=><button key={label} type="button" disabled={disabled} className={`evidence-button ${seen.has(i)?'inspected':''}`} onClick={()=>onInspect(i)} aria-expanded={seen.has(i)}>
      <span className="clue-index">0{i+1}</span><strong>{label}</strong><Icon name={seen.has(i)?'check':'search'} size={17}/>
      {seen.has(i)&&<small>{tip}</small>}</button>)}</div>
  </section>;
}
function StoryCase({mode,current,history}){
  const name=current?.speaker||'Ruang simulasi';
  const message=current?.message||'';
  if(mode==='email')return <section className="mini-app email-app"><div className="mini-app-toolbar"><span className="mini-app-brand">INBOX<span className="mini-brand-dot">.</span></span><span>Surat masuk · Latihan fiktif</span></div>
    <div className="email-subject">{current.title||'Informasi masuk'}<span className="email-risk">Perlu diperiksa</span></div>
    <div className="email-sender"><SceneAvatar name={current.meta?.avatar||'pixel'}/><span><strong>{name}</strong><small>notifikasi@latihan.invalid · alamat fiktif</small></span><span className="email-time">Sekarang</span></div>
    <div className="email-body"><p>{message}</p>{current.meta?.attachment&&<div className="fake-attachment"><Icon name="mail"/><span>{current.meta.attachment}</span><small>Lampiran simulasi · tidak bisa dibuka</small></div>}</div>
    <div className="email-safety"><Icon name="shield" size={15}/> Jangan buka tautan atau masukkan data asli.</div></section>;
  if(mode==='social')return <section className="mini-app social-app"><div className="mini-app-toolbar"><span className="mini-app-brand">SORA<span className="mini-brand-dot">.</span></span><span>Linimasa komunitas fiktif</span></div>
    <div className="social-profile"><SceneAvatar name={current.meta?.avatar||'spark'}/><span><strong>{name}</strong><small>Unggahan komunitas · sekarang</small></span><span>•••</span></div><div className="social-content"><p>{message}</p><div className="social-photo" aria-label="Ilustrasi unggahan digital"><span className="social-photo-shape">✳</span><span>#ThinkBeforeYouShare</span></div></div><div className="social-reactions"><span><Icon name="heart" size={17}/> Reaksi</span><span><Icon name="chat" size={17}/> Komentar</span><span><Icon name="shield" size={17}/> Laporkan</span></div>
    <div className="social-context">Komentar dan unggahan hanya dibuat untuk latihan.</div></section>;
  if(mode==='privacy')return <section className="mini-app privacy-app"><div className="mini-app-toolbar"><span className="mini-app-brand">CASE FILE 0{Math.min(history.length+1,9)}</span><span>Investigasi terbatas</span></div>
    <div className="privacy-case"><div className="privacy-stamp">DATA SENSITIF<br/><span>DISAMARKAN</span></div><p className="eyebrow">LAPORAN / {name}</p><h3>{current.title||'Temuan baru'}</h3><p>{message}</p>
    <div className="privacy-records"><div><Icon name="lock"/><span>Identitas korban</span><strong>DISEMBUNYIKAN</strong></div><div><Icon name="shield"/><span>Alamat & kontak</span><strong>DATA FIKTIF</strong></div></div></div></section>;
  if(mode==='market')return <section className="mini-app market-app"><div className="mini-app-toolbar"><span className="mini-app-brand">ETALASE<span className="mini-brand-dot">.</span></span><span>Simulasi belanja aman</span></div>
    <div className="market-product"><div className="product-illustration"><div className="console-device"><span/><span/></div><span className="product-sale">PROMO?</span></div><div className="product-data"><span className="eyebrow">PRODUK FIKTIF</span><h3>{current.title||'Penawaran spesial'}</h3><div className="market-badge">Periksa sebelum transaksi</div><p>{message}</p></div></div>
    <div className="market-check"><Icon name="info" size={16}/> Tidak ada pembelian atau pembayaran sungguhan.</div></section>;
  return <section className="mini-app chat-app"><div className="chat-scene-heading"><SceneAvatar name={current.meta?.avatar||'orbit'}/><div><strong>{name}</strong><span>Online · Simulasi percakapan</span></div><span className="chat-online-dot"/></div>
    <div className="chat-bubbles">{history.slice(-3).map((entry)=><div className="chat-turn" key={entry.sequence}><div className="bubble incoming"><small>{entry.speaker}</small>{entry.message}</div><div className="bubble outgoing">{entry.choiceLabel}</div></div>)}
      <div className="bubble incoming current-bubble" key={current.id}><small>{name}</small>{message}{current.meta?.attachment&&<div className="bubble-attachment">{current.meta.attachment}</div>}</div></div>
  </section>;
}
export function Game(){
  const {id}=useParams();const {csrfToken,refreshSession}=useAuth();
  const {data,loading,error,reload}=useResource(`/attempts/${id}`);
  const profile=useResource('/game/profile');
  const equipment=useResource('/shop/me');
  const [latest,setLatest]=useState(null),[busy,setBusy]=useState(false),[failure,setFailure]=useState('');
  const [seen,setSeen]=useState(new Set());
  const attempt=latest||data?.attempt;
  const current=attempt?.current;
  const mode=attempt?.scenario.playMode==='hybrid'?current?.scene_type:attempt?.scenario.playMode||'chat';
  const requiresInspection=current?.node_type!=='result'&&mode!=='chat'&&mode!=='system';
  const allowReply=!requiresInspection||seen.size>=2;
  const endRef=useRef(null);
  useEffect(()=>{document.title=attempt?`${attempt.scenario.title} | Bermain`:'Bermain | Lentera';},[attempt]);
  useEffect(()=>{setSeen(new Set());},[current?.id]);
  useEffect(()=>{endRef.current?.scrollIntoView?.({behavior:'auto',block:'nearest'});},[current?.id]);
  async function choose(choiceId){
    if(busy||!allowReply)return;
    setBusy(true);setFailure('');
    playNote(profile.data?.profile?.settings?.sound_enabled);
    try{const updated=await api(`/attempts/${id}/choices`,{method:'POST',body:{choiceId},csrfToken});setLatest(updated.attempt);
      if(updated.attempt.status==='completed')playNote(profile.data?.profile?.settings?.sound_enabled,true);
    }catch(err){setFailure(err.message);if(err.code==='CSRF_EXPIRED')await refreshSession({silent:true});if(err.status===409)reload();}
    finally{setBusy(false);}
  }
  if(loading&&!latest)return <LoadingState label="Membuka misi…"/>;
  if(error&&!latest)return <ErrorState error={error} retry={reload}/>;
  if(!attempt)return <ErrorState error="Percobaan tidak tersedia."/>;
  const isCompleted=attempt.status==='completed';
  return <div className={`app-page game-page mission-mode mission-${mode} ${chatThemeClass(equipment.data?.equipment?.chat)}`}>
    <nav className="game-top"><Link to="/petualangan" className="back-link"><Icon name="arrow-left" size={17}/> Peta misi</Link><span className="game-top-safety"><Icon name="shield" size={15}/> Cerita fiktif · Data asli tidak digunakan</span></nav>
    <header className="game-masthead"><div><p className="eyebrow">{modeLabel[mode]||'STORY MISSION'} / CHAPTER {String(attempt.scenario.chapter||1).padStart(2,'0')}</p><h1>{attempt.scenario.title}</h1><p>{attempt.scenario.description}</p></div><div className="mission-progress"><strong>{attempt.history.length}<small> keputusan</small></strong><span>Jawaban tersimpan otomatis</span></div></header>
    <div className="mission-layout"><div className="mission-main"><StoryCase mode={mode} current={current} history={attempt.history}/><div ref={endRef}/>
      {!isCompleted&&<EvidencePanel mode={mode} seen={seen} disabled={busy} onInspect={(i)=>setSeen((prev)=>new Set([...prev,i]))}/>}</div>
      <aside className="decision-panel"><div className="decision-header"><span className="decision-count">{String(attempt.history.length+1).padStart(2,'0')}</span><div><p className="eyebrow">GILIRANMU</p><h2>{isCompleted?'Cerita selesai!':'Apa keputusanmu?'}</h2></div></div>
        {failure&&<p className="notice error" role="alert">{failure}</p>}
        {isCompleted?<><p className="decision-help">Semua keputusan telah dicatat. Saatnya melihat konsekuensi dan evaluasi belajarmu.</p><Link className="button primary reply-finish" to={`/hasil/${id}`}><Icon name="trophy"/>Lihat hasil misi</Link></>:
          <><p className="decision-help">{requiresInspection&&!allowReply?'Periksa minimal dua petunjuk untuk membuka pilihan.':'Pilih langkah yang menurutmu paling aman. Tiap keputusan mengubah nilai dan jalur cerita.'}</p>
          <div className="decision-options">{current.options.map((choice,index)=><button className="decision-button" key={choice.id} type="button" disabled={busy||!allowReply} onClick={()=>choose(choice.id)}>
            <span>{String.fromCharCode(65+index)}</span><strong>{choice.label}</strong><Icon name="chevron-right" size={18}/></button>)}</div>
          {busy&&<div className="typing-feedback" role="status"><span className="typing-dots"><i/><i/><i/></span> Cerita berlanjut…</div>}</>}
        <div className="decision-history"><h3><Icon name="layers" size={16}/> Riwayat keputusan</h3>
          {attempt.history.length?attempt.history.map((entry)=><details key={entry.sequence}><summary>{String(entry.sequence).padStart(2,'0')} · {entry.choiceLabel} <span>+{entry.points}</span></summary><p>{entry.evaluation}</p></details>):<p>Keputusan pertama belum dibuat.</p>}</div>
        <p className="phone-disclaimer"><Icon name="info" size={14}/> Tidak ada data atau transaksi nyata.</p>
      </aside></div>
  </div>;
}
const outcomeInfo={
  safe:{title:'Langkah yang lebih aman!',message:'Keputusan akhir mengutamakan keamanan. Tinjau juga tindakan sebelumnya agar memahami seluruh dampaknya.',icon:'shield'},
  recovered:{title:'Kamu berhasil memperbaiki arah!',message:'Kamu melakukan tindakan korektif. Ada hal yang bisa diperbaiki lebih dini pada percobaan berikutnya.',icon:'check'},
  risky:{title:'Ada pelajaran penting di sini',message:'Situasi ini menunjukkan risiko dari beberapa pilihan. Baca catatannya dan temukan cara yang lebih aman.',icon:'alert'},
};
export function Result(){
  const {id}=useParams();const {data,loading,error,reload}=useResource(`/attempts/${id}`);
  const profile=useResource('/game/profile');
  const wallet=useResource('/shop/me');
  useEffect(()=>{document.title='Hasil misi | Lentera';},[]);
  if(loading)return <LoadingState label="Menyiapkan evaluasi misi…"/>;
  if(error)return <ErrorState error={error} retry={reload}/>;
  const attempt=data.attempt;
  if(attempt.status!=='completed')return <Navigate to={`/bermain/${id}`} replace/>;
  const outcome=outcomeInfo[attempt.current.outcome]||outcomeInfo.risky;
  const p=profile.data?.profile;
  return <div className="app-page result-page arcade-result"><Link className="back-link" to="/petualangan"><Icon name="arrow-left" size={16}/> Peta misi</Link>
    <div className={`result-hero result-${attempt.current.outcome}`}><div className="result-copy"><p className="eyebrow">MISSION COMPLETE / CHAPTER {String(attempt.scenario.chapter||1).padStart(2,'0')}</p><span className="result-status"><Icon name={outcome.icon} size={18}/>{outcome.title}</span><h1>{attempt.scenario.title}</h1><p>{outcome.message}</p><div className="result-metadata">{attempt.history.length} keputusan · {dateTime(attempt.completedAt)}</div></div>
      <div className="score-disc"><span>SKOR AKHIR</span><Score value={attempt.finalScore}/><small>Nilai dihitung di server</small></div></div>
    <div className="result-layout"><section><div className="section-heading"><div><p className="eyebrow">MISI DIULAS</p><h2>Evaluasi keputusanmu</h2><p>Setiap catatan membantu kamu mengenali tanda bahaya.</p></div></div><div className="evaluation-list">{attempt.history.map((entry,i)=><article className="evaluation-item" key={entry.sequence}><span className="evaluation-number">{String(i+1).padStart(2,'0')}</span><div><p className="eyebrow">PILIHANMU</p><h3>{entry.choiceLabel}</h3><p>{entry.evaluation}</p><span className="evaluation-points">+{entry.points} poin</span></div></article>)}</div></section>
      <aside className="result-sidebar"><p className="eyebrow">AKHIR CERITA</p><h2>{attempt.current.title}</h2><p>{attempt.current.message}</p>
        {p&&<div className="result-xp"><span><Icon name="star" size={21}/> PROGRES PEMAIN</span><strong>Level {p.level}</strong><small>{p.xp} XP total dari skor terbaik tiap skenario</small></div>}
        <div className="result-coin-reward"><span className="coin-mini">C</span><div><strong>{wallet.data?`${Number(wallet.data.balance).toLocaleString('id-ID')} Cyber Coins`:'Cyber Coins'}</strong><small>Hadiah hanya bertambah saat skor terbaik untuk misi ini naik.</small></div><Link to="/toko">Cyber Shop</Link></div>
        <div className="result-actions"><Link className="button primary" to="/petualangan"><Icon name="play" size={17}/> Pilih misi selanjutnya</Link><Link className="button secondary" to={`/simulasi/${attempt.scenario.id}`}><Icon name="layers" size={17}/> Main lagi</Link><Link className="text-link" to="/profil">Lihat badge dan level</Link></div></aside>
    </div>
  </div>;
}
