/**
 * Admin Dashboard - Server Component
 * Visible only for ADMIN/OWNER roles
 */

import AdminDashboardWrapper from '../components/AdminDashboardWrapper';
import AdminDashboardClient from './AdminDashboardClient';

export default function AdminDashboardPage() {
  return (
    <AdminDashboardWrapper>
      <AdminDashboardClient />
    </AdminDashboardWrapper>
  );
}


