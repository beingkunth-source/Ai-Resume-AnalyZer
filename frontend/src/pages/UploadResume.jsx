import { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { resumeAPI, analysisAPI } from '../services/api';
import { UploadCloud, FileText, CheckCircle2, AlertCircle, ArrowLeft, Loader2, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '../components/Button';
import Card from '../components/Card';

export default function UploadResume() {
  const [file, setFile] = useState(null);
  const [dragover, setDragover] = useState(false);
  const [step, setStep] = useState('idle'); // idle | uploading | extracting | analyzing | complete | error
  const [errorMessage, setErrorMessage] = useState('');
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  const validateAndSelectFile = (selectedFile) => {
    if (!selectedFile) return;
    const ext = selectedFile.name.split('.').pop().toLowerCase();
    if (!['pdf', 'docx'].includes(ext)) {
      toast.error('Unsupported file format. Please select a PDF or DOCX file.');
      return;
    }
    if (selectedFile.size > 5 * 1024 * 1024) {
      toast.error('File size exceeds 5MB limit.');
      return;
    }
    setFile(selectedFile);
    setErrorMessage('');
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragover(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSelectFile(e.dataTransfer.files[0]);
    }
  };

  const handleUploadAndAnalyze = async () => {
    if (!file) return;

    try {
      setStep('uploading');
      const uploadRes = await resumeAPI.upload(file);
      const resumeId = uploadRes.data.id;

      setStep('extracting');
      await new Promise((resolve) => setTimeout(resolve, 800));

      setStep('analyzing');
      await analysisAPI.create(resumeId, true);

      setStep('complete');
      toast.success('Resume uploaded & analyzed successfully!');
      setTimeout(() => {
        navigate(`/analysis/${resumeId}`);
      }, 1000);
    } catch (err) {
      setStep('error');
      setErrorMessage(err.message || 'Failed to upload and analyze resume.');
      toast.error(err.message || 'Processing failed');
    }
  };

  return (
    <div style={{ maxWidth: 720, margin: '0 auto' }}>
      <Link
        to="/resumes"
        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 20, color: 'var(--text-secondary)' }}
      >
        <ArrowLeft size={16} /> Back to Resumes
      </Link>

      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: '1.8rem', marginBottom: 4 }}>Upload Resume</h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          Drop your PDF or DOCX file here for instant AI analysis & ATS scoring.
        </p>
      </div>

      <Card>
        {step === 'idle' || step === 'error' ? (
          <div>
            <div
              className={`upload-area ${dragover ? 'dragover' : ''}`}
              onDragOver={(e) => {
                e.preventDefault();
                setDragover(true);
              }}
              onDragLeave={() => setDragover(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                type="file"
                ref={fileInputRef}
                accept=".pdf,.docx"
                style={{ display: 'none' }}
                onChange={(e) => validateAndSelectFile(e.target.files[0])}
              />
              <UploadCloud size={48} className="icon" style={{ color: 'var(--accent)', margin: '0 auto 12px' }} />
              <h3 style={{ fontSize: '1.1rem', marginBottom: 6 }}>
                {file ? file.name : 'Drag & drop your resume here'}
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                {file ? `${(file.size / (1024 * 1024)).toFixed(2)} MB — PDF or DOCX` : 'Supports PDF and DOCX files up to 5MB'}
              </p>
            </div>

            {file && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                  marginTop: 20,
                  padding: 16,
                  background: 'var(--accent-light)',
                  border: '1px solid var(--accent-border)',
                  borderRadius: 'var(--radius-sm)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <FileText size={22} style={{ color: 'var(--accent)' }} />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{file.name}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      {(file.size / (1024 * 1024)).toFixed(2)} MB
                    </div>
                  </div>
                </div>
                <Button size="sm" variant="primary" icon={Sparkles} onClick={handleUploadAndAnalyze}>
                  Start Analysis
                </Button>
              </motion.div>
            )}

            {step === 'error' && (
              <div className="msg-error" style={{ marginTop: 20 }}>
                <AlertCircle size={16} style={{ display: 'inline', marginRight: 6 }} />
                {errorMessage}
              </div>
            )}
          </div>
        ) : (
          /* ===== STEP PROGRESS ANIMATED STATE ===== */
          <div style={{ padding: '36px 20px', textAlign: 'center' }}>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
              style={{
                width: 60,
                height: 60,
                borderRadius: '50%',
                background: 'var(--accent-light)',
                color: 'var(--accent)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 20px',
              }}
            >
              <Sparkles size={32} />
            </motion.div>

            <h3 style={{ fontSize: '1.25rem', marginBottom: 20 }}>Processing Resume</h3>

            <div style={{ maxWidth: 400, margin: '0 auto', textAlign: 'left' }}>
              <div className={`processing-step ${step === 'uploading' ? 'active' : 'done'}`}>
                {step === 'uploading' ? <Loader2 size={18} className="spinner" /> : <CheckCircle2 size={18} />}
                <span>Uploading file...</span>
              </div>

              <div className={`processing-step ${step === 'extracting' ? 'active' : step === 'analyzing' || step === 'complete' ? 'done' : 'pending'}`}>
                {step === 'extracting' ? <Loader2 size={18} className="spinner" /> : (step === 'analyzing' || step === 'complete') ? <CheckCircle2 size={18} /> : <FileText size={18} />}
                <span>Extracting raw text & layout...</span>
              </div>

              <div className={`processing-step ${step === 'analyzing' ? 'active' : step === 'complete' ? 'done' : 'pending'}`}>
                {step === 'analyzing' ? <Loader2 size={18} className="spinner" /> : step === 'complete' ? <CheckCircle2 size={18} /> : <Sparkles size={18} />}
                <span>Evaluating ATS rules & AI recommendations...</span>
              </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
