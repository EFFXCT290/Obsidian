import { Suspense } from 'react';
import { headers } from 'next/headers';
import AdminDashboardWrapper from '../components/AdminDashboardWrapper';
import { getPreferredLanguage, serverT } from '@/app/lib/server-i18n';
import CategoriesClient from './CategoriesClient';
import { LanguageSelector } from '@/app/components/LanguageSelector';
import { LanguageSync } from '@/app/components/LanguageSync';

function CategoriesSkeleton() {
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

export default async function AdminCategoriesPage() {
  const hdrs = await headers();
  const language = await getPreferredLanguage(hdrs);

  const translations = {
    title: serverT('admin.categories.title', language),
    description: serverT('admin.categories.description', language),
    addNew: serverT('admin.categories.addNew', language),
    addCategory: serverT('admin.categories.addCategory', language),
    editCategory: serverT('admin.categories.editCategory', language),
    list: serverT('admin.categories.list', language),
    name: serverT('admin.categories.name', language),
    descriptionField: serverT('admin.categories.description', language),
    icon: serverT('admin.categories.icon', language),
    order: serverT('admin.categories.order', language),
    parentCategory: serverT('admin.categories.parentCategory', language),
    noParent: serverT('admin.categories.noParent', language),
    torrents: serverT('admin.categories.torrents', language),
    requests: serverT('admin.categories.requests', language),
    create: serverT('admin.categories.create', language),
    update: serverT('admin.categories.update', language),
    edit: serverT('admin.categories.edit', language),
    delete: serverT('admin.categories.delete', language),
    cancel: serverT('admin.categories.cancel', language),
    nameRequired: serverT('admin.categories.nameRequired', language),
    confirmDelete: serverT('admin.categories.confirmDelete', language),
    noCategories: serverT('admin.categories.noCategories', language),
    created: serverT('admin.categories.created', language),
    updated: serverT('admin.categories.updated', language),
    deleted: serverT('admin.categories.deleted', language),
    errorLoading: serverT('admin.categories.errorLoading', language),
    errorCreating: serverT('admin.categories.errorCreating', language),
    errorUpdating: serverT('admin.categories.errorUpdating', language),
    errorDeleting: serverT('admin.categories.errorDeleting', language),
    dragToReorder: serverT('admin.categories.dragToReorder', language),
    reorderSuccess: serverT('admin.categories.reorderSuccess', language),
    reorderError: serverT('admin.categories.reorderError', language),
    moveToCategory: serverT('admin.categories.moveToCategory', language),
    moveToMain: serverT('admin.categories.moveToMain', language),
    moveSuccess: serverT('admin.categories.moveSuccess', language),
    moveError: serverT('admin.categories.moveError', language),
    dropZone: serverT('admin.categories.dropZone', language),
    dropHereToMove: serverT('admin.categories.dropHereToMove', language),
    errorHasSubcategories: serverT('admin.categories.errorHasSubcategories', language),
    errorSubcategoryParent: serverT('admin.categories.errorSubcategoryParent', language),
    errorCircularReference: serverT('admin.categories.errorCircularReference', language),
    errorSelfParent: serverT('admin.categories.errorSelfParent', language),
  };

  return (
    <AdminDashboardWrapper>
      <LanguageSync serverLanguage={language} />
      <div className="fixed bottom-4 left-4 z-50">
        <LanguageSelector currentLanguage={language} />
      </div>
      <Suspense fallback={<CategoriesSkeleton />}> 
        <CategoriesClient translations={translations} />
      </Suspense>
    </AdminDashboardWrapper>
  );
}
