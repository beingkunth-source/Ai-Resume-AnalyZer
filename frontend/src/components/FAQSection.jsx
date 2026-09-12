import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, HelpCircle } from 'lucide-react';

const FAQS = [
  {
    q: 'How does HireLens calculate my ATS score?',
    a: 'HireLens combines a deterministic rule-based auditing engine with AI analysis. It checks contact information, standard section headings, document length, formatting anomalies, action verbs, and quantifiable achievements to produce a transparent compliance score.',
  },
  {
    q: 'What file formats are supported for resume uploads?',
    a: 'HireLens supports standard PDF (.pdf) and Microsoft Word (.docx) files up to 5MB in size. Our deep text extraction engine parses paragraphs, tables, headers, footers, and text boxes.',
  },
  {
    q: 'How does the Job Description Matcher work?',
    a: 'The Job Matcher extracts required technical skills, qualifications, and keywords from any job posting (or live vacancies from Naukri & LinkedIn) and compares them against your resume text to calculate your fit percentage, matched skills, and missing keyword gaps.',
  },
  {
    q: 'Is my resume data kept private and secure?',
    a: 'Yes, absolutely. All uploaded resumes and analysis records are encrypted, bound strictly to your authenticated account, and never sold or shared with external recruiters.',
  },
  {
    q: 'Do I need an OpenAI API key to use HireLens?',
    a: 'No! HireLens includes a smart rule-based AI engine that evaluates resumes, calculates ATS scores, identifies skill gaps, and generates recommendations out of the box without requiring any API key.',
  },
  {
    q: 'How do the Before vs After recommendations help me?',
    a: 'Our recommendations provide concrete examples showing how to rephrase bullet points to highlight quantifiable outcomes, scope, and technical tools rather than basic task descriptions.',
  },
];

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState(0); // Open first by default

  const toggleIndex = (idx) => {
    setOpenIndex(openIndex === idx ? -1 : idx);
  };

  return (
    <section id="faq" style={{ padding: '80px 24px', background: 'var(--bg-white)', borderTop: '1px solid var(--border)' }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '6px 16px',
              borderRadius: 20,
              background: 'var(--accent-light)',
              color: 'var(--accent)',
              fontSize: '0.85rem',
              fontWeight: 700,
              marginBottom: 12,
            }}
          >
            <HelpCircle size={16} />
            <span>Got Questions? We Have Answers</span>
          </div>
          <h2 style={{ fontSize: '2.2rem', color: 'var(--text-primary)' }}>Frequently Asked Questions</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', marginTop: 6 }}>
            Learn more about HireLens ATS scoring, job matching, and resume optimization.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {FAQS.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: idx * 0.05 }}
                style={{
                  background: isOpen ? 'var(--accent-light)' : 'var(--bg-page)',
                  border: `1px solid ${isOpen ? 'var(--accent-border)' : 'var(--border)'}`,
                  borderRadius: 'var(--radius)',
                  overflow: 'hidden',
                  transition: 'var(--transition)',
                }}
              >
                <button
                  type="button"
                  onClick={() => toggleIndex(idx)}
                  style={{
                    width: '100%',
                    padding: '20px 24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 16,
                    background: 'none',
                    border: 'none',
                    textAlign: 'left',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                  }}
                >
                  <span style={{ fontWeight: 700, fontSize: '1.05rem', color: isOpen ? 'var(--accent)' : 'var(--text-primary)' }}>
                    {faq.q}
                  </span>
                  <motion.div
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                    style={{ color: isOpen ? 'var(--accent)' : 'var(--text-muted)' }}
                  >
                    <ChevronDown size={20} />
                  </motion.div>
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: 'easeInOut' }}
                    >
                      <div
                        style={{
                          padding: '0 24px 20px',
                          fontSize: '0.95rem',
                          color: 'var(--text-secondary)',
                          lineHeight: 1.6,
                          borderTop: '1px solid rgba(37, 99, 235, 0.1)',
                          paddingTop: 16,
                        }}
                      >
                        {faq.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
