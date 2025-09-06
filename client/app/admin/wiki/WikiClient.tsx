'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Edit, Trash, Lock, Show, Hide, X } from '@styled-icons/boxicons-regular';
import toast from 'react-hot-toast';
import { API_BASE_URL } from '@/lib/api';

interface WikiPage {
  id: string;
  slug: string;
  title: string;
  content: string;
  parentId?: string;
  locked: boolean;
  visible: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy?: {
    id: string;
    username: string;
    role: string;
  };
  updatedBy?: {
    id: string;
    username: string;
    role: string;
  };
}

interface WikiPageFormData {
  slug: string;
  title: string;
  content: string;
  parentId?: string;
  locked: boolean;
  visible: boolean;
}

interface WikiClientProps {
  translations: {
    title: string;
    description: string;
    addNew: string;
    addWikiPage: string;
    editWikiPage: string;
    list: string;
    slug: string;
    titleField: string;
    content: string;
    parentPage: string;
    noParent: string;
    locked: string;
    visible: string;
    createdBy: string;
    updatedBy: string;
    createdAt: string;
    updatedAt: string;
    create: string;
    update: string;
    edit: string;
    delete: string;
    lock: string;
    unlock: string;
    show: string;
    hide: string;
    cancel: string;
    slugRequired: string;
    titleRequired: string;
    contentRequired: string;
    confirmDelete: string;
    noWikiPages: string;
    created: string;
    updated: string;
    deleted: string;
    lockedSuccess: string;
    unlockedSuccess: string;
    shownSuccess: string;
    hiddenSuccess: string;
    errorLoading: string;
    errorCreating: string;
    errorUpdating: string;
    errorDeleting: string;
    errorLocking: string;
    errorUnlocking: string;
    errorShowing: string;
    errorHiding: string;
  };
}

// Wiki Page Item Component
function WikiPageItem({ 
  item, 
  onEdit, 
  onDelete, 
  onLock,
  onUnlock,
  onShow,
  onHide,
  translations
}: { 
  item: WikiPage; 
  onEdit: (wikiPage: WikiPage) => void; 
  onDelete: (wikiPage: WikiPage) => void;
  onLock: (wikiPage: WikiPage) => void;
  onUnlock: (wikiPage: WikiPage) => void;
  onShow: (wikiPage: WikiPage) => void;
  onHide: (wikiPage: WikiPage) => void;
  translations: WikiClientProps['translations'];
}) {
  const handleEdit = () => {
    onEdit(item);
  };

  const handleDelete = () => {
    onDelete(item);
  };

  const handleLock = () => {
    onLock(item);
  };

  const handleUnlock = () => {
    onUnlock(item);
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
    <div className={`wiki-page-item bg-surface rounded-lg border border-border p-4 mb-2 ${item.locked ? 'border-orange-200 bg-orange-50' : ''}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 mb-2">
            <h3 className="font-medium text-text truncate">{item.title}</h3>
            <span className="text-xs text-text-secondary bg-surface-light px-2 py-1 rounded">
              /{item.slug}
            </span>
            {item.locked && (
              <span className="text-xs bg-orange-100 text-orange-600 px-2 py-1 rounded-full flex items-center">
                <Lock size={12} className="mr-1" />
                Locked
              </span>
            )}
            {!item.visible && (
              <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full">
                Hidden
              </span>
            )}
          </div>
          
          <div className="text-sm text-text-secondary mb-2 line-clamp-3">
            {item.content}
          </div>
          
          <div className="text-xs text-text-secondary">
            <span>{translations.createdBy}: {item.createdBy?.username || 'Unknown'}</span>
            {item.updatedBy && (
              <>
                <span className="mx-2">•</span>
                <span>{translations.updatedBy}: {item.updatedBy.username}</span>
              </>
            )}
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
            onClick={item.locked ? handleUnlock : handleLock}
            className={`p-2 rounded transition-colors ${
              item.locked 
                ? 'text-orange-500 hover:text-orange-600 hover:bg-orange-50' 
                : 'text-text-secondary hover:text-orange-500 hover:bg-orange-50'
            }`}
            title={item.locked ? translations.unlock : translations.lock}
          >
            {item.locked ? <X size={16} /> : <Lock size={16} />}
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

export default function WikiClient({ translations }: WikiClientProps) {
  const [wikiPages, setWikiPages] = useState<WikiPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingWikiPage, setEditingWikiPage] = useState<WikiPage | null>(null);
  const [formData, setFormData] = useState<WikiPageFormData>({
    slug: '',
    title: '',
    content: '',
    parentId: undefined,
    locked: false,
    visible: true
  });
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingWikiPage, setDeletingWikiPage] = useState<WikiPage | null>(null);

  const loadWikiPages = useCallback(async () => {
    try {
      setLoading(true);
      const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      
      const response = await fetch(`${API_BASE_URL}/admin/wiki`, { headers, cache: 'no-store' });
      if (!response.ok) {
        throw new Error('Failed to load wiki pages');
      }
      const data = await response.json();
      setWikiPages(data || []);
    } catch (error) {
      console.error('Error loading wiki pages:', error);
      toast.error(translations.errorLoading);
    } finally {
      setLoading(false);
    }
  }, [translations.errorLoading]);

  useEffect(() => {
    loadWikiPages();
  }, [loadWikiPages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.slug.trim()) {
      toast.error(translations.slugRequired);
      return;
    }

    if (!formData.title.trim()) {
      toast.error(translations.titleRequired);
      return;
    }

    if (!formData.content.trim()) {
      toast.error(translations.contentRequired);
      return;
    }

    try {
      const url = editingWikiPage 
        ? `${API_BASE_URL}/admin/wiki/${editingWikiPage.id}`
        : `${API_BASE_URL}/admin/wiki`;
      
      const method = editingWikiPage ? 'PUT' : 'POST';
      
      const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      
      const response = await fetch(url, {
        method,
        headers,
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to save wiki page');
      }

      toast.success(editingWikiPage ? translations.updated : translations.created);
      resetForm();
      loadWikiPages();
    } catch (error) {
      console.error('Error saving wiki page:', error);
      toast.error(editingWikiPage ? translations.errorUpdating : translations.errorCreating);
    }
  };

  const handleEdit = (wikiPage: WikiPage) => {
    setEditingWikiPage(wikiPage);
    setFormData({
      slug: wikiPage.slug,
      title: wikiPage.title,
      content: wikiPage.content,
      parentId: wikiPage.parentId,
      locked: wikiPage.locked,
      visible: wikiPage.visible
    });
    setShowForm(true);
  };

  const handleDelete = (wikiPage: WikiPage) => {
    setDeletingWikiPage(wikiPage);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!deletingWikiPage) return;

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
      const headers: HeadersInit = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      
      const response = await fetch(`${API_BASE_URL}/admin/wiki/${deletingWikiPage.id}`, {
        method: 'DELETE',
        headers,
      });

      if (!response.ok) {
        throw new Error('Failed to delete wiki page');
      }

      toast.success(translations.deleted);
      setDeleteModalOpen(false);
      setDeletingWikiPage(null);
      loadWikiPages();
    } catch (error) {
      console.error('Error deleting wiki page:', error);
      toast.error(translations.errorDeleting);
    }
  };

  const handleLock = async (wikiPage: WikiPage) => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
      const headers: HeadersInit = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      
      const response = await fetch(`${API_BASE_URL}/admin/wiki/${wikiPage.id}/lock`, {
        method: 'POST',
        headers,
      });

      if (!response.ok) {
        throw new Error('Failed to lock wiki page');
      }

      toast.success(translations.lockedSuccess);
      loadWikiPages();
    } catch (error) {
      console.error('Error locking wiki page:', error);
      toast.error(translations.errorLocking);
    }
  };

  const handleUnlock = async (wikiPage: WikiPage) => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
      const headers: HeadersInit = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      
      const response = await fetch(`${API_BASE_URL}/admin/wiki/${wikiPage.id}/unlock`, {
        method: 'POST',
        headers,
      });

      if (!response.ok) {
        throw new Error('Failed to unlock wiki page');
      }

      toast.success(translations.unlockedSuccess);
      loadWikiPages();
    } catch (error) {
      console.error('Error unlocking wiki page:', error);
      toast.error(translations.errorUnlocking);
    }
  };

  const handleShow = async (wikiPage: WikiPage) => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
      const headers: HeadersInit = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      
      const response = await fetch(`${API_BASE_URL}/admin/wiki/${wikiPage.id}/show`, {
        method: 'POST',
        headers,
      });

      if (!response.ok) {
        throw new Error('Failed to show wiki page');
      }

      toast.success(translations.shownSuccess);
      loadWikiPages();
    } catch (error) {
      console.error('Error showing wiki page:', error);
      toast.error(translations.errorShowing);
    }
  };

  const handleHide = async (wikiPage: WikiPage) => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
      const headers: HeadersInit = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      
      const response = await fetch(`${API_BASE_URL}/admin/wiki/${wikiPage.id}/hide`, {
        method: 'POST',
        headers,
      });

      if (!response.ok) {
        throw new Error('Failed to hide wiki page');
      }

      toast.success(translations.hiddenSuccess);
      loadWikiPages();
    } catch (error) {
      console.error('Error hiding wiki page:', error);
      toast.error(translations.errorHiding);
    }
  };

  const resetForm = () => {
    setFormData({
      slug: '',
      title: '',
      content: '',
      parentId: undefined,
      locked: false,
      visible: true
    });
    setEditingWikiPage(null);
    setShowForm(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-text-secondary">Loading wiki pages...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Add/Edit Wiki Page Form */}
      {showForm && (
        <div className="bg-surface rounded-lg border border-border p-6">
          <h2 className="text-lg font-semibold text-text mb-4">
            {editingWikiPage ? translations.editWikiPage : translations.addWikiPage}
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="slug" className="block text-sm font-medium text-text mb-1">
                  {translations.slug} *
                </label>
                <input
                  type="text"
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded-md bg-surface text-text focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder={translations.slug}
                  required
                />
              </div>
              
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
            </div>
            
            <div>
              <label htmlFor="content" className="block text-sm font-medium text-text mb-1">
                {translations.content} *
              </label>
              <textarea
                id="content"
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-md bg-surface text-text focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder={translations.content}
                rows={8}
                required
              />
            </div>
            
            <div className="flex items-center space-x-6">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.locked}
                  onChange={(e) => setFormData({ ...formData, locked: e.target.checked })}
                  className="rounded border-border text-primary focus:ring-primary"
                />
                <span className="text-sm text-text">{translations.locked}</span>
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
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                type="submit"
                className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors"
              >
                {editingWikiPage ? translations.update : translations.create}
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

      {/* Add New Wiki Page Button */}
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

      {/* Wiki Pages List */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-text">{translations.list}</h2>
        
        {wikiPages.length === 0 ? (
          <div className="text-center py-8 text-text-secondary">
            {translations.noWikiPages}
          </div>
        ) : (
          <div className="space-y-2">
            {wikiPages.map((item) => (
              <WikiPageItem
                key={item.id}
                item={item}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onLock={handleLock}
                onUnlock={handleUnlock}
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
