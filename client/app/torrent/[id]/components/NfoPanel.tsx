'use client';

import useSWR from 'swr';
import { API_BASE_URL } from '@/lib/api';
import { useI18n } from '@/app/hooks/useI18n';

export default function NfoPanel({ torrentId }: { torrentId: string }) {
  const { t } = useI18n();
  const { data, isLoading } = useSWR<string>(
    `${API_BASE_URL}/torrent/${torrentId}/nfo`,
    async (key: string) => {
      const headers: Record<string, string> = {};
      try {
        const token = localStorage.getItem('authToken');
        if (token) headers['Authorization'] = `Bearer ${token}`;
      } catch {}
      const res = await fetch(key, { headers });
      if (!res.ok) return '';
      const text = await res.text();
      return text;
    }
  );
  if (isLoading || !data) return null;
  return (
    <div className="bg-surface border border-border rounded p-4">
      <div className="text-text font-semibold mb-2">{t('torrentDetail.nfo.title','Archivo NFO')}</div>
      <pre className="text-xs text-text-secondary whitespace-pre-wrap max-h-96 overflow-auto">{data}</pre>
    </div>
  );
}


