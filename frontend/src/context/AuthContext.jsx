import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';
import { supabase } from '../services/supabaseClient';


const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('user');
      return saved ? JSON.parse(saved) : null;
    } catch (err) {
      localStorage.removeItem('user');
      return null;
    }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function initAuth() {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        if (token) {
          try {
            const res = await authAPI.me();
            if (isMounted) {
              const u = res.data;
              setUser(u);
              localStorage.setItem('user', JSON.stringify(u));
            }
          } catch (err) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            if (isMounted) setUser(null);
          }
        } else {
          // Check for Supabase OAuth callback session on URL redirect
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            const provider = session.user.app_metadata?.provider || 'Google';
            const name = session.user.user_metadata?.full_name || session.user.user_metadata?.name || 'Google User';
            const email = session.user.email;
            if (email) {
              const res = await authAPI.oauth({ name, email, provider });
              const backendToken = res.data.access_token;
              const u = res.data.user;
              localStorage.setItem('token', backendToken);
              localStorage.setItem('user', JSON.stringify(u));
              if (isMounted) setUser(u);
            }
          }
        }
      } catch (err) {
        console.error('Auth initialization error:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    initAuth();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user && !localStorage.getItem('token')) {
        try {
          const provider = session.user.app_metadata?.provider || 'Google';
          const name = session.user.user_metadata?.full_name || session.user.user_metadata?.name || 'Google User';
          const email = session.user.email;
          if (email) {
            const res = await authAPI.oauth({ name, email, provider });
            const backendToken = res.data.access_token;
            const u = res.data.user;
            localStorage.setItem('token', backendToken);
            localStorage.setItem('user', JSON.stringify(u));
            setUser(u);
          }
        } catch (err) {
          console.error('Supabase OAuth sync error:', err);
        }
      }
    });

    return () => {
      isMounted = false;
      authListener?.subscription?.unsubscribe();
    };
  }, []);


  const login = async (email, password) => {
    const res = await authAPI.login({ email, password });
    const { access_token, user: u } = res.data;
    localStorage.setItem('token', access_token);
    localStorage.setItem('user', JSON.stringify(u));
    setUser(u);
    return u;
  };

  const register = async (name, email, password) => {
    const res = await authAPI.register({ name, email, password });
    const { access_token, user: u } = res.data;
    localStorage.setItem('token', access_token);
    localStorage.setItem('user', JSON.stringify(u));
    setUser(u);
    return u;
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
