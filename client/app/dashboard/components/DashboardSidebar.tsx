import { Suspense } from 'react';
import DashboardSidebarClient from './DashboardSidebarClient';

function SidebarSkeleton() {
  return (
    <div className="p-4">
      <ul className="space-y-2">
        {[1,2,3,4,5,6,7].map(i => (
          <li key={i}>
            <div className="flex items-center space-x-3 px-4 py-3 rounded-lg">
              <div className="w-5 h-5 bg-text-secondary/10 rounded animate-pulse" />
              <div className="w-24 h-4 bg-text-secondary/10 rounded animate-pulse" />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function DashboardSidebar({ navItems }: { navItems: Array<{ href: string; label: string; icon: string }>}) {
  return (
    <aside className="w-64 bg-surface border-r border-border h-screen fixed left-0 top-16 z-20">
      <Suspense fallback={<SidebarSkeleton />}> 
        <DashboardSidebarClient serverNavItems={navItems} />
      </Suspense>
    </aside>
  );
}


