"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { Plus } from '@styled-icons/boxicons-regular/Plus';
import { useI18n } from '@/app/hooks/useI18n';
import { generateTagSuggestions } from '../utils/tagSuggestions';
import { API_BASE_URL } from '@/lib/api';

interface UploadFormProps {
  loading?: boolean;
  uploadedFile?: File | null;
  watchedCategory?: string;
  watchedName?: string;
  watchedTags?: string[];
  watchedDescription?: string;
  onAddTag?: (tag: string) => void;
  onRemoveTag?: (tag: string) => void;
  onAddCustomTag?: (tag: string) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  register?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  errors?: any;
}

interface CategoryNode { id: string; name: string; children?: CategoryNode[] }
interface SourceItem { id: string; name: string }

const POPULAR_TAGS = ['HD','4K','HDR','DTS','AC3','AAC','FLAC','MP3','BluRay','WebDL','HDRip','Complete','Season','Episode','Documentary','Comedy','Drama','Action','Horror','Sci-Fi'];

export default function UploadForm({ loading = false, uploadedFile, watchedCategory, watchedName, watchedTags = [], watchedDescription, onAddTag, onRemoveTag, onAddCustomTag, register, errors }: UploadFormProps) {
  const { t } = useI18n();
  const [categories, setCategories] = useState<CategoryNode[]>([]);
  const [sources, setSources] = useState<SourceItem[]>([]);

  const nameIssues = useMemo(() => {
    const issues: string[] = [];
    const value = String(watchedName || '');
    if (!value.trim()) { issues.push('El nombre no puede estar vacío.'); return issues; }
    if (/[<>:"/\\|?*\x00-\x1F]/.test(value)) issues.push('Contiene caracteres no permitidos: \\ / : * ? " < > | o de control.');
    try { if (/\p{Extended_Pictographic}|[\u200D\uFE0F]/u.test(value)) issues.push('No se permiten emojis en el nombre.'); } catch { if (/[\u200D\uFE0F]/.test(value)) issues.push('No se permiten emojis en el nombre.'); }
    if (/[ .]+$/.test(value)) issues.push('No puede terminar con espacios o puntos.');
    if (/^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])(\..*)?$/i.test(value.trim())) issues.push('No puede usar nombres reservados de Windows (CON, PRN, AUX, NUL, COM1-9, LPT1-9).');
    if (value.length > 200) issues.push('El nombre es demasiado largo (máximo 200 caracteres).');
    return issues;
  }, [watchedName]);

  useEffect(() => { (async () => { const res = await fetch(`${API_BASE_URL}/categories`, { cache: 'no-store' }); if (res.ok) setCategories(await res.json()); })(); }, []);
  useEffect(() => { (async () => { try { setSources([]); if (!watchedCategory) return; const res = await fetch(`${API_BASE_URL}/category/${watchedCategory}/sources`, { cache: 'no-store' }); if (res.ok) { const data = await res.json(); const merged = [...(data.own || []), ...(data.inherited || [])] as SourceItem[]; const unique = Array.from(new Map(merged.map(s => [s.id, s])).values()); setSources(unique); } } catch {} })(); }, [watchedCategory]);

  const categoryOptions = useMemo(() => {
    const flat: { id: string; label: string }[] = [];
    for (const c of categories) { flat.push({ id: c.id, label: c.name }); (c.children || []).forEach(sc => flat.push({ id: sc.id, label: `— ${sc.name}` })); }
    return flat;
  }, [categories]);

  const selectedCategoryLabel = useMemo(() => {
    return categoryOptions.find(opt => opt.id === watchedCategory)?.label;
  }, [categoryOptions, watchedCategory]);

  const suggestionName = useMemo(() => uploadedFile?.name || watchedName || '', [uploadedFile?.name, watchedName]);
  const remainingTagSlots = Math.max(0, 10 - (watchedTags?.length || 0));

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <div className="w-24 h-5 bg-text-secondary/10 rounded animate-pulse mb-2"></div>
          <div className="w-full h-12 bg-text-secondary/10 rounded animate-pulse"></div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <div className="w-20 h-5 bg-text-secondary/10 rounded animate-pulse mb-2"></div>
            <div className="w-full h-12 bg-text-secondary/10 rounded animate-pulse"></div>
          </div>
          <div>
            <div className="w-16 h-5 bg-text-secondary/10 rounded animate-pulse mb-2"></div>
            <div className="w-full h-12 bg-text-secondary/10 rounded animate-pulse"></div>
          </div>
        </div>
        <div>
          <div className="w-28 h-5 bg-text-secondary/10 rounded animate-pulse mb-2"></div>
          <div className="w-full h-32 bg-text-secondary/10 rounded animate-pulse"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="lg:col-span-2">
          <label className="block text-sm font-medium text-text mb-2">{t('upload.form.name.label', 'Nombre')}</label>
          <input {...register?.('name')} type="text" className="w-full px-4 py-3 bg-background border border-border rounded-lg text-text placeholder-text-secondary focus:outline-none focus:border-primary transition-colors" placeholder={t('upload.form.name.placeholder', 'Nombre del torrent')} />
          <div className="flex items-center justify-end mt-1 text-xs text-text-secondary"><span>{(watchedName || '').length}/255</span></div>
          {errors?.name && (<p className="text-red-500 text-sm mt-1">{errors.name.message}</p>)}
          {nameIssues.length > 0 && (
            <div className="mt-2 text-xs bg-surface border border-border rounded-md p-2 text-text-secondary">
              <p className="mb-1 text-text">{t('upload.form.name.issues.review', 'Revisa el nombre:')}</p>
              <ul className="list-disc list-inside space-y-0.5">{nameIssues.map((msg) => (<li key={msg}>{msg}</li>))}</ul>
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-text mb-2">{t('upload.form.category.label', 'Categoría')}</label>
          <select {...register?.('category')} className="w-full px-4 py-3 bg-background border border-border rounded-lg text-text focus:outline-none focus:border-primary transition-colors">
            <option value="">{t('upload.form.category.placeholder', 'Selecciona una categoría')}</option>
            {categoryOptions.map(opt => (<option key={opt.id} value={opt.id}>{opt.label}</option>))}
          </select>
          {errors?.category && (<p className="text-red-500 text-sm mt-1">{errors.category.message}</p>)}
        </div>

        <div>
          <label className="block text-sm font-medium text-text mb-2">{t('upload.form.source.label', 'Source')}</label>
          <select {...register?.('source')} className="w-full px-4 py-3 bg-background border border-border rounded-lg text-text focus:outline-none focus:border-primary transition-colors" disabled={!watchedCategory}>
            <option value="">{t('upload.form.source.placeholder', 'Selecciona un source')}</option>
            {sources.map(s => (<option key={s.id} value={s.id}>{s.name}</option>))}
          </select>
          {errors?.source && (<p className="text-red-500 text-sm mt-1">{errors.source.message}</p>)}
        </div>

        <div className="lg:col-span-2">
          <label className="block text-sm font-medium text-text mb-2">{t('upload.form.description.label', 'Descripción')}</label>
          <textarea {...register?.('description')} rows={6} className="w-full px-4 py-3 bg-background border border-border rounded-lg text-text placeholder-text-secondary focus:outline-none focus:border-primary transition-colors resize-vertical" placeholder={t('upload.form.description.placeholder', 'Describe tu torrent')} />
          <div className="flex items-center justify-end mt-1 text-xs text-text-secondary"><span>{(watchedDescription || '').length}/2000</span></div>
          {errors?.description && (<p className="text-red-500 text-sm mt-1">{errors.description.message}</p>)}
        </div>
      </div>

      <div className="lg:col-span-2">
        <label className="block text-sm font-medium text-text mb-2">{`Etiquetas (${watchedTags.length}/10)`}</label>
        <div className="flex flex-wrap gap-2 mb-3">
          {watchedTags.map((tag: string) => (
            <span key={tag} className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-primary/10 text-primary">{tag}
              {onRemoveTag && (<button type="button" onClick={() => onRemoveTag(tag)} className="ml-2 hover:text-red-500 transition-colors">×</button>)}
            </span>
          ))}
        </div>
        {(suggestionName && watchedCategory) && remainingTagSlots > 0 && (
          <div className="mb-3">
            <p className="text-sm text-text-secondary mb-2">{t('upload.form.tags.suggested', 'Etiquetas sugeridas')}</p>
            <div className="flex flex-wrap gap-2">
              {generateTagSuggestions(suggestionName, { categoryLabel: selectedCategoryLabel })
                .filter(tag => !watchedTags.includes(tag))
                .slice(0, remainingTagSlots)
                .map((tag: string) => (
                <button key={tag} type="button" onClick={() => onAddTag?.(tag)} disabled={watchedTags.length >= 10} className="px-3 py-1 rounded-full text-sm bg-primary/10 border border-primary/20 text-primary hover:bg-primary/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">{tag}</button>
              ))}
            </div>
          </div>
        )}
        <div className="mb-3">
          <p className="text-sm text-text-secondary mb-2">{t('upload.form.tags.popular', 'Etiquetas populares')}</p>
          <div className="flex flex-wrap gap-2">
            {POPULAR_TAGS.map((tag: string) => (
              <button key={tag} type="button" onClick={() => onAddTag?.(tag)} disabled={watchedTags.includes(tag) || watchedTags.length >= 10} className="px-3 py-1 rounded-full text-sm bg-surface border border-border text-text hover:bg-surface-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed">{tag}</button>
            ))}
          </div>
        </div>
        <div className="flex space-x-2">
          <input
            type="text"
            placeholder={t('upload.form.tags.customPlaceholder', 'Añadir etiqueta personalizada')}
            className="flex-1 px-4 py-2 bg-background border border-border rounded-lg text-text placeholder-text-secondary focus:outline-none focus:border-primary transition-colors"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                const input = e.currentTarget as HTMLInputElement;
                const value = (input.value || '').trim();
                if (!value) return;
                if (watchedTags.length >= 10) return;
                if (watchedTags.includes(value)) return;
                onAddCustomTag?.(value);
                input.value = '';
              }
            }}
          />
          <button
            type="button"
            onClick={(e) => {
              const input = (e.currentTarget.previousElementSibling as HTMLInputElement);
              const value = (input.value || '').trim();
              if (!value) return;
              if (watchedTags.length >= 10) return;
              if (watchedTags.includes(value)) return;
              onAddCustomTag?.(value);
              input.value = '';
            }}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
          >
            <Plus size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}


