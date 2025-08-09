'use client';

import { useI18n } from '@/app/hooks/useI18n';
import { useMemo } from 'react';

type ActivityType = 'upload' | 'comment' | 'request' | 'bookmark' | 'promotion';

interface ActivityItem {
  id: string;
  type: ActivityType;
  title: string;
  subtitle?: string;
  timestamp: string; // ISO or friendly string
}

export default function RecentActivity() {
  const { t } = useI18n();

  // Mock de feed al estilo NexusTrackerV2; integración real futura desde backend
  const items = useMemo<ActivityItem[]>(() => [
    { id: '1', type: 'upload', title: 'Subiste "The Matrix (1999) 1080p"', subtitle: 'Categoría: Películas', timestamp: 'hace 2h' },
    { id: '2', type: 'comment', title: 'Comentaste en "Inception (2010)"', subtitle: '“Gran calidad, gracias por compartir.”', timestamp: 'hace 5h' },
    { id: '3', type: 'request', title: 'Tu solicitud "Interstellar 4K" fue llenada', subtitle: 'Por: user42', timestamp: 'ayer' },
    { id: '4', type: 'bookmark', title: 'Marcaste como favorito "Dune (2021)"', subtitle: 'Sección: Sci-Fi', timestamp: 'ayer' },
    { id: '5', type: 'promotion', title: 'Has sido promocionado a Power User', subtitle: '¡Sigue seedeando para más beneficios!', timestamp: 'esta semana' },
  ], []);

  const iconFor = (type: ActivityType) => {
    const base = 'w-5 h-5';
    switch (type) {
      case 'upload': return (<svg className={base} viewBox="0 0 20 20" fill="currentColor"><path d="M3 16a2 2 0 002 2h10a2 2 0 002-2v-5a1 1 0 112 0v5a4 4 0 01-4 4H5a4 4 0 01-4-4v-5a1 1 0 112 0v5z"/><path d="M7 9l3-3 3 3m-3-3v10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>);
      case 'comment': return (<svg className={base} viewBox="0 0 20 20" fill="currentColor"><path d="M18 13a3 3 0 01-3 3H8l-4 4V4a3 3 0 013-3h8a3 3 0 013 3v9z"/></svg>);
      case 'request': return (<svg className={base} viewBox="0 0 20 20" fill="currentColor"><path d="M9 2a1 1 0 00-1 1v6H4a1 1 0 000 2h4v6a1 1 0 002 0v-6h4a1 1 0 000-2h-4V3a1 1 0 00-1-1z"/></svg>);
      case 'bookmark': return (<svg className={base} viewBox="0 0 20 20" fill="currentColor"><path d="M5 3a2 2 0 00-2 2v12l7-3 7 3V5a2 2 0 00-2-2H5z"/></svg>);
      case 'promotion': return (<svg className={base} viewBox="0 0 20 20" fill="currentColor"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.802 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118L10 13.347l-2.885 2.124c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L3.48 8.72c-.783-.57-.38-1.81.588-1.81h3.462a1 1 0 00.95-.69l1.07-3.292z"/></svg>);
      default: return null;
    }
  };

  return (
    <div className="bg-surface rounded-lg border border-border p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-text">{t('profile.sections.recent', 'Recent Activity')}</h2>
        <span className="text-xs text-text-secondary">{t('profile.recent.mock', 'Mock data – real integration coming soon')}</span>
      </div>

      <ul className="divide-y divide-border">
        {items.map((item) => (
          <li key={item.id} className="py-3 flex items-start gap-3">
            <div className="text-primary mt-0.5">{iconFor(item.type)}</div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-text truncate">{item.title}</p>
              {item.subtitle && <p className="text-xs text-text-secondary mt-0.5">{item.subtitle}</p>}
            </div>
            <div className="text-xs text-text-secondary whitespace-nowrap">{item.timestamp}</div>
          </li>
        ))}
      </ul>
    </div>
  );
}


