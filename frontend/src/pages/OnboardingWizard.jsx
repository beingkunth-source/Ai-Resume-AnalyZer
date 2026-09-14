import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { profileAPI, resumeAPI } from '../services/api';
import { CheckIcon, ArrowRightIcon, ArrowLeftIcon, CloudArrowUpIcon, SparklesIcon } from '@heroicons/react/24/outline';
import AIProcessingModal from '../components/AIProcessingModal';

const TARGET_ROLE_OPTIONS = [
  'Software Engineer',
  'Frontend Developer',
  'Backend Developer',
  'Full Stack Developer',
  'Data Analyst',
  'Data Scientist',
  'DevOps Engineer',
  'Cloud Engineer',
  'AI/ML Engineer',
  'Mobile Developer',
  'UI/UX Designer',
  'Product Manager',
];

const GOAL_OPTIONS = [
  'Create my first resume',
  'Improve my existing resume',
  'Get an internship',
  'Get a job',
  'Change careers',
  'Improve my LinkedIn profile',
  'Find jobs matching my skills',
  'Build a complete professional profile',
];

const CURRENT_STATUS_OPTIONS = [
  'Student',
  'Fresher',
  'Intern',
  'Working Professional',
  'Freelancer',
  'Career Changer',
  'Other',
];

export default function OnboardingWizard() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const [error, setError] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    headline: '',
    location: '',
    email: '',
    phone: '',
    portfolio: '',
    website: '',
    linkedinUrl: '',
    githubUrl: '',
    currentStatus: 'Working Professional',
    goals: [],
    targetRoles: [],
    customRole: '',
    workMode: 'Remote',
    targetCountry: '',
    targetCity: '',
    hasResume: null, // 'YES' or 'NO'
  });

  const [resumeFile, setResumeFile] = useState(null);

  const handleTextChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const toggleGoal = (goal) => {
    setFormData((prev) => {
      const exists = prev.goals.includes(goal);
      return {
        ...prev,
        goals: exists ? prev.goals.filter((g) => g !== goal) : [...prev.goals, goal],
      };
    });
  };

  const toggleRole = (role) => {
    setFormData((prev) => {
      const exists = prev.targetRoles.includes(role);
      return {
        ...prev,
        targetRoles: exists ? prev.targetRoles.filter((r) => r !== role) : [...prev.targetRoles, role],
      };
    });
  };

  const addCustomRole = () => {
    if (formData.customRole.trim() && !formData.targetRoles.includes(formData.customRole.trim())) {
      setFormData((prev) => ({
        ...prev,
        targetRoles: [...prev.targetRoles, prev.customRole.trim()],
        customRole: '',
      }));
    }
  };

  const handleNext = () => {
    setError('');
    if (step === 1 && (!formData.firstName.trim() || !formData.lastName.trim())) {
      setError('Please provide your first and last name.');
      return;
    }
    if (step < 7) {
      setStep(step + 1);
    } else {
      finishOnboarding();
    }
  };

  const handleBack = () => {
    setError('');
    if (step > 1) setStep(step - 1);
  };

  const finishOnboarding = async () => {
    setLoading(true);
    setError('');
    try {
      // 1. Save profile information
      const profilePayload = {
        first_name: formData.firstName,
        last_name: formData.lastName,
        headline: formData.headline,
        location: formData.location,
        phone: formData.phone,
        portfolio_url: formData.portfolio,
        website_url: formData.website,
        current_status: formData.currentStatus,
        goals: formData.goals,
        target_roles: formData.targetRoles,
        work_mode_preference: formData.workMode,
        target_locations: [formData.targetCountry, formData.targetCity].filter(Boolean),
        linkedin_url: formData.linkedinUrl,
        github_url: formData.githubUrl,
      };

      await profileAPI.update(profilePayload);

      // 2. Upload resume if available
      if (formData.hasResume === 'YES' && resumeFile) {
        setIsAiProcessing(true);
        await resumeAPI.upload(resumeFile);
      } else {
        navigate('/profile');
      }
    } catch (err) {
      setError(err.message || 'Failed to complete onboarding. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 py-12">
      {/* Top Header */}
      <div className="w-full max-w-2xl mb-6 text-center">
        <div className="flex items-center justify-center space-x-2 text-emerald-600 font-bold text-xl mb-2">
          <img src="/hirelens-logo.png" alt="HireLens Logo" className="h-7 w-auto object-contain shrink-0" />
          <span>HireLens Onboarding</span>
        </div>
        <p className="text-slate-500 text-sm">Step {step} of 7 — Set up your career profile</p>

        {/* Progress Bar */}
        <div className="w-full h-2 bg-slate-200 rounded-full mt-4 overflow-hidden">
          <div
            className="h-full bg-emerald-500 transition-all duration-300 ease-out"
            style={{ width: `${(step / 7) * 100}%` }}
          />
        </div>
      </div>

      {/* Main Card */}
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-sm border border-slate-200 p-8 transition-all">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">
            {error}
          </div>
        )}

        {/* STEP 1: What should we call you? */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">What should we call you?</h2>
              <p className="text-slate-500 text-sm mt-1">Let us personalize your AI career experience.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">First Name *</label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleTextChange}
                  placeholder="e.g. Kunth"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-slate-800 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Last Name *</label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleTextChange}
                  placeholder="e.g. Patel"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-slate-800 outline-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: Tell us about yourself */}
        {step === 2 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Tell us about yourself</h2>
              <p className="text-slate-500 text-sm mt-1">Provide your basic details & links to connect your profiles.</p>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Professional Headline</label>
                <input
                  type="text"
                  name="headline"
                  value={formData.headline}
                  onChange={handleTextChange}
                  placeholder="e.g. Full Stack Developer | Python, React, FastAPI"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 text-sm text-slate-800 outline-none"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Location</label>
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleTextChange}
                    placeholder="e.g. Mumbai, India"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 text-sm text-slate-800 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Phone</label>
                  <input
                    type="text"
                    name="phone"
                    value={formData.phone}
                    onChange={handleTextChange}
                    placeholder="+91 98765 43210"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 text-sm text-slate-800 outline-none"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">LinkedIn Profile URL</label>
                  <input
                    type="url"
                    name="linkedinUrl"
                    value={formData.linkedinUrl}
                    onChange={handleTextChange}
                    placeholder="https://linkedin.com/in/username"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 text-sm text-slate-800 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">GitHub Profile URL</label>
                  <input
                    type="url"
                    name="githubUrl"
                    value={formData.githubUrl}
                    onChange={handleTextChange}
                    placeholder="https://github.com/username"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 text-sm text-slate-800 outline-none"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Portfolio URL</label>
                  <input
                    type="url"
                    name="portfolio"
                    value={formData.portfolio}
                    onChange={handleTextChange}
                    placeholder="https://myportfolio.com"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 text-sm text-slate-800 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Personal Website</label>
                  <input
                    type="url"
                    name="website"
                    value={formData.website}
                    onChange={handleTextChange}
                    placeholder="https://myblog.dev"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 text-sm text-slate-800 outline-none"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: What are you currently? */}
        {step === 3 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">What are you currently?</h2>
              <p className="text-slate-500 text-sm mt-1">Select the status that best describes your career phase.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {CURRENT_STATUS_OPTIONS.map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => setFormData({ ...formData, currentStatus: status })}
                  className={`p-4 rounded-xl border text-left flex items-center justify-between transition-all ${
                    formData.currentStatus === status
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-900 font-semibold shadow-sm'
                      : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
                  }`}
                >
                  <span>{status}</span>
                  {formData.currentStatus === status && (
                    <CheckIcon className="w-5 h-5 text-emerald-600" />
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* STEP 4: What are you trying to achieve? */}
        {step === 4 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">What are you trying to achieve?</h2>
              <p className="text-slate-500 text-sm mt-1">Select all that apply to tailor your AI recommendations.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {GOAL_OPTIONS.map((goal) => {
                const isSelected = formData.goals.includes(goal);
                return (
                  <button
                    key={goal}
                    type="button"
                    onClick={() => toggleGoal(goal)}
                    className={`p-3.5 rounded-xl border text-left flex items-center justify-between text-sm transition-all ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-900 font-semibold shadow-sm'
                        : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
                    }`}
                  >
                    <span>{goal}</span>
                    {isSelected && <CheckIcon className="w-5 h-5 text-emerald-600 flex-shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* STEP 5: Target Roles */}
        {step === 5 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">What type of roles are you targeting?</h2>
              <p className="text-slate-500 text-sm mt-1">Select target roles or add your own custom title.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {TARGET_ROLE_OPTIONS.map((role) => {
                const isSelected = formData.targetRoles.includes(role);
                return (
                  <button
                    key={role}
                    type="button"
                    onClick={() => toggleRole(role)}
                    className={`px-4 py-2 rounded-full text-sm transition-all border ${
                      isSelected
                        ? 'bg-emerald-600 border-emerald-600 text-white font-medium shadow-sm'
                        : 'bg-slate-100 border-slate-200 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    {role} {isSelected && '✓'}
                  </button>
                );
              })}
            </div>
            <div className="flex items-center space-x-2 pt-2">
              <input
                type="text"
                value={formData.customRole}
                onChange={(e) => setFormData({ ...formData, customRole: e.target.value })}
                placeholder="Or type a custom role title..."
                className="flex-1 px-4 py-2 rounded-xl border border-slate-300 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <button
                type="button"
                onClick={addCustomRole}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold rounded-xl"
              >
                Add
              </button>
            </div>
          </div>
        )}

        {/* STEP 6: Location & Work Mode */}
        {step === 6 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Where do you want to work?</h2>
              <p className="text-slate-500 text-sm mt-1">Choose your preferred work environment and locations.</p>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Work Mode</label>
              <div className="grid grid-cols-4 gap-2">
                {['Remote', 'Hybrid', 'On-site', 'Any'].map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setFormData({ ...formData, workMode: mode })}
                    className={`py-2.5 rounded-xl border text-sm font-medium transition-all ${
                      formData.workMode === mode
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-900 font-semibold'
                        : 'border-slate-200 text-slate-700 bg-white hover:border-slate-300'
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Target Country</label>
                <input
                  type="text"
                  name="targetCountry"
                  value={formData.targetCountry}
                  onChange={handleTextChange}
                  placeholder="e.g. India, United States, Remote"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 text-sm outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Target City / State</label>
                <input
                  type="text"
                  name="targetCity"
                  value={formData.targetCity}
                  onChange={handleTextChange}
                  placeholder="e.g. Bengaluru, Mumbai, California"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 text-sm outline-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 7: Do you already have a resume? */}
        {step === 7 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Do you already have a resume?</h2>
              <p className="text-slate-500 text-sm mt-1">Upload your current PDF or DOCX resume, or build one from scratch.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, hasResume: 'YES' })}
                className={`p-6 rounded-2xl border text-center transition-all ${
                  formData.hasResume === 'YES'
                    ? 'border-emerald-500 bg-emerald-50 ring-2 ring-emerald-500'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <CloudArrowUpIcon className="w-10 h-10 mx-auto text-emerald-600 mb-2" />
                <div className="font-bold text-slate-900">YES, I have a resume</div>
                <div className="text-xs text-slate-500 mt-1">Upload PDF or DOCX to auto-extract skills & experience</div>
              </button>

              <button
                type="button"
                onClick={() => setFormData({ ...formData, hasResume: 'NO' })}
                className={`p-6 rounded-2xl border text-center transition-all ${
                  formData.hasResume === 'NO'
                    ? 'border-emerald-500 bg-emerald-50 ring-2 ring-emerald-500'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <SparklesIcon className="w-10 h-10 mx-auto text-emerald-600 mb-2" />
                <div className="font-bold text-slate-900">NO, create from scratch</div>
                <div className="text-xs text-slate-500 mt-1">Build a brand-new professional profile using AI</div>
              </button>
            </div>

            {formData.hasResume === 'YES' && (
              <div className="pt-4 border-t border-slate-100">
                <label className="block text-sm font-semibold text-slate-700 mb-2">Select Resume File (PDF / DOCX)</label>
                <input
                  type="file"
                  accept=".pdf,.docx,.doc"
                  onChange={(e) => setResumeFile(e.target.files[0] || null)}
                  className="block w-full text-sm text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
                />
                {resumeFile && (
                  <p className="text-xs text-emerald-600 font-medium mt-2">
                    Selected file: {resumeFile.name}
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-8 border-t border-slate-100 mt-8">
          {step > 1 ? (
            <button
              type="button"
              onClick={handleBack}
              disabled={loading}
              className="flex items-center space-x-1.5 px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 text-sm font-semibold transition-all"
            >
              <ArrowLeftIcon className="w-4 h-4" />
              <span>Back</span>
            </button>
          ) : <div />}

          <button
            type="button"
            onClick={handleNext}
            disabled={loading}
            className="flex items-center space-x-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm shadow-md shadow-emerald-600/20 transition-all"
          >
            <span>{step === 7 ? 'Complete Setup' : 'Continue'}</span>
            <ArrowRightIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      <AIProcessingModal
        isOpen={isAiProcessing}
        title="Analyzing Resume & Building Profile"
        onComplete={() => navigate('/profile')}
      />
    </div>
  );
}
