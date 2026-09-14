import React, { useState, useEffect } from 'react';
import { githubAPI } from '../services/api';
import {
  CodeBracketIcon,
  StarIcon,
  ArrowPathIcon,
  CheckIcon,
  SparklesIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';

export default function GitHubAnalyzer() {
  const [inputVal, setInputVal] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [analysis, setAnalysis] = useState(null);

  // Selected projects state for resume export
  const [selectedProjects, setSelectedProjects] = useState([]);
  const [generatedDescriptions, setGeneratedDescriptions] = useState({});
  const [generatingDescs, setGeneratingDescs] = useState(false);

  useEffect(() => {
    loadSavedProfile();
  }, []);

  const loadSavedProfile = async () => {
    try {
      const res = await githubAPI.getProjects();
      const data = res?.data || res;
      if (data && (data.github_username || data.username)) {
        setAnalysis(data);
        setInputVal(data.github_username || data.username);
      }
    } catch (err) {
      // Ignore initial load error
    }
  };

  const handleAnalyze = async (e) => {
    e.preventDefault();
    if (!inputVal.trim()) {
      setError('Please enter a GitHub username or profile URL.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const res = await githubAPI.analyze(inputVal.trim());
      const data = res?.data || res;
      setAnalysis(data);
      setSelectedProjects([]);
      setGeneratedDescriptions({});
    } catch (err) {
      setError(err.message || 'Failed to analyze GitHub profile.');
    } finally {
      setLoading(false);
    }
  };

  const toggleSelectProject = (project) => {
    setSelectedProjects((prev) => {
      const exists = prev.some((p) => p.name === project.name);
      if (exists) {
        return prev.filter((p) => p.name !== project.name);
      } else {
        return [...prev, project];
      }
    });
  };

  const handleGenerateResumeDescriptions = async () => {
    if (selectedProjects.length === 0) return;
    setGeneratingDescs(true);
    try {
      const results = {};
      for (const proj of selectedProjects) {
        results[proj.name] = proj.generated_resume_bullet || `Engineered '${proj.name}' open-source software project using ${proj.language || 'modern tech'}.`;
      }
      setGeneratedDescriptions(results);
    } catch (err) {
      setError('Failed to generate resume descriptions for selected projects.');
    } finally {
      setGeneratingDescs(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8 animate-fade-in">
      {/* Title Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-2">
        <div className="inline-flex items-center space-x-2 px-3 py-1 bg-violet-50 text-violet-700 rounded-full text-xs font-semibold">
          <img src="/hirelens-logo.png" alt="HireLens" className="w-4 h-4 object-contain shrink-0" />
          <span>GitHub Code & Repositories Audit</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900">GitHub Profile & Project Importer</h1>
        <p className="text-slate-500 text-sm">
          Analyze public repositories, languages, documentation, and import top projects into your resume.
        </p>
      </div>

      {/* Input Form */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <form onSubmit={handleAnalyze} className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            placeholder="Enter GitHub username or URL (e.g. torvalds or https://github.com/torvalds)"
            className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-violet-500"
          />
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl text-sm shadow-md flex items-center justify-center space-x-2 transition-all"
          >
            {loading ? (
              <>
                <ArrowPathIcon className="w-5 h-5 animate-spin" />
                <span>Fetching Repos...</span>
              </>
            ) : (
              <>
                <CodeBracketIcon className="w-5 h-5" />
                <span>Analyze Profile</span>
              </>
            )}
          </button>
        </form>
        {error && (
          <div className="mt-4 p-3.5 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm font-medium">
            {error}
          </div>
        )}
      </div>

      {/* Analysis Results */}
      {analysis && (
        <div className="space-y-8 animate-fade-in">
          {/* GitHub Profile Score Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center space-x-6">
              <div className="relative w-20 h-20 flex items-center justify-center bg-violet-50 border-4 border-violet-500 rounded-full">
                <span className="text-2xl font-extrabold text-violet-700">
                  {analysis.github_score}
                </span>
                <span className="text-xs text-violet-500 absolute bottom-2">/100</span>
              </div>
              <div>
                <div className="text-xl font-bold text-slate-900">
                  GitHub Profile ({analysis.github_username})
                </div>
                <p className="text-slate-500 text-sm">
                  {analysis.public_repos} public repos • {analysis.stars_received || 0} stars received
                </p>
              </div>
            </div>

            {/* Languages */}
            <div className="w-full md:w-80">
              <div className="text-xs font-bold uppercase text-slate-500 mb-2">Top Languages</div>
              <div className="flex flex-wrap gap-1.5">
                {analysis.top_languages?.map((lang, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 bg-violet-50 text-violet-800 border border-violet-200 rounded-lg text-xs font-semibold"
                  >
                    {lang}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Repository Selector Grid */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Select GitHub Projects for Resume</h3>
                <p className="text-xs text-slate-500">
                  Choose projects to generate ATS-optimized resume bullet points.
                </p>
              </div>

              {selectedProjects.length > 0 && (
                <button
                  type="button"
                  onClick={handleGenerateResumeDescriptions}
                  disabled={generatingDescs}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow flex items-center space-x-1.5"
                >
                  {generatingDescs ? (
                    <ArrowPathIcon className="w-4 h-4 animate-spin" />
                  ) : (
                    <SparklesIcon className="w-4 h-4" />
                  )}
                  <span>Generate Descriptions ({selectedProjects.length})</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {analysis.repositories?.map((repo) => {
                const isSelected = selectedProjects.some((p) => p.name === repo.name);
                const hasGeneratedDesc = generatedDescriptions[repo.name];

                return (
                  <div
                    key={repo.name}
                    className={`p-4 rounded-xl border transition-all space-y-2 ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-50/50 shadow-sm'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <button
                          type="button"
                          onClick={() => toggleSelectProject(repo)}
                          className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${
                            isSelected
                              ? 'bg-emerald-600 border-emerald-600 text-white'
                              : 'border-slate-300 bg-white'
                          }`}
                        >
                          {isSelected && <CheckIcon className="w-3.5 h-3.5" />}
                        </button>
                        <a
                          href={repo.url}
                          target="_blank"
                          rel="noreferrer"
                          className="font-bold text-slate-900 hover:text-violet-600 text-sm truncate max-w-[200px]"
                        >
                          {repo.name}
                        </a>
                      </div>

                      <div className="flex items-center space-x-3 text-xs text-slate-500 font-medium">
                        {repo.language && (
                          <span className="px-2 py-0.5 bg-slate-100 border rounded font-semibold text-slate-700">
                            {repo.language}
                          </span>
                        )}
                        <span className="flex items-center space-x-0.5">
                          <StarIcon className="w-3.5 h-3.5 text-amber-500" />
                          <span>{repo.stars}</span>
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 line-clamp-2">
                      {repo.description || 'No description provided.'}
                    </p>

                    {/* Generated Resume Description Banner */}
                    {hasGeneratedDesc && (
                      <div className="mt-3 p-3 bg-white border border-emerald-300 rounded-lg space-y-1">
                        <div className="flex items-center space-x-1.5 text-emerald-800 text-xs font-bold">
                          <CheckCircleIcon className="w-4 h-4 text-emerald-600" />
                          <span>AI Resume Description:</span>
                        </div>
                        <p className="text-xs text-slate-700 italic">"{hasGeneratedDesc}"</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
