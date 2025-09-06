'use client';

import { useState, useEffect, useCallback } from 'react';
import { useI18n } from '../../hooks/useI18n';
import { toast } from 'react-hot-toast';
import { Search, File, User, Calendar, ArrowToRight, Folder, FolderOpen } from '@styled-icons/boxicons-regular';
import Link from 'next/link';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface WikiPage {
  id: string;
  title: string;
  slug: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  createdBy: {
    id: string;
    username: string;
  };
  updatedBy: {
    id: string;
    username: string;
  };
  parent?: {
    id: string;
    slug: string;
    title: string;
  };
  children: Array<{
    id: string;
    slug: string;
    title: string;
  }>;
}

interface WikiResponse {
  pages: WikiPage[];
  total: number;
  page: number;
  limit: number;
}

export default function WikiClient() {
  const { t } = useI18n();
  const [pages, setPages] = useState<WikiPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [expandedPages, setExpandedPages] = useState<Set<string>>(new Set());

  const loadWikiPages = useCallback(async (page = 1, query = '') => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20'
      });
      
      if (query.trim()) {
        params.append('q', query.trim());
      }

      const response = await fetch(`${API_BASE_URL}/wiki?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error('Failed to load wiki pages');
      }

      const data: WikiResponse = await response.json();
      setPages(data.pages);
      setTotal(data.total);
      setCurrentPage(data.page);
      setTotalPages(Math.ceil(data.total / data.limit));
    } catch (error) {
      console.error('Error loading wiki pages:', error);
      toast.error(t('wiki.errorLoadingPages', 'Error loading wiki pages'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
    loadWikiPages(1, query);
  }, [loadWikiPages]);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
    loadWikiPages(page, searchQuery);
  }, [loadWikiPages, searchQuery]);

  const toggleExpanded = (pageId: string) => {
    const newExpanded = new Set(expandedPages);
    if (newExpanded.has(pageId)) {
      newExpanded.delete(pageId);
    } else {
      newExpanded.add(pageId);
    }
    setExpandedPages(newExpanded);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const renderPageContent = (content: string) => {
    // Simple markdown-like rendering for basic formatting
    return content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code class="bg-background px-1 py-0.5 rounded text-sm">$1</code>')
      .replace(/\n/g, '<br>');
  };

  useEffect(() => {
    loadWikiPages();
  }, [loadWikiPages]);

  if (loading && pages.length === 0) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-12 bg-background rounded-lg w-full"></div>
        </div>
        <div className="animate-pulse space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-20 bg-background rounded-lg w-full"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search size={20} className="text-text-secondary" />
        </div>
        <input
          type="text"
          placeholder={t('wiki.searchPlaceholder', 'Search wiki pages...')}
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-3 bg-background border border-border rounded-lg text-text placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
        />
      </div>

      {/* Results count */}
      {total > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-text-secondary">
            {total} {t('wiki.pagesFound', 'pages found')}
          </p>
          {totalPages > 1 && (
            <p className="text-text-secondary">
              {t('wiki.pageInfo', 'Page')} {currentPage} {t('wiki.of', 'of')} {totalPages}
            </p>
          )}
        </div>
      )}

      {/* Pages list */}
      {pages.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <File size={32} className="text-primary" />
          </div>
          <h3 className="text-lg font-semibold text-text mb-2">
            {searchQuery ? t('wiki.noResults', 'No results found') : t('wiki.noPages', 'No wiki pages available')}
          </h3>
          <p className="text-text-secondary">
            {searchQuery 
              ? t('wiki.noResultsDescription', 'Try adjusting your search terms')
              : t('wiki.noPagesDescription', 'Wiki pages will appear here when they are created')
            }
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {pages.map((page) => (
            <div key={page.id} className="bg-background border border-border rounded-lg p-6 hover:border-primary/50 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    {page.children.length > 0 ? (
                      <button
                        onClick={() => toggleExpanded(page.id)}
                        className="flex items-center gap-1 text-primary hover:text-primary-dark transition-colors"
                      >
                        {expandedPages.has(page.id) ? (
                          <FolderOpen size={16} />
                        ) : (
                          <Folder size={16} />
                        )}
                        <span className="text-sm font-medium">
                          {expandedPages.has(page.id) ? t('wiki.collapse', 'Collapse') : t('wiki.expand', 'Expand')}
                        </span>
                      </button>
                    ) : (
                      <File size={16} className="text-text-secondary" />
                    )}
                  </div>
                  
                  <Link 
                    href={`/wiki/${page.slug}`}
                    className="block group"
                  >
                    <h3 className="text-xl font-semibold text-text group-hover:text-primary transition-colors mb-2">
                      {page.title}
                    </h3>
                  </Link>

                  <div 
                    className="text-text-secondary mb-4 line-clamp-3"
                    dangerouslySetInnerHTML={{ 
                      __html: renderPageContent(page.content.substring(0, 200) + (page.content.length > 200 ? '...' : ''))
                    }}
                  />

                  <div className="flex items-center gap-4 text-sm text-text-secondary">
                    <div className="flex items-center gap-1">
                      <User size={14} />
                      <span>{t('wiki.createdBy', 'Created by')} {page.createdBy.username}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar size={14} />
                      <span>{formatDate(page.createdAt)}</span>
                    </div>
                    {page.updatedAt !== page.createdAt && (
                      <div className="flex items-center gap-1">
                        <span>{t('wiki.updated', 'Updated')} {formatDate(page.updatedAt)}</span>
                      </div>
                    )}
                  </div>

                  {/* Parent page */}
                  {page.parent && (
                    <div className="mt-3 pt-3 border-t border-border">
                      <div className="flex items-center gap-2 text-sm text-text-secondary">
                        <span>{t('wiki.parentPage', 'Parent page')}:</span>
                        <Link 
                          href={`/wiki/${page.parent.slug}`}
                          className="text-primary hover:text-primary-dark transition-colors"
                        >
                          {page.parent.title}
                        </Link>
                      </div>
                    </div>
                  )}
                </div>

                <Link 
                  href={`/wiki/${page.slug}`}
                  className="ml-4 flex items-center gap-1 text-primary hover:text-primary-dark transition-colors"
                >
                  <span className="text-sm font-medium">{t('wiki.readMore', 'Read more')}</span>
                  <ArrowToRight size={16} />
                </Link>
              </div>

              {/* Children pages */}
              {page.children.length > 0 && expandedPages.has(page.id) && (
                <div className="mt-4 pt-4 border-t border-border">
                  <h4 className="text-sm font-medium text-text mb-3">
                    {t('wiki.subPages', 'Sub-pages')} ({page.children.length})
                  </h4>
                  <div className="grid gap-2">
                    {page.children.map((child) => (
                      <Link
                        key={child.id}
                        href={`/wiki/${child.slug}`}
                        className="flex items-center gap-2 p-2 bg-background border border-border rounded hover:border-primary/50 transition-colors"
                      >
                        <File size={14} className="text-text-secondary" />
                        <span className="text-sm text-text">{child.title}</span>
                        <ArrowToRight size={14} className="text-primary ml-auto" />
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-4 py-2 bg-background border border-border text-text rounded-lg hover:bg-background disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {t('wiki.previous', 'Previous')}
          </button>
          
          <div className="flex items-center gap-1">
            {[...Array(Math.min(5, totalPages))].map((_, i) => {
              const pageNum = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
              if (pageNum > totalPages) return null;
              
              return (
                <button
                  key={pageNum}
                  onClick={() => handlePageChange(pageNum)}
                  className={`px-3 py-2 rounded-lg transition-colors ${
                    pageNum === currentPage
                      ? 'bg-primary text-white'
                      : 'bg-background border border-border text-text hover:bg-background'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>

          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-4 py-2 bg-background border border-border text-text rounded-lg hover:bg-background disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {t('wiki.next', 'Next')}
          </button>
        </div>
      )}
    </div>
  );
}
