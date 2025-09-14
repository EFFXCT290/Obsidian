import { Suspense } from 'react';
import { headers } from 'next/headers';
import AdminDashboardWrapper from '../components/AdminDashboardWrapper';
import RanksClient from './RanksClient';
import { getPreferredLanguage, serverT } from '@/app/lib/server-i18n';

function RanksSkeleton() {
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

export default async function AdminRanksPage() {
  const headersList = await headers();
  const language = await getPreferredLanguage(headersList);

  const translations = {
    title: serverT('admin.ranks.title', language),
    description: serverT('admin.ranks.description', language),
    systemEnabled: serverT('admin.ranks.systemEnabled', language),
    systemDisabled: serverT('admin.ranks.systemDisabled', language),
    toggleSystem: serverT('admin.ranks.toggleSystem', language),
    addNew: serverT('admin.ranks.addNew', language),
    addRank: serverT('admin.ranks.addRank', language),
    editRank: serverT('admin.ranks.editRank', language),
    list: serverT('admin.ranks.list', language),
    name: serverT('admin.ranks.name', language),
    descriptionField: serverT('admin.ranks.descriptionField', language),
    order: serverT('admin.ranks.order', language),
    minUpload: serverT('admin.ranks.minUpload', language),
    minDownload: serverT('admin.ranks.minDownload', language),
    minRatio: serverT('admin.ranks.minRatio', language),
    color: serverT('admin.ranks.color', language),
    create: serverT('admin.ranks.create', language),
    update: serverT('admin.ranks.update', language),
    edit: serverT('admin.ranks.edit', language),
    delete: serverT('admin.ranks.delete', language),
    cancel: serverT('admin.ranks.cancel', language),
    nameRequired: serverT('admin.ranks.nameRequired', language),
    descriptionRequired: serverT('admin.ranks.descriptionRequired', language),
    orderRequired: serverT('admin.ranks.orderRequired', language),
    minUploadRequired: serverT('admin.ranks.minUploadRequired', language),
    minDownloadRequired: serverT('admin.ranks.minDownloadRequired', language),
    minRatioRequired: serverT('admin.ranks.minRatioRequired', language),
    colorRequired: serverT('admin.ranks.colorRequired', language),
    confirmDelete: serverT('admin.ranks.confirmDelete', language),
    noRanks: serverT('admin.ranks.noRanks', language),
    created: serverT('admin.ranks.created', language),
    updated: serverT('admin.ranks.updated', language),
    deleted: serverT('admin.ranks.deleted', language),
    errorLoading: serverT('admin.ranks.errorLoading', language),
    errorCreating: serverT('admin.ranks.errorCreating', language),
    errorUpdating: serverT('admin.ranks.errorUpdating', language),
    errorDeleting: serverT('admin.ranks.errorDeleting', language),
    errorToggleSystem: serverT('admin.ranks.errorToggleSystem', language),
    dragToReorder: serverT('admin.ranks.dragToReorder', language),
    reorderSuccess: serverT('admin.ranks.reorderSuccess', language),
    reorderError: serverT('admin.ranks.reorderError', language),
    systemToggleSuccess: serverT('admin.ranks.systemToggleSuccess', language),
    systemToggleError: serverT('admin.ranks.systemToggleError', language),
    rankPreview: serverT('admin.ranks.rankPreview', language),
    requirements: serverT('admin.ranks.requirements', language),
    uploaded: serverT('admin.ranks.uploaded', language),
    downloaded: serverT('admin.ranks.downloaded', language),
    ratio: serverT('admin.ranks.ratio', language),
    units: {
      gb: serverT('admin.ranks.units.gb', language),
      tb: serverT('admin.ranks.units.tb', language),
    },
  };

  return (
    <AdminDashboardWrapper>
      <Suspense fallback={<RanksSkeleton />}> 
        <RanksClient translations={translations} />
      </Suspense>
    </AdminDashboardWrapper>
  );
}
