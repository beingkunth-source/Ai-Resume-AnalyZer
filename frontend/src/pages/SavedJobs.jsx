import React, { useState, useEffect } from 'react';
import { jobsAPI, applicationsAPI } from '../services/api';
import JobCard from '../components/JobCard';
import { BookmarkIcon, ArrowPathIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

export default function SavedJobs() {
  const [savedJobs, setSavedJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchSavedJobs();
  }, []);

  const fetchSavedJobs = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await jobsAPI.getSaved();
      setSavedJobs(res.data || []);
    } catch (err) {
      setError(err.message || "Failed to load saved jobs.");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveToggle = async (jobItem) => {
    const jobId = jobItem.job_db_id || jobItem.job?.id;
    if (!jobId) return;
    try {
      await jobsAPI.unsave(jobId);
      setSavedJobs(prev => prev.filter(item => item.job_db_id !== jobId));
    } catch (err) {
      console.error("Failed to remove saved job:", err);
    }
  };

  const handleStatusChange = async (jobItem, newStatus) => {
    const jobId = jobItem.job_db_id;
    if (!jobId) return;
    try {
      await applicationsAPI.track({ jobId, status: newStatus });
    } catch (err) {
      console.error("Failed to update status:", err);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="border-b border-stone-200 pb-6 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-emerald-600 font-semibold text-sm mb-1">
            <BookmarkIcon className="w-4 h-4" />
            <span>Candidate Bookmarks</span>
          </div>
          <h1 className="text-3xl font-extrabold text-stone-900 tracking-tight">
            Saved Jobs
          </h1>
          <p className="text-stone-600 text-sm mt-1">
            Manage your bookmarked vacancies and track application statuses.
          </p>
        </div>

        <button
          onClick={fetchSavedJobs}
          className="p-2.5 rounded-xl border border-stone-200 hover:bg-stone-50 text-stone-600 transition-colors"
          title="Refresh"
        >
          <ArrowPathIcon className={`w-5 h-5 ${loading ? 'animate-spin text-emerald-600' : ''}`} />
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-center gap-3">
          <ExclamationTriangleIcon className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white rounded-2xl border border-stone-200 p-6 h-60 animate-pulse"></div>
          ))}
        </div>
      )}

      {!loading && savedJobs.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {savedJobs.map((item) => (
            <JobCard
              key={item.saved_id}
              jobData={{
                job: item.job,
                job_db_id: item.job_db_id,
                is_saved: true,
                match_score: item.job?.match_score,
              }}
              onSaveToggle={handleSaveToggle}
              onStatusChange={handleStatusChange}
              showMatchDetails={false}
            />
          ))}
        </div>
      )}

      {!loading && savedJobs.length === 0 && (
        <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center max-w-md mx-auto space-y-3">
          <BookmarkIcon className="w-10 h-10 text-stone-300 mx-auto" />
          <h3 className="text-lg font-bold text-stone-900">No Saved Jobs Yet</h3>
          <p className="text-stone-500 text-xs">
            Bookmark relevant job cards in Recommended Jobs or Job Search to review them later.
          </p>
        </div>
      )}
    </div>
  );
}
