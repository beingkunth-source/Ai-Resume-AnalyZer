import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  UserCheck,
  FileText,
  UploadCloud,
  TrendingUp,
  History,
  Briefcase,
  LogOut,
  Wand2,
  Sparkles,
  Search,
  Bookmark,
  Linkedin,
  Github,
  Layers,
} from 'lucide-react';
import Button from './Button';

export default function Sidebar({ isOpen, onClose }) {
  const { user, logout } = useAuth();
  const location = useLocation();

  if (!user) return null;

  return (
    <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
      <div className="sidebar-header" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <img src="/hirelens-logo.png" alt="HireLens Logo" className="h-8 w-auto object-contain shrink-0" />
        <div className="sidebar-logo-text" style={{ fontSize: '1.25rem', fontFamily: 'Outfit, sans-serif', fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1 }}>
          Hire<span style={{ color: '#059669' }}>Lens</span> <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#059669', background: '#ECFDF5', padding: '2px 6px', borderRadius: 6, border: '1px solid #A7F3D0' }}>AI</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        <div className="sidebar-section-title">Career Hub</div>
        <NavLink
          to="/dashboard"
          className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
          onClick={onClose}
        >
          <LayoutDashboard size={18} />
          <span>Dashboard</span>
        </NavLink>

        <NavLink
          to="/profile"
          className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
          onClick={onClose}
        >
          <UserCheck size={18} />
          <span>My AI Profile</span>
        </NavLink>

        <div className="sidebar-section-title">Resume Studio</div>
        <NavLink
          to="/resume-generator"
          className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
          onClick={onClose}
        >
          <Wand2 size={18} />
          <span>AI Resume Builder</span>
        </NavLink>

        <NavLink
          to="/versions"
          className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
          onClick={onClose}
        >
          <Layers size={18} />
          <span>Resume Versions</span>
        </NavLink>

        <NavLink
          to="/upload"
          className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
          onClick={onClose}
        >
          <UploadCloud size={18} />
          <span>Upload & Analyze</span>
        </NavLink>

        <div className="sidebar-section-title">Integrations & Branding</div>
        <NavLink
          to="/linkedin"
          className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
          onClick={onClose}
        >
          <Linkedin size={18} />
          <span>LinkedIn Optimizer</span>
        </NavLink>

        <NavLink
          to="/github"
          className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
          onClick={onClose}
        >
          <Github size={18} />
          <span>GitHub Importer</span>
        </NavLink>

        <div className="sidebar-section-title">Job Recommendations</div>
        <NavLink
          to="/jobs/recommended"
          className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
          onClick={onClose}
        >
          <Sparkles size={18} />
          <span>Recommended Jobs</span>
        </NavLink>

        <NavLink
          to="/jobs"
          className={({ isActive }) => `sidebar-link ${isActive && location.pathname === '/jobs' ? 'active' : ''}`}
          onClick={onClose}
        >
          <Search size={18} />
          <span>Job Discovery</span>
        </NavLink>

        <NavLink
          to="/jobs/saved"
          className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
          onClick={onClose}
        >
          <Bookmark size={18} />
          <span>Saved Jobs</span>
        </NavLink>

        <NavLink
          to="/applications"
          className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
          onClick={onClose}
        >
          <Briefcase size={18} />
          <span>Application Tracker</span>
        </NavLink>
      </nav>

      <div className="sidebar-cta">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <div className="user-avatar">{user.name ? user.name[0].toUpperCase() : 'U'}</div>
          <div style={{ overflow: 'hidden' }}>
            <div style={{ fontWeight: 700, fontSize: '0.875rem' }}>{user.name}</div>
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
