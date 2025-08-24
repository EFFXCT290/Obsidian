'use client';

import { useState, useEffect, useCallback } from 'react';
import { showNotification } from '@/app/utils/notifications';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Search, Rss, Show, Hide, Refresh } from '@styled-icons/boxicons-regular';
import { API_BASE_URL } from '@/lib/api';
import { useI18n } from '@/app/hooks/useI18n';

interface User {
  id: string;
  username: string;
  email: string;
  role: string;
  status: string;
  createdAt: string;
  emailVerified: boolean;
  rssEnabled?: boolean;
  rssToken?: string;
}

export default function RssManagementClient() {
  const { t } = useI18n();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [processingUser, setProcessingUser] = useState<string | null>(null);
  const [showToken, setShowToken] = useState<{ [userId: string]: boolean }>({});

  // Fetch users
  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20',
        ...(searchQuery && { q: searchQuery })
      });

      const response = await fetch(`${API_BASE_URL}/admin/users?${params}`, { headers, cache: 'no-store' });
      if (!response.ok) throw new Error('Failed to fetch users');
      
      const data = await response.json();
      setUsers(data.users || []);
      setTotalPages(Math.ceil((data.total || 0) / 20));
    } catch (error) {
      console.error('Error fetching users:', error);
      if (typeof window !== 'undefined') {
        showNotification(t('admin.rssManagement.notifications.error'), 'error');
      }
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchQuery, t]);

  // Handle RSS enable/disable
  const handleRssToggle = async (userId: string, enabled: boolean) => {
    try {
      setProcessingUser(userId);
      const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const response = await fetch(`${API_BASE_URL}/admin/user/${userId}/rss-enabled`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ enabled })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update RSS status');
      }

      showNotification(
        enabled 
          ? t('admin.rssManagement.notifications.rssEnabled') 
          : t('admin.rssManagement.notifications.rssDisabled'), 
        'success'
      );
      
      // Update local state
      setUsers(prev => prev.map(user => 
        user.id === userId ? { ...user, rssEnabled: enabled } : user
      ));
    } catch (error) {
      console.error('Error updating RSS status:', error);
      showNotification(error instanceof Error ? error.message : 'Failed to update RSS status', 'error');
    } finally {
      setProcessingUser(null);
    }
  };

  // Handle RSS token reset
  const handleResetToken = async (userId: string) => {
    try {
      setProcessingUser(userId);
      const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
      const headers: HeadersInit = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const response = await fetch(`${API_BASE_URL}/admin/user/${userId}/rss-token`, {
        method: 'POST',
        headers
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to reset RSS token');
      }

      const data = await response.json();
      
      // Update local state with new token
      setUsers(prev => prev.map(user => 
        user.id === userId ? { ...user, rssToken: data.user.rssToken } : user
      ));

      showNotification(t('admin.rssManagement.notifications.tokenReset'), 'success');
    } catch (error) {
      console.error('Error resetting RSS token:', error);
      showNotification(error instanceof Error ? error.message : 'Failed to reset RSS token', 'error');
    } finally {
      setProcessingUser(null);
    }
  };



  // Toggle token visibility
  const toggleTokenVisibility = (userId: string) => {
    setShowToken(prev => ({
      ...prev,
      [userId]: !prev[userId]
    }));
  };

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  if (loading && users.length === 0) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="bg-surface border border-border rounded-lg p-4 animate-pulse">
            <div className="h-4 w-3/4 bg-text-secondary/10 rounded mb-2" />
            <div className="h-3 w-1/2 bg-text-secondary/10 rounded" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-secondary" size={20} />
            <input
              type="text"
              placeholder={t('admin.rssManagement.search.placeholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-surface text-text focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>
        <button
          onClick={() => {
            setSearchQuery('');
            setCurrentPage(1);
          }}
          className="px-4 py-2 text-text-secondary hover:text-text transition-colors"
        >
          {t('admin.rssManagement.search.clear')}
        </button>
      </div>

      {/* Users List */}
      <div className="space-y-4">
        {users.map((user) => (
          <div key={user.id} className="bg-surface border border-border rounded-lg p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-lg font-semibold text-text">{user.username}</h3>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    user.role === 'ADMIN' || user.role === 'OWNER' || user.role === 'FOUNDER'
                      ? 'bg-error/10 text-error'
                      : user.role === 'MOD'
                      ? 'bg-primary/10 text-primary'
                      : 'bg-green/10 text-green'
                  }`}>
                    {user.role}
                  </span>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    user.status === 'ACTIVE' ? 'bg-green/10 text-green' : 'bg-error/10 text-error'
                  }`}>
                    {user.status}
                  </span>
                </div>
                
                <div className="flex flex-wrap gap-4 text-sm text-text-secondary mb-3">
                  <span>{t('admin.rssManagement.user.email')}: {user.email}</span>
                  <span>{t('admin.rssManagement.user.created')}: {format(new Date(user.createdAt), 'PP', { locale: es })}</span>
                  <span className={`${user.emailVerified ? 'text-green' : 'text-error'}`}>
                    {user.emailVerified ? t('admin.rssManagement.user.emailVerified') : t('admin.rssManagement.user.emailNotVerified')}
                  </span>
                </div>

                {/* RSS Status */}
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <Rss size={16} className={user.rssEnabled ? 'text-green' : 'text-error'} />
                    <span className={`text-sm ${user.rssEnabled ? 'text-green' : 'text-error'}`}>
                      {user.rssEnabled ? t('admin.rssManagement.rss.enabled') : t('admin.rssManagement.rss.disabled')}
                    </span>
                  </div>
                  
                  {user.rssEnabled && user.rssToken && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-text-secondary">{t('admin.rssManagement.rss.token')}:</span>
                      <div className="flex items-center gap-1">
                        <input
                          type={showToken[user.id] ? 'text' : 'password'}
                          value={user.rssToken}
                          readOnly
                          className="px-2 py-1 text-xs text-text-secondary bg-background border border-border rounded font-mono select-none"
                          style={{ userSelect: 'none', WebkitUserSelect: 'none', MozUserSelect: 'none' }}
                        />
                        <button
                          onClick={() => toggleTokenVisibility(user.id)}
                          className="p-1 text-text-secondary hover:text-text transition-colors"
                          title={showToken[user.id] ? t('admin.rssManagement.rss.hideToken') : t('admin.rssManagement.rss.showToken')}
                        >
                          {showToken[user.id] ? <Hide size={14} /> : <Show size={14} />}
                        </button>

                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-2 ml-4">
                <button
                  onClick={() => handleRssToggle(user.id, !user.rssEnabled)}
                  disabled={processingUser === user.id}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    user.rssEnabled
                      ? 'bg-error/90 text-background hover:bg-error/80'
                      : 'bg-green text-background hover:bg-green/80'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {user.rssEnabled ? t('admin.rssManagement.actions.disable') : t('admin.rssManagement.actions.enable')}
                </button>
                
                {user.rssEnabled && (
                  <button
                    onClick={() => handleResetToken(user.id)}
                    disabled={processingUser === user.id}
                    className="px-3 py-2 bg-primary text-background rounded-lg hover:bg-primary/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title={t('admin.rssManagement.actions.resetToken')}
                  >
                    <Refresh size={16} />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center">
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-3 py-2 border border-border rounded-lg bg-surface text-text disabled:opacity-50 disabled:cursor-not-allowed hover:bg-surface-light transition-colors"
            >
              {t('admin.rssManagement.pagination.previous')}
            </button>
            <span className="px-3 py-2 text-text">
              {`Page ${currentPage} of ${totalPages}`}
            </span>
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-2 border border-border rounded-lg bg-surface text-text disabled:opacity-50 disabled:cursor-not-allowed hover:bg-surface-light transition-colors"
            >
              {t('admin.rssManagement.pagination.next')}
            </button>
          </div>
        </div>
      )}

      {/* No Results */}
      {!loading && users.length === 0 && (
        <div className="text-center text-text-secondary py-12">
          <div className="text-4xl mb-4">📡</div>
          <h3 className="text-lg font-medium mb-2">
            {t('admin.rssManagement.noResults.title')}
          </h3>
          <p className="text-sm">
            {t('admin.rssManagement.noResults.description')}
          </p>
        </div>
      )}
    </div>
  );
}
