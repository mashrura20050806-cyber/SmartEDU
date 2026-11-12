import { BookOpen, ChartNoAxesCombined, ClipboardList, FileText, GraduationCap, LayoutDashboard, LogOut, Menu, Settings, Users, X } from 'lucide-react';
import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import menuFactory from '../factories/menuFactory.js';
import { useAuth } from '../hooks/useAuth.js';

const iconByLabel = {
  Notices: FileText,
  'Marks & performance': ChartNoAxesCombined,
  'Files & tasks': ClipboardList,
  People: Users,
  'Classes & sections': BookOpen,
  Subjects: BookOpen,
  'Teacher assignments': Users,
  Permissions: Settings,
};

const roleLabel = (role) => role?.toLowerCase().replaceAll('_', ' ').replace(/\b\w/g, (char) => char.toUpperCase());

export default function AppLayout() {
  const { user, permissions, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  async function handleLogout() {
    setError('');
    try {
      await logout();
      navigate('/login', { replace: true });
    } catch (logoutError) {
      setError(logoutError.message);
    }
  }

  return (
    <div className="app-shell">
      <button className="mobile-menu-button" aria-label={menuOpen ? 'Close menu' : 'Open menu'} onClick={() => setMenuOpen(!menuOpen)}>
        {menuOpen ? <X size={21} /> : <Menu size={21} />}
      </button>
      {menuOpen && <button className="sidebar-scrim" aria-label="Close menu" onClick={() => setMenuOpen(false)} />}
      <aside className={`sidebar ${menuOpen ? 'sidebar-open' : ''}`}>
        <a className="brand-lockup" href="/app">
          <span className="brand-mark"><GraduationCap size={21} /></span>
          <span><strong>SmartEDU</strong></span>
        </a>
        <nav className="side-nav" aria-label="Main navigation">
          <NavLink to="/app" end className={({ isActive }) => `nav-item ${isActive ? 'nav-active' : ''}`} onClick={() => setMenuOpen(false)}><LayoutDashboard size={18} /><span>Overview</span></NavLink>
          {menuFactory(user?.role, permissions).map((label) => {
            const Icon = iconByLabel[label];
            const destinations = {
              Notices: '/app/notices',
              'Marks & performance': '/app/marks',
              People: '/app/users',
              'Classes & sections': '/app/classes',
              Subjects: '/app/subjects',
              'Teacher assignments': '/app/assignments',
              'Files & tasks': '/app/files',
              Permissions: '/app/permissions',
            };
            const destination = destinations[label] || '/app';
            return (
              <NavLink
                to={destination}
                className={({ isActive }) => `nav-item ${isActive ? 'nav-active' : ''}`}
                key={label}
                onClick={() => setMenuOpen(false)}
              >
                <Icon size={18} /><span>{label}</span>
              </NavLink>
            );
          })}
        </nav>
        <div className="sidebar-bottom">
          <div className="profile-card">
            <div className="avatar">{user?.name?.charAt(0)?.toUpperCase() || 'U'}</div>
            <div className="profile-details"><strong>{user?.name}</strong><small>{roleLabel(user?.role)}</small></div>
          </div>
          <button className="logout-button" onClick={handleLogout}><LogOut size={17} /> Sign out</button>
          {error && <p className="inline-error" role="alert">{error}</p>}
        </div>
      </aside>
      <main className="main-area">
        <div className="page-content"><Outlet /></div>
      </main>
    </div>
  );
}