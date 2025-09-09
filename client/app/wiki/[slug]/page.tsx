import { Suspense } from 'react';
import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import DashboardWrapper from '../../dashboard/components/DashboardWrapper';
import { serverT, getPreferredLanguage } from '../../lib/server-i18n';
import WikiPageClient from './components/WikiPageClient';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface WikiPage {
  id: string;
  title: string;
  slug: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  createdBy: {
    id: string;
    username: string;
  };
  updatedBy: {
    id: string;
    username: string;
  };
  parent?: {
    id: string;
    slug: string;
    title: string;
  };
  children: Array<{
    id: string;
    slug: string;
    title: string;
  }>;
}

// Loading skeleton component
function WikiPageSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="animate-pulse">
        <div className="h-8 bg-background rounded w-2/3 mb-2"></div>
        <div className="h-4 bg-background rounded w-1/2"></div>
      </div>
      
      {/* Content skeleton */}
      <div className="animate-pulse space-y-4">
        <div className="h-4 bg-background rounded w-full"></div>
        <div className="h-4 bg-background rounded w-5/6"></div>
        <div className="h-4 bg-background rounded w-4/5"></div>
        <div className="h-4 bg-background rounded w-full"></div>
        <div className="h-4 bg-background rounded w-3/4"></div>
      </div>
    </div>
  );
}

async function getWikiPage(slug: string): Promise<WikiPage | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/wiki/${slug}`, {
      cache: 'no-store' // Always fetch fresh data
    });
    
    if (!response.ok) {
      return null;
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching wiki page:', error);
    return null;
  }
}

export default async function WikiPage({ params }: { params: Promise<{ slug: string }> }) {
  // Await params in Next.js 15
  const { slug } = await params;
  
  const headersList = await headers();
  const language = await getPreferredLanguage(headersList);
  
  const page = await getWikiPage(slug);
  
  if (!page) {
    notFound();
  }

  const translations = {
    title: page.title,
    description: serverT('wiki.pageDescription', language),
  };

  return (
    <DashboardWrapper>
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-8 mt-6">
          <h1 className="text-3xl font-bold text-text">{translations.title}</h1>
          <p className="text-text-secondary mt-2">{translations.description}</p>
        </div>

        <Suspense fallback={<WikiPageSkeleton />}>
          <WikiPageClient page={page} />
        </Suspense>
      </div>
    </DashboardWrapper>
  );
}
