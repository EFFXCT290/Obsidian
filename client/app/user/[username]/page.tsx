import { notFound } from 'next/navigation';
import { API_BASE_URL } from '@/lib/api';
import PublicProfileContent from './components/PublicProfileContent';
import { serverT } from '../../lib/server-i18n';
import DashboardWrapper from '../../dashboard/components/DashboardWrapper';

interface PublicProfilePageProps {
  params: Promise<{
    username: string;
  }>;
}

async function getPublicProfile(username: string) {
  try {
    const response = await fetch(`${API_BASE_URL}/user/${username}`, {
      cache: 'no-store'
    });
    
    if (response.status === 404) {
      return null;
    }
    
    if (response.status === 403) {
      return { error: 'private' };
    }
    
    if (!response.ok) {
      throw new Error('Failed to fetch profile');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching public profile:', error);
    return null;
  }
}

export default async function PublicProfilePage({ params }: PublicProfilePageProps) {
  const { username } = await params;
  const profile = await getPublicProfile(username);
  
  if (!profile) {
    notFound();
  }
  
  if (profile.error === 'private') {
    return (
      <DashboardWrapper>
        <div className="container mx-auto px-4 py-8">
          <div className="bg-surface rounded-lg border border-border p-8 text-center">
            <h1 className="text-2xl font-bold text-text mb-4">
              {serverT('publicProfile.private.title', 'es')}
            </h1>
            <p className="text-text-secondary">
              {serverT('publicProfile.private.description', 'es')}
            </p>
          </div>
        </div>
      </DashboardWrapper>
    );
  }
  
  return (
    <DashboardWrapper>
      <div className="container mx-auto px-4 py-8">
        <PublicProfileContent profile={profile} />
      </div>
    </DashboardWrapper>
  );
}

export async function generateMetadata({ params }: PublicProfilePageProps) {
  const { username } = await params;
  const profile = await getPublicProfile(username);
  
  if (!profile || profile.error === 'private') {
    return {
      title: 'Profile Not Found',
    };
  }
  
  return {
    title: `${profile.username} - Profile`,
    description: `Public profile of ${profile.username}`,
  };
}
