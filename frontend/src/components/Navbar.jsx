import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Menu, LogIn, UserPlus, Sparkles } from 'lucide-react';
import Button from './Button';

export default function Navbar({ onToggleSidebar }) {
  const { user } = useAuth();
  const location = useLocation();

  const isPublicPage = location.pathname === '/' || location.pathname === '/login' || location.pathname === '/register';

  return (
    <header className="navbar">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {user && !isPublicPage && (
          <button className="navbar-mobile-toggle" onClick={onToggleSidebar} aria-label="Toggle Navigation">
            <Menu size={22} />
          </button>
        )}
        <Link to={user ? '/dashboard' : '/'} style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <img src="/hirelens-logo.png" alt="HireLens Logo" className="h-8 w-auto object-contain shrink-0" />
          <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: '1.25rem', color: 'var(--text-primary)', letterSpacing: '-0.02em', lineHeight: 1 }}>
            Hire<span style={{ color: '#059669' }}>Lens</span>
          </span>
        </Link>
      </div>

      <div className="navbar-user-menu">
        {user ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span className="user-name" style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              Welcome, <strong style={{ color: 'var(--text-primary)' }}>{user.name}</strong>
            </span>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Link to="/login">
              <Button variant="secondary" size="sm" icon={LogIn}>
                Log In
              </Button>
            </Link>
            <Link to="/register">
              <Button variant="primary" size="sm" icon={UserPlus}>
                Get Started
              </Button>
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
