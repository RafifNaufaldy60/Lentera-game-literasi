import { Link } from 'react-router';

export function Icon({ name, size = 20, className = '' }) {
  return <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><use href={`/app-icons.svg#${name}`} /></svg>;
}

export function TopicMark({ topic = '', size = 'normal' }) {
  const text = topic.toLowerCase();
  const kind = text.includes('phish') || text.includes('paket') ? 'mail'
    : text.includes('bully') || text.includes('kelas') ? 'chat'
      : text.includes('dox') || text.includes('privasi') || text.includes('alamat') ? 'fingerprint'
        : text.includes('belanja') || text.includes('toko') || text.includes('penipuan') ? 'shopping-bag' : 'book';
  return <span className={`topic-mark topic-${kind} ${size === 'large' ? 'topic-large' : ''}`}><Icon name={kind} size={size === 'large' ? 31 : 23} /></span>;
}

export function PageHeading({ eyebrow, title, children, action }) {
  return <div className="page-heading"><div><p className="eyebrow">{eyebrow}</p><h1>{title}</h1>{children && <p className="page-description">{children}</p>}</div>{action && <div className="heading-action">{action}</div>}</div>;
}

export function LoadingState({ label = 'Memuat halaman…' }) {
  return <div className="content-state" role="status"><span className="loading-ring" aria-hidden="true" /><p>{label}</p></div>;
}

export function ErrorState({ error, retry }) {
  return <div className="content-state" role="alert"><Icon name="alert" size={28} /><h2>Data belum bisa dibuka</h2><p>{error}</p>{retry && <button className="button secondary" onClick={retry}>Coba lagi</button>}</div>;
}

export function EmptyState({ icon = 'book', title, children, to, action }) {
  return <div className="empty-state"><span className="empty-icon"><Icon name={icon} size={26} /></span><h2>{title}</h2><p>{children}</p>{to && <Link to={to} className="button secondary">{action}</Link>}</div>;
}

export function Score({ value, small = false }) {
  return <span className={`score-text ${small ? 'score-small' : ''}`}>{Number(value ?? 0)}<span>/100</span></span>;
}

export function dateTime(value) {
  if (!value) return '—';
  return new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(value));
}
