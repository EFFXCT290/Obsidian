'use client';

interface FileItem { path: string; size: number }

interface Props {
  image?: string | null;
  size: number;
  type: string;
  source: string;
  files: FileItem[];
  tags: string[];
  description?: string | null;
  nfo?: string | null;
  loading?: boolean;
  mounted?: boolean;
}

export default function TorrentInfo({ image, size, type, source, files, tags, description, nfo, loading = false, mounted = false }: Props) {
  const formatSize = (bytes: number): string => {
    const sizes = ['B','KB','MB','GB','TB'];
    if (!bytes) return '0 B';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
  };
  return (
    <div className="bg-surface rounded-lg border border-border p-6 space-y-6">
      <div suppressHydrationWarning>
        {mounted && image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={image} alt="Poster" className="max-h-[400px] max-w-full rounded object-contain mx-auto" />
        ) : null}
      </div>
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div className="flex justify-between"><span className="text-text-secondary">Tamaño</span><span className="text-text">{loading ? '—' : formatSize(size)}</span></div>
        <div className="flex justify-between"><span className="text-text-secondary">Tipo</span><span className="text-text">{loading ? '—' : type || '-'}</span></div>
        <div className="flex justify-between"><span className="text-text-secondary">Source</span><span className="text-text">{loading ? '—' : source || '-'}</span></div>
        <div className="flex justify-between"><span className="text-text-secondary">Archivos</span><span className="text-text">{loading ? '—' : files.length}</span></div>
      </div>
      {tags?.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {tags.map((t) => (<span key={t} className="px-2 py-1 rounded-full text-xs bg-primary/10 text-primary">{t}</span>))}
        </div>
      )}
      {description && (
        <div>
          <h3 className="text-lg font-semibold text-text mb-2">Descripción</h3>
          <div className="whitespace-pre-wrap text-text">{description}</div>
        </div>
      )}
      {nfo && (
        <div>
          <h3 className="text-lg font-semibold text-text mb-2">NFO</h3>
          <pre className="bg-background border border-border rounded p-3 text-xs overflow-auto text-text-secondary max-h-80">{nfo}</pre>
        </div>
      )}
    </div>
  );
}


