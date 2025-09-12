'use client';

import { useEffect, useState } from 'react';
import { Upload } from '@styled-icons/boxicons-regular/Upload';
import { Download } from '@styled-icons/boxicons-regular/Download';
import { BarChartSquare } from '@styled-icons/boxicons-regular/BarChartSquare';
import { Award } from '@styled-icons/boxicons-regular/Award';
import { API_BASE_URL } from '@/lib/api';

interface UserStats {
  uploaded: number;
  downloaded: number;
  ratio: number;
  bonusPoints: number;
  hitnrunCount: number;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export default function UserStatsBar() {
  const [userStats, setUserStats] = useState<UserStats | null>(null);

  useEffect(() => {
    (async () => {
      try {
        // Forward JWT from localStorage as Authorization header
        const headers: Record<string, string> = {};
        try {
          const token = localStorage.getItem('authToken');
          if (token) headers['Authorization'] = `Bearer ${token}`;
        } catch {}
        const res = await fetch(`${API_BASE_URL}/auth/profile`, { headers, cache: 'no-store' });
        const data = await res.json();
        console.log('UserStatsBar API response:', data);
        if (data) {
          setUserStats({
            uploaded: Number(data.upload || 0),
            downloaded: Number(data.download || 0),
            ratio: typeof data.ratio === 'number' ? data.ratio : 0,
            bonusPoints: Number(data.bonusPoints || 0),
            hitnrunCount: Number(data.hitAndRunCount || 0),
          });
        }
      } catch (error) {
        console.error('Error fetching user stats:', error);
      }
    })();
  }, []);

  if (!userStats) {
    return (
      <div className="flex items-center space-x-2 sm:space-x-4 text-sm sm:text-base text-text-secondary">
        <div className="w-24 sm:w-32 h-4 bg-text-secondary/10 rounded animate-pulse" />
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-2 sm:space-x-4 text-sm sm:text-base text-text-secondary">
      <div className="flex items-center space-x-1">
        <Upload size={16} className="text-green-500" />
        <span>{formatBytes(userStats.uploaded)}</span>
      </div>
      <div className="flex items-center space-x-1">
        <Download size={16} className="text-red-500" />
        <span>{formatBytes(userStats.downloaded)}</span>
      </div>
      <div className="flex items-center space-x-1">
        <BarChartSquare size={16} className="text-blue-500" />
        <span>{userStats.ratio.toFixed(2)}</span>
      </div>
      <div className="flex items-center space-x-1">
        <Award size={16} className="text-yellow-500" />
        <span>{userStats.bonusPoints} BP</span>
      </div>
      <div className="flex items-center space-x-1">
        <Award size={16} className="text-pink-500" />
        <span>{userStats.hitnrunCount} H&R</span>
      </div>
    </div>
  );
}


