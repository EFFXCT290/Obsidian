'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  Download, 
  User, 
  Time, 
  Search as SearchIcon,
  SortUp,
  Tag
} from '@styled-icons/boxicons-regular';
import { API_BASE_URL } from '@/lib/api';

interface Torrent {
  id: string;
  name: string;
  size: string;
  seeders: number;
  leechers: number;
  completed: number;
  createdAt: string;
  uploader: {
    id: string;
    username: string;
  };
  category: {
    id: string;
    name: string;
  };
  tags: string[];
}

interface SearchClientProps {
  searchParams: {
    tag?: string;
    q?: string;
    page?: string;
    sort?: string;
  };
  translations: {
    title: string;
    description: string;
    noResults: string;
    loading: string;
    filters: {
      sortBy: string;
      newest: string;
      oldest: string;
      mostSeeded: string;
      leastSeeded: string;
      largest: string;
      smallest: string;
    };
    torrent: {
      seeders: string;
      leechers: string;
      completed: string;
      uploaded: string;
      by: string;
      size: string;
      download: string;
    };
    pagination: {
      previous: string;
      next: string;
      page: string;
      of: string;
    };
  };
}

export default function SearchClient({ searchParams, translations }: SearchClientProps) {
  const router = useRouter();
  const urlSearchParams = useSearchParams();
  
  const [torrents, setTorrents] = useState<Torrent[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState(searchParams.q || '');
  const [selectedTag, setSelectedTag] = useState(searchParams.tag || '');
  const [selectedSort, setSelectedSort] = useState(searchParams.sort || 'newest');

  const limit = 20;
  const totalPages = Math.ceil(total / limit);

  // Format bytes to human readable format
  const formatBytes = (bytes: string): string => {
    const numBytes = parseInt(bytes);
    if (numBytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(numBytes) / Math.log(k));
    return parseFloat((numBytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  // Format date to relative time
  const formatRelativeTime = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    
    return date.toLocaleDateString();
  };

  // Search torrents by tag
  const searchTorrentsByTag = useCallback(async () => {
    if (!selectedTag) return;
    
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: limit.toString(),
        ...(selectedSort && { sort: selectedSort }),
      });

      const response = await fetch(`${API_BASE_URL}/tags/${encodeURIComponent(selectedTag)}/torrents?${params}`);
      if (response.ok) {
        const data = await response.json();
        setTorrents(data.torrents || []);
        setTotal(data.total || 0);
      }
    } catch (error) {
      console.error('Error searching torrents by tag:', error);
    }
  }, [selectedTag, currentPage, selectedSort]);

  // Search torrents by text
  const searchTorrentsByText = useCallback(async () => {
    if (!searchQuery.trim()) return;
    
    try {
      const params = new URLSearchParams({
        q: searchQuery.trim(),
        page: currentPage.toString(),
        limit: limit.toString(),
        ...(selectedSort && { sort: selectedSort }),
      });

      const response = await fetch(`${API_BASE_URL}/search?${params}`);
      if (response.ok) {
        const data = await response.json();
        setTorrents(data.torrents || []);
        setTotal(data.total || 0);
      }
    } catch (error) {
      console.error('Error searching torrents by text:', error);
    }
  }, [searchQuery, currentPage, selectedSort]);

  // Update URL when parameters change
  const updateURL = (newParams: { tag?: string; q?: string; sort?: string; page?: number }) => {
    const params = new URLSearchParams(urlSearchParams);
    
    if (newParams.tag !== undefined) {
      if (newParams.tag) {
        params.set('tag', newParams.tag);
      } else {
        params.delete('tag');
      }
    }
    
    if (newParams.q !== undefined) {
      if (newParams.q) {
        params.set('q', newParams.q);
      } else {
        params.delete('q');
      }
    }
    
    if (newParams.sort !== undefined) {
      params.set('sort', newParams.sort);
    }
    
    if (newParams.page !== undefined) {
      if (newParams.page > 1) {
        params.set('page', newParams.page.toString());
      } else {
        params.delete('page');
      }
    }
    
    const queryString = params.toString();
    const newURL = queryString ? `?${queryString}` : '';
    router.push(`/search${newURL}`);
  };

  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSelectedTag('');
    setCurrentPage(1);
    updateURL({ q: searchQuery, tag: '', page: 1 });
  };

  // Handle sort change
  const handleSortChange = (sort: string) => {
    setSelectedSort(sort);
    setCurrentPage(1);
    updateURL({ sort, page: 1 });
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    updateURL({ page });
  };

  // Clear search
  const clearSearch = () => {
    setSearchQuery('');
    setSelectedTag('');
    setCurrentPage(1);
    setTorrents([]);
    setTotal(0);
    updateURL({ q: '', tag: '', page: 1 });
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      if (selectedTag) {
        await searchTorrentsByTag();
      } else if (searchQuery.trim()) {
        await searchTorrentsByText();
      }
      setLoading(false);
    };
    loadData();
  }, [selectedTag, searchQuery, searchTorrentsByTag, searchTorrentsByText]);

  // Set initial values from URL params
  useEffect(() => {
    setCurrentPage(Number(searchParams.page) || 1);
    setSelectedTag(searchParams.tag || '');
    setSearchQuery(searchParams.q || '');
    setSelectedSort(searchParams.sort || 'newest');
  }, [searchParams]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-text-secondary">{translations.loading}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 mt-6">
      {/* Page Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-text">
          {selectedTag 
            ? `${translations.title}: ${selectedTag}` 
            : searchQuery.trim() 
              ? `${translations.title}: "${searchQuery}"`
              : translations.title
          }
        </h1>
        <p className="text-text-secondary">
          {selectedTag 
            ? `Mostrando torrents con el tag "${selectedTag}"`
            : searchQuery.trim()
              ? `Resultados para "${searchQuery}"`
              : translations.description
          }
        </p>
      </div>

      {/* Search Form */}
      <div className="bg-surface rounded-lg border border-border p-6">
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="flex items-center space-x-4">
            <div className="flex-1 relative">
              <SearchIcon size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-secondary" />
              <input
                type="text"
                placeholder="Buscar torrents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-border rounded-lg bg-background text-text focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
            <button
              type="submit"
              className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
            >
              Buscar
            </button>
            {(searchQuery || selectedTag) && (
              <button
                type="button"
                onClick={clearSearch}
                className="px-4 py-3 border border-border text-text rounded-lg hover:bg-surface transition-colors"
              >
                Limpiar
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Filters */}
      {(selectedTag || searchQuery.trim()) && (
        <div className="bg-surface rounded-lg border border-border p-6">
          <div className="flex items-center space-x-4">
            {selectedTag && (
              <div className="flex items-center space-x-2">
                <Tag size={16} className="text-primary" />
                <span className="text-sm font-medium text-text">Tag: {selectedTag}</span>
              </div>
            )}
            {searchQuery.trim() && !selectedTag && (
              <div className="flex items-center space-x-2">
                <SearchIcon size={16} className="text-primary" />
                <span className="text-sm font-medium text-text">Búsqueda: "{searchQuery}"</span>
              </div>
            )}
            <div className="flex items-center space-x-2">
              <SortUp size={16} className="text-text-secondary" />
              <select
                value={selectedSort}
                onChange={(e) => handleSortChange(e.target.value)}
                className="px-3 py-2 border border-border rounded-lg bg-background text-text focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="newest">{translations.filters.newest}</option>
                <option value="oldest">{translations.filters.oldest}</option>
                <option value="mostSeeded">{translations.filters.mostSeeded}</option>
                <option value="leastSeeded">{translations.filters.leastSeeded}</option>
                <option value="largest">{translations.filters.largest}</option>
                <option value="smallest">{translations.filters.smallest}</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Results */}
      <div className="space-y-4">
        {torrents.length > 0 ? (
          torrents.map((torrent) => (
            <div key={torrent.id} className="bg-surface rounded-lg border border-border p-6 hover:border-primary/50 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <Link
                    href={`/torrent/${torrent.id}`}
                    className="block text-lg font-semibold text-text hover:text-primary transition-colors mb-2"
                  >
                    {torrent.name}
                  </Link>
                  
                  <div className="flex items-center space-x-4 text-sm text-text-secondary mb-3">
                    <div className="flex items-center space-x-1">
                      <User size={14} />
                      <span>{torrent.seeders}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Download size={14} />
                      <span>{torrent.leechers}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Time size={14} />
                      <span>{formatRelativeTime(torrent.createdAt)}</span>
                    </div>
                    <span>{formatBytes(torrent.size)}</span>
                  </div>

                  <div className="text-sm text-text-secondary">
                    {translations.torrent.uploaded} {formatRelativeTime(torrent.createdAt)} {translations.torrent.by}{' '}
                    <Link
                      href={`/user/${torrent.uploader.id}`}
                      className="text-primary hover:text-primary/80 transition-colors"
                    >
                      {torrent.uploader.username}
                    </Link>
                  </div>

                  {/* Tags */}
                  {torrent.tags && torrent.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {torrent.tags.slice(0, 5).map((tag) => (
                        <Link
                          key={tag}
                          href={`/search?tag=${encodeURIComponent(tag)}`}
                          className="text-xs px-2 py-1 bg-primary/10 text-primary rounded hover:bg-primary/20 transition-colors"
                        >
                          {tag}
                        </Link>
                      ))}
                      {torrent.tags.length > 5 && (
                        <span className="text-xs text-text-secondary">
                          +{torrent.tags.length - 5} more
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div className="ml-4 flex flex-col items-end space-y-2">
                  <Link
                    href={`/torrent/${torrent.id}/download`}
                    className="inline-flex items-center space-x-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                  >
                    <Download size={16} />
                    <span>{translations.torrent.download}</span>
                  </Link>
                  
                  <div className="text-xs text-text-secondary text-right">
                    <div>{torrent.completed} {translations.torrent.completed}</div>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8">
            <div className="text-text-secondary">{translations.noResults}</div>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-3 py-2 border border-border rounded-lg bg-background text-text hover:bg-surface disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {translations.pagination.previous}
            </button>
            
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const page = i + 1;
              return (
                <button
                  key={page}
                  onClick={() => handlePageChange(page)}
                  className={`px-3 py-2 border rounded-lg transition-colors ${
                    currentPage === page
                      ? 'bg-primary text-white border-primary'
                      : 'border-border bg-background text-text hover:bg-surface'
                  }`}
                >
                  {page}
                </button>
              );
            })}
            
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-3 py-2 border border-border rounded-lg bg-background text-text hover:bg-surface disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {translations.pagination.next}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
