'use client';

import { useState, useEffect, useCallback } from 'react';
import { useI18n } from '../../hooks/useI18n';
import { toast } from 'react-hot-toast';
import Image from 'next/image';
import { Search, Filter, Edit, Trash, Show, Calendar, Tag, User } from '@styled-icons/boxicons-regular';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface Bookmark {
  id: string;
  name: string;
  description: string | null;
  size: string;
  createdAt: string;
  note: string;
  posterUrl?: string | null;
}

interface BookmarksResponse {
  bookmarks: Bookmark[];
  total: number;
  page: number;
  limit: number;
}

export default function BookmarksClient() {
  const { t } = useI18n();
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [editingNote, setEditingNote] = useState<string | null>(null);
  const [noteText, setNoteText] = useState('');
  const [updatingNote, setUpdatingNote] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [bookmarkToDelete, setBookmarkToDelete] = useState<string | null>(null);

  const loadBookmarks = useCallback(async () => {
    try {
      setLoading(true);
      const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
      if (!token) {
        toast.error(t('bookmarks.mustBeLoggedIn', 'You must be logged in to view bookmarks'));
        return;
      }

      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '12'
      });

      const response = await fetch(`${API_BASE_URL}/bookmarks?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to load bookmarks');
      }

      const data: BookmarksResponse = await response.json();
      setBookmarks(data.bookmarks || []);
      setTotal(data.total || 0);
      setTotalPages(Math.ceil((data.total || 0) / 12));
    } catch (error) {
      console.error('Error loading bookmarks:', error);
      toast.error(t('bookmarks.errorLoadingBookmarks', 'Error loading bookmarks'));
    } finally {
      setLoading(false);
    }
  }, [currentPage, t]);

  const handleDeleteBookmark = (bookmarkId: string) => {
    setBookmarkToDelete(bookmarkId);
    setShowDeleteModal(true);
  };

  const confirmDeleteBookmark = async () => {
    if (!bookmarkToDelete) return;

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
      if (!token) {
        toast.error(t('bookmarks.mustBeLoggedIn', 'You must be logged in'));
        return;
      }

      const response = await fetch(`${API_BASE_URL}/bookmarks/${bookmarkToDelete}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete bookmark');
      }

      toast.success(t('bookmarks.bookmarkRemoved', 'Bookmark removed successfully'));
      loadBookmarks();
    } catch (error) {
      console.error('Error deleting bookmark:', error);
      toast.error(t('bookmarks.errorRemovingBookmark', 'Error removing bookmark'));
    } finally {
      setShowDeleteModal(false);
      setBookmarkToDelete(null);
    }
  };

  const cancelDeleteBookmark = () => {
    setShowDeleteModal(false);
    setBookmarkToDelete(null);
  };

  const handleEditNote = (bookmark: Bookmark) => {
    setEditingNote(bookmark.id);
    setNoteText(bookmark.note || '');
  };

  const handleSaveNote = async (bookmarkId: string) => {
    try {
      setUpdatingNote(true);
      const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
      if (!token) {
        toast.error(t('bookmarks.mustBeLoggedIn', 'You must be logged in'));
        return;
      }

      const response = await fetch(`${API_BASE_URL}/bookmarks/${bookmarkId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ note: noteText })
      });

      if (!response.ok) {
        throw new Error('Failed to update note');
      }

      toast.success(t('bookmarks.noteUpdated', 'Note updated successfully'));
      setEditingNote(null);
      setNoteText('');
      loadBookmarks();
    } catch (error) {
      console.error('Error updating note:', error);
      toast.error(t('bookmarks.errorUpdatingNote', 'Error updating note'));
    } finally {
      setUpdatingNote(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingNote(null);
    setNoteText('');
  };

  const formatFileSize = (size: string) => {
    const bytes = parseInt(size);
    if (isNaN(bytes)) return '0 B';
    
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const filteredBookmarks = bookmarks.filter(bookmark =>
    bookmark.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (bookmark.description && bookmark.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (bookmark.note && bookmark.note.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  useEffect(() => {
    loadBookmarks();
  }, [loadBookmarks]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-background rounded-lg p-6">
                <div className="h-6 bg-background rounded w-3/4 mb-3"></div>
                <div className="h-4 bg-background rounded w-full mb-2"></div>
                <div className="h-4 bg-background rounded w-2/3 mb-4"></div>
                <div className="h-4 bg-background rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-secondary" />
          <input
            type="text"
            placeholder={t('bookmarks.searchPlaceholder', 'Search bookmarks...')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg text-text placeholder-text-secondary focus:outline-none focus:border-primary transition-colors"
          />
        </div>
      </div>

      {/* Results count */}
      <div className="flex items-center justify-between">
        <p className="text-text-secondary">
          {filteredBookmarks.length} {t('bookmarks.resultsCount', 'bookmarks found')}
        </p>
        {total > 0 && (
          <p className="text-text-secondary">
            {t('bookmarks.pageInfo', 'Page')} {currentPage} {t('bookmarks.of', 'of')} {totalPages}
          </p>
        )}
      </div>

      {/* Bookmarks Grid */}
      {filteredBookmarks.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-text-secondary mb-4">
            {searchTerm ? (
              t('bookmarks.noResults', 'No bookmarks found matching your search')
            ) : (
              t('bookmarks.noBookmarks', 'No bookmarks yet')
            )}
          </div>
          {!searchTerm && (
            <p className="text-text-secondary text-sm">
              {t('bookmarks.noBookmarksDescription', 'Start bookmarking torrents to see them here')}
            </p>
          )}
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {filteredBookmarks.map((bookmark) => (
              <div key={bookmark.id} className="bg-background border border-border rounded-lg p-6 hover:shadow-lg transition-shadow">
                <div className="flex gap-4">
                  {/* Image */}
                  <div className="flex-shrink-0">
                    {bookmark.posterUrl ? (
                      <div className="relative w-24 h-32 rounded-lg overflow-hidden">
                        <Image
                          src={bookmark.posterUrl.startsWith('http') ? bookmark.posterUrl : `${API_BASE_URL}${bookmark.posterUrl}`}
                          alt={bookmark.name}
                          fill
                          unoptimized
                          className="object-cover"
                          onError={(e) => {
                            // Hide image on error
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      </div>
                    ) : (
                      <div className="w-24 h-32 bg-background border border-border rounded-lg flex items-center justify-center">
                        <Tag size={24} className="text-text-secondary" />
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="font-semibold text-text line-clamp-2 flex-1">
                        {bookmark.name}
                      </h3>
                      <div className="flex items-center gap-2 ml-2">
                        <button
                          onClick={() => handleEditNote(bookmark)}
                          className="p-1 text-text-secondary hover:text-primary transition-colors"
                          title={t('bookmarks.editNote', 'Edit note')}
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteBookmark(bookmark.id)}
                          className="p-1 text-text-secondary hover:text-red-500 transition-colors"
                          title={t('bookmarks.removeBookmark', 'Remove bookmark')}
                        >
                          <Trash size={16} />
                        </button>
                      </div>
                    </div>

                    {bookmark.description && (
                      <p className="text-text-secondary text-sm mb-3 line-clamp-2">
                        {bookmark.description}
                      </p>
                    )}

                    {/* Note Section */}
                    {editingNote === bookmark.id ? (
                      <div className="mb-4">
                        <textarea
                          value={noteText}
                          onChange={(e) => setNoteText(e.target.value)}
                          placeholder={t('bookmarks.notePlaceholder', 'Add a note...')}
                          rows={2}
                          className="w-full px-3 py-2 bg-background border border-border rounded text-text placeholder-text-secondary focus:outline-none focus:border-primary transition-colors resize-none text-sm"
                        />
                        <div className="flex items-center gap-2 mt-2">
                          <button
                            onClick={() => handleSaveNote(bookmark.id)}
                            disabled={updatingNote}
                            className="px-3 py-1 bg-primary text-white rounded text-sm hover:bg-primary-dark disabled:opacity-50 transition-colors"
                          >
                            {updatingNote ? t('bookmarks.saving', 'Saving...') : t('bookmarks.save', 'Save')}
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="px-3 py-1 bg-background border border-border text-text rounded text-sm hover:bg-background transition-colors"
                          >
                            {t('bookmarks.cancel', 'Cancel')}
                          </button>
                        </div>
                      </div>
                    ) : (
                      bookmark.note && (
                        <div className="mb-4 p-3 bg-primary/5 border border-primary/20 rounded">
                          <p className="text-text text-sm">{bookmark.note}</p>
                        </div>
                      )
                    )}

                    <div className="flex items-center justify-between text-sm text-text-secondary mb-4">
                      <div className="flex items-center gap-1">
                        <Calendar size={14} />
                        <span>{formatDate(bookmark.createdAt)}</span>
                      </div>
                      <span>{formatFileSize(bookmark.size)}</span>
                    </div>

                    <button
                      onClick={() => window.open(`/torrent/${bookmark.id}`, '_blank')}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
                    >
                      <Show size={16} />
                      {t('bookmarks.viewTorrent', 'View Torrent')}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 bg-background border border-border text-text rounded-lg hover:bg-background disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {t('bookmarks.previous', 'Previous')}
              </button>
              
              <span className="px-4 py-2 text-text">
                {currentPage} / {totalPages}
              </span>
              
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 bg-background border border-border text-text rounded-lg hover:bg-background disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {t('bookmarks.next', 'Next')}
              </button>
            </div>
          )}
        </>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background border border-border rounded-lg p-6 max-w-md w-full">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-500/10 rounded-full flex items-center justify-center">
                <Trash size={20} className="text-red-500" />
              </div>
              <h3 className="text-lg font-semibold text-text">
                {t('bookmarks.confirmDeleteTitle', 'Delete Bookmark')}
              </h3>
            </div>
            
            <p className="text-text-secondary mb-6">
              {t('bookmarks.confirmDeleteMessage', 'Are you sure you want to remove this bookmark? This action cannot be undone.')}
            </p>
            
            <div className="flex items-center gap-3 justify-end">
              <button
                onClick={cancelDeleteBookmark}
                className="px-4 py-2 bg-background border border-border text-text rounded-lg hover:bg-background transition-colors"
              >
                {t('bookmarks.cancel', 'Cancel')}
              </button>
              <button
                onClick={confirmDeleteBookmark}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                {t('bookmarks.delete', 'Delete')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
