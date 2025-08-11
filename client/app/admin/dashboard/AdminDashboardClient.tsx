'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface OverviewStats {
  users?: number;
  torrents?: number;
  requests?: number;
  downloads?: number;
  peers?: number;
  seeding?: number;
  leeching?: number;
}

export default function AdminDashboardClient({ language }: { language?: string }) {
  const [role, setRole] = useState<string | null>(null);
  const [stats, setStats] = useState<OverviewStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
        const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

        const resUser = await fetch('/api/user/current', { headers, cache: 'no-store' });
        const dataUser = await resUser.json();
        const userRole = dataUser?.user?.role as string | undefined;
        setRole(userRole || null);

        if (userRole === 'ADMIN' || userRole === 'OWNER') {
          const resStats = await fetch('/api/admin/overview-stats', { headers, cache: 'no-store' });
          if (resStats.ok) {
            const data = await resStats.json();
            setStats(data || null);
          } else {
            setStats(null);
          }
        }
      } catch {
        setRole(null);
        setStats(null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-text">
        <div className="max-w-7xl mx-auto px-6 py-10">
          <div className="h-8 w-48 bg-text-secondary/10 rounded animate-pulse mb-6" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1,2,3,4,5,6,7].map(i => (
              <div key={i} className="p-6 bg-surface border border-border rounded-lg">
                <div className="h-4 w-24 bg-text-secondary/10 rounded mb-2" />
                <div className="h-8 w-16 bg-text-secondary/10 rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!(role === 'ADMIN' || role === 'OWNER')) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-text">
        <div className="text-center p-8 bg-surface border border-border rounded-lg">
          <h1 className="text-2xl font-bold mb-2">Forbidden</h1>
          <p className="text-text-secondary">Admins only</p>
          <Link href="/dashboard" className="mt-4 inline-block px-4 py-2 bg-primary text-background rounded">Back</Link>
        </div>
      </div>
    );
  }

  const statCards = [
    { key: 'users', label: 'Users', value: stats?.users },
    { key: 'torrents', label: 'Torrents', value: stats?.torrents },
    { key: 'requests', label: 'Requests', value: stats?.requests },
    { key: 'downloads', label: 'Downloads', value: stats?.downloads },
    { key: 'peers', label: 'Peers', value: stats?.peers },
    { key: 'seeding', label: 'Seeding', value: stats?.seeding },
    { key: 'leeching', label: 'Leeching', value: stats?.leeching },
  ];

  return (
    <div className="min-h-screen bg-background text-text">
      <div className="max-w-7xl mx-auto px-6 py-10">
        <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((stat) => (
            <div key={stat.key} className="p-6 bg-surface border border-border rounded-lg">
              <div className="text-sm text-text-secondary">{stat.label}</div>
              <div className="text-3xl font-bold">{stat.value ?? '-'}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}


