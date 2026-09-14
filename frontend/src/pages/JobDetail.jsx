import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { jobsAPI, resumeAPI, applicationsAPI } from '../services/api';
import { 
  BuildingOffice2Icon, 
  MapPinIcon, 
  BanknotesIcon, 
  SparklesIcon, 
  CheckCircleIcon, 
  XCircleIcon,
  ArrowTopRightOnSquareIcon,
  BookmarkIcon,
  ArrowLeftIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

export default function JobDetail() {
  const { id } = useParams();
  const [job, setJob] = useState(null);
  const [resumes, setResumes] = useState([]);
  const [selectedResumeId, setSelectedResumeId] = useState(null);
  const [matchData, setMatchData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [matchingLoading, setMatchingLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isSaved, setIsSaved] = useState(false);
  const [status, setStatus] = useState('Interested');

  useEffect(() => {
    fetchInitialData();
  }, [id]);

  const fetchInitialData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [jobRes, resumeRes] = await Promise.all([
        jobsAPI.get(id),
        resumeAPI.list()
      ]);
      setJob(jobRes.data);
      const list = resumeRes.data || [];
      setResumes(list);
      if (list.length > 0) {
        setSelectedResumeId(list[0].id);
        runMatch(list[0].id, jobRes.data);
      }
    } catch (err) {
      setError(err.message || "Failed to load job details.");
    } finally {
      setLoading(false);
    }
  };

  const runMatch = async (resumeId, targetJob) => {
    setMatchingLoading(true);
    try {
      const matchRes = await jobsAPI.match({
        resume_id: resumeId,
        job_id: targetJob?.id,
        job_object: targetJob,
      });
      setMatchData(matchRes.data);
    } catch (err) {
      console.error("Match error:", err);
    } finally {
      setMatchingLoading(false);
    }
  };

  const handleResumeChange = (newResumeId) => {
    setSelectedResumeId(newResumeId);
    if (job) {
      runMatch(newResumeId, job);
    }
  };

  const handleSaveToggle = async () => {
    if (!job) return;
    const jId = job.id || id;
    try {
      if (isSaved) {
        await jobsAPI.unsave(jId);
        setIsSaved(false);
      } else {
        await jobsAPI.save(jId);
        setIsSaved(true);
      }
    } catch (err) {
      console.error("Save error:", err);
    }
  };

  const handleStatusTrack = async (newStatus) => {
    if (!job) return;
    setStatus(newStatus);
    try {
      await applicationsAPI.track({ jobId: Number(job.id || id), status: newStatus });
    } catch (err) {
      console.error("Application track error:", err);
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto py-12 px-4 space-y-6 animate-pulse">
        <div className="h-8 bg-stone-100 rounded-md w-1/3"></div>
        <div className="h-32 bg-stone-100 rounded-2xl w-full"></div>
        <div className="h-64 bg-stone-100 rounded-2xl w-full"></div>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4 text-center">
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm mb-4 inline-flex items-center gap-2">
          <ExclamationTriangleIcon className="w-5 h-5" />
          <span>{error || "Job not found."}</span>
        </div>
        <div>
          <Link to="/jobs" className="text-emerald-600 font-semibold text-sm hover:underline">
            ← Back to Job Search
          </Link>
        </div>
      </div>
    );
  }

  const explanation = matchData?.explanation;
  const score = matchData?.match_score ? Math.round(matchData.match_score) : null;
  const matchedSkills = matchData?.matched_skills || [];
  const missingSkills = matchData?.missing_skills || [];

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      {/* Top Back Nav */}
      <div>
        <Link to="/jobs" className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-500 hover:text-stone-800 transition-colors">
          <ArrowLeftIcon className="w-4 h-4" />
          Back to Jobs
        </Link>
      </div>

      {/* Hero Job Banner */}
      <div className="bg-white rounded-2xl border border-stone-200/80 p-8 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 border-b border-stone-100 pb-6">
          <div className="space-y-2">
            <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              {job.source || 'Verified Vacancy'}
            </span>
            <h1 className="text-2xl md:text-3xl font-extrabold text-stone-900">
              {job.title}
            </h1>
            <div className="flex flex-wrap gap-4 text-sm font-semibold text-stone-600">
              <span className="flex items-center gap-1">
                <BuildingOffice2Icon className="w-4 h-4 text-stone-400" />
                {job.company}
              </span>
              <span className="flex items-center gap-1">
                <MapPinIcon className="w-4 h-4 text-stone-400" />
                {job.location}
              </span>
              {job.salary && (
                <span className="flex items-center gap-1 text-emerald-700 font-bold">
                  <BanknotesIcon className="w-4 h-4 text-emerald-600" />
                  {job.salary}
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={handleSaveToggle}
              className={`px-4 py-2.5 rounded-xl border font-semibold text-xs transition-colors flex items-center gap-1.5 ${isSaved ? 'bg-emerald-50 border-emerald-300 text-emerald-700' : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-50'}`}
            >
              <BookmarkIcon className="w-4 h-4" />
              <span>{isSaved ? 'Saved' : 'Save Job'}</span>
            </button>

            <a
              href={job.url}
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-all flex items-center gap-2"
            >
              <span>Apply on Original Job Website</span>
              <ArrowTopRightOnSquareIcon className="w-4 h-4" />
            </a>
          </div>
        </div>

        {/* Resume Matcher Selection Bar */}
        {resumes.length > 0 && (
          <div className="flex items-center justify-between bg-stone-50 p-3 rounded-xl border border-stone-200 text-xs">
            <span className="font-semibold text-stone-600">Active Resume for Matching:</span>
            <select
              value={selectedResumeId || ''}
              onChange={(e) => handleResumeChange(Number(e.target.value))}
              className="font-semibold text-stone-800 bg-white border border-stone-200 rounded-lg p-1.5 cursor-pointer"
            >
              {resumes.map(r => (
                <option key={r.id} value={r.id}>{r.filename}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Match Breakdown Section */}
      {score !== null && (
        <div className="bg-white rounded-2xl border border-stone-200/80 p-8 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-stone-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 font-extrabold text-xl">
                {score}%
              </div>
              <div>
                <h2 className="text-lg font-bold text-stone-900">YOUR MATCH ANALYSIS</h2>
                <p className="text-xs text-stone-500">Calculated via 6-weight hybrid matching formula</p>
              </div>
            </div>

            <div className="text-right">
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-100 text-emerald-800">
                {matchData?.category || 'MATCH EVALUATION'}
              </span>
            </div>
          </div>

          {/* AI Recommendation Explanation */}
          {explanation && (
            <div className="bg-emerald-50/60 rounded-2xl border border-emerald-100 p-6 space-y-4">
              <div className="flex items-center gap-2 text-emerald-900 font-bold text-sm">
                <SparklesIcon className="w-5 h-5 text-emerald-600" />
                <span>AI Recommendation Rationale: {explanation.recommendation}</span>
              </div>
              <p className="text-xs text-stone-700 leading-relaxed font-medium">
                {explanation.reason}
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div>
                  <h4 className="text-xs font-bold text-emerald-800 uppercase tracking-wider mb-1">
                    Strengths
                  </h4>
                  <ul className="space-y-1 text-xs text-stone-700">
                    {explanation.strengths?.map((st, i) => (
                      <li key={i} className="flex items-center gap-1.5">
                        <CheckCircleIcon className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>{st}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-amber-800 uppercase tracking-wider mb-1">
                    Potential Gaps
                  </h4>
                  <ul className="space-y-1 text-xs text-stone-700">
                    {explanation.gaps?.map((gap, i) => (
                      <li key={i} className="flex items-center gap-1.5">
                        <XCircleIcon className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                        <span>{gap}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Matched vs Missing Skills Badges */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            <div>
              <h3 className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-3">
                Matched Skills ({matchedSkills.length})
              </h3>
              <div className="flex flex-wrap gap-2">
                {matchedSkills.map((sk, i) => (
                  <span key={i} className="px-3 py-1 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-1">
                    <CheckCircleIcon className="w-3.5 h-3.5 text-emerald-600" />
                    {sk}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-3">
                Missing Skills ({missingSkills.length})
              </h3>
              <div className="flex flex-wrap gap-2">
                {missingSkills.map((sk, i) => (
                  <span key={i} className="px-3 py-1 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-center gap-1">
                    <XCircleIcon className="w-3.5 h-3.5 text-rose-500" />
                    {sk}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Full Job Description */}
      <div className="bg-white rounded-2xl border border-stone-200/80 p-8 shadow-sm space-y-4">
        <h2 className="text-lg font-bold text-stone-900 border-b border-stone-100 pb-3">
          Full Job Description
        </h2>
        <div className="text-sm text-stone-700 leading-relaxed whitespace-pre-line font-normal">
          {job.description}
        </div>
      </div>
    </div>
  );
}
