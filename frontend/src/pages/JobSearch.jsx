import React, { useState, useEffect } from 'react';
import { jobsAPI, resumeAPI, applicationsAPI } from '../services/api';
import JobCard from '../components/JobCard';
import { 
  MagnifyingGlassIcon, 
  MapPinIcon, 
  FunnelIcon, 
  ArrowPathIcon,
  AdjustmentsHorizontalIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

export default function JobSearch() {
  const [query, setQuery] = useState('Python Backend Developer');
  const [location, setLocation] = useState('India');
  const [experience, setExperience] = useState('');
  const [remoteOnly, setRemoteOnly] = useState(false);
  const [source, setSource] = useState('all');
  const [sortBy, setSortBy] = useState('match');
  const [minScore, setMinScore] = useState(0);

  const [resumes, setResumes] = useState([]);
  const [selectedResumeId, setSelectedResumeId] = useState(null);

  const [resultsData, setResultsData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetchResumes();
  }, []);

  const fetchResumes = async () => {
    try {
      const res = await resumeAPI.list();
      const rawPayload = res?.data?.data || res?.data || res;
      const list = Array.isArray(rawPayload) ? rawPayload : (rawPayload?.data || []);
      setResumes(list);
      if (list.length > 0) {
        setSelectedResumeId(list[0].id);
      }
    } catch (err) {
      console.error("Failed to load resumes:", err);
    }
  };

  useEffect(() => {
    handleSearch(1);
  }, [selectedResumeId, source, remoteOnly, sortBy]);

  const handleSearch = async (targetPage = 1) => {
    setLoading(true);
    setError(null);
    try {
      const response = await jobsAPI.search({
        query,
        location,
        experience,
        remote: remoteOnly,
        source,
        resumeId: selectedResumeId,
        minScore,
        sortBy,
        page: targetPage,
        limit: 20,
      });
      const dataPayload = response?.data?.data || response?.data || response;
      setResultsData(dataPayload);
      setPage(targetPage);
    } catch (err) {
      setError(err.message || "Failed to search job listings.");
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
      console.error("Failed to update status:", err);
    }
  };

  const jobsList = resultsData?.results || [];
  const providersStatus = resultsData?.providers_status || {};

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-stone-900 tracking-tight">
          Job Search & Discovery
        </h1>
        <p className="text-stone-600 text-sm mt-1">
          Search live job vacancies across Naukri, LinkedIn, Indeed, and Remotive matched against your resume.
        </p>
      </div>

      {/* Main Search Bar */}
      <div className="bg-white rounded-2xl border border-stone-200 p-4 shadow-sm flex flex-col md:flex-row gap-3">
        <div className="flex-1 relative">
          <MagnifyingGlassIcon className="w-5 h-5 text-stone-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch(1)}
            placeholder="Search job title, role, or tech skills (e.g. Python Developer)..."
            className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-stone-200 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="w-full md:w-56 relative">
          <MapPinIcon className="w-5 h-5 text-stone-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch(1)}
            placeholder="Location (e.g. Bangalore, Remote)"
            className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-stone-200 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <button
          onClick={() => handleSearch(1)}
          disabled={loading}
          className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm transition-colors shadow-sm flex items-center justify-center gap-2 shrink-0"
        >
          {loading ? (
            <ArrowPathIcon className="w-4 h-4 animate-spin" />
          ) : (
            <MagnifyingGlassIcon className="w-4 h-4" />
          )}
          <span>Search Jobs</span>
        </button>
      </div>

      {/* Grid Layout: Filters + Results */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
        {/* Sidebar Filters */}
        <div className="bg-white rounded-2xl border border-stone-200/80 p-6 shadow-sm space-y-6 lg:sticky lg:top-6">
          <div className="flex items-center justify-between border-b border-stone-100 pb-3">
            <h3 className="font-bold text-stone-900 flex items-center gap-2 text-sm">
              <FunnelIcon className="w-4 h-4 text-emerald-600" />
              <span>Filters</span>
            </h3>
            <button
              onClick={() => {
                setSource('all');
                setRemoteOnly(false);
                setExperience('');
                setMinScore(0);
                handleSearch(1);
              }}
              className="text-xs text-stone-400 hover:text-stone-600 font-medium"
            >
              Reset
            </button>
          </div>

          {/* Active Match Resume */}
          {resumes.length > 0 && (
            <div>
              <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wider mb-2">
                Match With Resume:
              </label>
              <select
                value={selectedResumeId || ''}
                onChange={(e) => setSelectedResumeId(Number(e.target.value))}
                className="w-full text-xs font-medium text-stone-800 bg-stone-50 border border-stone-200 rounded-xl p-2 cursor-pointer"
              >
                {resumes.map(r => (
                  <option key={r.id} value={r.id}>{r.filename}</option>
                ))}
              </select>
            </div>
          )}

          {/* Job Source Provider Filter */}
          <div>
            <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wider mb-2">
              Job Sources:
            </label>
            <div className="space-y-1.5 text-xs font-medium text-stone-700">
              {[
                { key: 'all', label: 'All Sources' },
                { key: 'naukri', label: 'Naukri.com' },
                { key: 'linkedin', label: 'LinkedIn Jobs' },
                { key: 'indeed', label: 'Indeed' },
                { key: 'remotive', label: 'Remotive (Open API)' },
              ].map(item => (
                <label key={item.key} className="flex items-center gap-2 cursor-pointer hover:text-emerald-700">
                  <input
                    type="radio"
                    name="source_filter"
                    checked={source === item.key}
                    onChange={() => setSource(item.key)}
                    className="text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>{item.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Remote Checkbox */}
          <div>
            <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-stone-700">
              <input
                type="checkbox"
                checked={remoteOnly}
                onChange={(e) => setRemoteOnly(e.target.checked)}
                className="rounded text-emerald-600 focus:ring-emerald-500"
              />
              <span>Remote / Hybrid Only</span>
            </label>
          </div>

          {/* Min Match Score */}
          <div>
            <div className="flex justify-between text-xs font-semibold text-stone-500 mb-1">
              <span>Min Match Score:</span>
              <span className="text-emerald-700 font-bold">{minScore}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="90"
              step="5"
              value={minScore}
              onChange={(e) => setMinScore(Number(e.target.value))}
              className="w-full accent-emerald-600 cursor-pointer"
            />
          </div>

          {/* Sort By */}
          <div>
            <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wider mb-2">
              Sort By:
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full text-xs font-medium text-stone-800 bg-stone-50 border border-stone-200 rounded-xl p-2 cursor-pointer"
            >
              <option value="match">Best Resume Match</option>
              <option value="newest">Newest Posted</option>
            </select>
          </div>
        </div>

        {/* Results Column */}
        <div className="lg:col-span-3 space-y-6">
          {/* Provider Status Indicators */}
          {Object.keys(providersStatus).length > 0 && (
            <div className="flex flex-wrap gap-2 text-xs">
              {Object.entries(providersStatus).map(([key, st]) => (
                <span key={key} className={`px-2.5 py-1 rounded-full font-medium border ${st === 'available' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                  {key.toUpperCase()}: {st === 'available' ? 'Live API Active' : 'Fallback Search Links Active'}
                </span>
              ))}
            </div>
          )}

          {error && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm">
              {error}
            </div>
          )}

          {loading && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="bg-white rounded-2xl border border-stone-200 p-6 h-64 animate-pulse space-y-4">
                  <div className="h-6 bg-stone-100 rounded-md w-3/4"></div>
                  <div className="h-4 bg-stone-100 rounded-md w-1/2"></div>
                </div>
              ))}
            </div>
          )}

          {!loading && jobsList.length > 0 && (
            <div className="space-y-6">
              <div className="text-xs font-semibold text-stone-500">
                Found {resultsData?.total || jobsList.length} verified listings
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {jobsList.map((jobItem, idx) => (
                  <JobCard
                    key={jobItem.job_db_id || idx}
                    jobData={jobItem}
                    onSaveToggle={handleSaveToggle}
                    onStatusChange={handleStatusChange}
                  />
                ))}
              </div>
            </div>
          )}

          {!loading && jobsList.length === 0 && (
            <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center">
              <p className="text-stone-600 text-sm font-medium">No jobs matching your exact search parameters were found.</p>
              <p className="text-stone-400 text-xs mt-1">Try broadening your keywords or removing filters.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
