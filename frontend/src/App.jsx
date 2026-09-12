import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Resumes from './pages/Resumes';
import UploadResume from './pages/UploadResume';
import Analysis from './pages/Analysis';
import AnalysisDetail from './pages/AnalysisDetail';
import Jobs from './pages/Jobs';
import JobMatch from './pages/JobMatch';
import ResumeBuilder from './pages/ResumeBuilder';
import History from './pages/History';
import NotFound from './pages/NotFound';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
      </div>
    );
  }
  return user ? children : <Navigate to="/login" replace />;
}

function PublicOnlyRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
      </div>
    );
  }
  return user ? <Navigate to="/dashboard" replace /> : children;
}

function LayoutShell() {
  const { user } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isPublicPage = location.pathname === '/' || location.pathname === '/login' || location.pathname === '/register';

  return (
    <div className="app-container">
      {user && !isPublicPage && (
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      )}

      <div className="app-main-layout">
        <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        <main className="main-content">
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<PublicOnlyRoute><Login /></PublicOnlyRoute>} />
            <Route path="/register" element={<PublicOnlyRoute><Register /></PublicOnlyRoute>} />

            {/* Protected SaaS Routes */}
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/builder" element={<ProtectedRoute><ResumeBuilder /></ProtectedRoute>} />
            <Route path="/resumes" element={<ProtectedRoute><Resumes /></ProtectedRoute>} />
            <Route path="/upload" element={<ProtectedRoute><UploadResume /></ProtectedRoute>} />
            <Route path="/analysis/:resumeId" element={<ProtectedRoute><Analysis /></ProtectedRoute>} />
            <Route path="/analysis/detail/:analysisId" element={<ProtectedRoute><AnalysisDetail /></ProtectedRoute>} />
            <Route path="/jobs" element={<ProtectedRoute><Jobs /></ProtectedRoute>} />
            <Route path="/jobs/match" element={<ProtectedRoute><JobMatch /></ProtectedRoute>} />
            <Route path="/history" element={<ProtectedRoute><History /></ProtectedRoute>} />

            {/* Catch All */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
        <LayoutShell />
      </BrowserRouter>
    </AuthProvider>
  );
}
