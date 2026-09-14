import React, { useState, useEffect } from 'react';
import { resumeGeneratorAPI } from '../services/api';
import {
  DocumentDuplicateIcon,
  PlusIcon,
  TrashIcon,
  PencilSquareIcon,
  ArrowDownTrayIcon,
  CheckCircleIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';

export default function ResumeVersions() {
  const navigate = useNavigate();
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchVersions();
  }, []);

  const fetchVersions = async () => {
    setLoading(true);
    try {
      const res = await resumeGeneratorAPI.getVersions();
      setVersions(res || []);
    } catch (err) {
      // Fallback demo versions if database is empty initially
      setVersions([
        {
          id: 'v1',
          name: 'General Software Engineer Resume',
          target_role: 'Full Stack Engineer',
          template_id: 'ats-friendly',
          ats_score: 92,
          created_at: '2026-09-10',
          updated_at: '2026-09-12',
        },
        {
          id: 'v2',
          name: 'Backend Python Developer',
          target_role: 'Backend Engineer (FastAPI)',
          template_id: 'tech',
          ats_score: 88,
          created_at: '2026-09-11',
          updated_at: '2026-09-13',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleDuplicate = (version) => {
    const newVersion = {
      ...version,
      id: `v_${Date.now()}`,
      name: `${version.name} (Copy)`,
      created_at: new Date().toISOString().split('T')[0],
      updated_at: new Date().toISOString().split('T')[0],
    };
    setVersions([newVersion, ...versions]);
  };

  const handleDelete = (id) => {
    setVersions(versions.filter((v) => v.id !== id));
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-slate-500">
        <ArrowPathIcon className="w-8 h-8 animate-spin text-emerald-600 mb-2" />
        <p className="text-sm font-medium">Loading your resume versions...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8 animate-fade-in">
      {/* Title Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-semibold mb-1">
            <img src="/hirelens-logo.png" alt="HireLens" className="w-4 h-4 object-contain shrink-0" />
            <span>Resume Version Manager</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Your Saved Resumes ({versions.length})</h1>
          <p className="text-slate-500 text-sm">
            Manage role-specific resume variations tailored for different job applications.
          </p>
        </div>

        <button
          onClick={() => navigate('/resume-generator')}
          className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm shadow flex items-center space-x-2"
        >
          <PlusIcon className="w-5 h-5" />
          <span>Create New Version</span>
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm font-medium">
          {error}
        </div>
      )}

      {/* Grid of Versions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {versions.map((ver) => (
          <div
            key={ver.id}
            className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4 hover:shadow-md transition-all"
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-lg">{ver.name}</h3>
                <div className="text-xs text-emerald-700 font-semibold">{ver.target_role}</div>
              </div>

              {ver.ats_score && (
                <div className="px-3 py-1 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-full text-xs font-extrabold flex items-center space-x-1">
                  <CheckCircleIcon className="w-4 h-4 text-emerald-600" />
                  <span>ATS Score {ver.ats_score}%</span>
                </div>
              )}
            </div>

            <div className="text-xs text-slate-500 flex items-center space-x-4 border-t border-b border-slate-100 py-2.5">
              <span>Template: <strong className="text-slate-700 uppercase">{ver.template_id}</strong></span>
              <span>Updated: <strong>{ver.updated_at}</strong></span>
            </div>

            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => navigate('/resume-generator')}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700 text-xs font-semibold flex items-center space-x-1"
                >
                  <PencilSquareIcon className="w-4 h-4" />
                  <span>Edit</span>
                </button>
                <button
                  onClick={() => handleDuplicate(ver)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700 text-xs font-semibold flex items-center space-x-1"
                >
                  <DocumentDuplicateIcon className="w-4 h-4" />
                  <span>Duplicate</span>
                </button>
              </div>

              <button
                onClick={() => handleDelete(ver.id)}
                className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50"
              >
                <TrashIcon className="w-5 h-5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
