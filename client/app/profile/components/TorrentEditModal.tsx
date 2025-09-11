'use client';

import React, { useState, useEffect } from 'react';
import { useI18n } from '../../hooks/useI18n';
import { ToggleSwitch } from '@/app/components/ui/ToggleSwitch';
import { X } from '@styled-icons/boxicons-regular/X';
import { Trash } from '@styled-icons/boxicons-regular/Trash';

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

interface TorrentEditModalProps {
  torrent: UserTorrent | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (torrentId: string, updates: { isAnonymous?: boolean; freeleech?: boolean }) => Promise<void>;
  onDelete: (torrentId: string) => Promise<void>;
  isUpdating: boolean;
}

export default function TorrentEditModal({ 
  torrent, 
  isOpen, 
  onClose, 
  onUpdate, 
  onDelete, 
  isUpdating 
}: TorrentEditModalProps) {
  const { t } = useI18n();
  const [localIsAnonymous, setLocalIsAnonymous] = useState(torrent?.isAnonymous || false);
  const [localFreeleech, setLocalFreeleech] = useState(torrent?.freeleech || false);

  // Update local state when torrent changes
  useEffect(() => {
    if (torrent) {
      setLocalIsAnonymous(torrent.isAnonymous);
      setLocalFreeleech(torrent.freeleech);
    }
  }, [torrent]);

  if (!isOpen || !torrent) return null;

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

  const handleSave = async () => {
    const updates: { isAnonymous?: boolean; freeleech?: boolean } = {};
    
    if (localIsAnonymous !== torrent.isAnonymous) {
      updates.isAnonymous = localIsAnonymous;
    }
    
    if (localFreeleech !== torrent.freeleech) {
      updates.freeleech = localFreeleech;
    }

    if (Object.keys(updates).length > 0) {
      await onUpdate(torrent.id, updates);
    }
    
    onClose();
  };

  const handleDelete = async () => {
    if (confirm(t('userTorrents.deleteConfirm', 'Are you sure you want to delete this torrent? This action cannot be undone.'))) {
      await onDelete(torrent.id);
      onClose();
    }
  };

  const hasChanges = localIsAnonymous !== torrent.isAnonymous || localFreeleech !== torrent.freeleech;
  const canEdit = torrent.status === 'approved';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-surface rounded-lg border border-border max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-lg font-semibold text-text">
            {t('userTorrents.modal.title', 'Edit Torrent')}
          </h2>
          <button
            onClick={onClose}
            className="text-text-secondary hover:text-text p-1"
            disabled={isUpdating}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Torrent Info */}
          <div className="bg-background rounded-lg p-4 border border-border">
            <h3 className="font-medium text-text mb-4">{torrent.name}</h3>
            <div className="grid grid-cols-4 gap-4 text-sm text-text-secondary">
              <div>
                <span className="font-medium">{t('userTorrents.modal.category', 'Category')}:</span>
                <br />
                {torrent.category.name}
              </div>
              <div>
                <span className="font-medium">{t('userTorrents.modal.size', 'Size')}:</span>
                <br />
                {formatFileSize(torrent.size)}
              </div>
              <div>
                <span className="font-medium">{t('userTorrents.modal.date', 'Upload Date')}:</span>
                <br />
                {formatDate(torrent.createdAt)}
              </div>
              <div>
                <span className="font-medium">{t('userTorrents.modal.status', 'Status')}:</span>
                <br />
                <span className={`px-2 py-1 text-xs rounded-full ${
                  torrent.status === 'approved' ? 'bg-green-100 text-green-800' :
                  torrent.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {t(`userTorrents.status.${torrent.status}`, torrent.status)}
                </span>
              </div>
            </div>
          </div>

          {/* Edit Options */}
          {canEdit ? (
            <div className="space-y-4">
              <h3 className="font-medium text-text">
                {t('userTorrents.modal.editOptions', 'Edit Options')}
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-background rounded-lg p-4 border border-border">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-text">
                      {t('userTorrents.modal.anonymous', 'Anonymous')}
                    </label>
                    <ToggleSwitch
                      checked={localIsAnonymous}
                      onChange={(e) => setLocalIsAnonymous(e.target.checked)}
                      disabled={isUpdating}
                    />
                  </div>
                  <p className="text-xs text-text-secondary">
                    {t('userTorrents.modal.anonymousDescription', 'Hide your identity as the uploader')}
                  </p>
                </div>

                <div className="bg-background rounded-lg p-4 border border-border">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-text">
                      {t('userTorrents.modal.freeleech', 'Freeleech')}
                    </label>
                    <ToggleSwitch
                      checked={localFreeleech}
                      onChange={(e) => setLocalFreeleech(e.target.checked)}
                      disabled={isUpdating}
                    />
                  </div>
                  <p className="text-xs text-text-secondary">
                    {t('userTorrents.modal.freeleechDescription', 'Downloads do not count against user ratio')}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-800">
                {t('userTorrents.modal.cannotEdit', 'This torrent cannot be edited because it is not approved yet.')}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-border">
          <button
            onClick={handleDelete}
            disabled={isUpdating}
            className="flex items-center space-x-2 px-4 py-2 text-red-500 hover:text-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Trash size={16} />
            <span>{t('userTorrents.actions.delete', 'Delete')}</span>
          </button>
          
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              disabled={isUpdating}
              className="px-4 py-2 text-text-secondary hover:text-text disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {t('common.cancel', 'Cancel')}
            </button>
            {canEdit && (
              <button
                onClick={handleSave}
                disabled={!hasChanges || isUpdating}
                className="px-4 py-2 bg-primary text-background rounded hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isUpdating ? t('common.saving', 'Saving...') : t('common.save', 'Save')}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
