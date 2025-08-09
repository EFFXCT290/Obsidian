/**
 * Custom hook for loading user avatars via the new API (proxy routes)
 * Adapts the original hook to fetch from /api/user/avatar/[id]
 */

'use client';

import useSWR from 'swr';

interface AvatarResponse {
  image: string; // base64 string or empty if not set
  userId: string;
}

interface UseAvatarReturn {
  avatarUrl: string | null;
  isLoading: boolean;
  error: Error | null;
  mutate: () => void;
}
export function useAvatar(userId?: string): UseAvatarReturn {
  const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
  const key = userId ? ['/api/user/avatar/' + userId, token] : null;
  const { data, isLoading, error, mutate } = useSWR<AvatarResponse>(
    key,
    async ([url, _token]) => {
      const res = await fetch(url as string, {
        headers: _token ? { Authorization: `Bearer ${_token as string}` } : {},
        cache: 'no-store',
      });
      if (res.status === 404) return { image: '', userId: '' };
      if (!res.ok) throw new Error(`Failed to fetch avatar: ${res.status}`);
      return res.json();
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 5 * 60 * 1000,
      errorRetryCount: 2,
      errorRetryInterval: 1000,
    }
  );

  const avatarUrl = data?.image ? `data:image/jpeg;base64,${data.image}` : null;

  return {
    avatarUrl,
    isLoading,
    error: (error as Error) || null,
    mutate,
  };
}

export function useCurrentUserAvatar(): UseAvatarReturn {
  // Read user from localStorage (set on auth) to avoid NextAuth dependency
  let userId: string | undefined;
  try {
    const raw = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
    if (raw) {
      const parsed = JSON.parse(raw) as { id?: string };
      userId = parsed?.id;
    }
  } catch {
    // ignore
  }
  return useAvatar(userId);
}


