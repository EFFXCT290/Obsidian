'use client';

import { useEffect, useState } from 'react';
import { Upload } from '@styled-icons/boxicons-regular/Upload';
import { Download } from '@styled-icons/boxicons-regular/Download';
import { BarChartSquare } from '@styled-icons/boxicons-regular/BarChartSquare';
import { Award } from '@styled-icons/boxicons-regular/Award';

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
        let headers: Record<string, string> = {};
        try {
          const token = localStorage.getItem('authToken');
          if (token) headers['Authorization'] = `Bearer ${token}`;
        } catch {}
        const res = await fetch('/api/user/current', { headers, cache: 'no-store' });
        const data = await res.json();
        if (data && data.user) {
          setUserStats({
            uploaded: Number(data.user.uploaded || 0),
            downloaded: Number(data.user.downloaded || 0),
            ratio: typeof data.user.ratio === 'number' ? data.user.ratio : 0,
            bonusPoints: Number(data.user.bonusPoints || 0),
            hitnrunCount: Number(data.user.hitnrunCount || 0),
          });
        }
      } catch {
        // ignore
      }
    })();
  }, []);

  if (!userStats) {
    return (
      <div className="hidden lg:flex items-center space-x-4 text-sm text-text-secondary">
        <div className="w-40 h-4 bg-text-secondary/10 rounded animate-pulse" />
      </div>
    );
  }

  return (
    <div className="hidden lg:flex items-center space-x-4 text-sm text-text-secondary">
      <div className="flex items-center space-x-1">
        <Upload size={18} className="text-green-500" />
        <span>{formatBytes(userStats.uploaded)}</span>
      </div>
      <div className="flex items-center space-x-1">
        <Download size={18} className="text-red-500" />
        <span>{formatBytes(userStats.downloaded)}</span>
      </div>
      <div className="flex items-center space-x-1">
        <BarChartSquare size={18} className="text-blue-500" />
        <span>{userStats.ratio.toFixed(2)}</span>
      </div>
      <div className="flex items-center space-x-1">
        <Award size={18} className="text-yellow-500" />
        <span>{userStats.bonusPoints} BP</span>
      </div>
      <div className="flex items-center space-x-1">
        <Award size={18} className="text-pink-500" />
        <span>{userStats.hitnrunCount} H&R</span>
      </div>
    </div>
  );
}


