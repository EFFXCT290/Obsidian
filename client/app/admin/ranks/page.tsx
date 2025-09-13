import { Suspense } from 'react';
import AdminDashboardWrapper from '../components/AdminDashboardWrapper';
import RanksClient from './RanksClient';

export default function AdminRanksPage() {
  return (
    <AdminDashboardWrapper>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-text">Rank Management</h1>
        </div>
        
        <Suspense fallback={
          <div className="bg-surface rounded-lg border border-border p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-text-secondary/10 rounded w-1/4"></div>
              <div className="h-32 bg-text-secondary/10 rounded"></div>
            </div>
          </div>
        }>
          <RanksClient />
        </Suspense>
      </div>
    </AdminDashboardWrapper>
  );
}
