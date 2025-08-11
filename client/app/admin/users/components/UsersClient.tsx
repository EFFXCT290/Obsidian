'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Edit, Shield, Crown, User, Search, X, UserCheck, UserX, ShieldAlt } from '@styled-icons/boxicons-regular';
import toast from 'react-hot-toast';

interface User {
  id: string;
  username: string;
  email: string;
  role: 'USER' | 'MOD' | 'ADMIN' | 'OWNER';
  status: 'ACTIVE' | 'BANNED' | 'DISABLED';
  createdAt: string;
  emailVerified: boolean;
}

interface UserFormData {
  username: string;
  email: string;
  role: 'USER' | 'MOD' | 'ADMIN' | 'OWNER';
  status: 'ACTIVE' | 'BANNED' | 'DISABLED';
  emailVerified: boolean;
}

interface UsersResponse {
  users: User[];
  total: number;
  page: number;
  limit: number;
}

interface UsersClientProps {
  translations: {
    title: string;
    description: string;
    search: string;
    searching: string;
    searchPlaceholder: string;
    users: string;
    noUsers: string;
    editUser: string;
    userDetails: string;
    username: string;
    email: string;
    role: string;
    status: string;
    emailVerified: string;
    createdAt: string;
    actions: string;
    edit: string;
    ban: string;
    unban: string;
    enable: string;
    promote: string;
    demote: string;
    close: string;
    save: string;
    saving: string;
    cancel: string;
    confirmBan: string;
    confirmUnban: string;
    confirmPromote: string;
    confirmDemote: string;
    userBanned: string;
    userUnbanned: string;
    userPromoted: string;
    userDemoted: string;
    userUpdated: string;
    errorLoading: string;
    errorUpdating: string;
    errorBanning: string;
    errorUnbanning: string;
    errorPromoting: string;
    errorDemoting: string;
    loading: string;
    roles: {
      USER: string;
      MOD: string;
      ADMIN: string;
      OWNER: string;
    };
    statuses: {
      ACTIVE: string;
      BANNED: string;
      DISABLED: string;
    };
  };
}

// User Item Component
function UserItem({ 
  user, 
  onEdit, 
  onBan, 
  onUnban, 
  onPromote, 
  onDemote,
  translations,
  currentUserRole
}: { 
  user: User; 
  onEdit: (user: User) => void; 
  onBan: (userId: string) => void;
  onUnban: (userId: string) => void;
  onPromote: (userId: string, role: 'MOD' | 'ADMIN') => void;
  onDemote: (userId: string, role: 'USER' | 'MOD') => void;
  translations: UsersClientProps['translations'];
  currentUserRole: string;
}) {
  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'OWNER': return <Crown size={16} className="text-yellow-500" />;
      case 'ADMIN': return <Shield size={16} className="text-red-500" />;
      case 'MOD': return <ShieldAlt size={16} className="text-blue-500" />;
      default: return <User size={16} className="text-gray-500" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ACTIVE': return <UserCheck size={16} className="text-green-500" />;
      case 'BANNED': return <UserX size={16} className="text-red-500" />;
      case 'DISABLED': return <User size={16} className="text-gray-500" />;
      default: return <User size={16} className="text-yellow-500" />;
    }
  };

  const canEditUser = currentUserRole === 'OWNER' || 
    (currentUserRole === 'ADMIN' && user.role !== 'ADMIN' && user.role !== 'OWNER');
  
  const canBanUser = currentUserRole === 'OWNER' || 
    (currentUserRole === 'ADMIN' && user.role !== 'ADMIN' && user.role !== 'OWNER');
  
  const canPromoteToAdmin = currentUserRole === 'OWNER';
  const canPromoteToMod = currentUserRole === 'OWNER' || currentUserRole === 'ADMIN';

  return (
    <div className="bg-surface rounded-lg border border-border p-4 mb-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4 flex-1 min-w-0">
          {/* User Avatar/Icon */}
          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
            {getRoleIcon(user.role)}
          </div>
          
          {/* User Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <h3 className="font-medium text-text truncate">{user.username}</h3>
              {user.emailVerified && (
                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                  ✓
                </span>
              )}
            </div>
            <p className="text-sm text-text-secondary truncate">{user.email}</p>
          </div>
        </div>

        {/* User Details */}
        <div className="flex items-center space-x-4 flex-shrink-0">
          <div className="text-sm text-text-secondary">
            <div className="flex items-center space-x-1">
              {getRoleIcon(user.role)}
              <span>{translations.roles[user.role]}</span>
            </div>
            <div className="flex items-center space-x-1">
              {getStatusIcon(user.status)}
              <span>{translations.statuses[user.status]}</span>
            </div>
            <div className="text-xs">
              {new Date(user.createdAt).toLocaleDateString()}
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex items-center space-x-1">
            {canEditUser && (
              <button
                onClick={() => onEdit(user)}
                className="p-2 rounded transition-colors text-text-secondary hover:text-primary hover:bg-surface-light"
                title={translations.edit}
              >
                <Edit size={16} />
              </button>
            )}
            
                         {canBanUser && user.status === 'ACTIVE' && (
               <button
                 onClick={() => onBan(user.id)}
                 className="p-2 rounded transition-colors text-red-500 hover:text-red-600 hover:bg-red-50"
                 title={translations.ban}
               >
                 <UserX size={16} />
               </button>
             )}
            
            {canBanUser && user.status === 'BANNED' && (
              <button
                onClick={() => onUnban(user.id)}
                className="p-2 rounded transition-colors text-green-500 hover:text-green-600 hover:bg-green-50"
                title={translations.unban}
              >
                <UserCheck size={16} />
              </button>
            )}
            
            {canBanUser && user.status === 'DISABLED' && (
              <button
                onClick={() => onUnban(user.id)}
                className="p-2 rounded transition-colors text-green-500 hover:text-green-600 hover:bg-green-50"
                title={translations.enable}
              >
                <UserCheck size={16} />
              </button>
            )}
            
                         {canPromoteToMod && user.role === 'USER' && (
               <button
                 onClick={() => onPromote(user.id, 'MOD')}
                 className="p-2 rounded transition-colors text-blue-500 hover:text-blue-600 hover:bg-blue-50"
                 title={translations.promote}
               >
                 <ShieldAlt size={16} />
               </button>
             )}
            
            {canPromoteToAdmin && user.role === 'MOD' && (
              <button
                onClick={() => onPromote(user.id, 'ADMIN')}
                className="p-2 rounded transition-colors text-red-500 hover:text-red-600 hover:bg-red-50"
                title={translations.promote}
              >
                <Shield size={16} />
              </button>
            )}
            
            {canPromoteToMod && user.role === 'MOD' && (
              <button
                onClick={() => onDemote(user.id, 'USER')}
                className="p-2 rounded transition-colors text-gray-500 hover:text-gray-600 hover:bg-gray-50"
                title={translations.demote}
              >
                <User size={16} />
              </button>
            )}
            
            {canPromoteToAdmin && user.role === 'ADMIN' && (
              <button
                onClick={() => onDemote(user.id, 'MOD')}
                className="p-2 rounded transition-colors text-blue-500 hover:text-blue-600 hover:bg-blue-50"
                title={translations.demote}
              >
                <ShieldAlt size={16} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Edit User Modal Component
function EditUserModal({ 
  user, 
  isOpen, 
  onClose, 
  onSave, 
  translations 
}: { 
  user: User | null; 
  isOpen: boolean; 
  onClose: () => void; 
  onSave: (userData: UserFormData) => void;
  translations: UsersClientProps['translations'];
}) {
  const [formData, setFormData] = useState<UserFormData>({
    username: '',
    email: '',
    role: 'USER',
    status: 'ACTIVE',
    emailVerified: false
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username,
        email: user.email,
        role: user.role,
        status: user.status,
        emailVerified: user.emailVerified
      });
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave(formData);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 bg-surface/50 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-surface rounded-lg border border-border p-6 w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-text">{translations.editUser}</h2>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-surface-light transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-text mb-1">
              {translations.username}
            </label>
            <input
              type="text"
              id="username"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              className="w-full px-3 py-2 border border-border rounded-md bg-surface text-text focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              required
            />
          </div>
          
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-text mb-1">
              {translations.email}
            </label>
            <input
              type="email"
              id="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2 border border-border rounded-md bg-surface text-text focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              required
            />
          </div>
          
          <div>
            <label htmlFor="role" className="block text-sm font-medium text-text mb-1">
              {translations.role}
            </label>
            <select
              id="role"
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
              className="w-full px-3 py-2 border border-border rounded-md bg-surface text-text focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="USER">{translations.roles.USER}</option>
              <option value="MOD">{translations.roles.MOD}</option>
              <option value="ADMIN">{translations.roles.ADMIN}</option>
              <option value="OWNER">{translations.roles.OWNER}</option>
            </select>
          </div>
          
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-text mb-1">
              {translations.status}
            </label>
            <select
              id="status"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
              className="w-full px-3 py-2 border border-border rounded-md bg-surface text-text focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="ACTIVE">{translations.statuses.ACTIVE}</option>
              <option value="BANNED">{translations.statuses.BANNED}</option>
              <option value="DISABLED">{translations.statuses.DISABLED}</option>
            </select>
          </div>
          
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="emailVerified"
              checked={formData.emailVerified}
              onChange={(e) => setFormData({ ...formData, emailVerified: e.target.checked })}
              className="rounded border-border text-primary focus:ring-primary"
            />
            <label htmlFor="emailVerified" className="text-sm text-text">
              {translations.emailVerified}
            </label>
          </div>
          
          <div className="flex items-center space-x-3 pt-4">
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {saving ? translations.saving : translations.save}
            </button>
            
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-border text-text rounded-md hover:bg-surface-light transition-colors"
            >
              {translations.cancel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function UsersClient({ translations }: UsersClientProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [currentUserRole, setCurrentUserRole] = useState<string>('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');

  // Debounce search query to avoid excessive API calls
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 500); // Wait 500ms after user stops typing

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Load users on initial mount and when debounced search query changes
  useEffect(() => {
    loadUsers();
  }, [debouncedSearchQuery]);

  const loadUsers = useCallback(async (isSearch = false) => {
    try {
      if (isSearch) {
        setSearchLoading(true);
      } else if (debouncedSearchQuery) {
        setSearchLoading(true);
      } else {
        setLoading(true);
      }
      
      const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      
      const queryParams = new URLSearchParams();
      if (debouncedSearchQuery) queryParams.append('q', debouncedSearchQuery);
      queryParams.append('limit', '100'); // Load more users for better UX
      
      const response = await fetch(`/api/admin/users?${queryParams}`, { headers, cache: 'no-store' });
      if (!response.ok) {
        throw new Error('Failed to load users');
      }
      const data: UsersResponse = await response.json();
      setUsers(data.users);
    } catch (error) {
      console.error('Error loading users:', error);
      toast.error(translations.errorLoading);
    } finally {
      if (isSearch || debouncedSearchQuery) {
        setSearchLoading(false);
      } else {
        setLoading(false);
      }
    }
  }, [debouncedSearchQuery, translations.errorLoading]);

  const loadCurrentUserRole = useCallback(async () => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      
      const response = await fetch('/api/user/current', { headers, cache: 'no-store' });
      if (response.ok) {
        const data = await response.json();
        setCurrentUserRole(data.user?.role || '');
      }
    } catch (error) {
      console.error('Error loading current user role:', error);
    }
  }, []);

  useEffect(() => {
    loadCurrentUserRole();
  }, [loadCurrentUserRole]);

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setShowEditModal(true);
  };

  const handleSave = async (userData: UserFormData) => {
    if (!editingUser) return;

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      // Determine if email changed
      const emailChanged = userData.email !== editingUser.email;

      // Build payloads
      const detailsPayload: any = {};
      if (userData.username !== editingUser.username) detailsPayload.username = userData.username;
      if (userData.role !== editingUser.role) detailsPayload.role = userData.role;
      if (userData.status !== editingUser.status) detailsPayload.status = userData.status;
      if (userData.emailVerified !== editingUser.emailVerified) detailsPayload.emailVerified = userData.emailVerified;

      // 1) Update email first (if changed), since backend also triggers verification flows
      if (emailChanged) {
        const resEmail = await fetch(`/api/admin/user/${editingUser.id}/email`, {
          method: 'PUT',
          headers,
          body: JSON.stringify({ email: userData.email }),
        });
        if (!resEmail.ok) {
          throw new Error('Failed to update email');
        }
      }

      // 2) Update other details if any changed
      if (Object.keys(detailsPayload).length > 0) {
        const resDetails = await fetch(`/api/admin/user/${editingUser.id}`, {
          method: 'PUT',
          headers,
          body: JSON.stringify(detailsPayload),
        });
        if (!resDetails.ok) {
          throw new Error('Failed to update user');
        }
      }

      toast.success(translations.userUpdated);
      loadUsers();
    } catch (error) {
      console.error('Error updating user:', error);
      toast.error(translations.errorUpdating);
    }
  };

  const handleBan = async (userId: string) => {
    if (!confirm(translations.confirmBan)) return;

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      
      const response = await fetch(`/api/admin/user/${userId}/ban`, {
        method: 'POST',
        headers,
      });

      if (!response.ok) {
        throw new Error('Failed to ban user');
      }

      toast.success(translations.userBanned);
      loadUsers();
    } catch (error) {
      console.error('Error banning user:', error);
      toast.error(translations.errorBanning);
    }
  };

  const handleUnban = async (userId: string) => {
    if (!confirm(translations.confirmUnban)) return;

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      
      const response = await fetch(`/api/admin/user/${userId}/unban`, {
        method: 'POST',
        headers,
      });

      if (!response.ok) {
        throw new Error('Failed to unban user');
      }

      toast.success(translations.userUnbanned);
      loadUsers();
    } catch (error) {
      console.error('Error unbanning user:', error);
      toast.error(translations.errorUnbanning);
    }
  };

  const handlePromote = async (userId: string, role: 'MOD' | 'ADMIN') => {
    if (!confirm(translations.confirmPromote)) return;

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      
      const response = await fetch(`/api/admin/user/${userId}/promote`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ role }),
      });

      if (!response.ok) {
        throw new Error('Failed to promote user');
      }

      toast.success(translations.userPromoted);
      loadUsers();
    } catch (error) {
      console.error('Error promoting user:', error);
      toast.error(translations.errorPromoting);
    }
  };

  const handleDemote = async (userId: string, role: 'USER' | 'MOD') => {
    if (!confirm(translations.confirmDemote)) return;

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      
      const response = await fetch(`/api/admin/user/${userId}/demote`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ role }),
      });

      if (!response.ok) {
        throw new Error('Failed to demote user');
      }

      toast.success(translations.userDemoted);
      loadUsers();
    } catch (error) {
      console.error('Error demoting user:', error);
      toast.error(translations.errorDemoting);
    }
  };

  if (loading && !searchLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-text-secondary">{translations.loading}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-text">{translations.title}</h1>
        <p className="text-text-secondary mt-1">{translations.description}</p>
      </div>

      {/* Search */}
      <div className="bg-surface rounded-lg border border-border p-4">
        <div className="flex items-center space-x-3">
          <div className="flex-1">
            <div className="relative">
              <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-secondary" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={translations.searchPlaceholder}
                disabled={searchLoading}
                className="w-full pl-10 pr-4 py-2 border border-border rounded-md bg-surface text-text focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 rounded hover:bg-surface-light transition-colors"
                  title="Clear search"
                >
                  <X size={16} className="text-text-secondary" />
                </button>
              )}
            </div>
          </div>
          {searchLoading && (
            <div className="flex items-center space-x-2 text-sm text-text-secondary">
              <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
              <span>{translations.searching}</span>
            </div>
          )}
        </div>
      </div>

      {/* Users List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-text">{translations.users}</h2>
          {searchLoading && (
            <div className="flex items-center space-x-2 text-sm text-text-secondary">
              <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
              <span>{translations.searching}</span>
            </div>
          )}
        </div>
        
        {users.length === 0 ? (
          <div className="text-center py-8 text-text-secondary">
            {searchLoading ? translations.searching : translations.noUsers}
          </div>
        ) : (
          <div className="space-y-2">
            {users.map((user) => (
              <UserItem
                key={user.id}
                user={user}
                onEdit={handleEdit}
                onBan={handleBan}
                onUnban={handleUnban}
                onPromote={handlePromote}
                onDemote={handleDemote}
                translations={translations}
                currentUserRole={currentUserRole}
              />
            ))}
          </div>
        )}
      </div>

      {/* Edit User Modal */}
      <EditUserModal
        user={editingUser}
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditingUser(null);
        }}
        onSave={handleSave}
        translations={translations}
      />
    </div>
  );
}
