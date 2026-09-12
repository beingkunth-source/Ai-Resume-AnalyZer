import { CheckCircle2, Sparkles, Layout, Code2, Feather, BookOpen } from 'lucide-react';

export const RESUME_TEMPLATES = [
  {
    id: 'modern',
    name: 'Modern Executive',
    badge: 'Popular',
    color: '#059669',
    bgLight: '#ECFDF5',
    icon: Layout,
    description: 'Clean emerald accent headers with optional candidate profile avatar.',
  },
  {
    id: 'minimal',
    name: 'Minimal Tech',
    badge: 'ATS Favorite',
    color: '#18181B',
    bgLight: '#F4F4F5',
    icon: Code2,
    description: 'Sleek dark monochrome layout designed for developers & engineers.',
  },
  {
    id: 'creative',
    name: 'Indigo Creative',
    badge: 'Modern',
    color: '#4F46E5',
    bgLight: '#EEF2FF',
    icon: Feather,
    description: 'Dual-column layout with vibrant indigo highlight bars for projects.',
  },
  {
    id: 'classic',
    name: 'Classic Times',
    badge: 'Traditional',
    color: '#1E293B',
    bgLight: '#F8FAFC',
    icon: BookOpen,
    description: 'Elegant traditional serif typography layout suited for finance & enterprise.',
  },
];

export default function ResumeTemplates({ selectedTemplate, onSelectTemplate }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h3 style={{ fontSize: '1.05rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
          <Sparkles size={18} className="text-accent" /> Choose Resume Template Style
        </h3>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
          Select template to live-preview & export PDF / DOCX
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
        {RESUME_TEMPLATES.map((tmpl) => {
          const IconComp = tmpl.icon;
          const isSelected = selectedTemplate === tmpl.id;
          return (
            <div
              key={tmpl.id}
              onClick={() => onSelectTemplate(tmpl.id)}
              style={{
                background: 'var(--bg-white)',
                border: `2px solid ${isSelected ? tmpl.color : 'var(--border)'}`,
                borderRadius: 'var(--radius-md)',
                padding: 16,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: isSelected ? `0 4px 14px ${tmpl.color}22` : 'var(--shadow-sm)',
                position: 'relative',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <div
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 8,
                    background: tmpl.bgLight,
                    color: tmpl.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <IconComp size={18} />
                </div>
                <span
                  style={{
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: 12,
                    background: tmpl.bgLight,
                    color: tmpl.color,
                  }}
                >
                  {tmpl.badge}
                </span>
              </div>

              <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)', marginBottom: 4 }}>
                {tmpl.name}
              </div>

              <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.4, margin: 0 }}>
                {tmpl.description}
              </p>

              {isSelected && (
                <div style={{ position: 'absolute', top: 8, right: 8, color: tmpl.color }}>
                  <CheckCircle2 size={16} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
