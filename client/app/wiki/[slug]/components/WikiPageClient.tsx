'use client';

import { useI18n } from '../../../hooks/useI18n';
import { User, Calendar, ArrowToLeft, File, Folder } from '@styled-icons/boxicons-regular';
import Link from 'next/link';

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

interface WikiPageClientProps {
  page: WikiPage;
}

export default function WikiPageClient({ page }: WikiPageClientProps) {
  const { t } = useI18n();

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const renderContent = (content: string) => {
    // Enhanced markdown-like rendering
    return content
      // Headers
      .replace(/^### (.*$)/gim, '<h3 class="text-lg font-semibold text-text mt-6 mb-3">$1</h3>')
      .replace(/^## (.*$)/gim, '<h2 class="text-xl font-semibold text-text mt-8 mb-4">$1</h2>')
      .replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold text-text mt-8 mb-4">$1</h1>')
      // Bold and italic
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-text">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em class="italic text-text">$1</em>')
      // Code blocks
      .replace(/```([\s\S]*?)```/g, '<pre class="bg-background border border-border rounded-lg p-4 my-4 overflow-x-auto"><code class="text-sm">$1</code></pre>')
      // Inline code
      .replace(/`(.*?)`/g, '<code class="bg-background border border-border px-2 py-1 rounded text-sm font-mono">$1</code>')
      // Links
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-primary hover:text-primary-dark underline" target="_blank" rel="noopener noreferrer">$1</a>')
      // Lists
      .replace(/^\* (.*$)/gim, '<li class="ml-4">$1</li>')
      .replace(/(<li class="ml-4">.*<\/li>)/s, '<ul class="list-disc list-inside my-4 space-y-1">$1</ul>')
      // Line breaks
      .replace(/\n\n/g, '</p><p class="my-4">')
      .replace(/\n/g, '<br>');
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb navigation */}
      <nav className="flex items-center gap-2 text-sm text-text-secondary">
        <Link href="/wiki" className="hover:text-primary transition-colors">
          {t('wiki.wiki', 'Wiki')}
        </Link>
        {page.parent && (
          <>
            <span>/</span>
            <Link href={`/wiki/${page.parent.slug}`} className="hover:text-primary transition-colors">
              {page.parent.title}
            </Link>
          </>
        )}
        <span>/</span>
        <span className="text-text">{page.title}</span>
      </nav>

      {/* Page metadata */}
      <div className="bg-background border border-border rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 text-sm text-text-secondary">
            <div className="flex items-center gap-1">
              <User size={14} />
              <span>{t('wiki.createdBy', 'Created by')} {page.createdBy.username}</span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar size={14} />
              <span>{formatDate(page.createdAt)}</span>
            </div>
            {page.updatedAt !== page.createdAt && (
              <div className="flex items-center gap-1">
                <span>{t('wiki.updated', 'Updated')} {formatDate(page.updatedAt)}</span>
                {page.updatedBy.username !== page.createdBy.username && (
                  <span>by {page.updatedBy.username}</span>
                )}
              </div>
            )}
          </div>
          
          <Link 
            href="/wiki"
            className="flex items-center gap-1 text-primary hover:text-primary-dark transition-colors"
          >
            <ArrowToLeft size={16} />
            <span className="text-sm">{t('wiki.backToWiki', 'Back to Wiki')}</span>
          </Link>
        </div>
      </div>

      {/* Page content */}
      <div className="bg-background border border-border rounded-lg p-6">
        <div 
          className="prose prose-invert max-w-none text-text"
          dangerouslySetInnerHTML={{ 
            __html: `<p class="my-4">${renderContent(page.content)}</p>`
          }}
        />
      </div>

      {/* Sub-pages */}
      {page.children.length > 0 && (
        <div className="bg-background border border-border rounded-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <Folder size={20} className="text-primary" />
            <h3 className="text-lg font-semibold text-text">
              {t('wiki.subPages', 'Sub-pages')} ({page.children.length})
            </h3>
          </div>
          
          <div className="grid gap-3">
            {page.children.map((child) => (
              <Link
                key={child.id}
                href={`/wiki/${child.slug}`}
                className="flex items-center gap-3 p-3 bg-background border border-border rounded-lg hover:border-primary/50 transition-colors group"
              >
                <File size={16} className="text-text-secondary group-hover:text-primary transition-colors" />
                <span className="text-text group-hover:text-primary transition-colors">{child.title}</span>
                <div className="ml-auto text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                  →
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Navigation to parent page */}
      {page.parent && (
        <div className="bg-background border border-border rounded-lg p-6">
          <div className="flex items-center gap-2 mb-3">
            <ArrowToLeft size={20} className="text-primary" />
            <h3 className="text-lg font-semibold text-text">
              {t('wiki.parentPage', 'Parent page')}
            </h3>
          </div>
          
          <Link
            href={`/wiki/${page.parent.slug}`}
            className="flex items-center gap-3 p-3 bg-background border border-border rounded-lg hover:border-primary/50 transition-colors group"
          >
            <File size={16} className="text-text-secondary group-hover:text-primary transition-colors" />
            <span className="text-text group-hover:text-primary transition-colors">{page.parent.title}</span>
            <div className="ml-auto text-primary opacity-0 group-hover:opacity-100 transition-opacity">
              ←
            </div>
          </Link>
        </div>
      )}
    </div>
  );
}
