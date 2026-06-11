import React from 'react';
import { Navigate, Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const AdminLayout: React.FC = () => {
  const { isAuthenticated, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <h2 style={{ fontFamily: 'var(--font-display)', color: 'var(--text-accent)' }}>CMS Admin</h2>
        <nav className="admin-nav">
          <Link to="/admin/hero" className={location.pathname === '/admin/hero' ? 'active' : ''}>
            Hero Slider Builder
          </Link>
          <Link to="/admin/photos" className={location.pathname === '/admin/photos' ? 'active' : ''}>
            Photo Manager
          </Link>
          <Link to="/admin/about" className={location.pathname === '/admin/about' ? 'active' : ''}>
            About Page Config
          </Link>
          <Link to="/admin/settings" className={location.pathname === '/admin/settings' ? 'active' : ''}>
            Site Settings
          </Link>
          <button onClick={handleLogout} className="btn" style={{ marginTop: 'auto' }}>
            Logout
          </button>
        </nav>
      </aside>
      <main className="admin-content">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
