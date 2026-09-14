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
import JobMatch from './pages/JobMatch';
import History from './pages/History';
import JobRecommended from './pages/JobRecommended';
import JobSearch from './pages/JobSearch';
import JobDetail from './pages/JobDetail';
import SavedJobs from './pages/SavedJobs';
import ApplicationTracker from './pages/ApplicationTracker';
import OnboardingWizard from './pages/OnboardingWizard';
import UserProfile from './pages/UserProfile';
import LinkedInAnalyzer from './pages/LinkedInAnalyzer';
import GitHubAnalyzer from './pages/GitHubAnalyzer';
import ResumeGenerator from './pages/ResumeGenerator';
import ResumeVersions from './pages/ResumeVersions';
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

  const isPublicPage =
    location.pathname === '/' ||
    location.pathname === '/login' ||
    location.pathname === '/register' ||
    location.pathname === '/onboarding';

  return (
    <div className="app-container">
      {user && !isPublicPage && (
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      )}

      <div className="app-main-layout">
        {!isPublicPage && <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />}
        <main className="main-content">
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<PublicOnlyRoute><Login /></PublicOnlyRoute>} />
            <Route path="/register" element={<PublicOnlyRoute><Register /></PublicOnlyRoute>} />
            <Route path="/onboarding" element={<ProtectedRoute><OnboardingWizard /></ProtectedRoute>} />

            {/* Protected SaaS Routes */}
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><UserProfile /></ProtectedRoute>} />
            <Route path="/linkedin" element={<ProtectedRoute><LinkedInAnalyzer /></ProtectedRoute>} />
            <Route path="/github" element={<ProtectedRoute><GitHubAnalyzer /></ProtectedRoute>} />
            <Route path="/resume-generator" element={<ProtectedRoute><ResumeGenerator /></ProtectedRoute>} />
            <Route path="/builder" element={<ProtectedRoute><ResumeGenerator /></ProtectedRoute>} />
            <Route path="/versions" element={<ProtectedRoute><ResumeVersions /></ProtectedRoute>} />
            <Route path="/resumes" element={<ProtectedRoute><Resumes /></ProtectedRoute>} />
            <Route path="/upload" element={<ProtectedRoute><UploadResume /></ProtectedRoute>} />
            <Route path="/analysis/:resumeId" element={<ProtectedRoute><Analysis /></ProtectedRoute>} />
            <Route path="/analysis/detail/:analysisId" element={<ProtectedRoute><AnalysisDetail /></ProtectedRoute>} />
            <Route path="/jobs/recommended" element={<ProtectedRoute><JobRecommended /></ProtectedRoute>} />
            <Route path="/jobs" element={<ProtectedRoute><JobSearch /></ProtectedRoute>} />
            <Route path="/jobs/saved" element={<ProtectedRoute><SavedJobs /></ProtectedRoute>} />
            <Route path="/jobs/match" element={<ProtectedRoute><JobMatch /></ProtectedRoute>} />
            <Route path="/jobs/:id" element={<ProtectedRoute><JobDetail /></ProtectedRoute>} />
            <Route path="/applications" element={<ProtectedRoute><ApplicationTracker /></ProtectedRoute>} />
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
