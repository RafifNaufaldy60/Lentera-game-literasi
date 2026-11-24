import { Link, NavLink } from 'react-router';
import { useEffect, useState } from 'react';
import { prefetchResource } from '../lib/resource-cache.js';
import { accountHome, useAuth } from '../auth/AuthContext.js';
import { Icon } from './Icons.jsx';
import { EquippedAvatar } from './ShopCosmetics.jsx';
import { useResource } from '../hooks/useResource.js';

const userLinks = [
  ['/dashboard', 'Beranda', 'home'], ['/petualangan', 'Peta misi', 'layers'], ['/materi', 'Materi', 'book'],
  ['/simulasi', 'Simulasi', 'chat'], ['/toko', 'Cyber Shop', 'shopping-bag'],
  ['/inventaris', 'Inventaris', 'shopping-bag'], ['/peringkat', 'Peringkat', 'trophy'], ['/profil', 'Profil', 'users'],
];
const adminLinks = [['/admin', 'Ringkasan', 'home'], ['/admin/materi', 'Kelola materi', 'book'],
  ['/admin/simulasi', 'Kelola simulasi', 'chat'], ['/admin/editor', 'Story Builder', 'layers'],
  ['/admin/toko', 'Kelola toko', 'shopping-bag'], ['/admin/nilai', 'Nilai peserta', 'chart']];

const routeResources = {
  '/dashboard': ['/catalog', '/attempts', '/game/profile', '/game/chapters'],
  '/petualangan': ['/game/chapters'],
  '/materi': ['/catalog'],
  '/simulasi': ['/scenarios'],
  '/peringkat': ['/leaderboard'],
  '/profil': ['/game/profile', '/shop/me'],
  '/toko': ['/shop/catalog','/shop/me'],
  '/inventaris': ['/shop/me','/shop/history'],
  '/admin': ['/admin/overview'],
  '/admin/materi': ['/admin/materials'],
  '/admin/simulasi': ['/admin/scenarios'],
  '/admin/editor': ['/admin/overview'],
  '/admin/nilai': ['/admin/attempts?page=1&search='],
  '/admin/toko': ['/admin/shop/items','/admin/shop/transactions'],
};
function warmRoute(path) {
  for (const resource of routeResources[path] || []) prefetchResource(resource);
}

function PlayerAccountAvatar({ name }) {
  const resource = useResource('/game/profile');
  const shop = useResource('/shop/me');
  return <span className="account-avatar account-avatar-player" aria-hidden="true">
    {resource.data?.profile?.settings?.avatar_key
      ? <EquippedAvatar name={resource.data.profile.settings.avatar_key} frame={shop.data?.equipment?.frame} />
      : name?.slice(0, 1).toUpperCase()}
  </span>;
}

function CoinHeader() {
  const wallet=useResource('/shop/me');
  return <Link className="coin-header" to="/toko" title="Buka Cyber Shop"><span aria-hidden="true" className="coin-mini">C</span><strong>{wallet.data?Number(wallet.data.balance).toLocaleString('id-ID'):'—'}</strong><span>CC</span></Link>;
}

export default function PageShell({ children }) {
  const { user, loading, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const links = user?.role === 'admin' ? adminLinks : userLinks;
  useEffect(() => {
    if (!user) return undefined;
    const important = user.role === 'admin'
      ? ['/admin/overview', '/admin/materials', '/admin/scenarios']
      : ['/scenarios', '/game/chapters', '/catalog', '/game/profile', '/leaderboard'];
    const timers = important.map((path, i) => window.setTimeout(() => prefetchResource(path), 1200 + 450 * i));
    return () => timers.forEach(window.clearTimeout);
  }, [user?.id, user?.role]);
  return <div className="site-shell">
    <a className="skip-link" href="#konten">Lewati ke konten</a>
    <header className="site-header">
      <Link className="wordmark" to={user ? accountHome(user) : '/masuk'} onClick={() => setMenuOpen(false)}>
        <span className="brand-symbol"><Icon name="shield" size={22} /></span>
        <span className="brand-copy">Lentera<span className="brand-arcade">PLAY</span><span className="brand-tagline">Literasi digital interaktif</span></span>
      </Link>
      {user && <button className="mobile-menu-button" type="button" aria-expanded={menuOpen} aria-controls="main-navigation" onClick={() => setMenuOpen((open) => !open)}><Icon name="menu" /> Menu</button>}
      {user ? <nav id="main-navigation" className={`main-navigation ${menuOpen ? 'nav-open' : ''}`} aria-label="Navigasi utama">
        {links.map(([to, title, icon]) => <NavLink key={to} to={to} end onPointerEnter={() => warmRoute(to)} onFocus={() => warmRoute(to)} onClick={() => setMenuOpen(false)}><Icon name={icon} size={18} />{title}</NavLink>)}
      </nav> : !loading && <nav className="public-navigation" aria-label="Akun"><NavLink to="/masuk">Masuk</NavLink><NavLink to="/daftar">Daftar</NavLink></nav>}
      {user?.role==='user'&&<CoinHeader/>}
      {user && <div className="account-menu">{user.role === 'user' ? <PlayerAccountAvatar name={user.name}/> : <span className="account-avatar" aria-hidden="true">{user.name?.slice(0, 1).toUpperCase()}</span>}<span className="account-name">{user.name}</span><button className="logout-button" type="button" onClick={() => logout().catch(() => {})} title="Keluar dari akun"><Icon name="logout" size={18} /><span>Keluar</span></button></div>}
    </header>
    <main id="konten">{children}</main>
    <footer className="site-footer"><span>© 2026 Lentera · Ruang latihan literasi digital</span><p>Berhenti sejenak. Periksa sebelum percaya.</p></footer>
  </div>;
}
