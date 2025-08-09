"use client";

import React from 'react';
import { useRouter } from 'next/navigation';

export default function LogoutButton({ label, toast }: { label: string; toast: string }) {
  const router = useRouter();

  const onClick = async () => {
    try {
      // Clear local auth artifacts
      if (typeof window !== 'undefined') {
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
      }
      const { showNotification } = await import('@/app/utils/notifications');
      showNotification(toast, 'success');
      router.push('/auth/signin');
    } catch {
      router.push('/auth/signin');
    }
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className="px-4 py-2 border border-error text-error rounded active:scale-95 transition-transform"
    >
      {label}
    </button>
  );
}


