'use client';

import { } from 'react';
import { Folder } from '@styled-icons/boxicons-regular/Folder';
import { Search } from '@styled-icons/boxicons-regular/Search';
import FileTree from './FileTree';
import { useI18n } from '@/app/hooks/useI18n';
interface FileItem { path: string; size: number }

interface Props { files: FileItem[]; loading?: boolean }

export default function TorrentFiles({ files, loading = false }: Props) {
  const { t } = useI18n();
  return (
    <div className="bg-surface rounded-lg border border-border p-6">
      <h2 className="text-xl font-semibold text-text mb-4 flex items-center">
        <Folder size={20} className="mr-2" />
        {loading ? (
          <>
            {t('torrentDetail.fileList.title', 'Archivos')} <span className="text-text-secondary">(<div className="w-8 h-4 bg-text-secondary/10 rounded animate-pulse inline-block"></div>)</span>
          </>
        ) : (
          `${t('torrentDetail.fileList.title', 'Archivos')} (${files.length})`
        )}
      </h2>

      {loading ? (
        <div className="space-y-4">
          <div className="relative flex-1 max-w-md">
            <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-secondary" />
            <input
              type="text"
              placeholder={t('torrentDetail.fileList.search', 'Buscar archivos...')}
              disabled
              className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg text-text placeholder-text-secondary focus:outline-none focus:border-primary transition-colors disabled:opacity-50"
            />
          </div>
          <div className="bg-background border border-border rounded-lg max-h-96 overflow-y-auto">
            <div className="py-2 space-y-1">
              <div className="flex items-center py-1 px-2">
                <div className="flex items-center space-x-2 flex-1">
                  <div className="w-4 h-4 bg-text-secondary/10 rounded animate-pulse"></div>
                  <div className="w-4 h-4 bg-blue-500/20 rounded animate-pulse"></div>
                  <div className="w-24 h-4 bg-text-secondary/10 rounded animate-pulse"></div>
                </div>
                <div className="w-16 h-4 bg-text-secondary/10 rounded animate-pulse"></div>
              </div>
              <div className="flex items-center py-1 px-2" style={{ paddingLeft: '24px' }}>
                <div className="flex items-center space-x-2 flex-1">
                  <div className="w-4 h-4 bg-text-secondary/10 rounded animate-pulse"></div>
                  <div className="w-32 h-4 bg-text-secondary/10 rounded animate-pulse"></div>
                </div>
                <div className="w-12 h-4 bg-text-secondary/10 rounded animate-pulse"></div>
              </div>
            </div>
          </div>
          <div className="text-sm text-text-secondary">
            <div className="w-48 h-4 bg-text-secondary/10 rounded animate-pulse"></div>
          </div>
        </div>
      ) : (
        <FileTree files={files} />
      )}
    </div>
  );
}


