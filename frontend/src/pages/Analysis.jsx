import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { analysisAPI } from '../services/api';
import {
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  FileText,
  User,
  Sparkles,
  Award,
  Layers,
} from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '../components/Button';
import ScoreCard from '../components/ScoreCard';
import ProgressBar from '../components/ProgressBar';
import SkillBadge from '../components/SkillBadge';
import RecommendationCard from '../components/RecommendationCard';
import LoadingState from '../components/LoadingState';
import AIAnalysisModal from '../components/AIAnalysisModal';

export default function Analysis() {
  const { resumeId } = useParams();
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);

  const runAnalysis = async (force = false) => {
    setAnalyzing(true);
    try {
      const res = await analysisAPI.create(resumeId, force);
      setAnalysis(res.data);
    } catch (err) {
      toast.error(err.message || 'Analysis failed');
    } finally {
      setAnalyzing(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    runAnalysis();
  }, [resumeId]);

  if (loading) return <LoadingState type="page" />;
  if (!analysis) return <div className="card text-center p-8"><h3>Analysis not found</h3></div>;

  const scores = analysis.scores || {};
  const candidateInfo = analysis.candidate_information || {};

  return (
    <div>
      <AIAnalysisModal isOpen={analyzing} />

      <Link
        to="/resumes"
        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 20, color: 'var(--text-secondary)' }}
      >
        <ArrowLeft size={16} /> Back to Resumes
      </Link>

      <div className="card-header" style={{ marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', marginBottom: 4 }}>Resume Analysis Report</h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            Resume #{resumeId} — Analyzed on {new Date(analysis.created_at).toLocaleString()}
          </p>
        </div>
        <Button variant="secondary" icon={Sparkles} onClick={() => runAnalysis(true)} loading={analyzing}>
          Re-Analyze
        </Button>
      </div>

      {/* ===== OVERALL SCORE & ATS CHECKLIST GRID ===== */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20, marginBottom: 24 }}>
        <ScoreCard
          title="Overall Resume Score"
          score={scores.overall || 0}
          size="lg"
          subtitle="Weighted combination of ATS compliance, skill coverage, and quantifiable impact."
        />

        <ScoreCard
          title="ATS Rule Compatibility"
          score={scores.ats || 0}
          size="lg"
          atsChecks={analysis.ats_checks}
        />
      </div>

      {/* ===== INDIVIDUAL SCORES BREAKDOWN ===== */}
      <div className="card mb-6" style={{ marginBottom: 24 }}>
        <h3 style={{ fontSize: '1.1rem', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Award size={18} className="text-accent" /> Section Score Breakdown
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
          <ProgressBar label="Technical & Soft Skills" value={scores.skills} color="var(--accent)" />
          <ProgressBar label="Work Experience" value={scores.experience} color="var(--purple)" />
          <ProgressBar label="Education & Academics" value={scores.education} color="var(--success)" />
          <ProgressBar label="Projects Quality" value={scores.projects} color="var(--warning)" />
          <ProgressBar label="Formatting & Layout" value={scores.formatting} color="var(--teal)" />
          <ProgressBar label="Keyword Match Density" value={scores.keywords} color="var(--accent)" />
          <ProgressBar label="Quantifiable Impact" value={scores.impact} color="var(--danger)" />
        </div>
      </div>

      {/* ===== CANDIDATE INFO ===== */}
      {Object.keys(candidateInfo).length > 0 && (
        <div className="card mb-6" style={{ marginBottom: 24 }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
            <User size={18} className="text-accent" /> Candidate Information
          </h3>
          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', fontSize: '0.9rem' }}>
            {candidateInfo.name && <div><strong>Name:</strong> {candidateInfo.name}</div>}
            {candidateInfo.email && <div><strong>Email:</strong> {candidateInfo.email}</div>}
            {candidateInfo.phone && <div><strong>Phone:</strong> {candidateInfo.phone}</div>}
          </div>
        </div>
      )}

      {/* ===== TWO COLUMN ANALYSIS GRID ===== */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 24, marginBottom: 24 }}>
        {/* SKILLS DETECTED */}
        <div className="card">
          <h3 style={{ fontSize: '1rem', marginBottom: 14 }}>Technical Skills Found</h3>
          <div className="tag-grid">
            {analysis.technical_skills?.length > 0 ? (
              analysis.technical_skills.map((skill, idx) => <SkillBadge key={idx} name={skill} variant="blue" />)
            ) : (
              <span className="text-muted text-sm">No technical skills detected</span>
            )}
          </div>

          <h3 style={{ fontSize: '1rem', marginTop: 20, marginBottom: 14 }}>Soft Skills Found</h3>
          <div className="tag-grid">
            {analysis.soft_skills?.length > 0 ? (
              analysis.soft_skills.map((skill, idx) => <SkillBadge key={idx} name={skill} variant="purple" />)
            ) : (
              <span className="text-muted text-sm">No soft skills detected</span>
            )}
          </div>
        </div>

        {/* STRENGTHS & MISSING SECTIONS */}
        <div className="card">
          <h3 style={{ fontSize: '1rem', marginBottom: 14, color: 'var(--success)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <CheckCircle2 size={18} /> Strengths
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 20 }}>
            {analysis.strengths?.map((s, idx) => (
              <div key={idx} className="tag green" style={{ width: '100%', borderRadius: 8 }}>
                ✓ {s}
              </div>
            ))}
          </div>

          {analysis.missing_sections?.length > 0 && (
            <>
              <h3 style={{ fontSize: '1rem', marginBottom: 14, color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <AlertTriangle size={18} /> Missing Resume Sections
              </h3>
              <div className="tag-grid">
                {analysis.missing_sections.map((m, idx) => (
                  <SkillBadge key={idx} name={m} variant="red" />
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ===== WEAKNESSES & ACTIONABLE RECOMMENDATIONS ===== */}
      {analysis.weaknesses?.length > 0 && (
        <div className="card mb-6" style={{ marginBottom: 24 }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--warning)' }}>
            <AlertTriangle size={20} /> Weaknesses & Actionable Improvements
          </h3>
          {analysis.weaknesses.map((w, idx) => (
            <RecommendationCard key={idx} weakness={w} />
          ))}
        </div>
      )}

      {/* ===== AI RECOMMENDATIONS ===== */}
      {analysis.recommendations?.length > 0 && (
        <div className="card" style={{ background: 'var(--accent-light)', borderColor: 'var(--accent-border)' }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: 14, color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Lightbulb size={20} /> Executive Summary Recommendations
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {analysis.recommendations.map((r, idx) => (
              <div key={idx} style={{ fontSize: '0.9rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                <span style={{ color: 'var(--accent)', fontWeight: 700 }}>•</span>
                <span>{typeof r === 'string' ? r : r.recommendation || JSON.stringify(r)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
