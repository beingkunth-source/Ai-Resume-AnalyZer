import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { analysisAPI } from '../services/api';
import { ArrowLeft, CheckCircle2, AlertTriangle, Lightbulb, Award } from 'lucide-react';
import toast from 'react-hot-toast';
import ScoreCard from '../components/ScoreCard';
import ProgressBar from '../components/ProgressBar';
import SkillBadge from '../components/SkillBadge';
import RecommendationCard from '../components/RecommendationCard';
import LoadingState from '../components/LoadingState';

export default function AnalysisDetail() {
  const { analysisId } = useParams();
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    analysisAPI
      .get(analysisId)
      .then((res) => setAnalysis(res.data))
      .catch((err) => toast.error(err.message || 'Failed to load analysis details'))
      .finally(() => setLoading(false));
  }, [analysisId]);

  if (loading) return <LoadingState type="page" />;
  if (!analysis) return <div className="card text-center p-8"><h3>Analysis Record Not Found</h3></div>;

  const scores = analysis.scores || {};

  return (
    <div>
      <Link
        to="/history"
        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 20, color: 'var(--text-secondary)' }}
      >
        <ArrowLeft size={16} /> Back to History
      </Link>

      <div className="card-header" style={{ marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', marginBottom: 4 }}>Analysis Record #{analysisId}</h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            Resume #{analysis.resume_id} — Created on {new Date(analysis.created_at).toLocaleString()}
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20, marginBottom: 24 }}>
        <ScoreCard title="Overall Score" score={scores.overall || 0} size="lg" />
        <ScoreCard title="ATS Score" score={scores.ats || 0} size="lg" atsChecks={analysis.ats_checks} />
      </div>

      <div className="card mb-6" style={{ marginBottom: 24 }}>
        <h3 style={{ fontSize: '1.1rem', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Award size={18} className="text-accent" /> Score Breakdown
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
          <ProgressBar label="Skills" value={scores.skills} color="var(--accent)" />
          <ProgressBar label="Experience" value={scores.experience} color="var(--purple)" />
          <ProgressBar label="Education" value={scores.education} color="var(--success)" />
          <ProgressBar label="Projects" value={scores.projects} color="var(--warning)" />
          <ProgressBar label="Formatting" value={scores.formatting} color="var(--teal)" />
          <ProgressBar label="Keywords" value={scores.keywords} color="var(--accent)" />
        </div>
      </div>

      {analysis.weaknesses?.length > 0 && (
        <div className="card mb-6" style={{ marginBottom: 24 }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: 16, color: 'var(--warning)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <AlertTriangle size={20} /> Areas for Improvement
          </h3>
          {analysis.weaknesses.map((w, idx) => (
            <RecommendationCard key={idx} weakness={w} />
          ))}
        </div>
      )}

      {analysis.recommendations?.length > 0 && (
        <div className="card" style={{ background: 'var(--accent-light)', borderColor: 'var(--accent-border)' }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: 14, color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Lightbulb size={20} /> AI Recommendations
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {analysis.recommendations.map((r, idx) => (
              <div key={idx} style={{ fontSize: '0.9rem' }}>
                • {typeof r === 'string' ? r : r.recommendation || JSON.stringify(r)}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
