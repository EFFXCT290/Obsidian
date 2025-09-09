'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Pin, Calendar, User } from '@styled-icons/boxicons-regular';
import { API_BASE_URL } from '@/lib/api';

interface Announcement {
  id: string;
  title: string;
  body: string;
  pinned: boolean;
  visible: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: {
    id: string;
    username: string;
    role: string;
  };
}

interface AnnouncementsResponse {
  announcements: Announcement[];
  total: number;
  page: number;
  limit: number;
}

interface AnnouncementsClientProps {
  translations: {
    title: string;
    description: string;
    pinnedAnnouncements: string;
    allAnnouncements: string;
    noAnnouncements: string;
    createdBy: string;
    createdAt: string;
    updatedAt: string;
    previous: string;
    next: string;
    page: string;
    of: string;
    loading: string;
  };
}

export default function AnnouncementsClient({ translations }: AnnouncementsClientProps) {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [pinnedAnnouncements, setPinnedAnnouncements] = useState<Announcement[]>([]);

  const limit = 10; // Show 10 announcements per page

  // Truncate text to specified length
  const truncateText = (text: string, maxLength: number = 255): string => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + '...';
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

  // Fetch pinned announcements
  const fetchPinnedAnnouncements = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/announcements?pinned=true&visible=true&limit=5`);
      if (response.ok) {
        const data: AnnouncementsResponse = await response.json();
        setPinnedAnnouncements(data.announcements);
      }
    } catch (error) {
      console.error('Failed to fetch pinned announcements:', error);
    }
  };

  // Fetch all announcements
  const fetchAnnouncements = async (page: number) => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/announcements?page=${page}&limit=${limit}&visible=true`);
      if (response.ok) {
        const data: AnnouncementsResponse = await response.json();
        setAnnouncements(data.announcements);
        setTotal(data.total);
        setTotalPages(Math.ceil(data.total / limit));
      }
    } catch (error) {
      console.error('Failed to fetch announcements:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load data on component mount and page changes
  useEffect(() => {
    const loadData = async () => {
      await Promise.all([
        fetchPinnedAnnouncements(),
        fetchAnnouncements(currentPage)
      ]);
    };
    loadData();
  }, [currentPage]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  if (loading && announcements.length === 0) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-text-secondary">{translations.loading}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Pinned Announcements Section */}
      {pinnedAnnouncements.length > 0 && (
        <div className="bg-surface rounded-lg border border-border p-6">
          <div className="flex items-center space-x-2 mb-4">
            <Pin size={20} className="text-primary" />
            <h2 className="text-xl font-semibold text-text">{translations.pinnedAnnouncements}</h2>
          </div>
          <div className="space-y-4">
            {pinnedAnnouncements.map((announcement) => (
              <div key={announcement.id} className="p-4 border border-border rounded-lg bg-primary/5">
                <div className="flex items-start justify-between mb-2">
                  <Link 
                    href={`/announcements/${announcement.id}`}
                    className="text-lg font-semibold text-text hover:text-primary transition-colors"
                  >
                    {announcement.title}
                  </Link>
                  <div className="flex items-center space-x-1 text-primary">
                    <Pin size={16} />
                    <span className="text-sm font-medium">Pinned</span>
                  </div>
                </div>
                <div className="text-text-secondary mb-3 whitespace-pre-wrap">
                  {truncateText(announcement.body)}
                </div>
                <div className="flex items-center justify-between text-sm text-text-secondary">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-1">
                      <User size={14} />
                      <span>{translations.createdBy}: {announcement.createdBy.username}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Calendar size={14} />
                      <span>{formatRelativeTime(announcement.createdAt)}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All Announcements Section */}
      <div className="bg-surface rounded-lg border border-border p-6">
        <h2 className="text-xl font-semibold text-text mb-4">{translations.allAnnouncements}</h2>
        
        {announcements.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-text-secondary">{translations.noAnnouncements}</div>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {announcements.map((announcement) => (
                <div key={announcement.id} className="p-4 border border-border rounded-lg hover:bg-surface-light transition-colors">
                  <div className="flex items-start justify-between mb-2">
                    <Link 
                      href={`/announcements/${announcement.id}`}
                      className="text-lg font-semibold text-text hover:text-primary transition-colors"
                    >
                      {announcement.title}
                    </Link>
                    {announcement.pinned && (
                      <div className="flex items-center space-x-1 text-primary">
                        <Pin size={16} />
                        <span className="text-sm font-medium">Pinned</span>
                      </div>
                    )}
                  </div>
                  <div className="text-text-secondary mb-3 whitespace-pre-wrap">
                    {truncateText(announcement.body)}
                  </div>
                  <div className="flex items-center justify-between text-sm text-text-secondary">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-1">
                        <User size={14} />
                        <span>{translations.createdBy}: {announcement.createdBy.username}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Calendar size={14} />
                        <span>{formatRelativeTime(announcement.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6 pt-4 border-t border-border">
                <div className="text-sm text-text-secondary">
                  {translations.page} {currentPage} {translations.of} {totalPages} ({total} announcements)
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-3 py-1 text-sm border border-border rounded hover:bg-surface-light disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {translations.previous}
                  </button>
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 text-sm border border-border rounded hover:bg-surface-light disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {translations.next}
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
