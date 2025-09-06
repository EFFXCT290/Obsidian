'use client';

import { useState } from 'react';
import { useI18n } from '../../hooks/useI18n';
import RecentActivity from './RecentActivity';

interface ProfileTabsProps {
  children: React.ReactNode;
}

export default function ProfileTabs({ children }: ProfileTabsProps) {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState('overview');

  const tabs = [
    { id: 'overview', label: t('profile.tabs.overview', 'Overview') },
    { id: 'activity', label: t('profile.tabs.activity', 'Recent Activity') },
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
        {activeTab === 'activity' && (
          <div>
            <RecentActivity />
          </div>
        )}
      </div>
    </div>
  );
}
