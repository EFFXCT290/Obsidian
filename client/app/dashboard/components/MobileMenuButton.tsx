'use client';

import { useMobileSidebar } from '../context/MobileSidebarContext';

interface MobileMenuButtonProps {
  className?: string;
}

export default function MobileMenuButton({ className = '' }: MobileMenuButtonProps) {
  const { toggleSidebar } = useMobileSidebar();

  return (
    <button
      onClick={toggleSidebar}
      className={`lg:hidden p-2 rounded-lg text-text hover:bg-surface-light transition-colors ${className}`}
      aria-label="Toggle navigation menu"
    >
      <svg
        className="w-6 h-6"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M4 6h16M4 12h16M4 18h16"
        />
      </svg>
    </button>
  );
}
