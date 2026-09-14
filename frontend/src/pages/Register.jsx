import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserPlus, Eye, EyeOff, Sparkles, CheckCircle2, ShieldCheck, Zap, Mail, Lock, User } from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '../components/Button';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !email || !password) {
      setError('Please fill in all fields');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setError('');
    setLoading(true);
    try {
      await register(name, email, password);
      toast.success('Account created successfully!');
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
      toast.error(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-split-wrapper">
        {/* LEFT HERO SHOWCASE PANEL */}
        <div className="auth-hero-panel">
          <div className="auth-hero-content">
            <div className="auth-hero-badge">
              <Sparkles size={14} />
              <span>Join 50,000+ Job Seekers Worldwide</span>
            </div>

            <h1 className="auth-hero-title">
              Build & Tailor Your CV with AI Precision.
            </h1>

            <p className="auth-hero-subtitle">
              Create an account in seconds to unlock instant ATS scoring, automatic skill gap analysis, and tailored AI career recommendations.
            </p>

            <div className="auth-feature-list">
              <div className="auth-feature-item">
                <CheckCircle2 size={18} color="#34d399" />
                <span>Instant ATS Readiness Score & Breakdown</span>
              </div>
              <div className="auth-feature-item">
                <Zap size={18} color="#34d399" />
                <span>10+ Professional Resume Builder Templates</span>
              </div>
              <div className="auth-feature-item">
                <ShieldCheck size={18} color="#34d399" />
                <span>Automated Job Application & Match Tracker</span>
              </div>
            </div>
          </div>

          <div className="auth-hero-stats">
            <div className="auth-stat-card">
              <div className="auth-stat-value">100%</div>
              <div className="auth-stat-label">Free Account</div>
            </div>
            <div className="auth-stat-card">
              <div className="auth-stat-value">10+</div>
              <div className="auth-stat-label">CV Templates</div>
            </div>
            <div className="auth-stat-card">
              <div className="auth-stat-value">Instant</div>
              <div className="auth-stat-label">Setup</div>
            </div>
          </div>
        </div>

        {/* RIGHT AUTH FORM CARD */}
        <div className="auth-form-card">
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <img src="/hirelens-logo.png" alt="HireLens Logo" style={{ height: 34, width: 'auto', objectFit: 'contain' }} />
              <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: '1.4rem', color: '#0f172a', letterSpacing: '-0.02em' }}>
                Hire<span style={{ color: '#059669' }}>Lens</span>
              </span>
            </div>
            <h2 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', marginBottom: 6 }}>
              Create an Account
            </h2>
            <p style={{ color: '#64748b', fontSize: '0.875rem' }}>
              Start analyzing your resumes with AI in seconds.
            </p>
          </div>

          {error && (
            <div className="msg-error" style={{ marginBottom: 18, fontSize: '0.85rem' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 600, color: '#334155' }}>
                Full Name
              </label>
              <div style={{ position: 'relative' }}>
                <User size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                <input
                  type="text"
                  className="form-input"
                  style={{ paddingLeft: 42 }}
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 600, color: '#334155' }}>
                Email Address
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                <input
                  type="email"
                  className="form-input"
                  style={{ paddingLeft: 42 }}
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 600, color: '#334155' }}>
                Password
              </label>
              <div className="input-with-icon" style={{ position: 'relative' }}>
                <Lock size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', zIndex: 1 }} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="form-input"
                  style={{ paddingLeft: 42, paddingRight: 42 }}
                  placeholder="At least 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="input-icon-right"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  style={{ right: 12 }}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <Button type="submit" variant="primary" fullWidth size="lg" loading={loading} icon={UserPlus} style={{ height: 48, borderRadius: 12, fontSize: '0.95rem', fontWeight: 700 }}>
              Create Account
            </Button>
          </form>

          <div className="auth-footer" style={{ marginTop: 24, fontSize: '0.875rem' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: '#059669', fontWeight: 700 }}>
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

