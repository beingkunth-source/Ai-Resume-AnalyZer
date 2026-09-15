import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { resumeAPI, jobsAPI } from '../services/api';
import {
  ArrowLeft,
  TrendingUp,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Lightbulb,
  Plus,
  Briefcase,
  Target,
} from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '../components/Button';
import Card from '../components/Card';
import ScoreCard from '../components/ScoreCard';
import SkillBadge from '../components/SkillBadge';
import LoadingState from '../components/LoadingState';

export default function JobMatch() {
  const [searchParams] = useSearchParams();
  const [resumes, setResumes] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [resumeId, setResumeId] = useState(searchParams.get('resume_id') || '');
  const [jobId, setJobId] = useState(searchParams.get('job_id') || '');
  const [matchResult, setMatchResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [matching, setMatching] = useState(false);

  // New inline job creation state
  const [showCreateJob, setShowCreateJob] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCompany, setNewCompany] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [creatingJob, setCreatingJob] = useState(false);

  const loadInitialData = async () => {
    try {
      const [resumesRes, jobsRes] = await Promise.all([resumeAPI.list(), jobsAPI.list()]);
      const resPayload = resumesRes?.data?.data || resumesRes?.data || resumesRes;
      const resumesList = Array.isArray(resPayload) ? resPayload : (resPayload?.data || []);
      const jobsPayload = jobsRes?.data?.data || jobsRes?.data || jobsRes;
      const jobsList = Array.isArray(jobsPayload) ? jobsPayload : (jobsPayload?.data || []);

      setResumes(resumesList);
      setJobs(jobsList);
      if (resumesList.length > 0 && !resumeId) setResumeId(resumesList[0].id);
      if (jobsList.length > 0 && !jobId) setJobId(jobsList[0].id);
    } catch (err) {
      toast.error('Failed to load data for matching');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  const handleCreateJob = async (e) => {
    e.preventDefault();
    if (!newTitle.trim() || newDesc.trim().length < 30) {
      toast.error('Please enter a job title and description (at least 30 characters)');
      return;
    }
    setCreatingJob(true);
    try {
      const res = await jobsAPI.create({ title: newTitle, company: newCompany, description: newDesc });
      const createdJob = res?.data?.data || res?.data || res;
      toast.success('Job description created!');
      setJobs((prev) => [createdJob, ...prev]);
      setJobId(createdJob.id);
      setShowCreateJob(false);
      setNewTitle('');
      setNewCompany('');
      setNewDesc('');
    } catch (err) {
      toast.error(err.message || 'Failed to create job description');
    } finally {
      setCreatingJob(false);
    }
  };

  const handleMatch = async (e) => {
    e.preventDefault();
    if (!resumeId || !jobId) {
      toast.error('Please select both a resume and a job description.');
      return;
    }
    setMatching(true);
    try {
      const res = await jobsAPI.match({ resume_id: parseInt(resumeId), job_id: parseInt(jobId) });
      const matchData = res?.data?.data || res?.data || res;
      setMatchResult(matchData);
      toast.success('Job match calculation complete!');
    } catch (err) {
      toast.error(err.message || 'Matching failed');
    } finally {
      setMatching(false);
    }
  };

  if (loading) return <LoadingState type="page" />;

  return (
    <div>
      <Link
        to="/jobs"
        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 20, color: 'var(--text-secondary)' }}
      >
        <ArrowLeft size={16} /> Back to Job Descriptions
      </Link>

      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: '1.8rem', marginBottom: 4 }}>Job Matcher</h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          Compare your resume directly against target job descriptions to identify missing skills and keyword coverage.
        </p>
      </div>

      {/* ===== MATCH SELECTION CARD ===== */}
      <Card className="mb-6" style={{ marginBottom: 28 }}>
        <form onSubmit={handleMatch}>
          <div className="two-col" style={{ marginBottom: 20 }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Target Resume *</label>
              <select
                className="form-select"
                value={resumeId}
                onChange={(e) => setResumeId(e.target.value)}
                required
              >
                <option value="">Select a resume</option>
                {resumes.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.filename}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <label className="form-label" style={{ marginBottom: 0 }}>Job Description *</label>
                <button
                  type="button"
                  style={{ background: 'none', border: 'none', color: 'var(--accent)', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}
                  onClick={() => setShowCreateJob(!showCreateJob)}
                >
                  + Add New Job
                </button>
              </div>
              <select
                className="form-select"
                value={jobId}
                onChange={(e) => setJobId(e.target.value)}
                required
              >
                <option value="">Select a job description</option>
                {jobs.map((j) => (
                  <option key={j.id} value={j.id}>
                    {j.title} {j.company ? `at ${j.company}` : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <Button type="submit" variant="primary" loading={matching} icon={TrendingUp}>
            {matching ? 'Calculating Match Score...' : 'Analyze Job Match'}
          </Button>
        </form>
      </Card>

      {/* ===== INLINE JOB CREATION MODAL/FORM ===== */}
      {showCreateJob && (
        <Card className="mb-6" style={{ marginBottom: 28, background: 'var(--bg-subtle)' }}>
          <h3 style={{ fontSize: '1rem', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Briefcase size={18} className="text-accent" /> Create Target Job Description
          </h3>
          <form onSubmit={handleCreateJob}>
            <div className="two-col">
              <div className="form-group">
                <label className="form-label">Job Title *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Senior Frontend Engineer"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Company Name</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Google"
                  value={newCompany}
                  onChange={(e) => setNewCompany(e.target.value)}
                />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Job Description & Requirements *</label>
              <textarea
                className="form-textarea"
                placeholder="Paste the full job description, qualifications, and required skills..."
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                rows={5}
                required
              />
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <Button type="submit" variant="primary" size="sm" loading={creatingJob}>
                Save & Select Job
              </Button>
              <Button type="button" variant="secondary" size="sm" onClick={() => setShowCreateJob(false)}>
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* ===== MATCH RESULTS DISPLAY ===== */}
      {matchResult && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20, marginBottom: 24 }}>
            <ScoreCard
              title="Job Match Score"
              score={matchResult.job_match_score}
              size="lg"
              subtitle={`Alignment based on requested skills, keywords, and domain requirements.`}
            />

            <Card className="flex flex-col justify-center">
              <h3 style={{ fontSize: '1rem', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Target size={18} className="text-accent" /> Alignment Statistics
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: '0.9rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Matched Skills:</span>
                  <span style={{ fontWeight: 700, color: 'var(--success)' }}>{matchResult.matched_skills?.length || 0}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Missing Skills:</span>
                  <span style={{ fontWeight: 700, color: 'var(--danger)' }}>{matchResult.missing_skills?.length || 0}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Matched Keywords:</span>
                  <span style={{ fontWeight: 700, color: 'var(--accent)' }}>{matchResult.matched_keywords?.length || 0}</span>
                </div>
              </div>
            </Card>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 24, marginBottom: 24 }}>
            {/* MATCHED vs MISSING SKILLS */}
            <Card>
              <h3 style={{ fontSize: '1rem', marginBottom: 14, color: 'var(--success)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <CheckCircle2 size={18} /> Matched Skills ({matchResult.matched_skills?.length || 0})
              </h3>
              <div className="tag-grid" style={{ marginBottom: 20 }}>
                {matchResult.matched_skills?.length > 0 ? (
                  matchResult.matched_skills.map((s, idx) => <SkillBadge key={idx} name={s} variant="green" />)
                ) : (
                  <span className="text-muted text-sm">No direct skill matches</span>
                )}
              </div>

              {matchResult.partially_matched_skills?.length > 0 && (
                <>
                  <h3 style={{ fontSize: '1rem', marginBottom: 14, color: 'var(--warning)', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <AlertTriangle size={18} /> Partially Matched Skills
                  </h3>
                  <div className="tag-grid" style={{ marginBottom: 20 }}>
                    {matchResult.partially_matched_skills.map((s, idx) => <SkillBadge key={idx} name={s} variant="yellow" />)}
                  </div>
                </>
              )}

              <h3 style={{ fontSize: '1rem', marginBottom: 14, color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <XCircle size={18} /> Missing Skills ({matchResult.missing_skills?.length || 0})
              </h3>
              <div className="tag-grid">
                {matchResult.missing_skills?.length > 0 ? (
                  matchResult.missing_skills.map((s, idx) => <SkillBadge key={idx} name={s} variant="red" />)
                ) : (
                  <span className="text-success text-sm">All required skills present!</span>
                )}
              </div>
            </Card>

            {/* KEYWORDS COVERAGE */}
            <Card>
              <h3 style={{ fontSize: '1rem', marginBottom: 14 }}>Matched Keywords</h3>
              <div className="tag-grid" style={{ marginBottom: 20 }}>
                {matchResult.matched_keywords?.length > 0 ? (
                  matchResult.matched_keywords.map((k, idx) => <SkillBadge key={idx} name={k} variant="blue" />)
                ) : (
                  <span className="text-muted text-sm">No matched keywords</span>
                )}
              </div>

              <h3 style={{ fontSize: '1rem', marginBottom: 14 }}>Missing Keywords</h3>
              <div className="tag-grid">
                {matchResult.missing_keywords?.length > 0 ? (
                  matchResult.missing_keywords.map((k, idx) => <SkillBadge key={idx} name={k} variant="red" />)
                ) : (
                  <span className="text-success text-sm">All key terms covered!</span>
                )}
              </div>
            </Card>
          </div>

          {/* WHY YOU MATCH & GAPS */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 24, marginBottom: 24 }}>
            {matchResult.strengths_for_this_job?.length > 0 && (
              <Card>
                <h3 style={{ fontSize: '1rem', marginBottom: 14, color: 'var(--success)' }}>Why You Match</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {matchResult.strengths_for_this_job.map((item, idx) => (
                    <div key={idx} className="tag green" style={{ width: '100%', borderRadius: 8 }}>
                      ✓ {item}
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {matchResult.gaps_for_this_job?.length > 0 && (
              <Card>
                <h3 style={{ fontSize: '1rem', marginBottom: 14, color: 'var(--danger)' }}>Where You Have Gaps</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {matchResult.gaps_for_this_job.map((item, idx) => (
                    <div key={idx} className="tag red" style={{ width: '100%', borderRadius: 8 }}>
                      • {item}
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>

          {/* JOB MATCH RECOMMENDATIONS */}
          {matchResult.recommendations?.length > 0 && (
            <Card style={{ background: 'var(--accent-light)', borderColor: 'var(--accent-border)' }}>
              <h3 style={{ fontSize: '1.1rem', marginBottom: 14, color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Lightbulb size={20} /> How to Improve Your Resume for This Job
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {matchResult.recommendations.map((r, idx) => (
                  <div key={idx} style={{ fontSize: '0.9rem', color: 'var(--text-primary)', display: 'flex', gap: 8 }}>
                    <span style={{ color: 'var(--accent)', fontWeight: 700 }}>•</span>
                    <span>{r}</span>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
