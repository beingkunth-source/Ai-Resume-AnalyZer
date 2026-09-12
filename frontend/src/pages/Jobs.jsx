import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { jobsAPI } from '../services/api';
import { Briefcase, Plus, Trash2, TrendingUp, Clock, Globe } from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '../components/Button';
import Card from '../components/Card';
import LoadingState from '../components/LoadingState';
import LiveJobBoard from '../components/LiveJobBoard';

export default function Jobs() {
  const [activeTab, setActiveTab] = useState('live'); // live | custom
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form state
  const [title, setTitle] = useState('');
  const [company, setCompany] = useState('');
  const [description, setDescription] = useState('');
  const [creating, setCreating] = useState(false);

  const loadJobs = () => {
    jobsAPI
      .list()
      .then((res) => setJobs(res.data))
      .catch(() => toast.error('Failed to load job descriptions'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadJobs();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!title.trim() || description.trim().length < 30) {
      toast.error('Title and description (min 30 chars) are required.');
      return;
    }
    setCreating(true);
    try {
      await jobsAPI.create({ title, company, description });
      toast.success('Job description saved successfully!');
      setTitle('');
      setCompany('');
      setDescription('');
      loadJobs();
    } catch (err) {
      toast.error(err.message || 'Failed to save job description');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id, e) => {
    e.preventDefault();
    if (!window.confirm('Delete this job description and all associated matches?')) return;
    try {
      await jobsAPI.delete(id);
      setJobs((prev) => prev.filter((j) => j.id !== id));
      toast.success('Job description deleted');
    } catch (err) {
      toast.error(err.message || 'Delete failed');
    }
  };

  if (loading) return <LoadingState type="page" />;

  return (
    <div>
      <div className="card-header" style={{ marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', marginBottom: 4 }}>Job Openings & Descriptions</h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            Match your resume against live vacancies from Naukri & LinkedIn or add custom job descriptions.
          </p>
        </div>
      </div>

      {/* ===== TABS HEADER ===== */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24, borderBottom: '1px solid var(--border)', paddingBottom: 12 }}>
        <button
          type="button"
          className={`btn ${activeTab === 'live' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('live')}
        >
          <Globe size={16} /> Live Vacancies (Naukri & LinkedIn)
        </button>
        <button
          type="button"
          className={`btn ${activeTab === 'custom' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('custom')}
        >
          <Briefcase size={16} /> My Custom Jobs ({jobs.length})
        </button>
      </div>

      {activeTab === 'live' ? (
        <LiveJobBoard />
      ) : (
        <div>
          <Card className="mb-6" style={{ marginBottom: 32 }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Plus size={18} className="text-accent" /> Add Custom Job Description
            </h3>
            <form onSubmit={handleCreate}>
              <div className="two-col">
                <div className="form-group">
                  <label className="form-label">Job Title *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Full Stack Engineer"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Company Name</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. OpenAI"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Job Description & Qualifications *</label>
                <textarea
                  className="form-textarea"
                  placeholder="Paste the full job description text here..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={5}
                  required
                />
              </div>

              <Button type="submit" variant="primary" loading={creating} icon={Plus}>
                Save Job Description
              </Button>
            </form>
          </Card>

          <h2 style={{ fontSize: '1.25rem', marginBottom: 16 }}>Stored Jobs ({jobs.length})</h2>

          {jobs.length === 0 ? (
            <Card className="text-center p-8">
              <Briefcase size={36} style={{ color: 'var(--text-muted)', margin: '0 auto 12px' }} />
              <p style={{ color: 'var(--text-secondary)' }}>No custom job descriptions added yet.</p>
            </Card>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {jobs.map((j) => (
                <Card key={j.id} style={{ padding: '18px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Briefcase size={16} className="text-accent" />
                      <span>{j.title}</span>
                      {j.company && <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>at {j.company}</span>}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 4 }}>
                      <Clock size={12} style={{ display: 'inline', marginRight: 4 }} />
                      Added on {new Date(j.created_at).toLocaleDateString()}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Link to={`/jobs/match?job_id=${j.id}`}>
                      <Button size="sm" variant="primary" icon={TrendingUp}>
                        Match Resume
                      </Button>
                    </Link>
                    <button
                      type="button"
                      className="btn-logout"
                      onClick={(e) => handleDelete(j.id, e)}
                      title="Delete Job"
                      style={{ padding: 8 }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
