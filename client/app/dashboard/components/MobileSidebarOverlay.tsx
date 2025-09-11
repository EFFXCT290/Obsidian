'use client';

import { useMobileSidebar } from '../context/MobileSidebarContext';

export function MobileSidebarOverlay() {
  const { isSidebarOpen, closeSidebar } = useMobileSidebar();

  if (!isSidebarOpen) return null;

  return (
    <div 
      className="lg:hidden fixed bg-black/50 animate-in fade-in duration-300"
      onClick={closeSidebar}
      aria-hidden="true"
      style={{ 
        top: '64px',
        left: '0px',
        right: '0px',
        bottom: '0px',
        zIndex: 25
      }}
    />
  );
}
