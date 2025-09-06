'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, Tag, Folder, ArrowToRight, User, Download, Time } from '@styled-icons/boxicons-regular';
import { API_BASE_URL } from '@/lib/api';

interface Category {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  order?: number;
  parentId?: string;
  children: Category[];
  torrents?: Torrent[];
}

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
}

interface Source {
  id: string;
  name: string;
  isActive: boolean;
  count?: number; // Number of torrents using this source
}

interface CategoriesClientProps {
  translations: {
    title: string;
    description: string;
    popularTags: string;
    browseCategories: string;
    latestTorrents: string;
    viewAll: string;
    searchPlaceholder: string;
    noTorrents: string;
    seeders: string;
    leechers: string;
    completed: string;
    uploaded: string;
    by: string;
    size: string;
    loading: string;
  };
}

export default function CategoriesClient({ translations }: CategoriesClientProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [popularSources, setPopularSources] = useState<Source[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

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

  // Fetch categories with latest torrents
  const fetchCategories = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/categories`);
      if (response.ok) {
        const categoriesData: Category[] = await response.json();
        
        // Fetch latest torrents for each category
        const categoriesWithTorrents = await Promise.all(
          categoriesData.map(async (category) => {
            try {
              const torrentsResponse = await fetch(`${API_BASE_URL}/category/${category.name}/torrents?limit=3`);
              if (torrentsResponse.ok) {
                const torrentsData = await torrentsResponse.json();
                return { ...category, torrents: torrentsData.torrents || [] };
              }
            } catch (error) {
              console.error(`Error fetching torrents for category ${category.name}:`, error);
            }
            return { ...category, torrents: [] };
          })
        );
        
        setCategories(categoriesWithTorrents);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  // Fetch popular tags with real usage counts
  const fetchPopularSources = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/tags/popular`);
      if (response.ok) {
        const tagsData: { name: string; count: number }[] = await response.json();
        const sourcesWithCounts: Source[] = tagsData.map(tag => ({
          id: tag.name,
          name: tag.name,
          isActive: true,
          count: tag.count
        }));
        setPopularSources(sourcesWithCounts);
      } else {
        // Fallback to static list if API fails
        const staticSources: Source[] = [
          { id: '1', name: 'BluRay', isActive: true, count: 150 },
          { id: '2', name: 'WebDL', isActive: true, count: 120 },
          { id: '3', name: 'FLAC', isActive: true, count: 100 },
          { id: '4', name: 'MP3', isActive: true, count: 90 },
          { id: '5', name: 'PDF', isActive: true, count: 80 },
          { id: '6', name: 'EPUB', isActive: true, count: 70 },
          { id: '7', name: 'ISO', isActive: true, count: 60 },
          { id: '8', name: 'HDRip', isActive: true, count: 50 },
          { id: '9', name: 'AAC', isActive: true, count: 40 },
          { id: '10', name: 'MOBI', isActive: true, count: 30 },
        ];
        setPopularSources(staticSources);
      }
    } catch (error) {
      console.error('Error fetching popular tags:', error);
      // Fallback to static list on error
      const staticSources: Source[] = [
        { id: '1', name: 'BluRay', isActive: true, count: 150 },
        { id: '2', name: 'WebDL', isActive: true, count: 120 },
        { id: '3', name: 'FLAC', isActive: true, count: 100 },
        { id: '4', name: 'MP3', isActive: true, count: 90 },
        { id: '5', name: 'PDF', isActive: true, count: 80 },
        { id: '6', name: 'EPUB', isActive: true, count: 70 },
        { id: '7', name: 'ISO', isActive: true, count: 60 },
        { id: '8', name: 'HDRip', isActive: true, count: 50 },
        { id: '9', name: 'AAC', isActive: true, count: 40 },
        { id: '10', name: 'MOBI', isActive: true, count: 30 },
      ];
      setPopularSources(staticSources);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([
        fetchCategories(),
        fetchPopularSources()
      ]);
      setLoading(false);
    };
    loadData();
  }, []);

  // Filter categories based on search query
  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    category.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    category.children.some(child => 
      child.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-text-secondary">{translations.loading}</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Search Bar */}
      <div className="bg-surface rounded-lg border border-border p-6">
        <div className="relative">
          <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-secondary" />
          <input
            type="text"
            placeholder={translations.searchPlaceholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-border rounded-lg bg-background text-text focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>
      </div>

      {/* Popular Tags Section */}
      <div className="bg-surface rounded-lg border border-border p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Tag size={20} className="text-primary" />
          <h2 className="text-xl font-semibold text-text">{translations.popularTags}</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          {popularSources.map((source) => (
            <Link
              key={source.id}
              href={`/search?tag=${encodeURIComponent(source.name)}`}
              className="inline-flex items-center space-x-1 px-3 py-1 bg-primary/10 text-primary rounded-full hover:bg-primary/20 transition-colors"
            >
              <span className="text-sm font-medium">{source.name}</span>
              <span className="text-xs text-primary/70">({source.count})</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Categories Grid */}
      <div className="bg-surface rounded-lg border border-border p-6">
        <div className="flex items-center space-x-2 mb-6">
          <Folder size={20} className="text-primary" />
          <h2 className="text-xl font-semibold text-text">{translations.browseCategories}</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCategories.map((category) => (
            <div key={category.id} className="bg-background rounded-lg border border-border p-6 hover:border-primary/50 transition-colors">
              {/* Category Header */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-semibold text-text">{category.name}</h3>
                  <Link
                    href={`/category/${category.name}/torrents`}
                    className="text-primary hover:text-primary/80 transition-colors"
                  >
                    <ArrowToRight size={16} />
                  </Link>
                </div>
                {category.description && (
                  <p className="text-sm text-text-secondary">{category.description}</p>
                )}
              </div>

              {/* Subcategories */}
              {category.children.length > 0 && (
                <div className="mb-4">
                  <div className="flex flex-wrap gap-1">
                    {category.children.slice(0, 3).map((child) => (
                      <Link
                        key={child.id}
                        href={`/category/${child.name}/torrents`}
                        className="text-xs px-2 py-1 bg-surface-light text-text-secondary rounded hover:text-primary transition-colors"
                      >
                        {child.name}
                      </Link>
                    ))}
                    {category.children.length > 3 && (
                      <span className="text-xs text-text-secondary">
                        +{category.children.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Latest Torrents Preview */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-text-secondary">{translations.latestTorrents}</h4>
                {category.torrents && category.torrents.length > 0 ? (
                  <div className="space-y-2">
                    {category.torrents.map((torrent) => (
                      <div key={torrent.id} className="text-xs">
                        <Link
                          href={`/torrent/${torrent.id}`}
                          className="block text-text hover:text-primary transition-colors truncate"
                          title={torrent.name}
                        >
                          {torrent.name}
                        </Link>
                        <div className="flex items-center space-x-2 text-text-secondary mt-1">
                          <div className="flex items-center space-x-1">
                            <User size={10} />
                            <span>{torrent.seeders}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Download size={10} />
                            <span>{torrent.leechers}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Time size={10} />
                            <span>{formatRelativeTime(torrent.createdAt)}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-xs text-text-secondary">{translations.noTorrents}</div>
                )}
              </div>

              {/* View All Button */}
              <div className="mt-4 pt-4 border-t border-border">
                <Link
                  href={`/category/${category.name}/torrents`}
                  className="inline-flex items-center space-x-1 text-sm text-primary hover:text-primary/80 transition-colors"
                >
                  <span>{translations.viewAll}</span>
                  <ArrowToRight size={12} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
