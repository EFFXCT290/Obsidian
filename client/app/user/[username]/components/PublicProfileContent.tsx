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
    <div className="max-w-4xl mx-auto">
      {/* Profile Header */}
      <div className="bg-surface rounded-lg border border-border p-6 mb-6">
        <div className="flex items-start space-x-6">
          {/* Avatar */}
          <div className="flex-shrink-0">
            {profile.avatarUrl ? (
              <Image
                src={profile.avatarUrl.startsWith('http') ? profile.avatarUrl : `${API_BASE_URL}${profile.avatarUrl}`}
                alt={profile.username}
                width={80}
                height={80}
                className="w-20 h-20 rounded-full object-cover border-2 border-border"
              />
            ) : (
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center border-2 border-border">
                <User size={40} className="text-primary" />
              </div>
            )}
          </div>
          
          {/* Profile Info */}
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-2">
              <h1 className="text-2xl font-bold text-text">{profile.username}</h1>
              {getRoleBadge(profile.role)}
            </div>
            
            <div className="flex items-center text-text-secondary text-sm mb-4">
              <Calendar size={16} className="mr-1" />
              {t('publicProfile.joined', 'Joined')} {formatDate(profile.createdAt)}
            </div>
            
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-background rounded-lg p-3 border border-border">
                <div className="flex items-center space-x-2 mb-1">
                  <Upload size={16} className="text-primary" />
                  <span className="text-sm text-text-secondary">{t('publicProfile.stats.uploaded', 'Uploaded')}</span>
                </div>
                <div className="text-lg font-semibold text-text">{formatBytes(profile.upload)}</div>
              </div>
              
              <div className="bg-background rounded-lg p-3 border border-border">
                <div className="flex items-center space-x-2 mb-1">
                  <Download size={16} className="text-primary" />
                  <span className="text-sm text-text-secondary">{t('publicProfile.stats.downloaded', 'Downloaded')}</span>
                </div>
                <div className="text-lg font-semibold text-text">{formatBytes(profile.download)}</div>
              </div>
              
              <div className="bg-background rounded-lg p-3 border border-border">
                <div className="flex items-center space-x-2 mb-1">
                  <Hdd size={16} className="text-primary" />
                  <span className="text-sm text-text-secondary">{t('publicProfile.stats.ratio', 'Ratio')}</span>
                </div>
                <div className="text-lg font-semibold text-text">{profile.ratio}</div>
              </div>
              
              <div className="bg-background rounded-lg p-3 border border-border">
                <div className="flex items-center space-x-2 mb-1">
                  <Group size={16} className="text-primary" />
                  <span className="text-sm text-text-secondary">{t('publicProfile.stats.torrents', 'Torrents')}</span>
                </div>
                <div className="text-lg font-semibold text-text">{profile.publicTorrents.length}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Public Torrents */}
      <div className="bg-surface rounded-lg border border-border p-6">
        <h2 className="text-xl font-semibold text-text mb-4">
          {t('publicProfile.publicTorrents.title', 'Public Torrents')}
        </h2>
        
        {profile.publicTorrents.length === 0 ? (
          <div className="text-center py-8 text-text-secondary">
            <Hdd size={48} className="mx-auto mb-4 text-text-secondary/50" />
            <p>{t('publicProfile.publicTorrents.empty', 'No public torrents found')}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {profile.publicTorrents.map((torrent) => (
              <div key={torrent.id} className="bg-background rounded-lg border border-border p-4 hover:border-primary/50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <Link 
                      href={`/torrent/${torrent.id}`}
                      className="text-primary hover:text-primary-hover font-medium block mb-2 truncate"
                    >
                      {torrent.name}
                    </Link>
                    
                    <div className="flex items-center space-x-4 text-sm text-text-secondary">
                      <span>{formatBytes(torrent.size)}</span>
                      <span>{torrent.category}</span>
                      <span>{formatDate(torrent.createdAt)}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4 text-sm text-text-secondary ml-4">
                    <div className="flex items-center space-x-1">
                      <Upload size={14} />
                      <span>{torrent.seeders}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Download size={14} />
                      <span>{torrent.leechers}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
