import { Suspense } from 'react';
import { headers } from 'next/headers';
import AdminDashboardWrapper from '../components/AdminDashboardWrapper';
import { getPreferredLanguage, serverT } from '@/app/lib/server-i18n';
import PeerBanClient from './PeerBanClient';
import { LanguageSelector } from '@/app/components/LanguageSelector';
import { LanguageSync } from '@/app/components/LanguageSync';

function PeerBanSkeleton() {
  return (
    <div className="space-y-6">
      <div className="mb-8 animate-pulse">
        <div className="h-8 bg-surface-light rounded mb-2" />
        <div className="h-4 bg-surface-light rounded" />
      </div>
      <div className="space-y-4">
        <div className="h-6 bg-surface-light rounded w-40" />
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-24 bg-surface-light rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default async function AdminPeerBanPage() {
  const hdrs = await headers();
  const language = await getPreferredLanguage(hdrs);

  const translations = {
    title: serverT('admin.peerban.title', language),
    description: serverT('admin.peerban.description', language),
    addNew: serverT('admin.peerban.addNew', language),
    addPeerBan: serverT('admin.peerban.addPeerBan', language),
    editPeerBan: serverT('admin.peerban.editPeerBan', language),
    list: serverT('admin.peerban.list', language),
    userId: serverT('admin.peerban.userId', language),
    passkey: serverT('admin.peerban.passkey', language),
    peerId: serverT('admin.peerban.peerId', language),
    ip: serverT('admin.peerban.ip', language),
    reason: serverT('admin.peerban.reason', language),
    expiresAt: serverT('admin.peerban.expiresAt', language),
    noExpiration: serverT('admin.peerban.noExpiration', language),
    bannedBy: serverT('admin.peerban.bannedBy', language),
    createdAt: serverT('admin.peerban.createdAt', language),
    status: serverT('admin.peerban.status', language),
    active: serverT('admin.peerban.active', language),
    expired: serverT('admin.peerban.expired', language),
    permanent: serverT('admin.peerban.permanent', language),
    create: serverT('admin.peerban.create', language),
    update: serverT('admin.peerban.update', language),
    edit: serverT('admin.peerban.edit', language),
    delete: serverT('admin.peerban.delete', language),
    remove: serverT('admin.peerban.remove', language),
    cancel: serverT('admin.peerban.cancel', language),
    reasonRequired: serverT('admin.peerban.reasonRequired', language),
    banTypeRequired: serverT('admin.peerban.banTypeRequired', language),
    confirmDelete: serverT('admin.peerban.confirmDelete', language),
    noPeerBans: serverT('admin.peerban.noPeerBans', language),
    created: serverT('admin.peerban.created', language),
    removed: serverT('admin.peerban.removed', language),
    errorLoading: serverT('admin.peerban.errorLoading', language),
    errorCreating: serverT('admin.peerban.errorCreating', language),
    errorRemoving: serverT('admin.peerban.errorRemoving', language),
    filterBy: serverT('admin.peerban.filterBy', language),
    allBans: serverT('admin.peerban.allBans', language),
    activeBans: serverT('admin.peerban.activeBans', language),
    expiredBans: serverT('admin.peerban.expiredBans', language),
    searchBy: serverT('admin.peerban.searchBy', language),
    searchPlaceholder: serverT('admin.peerban.searchPlaceholder', language),
    banTypes: {
      userId: serverT('admin.peerban.banTypes.userId', language),
      passkey: serverT('admin.peerban.banTypes.passkey', language),
      peerId: serverT('admin.peerban.banTypes.peerId', language),
      ip: serverT('admin.peerban.banTypes.ip', language),
    },
  };

  return (
    <AdminDashboardWrapper>
      <LanguageSync serverLanguage={language} />
      <div className="fixed bottom-4 left-4 z-50">
        <LanguageSelector currentLanguage={language} />
      </div>
      <Suspense fallback={<PeerBanSkeleton />}> 
        <PeerBanClient translations={translations} />
      </Suspense>
    </AdminDashboardWrapper>
  );
}
