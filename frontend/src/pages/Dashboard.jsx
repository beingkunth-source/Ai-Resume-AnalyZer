import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { dashboardAPI, profileAPI } from '../services/api';
import {
  SparklesIcon,
  CheckCircleIcon,
  ArrowRightIcon,
  DocumentDuplicateIcon,
  BriefcaseIcon,
  CodeBracketIcon,
  GlobeAltIcon,
  UserCircleIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import LoadingState from '../components/LoadingState';

export default function Dashboard() {
  const navigate = useNavigate();
  const [dashData, setDashData] = useState(null);
  const [profile, setProfile] = useState(null);
  const [completion, setCompletion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const [dashRes, profRes, compRes] = await Promise.all([
        dashboardAPI.get().catch(() => ({ data: {} })),
        profileAPI.get().catch(() => null),
        profileAPI.getCompletion().catch(() => ({ completion_percentage: 0 })),
      ]);

      setDashData(dashRes.data || dashRes || {});
      setProfile(profRes);
      setCompletion(compRes);
    } catch (err) {
      setError(err.message || 'Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingState type="page" />;

  const firstName = profile?.first_name || 'Professional';
  const profileScore = completion?.completion_percentage ?? completion?.completion_score ?? 0;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8 animate-fade-in">
      {/* Top Greeting Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center space-x-2 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-semibold">
            <img src="/hirelens-logo.png" alt="HireLens" className="w-4 h-4 object-contain shrink-0" />
            <span>AI Career Hub</span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900">Good morning, {firstName}</h1>
          <p className="text-slate-500 text-sm">
            Your AI career profile is <strong className="text-emerald-600">{profileScore}% complete</strong>. Explore job matches & resume tools below.
          </p>
        </div>

        {/* Profile Ring CTA */}
        <div
          onClick={() => navigate('/profile')}
          className="flex items-center space-x-4 bg-slate-50 border border-slate-200 p-4 rounded-2xl cursor-pointer hover:border-emerald-300 transition-all"
        >
          <div className="relative w-14 h-14 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
              <path className="text-slate-200" strokeWidth="3.5" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
              <path className="text-emerald-500" strokeDasharray={`${profileScore}, 100`} strokeWidth="3.5" strokeLinecap="round" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
            </svg>
            <span className="absolute text-xs font-extrabold text-slate-900">{profileScore}%</span>
          </div>
          <div>
            <div className="text-xs font-bold text-slate-900 uppercase">Complete Profile</div>
            <p className="text-xs text-emerald-600 font-semibold flex items-center space-x-1">
              <span>View Checklist</span>
              <ArrowRightIcon className="w-3.5 h-3.5" />
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm font-medium">
          {error}
        </div>
      )}

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-1">
          <div className="text-xs font-bold uppercase text-slate-500">Resume Quality Score</div>
          <div className="text-3xl font-extrabold text-emerald-600">
            {dashData?.average_score != null ? `${Math.round(dashData.average_score)}/100` : 'N/A'}
          </div>
          <div className="text-xs text-slate-400">
            {dashData?.average_score != null ? 'AI content evaluation' : 'Upload a resume to analyze'}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-1">
          <div className="text-xs font-bold uppercase text-slate-500">ATS Readiness</div>
          <div className="text-3xl font-extrabold text-blue-600">
            {dashData?.average_ats_score != null ? `${Math.round(dashData.average_ats_score)}/100` : 'N/A'}
          </div>
          <div className="text-xs text-slate-400">
            {dashData?.average_ats_score != null ? 'Scanner parsing rate' : 'Run ATS compatibility check'}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-1">
          <div className="text-xs font-bold uppercase text-slate-500">LinkedIn Branding</div>
          <div className="text-3xl font-extrabold text-sky-600">
            {dashData?.linkedin_score != null ? `${Math.round(dashData.linkedin_score)}/100` : 'N/A'}
          </div>
          <div className="text-xs text-slate-400">
            {dashData?.linkedin_score != null ? 'Recruiter keywords score' : 'Audit your LinkedIn profile'}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-1">
          <div className="text-xs font-bold uppercase text-slate-500">GitHub Code Score</div>
          <div className="text-3xl font-extrabold text-violet-600">
            {dashData?.github_score != null ? `${Math.round(dashData.github_score)}/100` : 'N/A'}
          </div>
          <div className="text-xs text-slate-400">
            {dashData?.github_score != null ? 'Project quality score' : 'Import your GitHub repos'}
          </div>
        </div>
      </div>

      {/* Quick Launch Cards */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-slate-900">Platform Features & Shortcuts</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            to="/resume-generator"
            className="p-5 bg-white rounded-2xl border border-slate-200 hover:border-emerald-500 shadow-sm transition-all space-y-2 group"
          >
            <DocumentDuplicateIcon className="w-8 h-8 text-emerald-600 group-hover:scale-110 transition-transform" />
            <div className="font-bold text-slate-900 text-sm">Resume Builder & Templates</div>
            <div className="text-xs text-slate-500">Generate PDF/DOCX resumes from 10 original templates</div>
          </Link>

          <Link
            to="/jobs/recommended"
            className="p-5 bg-white rounded-2xl border border-slate-200 hover:border-blue-500 shadow-sm transition-all space-y-2 group"
          >
            <BriefcaseIcon className="w-8 h-8 text-blue-600 group-hover:scale-110 transition-transform" />
            <div className="font-bold text-slate-900 text-sm">Personalized Job Matches</div>
            <div className="text-xs text-slate-500">Hybrid AI job matching algorithm based on your resume</div>
          </Link>

          <Link
            to="/linkedin"
            className="p-5 bg-white rounded-2xl border border-slate-200 hover:border-sky-500 shadow-sm transition-all space-y-2 group"
          >
            <GlobeAltIcon className="w-8 h-8 text-sky-600 group-hover:scale-110 transition-transform" />
            <div className="font-bold text-slate-900 text-sm">LinkedIn Profile Audit</div>
            <div className="text-xs text-slate-500">Optimize your headline, summary, and experience wording</div>
          </Link>

          <Link
            to="/github"
            className="p-5 bg-white rounded-2xl border border-slate-200 hover:border-violet-500 shadow-sm transition-all space-y-2 group"
          >
            <CodeBracketIcon className="w-8 h-8 text-violet-600 group-hover:scale-110 transition-transform" />
            <div className="font-bold text-slate-900 text-sm">GitHub Repo Importer</div>
            <div className="text-xs text-slate-500">Analyze repos & generate resume-ready project descriptions</div>
          </Link>
        </div>
      </div>

      {/* Target Skills & Opportunities */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
        <h3 className="text-base font-bold text-slate-900">Career Profile Opportunities & Next Steps</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
            <div className="font-bold text-slate-900 text-sm">Top Targeted Roles</div>
            <p className="text-slate-600">
              {profile?.target_roles?.length > 0 ? profile.target_roles.join(' • ') : 'Set your target roles in profile'}
            </p>
          </div>
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
            <div className="font-bold text-emerald-800 text-sm">Recommended Skills to Learn</div>
            <p className="text-slate-600">
              {dashData?.total_resumes > 0 ? '+ System Design • Kubernetes • Microservices • AWS' : 'Upload resume to generate skill recommendations'}
            </p>
          </div>
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
            <div className="font-bold text-blue-800 text-sm">Target Job Mode</div>
            <p className="text-slate-600">
              {profile?.work_mode ? `${profile.work_mode} • ${profile.location || 'India & Global Opportunities'}` : 'Remote / Hybrid • India & Global Opportunities'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
