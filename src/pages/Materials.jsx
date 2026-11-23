import { Link, useParams } from 'react-router';
import { useEffect } from 'react';
import { useResource } from '../hooks/useResource.js';
import { EmptyState, ErrorState, Icon, LoadingState, PageHeading, TopicMark } from '../components/Icons.jsx';

export function Materials() {
  const { data, loading, error, reload } = useResource('/catalog');
  useEffect(() => { document.title = 'Perpustakaan materi | Lentera'; }, []);
  if (loading) return <LoadingState />;
  if (error) return <ErrorState error={error} retry={reload} />;
  return <div className="app-page"><PageHeading eyebrow="PERPUSTAKAAN BELAJAR" title="Materi literasi digital">Baca pelan-pelan, pahami tanda bahayanya, lalu praktikkan melalui cerita bercabang.</PageHeading>
    {data.materials.length ? <div className="lesson-list">{data.materials.map((m, i) => <Link className="lesson-row" key={m.id} to={`/materi/${m.id}`}><div className="lesson-row-media"><TopicMark topic={m.slug} size="large" /></div><div className="lesson-row-copy"><p className="eyebrow">BAB {String(i + 1).padStart(2, '0')}</p><h2>{m.title}</h2><p>{m.summary}</p><span>{m.scenario_count ? `${m.scenario_count} simulasi untuk dipraktikkan` : 'Bacaan singkat'}</span></div><Icon name="chevron-right" /></Link>)}</div> : <EmptyState title="Materi belum tersedia">Materi yang diterbitkan admin akan muncul di sini.</EmptyState>}
  </div>;
}

export function MaterialDetail() {
  const { id } = useParams();
  const { data, loading, error, reload } = useResource(`/materials/${id}`);
  useEffect(() => { document.title = data?.material ? `${data.material.title} | Lentera` : 'Baca materi | Lentera'; }, [data]);
  if (loading) return <LoadingState />;
  if (error) return <ErrorState error={error} retry={reload} />;
  const { material, scenarios } = data;
  return <div className="app-page article-page"><Link to="/materi" className="back-link"><Icon name="arrow-left" size={16} /> Kembali ke materi</Link>
    <div className="article-heading"><TopicMark topic={material.slug} size="large" /><p className="eyebrow">BAHAN BELAJAR / LITERASI DIGITAL</p><h1>{material.title}</h1><p>{material.summary}</p></div>
    <div className="article-layout"><article className="article-paper">{material.content.split(/\n\s*\n/).filter(Boolean).map((paragraph, index) => <p key={index}>{paragraph}</p>)}<div className="article-end"><Icon name="check" /> Kamu sudah sampai di akhir bacaan. Coba terapkan dalam situasi nyata melalui simulasi.</div></article>
    <aside className="article-aside"><div className="aside-sticky"><p className="eyebrow">LANJUTKAN BELAJAR</p><h2>Siap menguji keputusanmu?</h2><p>Setiap pilihan mengubah arah cerita. Hasil dan catatan keputusanmu bisa dilihat setelah selesai.</p>{scenarios.map((s) => <Link key={s.id} className="practice-link" to={`/simulasi/${s.id}`}><Icon name="chat" /><span>{s.title}<small>Mulai simulasi</small></span><Icon name="chevron-right" size={17} /></Link>)}{!scenarios.length && <p className="muted">Belum ada simulasi diterbitkan untuk materi ini.</p>}</div></aside></div>
  </div>;
}
