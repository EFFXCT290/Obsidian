'use client';

import { useState, useEffect, useCallback } from 'react';
import { useI18n } from '@/app/hooks/useI18n';
import { Plus, Edit, Trash, Folder, FolderOpen, Move } from '@styled-icons/boxicons-regular';
import toast from 'react-hot-toast';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Types for category management
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
  parentId: string;
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
    parentCategory: string;
    noParent: string;
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

// Sortable category item component
function SortableCategoryItem({ 
  category, 
  level = 0, 
  onEdit, 
  onDelete, 
  translations 
}: { 
  category: Category; 
  level?: number; 
  onEdit: (category: Category) => void; 
  onDelete: (categoryId: string) => void;
  translations: CategoriesClientProps['translations'];
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: category.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="space-y-2">
      <div className={`flex items-center justify-between p-4 bg-surface rounded-lg border border-border ${level > 0 ? 'ml-6' : ''}`}>
        <div className="flex items-center space-x-3">
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing p-1 hover:bg-surface-light rounded"
            title={translations.dragToReorder}
          >
            <Move size={16} className="text-text-secondary" />
          </div>
          {category.children && category.children.length > 0 ? (
            <FolderOpen size={20} className="text-primary" />
          ) : (
            <Folder size={20} className="text-text-secondary" />
          )}
          <div>
            <h3 className="font-medium text-text">{category.name}</h3>
            {category.description && (
              <p className="text-sm text-text-secondary">{category.description}</p>
            )}
            <div className="flex items-center space-x-4 mt-1 text-xs text-text-secondary">
              {category._count && (
                <>
                  <span>{category._count.torrents} {translations.torrents}</span>
                  <span>{category._count.requests} {translations.requests}</span>
                </>
              )}
              {category.order !== undefined && (
                <span>{translations.order}: {category.order}</span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => onEdit(category)}
            className="p-2 text-text-secondary hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
            title={translations.edit}
          >
            <Edit size={16} />
          </button>
          <button
            onClick={() => onDelete(category.id)}
            className="p-2 text-text-secondary hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
            title={translations.delete}
          >
            <Trash size={16} />
          </button>
        </div>
      </div>
      {category.children && category.children.length > 0 && (
        <div className="ml-4">
          <SortableContext items={category.children.map(c => c.id)} strategy={verticalListSortingStrategy}>
            {category.children.map((child) => (
              <SortableCategoryItem
                key={child.id}
                category={child}
                level={level + 1}
                onEdit={onEdit}
                onDelete={onDelete}
                translations={translations}
              />
            ))}
          </SortableContext>
        </div>
      )}
    </div>
  );
}

export default function CategoriesClient({ translations }: CategoriesClientProps) {
  const { t } = useI18n();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState<CategoryFormData>({
    name: '',
    description: '',
    icon: '',
    order: 0,
    parentId: ''
  });

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const loadCategories = useCallback(async () => {
    try {
      setLoading(true);
      const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch('/api/admin/category', { headers, cache: 'no-store' });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || 'Failed to fetch categories');
      setCategories(data);
    } catch (error) {
      console.error('Error loading categories:', error);
      toast.error(translations.errorLoading);
    } finally {
      setLoading(false);
    }
  }, [t]);

  // Load categories on component mount
  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error(translations.nameRequired);
      return;
    }

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      
      if (editingCategory) {
        // Update existing category
        const res = await fetch(`/api/admin/category/${editingCategory.id}`, { 
          method: 'PUT', 
          headers, 
          body: JSON.stringify(formData) 
        });
        if (!res.ok) throw new Error('Failed to update category');
        toast.success(translations.updated);
      } else {
        // Create new category
        const res = await fetch('/api/admin/category', { 
          method: 'POST', 
          headers, 
          body: JSON.stringify(formData) 
        });
        if (!res.ok) throw new Error('Failed to create category');
        toast.success(translations.created);
      }
      
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
      order: category.order || 0,
      parentId: category.parentId || ''
    });
    setShowForm(true);
  };

  const handleDelete = async (categoryId: string) => {
    if (!confirm(translations.confirmDelete)) {
      return;
    }

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      
      const res = await fetch(`/api/admin/category/${categoryId}`, { 
        method: 'DELETE', 
        headers 
      });
      if (!res.ok) throw new Error('Failed to delete category');
      toast.success(translations.deleted);
      loadCategories();
    } catch (error) {
      console.error('Error deleting category:', error);
      toast.error(translations.errorDeleting);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      const oldIndex = categories.findIndex(cat => cat.id === active.id);
      const newIndex = categories.findIndex(cat => cat.id === over?.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        const newCategories = arrayMove(categories, oldIndex, newIndex);
        setCategories(newCategories);

        try {
          const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
          const headers: HeadersInit = { 'Content-Type': 'application/json' };
          if (token) headers['Authorization'] = `Bearer ${token}`;
          
          const res = await fetch('/api/admin/category', {
            method: 'POST',
            headers,
            body: JSON.stringify({
              categories: newCategories.map((cat, index) => ({
                id: cat.id,
                order: index
              }))
            })
          });

          if (!res.ok) throw new Error('Failed to reorder categories');
          toast.success(translations.reorderSuccess);
        } catch (error) {
          console.error('Error reordering categories:', error);
          toast.error(translations.reorderError);
          // Reload categories to restore original order
          loadCategories();
        }
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      icon: '',
      order: 0,
      parentId: ''
    });
    setEditingCategory(null);
    setShowForm(false);
  };

    const renderCategoryTree = (categoryList: Category[], level = 0) => {
    return categoryList.map((category) => (
      <SortableCategoryItem
        key={category.id}
        category={category}
        level={level}
        onEdit={handleEdit}
        onDelete={handleDelete}
        translations={translations}
      />
    ));
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-surface-light rounded animate-pulse"></div>
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-surface-light rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text">{translations.title}</h1>
          <p className="text-text-secondary">{translations.description}</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
        >
          <Plus size={20} />
          <span>{translations.addNew}</span>
        </button>
      </div>

      {/* Category Form */}
      {showForm && (
        <div className="bg-surface border border-border rounded-lg p-6">
          <h2 className="text-lg font-semibold text-text mb-4">
            {editingCategory ? translations.editCategory : translations.addCategory}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text mb-2">
                  {translations.name} *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-text focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text mb-2">
                  {translations.icon}
                </label>
                <input
                  type="text"
                  value={formData.icon}
                  onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                  placeholder="📁"
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-text focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-text mb-2">
                {translations.descriptionField}
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-text focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text mb-2">
                  {translations.order}
                </label>
                <input
                  type="number"
                  value={formData.order}
                  onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-text focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text mb-2">
                  {translations.parentCategory}
                </label>
                <select
                  value={formData.parentId}
                  onChange={(e) => setFormData({ ...formData, parentId: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-text focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">{translations.noParent}</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex items-center space-x-3 pt-4">
              <button
                type="submit"
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
              >
                {editingCategory ? translations.update : translations.create}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 border border-border text-text rounded-lg hover:bg-surface-light transition-colors"
              >
                {translations.cancel}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Categories List */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-text">{translations.list}</h3>
        {categories.length === 0 ? (
          <div className="text-center py-8 text-text-secondary">
            {translations.noCategories}
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={categories.map(c => c.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-2">
                {renderCategoryTree(categories)}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>
    </div>
  );
}
