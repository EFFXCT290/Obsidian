'use client';

import { useI18n } from '../../hooks/useI18n';
import { Award } from '@styled-icons/boxicons-regular/Award';
import { TrendingUp } from '@styled-icons/boxicons-regular/TrendingUp';

interface RankTabProps {
  profile: {
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

export default function RankTab({ profile }: RankTabProps) {
  const { t } = useI18n();

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const calculateProgress = (current: number, required: number) => {
    if (required === 0) return 100;
    return Math.min((current / required) * 100, 100);
  };

  if (!profile) {
    return (
      <div className="bg-surface rounded-lg border border-border p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-text-secondary/10 rounded w-1/4"></div>
          <div className="h-32 bg-text-secondary/10 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Current Rank */}
      <div className="bg-surface rounded-lg border border-border p-6">
        <h3 className="text-lg font-semibold text-text mb-4 flex items-center gap-2">
          <Award size={20} />
          Current Rank
        </h3>
        
        {profile.rank ? (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div 
                className="w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-xl"
                style={{ backgroundColor: profile.rankData?.rank?.color || '#8B5CF6' }}
              >
                {profile.rank.charAt(0).toUpperCase()}
              </div>
              <div>
                <h4 
                  className="text-2xl font-bold"
                  style={{ color: profile.rankData?.rank?.color || '#8B5CF6' }}
                >
                  {profile.rank}
                </h4>
                <p className="text-text-secondary">Your current rank</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <Award size={48} className="mx-auto text-text-secondary/50 mb-4" />
            <p className="text-text-secondary">No rank assigned yet</p>
          </div>
        )}
      </div>

      {/* Next Rank Progress */}
      {profile.rankData?.nextRank && (
        <div className="bg-surface rounded-lg border border-border p-6">
          <h3 className="text-lg font-semibold text-text mb-4 flex items-center gap-2">
            <TrendingUp size={20} />
            Next Rank Progress
          </h3>
          
          <div className="space-y-6">
            {/* Next Rank Info */}
            <div className="flex items-center gap-4">
              <div 
                className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold"
                style={{ backgroundColor: profile.rankData.nextRank.color || '#6B7280' }}
              >
                {profile.rankData.nextRank.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h4 
                  className="text-xl font-semibold"
                  style={{ color: profile.rankData.nextRank.color || '#6B7280' }}
                >
                  {profile.rankData.nextRank.name}
                </h4>
                <p className="text-text-secondary">Next rank to achieve</p>
              </div>
            </div>

            {/* Progress Bars */}
            <div className="space-y-4">
              {/* Upload Progress */}
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-text-secondary">Upload Progress</span>
                  <span className="text-text">
                    {formatBytes(profile.uploaded)} / {formatBytes(Number(profile.rankData.nextRank.minUpload))}
                  </span>
                </div>
                <div className="w-full bg-background rounded-full h-2">
                  <div 
                    className="bg-primary h-2 rounded-full transition-all duration-300"
                    style={{ 
                      width: `${calculateProgress(profile.uploaded, Number(profile.rankData.nextRank.minUpload))}%` 
                    }}
                  ></div>
                </div>
                <div className="text-xs text-text-secondary mt-1">
                  {calculateProgress(profile.uploaded, Number(profile.rankData.nextRank.minUpload)).toFixed(1)}% complete
                </div>
              </div>

              {/* Download Progress */}
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-text-secondary">Download Progress</span>
                  <span className="text-text">
                    {formatBytes(profile.downloaded)} / {formatBytes(Number(profile.rankData.nextRank.minDownload))}
                  </span>
                </div>
                <div className="w-full bg-background rounded-full h-2">
                  <div 
                    className="bg-primary h-2 rounded-full transition-all duration-300"
                    style={{ 
                      width: `${calculateProgress(profile.downloaded, Number(profile.rankData.nextRank.minDownload))}%` 
                    }}
                  ></div>
                </div>
                <div className="text-xs text-text-secondary mt-1">
                  {calculateProgress(profile.downloaded, Number(profile.rankData.nextRank.minDownload)).toFixed(1)}% complete
                </div>
              </div>

              {/* Ratio Progress */}
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-text-secondary">Ratio Progress</span>
                  <span className="text-text">
                    {profile.ratio.toFixed(2)} / {profile.rankData.nextRank.minRatio.toFixed(2)}
                  </span>
                </div>
                <div className="w-full bg-background rounded-full h-2">
                  <div 
                    className="bg-primary h-2 rounded-full transition-all duration-300"
                    style={{ 
                      width: `${calculateProgress(profile.ratio, profile.rankData.nextRank.minRatio)}%` 
                    }}
                  ></div>
                </div>
                <div className="text-xs text-text-secondary mt-1">
                  {calculateProgress(profile.ratio, profile.rankData.nextRank.minRatio).toFixed(1)}% complete
                </div>
              </div>
            </div>

            {/* Overall Progress */}
            <div className="bg-background rounded-lg p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-text">Overall Progress</span>
                <span className="text-sm text-text-secondary">
                  {profile.rankData.progress ? 
                    Math.round((profile.rankData.progress.upload + profile.rankData.progress.download + profile.rankData.progress.ratio) / 3) 
                    : 0}%
                </span>
              </div>
              <div className="w-full bg-surface rounded-full h-3">
                <div 
                  className="bg-gradient-to-r from-primary to-primary-dark h-3 rounded-full transition-all duration-500"
                  style={{ 
                    width: `${profile.rankData.progress ? 
                      Math.round((profile.rankData.progress.upload + profile.rankData.progress.download + profile.rankData.progress.ratio) / 3) 
                      : 0}%` 
                  }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* No Next Rank */}
      {!profile.rankData?.nextRank && profile.rank && (
        <div className="bg-surface rounded-lg border border-border p-6">
          <div className="text-center py-8">
            <Award size={48} className="mx-auto text-yellow-500 mb-4" />
            <h3 className="text-lg font-semibold text-text mb-2">Maximum Rank Achieved!</h3>
            <p className="text-text-secondary">You have reached the highest available rank.</p>
          </div>
        </div>
      )}
    </div>
  );
}
