import React, { useState, useEffect } from 'react';
import { linkedinAPI, profileAPI } from '../services/api';
import {
  SparklesIcon,
  ClipboardDocumentIcon,
  CheckIcon,
  ShieldCheckIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';

export default function LinkedInAnalyzer() {
  const [profileUrl, setProfileUrl] = useState('');
  const [profileText, setProfileText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [analysis, setAnalysis] = useState(null);

  const [copiedField, setCopiedField] = useState(null);

  useEffect(() => {
    loadSavedProfile();
  }, []);

  const loadSavedProfile = async () => {
    try {
      const res = await profileAPI.get();
      const prof = res?.data || res;
      if (prof?.linkedin_url) {
        setProfileUrl(prof.linkedin_url);
      }
    } catch (err) {
      // Ignore initial load error
    }
  };

  const handleAnalyze = async (e) => {
    e.preventDefault();
    if (!profileUrl.trim() && !profileText.trim()) {
      setError('Please provide a LinkedIn profile URL or paste your profile text/export.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const res = await linkedinAPI.analyze({
        profile_url: profileUrl,
        profile_text: profileText,
      });
      const data = res?.data || res;
      setAnalysis(data);
    } catch (err) {
      setError(err.message || 'LinkedIn analysis failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text, fieldName) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8 animate-fade-in">
      {/* Title & Privacy Badge */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="inline-flex items-center space-x-2 px-3 py-1 bg-sky-50 text-sky-700 rounded-full text-xs font-semibold">
            <img src="/hirelens-logo.png" alt="HireLens" className="w-4 h-4 object-contain shrink-0" />
            <span>LinkedIn Profile Optimizer</span>
          </div>
          <div className="flex items-center space-x-1 text-xs text-slate-500 font-medium">
            <ShieldCheckIcon className="w-4 h-4 text-emerald-600" />
            <span>Privacy Compliant (No Web Scraping)</span>
          </div>
        </div>
        <h1 className="text-2xl font-bold text-slate-900">LinkedIn Branding & Keywords Audit</h1>
        <p className="text-slate-500 text-sm">
          Optimize your headline, summary, and experience descriptions for maximum recruiter visibility.
        </p>
      </div>

      {/* Input Form */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <form onSubmit={handleAnalyze} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">
              LinkedIn Profile URL
            </label>
            <input
              type="url"
              value={profileUrl}
              onChange={(e) => setProfileUrl(e.target.value)}
              placeholder="https://www.linkedin.com/in/example"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <div className="text-center text-xs font-semibold text-slate-400">OR</div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">
              Paste LinkedIn Profile Information / Export Text
            </label>
            <textarea
              rows={4}
              value={profileText}
              onChange={(e) => setProfileText(e.target.value)}
              placeholder="Paste your LinkedIn Headline, About section, Experience bullet points, or skills list..."
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          {error && (
            <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm font-medium">
              {error}
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="flex items-center space-x-2 px-6 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl text-sm shadow-md transition-all"
            >
              {loading ? (
                <>
                  <ArrowPathIcon className="w-5 h-5 animate-spin" />
                  <span>Analyzing Profile...</span>
                </>
              ) : (
                <>
                  <SparklesIcon className="w-5 h-5" />
                  <span>Analyze LinkedIn</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Analysis Results Dashboard */}
      {analysis && (
        <div className="space-y-8 animate-fade-in">
          {/* Top Score Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center space-x-6">
              <div className="relative w-20 h-20 flex items-center justify-center bg-sky-50 border-4 border-sky-500 rounded-full">
                <span className="text-2xl font-extrabold text-sky-700">
                  {analysis.linkedin_score}
                </span>
                <span className="text-xs text-sky-500 absolute bottom-2">/100</span>
              </div>
              <div>
                <div className="text-xl font-bold text-slate-900">Overall LinkedIn Score</div>
                <p className="text-slate-500 text-sm">
                  {analysis.linkedin_score >= 85
                    ? 'Strong profile! Highly optimized for recruiters.'
                    : 'Good foundation. Apply recommendations below to boost ranking.'}
                </p>
              </div>
            </div>

            {/* Score Breakdown Progress Bars */}
            <div className="w-full md:w-72 space-y-2">
              {Object.entries(analysis.score_breakdown || {}).map(([key, val]) => (
                <div key={key} className="text-xs">
                  <div className="flex justify-between font-semibold text-slate-700 capitalize mb-0.5">
                    <span>{key}</span>
                    <span className="text-sky-600">{val}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-sky-500" style={{ width: `${val}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Strengths & Weaknesses Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-3">
              <h3 className="text-base font-bold text-emerald-800 flex items-center space-x-2">
                <span>✓ Profile Strengths</span>
              </h3>
              <ul className="space-y-2 text-sm text-slate-700 list-disc list-inside">
                {analysis.strengths?.map((str, idx) => (
                  <li key={idx}>{str}</li>
                ))}
              </ul>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-3">
              <h3 className="text-base font-bold text-amber-800 flex items-center space-x-2">
                <span>⚠ Areas for Improvement</span>
              </h3>
              <ul className="space-y-2 text-sm text-slate-700 list-disc list-inside">
                {analysis.weaknesses?.map((wk, idx) => (
                  <li key={idx}>{wk}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* Keywords to Add */}
          {analysis.keywords_to_add?.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-3">
              <h3 className="text-base font-bold text-slate-900">Recommended Recruiter Keywords</h3>
              <div className="flex flex-wrap gap-2">
                {analysis.keywords_to_add.map((kw, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 bg-sky-50 text-sky-800 border border-sky-200 rounded-lg text-xs font-semibold"
                  >
                    + {kw}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Improved Wording Suggestions */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
            <h3 className="text-lg font-bold text-slate-900">AI Improved Profile Branding</h3>

            {/* Improved Headline */}
            {analysis.improved_headline && (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold uppercase text-slate-500">Optimized Headline</div>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(analysis.improved_headline, 'headline')}
                    className="flex items-center space-x-1 text-xs font-semibold text-sky-600 hover:text-sky-700"
                  >
                    {copiedField === 'headline' ? (
                      <>
                        <CheckIcon className="w-4 h-4 text-emerald-600" />
                        <span className="text-emerald-600">Copied!</span>
                      </>
                    ) : (
                      <>
                        <ClipboardDocumentIcon className="w-4 h-4" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
                <div className="text-sm font-semibold text-slate-800">{analysis.improved_headline}</div>
              </div>
            )}

            {/* Improved About Section */}
            {analysis.improved_about && (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold uppercase text-slate-500">Optimized About Section</div>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(analysis.improved_about, 'about')}
                    className="flex items-center space-x-1 text-xs font-semibold text-sky-600 hover:text-sky-700"
                  >
                    {copiedField === 'about' ? (
                      <>
                        <CheckIcon className="w-4 h-4 text-emerald-600" />
                        <span className="text-emerald-600">Copied!</span>
                      </>
                    ) : (
                      <>
                        <ClipboardDocumentIcon className="w-4 h-4" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
                <div className="text-sm text-slate-700 whitespace-pre-line leading-relaxed">
                  {analysis.improved_about}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
