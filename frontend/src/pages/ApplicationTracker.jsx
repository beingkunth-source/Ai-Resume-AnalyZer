import React, { useState, useEffect } from 'react';
import { applicationsAPI } from '../services/api';
import { 
  ClipboardDocumentCheckIcon, 
  ArrowTopRightOnSquareIcon, 
  PencilIcon, 
  TrashIcon, 
  ArrowPathIcon,
  PlusIcon
} from '@heroicons/react/24/outline';

const STAGES = ['Interested', 'Applied', 'Interview', 'Offer', 'Rejected'];

const STAGE_COLORS = {
  Interested: 'bg-stone-100 text-stone-700 border-stone-200',
  Applied: 'bg-sky-50 text-sky-700 border-sky-200',
  Interview: 'bg-amber-50 text-amber-700 border-amber-200',
  Offer: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Rejected: 'bg-rose-50 text-rose-700 border-rose-200',
};

export default function ApplicationTracker() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [noteText, setNoteText] = useState('');

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await applicationsAPI.getAll();
      setApplications(res.data || []);
    } catch (err) {
      setError(err.message || "Failed to load application history.");
    } finally {
      setLoading(false);
    }
  };

  const handleStageChange = async (appId, newStage) => {
    try {
      await applicationsAPI.update(appId, { status: newStage });
      setApplications(prev => prev.map(app => app.id === appId ? { ...app, status: newStage } : app));
    } catch (err) {
      console.error("Failed to update status:", err);
    }
  };

  const handleSaveNote = async (appId) => {
    try {
      await applicationsAPI.update(appId, { notes: noteText });
      setApplications(prev => prev.map(app => app.id === appId ? { ...app, notes: noteText } : app));
      setEditingId(null);
      setNoteText('');
    } catch (err) {
      console.error("Failed to save note:", err);
    }
  };

  const handleDelete = async (appId) => {
    try {
      await applicationsAPI.delete(appId);
      setApplications(prev => prev.filter(app => app.id !== appId));
    } catch (err) {
      console.error("Failed to delete application:", err);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="border-b border-stone-200 pb-6 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-emerald-600 font-semibold text-sm mb-1">
            <ClipboardDocumentCheckIcon className="w-4 h-4" />
            <span>Job Management Platform</span>
          </div>
          <h1 className="text-3xl font-extrabold text-stone-900 tracking-tight">
            Application Tracker
          </h1>
          <p className="text-stone-600 text-sm mt-1">
            Track and manage your active job applications across all recruitment stages.
          </p>
        </div>

        <button
          onClick={fetchApplications}
          className="p-2.5 rounded-xl border border-stone-200 hover:bg-stone-50 text-stone-600 transition-colors"
          title="Refresh"
        >
          <ArrowPathIcon className={`w-5 h-5 ${loading ? 'animate-spin text-emerald-600' : ''}`} />
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm">
          {error}
        </div>
      )}

      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {STAGES.map(st => (
            <div key={st} className="bg-stone-100 rounded-2xl p-4 h-64 animate-pulse"></div>
          ))}
        </div>
      )}

      {/* Kanban Board Columns */}
      {!loading && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-start">
          {STAGES.map(stage => {
            const items = applications.filter(a => a.status === stage);
            return (
              <div key={stage} className="bg-stone-50 rounded-2xl border border-stone-200/80 p-4 space-y-3 min-h-[450px]">
                {/* Stage Header */}
                <div className="flex items-center justify-between border-b border-stone-200 pb-2.5">
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${STAGE_COLORS[stage]}`}>
                    {stage}
                  </span>
                  <span className="text-xs font-semibold text-stone-400">
                    {items.length}
                  </span>
                </div>

                {/* Cards List */}
                <div className="space-y-3">
                  {items.map(app => (
                    <div key={app.id} className="bg-white rounded-xl border border-stone-200 p-4 shadow-2xs hover:shadow-xs transition-all space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="font-bold text-stone-900 text-sm line-clamp-1">
                            {app.job?.title || 'Job Title'}
                          </h4>
                          <p className="text-xs text-stone-500 font-medium">
                            {app.job?.company || 'Company'}
                          </p>
                        </div>

                        {app.job?.url && (
                          <a
                            href={app.job.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-stone-400 hover:text-emerald-600 transition-colors p-1"
                            title="View Job"
                          >
                            <ArrowTopRightOnSquareIcon className="w-4 h-4" />
                          </a>
                        )}
                      </div>

                      {/* Stage Selector Dropdown */}
                      <div className="pt-1">
                        <select
                          value={app.status}
                          onChange={(e) => handleStageChange(app.id, e.target.value)}
                          className="w-full text-xs font-semibold text-stone-700 bg-stone-50 border border-stone-200 rounded-lg p-1.5 cursor-pointer"
                        >
                          {STAGES.map(st => (
                            <option key={st} value={st}>{st}</option>
                          ))}
                        </select>
                      </div>

                      {/* Notes Section */}
                      <div className="pt-2 border-t border-stone-100 text-xs">
                        {editingId === app.id ? (
                          <div className="space-y-2">
                            <textarea
                              value={noteText}
                              onChange={(e) => setNoteText(e.target.value)}
                              placeholder="Add notes (interview details, recruiter contact...)"
                              className="w-full text-xs p-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
                              rows={2}
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleSaveNote(app.id)}
                                className="px-2.5 py-1 bg-emerald-600 text-white rounded-md text-[11px] font-semibold"
                              >
                                Save
                              </button>
                              <button
                                onClick={() => setEditingId(null)}
                                className="px-2.5 py-1 bg-stone-100 text-stone-600 rounded-md text-[11px] font-semibold"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-start justify-between gap-1 text-stone-600">
                            <p className="italic text-[11px] line-clamp-2">
                              {app.notes || 'No notes added'}
                            </p>
                            <button
                              onClick={() => {
                                setEditingId(app.id);
                                setNoteText(app.notes || '');
                              }}
                              className="text-stone-400 hover:text-stone-600 p-0.5"
                            >
                              <PencilIcon className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Action buttons */}
                      <div className="flex justify-between items-center text-[10px] text-stone-400 pt-1">
                        <span>{app.applied_at ? `Applied ${new Date(app.applied_at).toLocaleDateString()}` : 'Tracked'}</span>
                        <button
                          onClick={() => handleDelete(app.id)}
                          className="hover:text-rose-600 p-1"
                          title="Delete Tracker Record"
                        >
                          <TrashIcon className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}

                  {items.length === 0 && (
                    <div className="p-6 text-center text-xs text-stone-400 font-medium border border-dashed border-stone-200 rounded-xl">
                      No jobs in {stage}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
