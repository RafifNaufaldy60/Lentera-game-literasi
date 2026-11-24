import { BrowserRouter, Link, Navigate, Route, Routes } from 'react-router';
import AuthProvider from './auth/AuthProvider.jsx';
import { accountHome, useAuth } from './auth/AuthContext.js';
import PageShell from './components/PageShell.jsx';
import AuthPage from './pages/AuthPage.jsx';
import Dashboard from './pages/Dashboard.jsx';
import { Materials, MaterialDetail } from './pages/Materials.jsx';
import { Scenarios, ScenarioIntro } from './pages/Scenarios.jsx';
import { Game, Result } from './pages/Game.jsx';
import Leaderboard from './pages/Leaderboard.jsx';
import { Campaign, Profile } from './pages/Missions.jsx';
import StoryBuilder from './pages/StoryBuilder.jsx';
import { Shop, Inventory, AdminShop } from './pages/Shop.jsx';
import { AdminDashboard, AdminMaterials, AdminScenarios, AdminScores } from './pages/Admin.jsx';
import './App.css';

function PublicPage({ children }) {
  const { user } = useAuth();
  return user ? <Navigate to={accountHome(user)} replace /> : children;
}
function ProtectedPage({ role, children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/masuk" replace />;
  if (user.role !== role) return <Navigate to={accountHome(user)} replace />;
  return children;
}
function AppContent() {
  const { user, loading, error, refreshSession } = useAuth();
  const userPage = (page) => <ProtectedPage role="user">{page}</ProtectedPage>;
  const adminPage = (page) => <ProtectedPage role="admin">{page}</ProtectedPage>;
  return <PageShell>{loading ? <section className="page-state" role="status"><h1>Memeriksa sesi</h1><p>Menyiapkan akses akun Anda…</p></section> : error ?
    <section className="page-state"><h1>Koneksi belum tersedia</h1><p role="alert">{error}</p><button className="button primary" onClick={() => refreshSession()}>Coba lagi</button></section> :
    <Routes>
      <Route path="/" element={<Navigate to={user ? accountHome(user) : '/masuk'} replace />} />
      <Route path="/daftar" element={<PublicPage><AuthPage key="daftar" registering /></PublicPage>} />
      <Route path="/masuk" element={<PublicPage><AuthPage key="masuk" /></PublicPage>} />
      <Route path="/dashboard" element={userPage(<Dashboard />)} />
      <Route path="/materi" element={userPage(<Materials />)} />
      <Route path="/materi/:id" element={userPage(<MaterialDetail />)} />
      <Route path="/simulasi" element={userPage(<Scenarios />)} />
      <Route path="/simulasi/:id" element={userPage(<ScenarioIntro />)} />
      <Route path="/bermain/:id" element={userPage(<Game />)} />
      <Route path="/hasil/:id" element={userPage(<Result />)} />
      <Route path="/peringkat" element={userPage(<Leaderboard />)} />
      <Route path="/petualangan" element={userPage(<Campaign />)} />
      <Route path="/profil" element={userPage(<Profile />)} />
      <Route path="/toko" element={userPage(<Shop />)} />
      <Route path="/inventaris" element={userPage(<Inventory />)} />
      <Route path="/admin" element={adminPage(<AdminDashboard />)} />
      <Route path="/admin/materi" element={adminPage(<AdminMaterials />)} />
      <Route path="/admin/simulasi" element={adminPage(<AdminScenarios />)} />
      <Route path="/admin/nilai" element={adminPage(<AdminScores />)} />
      <Route path="/admin/editor" element={adminPage(<StoryBuilder />)} />
      <Route path="/admin/toko" element={adminPage(<AdminShop />)} />
      <Route path="/admin/editor/:id" element={adminPage(<StoryBuilder />)} />
      <Route path="*" element={<section className="page-state"><h1>Halaman tidak ditemukan</h1><p>Alamat ini belum tersedia.</p><Link to={user ? accountHome(user) : '/masuk'}>Kembali ke beranda</Link></section>} />
    </Routes>}
  </PageShell>;
}
export default function App() {
  return <BrowserRouter><AuthProvider><AppContent /></AuthProvider></BrowserRouter>;
}
