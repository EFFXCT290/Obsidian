'use client';

import Link from 'next/link';

export default function UploadButton({ uploadText }: { uploadText: string }) {
  return (
    <Link
      href="/torrents/upload"
      className="hidden md:flex items-center px-4 py-2 bg-primary text-background rounded-lg hover:bg-primary-dark transition-colors text-sm font-medium"
    >
      <svg className="mr-2" width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
        <path d="M11 15h2V6h3l-4-5-4 5h3v9zm-5 4h12v-2H6v2z"/>
      </svg>
      {uploadText}
    </Link>
  );
}


