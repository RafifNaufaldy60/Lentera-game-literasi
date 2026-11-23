import { Link, useParams, useNavigate } from 'react-router';
import { useEffect, useState } from 'react';
import { useAuth } from '../auth/AuthContext.js';
import { api } from '../lib/api.js';
import { useResource } from '../hooks/useResource.js';
import { EmptyState, ErrorState, Icon, LoadingState, PageHeading, TopicMark } from '../components/Icons.jsx';

export function Scenarios() {
  const { data, loading, error, reload } = useResource('/scenarios');
  useEffect(() => { document.title = 'Simulasi interaktif | Lentera'; }, []);
  if (loading) return <LoadingState />;
  if (error) return <ErrorState error={error} retry={reload} />;
  return <div className="app-page"><PageHeading eyebrow="SIMULASI INTERAKTIF" title="Pilih tantangan, ubah jalan cerita">Jelajahi inbox, media sosial, investigasi privasi, hingga marketplace fiktif. Semua keputusan memiliki konsekuensi.</PageHeading>
    {data.scenarios.length ? <div className="scenario-grid">{data.scenarios.map((s, i) => <Link className="scenario-card" key={s.id} to={`/simulasi/${s.id}`}><div className="scenario-card-top"><TopicMark topic={`${s.slug} ${s.material_title}`} /><span>CHAPTER {String(s.chapter_number||i+1).padStart(2, '0')}</span></div><h2>{s.title}</h2><p>{s.description}</p><div className="scenario-card-footer"><span>{s.play_mode === 'hybrid' ? 'Final mission' : s.play_mode} · {s.estimated_minutes||5} menit</span><span className="circle-arrow"><Icon name="chevron-right" /></span></div></Link>)}</div> : <EmptyState title="Simulasi belum tersedia">Admin dapat menambahkan skenario dan menerbitkannya.</EmptyState>}
  </div>;
}

export function ScenarioIntro() {
  const { id } = useParams();
  const { data, loading, error, reload } = useResource('/scenarios');
  const { csrfToken, refreshSession } = useAuth();
  const [pending, setPending] = useState(false);
  const [failure, setFailure] = useState('');
  const navigate = useNavigate();
  const scenario = data?.scenarios.find((item) => item.id === id);
  useEffect(() => { document.title = scenario ? `${scenario.title} | Lentera` : 'Simulasi | Lentera'; }, [scenario]);
  async function start() {
    setPending(true); setFailure('');
    try {
      const result = await api(`/scenarios/${id}/attempts`, { method: 'POST', body: {}, csrfToken });
      navigate(`/bermain/${result.attemptId}`);
    } catch (err) { setFailure(err.message); if (err.code === 'CSRF_EXPIRED') await refreshSession({ silent: true }); }
    finally { setPending(false); }
  }
  if (loading) return <LoadingState />;
  if (error) return <ErrorState error={error} retry={reload} />;
  if (!scenario) return <ErrorState error="Simulasi tidak ditemukan atau belum diterbitkan." />;
  return <div className="app-page intro-page"><Link to="/simulasi" className="back-link"><Icon name="arrow-left" size={16} /> Semua simulasi</Link>
    <div className="intro-layout"><div><p className="eyebrow">MISSION BRIEF / CHAPTER {String(scenario.chapter_number||1).padStart(2,'0')}</p><h1>{scenario.title}</h1><p className="intro-lead">{scenario.description}</p><div className="intro-rules"><h2>Sebelum mulai</h2><div><Icon name="chat" /><p>Periksa bukti dan petunjuk sebelum menentukan tindakanmu.</p></div><div><Icon name="layers" /><p>Setiap respons mengubah kelanjutan cerita dan poin yang kamu peroleh.</p></div><div><Icon name="shield" /><p>Semua pesan hanya fiktif. Tidak ada tautan yang harus dibuka atau data yang perlu diberikan.</p></div></div>
      {failure && <p className="notice error" role="alert">{failure}</p>}
      <button className="button primary button-large" disabled={pending} onClick={start}><Icon name="play" size={18} /> {pending ? 'Menyiapkan percakapan…' : 'Mulai misi'}</button></div>
      <div className="intro-phone-panel" aria-hidden="true"><img src="/illustrations/hero-quest.svg" alt="" /><span>Kasus fiktif · {scenario.play_mode} · {scenario.estimated_minutes||5} menit</span></div></div>
  </div>;
}
