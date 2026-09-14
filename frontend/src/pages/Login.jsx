import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogIn, Eye, EyeOff } from 'lucide-react';
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
      setError('Please fill in all fields');
      return;
    }

    setError('');
    setLoading(true);
    try {
      await login(email, password);
      toast.success('Welcome back!');
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
      toast.error(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <h1 style={{ fontFamily: 'Outfit', fontSize: '1.8rem', marginBottom: 6 }}>Welcome Back</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: 10 }}>
            Sign in to access your resume analyses and job matches.
          </p>
          <button
            type="button"
            onClick={() => {
              setEmail('alex.morgan.dev@gmail.com');
              setPassword('password123');
            }}
            style={{
              fontSize: '0.75rem',
              fontWeight: 600,
              padding: '6px 14px',
              borderRadius: '20px',
              backgroundColor: '#ecfdf5',
              color: '#047857',
              border: '1px solid #a7f3d0',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s ease',
            }}
          >
            ⚡ Quick Fill Demo Account
          </button>
        </div>

        {error && <div className="msg-error" style={{ marginBottom: 16 }}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              type="email"
              className="form-input"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div className="input-with-icon">
              <input
                type={showPassword ? 'text' : 'password'}
                className="form-input"
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
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <Button type="submit" variant="primary" fullWidth size="lg" loading={loading} icon={LogIn}>
            Sign In
          </Button>
        </form>

        {/* COMPACT GOOGLE & LINKEDIN OAUTH BUTTONS BELOW FORM */}
        <OAuthButtons onSuccess={() => navigate('/dashboard')} />

        <div className="auth-footer" style={{ marginTop: 20 }}>
          Don't have an account? <Link to="/register">Create an account</Link>
        </div>
      </div>
    </div>
  );
}
