import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { useResource } from '../hooks/useResource.js';
import { useAuth } from '../auth/AuthContext.js';
import { api } from '../lib/api.js';
import { EmptyState, ErrorState, Icon, LoadingState, PageHeading, TopicMark, dateTime } from '../components/Icons.jsx';

function useOverview() { return useResource('/admin/overview'); }
function AdminGuard({ resource, children }) {
  if (resource.loading) return <LoadingState />;
  if (resource.error) return <ErrorState error={resource.error} retry={resource.reload} />;
  return children(resource.data);
}
function AdminIntro({ eyebrow, title, children, action }) {
  return <PageHeading eyebrow={eyebrow} title={title} action={action}>{children}</PageHeading>;
}

export function AdminDashboard() {
  const resource = useOverview();
  const { user } = useAuth();
  useEffect(() => { document.title = 'Dashboard admin | Lentera'; }, []);
  return <AdminGuard resource={resource}>{({ stats, attempts, materials, scenarios }) => <div className="app-page"><AdminIntro eyebrow="PANEL PENGELOLA" title="Dashboard admin">Selamat datang, {user.name}. Pantau aktivitas belajar dan kelola konten yang dilihat peserta.</AdminIntro>
    <div className="admin-stats"><div><Icon name="users" /><span>Peserta aktif</span><strong>{stats.users}</strong></div><div><Icon name="book" /><span>Total materi</span><strong>{stats.materials}</strong></div><div><Icon name="chat" /><span>Simulasi dibuat</span><strong>{stats.scenarios}</strong></div><div><Icon name="trophy" /><span>Latihan selesai</span><strong>{stats.completed}</strong></div></div>
    <section className="section-block"><div className="section-heading"><div><p className="eyebrow">KELOLA KONTEN</p><h2>Ruang pengelolaan</h2></div></div><div className="admin-quick-links"><Link to="/admin/materi"><span className="quick-icon"><Icon name="book" size={25} /></span><strong>Materi pembelajaran</strong><p>{materials.filter((m) => m.is_published).length} dari {materials.length} materi diterbitkan</p><span className="text-link">Kelola materi <Icon name="chevron-right" size={16} /></span></Link><Link to="/admin/simulasi"><span className="quick-icon"><Icon name="chat" size={25} /></span><strong>Cerita interaktif</strong><p>{scenarios.filter((s) => s.is_published).length} dari {scenarios.length} simulasi diterbitkan</p><span className="text-link">Kelola simulasi <Icon name="chevron-right" size={16} /></span></Link><Link to="/admin/nilai"><span className="quick-icon"><Icon name="chart" size={25} /></span><strong>Nilai peserta</strong><p>Riwayat percobaan dan hasil dari seluruh peserta</p><span className="text-link">Lihat nilai <Icon name="chevron-right" size={16} /></span></Link></div><Link className="button secondary" to="/admin/editor" style={{marginTop:24}}><Icon name="layers" size={18}/> Buka Visual Story Builder</Link></section>
    <section className="section-block"><div className="section-heading"><div><p className="eyebrow">AKTIVITAS TERBARU</p><h2>Percobaan peserta</h2></div><Link to="/admin/nilai" className="text-link">Lihat semua <Icon name="chevron-right" size={16} /></Link></div>{attempts.length ? <div className="history-list">{attempts.slice(0, 5).map((a) => <div className="history-item" key={a.id}><span className="history-status"><Icon name="chat" /></span><span className="history-info"><strong>{a.user_name} · {a.scenario_title}</strong><small>{dateTime(a.started_at)}</small></span><span className={`state-label ${a.status === 'completed' ? 'state-live' : ''}`}>{a.status === 'completed' ? `${a.final_score}/100` : 'Berjalan'}</span></div>)}</div> : <EmptyState title="Belum ada aktivitas">Riwayat percobaan peserta akan muncul di sini.</EmptyState>}</section>
  </div>}</AdminGuard>;
}

const initialMaterial = { slug: '', title: '', summary: '', content: '', isPublished: false };
const toDraft = (m) => m ? { slug: m.slug, title: m.title, summary: m.summary, content: m.content, isPublished: m.is_published } : { ...initialMaterial };
const toSlug = (text) => text.toLowerCase().normalize('NFKD').replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-').replace(/-+/g, '-');

export function AdminMaterials() {
  const resource = useOverview();
  const { csrfToken, refreshSession } = useAuth();
  const [editing, setEditing] = useState(null);
  const [draft, setDraft] = useState(initialMaterial);
  const [formOpen, setFormOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState('');
  const [failure, setFailure] = useState('');
  useEffect(() => { document.title = 'Kelola materi | Lentera'; }, []);
  function openForm(material = null) {
    setEditing(material?.id ?? null); setDraft(toDraft(material)); setFailure(''); setNotice(''); setFormOpen(true);
    window.scrollTo?.({ top: 0, behavior: 'smooth' });
  }
  async function save(e) {
    e.preventDefault(); setSaving(true); setFailure(''); setNotice('');
    const path = editing ? `/admin/materials/${editing}` : '/admin/materials';
    try {
      await api(path, { method: editing ? 'PATCH' : 'POST', body: draft, csrfToken });
      setNotice(editing ? 'Perubahan materi tersimpan.' : 'Materi baru berhasil ditambahkan.');
      setFormOpen(false); resource.reload();
    } catch (err) { setFailure(err.message); if (err.code === 'CSRF_EXPIRED') await refreshSession({ silent: true }); }
    finally { setSaving(false); }
  }
  return <AdminGuard resource={resource}>{({ materials }) => <div className="app-page"><AdminIntro eyebrow="PENGELOLAAN / MATERI" title="Kelola materi" action={<button className="button primary" onClick={() => openForm()}><Icon name="plus" size={17} /> Tambah materi</button>}>Tulis konten dengan bahasa yang jelas. Materi baru bisa disimpan sebagai draf sebelum diterbitkan.</AdminIntro>
    {notice && <p className="notice success" role="status">{notice}</p>}
    {formOpen && <section className="admin-form-panel"><div className="panel-heading"><div><p className="eyebrow">EDITOR MATERI</p><h2>{editing ? 'Ubah materi' : 'Buat materi baru'}</h2></div><button className="text-button" onClick={() => setFormOpen(false)}>Tutup</button></div>
      <form onSubmit={save} className="editor-form"><div className="field"><label htmlFor="material-title">Judul materi</label><input id="material-title" required minLength={4} maxLength={140} value={draft.title} onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value, slug: editing ? d.slug : toSlug(e.target.value) }))} /></div><div className="field"><label htmlFor="material-slug">Slug URL (huruf kecil, angka, tanda hubung)</label><input id="material-slug" required pattern="[a-z0-9]+(-[a-z0-9]+)*" minLength={3} maxLength={100} value={draft.slug} onChange={(e) => setDraft((d) => ({ ...d, slug: e.target.value }))} /></div><div className="field"><label htmlFor="material-summary">Ringkasan materi</label><textarea id="material-summary" rows={3} minLength={10} maxLength={320} required value={draft.summary} onChange={(e) => setDraft((d) => ({ ...d, summary: e.target.value }))} /></div><div className="field"><label htmlFor="material-content">Isi materi</label><textarea id="material-content" rows={11} minLength={30} maxLength={20000} required value={draft.content} onChange={(e) => setDraft((d) => ({ ...d, content: e.target.value }))} /><p className="field-help">Pisahkan paragraf dengan satu baris kosong. Materi akan ditampilkan sebagai bacaan.</p></div><label className="check-row"><input type="checkbox" checked={draft.isPublished} onChange={(e) => setDraft((d) => ({ ...d, isPublished: e.target.checked }))} /> Terbitkan sekarang agar terlihat oleh peserta</label>
      {failure && <p className="notice error" role="alert">{failure}</p>}
      <div className="form-actions"><button disabled={saving} className="button primary" type="submit">{saving ? 'Menyimpan…' : 'Simpan materi'}</button><button className="button secondary" type="button" onClick={() => setFormOpen(false)}>Batal</button></div></form></section>}
    <div className="admin-list">{materials.length ? materials.map((m) => <article className="admin-list-item" key={m.id}><TopicMark topic={m.slug} /><div><div className="admin-item-top"><h2>{m.title}</h2><span className={`state-label ${m.is_published ? 'state-live' : ''}`}>{m.is_published ? 'Terbit' : 'Draf'}</span></div><p>{m.summary}</p><small>{m.scenario_count} simulasi · {dateTime(m.created_at)}</small></div><button type="button" className="button secondary" onClick={() => openForm(m)}><Icon name="edit" size={17} /> Edit</button></article>) : <EmptyState title="Belum ada materi">Buat materi pertama untuk memulai perpustakaan belajar.</EmptyState>}</div>
  </div>}</AdminGuard>;
}

const initialScenario = { materialId: '', title: '', slug: '', description: '', speaker: 'Pesan masuk', opening: '', safeLabel: '', safeMessage: '', safeEvaluation: '', riskyLabel: '', riskyMessage: '', riskyEvaluation: '' };
function scenarioGraph(d) {
  return { entryNodeId: 'awal', nodes: [
    { id: 'awal', title: 'Pesan awal', speaker: d.speaker, message: d.opening, node_type: 'message', outcome: null },
    { id: 'aman', title: 'Pilihan yang aman', speaker: 'Evaluasi latihan', message: d.safeMessage, node_type: 'result', outcome: 'safe' },
    { id: 'berisiko', title: 'Pilihan yang berisiko', speaker: 'Evaluasi latihan', message: d.riskyMessage, node_type: 'result', outcome: 'risky' },
  ], choices: [
    { id: 'pilihan_aman', node_id: 'awal', next_node_id: 'aman', position: 1, label: d.safeLabel, points: 100, evaluation: d.safeEvaluation },
    { id: 'pilihan_risiko', node_id: 'awal', next_node_id: 'berisiko', position: 2, label: d.riskyLabel, points: 0, evaluation: d.riskyEvaluation },
  ] };
}
export function AdminScenarios() {
  const resource = useOverview();
  const { csrfToken, refreshSession } = useAuth();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(initialScenario);
  const [saving, setSaving] = useState(false);
  const [failure, setFailure] = useState('');
  const [notice, setNotice] = useState('');
  useEffect(() => { document.title = 'Kelola simulasi | Lentera'; }, []);
  function update(key, value) { setDraft((d) => ({ ...d, [key]: value, ...(key === 'title' ? { slug: toSlug(value) } : {}) })); }
  async function save(e) {
    e.preventDefault(); setFailure(''); setNotice(''); setSaving(true);
    try {
      await api('/admin/scenarios', { method: 'POST', csrfToken,
        body: { materialId: draft.materialId, title: draft.title, slug: draft.slug, description: draft.description, graph: scenarioGraph(draft) } });
      setOpen(false); setDraft(initialScenario); setNotice('Simulasi disimpan sebagai draf. Terbitkan dari daftar di bawah.'); resource.reload();
    } catch (err) { setFailure(err.message); if (err.code === 'CSRF_EXPIRED') await refreshSession({ silent: true }); }
    finally { setSaving(false); }
  }
  async function toggle(item) {
    setFailure(''); setNotice('');
    try { await api(`/admin/scenarios/${item.id}`, { method: 'PATCH', csrfToken, body: { isPublished: !item.is_published } }); setNotice('Status simulasi diperbarui.'); resource.reload(); }
    catch (err) { setFailure(err.message); if (err.code === 'CSRF_EXPIRED') await refreshSession({ silent: true }); }
  }
  return <AdminGuard resource={resource}>{({ scenarios, materials }) => <div className="app-page"><AdminIntro eyebrow="PENGELOLAAN / SIMULASI" title="Kelola simulasi" action={<div className="admin-heading-actions"><Link className="button primary" to="/admin/editor"><Icon name="layers" size={17}/> Story Builder</Link><button className="button secondary" onClick={() => { setOpen(true); setFailure(''); }}><Icon name="plus" size={17}/> Buat cepat</button></div>}>Buat cerita bercabang dengan Visual Story Builder atau gunakan editor cepat untuk latihan singkat. Setiap konten baru disimpan sebagai draf.</AdminIntro>
    {notice && <p className="notice success" role="status">{notice}</p>}{failure && !open && <p className="notice error" role="alert">{failure}</p>}
    {open && <section className="admin-form-panel"><div className="panel-heading"><div><p className="eyebrow">EDITOR SKENARIO</p><h2>Simulasi percakapan baru</h2></div><button className="text-button" onClick={() => setOpen(false)}>Tutup</button></div><p className="editor-help">Editor singkat ini membuat satu pesan awal dan dua cabang akhir. Setiap pilihan memuat evaluasi dan poin (100 untuk aman, 0 untuk berisiko).</p><form className="editor-form" onSubmit={save}>
      <div className="field"><label htmlFor="sim-material">Materi terkait</label><select id="sim-material" required value={draft.materialId} onChange={(e) => update('materialId', e.target.value)}><option value="">Pilih materi</option>{materials.map((m) => <option key={m.id} value={m.id}>{m.title}</option>)}</select></div>
      <div className="form-two"><div className="field"><label htmlFor="sim-title">Judul cerita</label><input required id="sim-title" minLength={5} maxLength={140} value={draft.title} onChange={(e) => update('title', e.target.value)} /></div><div className="field"><label htmlFor="sim-slug">Slug</label><input required id="sim-slug" minLength={3} maxLength={100} pattern="[a-z0-9]+(-[a-z0-9]+)*" value={draft.slug} onChange={(e) => update('slug', e.target.value)} /></div></div>
      <div className="field"><label htmlFor="sim-desc">Deskripsi cerita</label><textarea required id="sim-desc" minLength={10} maxLength={1000} rows={2} value={draft.description} onChange={(e) => update('description', e.target.value)} /></div>
      <h3>01 / Percakapan dimulai</h3><div className="field"><label htmlFor="sim-speaker">Nama pengirim pesan</label><input required id="sim-speaker" minLength={2} maxLength={100} value={draft.speaker} onChange={(e) => update('speaker', e.target.value)} /></div><div className="field"><label htmlFor="sim-opening">Isi pesan yang diterima pemain</label><textarea required id="sim-opening" minLength={10} maxLength={3000} rows={3} value={draft.opening} onChange={(e) => update('opening', e.target.value)} /></div>
      <h3>02 / Cabang aman (100 poin)</h3>{[['safeLabel', 'Teks pilihan aman', 220], ['safeMessage', 'Akhir cerita yang aman', 3000], ['safeEvaluation', 'Alasan pilihan ini tepat', 1000]].map(([key, label, max]) => <div className="field" key={key}><label htmlFor={key}>{label}</label><textarea required id={key} minLength={key === 'safeLabel' ? 3 : 10} maxLength={max} rows={key === 'safeLabel' ? 2 : 3} value={draft[key]} onChange={(e) => update(key, e.target.value)} /></div>)}
      <h3>03 / Cabang berisiko (0 poin)</h3>{[['riskyLabel', 'Teks pilihan berisiko', 220], ['riskyMessage', 'Akhir cerita yang berisiko', 3000], ['riskyEvaluation', 'Mengapa pilihan ini berisiko', 1000]].map(([key, label, max]) => <div className="field" key={key}><label htmlFor={key}>{label}</label><textarea required id={key} minLength={key === 'riskyLabel' ? 3 : 10} maxLength={max} rows={key === 'riskyLabel' ? 2 : 3} value={draft[key]} onChange={(e) => update(key, e.target.value)} /></div>)}
      {failure && <p className="notice error" role="alert">{failure}</p>}<div className="form-actions"><button type="submit" className="button primary" disabled={saving}>{saving ? 'Menyimpan…' : 'Simpan draf simulasi'}</button><button type="button" className="button secondary" onClick={() => setOpen(false)}>Batal</button></div></form></section>}
    <div className="admin-list">{scenarios.length ? scenarios.map((s) => <article className="admin-list-item" key={s.id}><TopicMark topic={s.slug} /><div><div className="admin-item-top"><h2>{s.title}</h2><span className={`state-label ${s.is_published ? 'state-live' : ''}`}>{s.is_published ? 'Terbit' : 'Draf'}</span></div><p>{s.description}</p><small>Materi: {s.material_title} · Chapter {s.chapter_number} · {s.play_mode}</small></div><div className="admin-item-actions"><Link to={`/admin/editor/${s.id}`} className="button secondary"><Icon name="edit" size={16}/> Buka graf</Link><button type="button" className="button secondary" onClick={() => toggle(s)}>{s.is_published ? 'Tarik terbit' : 'Terbitkan'}</button></div></article>) : <EmptyState icon="chat" title="Belum ada simulasi">Buat percakapan pertama untuk mendampingi materi.</EmptyState>}</div>
  </div>}</AdminGuard>;
}

export function AdminScores() {
  const [filter, setFilter] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const resource = useResource(`/admin/attempts?page=${page}&search=${encodeURIComponent(search)}`);
  useEffect(() => { document.title = 'Nilai peserta | Lentera'; }, []);
  function applySearch(e) { e.preventDefault(); setPage(1); setSearch(filter.trim()); }
  return <AdminGuard resource={resource}>{({ attempts, total, participants, totalPages }) =>
    <div className="app-page"><AdminIntro eyebrow="PENGELOLAAN / PESERTA" title="Nilai seluruh peserta">Lihat seluruh hasil latihan secara bertahap, termasuk percobaan yang belum selesai. Data email hanya terlihat oleh admin.</AdminIntro>
      <div className="table-toolbar"><div><strong>{total} percobaan</strong><span> · {participants} peserta</span></div>
        <form className="admin-search-form" onSubmit={applySearch}><label className="sr-only" htmlFor="admin-search">Cari peserta atau simulasi</label><input id="admin-search" type="search" value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Cari nama, email, atau simulasi" /><button type="submit" className="button secondary">Cari</button></form></div>
      {attempts.length ? <div className="table-scroll"><table className="data-table"><thead><tr><th>Peserta</th><th>Simulasi</th><th>Tanggal</th><th>Status</th><th>Nilai</th></tr></thead><tbody>{attempts.map((a) => <tr key={a.id}><td><strong>{a.user_name}</strong><small>{a.user_email}</small></td><td>{a.scenario_title}</td><td>{dateTime(a.started_at)}</td><td><span className={`state-label ${a.status === 'completed' ? 'state-live' : ''}`}>{a.status === 'completed' ? 'Selesai' : 'Berjalan'}</span></td><td><strong>{a.final_score ?? '—'}</strong></td></tr>)}</tbody></table></div> : <EmptyState icon="chart" title={search ? 'Tidak ada hasil pencarian' : 'Belum ada percobaan'}>Coba kata pencarian lain atau tunggu peserta menyelesaikan latihan.</EmptyState>}
      <div className="pagination"><p>Halaman {page} dari {totalPages} · Menampilkan maksimum 20 data per halaman.</p><div><button type="button" className="button secondary" disabled={page === 1} onClick={() => setPage((n) => Math.max(1, n - 1))}>Sebelumnya</button><button type="button" className="button secondary" disabled={page >= totalPages} onClick={() => setPage((n) => n + 1)}>Berikutnya</button></div></div>
    </div>
  }</AdminGuard>;
}
