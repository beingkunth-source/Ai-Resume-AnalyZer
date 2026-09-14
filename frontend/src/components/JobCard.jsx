import React, { useState } from 'react';
import { Link } from 'react-router-dom';

import { 
  BuildingOffice2Icon, 
  MapPinIcon, 
  BanknotesIcon, 
  CheckCircleIcon, 
  XCircleIcon, 
  BookmarkIcon as BookmarkOutline,
  ArrowTopRightOnSquareIcon,
  SparklesIcon,
  ChevronDownIcon
} from '@heroicons/react/24/outline';
import { BookmarkIcon as BookmarkSolid } from '@heroicons/react/24/solid';

export default function JobCard({ 
  jobData, 
  onSaveToggle, 
  onStatusChange,
  showMatchDetails = true 
}) {
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(jobData.is_saved || false);
  const [status, setStatus] = useState(jobData.application_status || 'Not Applied');
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [imgError, setImgError] = useState(false);

  const job = jobData.job || jobData;
  const matchScore = jobData.match_score !== undefined ? Math.round(jobData.match_score) : null;
  const matchedSkills = jobData.matched_skills || [];
  const missingSkills = jobData.missing_skills || [];

  const handleSave = async (e) => {
    e.stopPropagation();
    if (isSaving) return;
    setIsSaving(true);
    try {
      if (onSaveToggle) {
        await onSaveToggle(jobData);
        setIsSaved(!isSaved);
      }
    } catch (err) {
      console.error("Save error:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleStatusSelect = async (newStatus) => {
    setStatus(newStatus);
    setShowStatusMenu(false);
    if (onStatusChange) {
      onStatusChange(jobData, newStatus);
    }
  };

  const getScoreBadgeClass = (score) => {
    if (score >= 85) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (score >= 70) return 'bg-sky-50 text-sky-700 border-sky-200';
    if (score >= 50) return 'bg-amber-50 text-amber-700 border-amber-200';
    return 'bg-stone-100 text-stone-600 border-stone-200';
  };

  const getSourceColor = (src = '') => {
    const s = src.toLowerCase();
    if (s.includes('naukri')) return 'bg-blue-600 text-white';
    if (s.includes('linkedin')) return 'bg-sky-700 text-white';
    if (s.includes('indeed')) return 'bg-indigo-600 text-white';
    return 'bg-emerald-600 text-white';
  };

  return (
    <div className="bg-white rounded-2xl border border-stone-200/80 p-6 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between group relative">
      <div>
        {/* Top Header Row */}
        <div className="flex items-start justify-between gap-4 mb-3">
          <div className="flex items-center gap-3">
            {!imgError && job.source_logo ? (
              <img 
                src={job.source_logo} 
                alt={job.source || 'Company Logo'} 
                className="w-10 h-10 object-contain rounded-lg border border-stone-100 bg-stone-50 p-1 shrink-0"
                onError={() => setImgError(true)}
              />
            ) : (
              <div className="w-10 h-10 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 font-bold text-base shadow-sm shrink-0">
                {job.company?.[0]?.toUpperCase() || 'J'}
              </div>
            )}
            <div>
              <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-medium mb-1 ${getSourceColor(job.source)}`}>
                {job.source || 'Verified Source'}
              </span>
              <h3 className="text-lg font-bold text-stone-900 group-hover:text-emerald-700 transition-colors line-clamp-1">
                {job.title}
              </h3>
              <p className="text-sm font-medium text-stone-600 flex items-center gap-1.5 mt-0.5">
                <BuildingOffice2Icon className="w-4 h-4 text-stone-400 shrink-0" />
                {job.company}
              </p>
            </div>
          </div>

          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="p-2 rounded-xl border border-stone-200 hover:border-emerald-300 hover:bg-emerald-50/50 text-stone-400 hover:text-emerald-600 transition-colors shrink-0"
            title={isSaved ? "Remove from Saved Jobs" : "Save Job"}
          >
            {isSaved ? (
              <BookmarkSolid className="w-5 h-5 text-emerald-600" />
            ) : (
              <BookmarkOutline className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* Location, Experience, Salary Metadata */}
        <div className="flex flex-wrap gap-y-1.5 gap-x-4 text-xs font-medium text-stone-500 mb-4 pt-2 border-t border-stone-100">
          <div className="flex items-center gap-1">
            <MapPinIcon className="w-3.5 h-3.5 text-stone-400" />
            <span>{job.location || 'Remote'}</span>
          </div>
          {job.salary && (
            <div className="flex items-center gap-1 text-stone-700 font-semibold">
              <BanknotesIcon className="w-3.5 h-3.5 text-emerald-600" />
              <span>{job.salary}</span>
            </div>
          )}
          {job.experience_required && (
            <div className="text-stone-500">
              <span>Exp: {job.experience_required}</span>
            </div>
          )}
        </div>

        {/* Match Score Badge */}
        {showMatchDetails && matchScore !== null && (
          <div className="mb-4">
            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border ${getScoreBadgeClass(matchScore)}`}>
              <SparklesIcon className="w-4 h-4" />
              <span className="text-sm font-bold">{matchScore}% MATCH</span>
              <span className="text-xs font-normal opacity-80">with your resume</span>
            </div>
          </div>
        )}

        {/* Skills Breakdown (Matched ✓ vs Missing ✗) */}
        {showMatchDetails && (matchedSkills.length > 0 || missingSkills.length > 0) && (
          <div className="space-y-2 mb-4 text-xs">
            {matchedSkills.length > 0 && (
              <div className="flex flex-wrap gap-1.5 items-center">
                <span className="text-stone-400 font-medium mr-1">Matched:</span>
                {matchedSkills.slice(0, 5).map((skill, i) => (
                  <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200/60 font-medium">
                    <CheckCircleIcon className="w-3 h-3 text-emerald-600" />
                    {skill}
                  </span>
                ))}
              </div>
            )}
            {missingSkills.length > 0 && (
              <div className="flex flex-wrap gap-1.5 items-center">
                <span className="text-stone-400 font-medium mr-1">Missing:</span>
                {missingSkills.slice(0, 3).map((skill, i) => (
                  <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-200/60 font-medium">
                    <XCircleIcon className="w-3 h-3 text-rose-500" />
                    {skill}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Short Description */}
        <p className="text-xs text-stone-600 line-clamp-2 mb-4 leading-relaxed">
          {job.description}
        </p>
      </div>

      {/* Card Footer Actions */}
      <div className="pt-3 border-t border-stone-100 flex items-center justify-between gap-3 text-xs">
        <span className="text-stone-400 font-medium">
          {job.posted_at || 'Recently posted'}
        </span>

        <div className="flex items-center gap-2">
          {/* Status Tracker Menu */}
          <div className="relative">
            <button
              onClick={() => setShowStatusMenu(!showStatusMenu)}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-stone-200 hover:bg-stone-50 text-stone-600 font-medium transition-colors"
            >
              <span>{status}</span>
              <ChevronDownIcon className="w-3.5 h-3.5 text-stone-400" />
            </button>

            {showStatusMenu && (
              <div className="absolute right-0 bottom-full mb-1 w-36 bg-white rounded-xl shadow-lg border border-stone-200 py-1 z-20">
                {['Interested', 'Applied', 'Interview', 'Rejected', 'Offer'].map((st) => (
                  <button
                    key={st}
                    onClick={() => handleStatusSelect(st)}
                    className={`w-full text-left px-3 py-1.5 text-xs hover:bg-stone-50 font-medium ${status === st ? 'text-emerald-600 font-bold' : 'text-stone-700'}`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* View / Apply Job Button */}
          <a
            href={job.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-sm transition-all text-xs"
          >
            <span>View Job</span>
            <ArrowTopRightOnSquareIcon className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
}
