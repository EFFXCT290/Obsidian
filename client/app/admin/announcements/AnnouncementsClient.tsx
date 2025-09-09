'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Edit, Trash, Pin, Show, Hide, X } from '@styled-icons/boxicons-regular';
import toast from 'react-hot-toast';
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

interface AnnouncementFormData {
  title: string;
  body: string;
  pinned: boolean;
  visible: boolean;
  sendEmail: boolean;
}

interface AnnouncementsClientProps {
  translations: {
    title: string;
    description: string;
    addNew: string;
    addAnnouncement: string;
    editAnnouncement: string;
    list: string;
    titleField: string;
    body: string;
    pinned: string;
    visible: string;
    createdBy: string;
    createdAt: string;
    updatedAt: string;
    create: string;
    update: string;
    edit: string;
    delete: string;
    pin: string;
    unpin: string;
    show: string;
    hide: string;
    cancel: string;
    titleRequired: string;
    bodyRequired: string;
    confirmDelete: string;
    noAnnouncements: string;
    created: string;
    updated: string;
    deleted: string;
    pinnedSuccess: string;
    unpinnedSuccess: string;
    shownSuccess: string;
    hiddenSuccess: string;
    errorLoading: string;
    errorCreating: string;
    errorUpdating: string;
    errorDeleting: string;
    errorPinning: string;
    errorUnpinning: string;
    errorShowing: string;
    errorHiding: string;
  };
}

// Announcement Item Component
function AnnouncementItem({ 
  item, 
  onEdit, 
  onDelete, 
  onPin,
  onUnpin,
  onShow,
  onHide,
  translations
}: { 
  item: Announcement; 
  onEdit: (announcement: Announcement) => void; 
  onDelete: (announcement: Announcement) => void;
  onPin: (announcement: Announcement) => void;
  onUnpin: (announcement: Announcement) => void;
  onShow: (announcement: Announcement) => void;
  onHide: (announcement: Announcement) => void;
  translations: AnnouncementsClientProps['translations'];
}) {
  const handleEdit = () => {
    onEdit(item);
  };

  const handleDelete = () => {
    onDelete(item);
  };

  const handlePin = () => {
    onPin(item);
  };

  const handleUnpin = () => {
    onUnpin(item);
  };

  const handleShow = () => {
    onShow(item);
  };

  const handleHide = () => {
    onHide(item);
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

  return (
    <div className={`announcement-item bg-surface rounded-lg border border-border p-4 mb-2 ${item.pinned ? 'border-primary bg-primary/5' : ''}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 mb-2">
            <h3 className="font-medium text-text truncate">{item.title}</h3>
            {item.pinned && (
              <span className="text-xs bg-primary text-white px-2 py-1 rounded-full flex items-center">
                <Pin size={12} className="mr-1" />
                Pinned
              </span>
            )}
            {!item.visible && (
              <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full">
                Hidden
              </span>
            )}
          </div>
          
          <div className="text-sm text-text-secondary mb-2 line-clamp-3">
            {item.body}
          </div>
          
          <div className="text-xs text-text-secondary">
            <span>{translations.createdBy}: {item.createdBy.username}</span>
            <span className="mx-2">•</span>
            <span>{translations.createdAt}: {formatDate(item.createdAt)}</span>
            {item.updatedAt !== item.createdAt && (
              <>
                <span className="mx-2">•</span>
                <span>{translations.updatedAt}: {formatDate(item.updatedAt)}</span>
              </>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-1 ml-4 flex-shrink-0">
          <button
            onClick={item.pinned ? handleUnpin : handlePin}
            className={`p-2 rounded transition-colors ${
              item.pinned 
                ? 'text-orange-500 hover:text-orange-600 hover:bg-orange-50' 
                : 'text-text-secondary hover:text-orange-500 hover:bg-orange-50'
            }`}
            title={item.pinned ? translations.unpin : translations.pin}
          >
            {item.pinned ? <X size={16} /> : <Pin size={16} />}
          </button>
          
          <button
            onClick={item.visible ? handleHide : handleShow}
            className={`p-2 rounded transition-colors ${
              item.visible 
                ? 'text-text-secondary hover:text-blue-500 hover:bg-blue-50' 
                : 'text-blue-500 hover:text-blue-600 hover:bg-blue-50'
            }`}
            title={item.visible ? translations.hide : translations.show}
          >
            {item.visible ? <Hide size={16} /> : <Show size={16} />}
          </button>
          
          <button
            onClick={handleEdit}
            className="p-2 rounded transition-colors text-text-secondary hover:text-primary hover:bg-surface-light"
            title={translations.edit}
          >
            <Edit size={16} />
          </button>
          
          <button
            onClick={handleDelete}
            className="p-2 rounded transition-colors text-red-500 hover:text-red-600 hover:bg-red-50"
            title={translations.delete}
          >
            <Trash size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AnnouncementsClient({ translations }: AnnouncementsClientProps) {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const [formData, setFormData] = useState<AnnouncementFormData>({
    title: '',
    body: '',
    pinned: false,
    visible: true,
    sendEmail: true
  });
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingAnnouncement, setDeletingAnnouncement] = useState<Announcement | null>(null);

  const loadAnnouncements = useCallback(async () => {
    try {
      setLoading(true);
      const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      
      const response = await fetch(`${API_BASE_URL}/admin/announcement`, { headers, cache: 'no-store' });
      if (!response.ok) {
        throw new Error('Failed to load announcements');
      }
      const data = await response.json();
      setAnnouncements(data.announcements || []);
    } catch (error) {
      console.error('Error loading announcements:', error);
      toast.error(translations.errorLoading);
    } finally {
      setLoading(false);
    }
  }, [translations.errorLoading]);

  useEffect(() => {
    loadAnnouncements();
  }, [loadAnnouncements]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      toast.error(translations.titleRequired);
      return;
    }

    if (!formData.body.trim()) {
      toast.error(translations.bodyRequired);
      return;
    }

    try {
      const url = editingAnnouncement 
        ? `${API_BASE_URL}/admin/announcement/${editingAnnouncement.id}`
        : `${API_BASE_URL}/admin/announcement`;
      
      const method = editingAnnouncement ? 'PUT' : 'POST';
      
      const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      
      const response = await fetch(url, {
        method,
        headers,
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to save announcement');
      }

      toast.success(editingAnnouncement ? translations.updated : translations.created);
      resetForm();
      loadAnnouncements();
    } catch (error) {
      console.error('Error saving announcement:', error);
      toast.error(editingAnnouncement ? translations.errorUpdating : translations.errorCreating);
    }
  };

  const handleEdit = (announcement: Announcement) => {
    setEditingAnnouncement(announcement);
    setFormData({
      title: announcement.title,
      body: announcement.body,
      pinned: announcement.pinned,
      visible: announcement.visible,
      sendEmail: false // Al editar, no enviar email por defecto
    });
    setShowForm(true);
  };

  const handleDelete = (announcement: Announcement) => {
    setDeletingAnnouncement(announcement);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!deletingAnnouncement) return;

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
      const headers: HeadersInit = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      
      const response = await fetch(`${API_BASE_URL}/admin/announcement/${deletingAnnouncement.id}`, {
        method: 'DELETE',
        headers,
      });

      if (!response.ok) {
        throw new Error('Failed to delete announcement');
      }

      toast.success(translations.deleted);
      setDeleteModalOpen(false);
      setDeletingAnnouncement(null);
      loadAnnouncements();
    } catch (error) {
      console.error('Error deleting announcement:', error);
      toast.error(translations.errorDeleting);
    }
  };

  const handlePin = async (announcement: Announcement) => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
      const headers: HeadersInit = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      
      const response = await fetch(`${API_BASE_URL}/admin/announcement/${announcement.id}/pin`, {
        method: 'POST',
        headers,
      });

      if (!response.ok) {
        throw new Error('Failed to pin announcement');
      }

      toast.success(translations.pinnedSuccess);
      loadAnnouncements();
    } catch (error) {
      console.error('Error pinning announcement:', error);
      toast.error(translations.errorPinning);
    }
  };

  const handleUnpin = async (announcement: Announcement) => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
      const headers: HeadersInit = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      
      const response = await fetch(`${API_BASE_URL}/admin/announcement/${announcement.id}/unpin`, {
        method: 'POST',
        headers,
      });

      if (!response.ok) {
        throw new Error('Failed to unpin announcement');
      }

      toast.success(translations.unpinnedSuccess);
      loadAnnouncements();
    } catch (error) {
      console.error('Error unpinning announcement:', error);
      toast.error(translations.errorUnpinning);
    }
  };

  const handleShow = async (announcement: Announcement) => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
      const headers: HeadersInit = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      
      const response = await fetch(`${API_BASE_URL}/admin/announcement/${announcement.id}/show`, {
        method: 'POST',
        headers,
      });

      if (!response.ok) {
        throw new Error('Failed to show announcement');
      }

      toast.success(translations.shownSuccess);
      loadAnnouncements();
    } catch (error) {
      console.error('Error showing announcement:', error);
      toast.error(translations.errorShowing);
    }
  };

  const handleHide = async (announcement: Announcement) => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
      const headers: HeadersInit = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      
      const response = await fetch(`${API_BASE_URL}/admin/announcement/${announcement.id}/hide`, {
        method: 'POST',
        headers,
      });

      if (!response.ok) {
        throw new Error('Failed to hide announcement');
      }

      toast.success(translations.hiddenSuccess);
      loadAnnouncements();
    } catch (error) {
      console.error('Error hiding announcement:', error);
      toast.error(translations.errorHiding);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      body: '',
      pinned: false,
      visible: true,
      sendEmail: true
    });
    setEditingAnnouncement(null);
    setShowForm(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-text-secondary">Loading announcements...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Add/Edit Announcement Form */}
      {showForm && (
        <div className="bg-surface rounded-lg border border-border p-6">
          <h2 className="text-lg font-semibold text-text mb-4">
            {editingAnnouncement ? translations.editAnnouncement : translations.addAnnouncement}
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-text mb-1">
                {translations.titleField} *
              </label>
              <input
                type="text"
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-md bg-surface text-text focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder={translations.titleField}
                required
              />
            </div>
            
            <div>
              <label htmlFor="body" className="block text-sm font-medium text-text mb-1">
                {translations.body} *
              </label>
              <textarea
                id="body"
                value={formData.body}
                onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-md bg-surface text-text focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder={translations.body}
                rows={6}
                required
              />
            </div>
            
            <div className="flex items-center space-x-6">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.pinned}
                  onChange={(e) => setFormData({ ...formData, pinned: e.target.checked })}
                  className="rounded border-border text-primary focus:ring-primary"
                />
                <span className="text-sm text-text">{translations.pinned}</span>
              </label>
              
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.visible}
                  onChange={(e) => setFormData({ ...formData, visible: e.target.checked })}
                  className="rounded border-border text-primary focus:ring-primary"
                />
                <span className="text-sm text-text">{translations.visible}</span>
              </label>
              
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.sendEmail}
                  onChange={(e) => setFormData({ ...formData, sendEmail: e.target.checked })}
                  className="rounded border-border text-primary focus:ring-primary"
                />
                <span className="text-sm text-text">Enviar por email</span>
              </label>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                type="submit"
                className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors"
              >
                {editingAnnouncement ? translations.update : translations.create}
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

      {/* Add New Announcement Button */}
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

      {/* Announcements List */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-text">{translations.list}</h2>
        
        {announcements.length === 0 ? (
          <div className="text-center py-8 text-text-secondary">
            {translations.noAnnouncements}
          </div>
        ) : (
          <div className="space-y-2">
            {announcements.map((item) => (
              <AnnouncementItem
                key={item.id}
                item={item}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onPin={handlePin}
                onUnpin={handleUnpin}
                onShow={handleShow}
                onHide={handleHide}
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
                {translations.delete}
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
