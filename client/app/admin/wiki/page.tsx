import { Suspense } from 'react';
import { headers } from 'next/headers';
import AdminDashboardWrapper from '../components/AdminDashboardWrapper';
import { getPreferredLanguage, serverT } from '@/app/lib/server-i18n';
import WikiClient from './WikiClient';

function WikiSkeleton() {
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

export default async function AdminWikiPage() {
  const hdrs = await headers();
  const language = await getPreferredLanguage(hdrs);

  const translations = {
    title: serverT('admin.wiki.title', language),
    description: serverT('admin.wiki.description', language),
    addNew: serverT('admin.wiki.addNew', language),
    addWikiPage: serverT('admin.wiki.addWikiPage', language),
    editWikiPage: serverT('admin.wiki.editWikiPage', language),
    list: serverT('admin.wiki.list', language),
    slug: serverT('admin.wiki.slug', language),
    titleField: serverT('admin.wiki.titleField', language),
    content: serverT('admin.wiki.content', language),
    parentPage: serverT('admin.wiki.parentPage', language),
    noParent: serverT('admin.wiki.noParent', language),
    locked: serverT('admin.wiki.locked', language),
    visible: serverT('admin.wiki.visible', language),
    createdBy: serverT('admin.wiki.createdBy', language),
    updatedBy: serverT('admin.wiki.updatedBy', language),
    createdAt: serverT('admin.wiki.createdAt', language),
    updatedAt: serverT('admin.wiki.updatedAt', language),
    create: serverT('admin.wiki.create', language),
    update: serverT('admin.wiki.update', language),
    edit: serverT('admin.wiki.edit', language),
    delete: serverT('admin.wiki.delete', language),
    lock: serverT('admin.wiki.lock', language),
    unlock: serverT('admin.wiki.unlock', language),
    show: serverT('admin.wiki.show', language),
    hide: serverT('admin.wiki.hide', language),
    cancel: serverT('admin.wiki.cancel', language),
    slugRequired: serverT('admin.wiki.slugRequired', language),
    titleRequired: serverT('admin.wiki.titleRequired', language),
    contentRequired: serverT('admin.wiki.contentRequired', language),
    confirmDelete: serverT('admin.wiki.confirmDelete', language),
    noWikiPages: serverT('admin.wiki.noWikiPages', language),
    created: serverT('admin.wiki.created', language),
    updated: serverT('admin.wiki.updated', language),
    deleted: serverT('admin.wiki.deleted', language),
    lockedSuccess: serverT('admin.wiki.lockedSuccess', language),
    unlockedSuccess: serverT('admin.wiki.unlockedSuccess', language),
    shownSuccess: serverT('admin.wiki.shownSuccess', language),
    hiddenSuccess: serverT('admin.wiki.hiddenSuccess', language),
    errorLoading: serverT('admin.wiki.errorLoading', language),
    errorCreating: serverT('admin.wiki.errorCreating', language),
    errorUpdating: serverT('admin.wiki.errorUpdating', language),
    errorDeleting: serverT('admin.wiki.errorDeleting', language),
    errorLocking: serverT('admin.wiki.errorLocking', language),
    errorUnlocking: serverT('admin.wiki.errorUnlocking', language),
    errorShowing: serverT('admin.wiki.errorShowing', language),
    errorHiding: serverT('admin.wiki.errorHiding', language),
  };

  return (
    <AdminDashboardWrapper>
      <Suspense fallback={<WikiSkeleton />}> 
        <WikiClient translations={translations} />
      </Suspense>
    </AdminDashboardWrapper>
  );
}
