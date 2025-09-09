import { Suspense } from 'react';
import { headers } from 'next/headers';
import AdminDashboardWrapper from '../components/AdminDashboardWrapper';
import { getPreferredLanguage, serverT } from '@/app/lib/server-i18n';
import UsersClient from './components/UsersClient';
import { LanguageSelector } from '@/app/components/LanguageSelector';
import { LanguageSync } from '@/app/components/LanguageSync';

function UsersSkeleton() {
  return (
    <div className="space-y-6">
      <div className="mb-8 animate-pulse">
        <div className="h-8 bg-surface-light rounded mb-2" />
        <div className="h-4 bg-surface-light rounded" />
      </div>
      <div className="space-y-4">
        <div className="h-6 bg-surface-light rounded w-40" />
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-surface-light rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default async function AdminUsersPage() {
  const hdrs = await headers();
  const language = await getPreferredLanguage(hdrs);

  const translations = {
    title: serverT('admin.users.title', language),
    description: serverT('admin.users.description', language),
    search: serverT('admin.users.search', language),
    searching: serverT('admin.users.searching', language),
    searchPlaceholder: serverT('admin.users.searchPlaceholder', language),
    users: serverT('admin.users.users', language),
    noUsers: serverT('admin.users.noUsers', language),
    editUser: serverT('admin.users.editUser', language),
    userDetails: serverT('admin.users.userDetails', language),
    username: serverT('admin.users.username', language),
    email: serverT('admin.users.email', language),
    role: serverT('admin.users.role', language),
    status: serverT('admin.users.status', language),
    emailVerified: serverT('admin.users.emailVerified', language),
    createdAt: serverT('admin.users.createdAt', language),
    actions: serverT('admin.users.actions', language),
    edit: serverT('admin.users.edit', language),
    ban: serverT('admin.users.ban', language),
    unban: serverT('admin.users.unban', language),
    enable: serverT('admin.users.enable', language),
    promote: serverT('admin.users.promote', language),
    demote: serverT('admin.users.demote', language),
    close: serverT('admin.users.close', language),
    save: serverT('admin.users.save', language),
    saving: serverT('admin.users.saving', language),
    cancel: serverT('admin.users.cancel', language),
    confirmBan: serverT('admin.users.confirmBan', language),
    confirmUnban: serverT('admin.users.confirmUnban', language),
    confirmPromote: serverT('admin.users.confirmPromote', language),
    confirmDemote: serverT('admin.users.confirmDemote', language),
    userBanned: serverT('admin.users.userBanned', language),
    userUnbanned: serverT('admin.users.userUnbanned', language),
    userPromoted: serverT('admin.users.userPromoted', language),
    userDemoted: serverT('admin.users.userDemoted', language),
    userUpdated: serverT('admin.users.userUpdated', language),
    errorLoading: serverT('admin.users.errorLoading', language),
    errorUpdating: serverT('admin.users.errorUpdating', language),
    errorBanning: serverT('admin.users.errorBanning', language),
    errorUnbanning: serverT('admin.users.errorUnbanning', language),
    errorPromoting: serverT('admin.users.errorPromoting', language),
    errorDemoting: serverT('admin.users.errorDemoting', language),
    loading: serverT('admin.users.loading', language),
    roles: {
      USER: serverT('admin.users.roles.USER', language),
      MOD: serverT('admin.users.roles.MOD', language),
      ADMIN: serverT('admin.users.roles.ADMIN', language),
      OWNER: serverT('admin.users.roles.OWNER', language),
    },
    statuses: {
      ACTIVE: serverT('admin.users.statuses.ACTIVE', language),
      BANNED: serverT('admin.users.statuses.BANNED', language),
      DISABLED: serverT('admin.users.statuses.DISABLED', language),
    },
    transferFounder: serverT('admin.users.transferFounder', language),
    founderRoleWarning: serverT('admin.users.founderRoleWarning', language),
  };

  return (
    <AdminDashboardWrapper>
      <LanguageSync serverLanguage={language} />
      <div className="fixed bottom-4 left-4 z-50">
        <LanguageSelector currentLanguage={language} />
      </div>
      <Suspense fallback={<UsersSkeleton />}> 
        <UsersClient translations={translations} />
      </Suspense>
    </AdminDashboardWrapper>
  );
}
