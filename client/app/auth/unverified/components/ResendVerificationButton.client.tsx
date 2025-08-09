"use client";

import React from 'react';

export default function ResendVerificationButton({ label }: { label: string }) {
  const onClick = async () => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
      const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await fetch('/api/auth/request-email-verification', { method: 'POST', headers });
      const data = await res.json();
      const { showNotification } = await import('@/app/utils/notifications');
      if (!res.ok) {
        showNotification(data?.error || 'Error sending verification email', 'error');
      } else {
        showNotification('Verification email sent', 'success');
      }
    } catch {
      const { showNotification } = await import('@/app/utils/notifications');
      showNotification('Error sending verification email', 'error');
    }
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className="px-4 py-2 border border-primary text-primary rounded active:scale-95 transition-transform"
    >
      {label}
    </button>
  );
}


