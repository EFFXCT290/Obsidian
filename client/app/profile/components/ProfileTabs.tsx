'use client';

import { useState } from 'react';
import { useI18n } from '../../hooks/useI18n';
import RecentActivity from './RecentActivity';
import UserTorrents from './UserTorrents';
import ProfileInvitations from './ProfileInvitations';
import ProfilePreferences from './ProfilePreferences';
import RankTab from './RankTab';

interface ProfileTabsProps {
  children: React.ReactNode;
  profile?: {
    id: string;
    username?: string;
    email: string;
    avatarUrl?: string;
    joinDate: string;
    uploaded: number;
    downloaded: number;
    ratio: number;
    bonusPoints: number;
    rank?: string | null;
    rankData?: {
      rank?: {
        name: string;
        color?: string;
      };
      nextRank?: {
        name: string;
        color?: string;
        minUpload: string;
        minDownload: string;
        minRatio: number;
      };
      progress?: {
        upload: number;
        download: number;
        ratio: number;
      };
    };
  } | null;
}

export default function ProfileTabs({ children, profile }: ProfileTabsProps) {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState('overview');

  const tabs = [
    { id: 'overview', label: t('profile.tabs.overview', 'Overview') },
    { id: 'ranks', label: t('profile.tabs.ranks', 'Ranks') },
    { id: 'activity', label: t('profile.tabs.activity', 'Recent Activity') },
    { id: 'torrents', label: t('profile.tabs.torrents', 'My Torrents') },
    { id: 'invitations', label: t('profile.tabs.invitations', 'Invitations') },
    { id: 'preferences', label: t('profile.tabs.preferences', 'Preferences') },
  ];

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="border-b border-border">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-text-secondary hover:text-text hover:border-border'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {children}
          </div>
        )}
        {activeTab === 'ranks' && (
          <RankTab profile={profile} />
        )}
        {activeTab === 'activity' && (
          <RecentActivity />
        )}
        {activeTab === 'torrents' && (
          <div className="bg-surface rounded-lg border border-border p-6">
            <UserTorrents />
          </div>
        )}
        {activeTab === 'invitations' && (
          <ProfileInvitations />
        )}
        {activeTab === 'preferences' && (
          <ProfilePreferences />
        )}
      </div>
    </div>
  );
}
