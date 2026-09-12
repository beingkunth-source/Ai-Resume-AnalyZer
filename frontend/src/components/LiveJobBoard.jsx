import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, MapPin, DollarSign, Sparkles, Link as LinkIcon, Download, Loader2 } from 'lucide-react';
import { resumeAPI, jobsAPI } from '../services/api';
import toast from 'react-hot-toast';
import Button from './Button';
import Card from './Card';
import SkillBadge from './SkillBadge';

export default function LiveJobBoard() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [matchingJobId, setMatchingJobId] = useState(null);

  // URL Import state
  const [importUrl, setImportUrl] = useState('');
  const [importing, setImporting] = useState(false);

  const fetchJobs = (query = '', loc = '') => {
    setLoading(true);
    jobsAPI
      .getLive(query, loc)
      .then((res) => setJobs(res.data || []))
      .catch(() => toast.error('Could not refresh live jobs feed'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchJobs(searchTerm, locationFilter);
  };

  const handleImportUrl = async (e) => {
    e.preventDefault();
    if (!importUrl.trim()) {
      toast.error('Please enter a valid Naukri, LinkedIn, or Job Posting URL');
      return;
    }
    setImporting(true);
    try {
      // Fetch resume list to ensure user has a resume uploaded
      const resumeRes = await resumeAPI.list();
      if (!resumeRes.data || resumeRes.data.length === 0) {
        toast.error('Please upload a resume first to run job matching!');
        navigate('/upload');
        return;
      }

      const importedRes = await jobsAPI.importUrl(importUrl.trim());
      toast.success(`Imported: "${importedRes.data.title}" from link!`);

      // Match against latest uploaded resume
      const latestResume = resumeRes.data[0];
      await jobsAPI.match({
        resume_id: latestResume.id,
        job_id: importedRes.data.id,
      });

      navigate(`/jobs/match?resume_id=${latestResume.id}&job_id=${importedRes.data.id}`);
    } catch (err) {
      toast.error(err.message || 'Failed to import job description from link.');
    } finally {
      setImporting(false);
    }
  };

  const navigate = useNavigate();

  const handleMatchLiveJob = async (job) => {
    setMatchingJobId(job.id);
    try {
      const res = await resumeAPI.list();
      if (!res.data || res.data.length === 0) {
        toast.error('Please upload a resume first to run job matching!');
        navigate('/upload');
        return;
      }

      const latestResume = res.data[0];

      const createdJobRes = await jobsAPI.create({
        title: job.title,
        company: job.company,
        description: `${job.description}\n\nKey Skills: ${job.skills.join(', ')}\nLocation: ${job.location}`,
      });

      await jobsAPI.match({
        resume_id: latestResume.id,
        job_id: createdJobRes.data.id,
      });

      toast.success(`Matched against ${job.company}!`);
      navigate(`/jobs/match?resume_id=${latestResume.id}&job_id=${createdJobRes.data.id}`);
    } catch (err) {
      toast.error(err.message || 'Failed to match job');
    } finally {
      setMatchingJobId(null);
    }
  };

  return (
    <div>
      {/* ===== 1-CLICK URL IMPORT BAR ===== */}
      <Card style={{ marginBottom: 24, background: 'var(--bg-white)', borderColor: 'var(--accent-border)' }}>
        <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
          <LinkIcon size={16} /> Import Any Job Listing From Link
        </div>
        <form onSubmit={handleImportUrl} style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <input
            type="url"
            className="form-input"
            style={{ flex: 1, minWidth: 260 }}
            placeholder="Paste Naukri.com, LinkedIn, or Job Posting URL (e.g. https://www.naukri.com/job-listings-...)"
            value={importUrl}
            onChange={(e) => setImportUrl(e.target.value)}
            required
          />
          <Button type="submit" variant="primary" loading={importing} icon={Download}>
            Import & Match Resume
          </Button>
        </form>
      </Card>

      {/* ===== LIVE SEARCH AND LOCATION FILTER HEADER ===== */}
      <form onSubmit={handleSearchSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12, marginBottom: 24 }}>
        <div className="input-with-icon">
          <input
            type="text"
            className="form-input"
            placeholder="Search role, skills (e.g. React, Python, SDE)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="input-with-icon">
          <input
            type="text"
            className="form-input"
            placeholder="Location (e.g. Bengaluru, Remote)..."
            value={locationFilter}
            onChange={(e) => setLocationFilter(e.target.value)}
          />
        </div>

        <Button type="submit" variant="secondary" icon={Search} style={{ height: 46 }}>
          Search Live Vacancies
        </Button>
      </form>

      {/* ===== VACANCIES LISTING ===== */}
      {loading ? (
        <Card className="text-center p-8">
          <Loader2 size={32} className="animate-spin text-accent" style={{ margin: '0 auto 12px' }} />
          <p style={{ color: 'var(--text-secondary)' }}>Fetching live job openings from Naukri & LinkedIn...</p>
        </Card>
      ) : jobs.length === 0 ? (
        <Card className="text-center p-8">
          <p style={{ color: 'var(--text-secondary)' }}>No live job openings found for your search query.</p>
        </Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {jobs.map((job, index) => (
            <motion.div
              key={job.id || index}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.04 }}
              className="card"
              style={{ padding: '20px 24px', position: 'relative', overflow: 'hidden' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', gap: 16, flex: 1, minWidth: 260 }}>
                  <div
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 12,
                      background: job.logoBg || '#059669',
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 800,
                      fontSize: '1.2rem',
                      boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
                      flexShrink: 0,
                    }}
                  >
                    {job.company ? job.company[0] : 'J'}
                  </div>

                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                      <h3 style={{ fontSize: '1.1rem', color: 'var(--text-primary)' }}>{job.title}</h3>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '2px 8px', borderRadius: 10, background: 'var(--accent-light)', color: 'var(--accent)' }}>
                        {job.source}
                      </span>
                    </div>

                    <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
                      <span><strong>{job.company}</strong></span>
                      {job.location && <span><MapPin size={14} style={{ display: 'inline', marginRight: 4 }} />{job.location}</span>}
                      {job.salary && <span><DollarSign size={14} style={{ display: 'inline', marginRight: 2 }} />{job.salary}</span>}
                    </div>

                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: 8, lineHeight: 1.5 }}>
                      {job.description}
                    </p>

                    {job.skills?.length > 0 && (
                      <div className="tag-grid" style={{ marginTop: 12 }}>
                        {job.skills.map((s, idx) => (
                          <SkillBadge key={idx} name={s} variant="blue" />
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 10, flexShrink: 0 }}>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{job.posted}</span>
                  <Button
                    size="sm"
                    variant="primary"
                    icon={Sparkles}
                    loading={matchingJobId === job.id}
                    onClick={() => handleMatchLiveJob(job)}
                  >
                    Match With My Resume
                  </Button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
