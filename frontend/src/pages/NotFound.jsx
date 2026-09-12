import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="empty-state">
      <h1 style={{ fontSize: '4rem', marginBottom: 8, color: 'var(--text-muted)' }}>404</h1>
      <h3>Page not found</h3>
      <p>The page you're looking for doesn't exist.</p>
      <Link to="/dashboard" className="btn btn-outline">Go to Dashboard</Link>
    </div>
  );
}
