import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';
import toast from 'react-hot-toast';

export default function OAuthButtons({ onSuccess }) {
  const { login } = useAuth();
  const [loadingProvider, setLoadingProvider] = useState(null);

  const handleOAuthLogin = async (provider, defaultName, defaultEmail) => {
    setLoadingProvider(provider);
    try {
      // Simulate OAuth redirect / response
      await new Promise((resolve) => setTimeout(resolve, 800));
      try {
        await login(defaultEmail, 'oauth-provider-secure-pass');
      } catch (err) {
        // If user account doesn't exist yet, register automatically
        const res = await authAPI.register({
          name: defaultName,
          email: defaultEmail,
          password: 'oauth-provider-secure-pass-123',
        });
        localStorage.setItem('token', res.data.access_token);
        localStorage.setItem('user', JSON.stringify(res.data.user));
        window.location.href = '/dashboard';
        return;
      }
      toast.success(`Successfully signed in with ${provider}!`);
      if (onSuccess) onSuccess();
      else window.location.href = '/dashboard';
    } catch (err) {
      toast.error(`Failed to sign in with ${provider}`);
    } finally {
      setLoadingProvider(null);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%', marginBottom: 20 }}>
      {/* GOOGLE SIGN IN BUTTON */}
      <motion.button
        whileHover={{ scale: 1.015 }}
        whileTap={{ scale: 0.985 }}
        type="button"
        disabled={!!loadingProvider}
        onClick={() => handleOAuthLogin('Google', 'Alex Morgan', 'alex.morgan.dev@gmail.com')}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 12,
          padding: '12px 16px',
          background: '#ffffff',
          border: '1px solid #cbd5e1',
          borderRadius: 'var(--radius-sm)',
          fontSize: '0.9rem',
          fontWeight: 600,
          color: '#0f172a',
          cursor: 'pointer',
          boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
          transition: 'all 0.2s ease',
        }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24">
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
          />
        </svg>
        <span>{loadingProvider === 'Google' ? 'Connecting to Google...' : 'Continue with Google'}</span>
      </motion.button>

      {/* LINKEDIN SIGN IN BUTTON */}
      <motion.button
        whileHover={{ scale: 1.015 }}
        whileTap={{ scale: 0.985 }}
        type="button"
        disabled={!!loadingProvider}
        onClick={() => handleOAuthLogin('LinkedIn', 'Sarah Chen', 'sarah.chen@linkedin-user.com')}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 12,
          padding: '12px 16px',
          background: '#0a66c2',
          border: 'none',
          borderRadius: 'var(--radius-sm)',
          fontSize: '0.9rem',
          fontWeight: 600,
          color: '#ffffff',
          cursor: 'pointer',
          boxShadow: '0 2px 6px rgba(10, 102, 194, 0.25)',
          transition: 'all 0.2s ease',
        }}
      >
        <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
          <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.25V10.9H6.46M7.86 6.7a1.63 1.63 0 1 0 0 3.26 1.63 1.63 0 0 0 0-3.26Z" />
        </svg>
        <span>{loadingProvider === 'LinkedIn' ? 'Connecting to LinkedIn...' : 'Continue with LinkedIn'}</span>
      </motion.button>

      <div style={{ display: 'flex', alignItems: 'center', margin: '10px 0' }}>
        <div style={{ flex: 1, borderBottom: '1px solid var(--border)' }} />
        <span style={{ padding: '0 12px', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
          OR WITH EMAIL
        </span>
        <div style={{ flex: 1, borderBottom: '1px solid var(--border)' }} />
      </div>
    </div>
  );
}
