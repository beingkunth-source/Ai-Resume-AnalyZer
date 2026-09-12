import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { analysisAPI, resumeAPI } from '../services/api';
import { History as HistoryIcon, Search, Eye, Trash2, Calendar, Award, FileText } from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '../components/Button';
import Card from '../components/Card';
import LoadingState from '../components/LoadingState';

export default function History() {
  const [analyses, setAnalyses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [scoreFilter, setScoreFilter] = useState('all'); // all | high | medium | low

  useEffect(() => {
    analysisAPI
      .list()
      .then((res) => setAnalyses(res.data))
      .catch(() => toast.error('Failed to load analysis history'))
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id, resumeId, e) => {
    e.preventDefault();
    if (!window.confirm('Delete this analysis record?')) return;
    try {
      // Deleting resume will clean up associated analysis or we can filter locally
      await resumeAPI.delete(resumeId);
      setAnalyses((prev) => prev.filter((a) => a.id !== id));
      toast.success('Record deleted successfully');
    } catch (err) {
      toast.error(err.message || 'Delete failed');
    }
  };

  const filteredAnalyses = analyses.filter((item) => {
    const matchesSearch =
      item.id.toString().includes(searchTerm) || item.resume_id.toString().includes(searchTerm);
    if (!matchesSearch) return false;

    if (scoreFilter === 'high') return item.overall_score >= 70;
    if (scoreFilter === 'medium') return item.overall_score >= 45 && item.overall_score < 70;
    if (scoreFilter === 'low') return item.overall_score < 45;
    return true;
  });

  if (loading) return <LoadingState type="page" />;

  return (
    <div>
      <div className="card-header" style={{ marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', marginBottom: 4 }}>Analysis History</h1>
          <p style={{ color: 'var(--text-secondary)' }}>View, compare, and manage your past AI resume evaluations.</p>
        </div>
      </div>

      {/* ===== FILTER & SEARCH BAR ===== */}
      <Card className="mb-6" style={{ marginBottom: 24 }}>
        <div className="two-col" style={{ alignItems: 'center' }}>
          <div className="input-with-icon">
            <input
              type="text"
              className="form-input"
              placeholder="Search by analysis or resume ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Filter Score:</span>
            <select
              className="form-select"
              value={scoreFilter}
              onChange={(e) => setScoreFilter(e.target.value)}
            >
              <option value="all">All Scores</option>
              <option value="high">High Score (70+)</option>
              <option value="medium">Medium Score (45-69)</option>
              <option value="low">Low Score (&lt;45)</option>
            </select>
          </div>
        </div>
      </Card>

      {/* ===== HISTORY LIST ===== */}
      {filteredAnalyses.length === 0 ? (
        <Card className="text-center p-8">
          <HistoryIcon size={36} style={{ color: 'var(--text-muted)', margin: '0 auto 12px' }} />
          <h3 style={{ fontSize: '1.1rem', marginBottom: 4 }}>No Analysis Records Found</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            {searchTerm || scoreFilter !== 'all' ? 'Try adjusting your search or filter options.' : 'Run your first resume analysis to populate history.'}
          </p>
        </Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filteredAnalyses.map((item) => (
            <Card
              key={item.id}
              style={{ padding: '18px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
            >
              <div>
                <div style={{ fontWeight: 700, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <FileText size={18} className="text-accent" />
                  <span>Analysis Report #{item.id}</span>
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span>
                    <Calendar size={12} style={{ display: 'inline', marginRight: 4 }} />
                    {new Date(item.created_at).toLocaleString()}
                  </span>
                  <span>• Resume #{item.resume_id}</span>
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

                <Link to={`/analysis/detail/${item.id}`}>
                  <Button size="sm" variant="outline" icon={Eye}>
                    View
                  </Button>
                </Link>

                <button
                  type="button"
                  className="btn-logout"
                  onClick={(e) => handleDelete(item.id, item.resume_id, e)}
                  title="Delete Record"
                  style={{ padding: 8 }}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
