'use client';

interface Props {
  bookmarks: number;
  votes: number;
  comments: number;
  loading?: boolean;
}

export default function TorrentStatistics({ bookmarks, votes, comments, loading = false }: Props) {
  return (
    <div className="bg-surface rounded-lg border border-border p-6">
      <h3 className="text-lg font-semibold text-text mb-4">Estadísticas</h3>
      <div className="grid grid-cols-3 gap-4 text-center">
        <div>
          <div className="text-text-secondary text-sm">Favoritos</div>
          <div className="text-2xl font-bold text-text">{loading ? '—' : bookmarks}</div>
        </div>
        <div>
          <div className="text-text-secondary text-sm">Votos</div>
          <div className="text-2xl font-bold text-text">{loading ? '—' : votes}</div>
        </div>
        <div>
          <div className="text-text-secondary text-sm">Comentarios</div>
          <div className="text-2xl font-bold text-text">{loading ? '—' : comments}</div>
        </div>
      </div>
    </div>
  );
}


