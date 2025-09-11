'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Download, User, Calendar, Tag } from '@styled-icons/boxicons-regular';
import { API_BASE_URL } from '@/lib/api';

interface Torrent {
  id: string;
  name: string;
  description: string;
  size: number;
  createdAt: string;
  freeleech?: boolean;
  uploader: {
    id: string;
    username: string;
    role: string;
  };
  category: {
    id: string;
    name: string;
  };
  seeders: number;
  leechers: number;
  completed: number;
}

interface Announcement {
  id: string;
  title: string;
  content: string;
  pinned: boolean;
  visible: boolean;
  createdAt: string;
  createdBy: {
    id: string;
    username: string;
    role: string;
  };
}

interface TorrentsResponse {
  torrents: Torrent[];
  total: number;
  page: number;
  limit: number;
}

interface AnnouncementsResponse {
  announcements: Announcement[];
  total: number;
  page: number;
  limit: number;
}

interface DashboardClientProps {
  translations: {
    latestTorrents: string;
    pinnedAnnouncements: string;
    viewAll: string;
    noTorrents: string;
    noAnnouncements: string;
    size: string;
    uploader: string;
    category: string;
    seeders: string;
    leechers: string;
    completed: string;
    uploaded: string;
    by: string;
    previous: string;
    next: string;
    page: string;
    of: string;
  };
}

export default function DashboardClient({ translations }: DashboardClientProps) {
  const [torrents, setTorrents] = useState<Torrent[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [torrentsPage, setTorrentsPage] = useState(1);
  const [torrentsTotal, setTorrentsTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const torrentsLimit = 2; // Show 2 torrents per page for dashboard
  const announcementsLimit = 1; // Show only 1 pinned announcement

  // Format bytes to human readable format
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
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

  // Fetch latest torrents
  const fetchTorrents = async (page: number) => {
    try {
      const response = await fetch(`${API_BASE_URL}/torrent/list?page=${page}&limit=${torrentsLimit}&status=approved`);
      if (response.ok) {
        const data: TorrentsResponse = await response.json();
        setTorrents(data.torrents);
        setTorrentsTotal(data.total);
      }
    } catch (error) {
      console.error('Failed to fetch torrents:', error);
    }
  };

  // Fetch pinned announcements
  const fetchAnnouncements = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/announcements?page=1&limit=${announcementsLimit}&pinned=true&visible=true`);
      if (response.ok) {
        const data: AnnouncementsResponse = await response.json();
        setAnnouncements(data.announcements);
      }
    } catch (error) {
      console.error('Failed to fetch announcements:', error);
    }
  };

  // Load data on component mount and page changes
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([
        fetchTorrents(torrentsPage),
        fetchAnnouncements()
      ]);
      setLoading(false);
    };
    loadData();
  }, [torrentsPage]);

  const torrentsTotalPages = Math.ceil(torrentsTotal / torrentsLimit);

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Pinned Announcements Skeleton */}
        <div className="bg-surface rounded-lg border border-border p-6 mt-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-text">{translations.pinnedAnnouncements}</h2>
            <div className="h-8 w-20 bg-text-secondary rounded animate-pulse"></div>
          </div>
          <div className="space-y-3">
            <div className="p-4 border border-border rounded-lg animate-pulse">
              <div className="h-4 bg-text-secondary rounded w-2/3 mb-2"></div>
              <div className="h-3 bg-text-secondary rounded w-1/3"></div>
            </div>
          </div>
        </div>

        {/* Latest Torrents Skeleton */}
        <div className="bg-surface rounded-lg border border-border p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-text">{translations.latestTorrents}</h2>
            <div className="h-8 w-20 bg-text-secondary rounded animate-pulse"></div>
          </div>
          <div className="space-y-3">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="p-4 border border-border rounded-lg animate-pulse">
                <div className="h-4 bg-text-secondary rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-text-secondary rounded w-1/2 mb-2"></div>
                <div className="flex space-x-4">
                  <div className="h-3 bg-text-secondary rounded w-16"></div>
                  <div className="h-3 bg-text-secondary rounded w-20"></div>
                  <div className="h-3 bg-text-secondary rounded w-12"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Pinned Announcements */}
      <div className="bg-surface rounded-lg border border-border p-6 mt-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-text">{translations.pinnedAnnouncements}</h2>
          <Link 
            href="/announcements"
            className="text-primary hover:text-primary-dark transition-colors text-sm font-medium"
          >
            {translations.viewAll} →
          </Link>
        </div>
        
        {announcements.length === 0 ? (
          <p className="text-text-secondary text-center py-8">{translations.noAnnouncements}</p>
        ) : (
          <div className="space-y-3">
            {announcements.map((announcement) => (
              <Link 
                key={announcement.id}
                href={`/announcements/${announcement.id}`}
                className="block p-4 border border-border rounded-lg hover:bg-accent-background transition-colors cursor-pointer"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-text hover:text-primary transition-colors font-medium line-clamp-2">
                      {announcement.title}
                    </h3>
                    <p className="text-text-secondary text-sm mt-1 line-clamp-2">
                      {announcement.content}
                    </p>
                    <div className="flex items-center mt-2 text-sm text-text-secondary">
                      <span className="flex items-center">
                        <User size={14} className="mr-1" />
                        {translations.by} {announcement.createdBy.username}
                      </span>
                      <span className="mx-2">•</span>
                      <span className="flex items-center">
                        <Calendar size={14} className="mr-1" />
                        {formatRelativeTime(announcement.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Latest Torrents */}
      <div className="bg-surface rounded-lg border border-border p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-text">{translations.latestTorrents}</h2>
          <Link 
            href="/torrent"
            className="text-primary hover:text-primary-dark transition-colors text-sm font-medium"
          >
            {translations.viewAll} →
          </Link>
        </div>
        
        {torrents.length === 0 ? (
          <p className="text-text-secondary text-center py-8">{translations.noTorrents}</p>
        ) : (
          <>
            <div className="space-y-3">
              {torrents.map((torrent) => (
                <Link 
                  key={torrent.id}
                  href={`/torrent/${torrent.id}`}
                  className="block p-4 border border-border rounded-lg hover:bg-accent-background transition-colors cursor-pointer"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-text hover:text-primary transition-colors font-medium line-clamp-2">
                          {torrent.name}
                        </h3>
                        {torrent.freeleech && (
                          <span className="bg-green-500/10 text-green-500 px-2 py-1 rounded text-sm font-medium border border-green-500/20">
                            FL
                          </span>
                        )}
                      </div>
                      <div className="flex items-center space-x-4 mt-2 text-sm text-text-secondary">
                        <span className="flex items-center">
                          <Download size={14} className="mr-1" />
                          {formatBytes(torrent.size)}
                        </span>
                        <span className="flex items-center">
                          <User size={14} className="mr-1" />
                          {torrent.uploader.username}
                        </span>
                        <span className="flex items-center">
                          <Tag size={14} className="mr-1" />
                          {torrent.category.name}
                        </span>
                        <span className="flex items-center">
                          <Calendar size={14} className="mr-1" />
                          {formatRelativeTime(torrent.createdAt)}
                        </span>
                      </div>
                      <div className="flex items-center space-x-4 mt-2 text-sm text-text-secondary">
                        <span>{translations.seeders}: {torrent.seeders}</span>
                        <span>{translations.leechers}: {torrent.leechers}</span>
                        <span>{translations.completed}: {torrent.completed}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
            
            {/* Pagination for torrents */}
            {torrentsTotalPages > 1 && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
                <button
                  onClick={() => setTorrentsPage(prev => Math.max(1, prev - 1))}
                  disabled={torrentsPage === 1}
                  className="flex items-center px-3 py-2 text-sm text-text-secondary hover:text-text disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft size={16} className="mr-1" />
                  {translations.previous}
                </button>
                
                <span className="text-sm text-text-secondary">
                  {translations.page} {torrentsPage} {translations.of} {torrentsTotalPages}
                </span>
                
                <button
                  onClick={() => setTorrentsPage(prev => Math.min(torrentsTotalPages, prev + 1))}
                  disabled={torrentsPage === torrentsTotalPages}
                  className="flex items-center px-3 py-2 text-sm text-text-secondary hover:text-text disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {translations.next}
                  <ChevronRight size={16} className="ml-1" />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
