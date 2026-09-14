import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { jobsAPI, resumeAPI, applicationsAPI } from '../services/api';
import JobCard from '../components/JobCard';
import { 
  SparklesIcon, 
  UserCircleIcon, 
  BriefcaseIcon, 
  AcademicCapIcon, 
  AdjustmentsHorizontalIcon,
  ArrowPathIcon,
  CheckBadgeIcon,
  ExclamationTriangleIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';

export default function JobRecommended() {
  const [resumes, setResumes] = useState([]);
  const [selectedResumeId, setSelectedResumeId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [recommendationsData, setRecommendationsData] = useState(null);
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetchUserResumes();
  }, []);

  useEffect(() => {
    if (selectedResumeId) {
      loadRecommendations(selectedResumeId, 1);
    }
  }, [selectedResumeId]);

  const fetchUserResumes = async () => {
    try {
      setLoading(true);
      const res = await resumeAPI.list();
      const list = res.data || [];
      setResumes(list);
      if (list.length > 0) {
        setSelectedResumeId(list[0].id);
      } else {
        setLoading(false);
      }
    } catch (err) {
      setError(err.message || "Failed to load candidate resumes.");
      setLoading(false);
    }
  };

  const loadRecommendations = async (resumeId, targetPage = 1) => {
    setLoading(true);
    setError(null);
    try {
      const response = await jobsAPI.getRecommended(resumeId, targetPage, 20);
      setRecommendationsData(response.data);
      setPage(targetPage);
    } catch (err) {
      setError(err.message || "Failed to load personalized job recommendations.");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveToggle = async (jobItem) => {
    const jobId = jobItem.job_db_id || jobItem.job?.id;
    if (!jobId) return;
    if (jobItem.is_saved) {
      await jobsAPI.unsave(jobId);
    } else {
      await jobsAPI.save(jobId);
    }
  };

  const handleStatusChange = async (jobItem, newStatus) => {
    const jobId = jobItem.job_db_id;
    if (!jobId) return;
    try {
      await applicationsAPI.track({ jobId, status: newStatus });
    } catch (err) {
      console.error("Failed to update application status:", err);
    }
  };

  if (!loading && resumes.length === 0) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4 text-center">
        <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center mx-auto mb-4 text-emerald-600">
          <BriefcaseIcon className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-stone-900 mb-2">No Resume Found</h2>
        <p className="text-stone-600 mb-6 max-w-md mx-auto">
          Please upload your resume to generate personalized job recommendations matched to your skills and experience.
        </p>
        <Link
          to="/upload"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 text-white font-semibold shadow-sm hover:bg-emerald-700 transition-colors"
        >
          <SparklesIcon className="w-5 h-5" />
          Upload Resume Now
        </Link>
      </div>
    );
  }

  const profile = recommendationsData?.candidate_profile;
  const results = recommendationsData?.results || [];

  const bestMatches = results.filter(r => r.match_score >= 85);
  const goodMatches = results.filter(r => r.match_score >= 70 && r.match_score < 85);
  const potentialMatches = results.filter(r => r.match_score >= 50 && r.match_score < 70);

  // Extract skills market insights
  const allMatched = results.flatMap(r => r.matched_skills || []);
  const allMissing = results.flatMap(r => r.missing_skills || []);

  const topDemandedSkills = Array.from(new Set(allMatched)).slice(0, 6);
  const skillsToImprove = Array.from(new Set(allMissing)).slice(0, 5);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-stone-200 pb-6">
        <div>
          <div className="flex items-center gap-2 text-emerald-600 font-semibold text-sm mb-1">
            <img src="/hirelens-logo.png" alt="HireLens" className="w-4 h-4 object-contain shrink-0" />
            <span>AI Resume Matching Engine</span>
          </div>
          <h1 className="text-3xl font-extrabold text-stone-900 tracking-tight">
            Recommended Jobs
          </h1>
          <p className="text-stone-600 text-sm mt-1">
            Vacancies matched to your actual resume profile rather than generic listings.
          </p>
        </div>

        {/* Resume Selector */}
        {resumes.length > 1 && (
          <div className="flex items-center gap-3 bg-white p-2.5 rounded-2xl border border-stone-200 shadow-sm">
            <UserCircleIcon className="w-5 h-5 text-stone-400" />
            <span className="text-xs font-semibold text-stone-500">Active Resume:</span>
            <select
              value={selectedResumeId || ''}
              onChange={(e) => setSelectedResumeId(Number(e.target.value))}
              className="text-sm font-semibold text-stone-800 bg-transparent border-none focus:ring-0 cursor-pointer"
            >
              {resumes.map(r => (
                <option key={r.id} value={r.id}>{r.filename}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Candidate Profile Summary Banner */}
      {profile && (
        <div className="bg-white rounded-2xl border border-stone-200/80 p-6 shadow-sm flex flex-col md:flex-row gap-6 items-start justify-between">
          <div className="space-y-3 flex-1">
            <div className="flex items-center gap-2">
              <CheckBadgeIcon className="w-5 h-5 text-emerald-600" />
              <h2 className="text-lg font-bold text-stone-900">Personalized Job Profile</h2>
            </div>
            
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-xs font-semibold text-stone-400">Target Roles:</span>
              {profile.target_roles?.map((role, idx) => (
                <span key={idx} className="px-3 py-1 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold">
                  {role}
                </span>
              ))}
            </div>

            <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs text-stone-600 pt-2 border-t border-stone-100">
              <div className="flex items-center gap-1.5">
                <AcademicCapIcon className="w-4 h-4 text-stone-400" />
                <span>{profile.degree}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <BriefcaseIcon className="w-4 h-4 text-stone-400" />
                <span>{profile.experience_level} ({profile.years_of_experience} yrs)</span>
              </div>
              <div>
                <span className="text-stone-400">Mode: </span>
                <span className="font-semibold text-stone-800">{profile.work_mode_preference}</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => loadRecommendations(selectedResumeId, 1)}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-stone-200 hover:bg-stone-50 text-stone-700 font-semibold text-xs transition-colors shrink-0"
          >
            <ArrowPathIcon className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-600' : ''}`} />
            Refresh Matching
          </button>
        </div>
      )}

      {/* Skills Insights Dashboard Section (Req 35) */}
      {results.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-emerald-50/50 rounded-2xl border border-emerald-100 p-5">
            <h3 className="text-xs font-bold text-emerald-900 uppercase tracking-wider mb-2">
              Skills Employers Are Looking For
            </h3>
            <div className="flex flex-wrap gap-2">
              {topDemandedSkills.map((sk, i) => (
                <span key={i} className="px-2.5 py-1 rounded-lg bg-white border border-emerald-200 text-emerald-800 text-xs font-medium shadow-2xs">
                  ✓ {sk}
                </span>
              ))}
            </div>
          </div>

          <div className="bg-amber-50/50 rounded-2xl border border-amber-100 p-5">
            <h3 className="text-xs font-bold text-amber-900 uppercase tracking-wider mb-2">
              Skills You Should Improve
            </h3>
            <div className="flex flex-wrap gap-2">
              {skillsToImprove.map((sk, i) => (
                <span key={i} className="px-2.5 py-1 rounded-lg bg-white border border-amber-200 text-amber-800 text-xs font-medium shadow-2xs">
                  ⚡ {sk}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-center gap-3">
          <ExclamationTriangleIcon className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Loading Skeleton */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-white rounded-2xl border border-stone-200 p-6 h-64 animate-pulse space-y-4">
              <div className="h-6 bg-stone-100 rounded-md w-3/4"></div>
              <div className="h-4 bg-stone-100 rounded-md w-1/2"></div>
              <div className="h-8 bg-stone-100 rounded-xl w-1/3"></div>
              <div className="h-16 bg-stone-100 rounded-md w-full"></div>
            </div>
          ))}
        </div>
      )}

      {/* Job Category Sections */}
      {!loading && results.length > 0 && (
        <div className="space-y-10">
          {/* BEST MATCHES */}
          {bestMatches.length > 0 && (
            <section className="space-y-4">
              <div className="flex items-center gap-2 border-b border-stone-200 pb-2">
                <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                <h2 className="text-xl font-bold text-stone-900">BEST MATCHES (85–100%)</h2>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  {bestMatches.length} Jobs
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {bestMatches.map((jobItem, idx) => (
                  <JobCard
                    key={jobItem.job_db_id || idx}
                    jobData={jobItem}
                    onSaveToggle={handleSaveToggle}
                    onStatusChange={handleStatusChange}
                  />
                ))}
              </div>
            </section>
          )}

          {/* GOOD MATCHES */}
          {goodMatches.length > 0 && (
            <section className="space-y-4">
              <div className="flex items-center gap-2 border-b border-stone-200 pb-2">
                <span className="w-3 h-3 rounded-full bg-sky-500"></span>
                <h2 className="text-xl font-bold text-stone-900">GOOD MATCHES (70–84%)</h2>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-sky-100 text-sky-800">
                  {goodMatches.length} Jobs
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {goodMatches.map((jobItem, idx) => (
                  <JobCard
                    key={jobItem.job_db_id || idx}
                    jobData={jobItem}
                    onSaveToggle={handleSaveToggle}
                    onStatusChange={handleStatusChange}
                  />
                ))}
              </div>
            </section>
          )}

          {/* POTENTIAL MATCHES */}
          {potentialMatches.length > 0 && (
            <section className="space-y-4">
              <div className="flex items-center gap-2 border-b border-stone-200 pb-2">
                <span className="w-3 h-3 rounded-full bg-amber-500"></span>
                <h2 className="text-xl font-bold text-stone-900">POTENTIAL MATCHES (50–69%)</h2>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800">
                  {potentialMatches.length} Jobs
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {potentialMatches.map((jobItem, idx) => (
                  <JobCard
                    key={jobItem.job_db_id || idx}
                    jobData={jobItem}
                    onSaveToggle={handleSaveToggle}
                    onStatusChange={handleStatusChange}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      {/* Empty State */}
      {!loading && results.length === 0 && (
        <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center max-w-xl mx-auto space-y-4">
          <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto text-amber-600">
            <MagnifyingGlassIcon className="w-7 h-7" />
          </div>
          <h3 className="text-xl font-bold text-stone-900">No strong matches found yet</h3>
          <p className="text-stone-600 text-sm">
            Try broadening your target location, adding more skills to your resume, or searching live jobs manually.
          </p>
          <div className="pt-2">
            <Link
              to="/jobs"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 text-white font-semibold text-sm hover:bg-emerald-700 transition-colors"
            >
              Search Jobs Manually
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
