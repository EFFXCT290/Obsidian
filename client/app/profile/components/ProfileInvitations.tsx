'use client';

import { useEffect, useState } from 'react';
import { useI18n } from '@/app/hooks/useI18n';
import useSWR from 'swr';

interface InviteItem { id: string; code: string; createdAt: string; usedById?: string | null; expiresAt?: string | null }

export default function ProfileInvitations() {
  const { t } = useI18n();
  const [inviteLink, setInviteLink] = useState('');

  const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
  const { data, isLoading, mutate } = useSWR(token ? ['/api/user/invites', token] : null, async ([url, _token]) => {
    const headers: HeadersInit = { 'Content-Type': 'application/json' };
    if (_token) headers['Authorization'] = `Bearer ${_token as string}`;
    const res = await fetch(url as string, { headers, cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to fetch invites');
    return res.json() as Promise<{ invites: InviteItem[]; availableInvites: number; maxInvitesPerUser?: number; registrationMode?: string }>;
  });

  const invites = data?.invites || [];
  const available = data?.availableInvites || 0;
  const maxInvitesPerUser = (data?.maxInvitesPerUser as string | number | undefined) ?? 5;
  const isUnlimited = maxInvitesPerUser === '∞';
  const regMode = (data?.registrationMode as string | undefined) ?? 'OPEN';
  const invitesDisabled = regMode !== 'INVITE';

  // Estado de reloj para re-renderizar y actualizar la cuenta atrás
  const [nowTs, setNowTs] = useState<number>(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNowTs(Date.now()), 30_000); // actualiza cada 30s
    return () => clearInterval(id);
  }, []);

  const formatRelative = (iso?: string | null) => {
    if (!iso) return t('profile.invitations.noExpiry', 'No expiry');
    const target = new Date(iso).getTime();
    const diffSec = Math.floor((target - nowTs) / 1000);
    if (diffSec <= 0) return t('profile.invitations.expired', 'Expired');
    const d = Math.floor(diffSec / 86400);
    const h = Math.floor((diffSec % 86400) / 3600);
    const m = Math.floor((diffSec % 3600) / 60);
    if (d > 0) return `${d}d ${h}h`;
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  };

  const isActive = (inv: InviteItem) => {
    if (inv.usedById) return false;
    if (!inv.expiresAt) return true;
    return new Date(inv.expiresAt) > new Date();
  };

  const createInvite = async () => {
    const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};
    const { showNotification } = await import('@/app/utils/notifications');
    try {
      showNotification('Creando invitación...', 'success');
      const res = await fetch('/api/user/invites', { method: 'POST', headers });
      const data = await res.json();
      if (!res.ok) {
        showNotification(data?.error || 'Error al crear la invitación', 'error');
        throw new Error(data?.error || 'Failed');
      }
      setInviteLink(data.inviteLink);
      showNotification('Invitación creada', 'success');
      await mutate();
    } catch {
      // ya se mostró un toast con detalle arriba si existía
    }
  };

  const cancelInvite = async (id: string) => {
    const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};
    const { showNotification } = await import('@/app/utils/notifications');
    try {
      const res = await fetch(`/api/user/invites?id=${id}`, { method: 'DELETE', headers });
      const data = await res.json();
      if (!res.ok) {
        showNotification(data?.error || 'Error al cancelar la invitación', 'error');
        throw new Error(data?.error || 'Failed');
      }
      showNotification('Invitación cancelada', 'success');
      await mutate();
    } catch {
      // ya se mostró un toast con detalle arriba si existía
    }
  };

  const shareLinkFor = (code: string) => {
    if (typeof window === 'undefined') return '';
    return `${window.location.origin}/auth/signup/${code}`;
  };

  return (
    <div className="bg-surface rounded-lg border border-border p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-text">{t('profile.sections.invitations', 'Invitations')}</h2>
        <div className="text-sm text-text-secondary">
          {t('profile.invitations.available', 'Available invites')}: 
          <span className={`font-semibold ${isUnlimited ? 'text-green' : 'text-text'}`}>
            {isUnlimited ? '∞' : available}
          </span>
          {' / '}
          {isUnlimited ? (
            <span className="text-green font-semibold">∞</span>
          ) : (
            <span className="text-text">{maxInvitesPerUser}</span>
          )}
        </div>
      </div>

      <div className="mb-4">
        <button disabled={invitesDisabled || (!isUnlimited && !available)} onClick={createInvite} className="px-4 py-2 bg-primary text-background rounded disabled:opacity-50">
          {t('profile.invitations.create', 'Create Invitation')}
        </button>
        {invitesDisabled && (
          <div className="mt-2 text-xs text-text-secondary">
            {t('profile.invitations.disabledByMode', 'Invitations are currently disabled by registration mode. You can keep your invites, but cannot create or use them now.')}
          </div>
        )}
      </div>

      {inviteLink && (
        <div className="p-3 bg-surface-light rounded border border-border mb-4">
          <div className="text-sm text-text-secondary mb-2">{t('profile.invitations.generated.title', 'Invitation link')}</div>
          <div className="flex gap-2">
            <input readOnly className="flex-1 px-3 py-2 bg-background border border-border rounded text-text" value={inviteLink} />
            <button onClick={async () => { await navigator.clipboard.writeText(inviteLink); setInviteLink(''); const { showNotification } = await import('@/app/utils/notifications'); showNotification('Enlace copiado', 'success'); }} className="px-3 py-2 border border-green text-green rounded active:scale-95 transition-transform">{t('profile.actions.copy', 'Copy')}</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {isLoading ? (
          <div className="text-text-secondary">{t('common.loading', 'Loading...')}</div>
        ) : invites.length === 0 ? (
          <div className="text-text-secondary">{t('profile.invitations.none', 'No active invitations')}</div>
        ) : invites.map(inv => {
          const active = isActive(inv);
          const link = shareLinkFor(inv.code);
          const disabledRow = invitesDisabled;
          return (
            <div key={inv.id} className="flex items-center justify-between p-3 border border-border rounded">
              <div className="min-w-0">
                <div className="text-sm font-mono truncate">{inv.code}</div>
                <div className="text-xs text-text-secondary mt-1">
                  {active ? (
                    <>
                      {t('profile.invitations.expires', 'Expires')}: <span className="text-green font-semibold">{formatRelative(inv.expiresAt)}</span>
                    </>
                  ) : (
                    <>
                      {t('profile.invitations.status', 'Status')}: {inv.usedById ? t('profile.invitations.used', 'Used') : t('profile.invitations.expired', 'Expired')}
                    </>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
            <button disabled={disabledRow} onClick={async () => { await navigator.clipboard.writeText(link); const { showNotification } = await import('@/app/utils/notifications'); showNotification('Enlace copiado', 'success'); }} className="px-3 py-1 text-sm border border-green text-green rounded active:scale-95 transition-transform disabled:opacity-50">
                  {t('profile.actions.copy', 'Copy')}
                </button>
                <button disabled={!active || disabledRow} onClick={() => cancelInvite(inv.id)} className="px-3 py-1 text-sm border border-error text-error rounded disabled:opacity-50 active:scale-95 transition-transform">
                  {t('profile.invitations.active.cancel', 'Cancel')}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}


