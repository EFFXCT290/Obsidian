'use client';

import { useI18n } from '@/app/hooks/useI18n';
import Image from 'next/image';
import Link from 'next/link';
import { User } from '@styled-icons/boxicons-regular/User';
import { Calendar } from '@styled-icons/boxicons-regular/Calendar';
import { Upload } from '@styled-icons/boxicons-regular/Upload';
import { Download } from '@styled-icons/boxicons-regular/Download';
import { Group } from '@styled-icons/boxicons-regular/Group';
import { Hdd } from '@styled-icons/boxicons-regular/Hdd';
import { API_BASE_URL } from '@/lib/api';

interface PublicTorrent {
  id: string;
  name: string;
  size: string;
  createdAt: string;
  category: string;
  seeders: number;
  leechers: number;
  completed: number;
}

interface PublicProfile {
  id: string;
  username: string;
  role: string;
  upload: string;
  download: string;
  ratio: string;
  createdAt: string;
  avatarUrl: string | null;
  publicTorrents: PublicTorrent[];
}

interface PublicProfileContentProps {
  profile: PublicProfile;
}

export default function PublicProfileContent({ profile }: PublicProfileContentProps) {
  const { t } = useI18n();

  const formatBytes = (bytes: string) => {
    const numBytes = parseInt(bytes);
    if (numBytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(numBytes) / Math.log(k));
    return parseFloat((numBytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getRoleBadge = (role: string) => {
    const roleColors = {
      'USER': 'bg-gray-500',
      'MOD': 'bg-blue-500',
      'ADMIN': 'bg-purple-500',
      'OWNER': 'bg-red-500',
      'FOUNDER': 'bg-yellow-500'
    };
    
    const roleLabels = {
      'USER': t('publicProfile.roles.user', 'User'),
      'MOD': t('publicProfile.roles.mod', 'Moderator'),
      'ADMIN': t('publicProfile.roles.admin', 'Admin'),
      'OWNER': t('publicProfile.roles.owner', 'Owner'),
      'FOUNDER': t('publicProfile.roles.founder', 'Founder')
    };

    return (
      <span className={`px-2 py-1 text-xs font-medium text-white rounded ${roleColors[role as keyof typeof roleColors] || 'bg-gray-500'}`}>
        {roleLabels[role as keyof typeof roleLabels] || role}
      </span>
    );
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Profile Header */}
      <div className="bg-surface rounded-lg border border-border p-6 mb-6">
        <div className="flex items-start space-x-8">
          {/* Avatar */}
          <div className="flex-shrink-0">
            {profile.avatarUrl ? (
              <Image
                src={profile.avatarUrl.startsWith('http') ? profile.avatarUrl : `${API_BASE_URL}${profile.avatarUrl}`}
                alt={profile.username}
                width={160}
                height={160}
                className="w-40 h-40 rounded-full object-cover border-2 border-border"
              />
            ) : (
              <div className="w-40 h-40 bg-primary/10 rounded-full flex items-center justify-center border-2 border-border">
                <User size={80} className="text-primary" />
              </div>
            )}
          </div>
          
          {/* Profile Info */}
          <div className="flex-1">
            <div className="flex items-center space-x-4 mb-3">
              <h1 className="text-3xl font-bold text-text">{profile.username}</h1>
              {getRoleBadge(profile.role)}
            </div>
            
            <div className="flex items-center text-text-secondary text-sm mb-4">
              <Calendar size={16} className="mr-1" />
              {t('publicProfile.joined', 'Joined')} {formatDate(profile.createdAt)}
            </div>
            
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="bg-background rounded-lg p-4 border border-border">
                <div className="flex items-center space-x-2 mb-2">
                  <Upload size={18} className="text-primary" />
                  <span className="text-sm font-medium text-text-secondary">{t('publicProfile.stats.uploaded', 'Uploaded')}</span>
                </div>
                <div className="text-xl font-bold text-text">{formatBytes(profile.upload)}</div>
              </div>
              
              <div className="bg-background rounded-lg p-4 border border-border">
                <div className="flex items-center space-x-2 mb-2">
                  <Download size={18} className="text-primary" />
                  <span className="text-sm font-medium text-text-secondary">{t('publicProfile.stats.downloaded', 'Downloaded')}</span>
                </div>
                <div className="text-xl font-bold text-text">{formatBytes(profile.download)}</div>
              </div>
              
              <div className="bg-background rounded-lg p-4 border border-border">
                <div className="flex items-center space-x-2 mb-2">
                  <Hdd size={18} className="text-primary" />
                  <span className="text-sm font-medium text-text-secondary">{t('publicProfile.stats.ratio', 'Ratio')}</span>
                </div>
                <div className="text-xl font-bold text-text">{profile.ratio}</div>
              </div>
              
              <div className="bg-background rounded-lg p-4 border border-border">
                <div className="flex items-center space-x-2 mb-2">
                  <Group size={18} className="text-primary" />
                  <span className="text-sm font-medium text-text-secondary">{t('publicProfile.stats.torrents', 'Torrents')}</span>
                </div>
                <div className="text-xl font-bold text-text">{profile.publicTorrents.length}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Public Torrents */}
      {profile.publicTorrents.length > 0 && (
        <div className="bg-surface rounded-lg border border-border p-6">
          <h2 className="text-xl font-semibold text-text mb-4">
            {t('publicProfile.publicTorrents.title', 'Public Torrents')} ({profile.publicTorrents.length})
          </h2>
          
          {/* Table */}
          <div className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-border">
                <thead className="bg-surface-secondary">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                      {t('publicProfile.torrent.title', 'Title')}
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                      {t('publicProfile.torrent.category', 'Category')}
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                      {t('publicProfile.torrent.date', 'Uploaded')}
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                      {t('publicProfile.torrent.size', 'Size')}
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-text-secondary uppercase tracking-wider">
                      {t('publicProfile.torrent.seeders', 'Seeders')} / {t('publicProfile.torrent.leechers', 'Leechers')}
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                      {t('publicProfile.torrent.completed', 'Completed')}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {profile.publicTorrents.map((torrent) => (
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
                        {torrent.category && torrent.category !== 'General' ? (
                          <Link 
                            href={`/category/${encodeURIComponent(torrent.category)}/torrents`}
                            className="text-primary hover:text-primary-hover transition-colors"
                          >
                            {torrent.category}
                          </Link>
                        ) : (
                          <span className="text-red-500">No category</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-text-secondary text-sm w-24">
                        {formatDate(torrent.createdAt)}
                      </td>
                      <td className="px-4 py-3 text-text-secondary text-sm w-20">
                        {formatBytes(torrent.size)}
                      </td>
                      <td className="px-4 py-3 text-text-secondary text-sm text-center w-24">
                        <span className="text-green-500">{torrent.seeders}</span> / <span className="text-red-500">{torrent.leechers}</span>
                      </td>
                      <td className="px-4 py-3 text-text-secondary text-sm w-20">
                        {torrent.completed || 0}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
