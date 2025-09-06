'use client';

import { useI18n } from '@/app/hooks/useI18n';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { API_BASE_URL } from '@/lib/api';

interface ActivityItem {
  id: string;
  type: string;
  entityType?: string;
  entityId?: string;
  title: string;
  subtitle?: string;
  metadata?: any;
  createdAt: string;
}

interface ActivitiesResponse {
  activities: ActivityItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function RecentActivity() {
  const { t } = useI18n();
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        const token = localStorage.getItem('authToken');
        if (!token) {
          setError('No authentication token found');
          setLoading(false);
          return;
        }

        const response = await fetch(`${API_BASE_URL}/user/activities?page=${currentPage}&limit=10`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch activities');
        }

        const data: ActivitiesResponse = await response.json();
        setActivities(data.activities);
        setTotalPages(data.totalPages);
        setTotal(data.total);
      } catch (err) {
        console.error('Error fetching activities:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchActivities();
  }, [currentPage]);

  const iconFor = (type: string) => {
    const base = 'w-5 h-5';
    switch (type) {
      case 'torrent_uploaded': return (<svg className={base} viewBox="0 0 20 20" fill="currentColor"><path d="M3 16a2 2 0 002 2h10a2 2 0 002-2v-5a1 1 0 112 0v5a4 4 0 01-4 4H5a4 4 0 01-4-4v-5a1 1 0 112 0v5z"/><path d="M7 9l3-3 3 3m-3-3v10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>);
      case 'torrent_downloaded': return (<svg className={base} viewBox="0 0 20 20" fill="currentColor"><path d="M3 16a2 2 0 002 2h10a2 2 0 002-2v-5a1 1 0 112 0v5a4 4 0 01-4 4H5a4 4 0 01-4-4v-5a1 1 0 112 0v5z"/><path d="M7 11l3 3 3-3m-3 3V1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>);
      case 'comment_added': return (<svg className={base} viewBox="0 0 20 20" fill="currentColor"><path d="M18 13a3 3 0 01-3 3H8l-4 4V4a3 3 0 013-3h8a3 3 0 013 3v9z"/></svg>);
      case 'request_created': return (<svg className={base} viewBox="0 0 20 20" fill="currentColor"><path d="M9 2a1 1 0 00-1 1v6H4a1 1 0 000 2h4v6a1 1 0 002 0v-6h4a1 1 0 000-2h-4V3a1 1 0 00-1-1z"/></svg>);
      case 'request_filled': return (<svg className={base} viewBox="0 0 20 20" fill="currentColor"><path d="M9 2a1 1 0 00-1 1v6H4a1 1 0 000 2h4v6a1 1 0 002 0v-6h4a1 1 0 000-2h-4V3a1 1 0 00-1-1z"/></svg>);
      case 'bookmark_added': return (<svg className={base} viewBox="0 0 20 20" fill="currentColor"><path d="M5 3a2 2 0 00-2 2v12l7-3 7 3V5a2 2 0 00-2-2H5z"/></svg>);
      case 'bookmark_removed': return (<svg className={base} viewBox="0 0 20 20" fill="currentColor"><path d="M5 3a2 2 0 00-2 2v12l7-3 7 3V5a2 2 0 00-2-2H5z"/></svg>);
      case 'torrent_liked': return (<svg className={base} viewBox="0 0 20 20" fill="currentColor"><path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.834a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z"/></svg>);
      case 'torrent_disliked': return (<svg className={base} viewBox="0 0 20 20" fill="currentColor"><path d="M18 9.5a1.5 1.5 0 11-3 0v-6a1.5 1.5 0 013 0v6zM14 9.667v-5.834a2 2 0 00-1.106-1.79l-.05-.025A4 4 0 0011.057 2H5.64a2 2 0 00-1.962 1.608l-1.2 6A2 2 0 004.44 12H8v4a2 2 0 002 2 1 1 0 001-1v-.667a4 4 0 01.8-2.4l1.4-1.866a4 4 0 00.8-2.4z"/></svg>);
      case 'torrent_approved': return (<svg className={base} viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/></svg>);
      default: return (<svg className={base} viewBox="0 0 20 20" fill="currentColor"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.802 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118L10 13.347l-2.885 2.124c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L3.48 8.72c-.783-.57-.38-1.81.588-1.81h3.462a1 1 0 00.95-.69l1.07-3.292z"/></svg>);
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'hace un momento';
    if (diffInSeconds < 3600) return `hace ${Math.floor(diffInSeconds / 60)}m`;
    if (diffInSeconds < 86400) return `hace ${Math.floor(diffInSeconds / 3600)}h`;
    if (diffInSeconds < 604800) return `hace ${Math.floor(diffInSeconds / 86400)}d`;
    return date.toLocaleDateString();
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const translateActivityText = (text: string, metadata?: any) => {
    // If the text is a translation key (starts with 'activities.')
    if (text.startsWith('activities.')) {
      let translatedText = t(text, text); // Fallback to original text if translation not found
      
      // If translation failed (returned the same key), try manual translation
      if (translatedText === text) {
        
        // Manual fallback translations - we'll make these dynamic based on language
        const manualTranslations: Record<string, Record<string, string>> = {
          'activities.torrent_uploaded.title': {
            'es': 'Subiste "{{torrentName}}"',
            'en': 'You uploaded "{{torrentName}}"'
          },
          'activities.torrent_uploaded.subtitle': {
            'es': 'Categoría: Torrent',
            'en': 'Category: Torrent'
          },
          'activities.torrent_approved.title': {
            'es': 'Tu torrent "{{torrentName}}" ha sido aprobado',
            'en': 'Your torrent "{{torrentName}}" has been approved'
          },
          'activities.torrent_approved.subtitle': {
            'es': 'Aprobado por administrador',
            'en': 'Approved by administrator'
          },
          'activities.bookmark_added.title': {
            'es': 'Marcaste como favorito "{{torrentName}}"',
            'en': 'You bookmarked "{{torrentName}}"'
          },
          'activities.bookmark_added.subtitle': {
            'es': 'Agregado a marcadores',
            'en': 'Added to bookmarks'
          },
          'activities.bookmark_removed.title': {
            'es': 'Eliminaste "{{torrentName}}" de marcadores',
            'en': 'You removed "{{torrentName}}" from bookmarks'
          },
          'activities.bookmark_removed.subtitle': {
            'es': 'Removido de marcadores',
            'en': 'Removed from bookmarks'
          },
          'activities.torrent_liked.title': {
            'es': 'Diste like a "{{torrentName}}"',
            'en': 'You liked "{{torrentName}}"'
          },
          'activities.torrent_liked.subtitle': {
            'es': '👍 Like',
            'en': '👍 Like'
          },
          'activities.torrent_disliked.title': {
            'es': 'Diste dislike a "{{torrentName}}"',
            'en': 'You disliked "{{torrentName}}"'
          },
          'activities.torrent_disliked.subtitle': {
            'es': '👎 Dislike',
            'en': '👎 Dislike'
          },
          'activities.request_created.title': {
            'es': 'Creaste la petición "{{requestTitle}}"',
            'en': 'You created the request "{{requestTitle}}"'
          },
          'activities.request_created.subtitle': {
            'es': 'Nueva petición',
            'en': 'New request'
          },
          'activities.request_filled.title': {
            'es': 'Tu petición "{{requestTitle}}" fue llenada',
            'en': 'Your request "{{requestTitle}}" was filled'
          },
          'activities.request_filled.subtitle': {
            'es': 'Por: {{filledBy}}',
            'en': 'By: {{filledBy}}'
          },
          'activities.request_filled_by_you.title': {
            'es': 'Llenaste la petición "{{requestTitle}}"',
            'en': 'You filled the request "{{requestTitle}}"'
          },
          'activities.request_filled_by_you.subtitle': {
            'es': 'Con: {{torrentName}}',
            'en': 'With: {{torrentName}}'
          },
          'activities.comment_added.title': {
            'es': 'Comentaste en "{{entityName}}"',
            'en': 'You commented on "{{entityName}}"'
          },
          'activities.comment_added.subtitle': {
            'es': 'Nuevo comentario',
            'en': 'New comment'
          }
        };
        
        // Get current language from cookie or default to 'es'
        const getCurrentLanguage = () => {
          try {
            if (typeof document === 'undefined') return 'es';
            const match = document.cookie.match(/(?:^|; )i18nextLng=([^;]+)/);
            const lng = match ? decodeURIComponent(match[1]) : '';
            if (lng === 'en' || lng === 'es') return lng;
          } catch {}
          return 'es';
        };
        
        const currentLang = getCurrentLanguage();
        const langTranslations = manualTranslations[text];
        
        if (langTranslations && langTranslations[currentLang]) {
          translatedText = langTranslations[currentLang];
        } else if (langTranslations && langTranslations['es']) {
          translatedText = langTranslations['es']; // Fallback to Spanish
        } else {
          translatedText = text; // Keep original if no translation found
        }
      }
      
      // Replace placeholders with metadata values
      if (metadata) {
        // Parse metadata if it's a string
        let parsedMetadata = metadata;
        if (typeof metadata === 'string') {
          try {
            parsedMetadata = JSON.parse(metadata);
          } catch (e) {
            parsedMetadata = {};
          }
        }
        
        Object.keys(parsedMetadata).forEach(key => {
          const placeholder = `{{${key}}}`;
          if (translatedText.includes(placeholder)) {
            translatedText = translatedText.replace(new RegExp(placeholder, 'g'), parsedMetadata[key] || '');
          }
        });
      }
      
      return translatedText;
    }
    
    // If it's not a translation key, return as is (for backward compatibility)
    return text;
  };

  const renderActivityTextWithLinks = (text: string, metadata?: any) => {
    const translatedText = translateActivityText(text, metadata);
    
    // Parse metadata if it's a string
    let parsedMetadata = metadata;
    if (metadata && typeof metadata === 'string') {
      try {
        parsedMetadata = JSON.parse(metadata);
      } catch (e) {
        parsedMetadata = {};
      }
    }
    
    // Check if this activity involves a torrent that should be linked
    const torrentId = parsedMetadata?.torrentId;
    const torrentName = parsedMetadata?.torrentName;
    
    if (torrentId && torrentName) {
      // Replace the torrent name with a link, keeping quotes outside
      const linkPattern = new RegExp(`"${torrentName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"`, 'g');
      const parts = translatedText.split(linkPattern);
      
      if (parts.length > 1) {
        return (
          <>
            {parts.map((part, index) => (
              <span key={index}>
                {part}
                {index < parts.length - 1 && (
                  <>
                    "
                    <Link 
                      href={`/torrent/${torrentId}`}
                      className="text-primary hover:text-primary/80 underline transition-colors"
                    >
                      {torrentName}
                    </Link>
                    "
                  </>
                )}
              </span>
            ))}
          </>
        );
      }
    }
    
    // If no torrent link needed, return plain text
    return translatedText;
  };

  if (loading) {
    return (
      <div className="bg-surface rounded-lg border border-border p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-text">{t('profile.sections.recent', 'Recent Activity')}</h2>
        </div>
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="py-3 flex items-start gap-3">
              <div className="w-5 h-5 bg-text-secondary/10 rounded animate-pulse"></div>
              <div className="flex-1 min-w-0">
                <div className="w-3/4 h-4 bg-text-secondary/10 rounded animate-pulse mb-2"></div>
                <div className="w-1/2 h-3 bg-text-secondary/10 rounded animate-pulse"></div>
              </div>
              <div className="w-16 h-3 bg-text-secondary/10 rounded animate-pulse"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-surface rounded-lg border border-border p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-text">{t('profile.sections.recent', 'Recent Activity')}</h2>
        </div>
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-text mb-2">Error al cargar actividades</h3>
          <p className="text-text-secondary">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-surface rounded-lg border border-border p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-text">{t('profile.sections.recent', 'Recent Activity')}</h2>
        {activities.length > 0 && (
          <span className="text-xs text-text-secondary">
            {activities.length} {t('profile.activity.items', 'actividades')}
          </span>
        )}
      </div>

      {activities.length === 0 ? (
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-text mb-2">
            {t('profile.activity.empty', 'No hay actividades recientes')}
          </h3>
          <p className="text-text-secondary">
            {t('profile.activity.emptyDescription', 'Tus actividades aparecerán aquí cuando realices acciones en el sitio')}
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-border">
          {activities.map((activity) => (
            <li key={activity.id} className="py-3 flex items-start gap-3">
              <div className="text-primary mt-0.5">{iconFor(activity.type)}</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-text truncate">
                  {renderActivityTextWithLinks(activity.title, activity.metadata)}
                </p>
                {activity.subtitle && (
                  <p className="text-xs text-text-secondary mt-0.5">
                    {renderActivityTextWithLinks(activity.subtitle, activity.metadata)}
                  </p>
                )}
              </div>
              <div className="text-xs text-text-secondary whitespace-nowrap">
                {formatTimestamp(activity.createdAt)}
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between">
          <div className="text-sm text-text-secondary">
            {t('profile.activity.showing', 'Mostrando')} {((currentPage - 1) * 10) + 1} {t('profile.activity.to', 'a')} {Math.min(currentPage * 10, total)} {t('profile.activity.of', 'de')} {total} {t('profile.activity.activities', 'actividades')}
          </div>
          
          <div className="flex items-center space-x-2">
            {/* Previous Button */}
            <button
              onClick={handlePreviousPage}
              disabled={currentPage === 1}
              className={`px-3 py-1 text-sm rounded-md border transition-colors ${
                currentPage === 1
                  ? 'border-border text-text-secondary cursor-not-allowed'
                  : 'border-border text-text hover:bg-surface hover:border-primary'
              }`}
            >
              {t('profile.activity.previous', 'Anterior')}
            </button>

            {/* Page Numbers */}
            <div className="flex items-center space-x-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }

                return (
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    className={`px-3 py-1 text-sm rounded-md border transition-colors ${
                      currentPage === pageNum
                        ? 'bg-primary text-white border-primary'
                        : 'border-border text-text hover:bg-surface hover:border-primary'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>

            {/* Next Button */}
            <button
              onClick={handleNextPage}
              disabled={currentPage === totalPages}
              className={`px-3 py-1 text-sm rounded-md border transition-colors ${
                currentPage === totalPages
                  ? 'border-border text-text-secondary cursor-not-allowed'
                  : 'border-border text-text hover:bg-surface hover:border-primary'
              }`}
            >
              {t('profile.activity.next', 'Siguiente')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}


