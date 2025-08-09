import { Suspense } from 'react';
import AdminSidebarClient, { AdminNavItem } from './AdminSidebarClient';

function SidebarSkeleton() {
  return (
    <div className="p-4">
      <ul className="space-y-2">
        {[...Array(8)].map((_, i) => (
          <li key={i}>
            <div className="flex items-center space-x-3 px-4 py-3 rounded-lg">
              <div className="w-5 h-5 bg-text-secondary/10 rounded animate-pulse"></div>
              <div className="w-24 h-4 bg-text-secondary/10 rounded animate-pulse"></div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function AdminSidebar({ items }: { items: AdminNavItem[] }) {
  return (
    <aside className="w-64 bg-surface border-r border-border h-[calc(100vh-4rem)] fixed left-0 top-16 z-20">
      <Suspense fallback={<SidebarSkeleton />}> 
        <AdminSidebarClient items={items} />
      </Suspense>
    </aside>
  );
}


