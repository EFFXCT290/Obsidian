'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { X, Tag } from '@styled-icons/boxicons-regular';
import { useI18n } from '@/app/hooks/useI18n';
import { API_BASE_URL } from '@/lib/api';
import toast from 'react-hot-toast';

interface Category {
  id: string;
  name: string;
  parentId?: string;
  children?: Category[];
}

interface RequestFormClientProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function RequestFormClient({ onClose, onSuccess }: RequestFormClientProps) {
  const { t } = useI18n();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    categoryId: ''
  });

  const loadCategories = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/categories`, { cache: 'no-store' });
      if (!response.ok) {
        throw new Error('Failed to load categories');
      }
      const data = await response.json();
      
      // Flatten the hierarchical categories into a flat array
      const flattenCategories = (categories: Category[]): Category[] => {
        const result: Category[] = [];
        categories.forEach(category => {
          result.push(category);
          if (category.children && category.children.length > 0) {
            result.push(...flattenCategories(category.children));
          }
        });
        return result;
      };
      
      setCategories(flattenCategories(data || []));
    } catch (error) {
      console.error('Error loading categories:', error);
      toast.error('Error loading categories');
    }
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      toast.error(t('requests.titleRequired', 'Title is required'));
      return;
    }

    if (!formData.categoryId) {
      toast.error(t('requests.categoryRequired', 'Category is required'));
      return;
    }

    try {
      setLoading(true);
      const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
      if (!token) {
        toast.error(t('requests.mustBeLoggedIn', 'You must be logged in to create a request'));
        return;
      }

      const response = await fetch(`${API_BASE_URL}/requests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: formData.title.trim(),
          description: formData.description.trim() || null,
          categoryId: formData.categoryId
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || t('requests.failedToCreateRequest', 'Failed to create request'));
      }

      toast.success(t('requests.requestCreated', 'Request created successfully'));
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error creating request:', error);
      toast.error(error instanceof Error ? error.message : t('requests.errorCreatingRequest', 'Error creating request'));
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-surface border border-border rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-xl font-semibold text-text">
            {t('requests.createNewRequest', 'Create New Request')}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-background rounded-lg transition-colors"
          >
            <X size={20} className="text-text-secondary" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-text mb-2">
              {t('requests.requestTitle', 'Request Title')} *
            </label>
            <input
              type="text"
              id="title"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              placeholder={t('requests.titlePlaceholder', 'Enter a descriptive title for your request')}
              className="w-full px-4 py-2 bg-background border border-border rounded-lg text-text placeholder-text-secondary focus:outline-none focus:border-primary transition-colors"
              required
              maxLength={255}
            />
          </div>

          {/* Category */}
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-text mb-2">
              {t('requests.selectCategory', 'Select Category')} *
            </label>
            <select
              id="category"
              value={formData.categoryId}
              onChange={(e) => handleInputChange('categoryId', e.target.value)}
              className="w-full px-4 py-2 bg-background border border-border rounded-lg text-text focus:outline-none focus:border-primary transition-colors"
              required
            >
              <option value="">{t('requests.selectCategory', 'Select Category')}</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.parentId ? '  └─ ' : ''}{category.name}
                </option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-text mb-2">
              {t('requests.requestDescription', 'Request Description')}
            </label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder={t('requests.descriptionPlaceholder', 'Provide additional details about what you\'re looking for...')}
              rows={4}
              className="w-full px-4 py-2 bg-background border border-border rounded-lg text-text placeholder-text-secondary focus:outline-none focus:border-primary transition-colors resize-none"
              maxLength={2000}
            />
            <div className="text-right text-xs text-text-secondary mt-1">
              {formData.description.length}/2000
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-text-secondary hover:text-text transition-colors"
            >
              {t('common.cancel', 'Cancel')}
            </button>
            <button
              type="submit"
              disabled={loading || !formData.title.trim() || !formData.categoryId}
              className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? t('requests.creatingRequest', 'Creating...') : t('requests.submitRequest', 'Submit Request')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
