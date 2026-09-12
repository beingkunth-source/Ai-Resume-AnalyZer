export default function LoadingState({ type = 'card', count = 3 }) {
  if (type === 'page') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20, padding: '20px 0' }}>
        <div className="skeleton" style={{ height: 40, width: '40%' }} />
        <div className="skeleton" style={{ height: 20, width: '60%' }} />
        <div className="stats-grid" style={{ marginTop: 20 }}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="skeleton" style={{ height: 90, borderRadius: 12 }} />
          ))}
        </div>
        <div className="skeleton" style={{ height: 200, width: '100%', borderRadius: 12 }} />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="skeleton" style={{ height: type === 'stat' ? 90 : 70, width: '100%', borderRadius: 12 }} />
      ))}
    </div>
  );
}
