import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  FileText,
  UploadCloud,
  TrendingUp,
  History,
  Briefcase,
  LogOut,
  Wand2,
} from 'lucide-react';
import Button from './Button';

export default function Sidebar({ isOpen, onClose }) {
  const { user, logout } = useAuth();
  const location = useLocation();

  if (!user) return null;

  return (
    <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
      <div className="sidebar-header">
        <div className="sidebar-logo-text" style={{ fontSize: '1.25rem' }}>
          Hire<span style={{ color: 'var(--accent)' }}>Lens</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        <div className="sidebar-section-title">Overview</div>
        <NavLink
          to="/dashboard"
          className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
          onClick={onClose}
        >
          <LayoutDashboard size={18} />
          <span>Dashboard</span>
        </NavLink>

        <div className="sidebar-section-title">Resume Studio</div>
        <NavLink
          to="/builder"
          className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
          onClick={onClose}
        >
          <Wand2 size={18} />
          <span>AI Resume Builder</span>
        </NavLink>

        <NavLink
          to="/upload"
          className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
          onClick={onClose}
        >
          <UploadCloud size={18} />
          <span>Upload Resume</span>
        </NavLink>

        <NavLink
          to="/resumes"
          className={({ isActive }) =>
            `sidebar-link ${isActive && !location.pathname.includes('/upload') ? 'active' : ''}`
          }
          onClick={onClose}
        >
          <FileText size={18} />
          <span>My Resumes</span>
        </NavLink>

        <NavLink
          to="/history"
          className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
          onClick={onClose}
        >
          <History size={18} />
          <span>Analysis History</span>
        </NavLink>

        <div className="sidebar-section-title">Job Alignment</div>
        <NavLink
          to="/jobs"
          className={({ isActive }) => `sidebar-link ${isActive && location.pathname === '/jobs' ? 'active' : ''}`}
          onClick={onClose}
        >
          <Briefcase size={18} />
          <span>Job Descriptions</span>
        </NavLink>

        <NavLink
          to="/jobs/match"
          className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
          onClick={onClose}
        >
          <TrendingUp size={18} />
          <span>Job Matcher</span>
        </NavLink>
      </nav>

      <div className="sidebar-cta">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <div className="user-avatar">{user.name ? user.name[0].toUpperCase() : 'U'}</div>
          <div style={{ overflow: 'hidden' }}>
            <div style={{ fontWeight: 700, fontSize: '0.875rem', truncate: true }}>{user.name}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user.email}
            </div>
          </div>
        </div>
        <Button variant="outline" size="sm" fullWidth icon={LogOut} onClick={logout}>
          Sign Out
        </Button>
      </div>
    </aside>
  );
}
