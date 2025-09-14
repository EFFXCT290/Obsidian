import { Suspense } from 'react';
import { headers } from 'next/headers';
import AdminDashboardWrapper from '../components/AdminDashboardWrapper';
import { getPreferredLanguage, serverT } from '@/app/lib/server-i18n';
import RequestClient from './RequestClient';

function RequestSkeleton() {
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

export default async function AdminRequestsPage() {
  const hdrs = await headers();
  const language = await getPreferredLanguage(hdrs);

  const translations = {
    title: serverT('admin.requests.title', language),
    description: serverT('admin.requests.description', language),
    list: serverT('admin.requests.list', language),
    titleField: serverT('admin.requests.titleField', language),
    descriptionField: serverT('admin.requests.description', language),
    category: serverT('admin.requests.category', language),
    status: serverT('admin.requests.status', language),
    createdBy: serverT('admin.requests.createdBy', language),
    filledBy: serverT('admin.requests.filledBy', language),
    filledTorrent: serverT('admin.requests.filledTorrent', language),
    createdAt: serverT('admin.requests.createdAt', language),
    updatedAt: serverT('admin.requests.updatedAt', language),
    open: serverT('admin.requests.open', language),
    filled: serverT('admin.requests.filled', language),
    closed: serverT('admin.requests.closed', language),
    rejected: serverT('admin.requests.rejected', language),
    close: serverT('admin.requests.close', language),
    reject: serverT('admin.requests.reject', language),
    view: serverT('admin.requests.view', language),
    reason: serverT('admin.requests.reason', language),
    reasonOptional: serverT('admin.requests.reasonOptional', language),
    closeRequest: serverT('admin.requests.closeRequest', language),
    rejectRequest: serverT('admin.requests.rejectRequest', language),
    viewRequest: serverT('admin.requests.viewRequest', language),
    cancel: serverT('admin.requests.cancel', language),
    confirmClose: serverT('admin.requests.confirmClose', language),
    confirmReject: serverT('admin.requests.confirmReject', language),
    noRequests: serverT('admin.requests.noRequests', language),
    closedSuccess: serverT('admin.requests.closedSuccess', language),
    rejectedSuccess: serverT('admin.requests.rejectedSuccess', language),
    errorLoading: serverT('admin.requests.errorLoading', language),
    errorClosing: serverT('admin.requests.errorClosing', language),
    errorRejecting: serverT('admin.requests.errorRejecting', language),
    filterBy: serverT('admin.requests.filterBy', language),
    allRequests: serverT('admin.requests.allRequests', language),
    openRequests: serverT('admin.requests.openRequests', language),
    filledRequests: serverT('admin.requests.filledRequests', language),
    closedRequests: serverT('admin.requests.closedRequests', language),
    rejectedRequests: serverT('admin.requests.rejectedRequests', language),
    searchBy: serverT('admin.requests.searchBy', language),
    searchPlaceholder: serverT('admin.requests.searchPlaceholder', language),
    requestDetails: serverT('admin.requests.requestDetails', language),
    backToList: serverT('admin.requests.backToList', language),
    requestNotFound: serverT('admin.requests.requestNotFound', language),
    loadingRequest: serverT('admin.requests.loadingRequest', language),
    comments: serverT('admin.requests.comments', language),
    noComments: serverT('admin.requests.noComments', language),
    addComment: serverT('admin.requests.addComment', language),
    commentPlaceholder: serverT('admin.requests.commentPlaceholder', language),
    postComment: serverT('admin.requests.postComment', language),
    commentPosted: serverT('admin.requests.commentPosted', language),
    errorPostingComment: serverT('admin.requests.errorPostingComment', language),
  };

  return (
    <AdminDashboardWrapper>
      <Suspense fallback={<RequestSkeleton />}> 
        <RequestClient translations={translations} />
      </Suspense>
    </AdminDashboardWrapper>
  );
}
