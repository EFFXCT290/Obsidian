'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Edit, Trash, Search, Filter } from '@styled-icons/boxicons-regular';
import toast from 'react-hot-toast';
import { API_BASE_URL } from '@/lib/api';

interface PeerBan {
  id: string;
  userId?: string;
  passkey?: string;
  peerId?: string;
  ip?: string;
  reason: string;
  expiresAt?: string;
  createdAt: string;
  bannedBy: {
    id: string;
    username: string;
    role: string;
  };
}

interface PeerBanFormData {
  userId: string;
  passkey: string;
  peerId: string;
  ip: string;
  reason: string;
  expiresAt: string;
}

interface PeerBanClientProps {
  translations: {
    title: string;
    description: string;
    addNew: string;
    addPeerBan: string;
    editPeerBan: string;
    list: string;
    userId: string;
    passkey: string;
    peerId: string;
    ip: string;
    reason: string;
    expiresAt: string;
    noExpiration: string;
    bannedBy: string;
    createdAt: string;
    status: string;
    active: string;
    expired: string;
    permanent: string;
    create: string;
    update: string;
    edit: string;
    delete: string;
    remove: string;
    cancel: string;
    reasonRequired: string;
    banTypeRequired: string;
    confirmDelete: string;
    noPeerBans: string;
    created: string;
    removed: string;
    errorLoading: string;
    errorCreating: string;
    errorRemoving: string;
    filterBy: string;
    allBans: string;
    activeBans: string;
    expiredBans: string;
    searchBy: string;
    searchPlaceholder: string;
    banTypes: {
      userId: string;
      passkey: string;
      peerId: string;
      ip: string;
    };
  };
}

// Peer Ban Item Component
function PeerBanItem({ 
  item, 
  onDelete, 
  translations
}: { 
  item: PeerBan; 
  onDelete: (peerBan: PeerBan) => void; 
  translations: PeerBanClientProps['translations'];
}) {
  const handleDelete = () => {
    onDelete(item);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatus = () => {
    if (!item.expiresAt) return { text: translations.permanent, color: 'bg-red-100 text-red-600' };
    const now = new Date();
    const expires = new Date(item.expiresAt);
    if (expires > now) return { text: translations.active, color: 'bg-green-100 text-green-600' };
    return { text: translations.expired, color: 'bg-gray-100 text-gray-600' };
  };

  const getBanTypes = () => {
    const types = [];
    if (item.userId) types.push(`${translations.banTypes.userId}: ${item.userId}`);
    if (item.passkey) types.push(`${translations.banTypes.passkey}: ${item.passkey}`);
    if (item.peerId) types.push(`${translations.banTypes.peerId}: ${item.peerId}`);
    if (item.ip) types.push(`${translations.banTypes.ip}: ${item.ip}`);
    return types;
  };

  const status = getStatus();
  const banTypes = getBanTypes();

  return (
    <div className="peer-ban-item bg-surface rounded-lg border border-border p-4 mb-2">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 mb-2">
            <span className={`text-xs px-2 py-1 rounded-full ${status.color}`}>
              {status.text}
            </span>
            {item.expiresAt && (
              <span className="text-xs text-text-secondary">
                {translations.expiresAt}: {formatDate(item.expiresAt)}
              </span>
            )}
          </div>
          
          <div className="space-y-1 mb-2">
            {banTypes.map((type, index) => (
              <div key={index} className="text-sm text-text font-medium">
                {type}
              </div>
            ))}
          </div>
          
          <div className="text-sm text-text-secondary mb-2">
            <strong>{translations.reason}:</strong> {item.reason}
          </div>
          
          <div className="text-xs text-text-secondary">
            <span>{translations.bannedBy}: {item.bannedBy?.username || 'Unknown'}</span>
            <span className="mx-2">•</span>
            <span>{translations.createdAt}: {formatDate(item.createdAt)}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-1 ml-4 flex-shrink-0">
          <button
            onClick={handleDelete}
            className="p-2 rounded transition-colors text-red-500 hover:text-red-600 hover:bg-red-50"
            title={translations.remove}
          >
            <Trash size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PeerBanClient({ translations }: PeerBanClientProps) {
  const [peerBans, setPeerBans] = useState<PeerBan[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<PeerBanFormData>({
    userId: '',
    passkey: '',
    peerId: '',
    ip: '',
    reason: '',
    expiresAt: ''
  });
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingPeerBan, setDeletingPeerBan] = useState<PeerBan | null>(null);
  const [filter, setFilter] = useState<'all' | 'active' | 'expired'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchType, setSearchType] = useState<'userId' | 'passkey' | 'peerId' | 'ip'>('userId');

  const loadPeerBans = useCallback(async () => {
    try {
      setLoading(true);
      const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      
      let url = `${API_BASE_URL}/admin/peerban`;
      const params = new URLSearchParams();
      
      if (filter === 'active') params.append('active', 'true');
      if (filter === 'expired') params.append('active', 'false');
      if (searchTerm && searchType) {
        params.append('type', searchType);
        params.append('value', searchTerm);
      }
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
      
      const response = await fetch(url, { headers, cache: 'no-store' });
      if (!response.ok) {
        throw new Error('Failed to load peer bans');
      }
      const data = await response.json();
      setPeerBans(data || []);
    } catch (error) {
      console.error('Error loading peer bans:', error);
      toast.error(translations.errorLoading);
    } finally {
      setLoading(false);
    }
  }, [translations.errorLoading, filter, searchTerm, searchType]);

  useEffect(() => {
    loadPeerBans();
  }, [loadPeerBans]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.reason.trim()) {
      toast.error(translations.reasonRequired);
      return;
    }

    const hasBanType = formData.userId || formData.passkey || formData.peerId || formData.ip;
    if (!hasBanType) {
      toast.error(translations.banTypeRequired);
      return;
    }

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      
      const requestBody: {
        reason: string;
        userId?: string;
        passkey?: string;
        peerId?: string;
        ip?: string;
      } = {
        reason: formData.reason
      };

      if (formData.userId) requestBody.userId = formData.userId;
      if (formData.passkey) requestBody.passkey = formData.passkey;
      if (formData.peerId) requestBody.peerId = formData.peerId;
      if (formData.ip) requestBody.ip = formData.ip;
      if (formData.expiresAt) requestBody.expiresAt = formData.expiresAt;
      
      const response = await fetch(`${API_BASE_URL}/admin/peerban`, {
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error('Failed to create peer ban');
      }

      toast.success(translations.created);
      resetForm();
      loadPeerBans();
    } catch (error) {
      console.error('Error creating peer ban:', error);
      toast.error(translations.errorCreating);
    }
  };

  const handleDelete = (peerBan: PeerBan) => {
    setDeletingPeerBan(peerBan);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!deletingPeerBan) return;

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
      const headers: HeadersInit = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      
      const response = await fetch(`${API_BASE_URL}/admin/peerban/${deletingPeerBan.id}`, {
        method: 'DELETE',
        headers,
      });

      if (!response.ok) {
        throw new Error('Failed to remove peer ban');
      }

      toast.success(translations.removed);
      setDeleteModalOpen(false);
      setDeletingPeerBan(null);
      loadPeerBans();
    } catch (error) {
      console.error('Error removing peer ban:', error);
      toast.error(translations.errorRemoving);
    }
  };

  const resetForm = () => {
    setFormData({
      userId: '',
      passkey: '',
      peerId: '',
      ip: '',
      reason: '',
      expiresAt: ''
    });
    setShowForm(false);
  };

  const handleSearch = () => {
    loadPeerBans();
  };

  const clearSearch = () => {
    setSearchTerm('');
    setSearchType('userId');
    loadPeerBans();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-text-secondary">Loading peer bans...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Add Peer Ban Form */}
      {showForm && (
        <div className="bg-surface rounded-lg border border-border p-6">
          <h2 className="text-lg font-semibold text-text mb-4">
            {translations.addPeerBan}
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="userId" className="block text-sm font-medium text-text mb-1">
                  {translations.userId}
                </label>
                <input
                  type="text"
                  id="userId"
                  value={formData.userId}
                  onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded-md bg-surface text-text focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder={translations.userId}
                />
              </div>
              
              <div>
                <label htmlFor="passkey" className="block text-sm font-medium text-text mb-1">
                  {translations.passkey}
                </label>
                <input
                  type="text"
                  id="passkey"
                  value={formData.passkey}
                  onChange={(e) => setFormData({ ...formData, passkey: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded-md bg-surface text-text focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder={translations.passkey}
                />
              </div>
              
              <div>
                <label htmlFor="peerId" className="block text-sm font-medium text-text mb-1">
                  {translations.peerId}
                </label>
                <input
                  type="text"
                  id="peerId"
                  value={formData.peerId}
                  onChange={(e) => setFormData({ ...formData, peerId: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded-md bg-surface text-text focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder={translations.peerId}
                />
              </div>
              
              <div>
                <label htmlFor="ip" className="block text-sm font-medium text-text mb-1">
                  {translations.ip}
                </label>
                <input
                  type="text"
                  id="ip"
                  value={formData.ip}
                  onChange={(e) => setFormData({ ...formData, ip: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded-md bg-surface text-text focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder={translations.ip}
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="reason" className="block text-sm font-medium text-text mb-1">
                {translations.reason} *
              </label>
              <textarea
                id="reason"
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-md bg-surface text-text focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder={translations.reason}
                rows={3}
                required
              />
            </div>
            
            <div>
              <label htmlFor="expiresAt" className="block text-sm font-medium text-text mb-1">
                {translations.expiresAt}
              </label>
              <input
                type="datetime-local"
                id="expiresAt"
                value={formData.expiresAt}
                onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-md bg-surface text-text focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
              <p className="text-xs text-text-secondary mt-1">
                Leave empty for permanent ban
              </p>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                type="submit"
                className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors"
              >
                {translations.create}
              </button>
              
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 border border-border text-text rounded-md hover:bg-surface-light transition-colors"
              >
                {translations.cancel}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Add New Peer Ban Button */}
      {!showForm && (
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-text">{translations.title}</h1>
            <p className="text-text-secondary mt-1">{translations.description}</p>
          </div>
          
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors"
          >
            <Plus size={20} />
            <span>{translations.addNew}</span>
          </button>
        </div>
      )}

      {/* Filters and Search */}
      <div className="bg-surface rounded-lg border border-border p-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Filter */}
          <div className="flex-1">
            <label className="block text-sm font-medium text-text mb-2">
              {translations.filterBy}
            </label>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as 'all' | 'active' | 'expired')}
              className="w-full px-3 py-2 border border-border rounded-md bg-surface text-text focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="all">{translations.allBans}</option>
              <option value="active">{translations.activeBans}</option>
              <option value="expired">{translations.expiredBans}</option>
            </select>
          </div>
          
          {/* Search Type */}
          <div className="flex-1">
            <label className="block text-sm font-medium text-text mb-2">
              {translations.searchBy}
            </label>
            <select
              value={searchType}
              onChange={(e) => setSearchType(e.target.value as 'userId' | 'passkey' | 'peerId' | 'ip')}
              className="w-full px-3 py-2 border border-border rounded-md bg-surface text-text focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="userId">{translations.banTypes.userId}</option>
              <option value="passkey">{translations.banTypes.passkey}</option>
              <option value="peerId">{translations.banTypes.peerId}</option>
              <option value="ip">{translations.banTypes.ip}</option>
            </select>
          </div>
          
          {/* Search Input */}
          <div className="flex-2">
            <label className="block text-sm font-medium text-text mb-2">
              Search
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={translations.searchPlaceholder}
                className="flex-1 px-3 py-2 border border-border rounded-md bg-surface text-text focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
              <button
                type="button"
                onClick={handleSearch}
                className="px-3 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors"
              >
                <Search size={16} />
              </button>
              {searchTerm && (
                <button
                  type="button"
                  onClick={clearSearch}
                  className="px-3 py-2 border border-border text-text rounded-md hover:bg-surface-light transition-colors"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Peer Bans List */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-text">{translations.list}</h2>
        
        {peerBans.length === 0 ? (
          <div className="text-center py-8 text-text-secondary">
            {translations.noPeerBans}
          </div>
        ) : (
          <div className="space-y-2">
            {peerBans.map((item) => (
              <PeerBanItem
                key={item.id}
                item={item}
                onDelete={handleDelete}
                translations={translations}
              />
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-surface rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-text mb-4">Confirm Delete</h3>
            <p className="text-text-secondary mb-6">
              {translations.confirmDelete}
            </p>
            <div className="flex items-center space-x-3">
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
              >
                {translations.remove}
              </button>
              <button
                onClick={() => setDeleteModalOpen(false)}
                className="px-4 py-2 border border-border text-text rounded-md hover:bg-surface-light transition-colors"
              >
                {translations.cancel}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
