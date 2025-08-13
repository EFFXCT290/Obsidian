'use client';

import { useState, useMemo } from 'react';
import { useI18n } from '@/app/hooks/useI18n';
import { Folder } from '@styled-icons/boxicons-regular/Folder';
import { FolderOpen } from '@styled-icons/boxicons-regular/FolderOpen';
import { File } from '@styled-icons/boxicons-regular/File';
import { ChevronRight } from '@styled-icons/boxicons-regular/ChevronRight';
import { ChevronDown } from '@styled-icons/boxicons-regular/ChevronDown';
import { Search } from '@styled-icons/boxicons-regular/Search';

interface FileNode {
  name: string;
  path: string;
  size: number;
  type: 'file' | 'folder';
  children?: FileNode[];
}

interface FileTreeProps {
  files: Array<{ path: string; size: number }>; // Flat list
}

export default function FileTree({ files }: FileTreeProps) {
  const { t } = useI18n();
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');

  // Build tree structure from flat file list
  const fileTree = useMemo(() => {
    const tree: FileNode[] = [];
    const folderMap = new Map<string, FileNode>();

    const getOrCreateFolder = (path: string, name: string): FileNode => {
      if (folderMap.has(path)) return folderMap.get(path)!;
      const folderNode: FileNode = { name, path, size: 0, type: 'folder', children: [] };
      folderMap.set(path, folderNode);
      return folderNode;
    };

    (files || []).forEach(file => {
      const pathParts = String(file.path || '').split('/').filter(Boolean);
      if (pathParts.length === 0) return;
      if (pathParts.length === 1) {
        const fileNode: FileNode = { name: pathParts[0], path: file.path, size: file.size, type: 'file' };
        tree.push(fileNode);
      } else {
        let currentPath = '';
        let parentFolder: FileNode | null = null;
        for (let i = 0; i < pathParts.length - 1; i++) {
          const folderName = pathParts[i];
          currentPath = currentPath ? `${currentPath}/${folderName}` : folderName;
          const folderNode = getOrCreateFolder(currentPath, folderName);
          if (!parentFolder) {
            if (!tree.some(node => node.path === folderNode.path)) tree.push(folderNode);
          } else {
            if (!parentFolder.children!.some(child => child.path === folderNode.path)) parentFolder.children!.push(folderNode);
          }
          parentFolder = folderNode;
        }
        // Add the file to the parent folder
        const fileName = pathParts[pathParts.length - 1];
        const fileNode: FileNode = { name: fileName, path: file.path, size: file.size, type: 'file' };
        if (parentFolder) {
          parentFolder.children!.push(fileNode);
          // Update accumulated sizes up the chain
          let current: FileNode | null = parentFolder;
          while (current) {
            current.size += file.size;
            const parentPath = current.path.split('/').slice(0, -1).join('/');
            current = folderMap.get(parentPath) || null;
          }
        }
      }
    });
    return tree;
  }, [files]);

  const filteredTree = useMemo(() => {
    if (!searchTerm) return fileTree;
    const filterNode = (node: FileNode): FileNode | null => {
      const matches = node.name.toLowerCase().includes(searchTerm.toLowerCase());
      if (node.type === 'file') return matches ? node : null;
      const filteredChildren = (node.children || [])
        .map(child => filterNode(child))
        .filter((n): n is FileNode => n !== null);
      if (matches || filteredChildren.length > 0) return { ...node, children: filteredChildren };
      return null;
    };
    return fileTree.map(n => filterNode(n)).filter((n): n is FileNode => n !== null);
  }, [fileTree, searchTerm]);

  const toggleFolder = (folderPath: string) => {
    const next = new Set(expandedFolders);
    if (next.has(folderPath)) next.delete(folderPath); else next.add(folderPath);
    setExpandedFolders(next);
  };

  const formatFileSize = (bytes: number): string => {
    if (!bytes) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let i = 0; let value = Number(bytes);
    while (value >= 1024 && i < units.length - 1) { value /= 1024; i++; }
    return `${value.toFixed(2)} ${units[i]}`;
  };

  const renderNode = (node: FileNode, level: number = 0) => {
    const isExpanded = expandedFolders.has(node.path);
    const indent = level * 20;
    if (node.type === 'folder') {
      return (
        <div key={node.path}>
          <div
            className="flex items-center py-1 px-2 hover:bg-surface-light rounded cursor-pointer transition-colors"
            style={{ paddingLeft: `${indent + 8}px` }}
            onClick={() => toggleFolder(node.path)}
          >
            <div className="flex items-center space-x-2 flex-1">
              {isExpanded ? (
                <ChevronDown size={16} className="text-text-secondary" />
              ) : (
                <ChevronRight size={16} className="text-text-secondary" />
              )}
              {isExpanded ? (
                <FolderOpen size={16} className="text-blue-500" />
              ) : (
                <Folder size={16} className="text-blue-500" />
              )}
              <span className="text-text font-medium">{node.name}</span>
            </div>
            <span className="text-text-secondary text-sm">{formatFileSize(node.size)}</span>
          </div>
          {isExpanded && node.children && (
            <div>
              {node.children.map(child => renderNode(child, level + 1))}
            </div>
          )}
        </div>
      );
    }
    return (
      <div key={node.path} className="flex items-center py-1 px-2 hover:bg-surface-light rounded" style={{ paddingLeft: `${indent + 24}px` }}>
        <div className="flex items-center space-x-2 flex-1">
          <File size={16} className="text-text-secondary" />
          <span className="text-text">{node.name}</span>
        </div>
        <span className="text-text-secondary text-sm">{formatFileSize(node.size)}</span>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="relative flex-1 max-w-md">
        <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-secondary" />
        <input
          type="text"
          placeholder={t('torrentDetail.fileList.search', 'Buscar archivos...')}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg text-text placeholder-text-secondary focus:outline-none focus:border-primary transition-colors"
        />
      </div>

      <div className="bg-background border border-border rounded-lg max-h-96 overflow-y-auto">
        {filteredTree.length === 0 ? (
          <div className="text-center py-8 text-text-secondary">
            <File size={48} className="mx-auto mb-4 opacity-50" />
            <p>
              {searchTerm
                ? t('torrentDetail.fileList.noResults', 'No se encontraron resultados')
                : t('torrentDetail.fileList.noFiles', 'Sin archivos')}
            </p>
          </div>
        ) : (
          <div className="py-2">
            {filteredTree.map(node => renderNode(node))}
          </div>
        )}
      </div>

      <div className="text-sm text-text-secondary">
        {t('torrentDetail.fileList.summary', 'Total: {{files}} archivos, {{totalSize}}')
          .replace('{{files}}', String((files || []).length))
          .replace('{{totalSize}}', formatFileSize((files || []).reduce((sum, f) => sum + (f.size || 0), 0)))}
      </div>
    </div>
  );
}


