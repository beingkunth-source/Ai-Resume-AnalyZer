import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Wand2,
  Github,
  Linkedin,
  Plus,
  Trash2,
  Sparkles,
  Download,
  Upload,
  User,
  Briefcase,
  GraduationCap,
  FolderGit2,
  Code,
  FileCheck,
  CheckCircle2,
  Loader2,
  ArrowRight,
  Camera,
  Printer,
  FileText,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { builderAPI, analysisAPI } from '../services/api';
import Button from '../components/Button';
import Card from '../components/Card';
import SkillBadge from '../components/SkillBadge';
import ResumeTemplates from '../components/ResumeTemplates';

const DEMO_BUILDER_DATA = {
  personalInfo: {
    name: 'Alex Vance',
    email: 'alex.vance@example.com',
    phone: '+91 98765 43210',
    location: 'Bengaluru, India',
    headline: 'Senior Full Stack Engineer (React, Python, Cloud)',
    linkedin: 'https://linkedin.com/in/alexvance-demo',
    github: 'https://github.com/alexvance',
  },
  summary:
    'Results-driven Full Stack Engineer with 4+ years of experience engineering high-throughput REST APIs, cloud microservices, and modern responsive frontend web applications. Expert in React, Python, FastAPI, and PostgreSQL.',
  experience: [
    {
      id: 'exp-1',
      company: 'TechCorp Solutions',
      title: 'Senior Software Engineer',
      dates: 'Jan 2022 - Present',
      description:
        'Architected and deployed microservices using FastAPI, Redis, and PostgreSQL, increasing system transaction throughput by 40%.\nEngineered responsive frontend interfaces in React and TypeScript with 99.8% crash-free sessions.',
    },
    {
      id: 'exp-2',
      company: 'InnoTech Labs',
      title: 'Full Stack Developer',
      dates: 'Jun 2020 - Dec 2021',
      description:
        'Built real-time data visualization dashboards consuming WebSocket APIs for 50k+ daily active users.\nImplemented automated CI/CD pipelines using GitHub Actions, reducing deployment cycle times by 65%.',
    },
  ],
  education: [
    {
      id: 'edu-1',
      institution: 'National Institute of Technology (NIT)',
      degree: 'B.Tech in Computer Science and Engineering',
      dates: '2016 - 2020',
    },
  ],
  projects: [
    {
      id: 'proj-1',
      name: 'AI Resume Analyzer & Job Matcher',
      url: 'https://github.com/facebook/react',
      techStack: ['React', 'Python', 'FastAPI', 'PostgreSQL', 'Docker'],
      keyPoints: [
        'Designed an AI-powered resume analysis engine evaluating deterministic ATS compliance and keyword gaps.',
        'Integrated real-time live vacancy search across tech job portals with 1-click resume matching.',
      ],
    },
  ],
  skills: ['Python', 'JavaScript', 'TypeScript', 'React', 'FastAPI', 'PostgreSQL', 'Docker', 'AWS', 'Git', 'REST API'],
};

export default function ResumeBuilder() {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(1);

  // Resume builder state
  const [personalInfo, setPersonalInfo] = useState(DEMO_BUILDER_DATA.personalInfo);
  const [summary, setSummary] = useState(DEMO_BUILDER_DATA.summary);
  const [experience, setExperience] = useState(DEMO_BUILDER_DATA.experience);
  const [education, setEducation] = useState(DEMO_BUILDER_DATA.education);
  const [projects, setProjects] = useState(DEMO_BUILDER_DATA.projects);
  const [skills, setSkills] = useState(DEMO_BUILDER_DATA.skills);
  const [newSkill, setNewSkill] = useState('');

  // Loading states
  const [loadingGithubIndex, setLoadingGithubIndex] = useState(null);
  const [enhancingBulletIndex, setEnhancingBulletIndex] = useState(null);
  const [importingLinkedin, setImportingLinkedin] = useState(false);
  const [saving, setSaving] = useState(false);

  // Resume template & candidate photo state
  const [selectedTemplate, setSelectedTemplate] = useState('modern');
  const [photoFilename, setPhotoFilename] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [exportingDocx, setExportingDocx] = useState(false);

  // LinkedIn Modal state
  const [showLinkedinModal, setShowLinkedinModal] = useState(false);
  const [linkedinTab, setLinkedinTab] = useState('url'); // 'url' | 'pdf' | 'text'
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [linkedinText, setLinkedinText] = useState('');
  const [linkedinFile, setLinkedinFile] = useState(null);

  // Profile photo upload handler
  const handlePhotoChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingPhoto(true);
    try {
      const res = await builderAPI.uploadPhoto(file);
      setPhotoFilename(res.data.photo_filename);
      setPhotoUrl(res.data.photo_url);
      toast.success('Candidate profile photo attached to templates!');
    } catch (err) {
      toast.error(err.message || 'Photo upload failed.');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleRemovePhoto = () => {
    setPhotoFilename('');
    setPhotoUrl('');
    toast.success('Profile photo removed.');
  };

  // DOCX Export handler
  const handleExportDocx = async () => {
    if (!personalInfo.name.trim()) {
      toast.error('Please enter candidate name before exporting.');
      return;
    }
    setExportingDocx(true);
    try {
      const payload = {
        template_id: selectedTemplate,
        photo_filename: photoFilename,
        personal_info: personalInfo,
        summary,
        experience,
        education,
        projects,
        skills,
      };
      const res = await builderAPI.exportDocx(payload);
      const downloadUrl = res.data.download_url;

      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', res.data.filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success(`Downloaded ${res.data.filename} (.docx)!`);
    } catch (err) {
      toast.error(err.message || 'Failed to export DOCX document.');
    } finally {
      setExportingDocx(false);
    }
  };

  // Print PDF handler
  const handleDownloadPdf = () => {
    window.print();
  };

  // Load sample demo data
  const handleLoadDemo = () => {
    setPersonalInfo(DEMO_BUILDER_DATA.personalInfo);
    setSummary(DEMO_BUILDER_DATA.summary);
    setExperience(DEMO_BUILDER_DATA.experience);
    setEducation(DEMO_BUILDER_DATA.education);
    setProjects(DEMO_BUILDER_DATA.projects);
    setSkills(DEMO_BUILDER_DATA.skills);
    toast.success('Sample resume builder data loaded!');
  };

  // LinkedIn Import handler
  const handleLinkedinImport = async (e) => {
    e.preventDefault();
    setImportingLinkedin(true);
    try {
      let res;
      if (linkedinTab === 'file' && linkedinFile) {
        res = await builderAPI.linkedinUploadFile(linkedinFile);
      } else if (linkedinTab === 'url' && linkedinUrl.trim()) {
        res = await builderAPI.linkedinImport({ url: linkedinUrl.trim() });
      } else if (linkedinText.trim()) {
        res = await builderAPI.linkedinImport({ text: linkedinText.trim() });
      } else {
        toast.error('Please enter a LinkedIn profile URL, upload a PDF export, or paste text.');
        setImportingLinkedin(false);
        return;
      }

      const data = res.data;

      if (data.name) setPersonalInfo((prev) => ({ ...prev, name: data.name }));
      if (data.headline) setPersonalInfo((prev) => ({ ...prev, headline: data.headline }));
      if (data.email) setPersonalInfo((prev) => ({ ...prev, email: data.email }));
      if (data.phone) setPersonalInfo((prev) => ({ ...prev, phone: data.phone }));
      if (data.location) setPersonalInfo((prev) => ({ ...prev, location: data.location }));
      if (data.linkedin) setPersonalInfo((prev) => ({ ...prev, linkedin: data.linkedin }));
      if (data.summary) setSummary(data.summary);
      if (data.skills?.length > 0) setSkills((prev) => Array.from(new Set([...prev, ...data.skills])));

      if (data.experience?.length > 0) {
        const parsedExp = data.experience.map((e, idx) => ({
          id: `exp-imported-${idx}`,
          company: e.company || 'Company',
          title: e.title || 'Role',
          dates: e.dates || 'Dates',
          description: e.description || '',
        }));
        setExperience(parsedExp);
      }

      if (data.education?.length > 0) {
        const parsedEdu = data.education.map((e, idx) => ({
          id: `edu-imported-${idx}`,
          institution: e.institution || 'University',
          degree: e.degree || 'Degree',
          dates: e.dates || '',
        }));
        setEducation(parsedEdu);
      }

      if (data.projects?.length > 0) {
        const parsedProj = data.projects.map((p, idx) => ({
          id: `proj-imported-${idx}`,
          name: p.name || 'Project',
          url: p.url || '',
          techStack: p.tech_stack || [],
          keyPoints: p.key_points || (p.description ? [p.description] : []),
        }));
        setProjects(parsedProj);
      }

      toast.success('LinkedIn details extracted successfully!');
      setShowLinkedinModal(false);
      setLinkedinUrl('');
      setLinkedinText('');
      setLinkedinFile(null);
    } catch (err) {
      toast.error(err.message || 'LinkedIn import failed.');
    } finally {
      setImportingLinkedin(false);
    }
  };

  // GitHub AI Summarizer for Projects
  const handleGithubSummarize = async (index, repoUrl) => {
    if (!repoUrl || !repoUrl.includes('github.com/')) {
      toast.error('Please enter a valid GitHub repository URL (e.g. https://github.com/owner/repo)');
      return;
    }
    setLoadingGithubIndex(index);
    try {
      const res = await builderAPI.githubSummarize(repoUrl.trim());
      const data = res.data;

      setProjects((prev) => {
        const updated = [...prev];
        updated[index] = {
          ...updated[index],
          name: data.title || updated[index].name,
          techStack: data.tech_stack || updated[index].techStack,
          keyPoints: data.key_points || updated[index].keyPoints,
        };
        return updated;
      });

      toast.success(`AI summarized GitHub repo: "${data.title}"!`);
    } catch (err) {
      toast.error(err.message || 'Failed to fetch GitHub repository details.');
    } finally {
      setLoadingGithubIndex(null);
    }
  };

  // AI Bullet Enhancer
  const handleEnhanceBullet = async (expIndex, bulletText) => {
    if (!bulletText.trim()) return;
    setEnhancingBulletIndex(expIndex);
    try {
      const res = await builderAPI.aiEnhanceBullet(bulletText);
      const enhanced = res.data.enhanced;

      setExperience((prev) => {
        const updated = [...prev];
        updated[expIndex].description = enhanced;
        return updated;
      });

      toast.success('Bullet point enhanced with AI metrics!');
    } catch (err) {
      toast.error(err.message || 'Enhancement failed.');
    } finally {
      setEnhancingBulletIndex(null);
    }
  };

  // Add / Remove Form Array Items
  const addExperience = () => {
    setExperience((prev) => [
      ...prev,
      { id: `exp-${Date.now()}`, company: '', title: '', dates: '', description: '' },
    ]);
  };

  const removeExperience = (id) => {
    setExperience((prev) => prev.filter((e) => e.id !== id));
  };

  const addProject = () => {
    setProjects((prev) => [
      ...prev,
      { id: `proj-${Date.now()}`, name: '', url: '', techStack: [], keyPoints: [''] },
    ]);
  };

  const removeProject = (id) => {
    setProjects((prev) => prev.filter((p) => p.id !== id));
  };

  const addEducation = () => {
    setEducation((prev) => [
      ...prev,
      { id: `edu-${Date.now()}`, institution: '', degree: '', dates: '' },
    ]);
  };

  const removeEducation = (id) => {
    setEducation((prev) => prev.filter((e) => e.id !== id));
  };

  const addSkill = (e) => {
    e.preventDefault();
    if (newSkill.trim() && !skills.includes(newSkill.trim())) {
      setSkills((prev) => [...prev, newSkill.trim()]);
      setNewSkill('');
    }
  };

  const removeSkill = (skillToRemove) => {
    setSkills((prev) => prev.filter((s) => s !== skillToRemove));
  };

  // Save built resume and launch AI analysis
  const handleSaveAndAnalyze = async () => {
    if (!personalInfo.name.trim()) {
      toast.error('Please enter candidate name.');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        filename: `${personalInfo.name.replace(/\s+/g, '_')}_Built_Resume.txt`,
        personal_info: personalInfo,
        summary,
        experience,
        education,
        projects,
        skills,
      };

      const saveRes = await builderAPI.saveResume(payload);
      const resumeId = saveRes.data.id;
      toast.success('Built resume saved to My Resumes!');

      // Run AI analysis immediately
      toast.loading('Starting AI Analysis & ATS evaluation...', { id: 'analysis-toast' });
      const analysisRes = await analysisAPI.create(resumeId, true);
      toast.dismiss('analysis-toast');
      toast.success('AI Analysis completed!');

      navigate(`/analysis/${resumeId}`);
    } catch (err) {
      toast.error(err.message || 'Failed to save built resume');
    } finally {
      setSaving(false);
    }
  };

  // Download raw compiled text file
  const handleDownloadTxt = () => {
    const lines = [];
    lines.push(personalInfo.name.toUpperCase());
    lines.push(`${personalInfo.email} | ${personalInfo.phone} | ${personalInfo.location}`);
    if (personalInfo.linkedin) lines.push(`LinkedIn: ${personalInfo.linkedin}`);
    if (personalInfo.github) lines.push(`GitHub: ${personalInfo.github}`);
    lines.push('\n--- PROFESSIONAL SUMMARY ---');
    lines.push(summary);
    lines.push('\n--- WORK EXPERIENCE ---');
    experience.forEach((e) => {
      lines.push(`${e.title} at ${e.company} (${e.dates})`);
      lines.push(e.description);
    });
    lines.push('\n--- PROJECTS ---');
    projects.forEach((p) => {
      lines.push(`${p.name} - ${p.url}`);
      (p.keyPoints || []).forEach((kp) => lines.push(`• ${kp}`));
    });
    lines.push('\n--- SKILLS ---');
    lines.push(skills.join(', '));

    const element = document.createElement('a');
    const file = new Blob([lines.join('\n')], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `${personalInfo.name.replace(/\s+/g, '_')}_Resume.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    toast.success('Resume downloaded!');
  };

  const steps = [
    { num: 1, title: 'Personal Info', icon: User },
    { num: 2, title: 'Summary', icon: Wand2 },
    { num: 3, title: 'Experience', icon: Briefcase },
    { num: 4, title: 'GitHub Projects', icon: FolderGit2 },
    { num: 5, title: 'Education', icon: GraduationCap },
    { num: 6, title: 'Skills', icon: Code },
  ];

  return (
    <div>
      {/* ===== HEADER BAR ===== */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 10 }}>
            <Wand2 className="text-accent" size={28} /> AI Resume Builder Studio
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            Build ATS-formatted resumes, import LinkedIn profile details, and summarize GitHub projects with AI.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <Button variant="secondary" size="sm" icon={Linkedin} onClick={() => setShowLinkedinModal(true)}>
            Import LinkedIn
          </Button>
          <Button variant="outline" size="sm" icon={Sparkles} onClick={handleLoadDemo}>
            Load Sample Data
          </Button>
        </div>
      </div>

      {/* ===== TEMPLATE SELECTION GALLERY ===== */}
      <ResumeTemplates selectedTemplate={selectedTemplate} onSelectTemplate={setSelectedTemplate} />

      {/* ===== STEP TABS HEADER ===== */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 28, overflowX: 'auto', paddingBottom: 6 }}>
        {steps.map((s) => {
          const IconComponent = s.icon;
          const isActive = activeStep === s.num;
          return (
            <button
              key={s.num}
              type="button"
              className={`btn ${isActive ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '8px 16px', fontSize: '0.85rem' }}
              onClick={() => setActiveStep(s.num)}
            >
              <IconComponent size={16} /> {s.num}. {s.title}
            </button>
          );
        })}
      </div>

      {/* ===== MAIN GRID: FORM WIZARD + LIVE PREVIEW SIDEBAR ===== */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 28 }}>
        
        {/* LEFT COLUMN: FORM STEP CONTENT */}
        <div>
          {/* STEP 1: PERSONAL INFO */}
          {activeStep === 1 && (
            <Card>
              <h3 style={{ fontSize: '1.1rem', marginBottom: 16 }}>Personal & Contact Details</h3>

              {/* CANDIDATE PROFILE PHOTO UPLOAD WIDGET */}
              <div style={{ marginBottom: 20, padding: 14, background: 'var(--bg-subtle)', borderRadius: 8, border: '1px dashed var(--border)' }}>
                <label className="form-label" style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Camera size={16} /> Candidate Profile Photo (Optional for Resume Templates)
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  {photoUrl ? (
                    <div style={{ position: 'relative' }}>
                      <img src={photoUrl} alt="Candidate Profile" style={{ width: 60, height: 60, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--accent)' }} />
                      <button
                        type="button"
                        onClick={handleRemovePhoto}
                        style={{ position: 'absolute', top: -4, right: -4, background: 'var(--danger)', color: '#fff', border: 'none', borderRadius: '50%', width: 20, height: 20, cursor: 'pointer', fontSize: '0.7rem' }}
                      >
                        ×
                      </button>
                    </div>
                  ) : (
                    <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                      <Camera size={24} />
                    </div>
                  )}

                  <div>
                    <input
                      type="file"
                      accept="image/*"
                      id="photo-upload-input"
                      style={{ display: 'none' }}
                      onChange={handlePhotoChange}
                    />
                    <label htmlFor="photo-upload-input">
                      <Button type="button" variant="secondary" size="sm" icon={Upload} loading={uploadingPhoto} onClick={() => document.getElementById('photo-upload-input').click()}>
                        {photoUrl ? 'Change Photo' : 'Upload Candidate Photo'}
                      </Button>
                    </label>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>
                      JPG, PNG, or WEBP. Appears on resume templates and exported DOCX/PDF documents.
                    </div>
                  </div>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Full Name *</label>
                <input
                  type="text"
                  className="form-input"
                  value={personalInfo.name}
                  onChange={(e) => setPersonalInfo({ ...personalInfo, name: e.target.value })}
                  placeholder="e.g. Alex Vance"
                />
              </div>

              <div className="two-col">
                <div className="form-group">
                  <label className="form-label">Email Address *</label>
                  <input
                    type="email"
                    className="form-input"
                    value={personalInfo.email}
                    onChange={(e) => setPersonalInfo({ ...personalInfo, email: e.target.value })}
                    placeholder="alex@example.com"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Phone Number</label>
                  <input
                    type="text"
                    className="form-input"
                    value={personalInfo.phone}
                    onChange={(e) => setPersonalInfo({ ...personalInfo, phone: e.target.value })}
                    placeholder="+91 98765 43210"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Professional Target Headline</label>
                <input
                  type="text"
                  className="form-input"
                  value={personalInfo.headline}
                  onChange={(e) => setPersonalInfo({ ...personalInfo, headline: e.target.value })}
                  placeholder="e.g. Senior Full Stack Engineer (React + Python)"
                />
              </div>

              <div className="two-col">
                <div className="form-group">
                  <label className="form-label">LinkedIn Profile URL</label>
                  <input
                    type="text"
                    className="form-input"
                    value={personalInfo.linkedin}
                    onChange={(e) => setPersonalInfo({ ...personalInfo, linkedin: e.target.value })}
                    placeholder="https://linkedin.com/in/username"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">GitHub / Portfolio URL</label>
                  <input
                    type="text"
                    className="form-input"
                    value={personalInfo.github}
                    onChange={(e) => setPersonalInfo({ ...personalInfo, github: e.target.value })}
                    placeholder="https://github.com/username"
                  />
                </div>
              </div>

              <Button variant="primary" onClick={() => setActiveStep(2)} icon={ArrowRight}>
                Next: Summary & Experience
              </Button>
            </Card>
          )}

          {/* STEP 2: SUMMARY */}
          {activeStep === 2 && (
            <Card>
              <h3 style={{ fontSize: '1.1rem', marginBottom: 16 }}>Professional Summary</h3>
              <div className="form-group">
                <label className="form-label">Summary Statement</label>
                <textarea
                  className="form-textarea"
                  rows={6}
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  placeholder="Summarize your years of experience, core technical stack, key achievements, and target role..."
                />
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <Button variant="primary" onClick={() => setActiveStep(3)} icon={ArrowRight}>
                  Next: Work Experience
                </Button>
                <Button variant="secondary" onClick={() => setActiveStep(1)}>
                  Back
                </Button>
              </div>
            </Card>
          )}

          {/* STEP 3: WORK EXPERIENCE */}
          {activeStep === 3 && (
            <div>
              {experience.map((exp, index) => (
                <Card key={exp.id || index} style={{ marginBottom: 20 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <h4 style={{ fontSize: '1rem', fontWeight: 700 }}>Experience #{index + 1}</h4>
                    {experience.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeExperience(exp.id)}
                        style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer' }}
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>

                  <div className="two-col">
                    <div className="form-group">
                      <label className="form-label">Job Title *</label>
                      <input
                        type="text"
                        className="form-input"
                        value={exp.title}
                        onChange={(e) => {
                          const updated = [...experience];
                          updated[index].title = e.target.value;
                          setExperience(updated);
                        }}
                        placeholder="e.g. Senior Software Engineer"
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Company Name *</label>
                      <input
                        type="text"
                        className="form-input"
                        value={exp.company}
                        onChange={(e) => {
                          const updated = [...experience];
                          updated[index].company = e.target.value;
                          setExperience(updated);
                        }}
                        placeholder="e.g. Google"
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Dates / Duration</label>
                    <input
                      type="text"
                      className="form-input"
                      value={exp.dates}
                      onChange={(e) => {
                        const updated = [...experience];
                        updated[index].dates = e.target.value;
                        setExperience(updated);
                      }}
                      placeholder="e.g. Jan 2022 - Present"
                    />
                  </div>

                  <div className="form-group">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <label className="form-label" style={{ marginBottom: 0 }}>Bullet Points & Responsibilities</label>
                      <button
                        type="button"
                        style={{ background: 'none', border: 'none', color: 'var(--accent)', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                        onClick={() => handleEnhanceBullet(index, exp.description)}
                      >
                        {enhancingBulletIndex === index ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />} AI Enhance Bullets
                      </button>
                    </div>
                    <textarea
                      className="form-textarea"
                      rows={5}
                      value={exp.description}
                      onChange={(e) => {
                        const updated = [...experience];
                        updated[index].description = e.target.value;
                        setExperience(updated);
                      }}
                      placeholder="Enter bullet points describing key accomplishments, tech stack used, and quantifiable outcomes..."
                    />
                  </div>
                </Card>
              ))}

              <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
                <Button variant="secondary" icon={Plus} onClick={addExperience}>
                  Add Another Experience
                </Button>
                <Button variant="primary" onClick={() => setActiveStep(4)} icon={ArrowRight}>
                  Next: GitHub Projects
                </Button>
              </div>
            </div>
          )}

          {/* STEP 4: GITHUB PROJECTS WITH AI SUMMARIZER */}
          {activeStep === 4 && (
            <div>
              <Card style={{ marginBottom: 20, background: 'var(--bg-white)', borderColor: 'var(--purple-border)' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--purple)', textTransform: 'uppercase', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <FolderGit2 size={16} /> GitHub Project AI Summarizer
                </div>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                  Enter any public GitHub repository link to let HireLens AI inspect the README and auto-generate ATS key points!
                </p>
              </Card>

              {projects.map((proj, index) => (
                <Card key={proj.id || index} style={{ marginBottom: 20 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <h4 style={{ fontSize: '1rem', fontWeight: 700 }}>Project #{index + 1}</h4>
                    {projects.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeProject(proj.id)}
                        style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer' }}
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>

                  <div className="form-group">
                    <label className="form-label">GitHub Repository URL *</label>
                    <div style={{ display: 'flex', gap: 10 }}>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="https://github.com/username/project-repo"
                        value={proj.url}
                        onChange={(e) => {
                          const updated = [...projects];
                          updated[index].url = e.target.value;
                          setProjects(updated);
                        }}
                      />
                      <Button
                        type="button"
                        variant="primary"
                        size="sm"
                        icon={Sparkles}
                        loading={loadingGithubIndex === index}
                        onClick={() => handleGithubSummarize(index, proj.url)}
                      >
                        AI Summarize Repo
                      </Button>
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Project Title</label>
                    <input
                      type="text"
                      className="form-input"
                      value={proj.name}
                      onChange={(e) => {
                        const updated = [...projects];
                        updated[index].name = e.target.value;
                        setProjects(updated);
                      }}
                      placeholder="e.g. Real-Time Chat Engine"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Tech Stack Tags (Comma-separated)</label>
                    <input
                      type="text"
                      className="form-input"
                      value={(proj.techStack || []).join(', ')}
                      onChange={(e) => {
                        const updated = [...projects];
                        updated[index].techStack = e.target.value.split(',').map((s) => s.trim()).filter(Boolean);
                        setProjects(updated);
                      }}
                      placeholder="React, FastAPI, Docker, Redis"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Project Key Points & Achievements</label>
                    <textarea
                      className="form-textarea"
                      rows={4}
                      value={(proj.keyPoints || []).join('\n')}
                      onChange={(e) => {
                        const updated = [...projects];
                        updated[index].keyPoints = e.target.value.split('\n');
                        setProjects(updated);
                      }}
                      placeholder="• Engineered REST endpoints...\n• Implemented Docker containerization..."
                    />
                  </div>
                </Card>
              ))}

              <div style={{ display: 'flex', gap: 12 }}>
                <Button variant="secondary" icon={Plus} onClick={addProject}>
                  Add Another Project
                </Button>
                <Button variant="primary" onClick={() => setActiveStep(5)} icon={ArrowRight}>
                  Next: Education & Skills
                </Button>
              </div>
            </div>
          )}

          {/* STEP 5: EDUCATION */}
          {activeStep === 5 && (
            <div>
              {education.map((edu, index) => (
                <Card key={edu.id || index} style={{ marginBottom: 20 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <h4 style={{ fontSize: '1rem', fontWeight: 700 }}>Education #{index + 1}</h4>
                    {education.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeEducation(edu.id)}
                        style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer' }}
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>

                  <div className="form-group">
                    <label className="form-label">Degree / Field of Study *</label>
                    <input
                      type="text"
                      className="form-input"
                      value={edu.degree}
                      onChange={(e) => {
                        const updated = [...education];
                        updated[index].degree = e.target.value;
                        setEducation(updated);
                      }}
                      placeholder="e.g. B.Tech in Computer Science"
                    />
                  </div>

                  <div className="two-col">
                    <div className="form-group">
                      <label className="form-label">University / Institution *</label>
                      <input
                        type="text"
                        className="form-input"
                        value={edu.institution}
                        onChange={(e) => {
                          const updated = [...education];
                          updated[index].institution = e.target.value;
                          setEducation(updated);
                        }}
                        placeholder="e.g. National Institute of Technology"
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Graduation Dates</label>
                      <input
                        type="text"
                        className="form-input"
                        value={edu.dates}
                        onChange={(e) => {
                          const updated = [...education];
                          updated[index].dates = e.target.value;
                          setEducation(updated);
                        }}
                        placeholder="e.g. 2018 - 2022"
                      />
                    </div>
                  </div>
                </Card>
              ))}

              <div style={{ display: 'flex', gap: 12 }}>
                <Button variant="secondary" icon={Plus} onClick={addEducation}>
                  Add Another Education
                </Button>
                <Button variant="primary" onClick={() => setActiveStep(6)} icon={ArrowRight}>
                  Next: Skills
                </Button>
              </div>
            </div>
          )}

          {/* STEP 6: SKILLS */}
          {activeStep === 6 && (
            <Card>
              <h3 style={{ fontSize: '1.1rem', marginBottom: 16 }}>Skills & Technologies</h3>

              <form onSubmit={addSkill} style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Add a technical skill (e.g. React, Python, Docker)..."
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                />
                <Button type="submit" variant="primary" icon={Plus}>
                  Add
                </Button>
              </form>

              <div className="tag-grid" style={{ marginBottom: 24 }}>
                {skills.map((s, idx) => (
                  <span key={idx} className="tag green" style={{ padding: '6px 12px', borderRadius: 16 }}>
                    {s}{' '}
                    <button
                      type="button"
                      onClick={() => removeSkill(s)}
                      style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', marginLeft: 4 }}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>

              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <Button variant="primary" size="lg" icon={Sparkles} loading={saving} onClick={handleSaveAndAnalyze}>
                  Save & Analyze with AI
                </Button>
                <Button variant="secondary" size="lg" icon={Download} onClick={handleDownloadTxt}>
                  Download TXT
                </Button>
              </div>
            </Card>
          )}
        </div>

        {/* RIGHT COLUMN: LIVE FORMATTED RESUME PREVIEW WITH TEMPLATE STYLING */}
        <div>
          <Card style={{ background: 'var(--bg-white)', borderColor: 'var(--border)', sticky: 'top', top: 80 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, paddingBottom: 12, borderBottom: '1px solid var(--border)' }}>
              <div style={{ fontWeight: 700, fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: 6, color: selectedTemplate === 'creative' ? '#4F46E5' : 'var(--accent)' }}>
                <FileCheck size={18} /> Live Template Preview
              </div>
              <span className="tag green" style={{ fontSize: '0.75rem', textTransform: 'capitalize' }}>
                {selectedTemplate} Template
              </span>
            </div>

            <div
              id="printable-resume-preview"
              style={{
                fontFamily: selectedTemplate === 'classic' ? 'Georgia, serif' : 'Outfit, sans-serif',
                fontSize: '0.85rem',
                lineHeight: 1.5,
                color: 'var(--text-primary)',
                background: 'var(--bg-white)',
                padding: 24,
                borderRadius: 8,
                border: '1px solid var(--border)',
                maxHeight: 540,
                overflowY: 'auto',
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              {/* HEADER WITH PHOTO & CONTACT */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16, paddingBottom: 14, borderBottom: `2px solid ${selectedTemplate === 'creative' ? '#4F46E5' : selectedTemplate === 'minimal' ? '#18181B' : '#059669'}` }}>
                {photoUrl && (
                  <img
                    src={photoUrl}
                    alt="Candidate Avatar"
                    style={{ width: 64, height: 64, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--accent)' }}
                  />
                )}
                <div>
                  <div style={{ fontWeight: 800, fontSize: '1.25rem', color: selectedTemplate === 'creative' ? '#4F46E5' : selectedTemplate === 'minimal' ? '#18181B' : '#059669', letterSpacing: '-0.02em' }}>
                    {personalInfo.name.toUpperCase() || 'YOUR NAME'}
                  </div>
                  {personalInfo.headline && (
                    <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
                      {personalInfo.headline}
                    </div>
                  )}
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginTop: 4 }}>
                    {[personalInfo.email, personalInfo.phone, personalInfo.location, personalInfo.linkedin, personalInfo.github].filter(Boolean).join(' | ')}
                  </div>
                </div>
              </div>

              {summary && (
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontWeight: 700, color: selectedTemplate === 'creative' ? '#4F46E5' : selectedTemplate === 'minimal' ? '#18181B' : '#059669', fontSize: '0.85rem', textTransform: 'uppercase', marginBottom: 4 }}>
                    Professional Summary
                  </div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.825rem' }}>{summary}</div>
                </div>
              )}

              {experience.length > 0 && (
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontWeight: 700, color: selectedTemplate === 'creative' ? '#4F46E5' : selectedTemplate === 'minimal' ? '#18181B' : '#059669', fontSize: '0.85rem', textTransform: 'uppercase', marginBottom: 6 }}>
                    Work Experience
                  </div>
                  {experience.map((e, i) => (
                    <div key={i} style={{ marginBottom: 8 }}>
                      <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>
                        {e.title} <span style={{ fontWeight: 500, color: 'var(--text-muted)' }}>at {e.company} ({e.dates})</span>
                      </div>
                      <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', whiteSpace: 'pre-wrap', paddingLeft: 8 }}>{e.description}</div>
                    </div>
                  ))}
                </div>
              )}

              {projects.length > 0 && (
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontWeight: 700, color: selectedTemplate === 'creative' ? '#4F46E5' : selectedTemplate === 'minimal' ? '#18181B' : '#059669', fontSize: '0.85rem', textTransform: 'uppercase', marginBottom: 6 }}>
                    Key Projects
                  </div>
                  {projects.map((p, i) => (
                    <div key={i} style={{ marginBottom: 8 }}>
                      <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>
                        {p.name} {p.techStack?.length > 0 ? <span style={{ color: selectedTemplate === 'creative' ? '#4F46E5' : '#059669', fontSize: '0.78rem' }}>[{p.techStack.join(', ')}]</span> : ''}
                      </div>
                      <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', paddingLeft: 8 }}>
                        {(p.keyPoints || []).map((kp) => `• ${kp}`).join('\n')}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {education.length > 0 && (
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontWeight: 700, color: selectedTemplate === 'creative' ? '#4F46E5' : selectedTemplate === 'minimal' ? '#18181B' : '#059669', fontSize: '0.85rem', textTransform: 'uppercase', marginBottom: 4 }}>
                    Education
                  </div>
                  {education.map((e, i) => (
                    <div key={i} style={{ fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
                      <strong>{e.degree}</strong>, {e.institution} ({e.dates})
                    </div>
                  ))}
                </div>
              )}

              {skills.length > 0 && (
                <div>
                  <div style={{ fontWeight: 700, color: selectedTemplate === 'creative' ? '#4F46E5' : selectedTemplate === 'minimal' ? '#18181B' : '#059669', fontSize: '0.85rem', textTransform: 'uppercase', marginBottom: 4 }}>
                    Technical Skills
                  </div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.825rem' }}>{skills.join(', ')}</div>
                </div>
              )}
            </div>

            <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <Button variant="primary" icon={Download} loading={exportingDocx} onClick={handleExportDocx}>
                  Export Word (.docx)
                </Button>
                <Button variant="secondary" icon={Printer} onClick={handleDownloadPdf}>
                  Download PDF
                </Button>
              </div>

              <Button variant="outline" fullWidth icon={Sparkles} loading={saving} onClick={handleSaveAndAnalyze}>
                Save & Analyze with AI
              </Button>
            </div>
          </Card>
        </div>
      </div>

      {/* ===== LINKEDIN PROFILE IMPORT MODAL ===== */}
      <AnimatePresence>
        {showLinkedinModal && (
          <div className="modal-backdrop" onClick={() => setShowLinkedinModal(false)}>
            <motion.div
              className="modal-card"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              style={{ textAlign: 'left', maxWidth: 540 }}
            >
              <h3 style={{ fontSize: '1.25rem', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Linkedin size={24} className="text-accent" /> Import LinkedIn Profile
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 16 }}>
                Extract 100% of your LinkedIn profile details into structured ATS builder fields.
              </p>

              {/* MODAL METHOD TABS */}
              <div style={{ display: 'flex', gap: 6, marginBottom: 18, borderBottom: '1px solid var(--border)', paddingBottom: 10 }}>
                <button
                  type="button"
                  className={`btn ${linkedinTab === 'url' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                  onClick={() => setLinkedinTab('url')}
                >
                  Profile Link
                </button>
                <button
                  type="button"
                  className={`btn ${linkedinTab === 'file' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                  onClick={() => setLinkedinTab('file')}
                >
                  Upload PDF Export / Photo
                </button>
                <button
                  type="button"
                  className={`btn ${linkedinTab === 'text' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                  onClick={() => setLinkedinTab('text')}
                >
                  Paste Text
                </button>
              </div>

              {/* PRO TIP ALERT */}
              <div style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: 8, padding: '10px 14px', marginBottom: 18, fontSize: '0.8rem', color: '#047857' }}>
                💡 <strong>Pro Tip for 100% Detail:</strong> Open your LinkedIn Profile page &rarr; Click <strong>More</strong> &rarr; Select <strong>Save to PDF</strong>, then upload the PDF here for perfect extraction of all work experiences & achievements!
              </div>

              <form onSubmit={handleLinkedinImport}>
                {linkedinTab === 'url' && (
                  <div className="form-group">
                    <label className="form-label">LinkedIn Profile URL</label>
                    <input
                      type="url"
                      className="form-input"
                      placeholder="https://linkedin.com/in/yourname"
                      value={linkedinUrl}
                      onChange={(e) => setLinkedinUrl(e.target.value)}
                    />
                  </div>
                )}

                {linkedinTab === 'file' && (
                  <div className="form-group">
                    <label className="form-label">Upload LinkedIn PDF Export or Image Screenshot</label>
                    <input
                      type="file"
                      accept=".pdf,.png,.jpg,.jpeg,.webp"
                      className="form-input"
                      onChange={(e) => setLinkedinFile(e.target.files[0] || null)}
                    />
                    {linkedinFile && (
                      <div style={{ fontSize: '0.8rem', color: 'var(--accent)', marginTop: 6, fontWeight: 600 }}>
                        ✓ File selected: {linkedinFile.name}
                      </div>
                    )}
                  </div>
                )}

                {linkedinTab === 'text' && (
                  <div className="form-group">
                    <label className="form-label">Paste Raw LinkedIn Profile Text</label>
                    <textarea
                      className="form-textarea"
                      rows={5}
                      placeholder="Copy and paste Experience, Education, About, and Skills sections from LinkedIn..."
                      value={linkedinText}
                      onChange={(e) => setLinkedinText(e.target.value)}
                    />
                  </div>
                )}

                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
                  <Button type="button" variant="secondary" onClick={() => setShowLinkedinModal(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" variant="primary" loading={importingLinkedin} icon={Download}>
                    Auto-Fill Resume Builder
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
