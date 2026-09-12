import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { dashboardAPI } from '../services/api';
import {
  FileText,
  Plus,
  TrendingUp,
  Sparkles,
  Award,
  BarChart2,
  Calendar,
  ArrowRight,
  UploadCloud,
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import toast from 'react-hot-toast';
import Button from '../components/Button';
import LoadingState from '../components/LoadingState';

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    dashboardAPI.get()
      .then((res) => setData(res.data))
      .catch((err) => {
        setError(err.message || 'Failed to load dashboard data');
        toast.error(err.message || 'Failed to load dashboard');
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingState type="page" />;

  if (error) {
    return (
      <div className="card text-center p-8">
        <h3 className="text-lg font-bold mb-2">Could Not Load Dashboard</h3>
        <p className="text-secondary mb-4">{error}</p>
        <Button variant="primary" onClick={() => window.location.reload()}>
          Retry Loading
        </Button>
      </div>
    );
  }

  // Generate chart mock history from recent analyses for Recharts visualization
  const scoreHistory = (data.recent_analyses || []).map((item, index) => ({
    name: `Analysis #${item.id}`,
    overall: item.overall_score,
    ats: item.ats_score,
    date: new Date(item.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
  })).reverse();

  // Skill distribution chart data derived from backend average stats
  const skillCategoryData = [
    { category: 'ATS Compliance', score: data.average_ats_score || 75 },
    { category: 'Overall Score', score: data.average_score || 72 },
    { category: 'Latest Match', score: data.latest_job_match_score || 80 },
  ];

  return (
    <div>
      <div className="dashboard-header" style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: '2rem', marginBottom: 4 }}>Dashboard</h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          Track your resume quality, ATS readiness, and job match metrics over time.
        </p>
      </div>

      {/* ===== STATS GRID WITH ANIMATED COUNTERS ===== */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="label">Total Resumes</div>
          <div className="value" style={{ color: 'var(--accent)' }}>{data.total_resumes}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>Uploaded files</div>
        </div>

        <div className="stat-card">
          <div className="label">Total Analyses</div>
          <div className="value" style={{ color: 'var(--purple)' }}>{data.total_analyses}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>AI evaluations</div>
        </div>

        <div className="stat-card">
          <div className="label">Average ATS Score</div>
          <div className="value" style={{ color: data.average_ats_score >= 70 ? 'var(--success)' : 'var(--warning)' }}>
            {data.average_ats_score ? `${Math.round(data.average_ats_score)}/100` : '—'}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>Rule-based compliance</div>
        </div>

        <div className="stat-card">
          <div className="label">Average Resume Score</div>
          <div className="value" style={{ color: data.average_score >= 70 ? 'var(--success)' : 'var(--warning)' }}>
            {data.average_score ? `${Math.round(data.average_score)}/100` : '—'}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>AI quality score</div>
        </div>

        <div className="stat-card">
          <div className="label">Latest Job Match</div>
          <div className="value" style={{ color: data.latest_job_match_score >= 70 ? 'var(--success)' : 'var(--purple)' }}>
            {data.latest_job_match_score ? `${Math.round(data.latest_job_match_score)}%` : '—'}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>Description alignment</div>
        </div>
      </div>

      {/* ===== RECHARTS ANALYTICS ===== */}
      {scoreHistory.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20, marginBottom: 32 }}>
          <div className="card">
            <h3 style={{ fontSize: '1rem', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <BarChart2 size={18} className="text-accent" /> Score History Progress
            </h3>
            <div style={{ width: '100%', height: 220 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={scoreHistory}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={12} />
                  <YAxis domain={[0, 100]} stroke="var(--text-muted)" fontSize={12} />
                  <Tooltip />
                  <Line type="monotone" dataKey="overall" name="Overall Score" stroke="var(--accent)" strokeWidth={2.5} dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="ats" name="ATS Score" stroke="var(--success)" strokeWidth={2} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="card">
            <h3 style={{ fontSize: '1rem', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Award size={18} className="text-purple" /> Score Distribution
            </h3>
            <div style={{ width: '100%', height: 220 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={skillCategoryData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="category" stroke="var(--text-muted)" fontSize={12} />
                  <YAxis domain={[0, 100]} stroke="var(--text-muted)" fontSize={12} />
                  <Tooltip />
                  <Bar dataKey="score" fill="var(--purple)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      ) : (
        <div className="card text-center p-8 mb-6" style={{ background: 'var(--bg-subtle)' }}>
          <Sparkles size={36} style={{ color: 'var(--accent)', margin: '0 auto 12px', opacity: 0.8 }} />
          <h3 style={{ fontSize: '1.1rem', marginBottom: 6 }}>No Resume Analyses Yet</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: 20 }}>
            Upload your first resume to view interactive score charts and AI recommendations.
          </p>
          <Link to="/upload">
            <Button variant="primary" icon={UploadCloud}>
              Upload Your First Resume
            </Button>
          </Link>
        </div>
      )}

      {/* ===== QUICK ACTIONS ===== */}
      <h2 style={{ fontSize: '1.25rem', marginBottom: 16 }}>Quick Actions</h2>
      <div className="stats-grid" style={{ marginBottom: 32 }}>
        <Link to="/upload" style={{ textDecoration: 'none' }}>
          <div className="stat-card" style={{ cursor: 'pointer' }}>
            <UploadCloud size={24} style={{ color: 'var(--accent)', marginBottom: 12 }} />
            <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)' }}>Upload Resume</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>PDF or DOCX file</div>
          </div>
        </Link>

        <Link to="/jobs" style={{ textDecoration: 'none' }}>
          <div className="stat-card" style={{ cursor: 'pointer' }}>
            <Plus size={24} style={{ color: 'var(--purple)', marginBottom: 12 }} />
            <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)' }}>Add Job Description</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Target position description</div>
          </div>
        </Link>

        <Link to="/jobs/match" style={{ textDecoration: 'none' }}>
          <div className="stat-card" style={{ cursor: 'pointer' }}>
            <TrendingUp size={24} style={{ color: 'var(--success)', marginBottom: 12 }} />
            <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)' }}>Run Job Matcher</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Calculate fit percentage</div>
          </div>
        </Link>
      </div>

      {/* ===== RECENT ANALYSES ===== */}
      {data.recent_analyses?.length > 0 && (
        <>
          <div className="card-header" style={{ marginBottom: 16 }}>
            <h2 style={{ fontSize: '1.25rem' }}>Recent Analyses</h2>
            <Link to="/history" style={{ fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: 4 }}>
              View All <ArrowRight size={14} />
            </Link>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {data.recent_analyses.map((item) => (
              <Link
                key={item.id}
                to={`/analysis/detail/${item.id}`}
                className="card"
                style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', textDecoration: 'none' }}
              >
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <FileText size={16} className="text-accent" />
                    <span>Analysis #{item.id}</span>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 2 }}>
                    Resume #{item.resume_id} — {new Date(item.created_at).toLocaleDateString()}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>ATS Score</div>
                    <div style={{ fontWeight: 700, color: item.ats_score >= 70 ? 'var(--success)' : 'var(--warning)' }}>
                      {Math.round(item.ats_score)}/100
                    </div>
                  </div>
                  <div className={`score-badge sm ${item.overall_score >= 70 ? 'score-high' : item.overall_score >= 45 ? 'score-medium' : 'score-low'}`}>
                    {Math.round(item.overall_score)}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
