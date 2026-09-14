import React, { useState, useEffect } from 'react';
import { resumeGeneratorAPI, profileAPI } from '../services/api';
import {
  SparklesIcon,
  DocumentDuplicateIcon,
  ArrowDownTrayIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  PencilSquareIcon,
  EyeIcon,
  ArrowPathIcon,
  CheckIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import AIProcessingModal from '../components/AIProcessingModal';

const GOAL_OPTIONS = [
  'General Resume',
  'Internship',
  'Software Engineering Job',
  'Specific Job',
  'Academic Application',
  'Freelance Work',
  'Career Change',
];

const TEMPLATES = [
  { id: 'classic', name: 'Classic', desc: 'Traditional 1-column layout, ideal for conservative industries', ats: true },
  { id: 'modern', name: 'Modern', desc: 'Clean header with accent bar, modern typography', ats: true },
  { id: 'minimal', name: 'Minimal', desc: 'Ultra-clean whitespace-first layout with subtle dividers', ats: true },
  { id: 'professional', name: 'Professional', desc: 'Compact high-density layout for experienced roles', ats: true },
  { id: 'ats-friendly', name: 'ATS Friendly', desc: 'Strict standard formatting guaranteed 100% readable by ATS scanners', ats: true },
  { id: 'tech', name: 'Tech', desc: 'Highlights tech skills, GitHub projects, and system architectures', ats: true },
  { id: 'executive', name: 'Executive', desc: 'Refined typography with emphasis on leadership impact', ats: true },
  { id: 'creative', name: 'Creative', desc: 'Subtle color accents for design & product management roles', ats: false },
  { id: 'student', name: 'Student', desc: 'Highlights education, academic projects, and coursework', ats: true },
  { id: 'academic', name: 'Academic', desc: 'CV style layout for research, publications, and education', ats: true },
];

function TemplateMiniPreview({ id, accentColor = '#059669' }) {
  if (id === 'classic') {
    return (
      <div className="h-28 bg-white rounded-lg border border-slate-200 p-2 space-y-1 flex flex-col justify-between overflow-hidden text-[9px]">
        <div className="text-center pb-1 border-b-2 border-slate-300">
          <div className="font-extrabold text-slate-900 text-[10px]">ALEX MORGAN</div>
          <div className="text-slate-500 text-[7px]">Senior Software Engineer • NYC</div>
        </div>
        <div className="space-y-1">
          <div className="font-bold text-slate-700 uppercase tracking-wider text-[7px] border-b border-slate-200">Work Experience</div>
          <div className="h-1.5 bg-slate-200 rounded w-full" />
          <div className="h-1.5 bg-slate-200 rounded w-4/5" />
        </div>
        <div className="space-y-1">
          <div className="font-bold text-slate-700 uppercase tracking-wider text-[7px] border-b border-slate-200">Education</div>
          <div className="h-1.5 bg-slate-200 rounded w-3/4" />
        </div>
      </div>
    );
  }

  if (id === 'modern') {
    return (
      <div className="h-28 bg-white rounded-lg border border-slate-200 overflow-hidden flex flex-col justify-between text-[9px]">
        <div className="p-2 text-white space-y-0.5" style={{ backgroundColor: accentColor }}>
          <div className="font-extrabold text-[10px]">SARAH CHEN</div>
          <div className="text-[7px] opacity-90">Lead Frontend Architect</div>
        </div>
        <div className="p-2 space-y-1 flex-1 bg-slate-50/50">
          <div className="space-y-1">
            <div className="font-bold text-[7px] uppercase" style={{ color: accentColor }}>Summary</div>
            <div className="h-1.5 bg-slate-200 rounded w-full" />
          </div>
          <div className="space-y-1">
            <div className="font-bold text-[7px] uppercase" style={{ color: accentColor }}>Skills & Stack</div>
            <div className="flex gap-1">
              <span className="w-4 h-1 bg-slate-300 rounded" />
              <span className="w-5 h-1 bg-slate-300 rounded" />
              <span className="w-4 h-1 bg-slate-300 rounded" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (id === 'minimal') {
    return (
      <div className="h-28 bg-white rounded-lg border border-slate-200 p-2 space-y-1.5 flex flex-col justify-between text-[9px]">
        <div className="space-y-0.5">
          <div className="font-black text-slate-900 text-[10px] tracking-tight">DAVID KIM</div>
          <div className="text-slate-400 text-[7px]">david@kim.dev</div>
        </div>
        <div className="space-y-1 pl-1.5 border-l-2" style={{ borderColor: accentColor }}>
          <div className="h-1.5 bg-slate-200 rounded w-full" />
          <div className="h-1.5 bg-slate-200 rounded w-3/4" />
        </div>
        <div className="flex gap-1 text-[7px]">
          <span className="px-1 bg-slate-100 rounded text-slate-600">Python</span>
          <span className="px-1 bg-slate-100 rounded text-slate-600">AWS</span>
        </div>
      </div>
    );
  }

  if (id === 'tech') {
    return (
      <div className="h-28 bg-white rounded-lg border border-slate-200 p-1.5 grid grid-cols-3 gap-1 text-[8px]">
        <div className="col-span-1 p-1 bg-slate-100 rounded space-y-1 flex flex-col justify-between">
          <div>
            <div className="font-extrabold text-[8px] text-slate-800">TECH STACK</div>
            <div className="h-1 bg-slate-300 rounded w-full mt-1" />
            <div className="h-1 bg-slate-300 rounded w-3/4 mt-0.5" />
          </div>
          <div className="text-[6px] text-slate-400">GitHub Verified</div>
        </div>
        <div className="col-span-2 p-1 space-y-1 flex flex-col justify-between">
          <div className="font-bold text-[7px] uppercase" style={{ color: accentColor }}>Projects & Architecture</div>
          <div className="h-1.5 bg-slate-200 rounded w-full" />
          <div className="h-1.5 bg-slate-200 rounded w-4/5" />
        </div>
      </div>
    );
  }

  if (id === 'executive') {
    return (
      <div className="h-28 bg-white rounded-lg border border-slate-200 p-1.5 space-y-1 flex flex-col justify-between text-[9px]">
        <div className="p-1 rounded flex items-center justify-between text-white" style={{ backgroundColor: accentColor }}>
          <div>
            <div className="font-black text-[9px]">MICHAEL VANCE</div>
            <div className="text-[7px] opacity-90">VP Engineering</div>
          </div>
        </div>
        <div className="space-y-1">
          <div className="font-bold text-[7px] uppercase text-slate-700">Executive Impact</div>
          <div className="h-1.5 bg-slate-200 rounded w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="h-28 bg-white rounded-lg border border-slate-200 p-2 space-y-1.5 flex flex-col justify-between text-[9px]">
      <div className="pb-1 border-b border-slate-200 flex justify-between items-center">
        <div>
          <div className="font-bold text-slate-800 text-[9px]">CANDIDATE NAME</div>
          <div className="text-slate-400 text-[7px]">Target Title</div>
        </div>
        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: accentColor }} />
      </div>
      <div className="space-y-1">
        <div className="h-1.5 bg-slate-200 rounded w-full" />
        <div className="h-1.5 bg-slate-200 rounded w-4/5" />
      </div>
    </div>
  );
}

export default function ResumeGenerator() {
  const [activeStep, setActiveStep] = useState(1); // 1: Goal, 2: Template, 3: Editor & Preview
  const [goal, setGoal] = useState('General Resume');
  const [jobTitle, setJobTitle] = useState('');
  const [company, setCompany] = useState('');
  const [jobDescription, setJobDescription] = useState('');

  const [sources, setSources] = useState({
    profile: true,
    linkedin: true,
    github: true,
  });

  const [selectedTemplate, setSelectedTemplate] = useState('ats-friendly');
  const [accentColor, setAccentColor] = useState('#059669'); // Emerald default
  const [pageSize, setPageSize] = useState('A4');

  const [resumeData, setResumeData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const [error, setError] = useState('');

  // AI Improve State
  const [editingField, setEditingField] = useState(null);
  const [originalValue, setOriginalValue] = useState('');
  const [improvedValue, setImprovedValue] = useState('');
  const [improving, setImproving] = useState(false);

  // ATS Check State
  const [atsAudit, setAtsAudit] = useState(null);
  const [auditing, setAuditing] = useState(false);

  useEffect(() => {
    // Load initial user profile into resume template if available
    loadProfileData();
  }, []);

  const loadProfileData = async () => {
    try {
      const p = await profileAPI.get();
      if (p) {
        setResumeData({
          name: `${p.first_name || ''} ${p.last_name || ''}`.trim() || 'Your Name',
          headline: p.headline || 'Software Engineer',
          email: p.email || '',
          phone: p.phone || '',
          location: p.location || '',
          linkedin: p.linkedin_url || '',
          github: p.github_url || '',
          website: p.website_url || '',
          summary: p.summary || 'Passionate software developer with experience in building scalable web applications.',
          skills: p.skills || ['Python', 'FastAPI', 'React', 'PostgreSQL', 'Docker'],
          experience: p.experience || [
            {
              title: 'Software Developer',
              company: 'Tech Solutions Inc.',
              dates: '2023 - Present',
              description: 'Developed scalable REST APIs using FastAPI and React frontend components.',
            },
          ],
          education: p.education || [
            {
              degree: 'B.Tech in Computer Science',
              institution: 'State University',
              dates: '2020 - 2024',
            },
          ],
          projects: p.projects || [],
          certifications: p.certifications || [],
        });
      }
    } catch (err) {
      console.log('Profile load non-fatal:', err);
    }
  };

  const handleGenerateContent = async () => {
    setIsAiProcessing(true);
    setError('');
    try {
      const res = await resumeGeneratorAPI.generate({
        goal,
        target_role: jobTitle || 'Software Engineer',
        target_company: company,
        job_description: jobDescription,
        use_sources: sources,
      });

      const content = res.content || res.resume_content || res.data?.content || res.data?.resume_content || (res.data && res.data.personal_info ? res.data : null);
      if (content) {
        setResumeData(content);
      }
      setActiveStep(3); // Go to editor/preview
    } catch (err) {
      setError(err.message || 'Resume content generation failed.');
    } finally {
      setIsAiProcessing(false);
    }
  };

  const handleEnrichResume = async () => {
    setIsAiProcessing(true);
    setError('');
    try {
      const res = await resumeGeneratorAPI.enrich({
        resume_content: resumeData,
        target_role: jobTitle || resumeData?.headline || resumeData?.personal_info?.headline || 'Software Engineer',
        goal: goal,
      });

      const content = res.content || res.resume_content || res.data?.content || res.data?.resume_content || (res.data && res.data.personal_info ? res.data : null);
      if (content) {
        setResumeData(content);
      }
      const audit = res.ats_audit || res.data?.ats_audit;
      if (audit) {
        setAtsAudit(audit);
      }
    } catch (err) {
      setError(err.message || 'AI resume enrichment failed.');
    } finally {
      setIsAiProcessing(false);
    }
  };

  const handleAiImprove = async (field, currentText) => {
    setEditingField(field);
    setOriginalValue(currentText);
    setImprovedValue('');
    setImproving(true);

    try {
      const res = await resumeGeneratorAPI.improve({
        section_name: field,
        current_content: currentText,
        target_role: jobTitle || resumeData.headline || 'Software Engineer',
      });
      setImprovedValue(res.improved_content);
    } catch (err) {
      setError('AI enhancement failed.');
      setEditingField(null);
    } finally {
      setImproving(false);
    }
  };

  const acceptImprovement = () => {
    if (!editingField || !improvedValue) return;
    setResumeData((prev) => ({
      ...prev,
      [editingField]: improvedValue,
    }));
    setEditingField(null);
  };

  const runAtsAudit = async () => {
    if (!resumeData) return;
    setAuditing(true);
    try {
      const auditRes = await resumeGeneratorAPI.atsCheck({
        resume_content: resumeData,
        template_id: selectedTemplate,
      });
      setAtsAudit(auditRes);
    } catch (err) {
      setError('ATS Audit failed.');
    } finally {
      setAuditing(false);
    }
  };

  const handleExportDocx = async () => {
    try {
      const blob = await resumeGeneratorAPI.exportDocx({
        resume_content: resumeData,
        template_id: selectedTemplate,
        primary_color: accentColor,
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${resumeData.name.replace(/\s+/g, '_')}_Resume.docx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      setError('DOCX download failed.');
    }
  };

  const handleExportPdf = async () => {
    try {
      const blob = await resumeGeneratorAPI.exportPdf({
        resume_content: resumeData,
        template_id: selectedTemplate,
        primary_color: accentColor,
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${resumeData.name.replace(/\s+/g, '_')}_Resume.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      setError('PDF download failed. Exporting DOCX fallback...');
      handleExportDocx();
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8 animate-fade-in">
      {/* Top Header & Step Navigation */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-semibold mb-1">
            <img src="/hirelens-logo.png" alt="HireLens" className="w-4 h-4 object-contain shrink-0" />
            <span>AI Professional Resume Builder</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Goal-Based AI Resume Generator</h1>
        </div>

        {/* Step Indicator Buttons */}
        <div className="flex items-center space-x-2 bg-slate-100 p-1.5 rounded-xl text-xs font-bold">
          <button
            onClick={() => setActiveStep(1)}
            className={`px-4 py-2 rounded-lg transition-all ${
              activeStep === 1 ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-600'
            }`}
          >
            1. Select Goal
          </button>
          <button
            onClick={() => setActiveStep(2)}
            className={`px-4 py-2 rounded-lg transition-all ${
              activeStep === 2 ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-600'
            }`}
          >
            2. Pick Template
          </button>
          <button
            onClick={() => setActiveStep(3)}
            className={`px-4 py-2 rounded-lg transition-all ${
              activeStep === 3 ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-600'
            }`}
          >
            3. Live Editor & Export
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm font-medium">
          {error}
        </div>
      )}

      {/* STEP 1: Goal Selection & Data Sources */}
      {activeStep === 1 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm space-y-8 animate-fade-in">
          <div>
            <h2 className="text-xl font-bold text-slate-900">What are you creating this resume for?</h2>
            <p className="text-slate-500 text-sm mt-1">
              Select your primary goal so AI can tailor keywords, action verbs, and structure.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            {GOAL_OPTIONS.map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => setGoal(g)}
                className={`p-4 rounded-xl border text-left font-semibold text-sm transition-all ${
                  goal === g
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-900 ring-2 ring-emerald-500'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                }`}
              >
                {g}
              </button>
            ))}
          </div>

          {/* Specific Job Inputs */}
          {goal === 'Specific Job' && (
            <div className="p-6 bg-slate-50 border border-slate-200 rounded-xl space-y-4">
              <h3 className="text-sm font-bold text-slate-800">Target Job Specification</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Job Title</label>
                  <input
                    type="text"
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                    placeholder="e.g. Senior Backend Engineer"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Company</label>
                  <input
                    type="text"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    placeholder="e.g. Google, Stripe, Startup"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Job Description</label>
                <textarea
                  rows={4}
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  placeholder="Paste the target job description to optimize keywords..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm outline-none"
                />
              </div>
            </div>
          )}

          {/* Sources Checkboxes */}
          <div className="space-y-3 pt-4 border-t border-slate-100">
            <h3 className="text-sm font-bold text-slate-800">Verified Profile Sources to Include</h3>
            <div className="flex flex-wrap gap-6 text-sm">
              <label className="flex items-center space-x-2 font-medium text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={sources.profile}
                  onChange={(e) => setSources({ ...sources, profile: e.target.checked })}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                />
                <span>Profile Information & Experience</span>
              </label>
              <label className="flex items-center space-x-2 font-medium text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={sources.linkedin}
                  onChange={(e) => setSources({ ...sources, linkedin: e.target.checked })}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                />
                <span>LinkedIn Headline & Keywords</span>
              </label>
              <label className="flex items-center space-x-2 font-medium text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={sources.github}
                  onChange={(e) => setSources({ ...sources, github: e.target.checked })}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                />
                <span>GitHub Selected Projects & Languages</span>
              </label>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <button
              type="button"
              onClick={handleGenerateContent}
              className="px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg shadow-emerald-600/20 flex items-center space-x-2 transition-all"
            >
              <SparklesIcon className="w-5 h-5" />
              <span>Generate Content & Pick Template</span>
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: Template Selection System */}
      {activeStep === 2 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm space-y-8 animate-fade-in">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Choose a Professional Resume Template</h2>
            <p className="text-slate-500 text-sm mt-1">
              Select from 10 original ATS-friendly layout designs.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {TEMPLATES.map((tmpl) => {
              const isSelected = selectedTemplate === tmpl.id;
              return (
                <div
                  key={tmpl.id}
                  onClick={() => setSelectedTemplate(tmpl.id)}
                  className={`p-5 rounded-2xl border cursor-pointer transition-all space-y-3 ${
                    isSelected
                      ? 'border-emerald-500 bg-emerald-50/50 ring-2 ring-emerald-500 shadow-md scale-[1.02]'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-slate-900">{tmpl.name}</h3>
                    {tmpl.ats && (
                      <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 rounded-full text-[10px] font-extrabold uppercase">
                        ATS Friendly
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 line-clamp-2">{tmpl.desc}</p>
                  
                  {/* Real visual mini layout card */}
                  <TemplateMiniPreview id={tmpl.id} accentColor={accentColor} />
                </div>
              );
            })}
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setActiveStep(1)}
              className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700 text-sm font-semibold"
            >
              Back to Goal
            </button>
            <button
              type="button"
              onClick={() => setActiveStep(3)}
              className="px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg shadow-emerald-600/20"
            >
              Open Live Editor & Preview
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: Live Editor, AI Improver, ATS Auditor & Exporter */}
      {activeStep === 3 && resumeData && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fade-in">
          {/* Left Column: Editable Form & Controls (7 Cols) */}
          <div className="lg:col-span-7 space-y-6">
            {/* Customization Toolbar */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center space-x-3 text-xs font-semibold text-slate-700">
                <span>Accent Color:</span>
                {['#059669', '#2563EB', '#7C3AED', '#DC2626', '#09090B'].map((clr) => (
                  <button
                    key={clr}
                    onClick={() => setAccentColor(clr)}
                    style={{ backgroundColor: clr }}
                    className={`w-6 h-6 rounded-full border-2 transition-all ${
                      accentColor === clr ? 'border-slate-900 scale-110' : 'border-transparent'
                    }`}
                  />
                ))}
              </div>

              <div className="flex items-center space-x-3 text-xs font-semibold text-slate-700">
                <span>Page Size:</span>
                <select
                  value={pageSize}
                  onChange={(e) => setPageSize(e.target.value)}
                  className="px-3 py-1 rounded-lg border border-slate-300 bg-white"
                >
                  <option value="A4">A4 Standard</option>
                  <option value="Letter">US Letter</option>
                </select>
              </div>
            </div>

            {/* Editable Fields */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-100">
                <h3 className="text-lg font-bold text-slate-900">Edit Resume Content</h3>
                <button
                  type="button"
                  onClick={handleEnrichResume}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow flex items-center space-x-1.5 transition-all"
                >
                  <SparklesIcon className="w-4 h-4" />
                  <span>✨ AI Auto-Expand & Enrich CV</span>
                </button>
              </div>

              {/* Personal Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    value={resumeData.name || resumeData.personal_info?.name || ''}
                    onChange={(e) => setResumeData({ ...resumeData, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-semibold text-slate-900 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Headline / Target Title</label>
                  <input
                    type="text"
                    value={resumeData.headline || resumeData.personal_info?.headline || ''}
                    onChange={(e) => setResumeData({ ...resumeData, headline: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm text-slate-800 outline-none"
                  />
                </div>
              </div>

              {/* Summary with AI Improve */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700">Professional Summary</label>
                  <button
                    type="button"
                    onClick={() => handleAiImprove('summary', resumeData.summary)}
                    className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center space-x-1"
                  >
                    <SparklesIcon className="w-3.5 h-3.5" />
                    <span>Improve with AI</span>
                  </button>
                </div>
                <textarea
                  rows={3}
                  value={resumeData.summary || ''}
                  onChange={(e) => setResumeData({ ...resumeData, summary: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm text-slate-800 outline-none"
                />
              </div>

              {/* Technical Skills */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Technical Skills (Comma Separated)</label>
                <input
                  type="text"
                  value={
                    Array.isArray(resumeData.skills)
                      ? resumeData.skills.join(', ')
                      : Array.isArray(resumeData.technical_skills)
                      ? resumeData.technical_skills.join(', ')
                      : resumeData.skills || ''
                  }
                  onChange={(e) =>
                    setResumeData({ ...resumeData, skills: e.target.value.split(',').map((s) => s.trim()) })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm text-slate-800 outline-none"
                />
              </div>

              {/* Work Experience list */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-slate-900">Work Experience</h4>
                  <button
                    type="button"
                    onClick={() => {
                      const updated = [...(resumeData.experience || [])];
                      updated.push({
                        title: 'Software Developer',
                        company: 'Tech Enterprise',
                        dates: '2023 - Present',
                        bullets: ['Engineered scalable microservices.', 'Optimized SQL database query latency.'],
                      });
                      setResumeData({ ...resumeData, experience: updated });
                    }}
                    className="text-xs text-emerald-600 font-bold hover:underline"
                  >
                    + Add Experience
                  </button>
                </div>
                {resumeData.experience?.map((exp, idx) => (
                  <div key={idx} className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="text"
                        value={exp.title || exp.role || ''}
                        onChange={(e) => {
                          const updated = [...resumeData.experience];
                          updated[idx].title = e.target.value;
                          updated[idx].role = e.target.value;
                          setResumeData({ ...resumeData, experience: updated });
                        }}
                        placeholder="Job Title"
                        className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-bold"
                      />
                      <input
                        type="text"
                        value={exp.company || ''}
                        onChange={(e) => {
                          const updated = [...resumeData.experience];
                          updated[idx].company = e.target.value;
                          setResumeData({ ...resumeData, experience: updated });
                        }}
                        placeholder="Company"
                        className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-bold text-emerald-700"
                      />
                    </div>
                    <textarea
                      rows={3}
                      value={Array.isArray(exp.bullets) ? exp.bullets.join('\n') : exp.description || ''}
                      onChange={(e) => {
                        const updated = [...resumeData.experience];
                        const lines = e.target.value.split('\n').filter(Boolean);
                        updated[idx].bullets = lines;
                        updated[idx].description = e.target.value;
                        setResumeData({ ...resumeData, experience: updated });
                      }}
                      placeholder="Bullet points (one per line)..."
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs text-slate-700"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Live Template Document Preview & Export (5 Cols) */}
          <div className="lg:col-span-5 space-y-6">
            {/* Action Bar */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={runAtsAudit}
                  disabled={auditing}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5"
                >
                  {auditing ? <ArrowPathIcon className="w-4 h-4 animate-spin" /> : <CheckCircleIcon className="w-4 h-4" />}
                  <span>Run ATS Audit</span>
                </button>

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={handleExportDocx}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow flex items-center space-x-1.5"
                  >
                    <ArrowDownTrayIcon className="w-4 h-4" />
                    <span>Download DOCX</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleExportPdf}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow flex items-center space-x-1.5"
                  >
                    <ArrowDownTrayIcon className="w-4 h-4" />
                    <span>Download PDF</span>
                  </button>
                </div>
              </div>

              {/* ATS Audit Score Banner */}
              {atsAudit && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2 font-bold text-emerald-900">
                    <CheckCircleIcon className="w-5 h-5 text-emerald-600" />
                    <span>ATS Readiness Score: {atsAudit.ats_score}/100</span>
                  </div>
                  <span className="text-emerald-700 font-semibold">{atsAudit.status || atsAudit.recommendation}</span>
                </div>
              )}
            </div>

            {/* Live Paper Preview Card */}
            <div className="bg-white rounded-2xl border border-slate-300 p-8 shadow-lg min-h-[650px] text-slate-800 space-y-5">
              {/* Personal Info Header */}
              <div
                className="pb-4 border-b space-y-1"
                style={{ borderColor: accentColor }}
              >
                <h2 className="text-2xl font-bold" style={{ color: accentColor }}>
                  {resumeData.name || resumeData.personal_info?.name}
                </h2>
                <div className="text-sm font-semibold text-slate-600">
                  {resumeData.headline || resumeData.personal_info?.headline}
                </div>
                <div className="text-[11px] text-slate-500 flex flex-wrap gap-2 pt-1">
                  {(resumeData.email || resumeData.personal_info?.email) && <span>{resumeData.email || resumeData.personal_info?.email}</span>}
                  {(resumeData.phone || resumeData.personal_info?.phone) && <span>• {resumeData.phone || resumeData.personal_info?.phone}</span>}
                  {(resumeData.location || resumeData.personal_info?.location) && <span>• {resumeData.location || resumeData.personal_info?.location}</span>}
                  {(resumeData.linkedin || resumeData.personal_info?.linkedin_url) && <span>• LinkedIn</span>}
                  {(resumeData.github || resumeData.personal_info?.github_url) && <span>• GitHub</span>}
                </div>
              </div>

              {/* Summary */}
              {resumeData.summary && (
                <div className="space-y-1">
                  <div
                    className="text-xs font-bold uppercase tracking-wider"
                    style={{ color: accentColor }}
                  >
                    Professional Summary
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed">{resumeData.summary}</p>
                </div>
              )}

              {/* Technical & Soft Skills */}
              {(resumeData.skills?.length > 0 || resumeData.technical_skills?.length > 0) && (
                <div className="space-y-1.5">
                  <div
                    className="text-xs font-bold uppercase tracking-wider"
                    style={{ color: accentColor }}
                  >
                    Technical Skills & Core Competencies
                  </div>
                  <div className="flex flex-wrap gap-1.5 text-xs text-slate-800 font-medium">
                    {(Array.isArray(resumeData.skills)
                      ? resumeData.skills
                      : Array.isArray(resumeData.technical_skills)
                      ? resumeData.technical_skills
                      : [resumeData.skills]
                    ).map((sk, i) => (
                      <span key={i} className="px-2 py-0.5 bg-slate-100 border border-slate-200 rounded text-[11px] font-semibold text-slate-700">
                        {sk}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Work Experience */}
              {resumeData.experience?.length > 0 && (
                <div className="space-y-3">
                  <div
                    className="text-xs font-bold uppercase tracking-wider border-b border-slate-100 pb-0.5"
                    style={{ color: accentColor }}
                  >
                    Work Experience
                  </div>
                  {resumeData.experience.map((exp, idx) => (
                    <div key={idx} className="text-xs space-y-1">
                      <div className="flex justify-between font-bold text-slate-900">
                        <span>{exp.title || exp.role}</span>
                        <span className="text-[10px] text-slate-500">{exp.dates || exp.duration}</span>
                      </div>
                      <div className="font-semibold text-emerald-700 text-[11px]">{exp.company} {exp.location ? `• ${exp.location}` : ''}</div>
                      {Array.isArray(exp.bullets) && exp.bullets.length > 0 ? (
                        <ul className="list-disc list-inside space-y-0.5 text-slate-700 text-[11px]">
                          {exp.bullets.map((b, bi) => (
                            <li key={bi} className="leading-snug">{b}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-slate-700 text-[11px] leading-snug">{exp.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Technical Projects */}
              {resumeData.projects?.length > 0 && (
                <div className="space-y-3 pt-1">
                  <div
                    className="text-xs font-bold uppercase tracking-wider border-b border-slate-100 pb-0.5"
                    style={{ color: accentColor }}
                  >
                    Technical Projects
                  </div>
                  {resumeData.projects.map((proj, idx) => (
                    <div key={idx} className="text-xs space-y-1">
                      <div className="flex items-center justify-between font-bold text-slate-900">
                        <span>{proj.title || proj.name}</span>
                        {proj.role && <span className="text-[10px] text-slate-500">{proj.role}</span>}
                      </div>
                      {proj.technologies?.length > 0 && (
                        <div className="text-[10px] font-semibold text-slate-500">
                          Tech: {Array.isArray(proj.technologies) ? proj.technologies.join(', ') : proj.technologies}
                        </div>
                      )}
                      {Array.isArray(proj.bullets) && proj.bullets.length > 0 ? (
                        <ul className="list-disc list-inside space-y-0.5 text-slate-700 text-[11px]">
                          {proj.bullets.map((b, bi) => (
                            <li key={bi} className="leading-snug">{b}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-slate-700 text-[11px] leading-snug">{proj.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Education */}
              {resumeData.education?.length > 0 && (
                <div className="space-y-2 pt-1">
                  <div
                    className="text-xs font-bold uppercase tracking-wider border-b border-slate-100 pb-0.5"
                    style={{ color: accentColor }}
                  >
                    Education & Credentials
                  </div>
                  {resumeData.education.map((edu, idx) => (
                    <div key={idx} className="text-xs space-y-0.5">
                      <div className="flex justify-between font-bold text-slate-900">
                        <span>{edu.degree} {edu.field ? `in ${edu.field}` : ''}</span>
                        <span className="text-[10px] text-slate-500">{edu.year}</span>
                      </div>
                      <div className="text-[11px] text-slate-600 font-semibold">{edu.institution}</div>
                      {edu.coursework && <div className="text-[10px] text-slate-500">Coursework: {edu.coursework}</div>}
                    </div>
                  ))}
                </div>
              )}

              {/* Certifications & Achievements */}
              {(resumeData.certifications?.length > 0 || resumeData.achievements?.length > 0) && (
                <div className="space-y-2 pt-1">
                  <div
                    className="text-xs font-bold uppercase tracking-wider border-b border-slate-100 pb-0.5"
                    style={{ color: accentColor }}
                  >
                    Certifications & Key Achievements
                  </div>
                  <ul className="list-disc list-inside space-y-0.5 text-slate-700 text-[11px]">
                    {resumeData.certifications?.map((cert, ci) => (
                      <li key={`c_${ci}`}>{cert}</li>
                    ))}
                    {resumeData.achievements?.map((ach, ai) => (
                      <li key={`a_${ai}`}>{ach}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Side-by-Side AI Wording Improvement Modal */}
      {editingField && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl border border-slate-200 p-6 space-y-6">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center space-x-2 text-emerald-700 font-bold">
                <SparklesIcon className="w-5 h-5" />
                <span>AI Wording Enhancer ({editingField})</span>
              </div>
              <button onClick={() => setEditingField(null)} className="text-slate-400 hover:text-slate-600">
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            {improving ? (
              <div className="py-12 flex flex-col items-center justify-center text-slate-500 space-y-2">
                <ArrowPathIcon className="w-8 h-8 animate-spin text-emerald-600" />
                <p className="text-sm font-semibold">Crafting ATS-optimized impact wording...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="p-4 bg-slate-50 border rounded-xl space-y-2">
                  <div className="font-bold text-slate-500 uppercase">Original Wording</div>
                  <div className="text-slate-700 leading-relaxed whitespace-pre-line">{originalValue}</div>
                </div>

                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-2">
                  <div className="font-bold text-emerald-800 uppercase flex items-center space-x-1">
                    <SparklesIcon className="w-3.5 h-3.5" />
                    <span>AI Suggested Wording</span>
                  </div>
                  <div className="text-slate-900 font-medium leading-relaxed whitespace-pre-line">
                    {improvedValue}
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-3 pt-3 border-t">
              <button
                onClick={() => setEditingField(null)}
                className="px-4 py-2 border rounded-xl text-xs font-semibold text-slate-600"
              >
                Reject & Keep Original
              </button>
              <button
                onClick={acceptImprovement}
                disabled={improving || !improvedValue}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow"
              >
                Accept AI Wording
              </button>
            </div>
          </div>
        </div>
      )}

      <AIProcessingModal
        isOpen={isAiProcessing}
        title="Generating Tailored Resume Content"
        onComplete={() => setIsAiProcessing(false)}
      />
    </div>
  );
}
