import React, { useEffect, useState } from 'react';
import { profileAPI } from '../services/api';
import {
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  SparklesIcon,
  PencilSquareIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';

export default function UserProfile() {
  const [profile, setProfile] = useState(null);
  const [completion, setCompletion] = useState({ completion_score: 0, items: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Conflict modal state
  const [showConflictModal, setShowConflictModal] = useState(false);
  const [selectedResolutions, setSelectedResolutions] = useState({});

  useEffect(() => {
    fetchProfileData();
  }, []);

  const fetchProfileData = async () => {
    setLoading(true);
    try {
      const [profRes, compRes] = await Promise.all([
        profileAPI.get(),
        profileAPI.getCompletion(),
      ]);
      setProfile(profRes);
      setCompletion(compRes);

      if (profRes.conflicts && Object.keys(profRes.conflicts).length > 0) {
        setShowConflictModal(true);
      }
    } catch (err) {
      setError(err.message || 'Failed to load user profile.');
    } finally {
      setLoading(false);
    }
  };

  const handleResolveConflict = async () => {
    try {
      await profileAPI.resolveConflicts(selectedResolutions);
      setSuccessMsg('Conflicts resolved successfully!');
      setShowConflictModal(false);
      fetchProfileData();
    } catch (err) {
      setError(err.message || 'Failed to resolve profile conflicts.');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-slate-500">
        <ArrowPathIcon className="w-10 h-10 animate-spin text-emerald-600 mb-2" />
        <p className="text-sm font-medium">Loading your AI Professional Profile...</p>
      </div>
    );
  }

  const score = completion.completion_score || 0;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8 animate-fade-in">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="inline-flex items-center space-x-2 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-semibold">
            <img src="/hirelens-logo.png" alt="HireLens" className="w-4 h-4 object-contain shrink-0" />
            <span>Unified AI Career Profile</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">
            {profile?.first_name} {profile?.last_name}'s Profile
          </h1>
          <p className="text-slate-500 text-sm">{profile?.headline || 'No professional headline set.'}</p>
        </div>

        {/* Score Ring */}
        <div className="flex items-center space-x-4 bg-slate-50 border border-slate-200 px-5 py-3 rounded-2xl">
          <div className="relative w-16 h-16 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
              <path
                className="text-slate-200"
                strokeWidth="3.5"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className="text-emerald-500 transition-all duration-500"
                strokeDasharray={`${score}, 100`}
                strokeWidth="3.5"
                strokeLinecap="round"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <span className="absolute text-sm font-bold text-slate-900">{score}%</span>
          </div>
          <div>
            <div className="text-sm font-bold text-slate-800">Profile Completion</div>
            <p className="text-xs text-slate-500">
              {score >= 80 ? 'Excellent! Ready for applications.' : 'Add more details to improve match accuracy.'}
            </p>
          </div>
        </div>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-sm font-medium">
          {successMsg}
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm font-medium">
          {error}
        </div>
      )}

      {/* Grid Layout: Completion Checklist & Main Profile */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Completion Checklist */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h3 className="text-base font-bold text-slate-900 mb-4">Completion Checklist</h3>
            <div className="space-y-3">
              {completion.items?.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between text-sm py-1.5 border-b border-slate-100 last:border-0">
                  <div className="flex items-center space-x-2.5">
                    {item.completed ? (
                      <CheckCircleIcon className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                    ) : (
                      <XCircleIcon className="w-5 h-5 text-slate-300 flex-shrink-0" />
                    )}
                    <span className={item.completed ? 'text-slate-800 font-medium' : 'text-slate-400'}>
                      {item.label}
                    </span>
                  </div>
                  <span className="text-xs font-semibold text-slate-400">+{item.weight}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* Connected Integrations Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-900">Connected Profiles</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 text-sm">
                <div>
                  <div className="font-semibold text-slate-800">LinkedIn</div>
                  <div className="text-xs text-slate-500">
                    {profile?.linkedin_url ? 'Connected' : 'Not connected'}
                  </div>
                </div>
                <a
                  href="/linkedin"
                  className="px-3 py-1 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg text-xs font-semibold text-slate-700"
                >
                  Analyze
                </a>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 text-sm">
                <div>
                  <div className="font-semibold text-slate-800">GitHub</div>
                  <div className="text-xs text-slate-500">
                    {profile?.github_url ? 'Connected' : 'Not connected'}
                  </div>
                </div>
                <a
                  href="/github"
                  className="px-3 py-1 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg text-xs font-semibold text-slate-700"
                >
                  Analyze
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Unified AI Professional Profile Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Target Roles & Career Level */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <h3 className="text-lg font-bold text-slate-900 flex items-center justify-between">
              <span>Career Target & Level</span>
              <span className="text-xs px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full font-semibold">
                {profile?.career_level || 'Mid Level'}
              </span>
            </h3>
            <div>
              <div className="text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wider">Target Roles</div>
              <div className="flex flex-wrap gap-2">
                {profile?.target_roles?.map((role, idx) => (
                  <span key={idx} className="px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg text-sm font-semibold">
                    {role}
                  </span>
                )) || <span className="text-slate-400 text-sm">No target roles selected.</span>}
              </div>
            </div>
          </div>

          {/* Unified Skills */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Unified Skill Inventory</h3>
            <div className="flex flex-wrap gap-2">
              {profile?.skills?.map((skill, idx) => (
                <span key={idx} className="px-3 py-1.5 bg-slate-100 text-slate-800 rounded-xl text-xs font-semibold border border-slate-200">
                  {skill}
                </span>
              )) || <span className="text-slate-400 text-sm">No skills added yet.</span>}
            </div>
          </div>

          {/* Work Experience */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Experience</h3>
            {profile?.experience?.length > 0 ? (
              <div className="space-y-4">
                {profile.experience.map((exp, idx) => (
                  <div key={idx} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                    <div className="flex items-center justify-between font-bold text-slate-900">
                      <span>{exp.title}</span>
                      <span className="text-xs text-slate-500 font-normal">{exp.dates}</span>
                    </div>
                    <div className="text-sm font-semibold text-emerald-700">{exp.company}</div>
                    <p className="text-xs text-slate-600 mt-2">{exp.description}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-400 text-sm">No experience items found in profile.</p>
            )}
          </div>
        </div>
      </div>

      {/* Conflict Resolution Modal */}
      {showConflictModal && profile?.conflicts && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-xl bg-white rounded-2xl shadow-xl border border-slate-200 p-6 space-y-6">
            <div className="flex items-center space-x-3 text-amber-600">
              <ExclamationTriangleIcon className="w-7 h-7" />
              <div>
                <h3 className="text-lg font-bold text-slate-900">Profile Data Conflict Detected</h3>
                <p className="text-xs text-slate-500">
                  Your resume and LinkedIn/GitHub have slight discrepancies. Please select your preferred version.
                </p>
              </div>
            </div>

            <div className="space-y-4 max-h-80 overflow-y-auto pr-1">
              {Object.entries(profile.conflicts).map(([field, conf]) => (
                <div key={field} className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                  <div className="text-xs font-bold uppercase text-slate-600">{field}</div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <button
                      type="button"
                      onClick={() => setSelectedResolutions({ ...selectedResolutions, [field]: conf.resume })}
                      className={`p-3 rounded-lg border text-left transition-all ${
                        selectedResolutions[field] === conf.resume
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-900 font-semibold'
                          : 'border-slate-200 bg-white text-slate-700'
                      }`}
                    >
                      <div className="text-xs font-bold text-slate-400 mb-1">From Resume</div>
                      <div>{conf.resume}</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedResolutions({ ...selectedResolutions, [field]: conf.linkedin || conf.github })}
                      className={`p-3 rounded-lg border text-left transition-all ${
                        selectedResolutions[field] === (conf.linkedin || conf.github)
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-900 font-semibold'
                          : 'border-slate-200 bg-white text-slate-700'
                      }`}
                    >
                      <div className="text-xs font-bold text-slate-400 mb-1">From LinkedIn/GitHub</div>
                      <div>{conf.linkedin || conf.github}</div>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowConflictModal(false)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-sm font-semibold"
              >
                Skip For Now
              </button>
              <button
                type="button"
                onClick={handleResolveConflict}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold shadow-md"
              >
                Save Resolution
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
