'use client';

import { ReactNode } from 'react';
import { useMobileSidebar } from '../context/MobileSidebarContext';

interface MobileSidebarWrapperProps {
  children: ReactNode;
}

export function MobileSidebarWrapper({ children }: MobileSidebarWrapperProps) {
  const { isSidebarOpen } = useMobileSidebar();

  return (
    <div className={`lg:hidden transform transition-transform duration-300 ease-in-out ${
      isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
    }`}>
      {children}
    </div>
  );
}
