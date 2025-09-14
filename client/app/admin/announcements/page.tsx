import { Suspense } from 'react';
import { headers } from 'next/headers';
import AdminDashboardWrapper from '../components/AdminDashboardWrapper';
import { getPreferredLanguage, serverT } from '@/app/lib/server-i18n';
import AnnouncementsClient from './AnnouncementsClient';

function AnnouncementsSkeleton() {
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

export default async function AdminAnnouncementsPage() {
  const hdrs = await headers();
  const language = await getPreferredLanguage(hdrs);

  const translations = {
    title: serverT('admin.announcements.title', language),
    description: serverT('admin.announcements.description', language),
    addNew: serverT('admin.announcements.addNew', language),
    addAnnouncement: serverT('admin.announcements.addAnnouncement', language),
    editAnnouncement: serverT('admin.announcements.editAnnouncement', language),
    list: serverT('admin.announcements.list', language),
    titleField: serverT('admin.announcements.titleField', language),
    body: serverT('admin.announcements.body', language),
    pinned: serverT('admin.announcements.pinned', language),
    visible: serverT('admin.announcements.visible', language),
    createdBy: serverT('admin.announcements.createdBy', language),
    createdAt: serverT('admin.announcements.createdAt', language),
    updatedAt: serverT('admin.announcements.updatedAt', language),
    create: serverT('admin.announcements.create', language),
    update: serverT('admin.announcements.update', language),
    edit: serverT('admin.announcements.edit', language),
    delete: serverT('admin.announcements.delete', language),
    pin: serverT('admin.announcements.pin', language),
    unpin: serverT('admin.announcements.unpin', language),
    show: serverT('admin.announcements.show', language),
    hide: serverT('admin.announcements.hide', language),
    cancel: serverT('admin.announcements.cancel', language),
    titleRequired: serverT('admin.announcements.titleRequired', language),
    bodyRequired: serverT('admin.announcements.bodyRequired', language),
    confirmDelete: serverT('admin.announcements.confirmDelete', language),
    noAnnouncements: serverT('admin.announcements.noAnnouncements', language),
    created: serverT('admin.announcements.created', language),
    updated: serverT('admin.announcements.updated', language),
    deleted: serverT('admin.announcements.deleted', language),
    pinnedSuccess: serverT('admin.announcements.pinnedSuccess', language),
    unpinnedSuccess: serverT('admin.announcements.unpinnedSuccess', language),
    shownSuccess: serverT('admin.announcements.shownSuccess', language),
    hiddenSuccess: serverT('admin.announcements.hiddenSuccess', language),
    errorLoading: serverT('admin.announcements.errorLoading', language),
    errorCreating: serverT('admin.announcements.errorCreating', language),
    errorUpdating: serverT('admin.announcements.errorUpdating', language),
    errorDeleting: serverT('admin.announcements.errorDeleting', language),
    errorPinning: serverT('admin.announcements.errorPinning', language),
    errorUnpinning: serverT('admin.announcements.errorUnpinning', language),
    errorShowing: serverT('admin.announcements.errorShowing', language),
    errorHiding: serverT('admin.announcements.errorHiding', language),
  };

  return (
    <AdminDashboardWrapper>
      <Suspense fallback={<AnnouncementsSkeleton />}> 
        <AnnouncementsClient translations={translations} />
      </Suspense>
    </AdminDashboardWrapper>
  );
}
