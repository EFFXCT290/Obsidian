'use client';

import { useState, useEffect } from 'react';
import { API_BASE_URL } from '@/lib/api';
import { Plus } from '@styled-icons/boxicons-regular/Plus';
import { Edit } from '@styled-icons/boxicons-regular/Edit';
import { Trash } from '@styled-icons/boxicons-regular/Trash';
import { Award } from '@styled-icons/boxicons-regular/Award';
import { ToggleSwitch } from '@/app/components/ui/ToggleSwitch';

interface Rank {
  id: string;
  name: string;
  description: string | null;
  order: number;
  minUpload: string;
  minDownload: string;
  minRatio: number;
  color: string | null;
}

interface RankFormData {
  name: string;
  description: string;
  order: number;
  minUpload: string;
  minDownload: string;
  minRatio: string;
  color: string;
}

export default function RanksClient() {
  const [ranks, setRanks] = useState<Rank[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingRank, setEditingRank] = useState<Rank | null>(null);
  const [rankSystemEnabled, setRankSystemEnabled] = useState(true);
  const [formData, setFormData] = useState<RankFormData>({
    name: '',
    description: '',
    order: 1,
    minUpload: '0',
    minDownload: '0',
    minRatio: '0',
    color: '#3B82F6'
  });

  const fetchRanks = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) return;

      const [ranksRes, statusRes] = await Promise.all([
        fetch(`${API_BASE_URL}/admin/ranks`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_BASE_URL}/admin/ranks/status`, {
          headers: { Authorization: `Bearer ${token}` },
        })
      ]);

      if (ranksRes.ok) {
        const ranksData = await ranksRes.json();
        setRanks(ranksData.ranks || []);
      }

      if (statusRes.ok) {
        const statusData = await statusRes.json();
        setRankSystemEnabled(statusData.enabled);
      }
    } catch (err) {
      setError('Failed to fetch ranks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRanks();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const token = localStorage.getItem('authToken');
    if (!token) return;

    try {
      const url = editingRank 
        ? `${API_BASE_URL}/admin/ranks/${editingRank.id}` 
        : `${API_BASE_URL}/admin/ranks`;
      const method = editingRank ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description || null,
          order: Number(formData.order),
          minUpload: Number(formData.minUpload),
          minDownload: Number(formData.minDownload),
          minRatio: Number(formData.minRatio),
          color: formData.color || null,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to save rank');
      }

      setShowCreateModal(false);
      setEditingRank(null);
      resetForm();
      fetchRanks();
    } catch (err: any) {
      setError(err.message || 'Failed to save rank');
    }
  };

  const handleDelete = async (rankId: string) => {
    if (!confirm('Are you sure you want to delete this rank?')) return;
    const token = localStorage.getItem('authToken');
    if (!token) return;

    try {
      const res = await fetch(`${API_BASE_URL}/admin/ranks/${rankId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to delete rank');
      }

      fetchRanks();
    } catch (err: any) {
      setError(err.message || 'Failed to delete rank');
    }
  };

  const handleEdit = (rank: Rank) => {
    setEditingRank(rank);
    setFormData({
      name: rank.name,
      description: rank.description || '',
      order: rank.order,
      minUpload: rank.minUpload,
      minDownload: rank.minDownload,
      minRatio: rank.minRatio.toString(),
      color: rank.color || '#3B82F6'
    });
    setShowCreateModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      order: 1,
      minUpload: '0',
      minDownload: '0',
      minRatio: '0',
      color: '#3B82F6'
    });
  };

  const handleToggleSystem = async () => {
    const token = localStorage.getItem('authToken');
    if (!token) return;

    try {
      const res = await fetch(`${API_BASE_URL}/admin/ranks/toggle`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        setRankSystemEnabled(!rankSystemEnabled);
      }
    } catch (err) {
      setError('Failed to toggle rank system');
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <div className="bg-surface rounded-lg border border-border p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-text-secondary/10 rounded w-1/4"></div>
          <div className="h-32 bg-text-secondary/10 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* System Toggle */}
      <div className="bg-surface rounded-lg border border-border p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-text">Rank System</h3>
            <p className="text-sm text-text-secondary">
              Enable or disable the rank system for all users
            </p>
          </div>
          <div className="flex items-center gap-3">
            <ToggleSwitch
              checked={rankSystemEnabled}
              onChange={handleToggleSystem}
            />
            <span className="text-sm text-text-secondary">
              {rankSystemEnabled ? 'Enabled' : 'Disabled'}
            </span>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
          <p className="text-red-500 text-sm">{error}</p>
        </div>
      )}

      {/* Ranks List */}
      <div className="bg-surface rounded-lg border border-border">
        <div className="p-6 border-b border-border">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-text">Ranks</h3>
            <button
              onClick={() => {
                setEditingRank(null);
                resetForm();
                setShowCreateModal(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
            >
              <Plus size={16} />
              Create Rank
            </button>
          </div>
        </div>

        <div className="p-6">
          {ranks.length === 0 ? (
            <div className="text-center py-8">
              <Award size={48} className="mx-auto text-text-secondary/50 mb-4" />
              <p className="text-text-secondary">No ranks created yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {ranks
                .sort((a, b) => a.order - b.order)
                .map((rank) => (
                  <div
                    key={rank.id}
                    className="flex items-center justify-between p-4 bg-background rounded-lg border border-border/50"
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: rank.color || '#3B82F6' }}
                      />
                      <div>
                        <h4 className="font-semibold text-text">{rank.name}</h4>
                        {rank.description && (
                          <p className="text-sm text-text-secondary">{rank.description}</p>
                        )}
                        <div className="flex items-center gap-4 mt-2 text-sm text-text-secondary">
                          <span>Order: {rank.order}</span>
                          <span>Min Upload: {formatBytes(Number(rank.minUpload))}</span>
                          <span>Min Download: {formatBytes(Number(rank.minDownload))}</span>
                          <span>Min Ratio: {rank.minRatio}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEdit(rank)}
                        className="p-2 text-text-secondary hover:text-primary transition-colors"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(rank.id)}
                        className="p-2 text-text-secondary hover:text-red-500 transition-colors"
                      >
                        <Trash size={16} />
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>

      {/* Create/Edit Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-surface rounded-lg border border-border p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-text mb-4">
              {editingRank ? 'Edit Rank' : 'Create Rank'}
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text mb-1">
                  Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full p-2 border border-border/50 rounded-lg bg-background/50 text-text placeholder-text-secondary focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all duration-200"
                  placeholder="Enter rank name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full p-2 border border-border/50 rounded-lg bg-background/50 text-text placeholder-text-secondary focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all duration-200 resize-none"
                  rows={2}
                  placeholder="Optional description for this rank"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text mb-1">
                  Order *
                </label>
                <input
                  type="number"
                  value={formData.order}
                  onChange={(e) => setFormData({ ...formData, order: Number(e.target.value) })}
                  className="w-full p-2 border border-border/50 rounded-lg bg-background/50 text-text placeholder-text-secondary focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all duration-200"
                  min="1"
                  required
                />
                <p className="text-xs text-text-secondary mt-1">Lower number = higher rank</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-text mb-1">
                    Min Upload *
                  </label>
                  <input
                    type="number"
                    value={formData.minUpload}
                    onChange={(e) => setFormData({ ...formData, minUpload: e.target.value })}
                    className="w-full p-2 border border-border/50 rounded-lg bg-background/50 text-text placeholder-text-secondary focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all duration-200"
                    min="0"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text mb-1">
                    Min Download *
                  </label>
                  <input
                    type="number"
                    value={formData.minDownload}
                    onChange={(e) => setFormData({ ...formData, minDownload: e.target.value })}
                    className="w-full p-2 border border-border/50 rounded-lg bg-background/50 text-text placeholder-text-secondary focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all duration-200"
                    min="0"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-text mb-1">
                    Min Ratio *
                  </label>
                  <input
                    type="number"
                    value={formData.minRatio}
                    onChange={(e) => setFormData({ ...formData, minRatio: e.target.value })}
                    className="w-full p-2 border border-border/50 rounded-lg bg-background/50 text-text placeholder-text-secondary focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all duration-200"
                    min="0"
                    step="0.1"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text mb-1">
                    Color
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={formData.color}
                      onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                      className="w-10 h-8 border border-border/50 rounded-lg bg-background/50 cursor-pointer"
                    />
                    <span className="text-xs text-text-secondary">Color</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 font-medium transition-all duration-200"
                >
                  {editingRank ? 'Update Rank' : 'Create Rank'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setEditingRank(null);
                    resetForm();
                  }}
                  className="flex-1 px-4 py-2 bg-surface/50 text-text border border-border/50 rounded-lg hover:bg-surface/70 font-medium transition-all duration-200"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
