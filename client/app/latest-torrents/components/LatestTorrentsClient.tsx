'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from '@styled-icons/boxicons-regular';
import { API_BASE_URL } from '@/lib/api';

interface Torrent {
  id: string;
  name: string;
  description: string;
  size: number;
  createdAt: string;
  freeleech?: boolean;
  isAnonymous?: boolean;
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

interface TorrentsResponse {
  torrents: Torrent[];
  total: number;
  page: number;
  limit: number;
}

interface LatestTorrentsClientProps {
  translations: {
    title: string;
    subtitle: string;
    noTorrents: string;
    size: string;
    uploader: string;
    category: string;
    seeders: string;
    leechers: string;
    completed: string;
    uploaded: string;
    previous: string;
    next: string;
    page: string;
    of: string;
    torrent: {
      title: string;
      size: string;
      category: string;
      date: string;
      seeders: string;
      leechers: string;
      completed: string;
    };
  };
}

export default function LatestTorrentsClient({ translations }: LatestTorrentsClientProps) {
  const [torrents, setTorrents] = useState<Torrent[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const limit = 20; // Show 20 torrents per page

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
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/torrent/list?page=${page}&limit=${limit}&status=approved&sort=createdAt&order=desc`);
      if (response.ok) {
        const data: TorrentsResponse = await response.json();
        setTorrents(data.torrents);
        setTotal(data.total);
      }
    } catch (error) {
      console.error('Failed to fetch torrents:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load data on component mount and page changes
  useEffect(() => {
    fetchTorrents(currentPage);
  }, [currentPage]);

  const totalPages = Math.ceil(total / limit);

  if (loading && torrents.length === 0) {
    return (
      <div className="bg-surface rounded-lg border border-border p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-text-secondary/10 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="h-16 bg-text-secondary/10 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-surface rounded-lg border border-border">
      {torrents.length === 0 ? (
        <div className="p-8 text-center">
          <p className="text-text-secondary">{translations.noTorrents}</p>
        </div>
      ) : (
        <>
          {/* Table */}
          <div className="overflow-hidden">
            <div className="overflow-x-auto min-w-full">
              <table className="min-w-full divide-y divide-border">
                <thead className="bg-surface-secondary">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider w-2/5">
                      {translations.torrent.title}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider w-24">
                      {translations.torrent.category}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider w-20">
                      {translations.torrent.date}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider w-20">
                      {translations.torrent.size}
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-text-secondary uppercase tracking-wider w-24">
                      {translations.torrent.seeders} / {translations.torrent.leechers}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider w-20">
                      {translations.torrent.completed}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider w-32">
                      {translations.uploader}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {torrents.map((torrent) => (
                    <tr key={torrent.id} className="hover:bg-surface-secondary/50">
                      <td className="px-6 py-4 min-w-0 w-2/5">
                        <Link 
                          href={`/torrent/${torrent.id}`}
                          className="text-primary hover:text-primary-hover font-medium block truncate"
                          title={torrent.name}
                        >
                          {torrent.name.length > 80 ? `${torrent.name.substring(0, 80)}...` : torrent.name}
                        </Link>
                      </td>
                      <td className="px-6 py-4 text-text-secondary text-sm w-32">
                        <Link 
                          href={`/category/${encodeURIComponent(torrent.category.name)}/torrents`}
                          className="text-primary hover:text-primary-hover transition-colors"
                        >
                          {torrent.category.name}
                        </Link>
                      </td>
                      <td className="px-6 py-4 text-text-secondary text-sm w-24">
                        {formatRelativeTime(torrent.createdAt)}
                      </td>
                      <td className="px-6 py-4 text-text-secondary text-sm w-20">
                        {formatBytes(torrent.size)}
                      </td>
                      <td className="px-6 py-4 text-text-secondary text-sm text-center w-24">
                        <span className="text-green-500">{torrent.seeders}</span> / <span className="text-red-500">{torrent.leechers}</span>
                      </td>
                      <td className="px-6 py-4 text-text-secondary text-sm w-20">
                        {torrent.completed}
                      </td>
                      <td className="px-6 py-4 text-text-secondary text-sm w-32">
                        {torrent.isAnonymous ? (
                          <span className="text-text-secondary">Anónimo</span>
                        ) : (
                          <Link 
                            href={`/user/${encodeURIComponent(torrent.uploader.username)}`}
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
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-border bg-surface-secondary">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1 || loading}
                className="flex items-center px-4 py-2 text-sm text-text-secondary hover:text-text disabled:opacity-50 disabled:cursor-not-allowed bg-background border border-border rounded-lg hover:bg-surface transition-colors"
              >
                <ChevronLeft size={16} className="mr-1" />
                {translations.previous}
              </button>
              
              <span className="text-sm text-text-secondary">
                {translations.page} {currentPage} {translations.of} {totalPages}
              </span>
              
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages || loading}
                className="flex items-center px-4 py-2 text-sm text-text-secondary hover:text-text disabled:opacity-50 disabled:cursor-not-allowed bg-background border border-border rounded-lg hover:bg-surface transition-colors"
              >
                {translations.next}
                <ChevronRight size={16} className="ml-1" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
