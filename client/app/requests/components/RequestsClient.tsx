'use client';

import React, { useState } from 'react';
// import { useI18n } from '@/app/hooks/useI18n';
import RequestListClient from './RequestListClient';
import RequestFormClient from './RequestFormClient';
import RequestDetailClient from './RequestDetailClient';

interface Request {
  id: string;
  title: string;
  description?: string;
  status: 'OPEN' | 'FILLED' | 'CLOSED' | 'REJECTED';
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    username: string;
  };
  filledBy?: {
    id: string;
    username: string;
  };
  filledTorrent?: {
    id: string;
    name: string;
  };
  category?: {
    id: string;
    name: string;
  };
}

export default function RequestsClient() {
  // const { t } = useI18n();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleCreateRequest = () => {
    setShowCreateForm(true);
  };

  const handleViewRequest = (request: Request) => {
    setSelectedRequest(request);
  };

  const handleCloseCreateForm = () => {
    setShowCreateForm(false);
  };

  const handleCreateSuccess = () => {
    setRefreshKey(prev => prev + 1);
  };

  const handleBackToList = () => {
    setSelectedRequest(null);
    setRefreshKey(prev => prev + 1);
  };

  if (selectedRequest) {
    return (
      <RequestDetailClient
        requestId={selectedRequest.id}
        onBack={handleBackToList}
      />
    );
  }

  return (
    <>
      <RequestListClient
        key={refreshKey}
        onCreateRequest={handleCreateRequest}
        onViewRequest={handleViewRequest}
      />

      {showCreateForm && (
        <RequestFormClient
          onClose={handleCloseCreateForm}
          onSuccess={handleCreateSuccess}
        />
      )}
    </>
  );
}
