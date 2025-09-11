'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
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
  freeleech?: boolean;
  isAnonymous?: boolean;
  uploader: {
    id: string;
    username: string;
  };
  category?: {
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
      title: string;
      seeders: string;
      leechers: string;
      completed: string;
      uploaded: string;
      by: string;
      size: string;
      download: string;
      uploader: string;
      category: string;
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

      const url = `${API_BASE_URL}/torrent/list?${params}&tag=${encodeURIComponent(selectedTag)}`;
      console.log('SearchClient - Fetching URL:', url);
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        console.log('SearchClient - Torrents data:', data);
        console.log('SearchClient - First torrent category:', data.torrents?.[0]?.category);
        setTorrents(data.torrents || []);
        setTotal(data.total || 0);
      } else {
        console.error('SearchClient - Response not ok:', response.status, response.statusText);
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

      const url = `${API_BASE_URL}/torrent/list?${params}`;
      console.log('SearchClient - Text search URL:', url);
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        console.log('SearchClient - Text search data:', data);
        console.log('SearchClient - First torrent category:', data.torrents?.[0]?.category);
        setTorrents(data.torrents || []);
        setTotal(data.total || 0);
      } else {
        console.error('SearchClient - Text search response not ok:', response.status, response.statusText);
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
                <span className="text-sm font-medium text-text">Búsqueda: &quot;{searchQuery}&quot;</span>
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
      <div className="bg-surface rounded-lg border border-border p-6">
        {torrents.length > 0 ? (
          <>
            {/* Table */}
            <div className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-border">
                  <thead className="bg-surface-secondary">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                        {translations.torrent.title || 'Title'}
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                        {translations.torrent.category}
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                        {translations.torrent.uploaded}
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                        {translations.torrent.size}
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-text-secondary uppercase tracking-wider">
                        {translations.torrent.seeders} / {translations.torrent.leechers}
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                        {translations.torrent.completed}
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                        {translations.torrent.uploader}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {torrents.map((torrent) => (
                      <tr key={torrent.id} className="hover:bg-surface-secondary/50">
                        <td className="px-4 py-3 min-w-0 w-2/5">
                          <div className="flex items-center gap-2">
                            <Link 
                              href={`/torrent/${torrent.id}`}
                              className="text-primary hover:text-primary-hover font-medium block truncate"
                              title={torrent.name}
                            >
                              {torrent.name.length > 80 ? `${torrent.name.substring(0, 80)}...` : torrent.name}
                            </Link>
                            {torrent.freeleech && (
                              <span className="bg-green-500/10 text-green-500 px-2 py-1 rounded text-xs font-medium border border-green-500/20 flex-shrink-0">
                                FL
                              </span>
                            )}
                          </div>
                          {/* Tags */}
                          {torrent.tags && torrent.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {torrent.tags.slice(0, 3).map((tag) => (
                                <Link
                                  key={tag}
                                  href={`/search?tag=${encodeURIComponent(tag)}`}
                                  className="text-xs px-1 py-0.5 bg-primary/10 text-primary rounded hover:bg-primary/20 transition-colors"
                                >
                                  {tag}
                                </Link>
                              ))}
                              {torrent.tags.length > 3 && (
                                <span className="text-xs text-text-secondary">
                                  +{torrent.tags.length - 3}
                                </span>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-text-secondary text-sm w-32">
                          {torrent.category ? (
                            <Link 
                              href={`/category/${encodeURIComponent(torrent.category.name)}/torrents`}
                              className="text-primary hover:text-primary-hover transition-colors"
                            >
                              {torrent.category.name}
                            </Link>
                          ) : (
                            <span className="text-red-500">No category</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-text-secondary text-sm w-24">
                          {formatRelativeTime(torrent.createdAt)}
                        </td>
                        <td className="px-4 py-3 text-text-secondary text-sm w-20">
                          {formatBytes(torrent.size)}
                        </td>
                        <td className="px-4 py-3 text-text-secondary text-sm text-center w-24">
                          <span className="text-green-500">{torrent.seeders}</span> / <span className="text-red-500">{torrent.leechers}</span>
                        </td>
                        <td className="px-4 py-3 text-text-secondary text-sm w-20">
                          {torrent.completed}
                        </td>
                        <td className="px-4 py-3 text-text-secondary text-sm w-32">
                          {torrent.isAnonymous ? (
                            <span className="text-text-secondary">Anónimo</span>
                          ) : (
                            <Link
                              href={`/user/${torrent.uploader.id}`}
                              className="text-primary hover:text-primary-hover transition-colors"
                            >
                              {torrent.uploader.username}
                            </Link>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-12">
            <SearchIcon size={48} className="mx-auto text-text-secondary mb-4" />
            <h3 className="text-lg font-semibold text-text mb-2">{translations.noResults}</h3>
            <p className="text-text-secondary">
              {searchQuery ? `No se encontraron resultados para "${searchQuery}"` : 'Intenta ajustar tus criterios de búsqueda'}
            </p>
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
