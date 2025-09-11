'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  Download, 
  User, 
  Time, 
  ChevronRight, 
  Filter,
  SortUp
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
  uploader: {
    id: string;
    username: string;
  };
  category: {
    id: string;
    name: string;
  };
}

interface Category {
  id: string;
  name: string;
  description?: string;
  parent?: {
    id: string;
    name: string;
  };
  children: Category[];
}

interface Source {
  id: string;
  name: string;
  isActive: boolean;
}

interface CategoryTorrentsClientProps {
  categoryName: string;
  searchParams: {
    page?: string;
    source?: string;
    sort?: string;
  };
  translations: {
    title: string;
    description: string;
    breadcrumbHome: string;
    breadcrumbCategories: string;
    noTorrents: string;
    loading: string;
    filters: {
      allSources: string;
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

export default function CategoryTorrentsClient({ 
  categoryName, 
  searchParams, 
  translations 
}: CategoryTorrentsClientProps) {
  const router = useRouter();
  const urlSearchParams = useSearchParams();
  
  const [category, setCategory] = useState<Category | null>(null);
  const [torrents, setTorrents] = useState<Torrent[]>([]);
  const [sources, setSources] = useState<Source[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedSource, setSelectedSource] = useState(searchParams.source || '');
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

  // Fetch category information
  const fetchCategory = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/categories`);
      if (response.ok) {
        const categories: Category[] = await response.json();
        const foundCategory = categories.find(cat => 
          cat.name === categoryName || 
          cat.children.some(child => child.name === categoryName)
        );
        
        if (foundCategory) {
          // If it's a subcategory, find the specific subcategory
          const subcategory = foundCategory.children.find(child => child.name === categoryName);
          if (subcategory) {
            setCategory({ ...subcategory, parent: foundCategory });
          } else {
            setCategory(foundCategory);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching category:', error);
    }
  }, [categoryName]);

  // Fetch torrents for the category
  const fetchTorrents = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: limit.toString(),
        ...(selectedSource && { source: selectedSource }),
        ...(selectedSort && { sort: selectedSort }),
      });

      const response = await fetch(`${API_BASE_URL}/category/${encodeURIComponent(categoryName)}/torrents?${params}`);
      if (response.ok) {
        const data = await response.json();
        setTorrents(data.torrents || []);
        setTotal(data.total || 0);
      }
    } catch (error) {
      console.error('Error fetching torrents:', error);
    }
  }, [categoryName, currentPage, selectedSource, selectedSort]);

  // Fetch available sources for the category
  const fetchSources = useCallback(async () => {
    if (!category) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/category/${category.id}/sources`);
      if (response.ok) {
        const data = await response.json();
        const allSources = [...data.own, ...data.inherited];
        setSources(allSources);
      }
    } catch (error) {
      console.error('Error fetching sources:', error);
    }
  }, [category]);

  // Update URL when filters change
  const updateURL = (newParams: { source?: string; sort?: string; page?: number }) => {
    const params = new URLSearchParams(urlSearchParams);
    
    if (newParams.source !== undefined) {
      if (newParams.source) {
        params.set('source', newParams.source);
      } else {
        params.delete('source');
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
    router.push(`/category/${encodeURIComponent(categoryName)}/torrents${newURL}`);
  };

  // Handle filter changes
  const handleSourceChange = (source: string) => {
    setSelectedSource(source);
    setCurrentPage(1);
    updateURL({ source, page: 1 });
  };

  const handleSortChange = (sort: string) => {
    setSelectedSort(sort);
    setCurrentPage(1);
    updateURL({ sort, page: 1 });
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    updateURL({ page });
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await fetchCategory();
      setLoading(false);
    };
    loadData();
  }, [categoryName, fetchCategory]);

  useEffect(() => {
    if (category) {
      fetchSources();
    }
  }, [category, fetchSources]);

  useEffect(() => {
    if (category) {
      fetchTorrents();
    }
  }, [category, currentPage, selectedSource, selectedSort, fetchTorrents]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-text-secondary">{translations.loading}</div>
      </div>
    );
  }

  if (!category) {
    return (
      <div className="text-center py-8">
        <div className="text-text-secondary">{translations.noTorrents}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 mt-6">
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center space-x-2 text-sm">
        <Link 
          href="/dashboard" 
          className="text-primary hover:text-primary/80 transition-colors"
        >
          {translations.breadcrumbHome}
        </Link>
        <ChevronRight size={16} className="text-text-secondary" />
        <Link 
          href="/categories" 
          className="text-primary hover:text-primary/80 transition-colors"
        >
          {translations.breadcrumbCategories}
        </Link>
        <ChevronRight size={16} className="text-text-secondary" />
        {category.parent && (
          <>
            <span className="text-text-secondary">{category.parent.name}</span>
            <ChevronRight size={16} className="text-text-secondary" />
          </>
        )}
        <span className="text-text font-medium">{category.name}</span>
      </nav>

      {/* Page Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-text">{category.name}</h1>
        {category.description && (
          <p className="text-text-secondary">{category.description}</p>
        )}
      </div>

      {/* Filters */}
      <div className="bg-surface rounded-lg border border-border p-6">
        <div className="flex flex-wrap gap-4 items-center">
          {/* Source Filter */}
          <div className="flex items-center space-x-2">
            <Filter size={16} className="text-text-secondary" />
            <select
              value={selectedSource}
              onChange={(e) => handleSourceChange(e.target.value)}
              className="px-3 py-2 border border-border rounded-lg bg-background text-text focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="">{translations.filters.allSources}</option>
              {sources.map((source) => (
                <option key={source.id} value={source.name}>
                  {source.name}
                </option>
              ))}
            </select>
          </div>

          {/* Sort Filter */}
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

      {/* Torrents List */}
      <div className="space-y-4">
        {torrents.length > 0 ? (
          torrents.map((torrent) => (
            <div key={torrent.id} className="bg-surface rounded-lg border border-border p-6 hover:border-primary/50 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <Link
                      href={`/torrent/${torrent.id}`}
                      className="text-lg font-semibold text-text hover:text-primary transition-colors"
                    >
                      {torrent.name}
                    </Link>
                    {torrent.freeleech && (
                      <span className="bg-green-500/10 text-green-500 px-2 py-1 rounded text-sm font-medium border border-green-500/20">
                        {translations.freeleech || 'FL'}
                      </span>
                    )}
                  </div>
                  
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
            <div className="text-text-secondary">{translations.noTorrents}</div>
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
