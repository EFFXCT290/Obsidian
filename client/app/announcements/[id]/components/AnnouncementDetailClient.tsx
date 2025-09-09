'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ArrowToLeft, Pin, Calendar, User } from '@styled-icons/boxicons-regular';
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

interface AnnouncementDetailClientProps {
  announcementId: string;
  translations: {
    title: string;
    backToAnnouncements: string;
    createdBy: string;
    createdAt: string;
    updatedAt: string;
    notFound: string;
    error: string;
    loading: string;
  };
}

export default function AnnouncementDetailClient({ announcementId, translations }: AnnouncementDetailClientProps) {
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Format date to relative time
  // const formatRelativeTime = (dateString: string): string => {
  //   const date = new Date(dateString);
  //   const now = new Date();
  //   const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  //   
  //   if (diffInSeconds < 60) return 'Just now';
  //   if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  //   if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  //   if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  //   
  //   return date.toLocaleDateString();
  // };

  // Format date to full format
  const formatFullDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Fetch announcement details
  const fetchAnnouncement = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`${API_BASE_URL}/announcements/${announcementId}`);
      
      if (response.status === 404) {
        setError(translations.notFound);
        return;
      }
      
      if (!response.ok) {
        throw new Error('Failed to fetch announcement');
      }
      
      const data = await response.json();
      setAnnouncement(data);
    } catch (err) {
      console.error('Error fetching announcement:', err);
      setError(translations.error);
    } finally {
      setLoading(false);
    }
  }, [announcementId, translations.notFound, translations.error]);

  useEffect(() => {
    fetchAnnouncement();
  }, [announcementId, fetchAnnouncement]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-text-secondary">{translations.loading}</div>
      </div>
    );
  }

  if (error || !announcement) {
    return (
      <div className="space-y-6">
        <div className="bg-surface rounded-lg border border-border p-8 text-center">
          <h2 className="text-xl font-semibold text-text mb-4">{error || translations.notFound}</h2>
          <Link 
            href="/announcements"
            className="inline-flex items-center space-x-2 text-primary hover:text-primary/80 transition-colors"
          >
            <ArrowToLeft size={16} />
            <span>{translations.backToAnnouncements}</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <div>
        <Link 
          href="/announcements"
          className="inline-flex items-center space-x-2 text-text-secondary hover:text-primary transition-colors"
        >
          <ArrowToLeft size={16} />
          <span>{translations.backToAnnouncements}</span>
        </Link>
      </div>

      {/* Announcement Content */}
      <div className="bg-surface rounded-lg border border-border p-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-start justify-between mb-4">
            <h1 className="text-3xl font-bold text-text pr-4">{announcement.title}</h1>
            {announcement.pinned && (
              <div className="flex items-center space-x-1 text-primary bg-primary/10 px-3 py-1 rounded-full">
                <Pin size={16} />
                <span className="text-sm font-medium">Pinned</span>
              </div>
            )}
          </div>
          
          {/* Metadata */}
          <div className="flex items-center space-x-6 text-sm text-text-secondary">
            <div className="flex items-center space-x-1">
              <User size={14} />
              <span>{translations.createdBy}: <span className="font-medium text-text">{announcement.createdBy.username}</span></span>
            </div>
            <div className="flex items-center space-x-1">
              <Calendar size={14} />
              <span>{translations.createdAt}: <span className="font-medium text-text">{formatFullDate(announcement.createdAt)}</span></span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="prose prose-invert max-w-none">
          <div className="text-text-secondary whitespace-pre-wrap leading-relaxed">
            {announcement.body}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-border">
          <div className="flex items-center justify-between text-sm text-text-secondary">
            <div>
              {translations.updatedAt}: {formatFullDate(announcement.updatedAt)}
            </div>
            <div className="text-xs">
              ID: {announcement.id}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
