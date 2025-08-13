import React from 'react';
import UploadContent from './components/UploadContent';
import DashboardWrapper from '@/app/dashboard/components/DashboardWrapper';

export default function UploadPage() {
  return (
    <DashboardWrapper>
      <div className="max-w-5xl mx-auto p-4 md:p-8">
        <UploadContent />
      </div>
    </DashboardWrapper>
  );
}


