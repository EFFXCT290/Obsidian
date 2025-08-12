'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Plus, Edit, Trash } from '@styled-icons/boxicons-regular';
import toast from 'react-hot-toast';
import Sortable from 'sortablejs';
import { API_BASE_URL } from '@/lib/api';

interface Category {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  order?: number;
  parentId?: string;
  children?: Category[];
  _count?: {
    torrents: number;
    requests: number;
  };
}

interface CategoryFormData {
  name: string;
  description: string;
  icon: string;
  order: number;
}

interface CategoriesClientProps {
  translations: {
    title: string;
    description: string;
    addNew: string;
    addCategory: string;
    editCategory: string;
    list: string;
    name: string;
    descriptionField: string;
    icon: string;
    order: string;
    torrents: string;
    requests: string;
    create: string;
    update: string;
    edit: string;
    delete: string;
    cancel: string;
    nameRequired: string;
    confirmDelete: string;
    noCategories: string;
    created: string;
    updated: string;
    deleted: string;
    errorLoading: string;
    errorCreating: string;
    errorUpdating: string;
    errorDeleting: string;
    dragToReorder: string;
    reorderSuccess: string;
    reorderError: string;
  };
}

// Category Item Component
function CategoryItem({ 
  item, 
  onEdit, 
  onDelete, 
  translations
}: { 
  item: Category; 
  onEdit: (category: Category) => void; 
  onDelete: (categoryId: string) => void;
  translations: CategoriesClientProps['translations'];
}) {
  const handleEdit = () => {
    onEdit(item);
  };

  const handleDelete = () => {
    onDelete(item.id);
  };

  return (
    <div 
      className="category-item bg-surface rounded-lg border border-border p-4 mb-2"
      data-id={item.id}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3 flex-1 min-w-0">
          {/* Drag Handle */}
          <div className="cursor-grab active:cursor-grabbing p-2 rounded transition-colors text-text-secondary hover:text-primary hover:bg-surface-light">
            <div className="w-4 h-4 flex items-center justify-center">
              <div className="w-3 h-3 flex flex-wrap gap-0.5">
                <div className="w-1 h-1 bg-current rounded-full"></div>
                <div className="w-1 h-1 bg-current rounded-full"></div>
                <div className="w-1 h-1 bg-current rounded-full"></div>
                <div className="w-1 h-1 bg-current rounded-full"></div>
              </div>
            </div>
          </div>
          
          {/* Category Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <h3 className="font-medium text-text truncate">{item.name}</h3>
                          {item.children && item.children.length > 0 && (
              <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                {item.children.length} sub
              </span>
            )}
            </div>
            {item.description && (
              <p className="text-sm text-text-secondary truncate">{item.description}</p>
            )}
          </div>
        </div>

        {/* Stats and Actions */}
        <div className="flex items-center space-x-3 flex-shrink-0">
          {/* Category Statistics */}
          <div className="text-sm text-text-secondary bg-surface-light px-2 py-1 rounded">
            <span className="font-medium">{item._count?.torrents || 0}</span> {translations.torrents} • 
            <span className="font-medium"> {item._count?.requests || 0}</span> {translations.requests}
          </div>
          
          {/* Action Buttons */}
          <div className="flex items-center space-x-1">
            <button
              onClick={handleEdit}
              className="p-2 rounded transition-colors text-text-secondary hover:text-primary hover:bg-surface-light"
              title={translations.edit}
            >
              <Edit size={16} />
            </button>
            
            <button
              onClick={handleDelete}
              className="p-2 rounded transition-colors text-red-500 hover:text-red-600 hover:bg-red-50"
              title={translations.delete}
            >
              <Trash size={16} />
            </button>
          </div>
        </div>
      </div>
      
      {/* Nested Categories Container - Following Sortable.js pattern */}
      {item.children && item.children.length > 0 && (
        <div className="nested-sortable mt-3">
          {item.children.map((child) => (
            <CategoryItem
              key={child.id}
              item={child}
              onEdit={onEdit}
              onDelete={onDelete}
              translations={translations}
            />
          ))}
        </div>
      )}
      {/* Drop zone for main categories only (no parentId) */}
      {!item.parentId && (!item.children || item.children.length === 0) && (
        <div className="nested-sortable mt-3">
        </div>
      )}
    </div>
  );
}

export default function CategoriesClient({ translations }: CategoriesClientProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState<CategoryFormData>({
    name: '',
    description: '',
    icon: '',
    order: 0
  });

  const sortableRef = useRef<HTMLDivElement>(null);
  const sortableInstances = useRef<Sortable[]>([]);

  const loadCategories = useCallback(async () => {
    try {
      setLoading(true);
      const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      
      const response = await fetch(`${API_BASE_URL}/admin/category`, { headers, cache: 'no-store' });
      if (!response.ok) {
        throw new Error('Failed to load categories');
      }
      const data = await response.json();
      setCategories(data);
    } catch (error) {
      console.error('Error loading categories:', error);
      toast.error(translations.errorLoading);
    } finally {
      setLoading(false);
    }
  }, [translations.errorLoading]);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  // Initialize Sortable.js following official nested pattern
  useEffect(() => {
    // Cleanup function to destroy all instances
    const cleanup = () => {
      sortableInstances.current.forEach((instance) => {
        try {
          instance.destroy();
        } catch (error) {
          console.warn('Error destroying sortable instance:', error);
        }
      });
      sortableInstances.current = [];
    };

    // Only initialize if we have categories and the ref exists
    if (sortableRef.current && categories.length > 0) {
      // Clean up existing instances first
      cleanup();

      // Wait for DOM to be ready
      setTimeout(() => {
        // Get all nested sortable elements (following Sortable.js pattern)
        const nestedSortables = [].slice.call(document.querySelectorAll('.nested-sortable'));
        
        // Add the main container to the list
        const allSortables = sortableRef.current ? [sortableRef.current, ...nestedSortables] : nestedSortables;

        console.log('Found sortable containers:', allSortables.length);

        // Loop through each sortable element (following official pattern)
        for (let i = 0; i < allSortables.length; i++) {
          try {
            const instance = new Sortable(allSortables[i], {
              group: 'nested',
              animation: 150,
              fallbackOnBody: true,
              swapThreshold: 0.65,
              handle: '.cursor-grab',
              
              onStart: function (evt) {
                console.log('Drag started:', evt.item.dataset.id);
              },
              
              onEnd: async function (evt) {
                const { item, from, to, oldIndex, newIndex } = evt;
                const itemId = item.dataset.id;
                
                if (!itemId) return;
                
                console.log('Drag ended:', { 
                  itemId, 
                  from: from.dataset.id || from.className, 
                  to: to.dataset.id || to.className, 
                  oldIndex, 
                  newIndex 
                });
                
                try {
                  const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
                  const headers: HeadersInit = { 'Content-Type': 'application/json' };
                  if (token) headers['Authorization'] = `Bearer ${token}`;
                  
                  // Determine if it's a move to a different parent
                  let newParentId = null;
                  let newOrder = newIndex;
                  
                  // Check if dropped into a nested container (subcategory)
                  if (to.classList.contains('nested-sortable')) {
                    // Find the parent category
                    const parentContainer = to.closest('.category-item');
                    if (parentContainer) {
                      newParentId = (parentContainer as HTMLElement).dataset.id;
                      // Calculate order within the nested container
                      const nestedItems = Array.from(to.children);
                      newOrder = nestedItems.indexOf(item);
                      console.log('Moving to subcategory:', { newParentId, newOrder });
                    }
                  } else if ((to as HTMLElement).dataset.id === 'root') {
                    // Dropped in main container (main category)
                    newParentId = null;
                    newOrder = newIndex;
                    console.log('Moving to main category:', { newParentId, newOrder });
                  }
                  
                  // If moving within the same container, we need to handle reordering
                  const fromParentId = from.classList.contains('nested-sortable') 
                    ? (from.closest('.category-item') as HTMLElement)?.dataset.id 
                    : null;
                  
                  if (fromParentId === newParentId && oldIndex !== newIndex) {
                    console.log('Reordering within same container');
                    // The backend should handle this automatically, but let's make sure
                    // we send the correct newOrder
                  }
                  
                  const requestBody = {
                    categoryId: itemId,
                    newParentId,
                    newOrder,
                    forceReorder: true // Signal to backend to recalculate all orders
                  };
                  

                  
                  const response = await fetch(`${API_BASE_URL}/admin/category`, {
                    method: 'POST',
                    headers,
                    body: JSON.stringify(requestBody),
                  });

                  if (!response.ok) {
                    throw new Error('Failed to move category');
                  }

                  toast.success(translations.reorderSuccess);
                  loadCategories();
                } catch (error) {
                  console.error('Error moving category:', error);
                  toast.error(translations.reorderError);
                  loadCategories();
                }
              }
            });
            
            sortableInstances.current.push(instance);

          } catch (error) {
            console.error('Error creating sortable instance:', error);
          }
        }
      }, 100); // Small delay to ensure DOM is ready
    }

    return cleanup;
  }, [categories, loadCategories, translations.reorderSuccess, translations.reorderError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error(translations.nameRequired);
      return;
    }

    try {
      const url = editingCategory 
        ? `${API_BASE_URL}/admin/category/${editingCategory.id}`
        : `${API_BASE_URL}/admin/category`;
      
      const method = editingCategory ? 'PUT' : 'POST';
      
      const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      
      const response = await fetch(url, {
        method,
        headers,
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to save category');
      }

      toast.success(editingCategory ? translations.updated : translations.created);
      resetForm();
      loadCategories();
    } catch (error) {
      console.error('Error saving category:', error);
      toast.error(editingCategory ? translations.errorUpdating : translations.errorCreating);
    }
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description || '',
      icon: category.icon || '',
      order: category.order || 0
    });
    setShowForm(true);
  };

  const handleDelete = async (categoryId: string) => {
    if (!confirm(translations.confirmDelete)) return;

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      
      const response = await fetch(`${API_BASE_URL}/admin/category/${categoryId}`, {
        method: 'DELETE',
        headers,
        body: JSON.stringify({}), // Add empty body to match backend expectations
      });

      if (!response.ok) {
        throw new Error('Failed to delete category');
      }

      toast.success(translations.deleted);
      loadCategories();
    } catch (error) {
      console.error('Error deleting category:', error);
      toast.error(translations.errorDeleting);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      icon: '',
      order: 0
    });
    setEditingCategory(null);
    setShowForm(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-text-secondary">Cargando categorías...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Add/Edit Category Form */}
      {showForm && (
        <div className="bg-surface rounded-lg border border-border p-6">
          <h2 className="text-lg font-semibold text-text mb-4">
            {editingCategory ? translations.editCategory : translations.addCategory}
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-text mb-1">
                {translations.name} *
              </label>
              <input
                type="text"
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-md bg-surface text-text focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder={translations.name}
                required
              />
            </div>
            
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-text mb-1">
                {translations.descriptionField}
              </label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-md bg-surface text-text focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder={translations.descriptionField}
                rows={3}
              />
            </div>
            
            <div>
              <label htmlFor="icon" className="block text-sm font-medium text-text mb-1">
                {translations.icon}
              </label>
              <input
                type="text"
                id="icon"
                value={formData.icon}
                onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-md bg-surface text-text focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder={translations.icon}
              />
            </div>
            
            <div>
              <label htmlFor="order" className="block text-sm font-medium text-text mb-1">
                {translations.order}
              </label>
              <input
                type="number"
                id="order"
                value={formData.order}
                onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-border rounded-md bg-surface text-text focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder={translations.order}
              />
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                type="submit"
                className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors"
              >
                {editingCategory ? translations.update : translations.create}
              </button>
              
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 border border-border text-text rounded-md hover:bg-surface-light transition-colors"
              >
                {translations.cancel}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Add New Category Button */}
      {!showForm && (
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-text">{translations.title}</h1>
            <p className="text-text-secondary mt-1">{translations.description}</p>
          </div>
          
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors"
          >
            <Plus size={20} />
            <span>{translations.addNew}</span>
          </button>
        </div>
      )}

      {/* Categories List with Sortable.js */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-text">{translations.list}</h2>
        
        {categories.length === 0 ? (
          <div className="text-center py-8 text-text-secondary">
            {translations.noCategories}
          </div>
        ) : (
          <div 
            ref={sortableRef}
            className="categories-container space-y-2"
            data-id="root"
          >
            {categories.map((item) => (
              <CategoryItem
                key={item.id}
                item={item}
                onEdit={handleEdit}
                onDelete={handleDelete}
                translations={translations}
              />
            ))}
          </div>
        )}
      </div>
      
      {/* Sortable.js Styles */}
      <style jsx>{`
        .sortable-ghost {
          opacity: 0.5;
          background: #f3f4f6;
          border: 2px dashed #3b82f6;
        }
        
        .sortable-chosen {
          background: #eff6ff;
          border-color: #3b82f6;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }
        
        .sortable-drag {
          opacity: 0.8;
          transform: rotate(5deg);
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
        }
        
        .nested-sortable {
          min-height: 20px;
          margin-top: 0.5rem;
          background: rgba(59, 130, 246, 0.02);
          border-radius: 0.375rem;
          transition: all 0.2s ease;
          padding: 0.5rem;
        }
        
        .nested-sortable:hover {
          background: rgba(59, 130, 246, 0.05);
        }
        
        .nested-sortable.sortable-ghost {
          background: rgba(59, 130, 246, 0.1);
          border: 2px dashed #3b82f6;
          min-height: 40px;
        }
        
        .category-item {
          transition: all 0.2s ease;
        }
        
        .category-item:hover {
          background: #f9fafb;
        }
        
        .category-item .nested-sortable {
          position: relative;
        }
      `}</style>
    </div>
  );
}
