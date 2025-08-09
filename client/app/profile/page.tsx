import { headers } from 'next/headers';
import { getPreferredLanguage, serverT } from '@/app/lib/server-i18n';
import DashboardWrapper from '@/app/dashboard/components/DashboardWrapper';
import ProfileContent from '@/app/profile/components/ProfileContent';

export default async function ProfilePage() {
  const hdrs = await headers();
  const language = await getPreferredLanguage(hdrs);
  // Title translation loaded to ensure consistent i18n (not used directly here)
  serverT('profile.title', language);
  return (
    <DashboardWrapper>
      <ProfileContent />
    </DashboardWrapper>
  );
}


