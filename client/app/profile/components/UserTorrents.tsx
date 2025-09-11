'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { useI18n } from '../../hooks/useI18n';
import { API_BASE_URL } from '@/lib/api';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { Edit } from '@styled-icons/boxicons-regular/Edit';
import TorrentEditModal from './TorrentEditModal';

interface UserTorrent {
  id: string;
  name: string;
  size: string;
  createdAt: string;
  seeders: number;
  leechers: number;
  downloads: number;
  isAnonymous: boolean;
  freeleech: boolean;
  category: {
    id: string;
    name: string;
  };
  status: 'approved' | 'pending' | 'rejected';
}

interface UserTorrentsResponse {
  torrents: UserTorrent[];
  total: number;
  page: number;
  limit: number;
}

export default function UserTorrents() {
  const { t } = useI18n();
  const [page, setPage] = useState(1);
  const [editingTorrent, setEditingTorrent] = useState<UserTorrent | null>(null);
  const [updatingTorrents, setUpdatingTorrents] = useState<Set<string>>(new Set());
  const limit = 20;

  const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
  
  const { data, error, isLoading, mutate } = useSWR<UserTorrentsResponse>(
    token ? [`${API_BASE_URL}/user/torrents?page=${page}&limit=${limit}`, token] : null,
    async ([url, _token]) => {
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (_token) headers['Authorization'] = `Bearer ${_token as string}`;
      const res = await fetch(url as string, { headers, cache: 'no-store' });
      if (!res.ok) throw new Error('Failed to fetch user torrents');
      return res.json();
    }
  );

  const formatFileSize = (bytes: string): string => {
    const size = parseInt(bytes);
    if (size === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(size) / Math.log(k));
    
    return parseFloat((size / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const updateTorrent = async (torrentId: string, updates: { isAnonymous?: boolean; freeleech?: boolean }) => {
    if (!token) return;
    
    setUpdatingTorrents(prev => new Set(prev).add(torrentId));
    
    try {
      const response = await fetch(`${API_BASE_URL}/user/torrents/${torrentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updates)
      });

      if (response.ok) {
        toast.success(t('userTorrents.updateSuccess', 'Torrent updated successfully'));
        // Revalidate the data to refresh the list
        mutate();
      } else {
        toast.error(t('userTorrents.updateError', 'Failed to update torrent'));
      }
    } catch (error) {
      console.error('Error updating torrent:', error);
      toast.error(t('userTorrents.updateError', 'Failed to update torrent'));
    } finally {
      setUpdatingTorrents(prev => {
        const newSet = new Set(prev);
        newSet.delete(torrentId);
        return newSet;
      });
    }
  };

  const deleteTorrent = async (torrentId: string) => {
    if (!token) return;
    
    if (!confirm(t('userTorrents.deleteConfirm', 'Are you sure you want to delete this torrent? This action cannot be undone.'))) {
      return;
    }
    
    setUpdatingTorrents(prev => new Set(prev).add(torrentId));
    
    try {
      const response = await fetch(`${API_BASE_URL}/user/torrents/${torrentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        toast.success(t('userTorrents.deleteSuccess', 'Torrent deleted successfully'));
        // Revalidate the data to refresh the list
        mutate();
      } else {
        toast.error(t('userTorrents.deleteError', 'Failed to delete torrent'));
      }
    } catch (error) {
      console.error('Error deleting torrent:', error);
      toast.error(t('userTorrents.deleteError', 'Failed to delete torrent'));
    } finally {
      setUpdatingTorrents(prev => {
        const newSet = new Set(prev);
        newSet.delete(torrentId);
        return newSet;
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const baseClasses = "px-2 py-1 text-xs font-medium rounded-full";
    switch (status) {
      case 'approved':
        return `${baseClasses} bg-green-100 text-green-800`;
      case 'pending':
        return `${baseClasses} bg-yellow-100 text-yellow-800`;
      case 'rejected':
        return `${baseClasses} bg-red-100 text-red-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-text-secondary">{t('userTorrents.loading', 'Loading your torrents...')}</div>
      </div>
    );
  }

  if (error) {
      return (
        <div className="text-center py-8">
          <div className="text-red-500">{t('userTorrents.error', 'Error loading torrents')}</div>
        </div>
      );
  }

  if (!data || data.torrents.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-text-secondary">{t('userTorrents.empty', 'No torrents uploaded yet')}</div>
      </div>
    );
  }

  const totalPages = Math.ceil(data.total / limit);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-text">
          {t('userTorrents.title', 'My Torrents')} ({data.total})
        </h3>
      </div>

      {/* Table */}
      <div className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-surface-secondary">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                  {t('userTorrents.table.title', 'Title')}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                  {t('userTorrents.table.category', 'Category')}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                  {t('userTorrents.table.date', 'Date')}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                  {t('userTorrents.table.size', 'Size')}
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-text-secondary uppercase tracking-wider">
                  {t('userTorrents.table.seedersLeechers', 'Seeders / Leechers')}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                  {t('userTorrents.table.downloads', 'Downloads')}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                  {t('userTorrents.table.status', 'Status')}
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-text-secondary uppercase tracking-wider">
                  {t('userTorrents.table.actions', 'Actions')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data.torrents.map((torrent) => (
                <tr key={torrent.id} className="hover:bg-surface-secondary/50">
                  <td className="px-4 py-3 min-w-0 w-2/5">
                    <Link 
                      href={`/torrent/${torrent.id}`}
                      className="text-primary hover:text-primary-hover font-medium block truncate"
                      title={torrent.name}
                    >
                      {torrent.name.length > 80 ? `${torrent.name.substring(0, 80)}...` : torrent.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-text-secondary text-sm w-32">
                    <Link 
                      href={`/category/${encodeURIComponent(torrent.category.name)}/torrents`}
                      className="text-primary hover:text-primary-hover transition-colors"
                    >
                      {torrent.category.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-text-secondary text-sm w-24">
                    {formatDate(torrent.createdAt)}
                  </td>
                  <td className="px-4 py-3 text-text-secondary text-sm w-20">
                    {formatFileSize(torrent.size)}
                  </td>
                  <td className="px-4 py-3 text-text-secondary text-sm text-center w-24">
                    <span className="text-green-500">{torrent.seeders}</span> / <span className="text-red-500">{torrent.leechers}</span>
                  </td>
                  <td className="px-4 py-3 text-text-secondary text-sm w-20">
                    {torrent.downloads}
                  </td>
                  <td className="px-4 py-3 w-24">
                    <span className={getStatusBadge(torrent.status)}>
                      {t(`userTorrents.status.${torrent.status}`, torrent.status)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center w-16">
                    <button
                      onClick={() => setEditingTorrent(torrent)}
                      disabled={updatingTorrents.has(torrent.id)}
                      className="text-primary hover:text-primary-hover disabled:opacity-50 disabled:cursor-not-allowed p-1"
                      title={t('userTorrents.actions.edit', 'Edit torrent')}
                    >
                      <Edit size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-text-secondary">
            {t('userTorrents.pagination.showing', 'Showing')} {((page - 1) * limit) + 1} {t('userTorrents.pagination.to', 'to')} {Math.min(page * limit, data.total)} {t('userTorrents.pagination.of', 'of')} {data.total} {t('userTorrents.pagination.results', 'results')}
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
              className="px-3 py-1 text-sm border border-border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-surface-secondary"
            >
              {t('userTorrents.pagination.previous', 'Previous')}
            </button>
            <span className="px-3 py-1 text-sm text-text-secondary">
              {t('userTorrents.pagination.page', 'Page')} {page} {t('userTorrents.pagination.of', 'of')} {totalPages}
            </span>
            <button
              onClick={() => setPage(page + 1)}
              disabled={page === totalPages}
              className="px-3 py-1 text-sm border border-border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-surface-secondary"
            >
              {t('userTorrents.pagination.next', 'Next')}
            </button>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      <TorrentEditModal
        torrent={editingTorrent}
        isOpen={editingTorrent !== null}
        onClose={() => setEditingTorrent(null)}
        onUpdate={updateTorrent}
        onDelete={deleteTorrent}
        isUpdating={editingTorrent ? updatingTorrents.has(editingTorrent.id) : false}
      />
    </div>
  );
}
