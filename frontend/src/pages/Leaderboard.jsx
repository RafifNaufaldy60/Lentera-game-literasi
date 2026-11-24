import { Link } from 'react-router';
import { useEffect } from 'react';
import { useAuth } from '../auth/AuthContext.js';
import { useResource } from '../hooks/useResource.js';
import { EmptyState, ErrorState, Icon, LoadingState, PageHeading, Score } from '../components/Icons.jsx';

export default function Leaderboard() {
  const { user } = useAuth();
  const { data, loading, error, reload } = useResource('/leaderboard');
  useEffect(() => { document.title = 'Peringkat peserta | Lentera'; }, []);
  if (loading) return <LoadingState />;
  if (error) return <ErrorState error={error} retry={reload} />;
  const rank = data.ranking.findIndex((entry) => entry.user_id === user.id);
  return <div className="app-page leaderboard-page"><PageHeading eyebrow="HASIL BELAJAR" title="Papan peringkat">Peringkat diurutkan berdasarkan skor tertinggi dari latihan yang sudah diselesaikan. Email peserta tidak ditampilkan.</PageHeading>
    <div className="leaderboard-layout"><div className="leaderboard-main"><div className="ranking-header"><span>PERINGKAT / PESERTA</span><span>SKOR TERBAIK</span></div>
      {data.ranking.length ? <ol className="ranking-list">{data.ranking.map((row, i) => <li key={row.user_id} className={row.user_id === user.id ? 'ranking-me' : ''}><span className="rank-number">{String(i + 1).padStart(2, '0')}</span><span className="ranking-avatar">{row.name.charAt(0).toUpperCase()}</span><span className="ranking-info"><strong>{row.name}{row.user_id === user.id && <em> (Kamu)</em>}</strong><small>{row.total_completed} latihan selesai</small></span><Score value={row.best_score} small /></li>)}</ol> : <EmptyState icon="trophy" title="Belum ada peserta di peringkat" to="/simulasi" action="Mulai latihan">Selesaikan sebuah simulasi untuk mendapatkan skor pertama.</EmptyState>}</div>
      <aside className="rank-sidebar"><div className="rank-sidebar-heading"><Icon name="trophy" size={24} /><h2>Hasil belajarmu</h2></div><div><span>Posisimu saat ini</span><strong>{rank < 0 ? '—' : `#${rank + 1}`}</strong></div><div><span>Skor terbaik</span><strong>{data.summary.best_score}<small>/100</small></strong></div><div><span>Latihan selesai</span><strong>{data.summary.completed}</strong></div><p>Peringkat bukan satu-satunya ukuran. Fokuslah pada alasan di balik setiap keputusanmu.</p><Link to="/simulasi" className="button primary">Latihan lagi <Icon name="chevron-right" size={17} /></Link></aside></div>
  </div>;
}
