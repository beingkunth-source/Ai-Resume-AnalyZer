import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogIn, Eye, EyeOff, Sparkles, CheckCircle2, ShieldCheck, Zap, Mail, Lock } from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '../components/Button';
import OAuthButtons from '../components/OAuthButtons';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter your email and password');
      return;
    }

    setError('');
    setLoading(true);
    try {
      await login(email, password);
      toast.success('Welcome back!');
      navigate('/dashboard');
    } catch (err) {
      const msg = err.message || 'Login failed. Please check your credentials.';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = () => {
    setEmail('alex.morgan.dev@gmail.com');
    setPassword('password123');
    toast.success('Demo credentials loaded! Click Sign In.');
  };

  return (
    <div className="auth-page">
      <div className="auth-split-wrapper">
        {/* LEFT HERO SHOWCASE PANEL */}
        <div className="auth-hero-panel">
          <div className="auth-hero-content">
            <div className="auth-hero-badge">
              <Sparkles size={14} />
              <span>Next-Gen AI Resume & Career Platform</span>
            </div>

            <h1 className="auth-hero-title">
              Elevate Your Resume for Top Tech Roles.
            </h1>

            <p className="auth-hero-subtitle">
              Audit your ATS compatibility score, extract targeted job keywords, and generate recruiter-grade CVs powered by advanced AI models.
            </p>

            <div className="auth-feature-list">
              <div className="auth-feature-item">
                <CheckCircle2 size={18} color="#34d399" />
                <span>Deterministic ATS Score Auditing (0–100)</span>
              </div>
              <div className="auth-feature-item">
                <Zap size={18} color="#34d399" />
                <span>Automated Job Description Keyword Extractor</span>
              </div>
              <div className="auth-feature-item">
                <ShieldCheck size={18} color="#34d399" />
                <span>Direct GitHub & LinkedIn Profile Importer</span>
              </div>
            </div>
          </div>

          <div className="auth-hero-stats">
            <div className="auth-stat-card">
              <div className="auth-stat-value">98.4%</div>
              <div className="auth-stat-label">ATS Accuracy</div>
            </div>
            <div className="auth-stat-card">
              <div className="auth-stat-value">50k+</div>
              <div className="auth-stat-label">Resumes Audited</div>
            </div>
            <div className="auth-stat-card">
              <div className="auth-stat-value">&lt; 3s</div>
              <div className="auth-stat-label">Fast Analysis</div>
            </div>
          </div>
        </div>

        {/* RIGHT AUTH FORM CARD */}
        <div className="auth-form-card">
          <div style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <img src="/hirelens-logo.png" alt="HireLens Logo" style={{ height: 34, width: 'auto', objectFit: 'contain' }} />
              <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: '1.4rem', color: '#0f172a', letterSpacing: '-0.02em' }}>
                Hire<span style={{ color: '#059669' }}>Lens</span>
              </span>
            </div>
            <h2 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', marginBottom: 6 }}>
              Welcome Back
            </h2>
            <p style={{ color: '#64748b', fontSize: '0.875rem' }}>
              Sign in to manage your resumes, run ATS analyses, and track job matches.
            </p>
          </div>

          {/* QUICK DEMO BADGE */}
          <button
            type="button"
            onClick={handleQuickDemo}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              width: '100%',
              padding: '8px 14px',
              marginBottom: 20,
              backgroundColor: '#ecfdf5',
              border: '1px solid #a7f3d0',
              borderRadius: '10px',
              color: '#047857',
              fontSize: '0.825rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            <Zap size={15} color="#059669" />
            <span>Click to Autofill Demo Account (Alex Morgan)</span>
          </button>

          {error && (
            <div className="msg-error" style={{ marginBottom: 18, fontSize: '0.85rem' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <label className="form-label" style={{ fontWeight: 600, color: '#334155', marginBottom: 0 }}>
                  Password
                </label>
              </div>
              <div className="input-with-icon" style={{ position: 'relative' }}>
                <Lock size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', zIndex: 1 }} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="form-input"
                  style={{ paddingLeft: 42, paddingRight: 42 }}
                  placeholder="Enter your password"
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

            <Button type="submit" variant="primary" fullWidth size="lg" loading={loading} icon={LogIn} style={{ height: 48, borderRadius: 12, fontSize: '0.95rem', fontWeight: 700 }}>
              Sign In
            </Button>
          </form>

          {/* OAUTH SOCIAL BUTTONS */}
          <OAuthButtons onSuccess={() => navigate('/dashboard')} />

          <div className="auth-footer" style={{ marginTop: 24, fontSize: '0.875rem' }}>
            Don't have an account?{' '}
            <Link to="/register" style={{ color: '#059669', fontWeight: 700 }}>
              Create an account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

