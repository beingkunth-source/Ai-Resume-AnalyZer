import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { resumeAPI, analysisAPI } from '../services/api';
import { FileText, Trash2, BarChart3, Clock, UploadCloud, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '../components/Button';
import LoadingState from '../components/LoadingState';

export default function Resumes() {
  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [analyzingId, setAnalyzingId] = useState(null);

  const loadResumes = () => {
    resumeAPI
      .list()
      .then((res) => setResumes(res.data))
      .catch(() => toast.error('Failed to load resumes'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadResumes();
  }, []);

  const handleDelete = async (id, e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this resume and all its analyses?')) return;
    try {
      await resumeAPI.delete(id);
      setResumes((prev) => prev.filter((r) => r.id !== id));
      toast.success('Resume deleted successfully');
    } catch (err) {
      toast.error(err.message || 'Delete failed');
    }
  };

  const handleAnalyze = async (id, e) => {
    e.preventDefault();
    e.stopPropagation();
    setAnalyzingId(id);
    try {
      await analysisAPI.create(id, true);
      toast.success('Analysis complete!');
      window.location.href = `/analysis/${id}`;
    } catch (err) {
      toast.error(err.message || 'Analysis failed');
    } finally {
      setAnalyzingId(null);
    }
  };

  if (loading) return <LoadingState type="page" />;

  return (
    <div>
      <div className="card-header" style={{ marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', marginBottom: 4 }}>My Resumes</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Manage your uploaded resumes and run AI analyses.</p>
        </div>
        <Link to="/upload">
          <Button variant="primary" icon={Plus}>
            Upload Resume
          </Button>
        </Link>
      </div>

      {resumes.length === 0 ? (
        <div className="card text-center p-12 mt-4" style={{ background: 'var(--bg-white)' }}>
          <FileText size={48} style={{ color: 'var(--text-muted)', margin: '0 auto 12px' }} />
          <h3 style={{ fontSize: '1.25rem', marginBottom: 6 }}>No Resumes Uploaded Yet</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 20 }}>
            Upload your first resume in PDF or DOCX format to receive an AI analysis.
          </p>
          <Link to="/upload">
            <Button variant="primary" icon={UploadCloud}>
              Upload First Resume
            </Button>
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {resumes.map((r) => (
            <div key={r.id} className="card" style={{ padding: '18px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <FileText size={18} className="text-accent" />
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.filename}</span>
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span>
                    <Clock size={12} style={{ display: 'inline', marginRight: 4 }} />
                    {new Date(r.created_at).toLocaleDateString()}
                  </span>
                  <span>• {r.text_length.toLocaleString()} characters extracted</span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                <Button
                  size="sm"
                  variant="outline"
                  icon={BarChart3}
                  onClick={(e) => handleAnalyze(r.id, e)}
                  loading={analyzingId === r.id}
                >
                  {analyzingId === r.id ? 'Analyzing...' : 'Analyze'}
                </Button>
                <Link to={`/analysis/${r.id}`}>
                  <Button size="sm" variant="secondary">
                    View Results
                  </Button>
                </Link>
                <button
                  type="button"
                  className="btn-logout"
                  onClick={(e) => handleDelete(r.id, e)}
                  title="Delete Resume"
                  style={{ padding: 8 }}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
