import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Sparkles,
  FileCheck,
  Target,
  Lightbulb,
  ArrowRight,
  CheckCircle2,
  Briefcase,
  Zap,
} from 'lucide-react';
import Button from '../components/Button';
import FlashCard from '../components/FlashCard';
import LiveJobBoard from '../components/LiveJobBoard';
import FAQSection from '../components/FAQSection';

export default function Home() {
  const { user } = useAuth();

  return (
    <div style={{ background: 'var(--bg-page)', minHeight: '100vh', overflowX: 'hidden' }}>
      {/* ===== HERO SECTION WITH HIRE LENS WALLPAPER LOGO ===== */}
      <section style={{ padding: '40px 24px 60px', maxWidth: '100%', margin: '0', textAlign: 'left' }}>
        
        <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start', flexWrap: 'wrap', gap: 20, marginBottom: 28 }}>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 20px',
              borderRadius: 24,
              background: '#ECFDF5',
              color: '#059669',
              fontSize: '0.875rem',
              fontWeight: 700,
              letterSpacing: '0.04em',
              border: '1px solid #A7F3D0',
              boxShadow: '0 2px 10px rgba(5, 150, 105, 0.08)',
            }}
          >
            <Sparkles size={16} />
            <span>ANALYZE • IMPROVE • GET HIRED</span>
          </motion.div>
        </div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          style={{
            fontFamily: 'Outfit',
            fontSize: 'clamp(2.5rem, 5vw, 4rem)',
            fontWeight: 800,
            lineHeight: 1.15,
            letterSpacing: '-0.03em',
            marginBottom: 18,
            color: 'var(--text-primary)',
          }}
        >
          Analyze Your Resume. <br />
          <span style={{ color: 'var(--accent)' }}>Get Hired Smarter.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          style={{
            fontSize: '1.2rem',
            color: 'var(--text-secondary)',
            maxWidth: 780,
            margin: '0 0 36px 0',
            lineHeight: 1.6,
          }}
        >
          Upload your resume to receive instant AI-powered feedback, deterministic ATS compatibility scoring,
          skill gap detection, and one-click matching against real job openings from Naukri & LinkedIn.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          style={{ display: 'flex', gap: 16, justifyContent: 'flex-start', flexWrap: 'wrap' }}
        >
          <Link to={user ? '/upload' : '/register'}>
            <Button size="lg" variant="primary" icon={Sparkles}>
              Analyze My Resume
            </Button>
          </Link>
          <a href="#live-jobs">
            <Button size="lg" variant="secondary" icon={Briefcase}>
              View Live Vacancies
            </Button>
          </a>
        </motion.div>

        {/* ===== ANIMATED PRODUCT MOCKUP WITH FLASH SCANNER ===== */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          style={{
            marginTop: 60,
            background: 'var(--bg-white)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-xl)',
            padding: 28,
            boxShadow: 'var(--shadow-xl)',
            textAlign: 'left',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#ef4444' }} />
              <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#f59e0b' }} />
              <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#10b981' }} />
              <span style={{ fontSize: '0.85rem', fontWeight: 700, marginLeft: 12, color: 'var(--text-primary)' }}>
                HireLens Real-Time Scanner Preview
              </span>
            </div>
            <div style={{ fontSize: '0.825rem', fontWeight: 600, color: 'var(--accent)', background: 'var(--accent-light)', padding: '4px 10px', borderRadius: 12 }}>
              <Zap size={14} style={{ display: 'inline', marginRight: 4 }} /> Fast AI Analysis
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20 }}>
            <div className="card text-center" style={{ background: 'var(--bg-subtle)' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6 }}>Overall ATS Score</div>
              <div className="score-badge lg score-high" style={{ margin: '10px auto' }}>88</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--success)', fontWeight: 600 }}>High Compatibility</div>
            </div>

            <div className="card" style={{ background: 'var(--bg-subtle)' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: 12 }}>ATS Rule Audit</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div className="ats-item pass"><span>Contact Information</span><CheckCircle2 size={16} /></div>
                <div className="ats-item pass"><span>Technical Skills Section</span><CheckCircle2 size={16} /></div>
                <div className="ats-item pass"><span>Work Experience</span><CheckCircle2 size={16} /></div>
                <div className="ats-item fail"><span>Quantifiable Outcomes</span><span>Needs Action</span></div>
              </div>
            </div>

            <div className="card" style={{ background: 'var(--bg-subtle)' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: 12 }}>Matched Job Keywords</div>
              <div className="tag-grid">
                <span className="tag green">React</span>
                <span className="tag green">Python</span>
                <span className="tag green">FastAPI</span>
                <span className="tag green">PostgreSQL</span>
                <span className="tag red">Docker (Missing)</span>
                <span className="tag yellow">AWS (Partial)</span>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ===== LIVE JOB VACANCIES SECTION (NAUKRI / LINKEDIN STYLE) ===== */}
      <section id="live-jobs" style={{ padding: '80px 24px', background: 'var(--bg-subtle)', borderTop: '1px solid var(--border)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--accent)', background: 'var(--accent-light)', padding: '6px 14px', borderRadius: 16 }}>
              Real-Time Vacancy Feed
            </span>
            <h2 style={{ fontSize: '2.2rem', marginTop: 12, marginBottom: 10 }}>Match With Live Job Openings</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', maxWidth: 650, margin: '0 auto' }}>
              Explore real-time software & engineering openings from top tech companies and test your resume match score with one click.
            </p>
          </div>

          <LiveJobBoard />
        </div>
      </section>

      {/* ===== FEATURE HIGHLIGHTS WITH FLASH CARDS ===== */}
      <section id="features" style={{ padding: '80px 24px', background: 'var(--bg-white)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 60 }}>
            <h2 style={{ fontSize: '2.2rem', marginBottom: 12 }}>Everything You Need to Stand Out</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>
              Designed for students, freshers, and experienced professionals.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>
            <FlashCard>
              <div className="sidebar-logo-icon" style={{ marginBottom: 16 }}>
                <FileCheck size={20} />
              </div>
              <h3 style={{ fontSize: '1.2rem', marginBottom: 8 }}>Rule-Based ATS Scoring</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                Transparent checklist auditing contact info, standard headings, file formatting, action verbs, and word counts.
              </p>
            </FlashCard>

            <FlashCard>
              <div className="sidebar-logo-icon" style={{ marginBottom: 16, background: 'linear-gradient(135deg, #10b981, #059669)' }}>
                <Sparkles size={20} />
              </div>
              <h3 style={{ fontSize: '1.2rem', marginBottom: 8 }}>Deep AI Resume Analysis</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                Structured analysis highlighting strengths, weaknesses, missing sections, and formatting issues.
              </p>
            </FlashCard>

            <FlashCard>
              <div className="sidebar-logo-icon" style={{ marginBottom: 16, background: 'linear-gradient(135deg, #7c3aed, #6d28d9)' }}>
                <Target size={20} />
              </div>
              <h3 style={{ fontSize: '1.2rem', marginBottom: 8 }}>Job Description Matcher</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                Compare your resume directly against targeted job postings to uncover missing skills and keyword gaps.
              </p>
            </FlashCard>

            <FlashCard>
              <div className="sidebar-logo-icon" style={{ marginBottom: 16, background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>
                <Lightbulb size={20} />
              </div>
              <h3 style={{ fontSize: '1.2rem', marginBottom: 8 }}>Actionable Recommendations</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                Receive clear Before vs After examples showing exactly how to rephrase bullet points with quantifiable results.
              </p>
            </FlashCard>
          </div>
        </div>
      </section>

      {/* ===== FREQUENTLY ASKED QUESTIONS ===== */}
      <FAQSection />

      {/* ===== CTA SECTION WITH OAUTH EASY LOGIN ===== */}
      <section style={{ padding: '80px 24px', textAlign: 'center' }}>
        <div style={{ maxWidth: 800, margin: '0 auto', background: 'var(--bg-white)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', padding: 48, boxShadow: 'var(--shadow-lg)' }}>
          <h2 style={{ fontSize: '2rem', marginBottom: 16 }}>Ready to Upgrade Your Resume?</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', marginBottom: 28 }}>
            Get your instant ATS score and tailored recommendations in less than 30 seconds.
          </p>
          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to={user ? '/upload' : '/register'}>
              <Button size="lg" variant="primary" icon={Sparkles}>
                Start Free Analysis
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
