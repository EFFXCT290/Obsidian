"use client";

import React, { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Upload } from '@styled-icons/boxicons-regular/Upload';
import toast from 'react-hot-toast';
import TorrentUploadArea from '@/app/torrent/upload/components/TorrentUploadArea';
import ImageUploadArea from '@/app/torrent/upload/components/ImageUploadArea';
import NfoUploadArea from '@/app/torrent/upload/components/NfoUploadArea';
import UploadForm from '@/app/torrent/upload/components/UploadForm';
import UploadOptions from '@/app/torrent/upload/components/UploadOptions';
import UploadActions from '@/app/torrent/upload/components/UploadActions';
import UploadTips from '@/app/torrent/upload/components/UploadTips';
import { API_BASE_URL } from '@/lib/api';

const uploadSchema = z.object({
  name: z.string().min(1, 'Required').max(255, 'Too long'),
  description: z.string().min(10, 'Too short').max(2000, 'Too long'),
  category: z.string().min(1, 'Required'),
  source: z.string().min(1, 'Required'),
  tags: z.array(z.string()).min(1, 'At least one tag').max(10, 'Too many tags'),
  anonymous: z.boolean(),
  freeleech: z.boolean(),
});

type UploadFormData = z.infer<typeof uploadSchema>;

export default function UploadContent() {
  const router = useRouter();
  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [uploadedNfo, setUploadedNfo] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [loading] = useState(false);
  const [isImageDragOver, setIsImageDragOver] = useState(false);
  const [isNfoDragOver, setIsNfoDragOver] = useState(false);

  const { handleSubmit, formState: { isValid, errors }, watch, setValue, register } = useForm<UploadFormData>({
    resolver: zodResolver(uploadSchema),
    mode: 'onChange',
    reValidateMode: 'onChange',
    criteriaMode: 'all',
    shouldFocusError: false,
    defaultValues: { name: '', description: '', category: '', source: '', tags: [], anonymous: false, freeleech: false },
  });

  const watchedTags = watch('tags');
  const watchedCategoryId = watch('category');
  const watchedName = watch('name');
  const watchedDescription = watch('description');

  const sanitizeToWindowsName = (input: string): string => {
    let name = String(input || '');
    name = name.replace(/\.torrent$/i, '');
    name = name.replace(/[<>:"/\\|?*\x00-\x1F]/g, '_');
    try {
      name = name.replace(/[\u200D\uFE0F]/g, '_').replace(/\p{Extended_Pictographic}/gu, '_');
    } catch {
      name = name.replace(/[\u200D\uFE0F]/g, '_');
    }
    name = name.replace(/[ .]+$/g, '_');
    name = name.replace(/_{2,}/g, '_');
    if (!name.trim()) name = 'torrent';
    return name;
  };

  const handleFileSelect = useCallback((file: File) => {
    if (file.size > MAX_FILE_SIZE) { toast.error('Torrent file is too large (max 10MB)'); return; }
    setUploadedFile(file);
    setValue('name', sanitizeToWindowsName(file.name), { shouldValidate: true, shouldDirty: true });
  }, [setValue, MAX_FILE_SIZE]);

  const handleDragOver = useCallback((e: React.DragEvent) => { e.preventDefault(); setIsDragOver(true); }, []);
  const handleDragLeave = useCallback((e: React.DragEvent) => { e.preventDefault(); setIsDragOver(false); }, []);
  const handleDrop = useCallback((e: React.DragEvent) => { e.preventDefault(); setIsDragOver(false); const f = Array.from(e.dataTransfer.files).find((x: File) => x.name.endsWith('.torrent')); if (f) handleFileSelect(f); }, [handleFileSelect]);

  const handleImageSelect = useCallback((file: File) => {
    if (file.size > MAX_FILE_SIZE) { toast.error('Image is too large (max 10MB)'); return; }
    setUploadedImage(file);
    const reader = new FileReader();
    reader.onload = (e) => setImagePreview(e.target?.result as string);
    reader.readAsDataURL(file);
  }, [MAX_FILE_SIZE]);
  const handleImageRemove = useCallback(() => { setUploadedImage(null); setImagePreview(null); }, []);
  const handleNfoSelect = useCallback((file: File) => {
    if (file.size > MAX_FILE_SIZE) { toast.error('NFO file is too large (max 10MB)'); return; }
    setUploadedNfo(file);
  }, [MAX_FILE_SIZE]);
  const handleNfoRemove = useCallback(() => setUploadedNfo(null), []);

  const addTag = useCallback((tag: string) => { if (!watchedTags.includes(tag)) setValue('tags', [...watchedTags, tag], { shouldValidate: true, shouldDirty: true }); }, [watchedTags, setValue]);
  const removeTag = useCallback((tagToRemove: string) => setValue('tags', watchedTags.filter(t => t !== tagToRemove), { shouldValidate: true, shouldDirty: true }), [watchedTags, setValue]);
  const addCustomTag = useCallback((customTag: string) => { if (!watchedTags.includes(customTag)) setValue('tags', [...watchedTags, customTag], { shouldValidate: true, shouldDirty: true }); }, [watchedTags, setValue]);

  const onSubmit = useCallback(async (data: UploadFormData) => {
    if (!uploadedFile) { toast.error('Selecciona un archivo .torrent'); return; }
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('torrent', uploadedFile);
      formData.append('name', data.name);
      formData.append('description', data.description);
      formData.append('categoryId', data.category);
      if (uploadedImage) formData.append('poster', uploadedImage);
      if (uploadedNfo) formData.append('nfo', uploadedNfo);
      if (Array.isArray(data.tags)) formData.append('tags', JSON.stringify(data.tags));

      const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
      const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};

      const res = await fetch(`${API_BASE_URL}/torrent/upload`, { method: 'POST', headers, body: formData });
      if (!res.ok) {
        let message = 'Error al subir el torrent';
        try { const payload = await res.json(); if (typeof payload?.error === 'string') message = payload.error; else if (typeof payload?.message === 'string') message = payload.message; } catch {}
        toast.error(message);
        return;
      }
      const result = await res.json();
      toast.success('Torrent subido correctamente');
      router.push(`/torrent/${result.id}`);
    } catch (e) {
      toast.error((e as Error).message || 'Error al subir el torrent');
    } finally {
      setIsUploading(false);
    }
  }, [uploadedFile, uploadedImage, uploadedNfo, router]);

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-text mb-2"><Upload className="inline mr-2 align-text-bottom" size={28} />Upload torrent</h1>
        <p className="text-text-secondary">Share your content with the community.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <TorrentUploadArea uploadedFile={uploadedFile} isDragOver={isDragOver} onFileSelect={handleFileSelect} onFileRemove={() => setUploadedFile(null)} onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop} loading={loading} />
          <ImageUploadArea uploadedImage={uploadedImage} imagePreview={imagePreview} onImageSelect={handleImageSelect} onImageRemove={handleImageRemove} onDragOver={(e: React.DragEvent) => { e.preventDefault(); setIsImageDragOver(true); }} onDragLeave={(e: React.DragEvent) => { e.preventDefault(); setIsImageDragOver(false); }} onDrop={(e: React.DragEvent) => { e.preventDefault(); setIsImageDragOver(false); const f = Array.from(e.dataTransfer.files).find((x: File) => x.type.startsWith('image/')); if (f) handleImageSelect(f); }} isDragOver={isImageDragOver} loading={loading} />
        </div>

        <UploadForm loading={loading} uploadedFile={uploadedFile} watchedCategory={watchedCategoryId} watchedName={watchedName} watchedDescription={watchedDescription} watchedTags={watchedTags} onAddTag={addTag} onRemoveTag={removeTag} onAddCustomTag={addCustomTag} register={register} errors={errors} />

        <div className="lg:col-span-2">
          <label className="block text-sm font-medium text-text mb-2">Attach NFO</label>
          <NfoUploadArea uploadedNfo={uploadedNfo} onNfoSelect={handleNfoSelect} onNfoRemove={handleNfoRemove} onDragOver={(e: React.DragEvent) => { e.preventDefault(); setIsNfoDragOver(true); }} onDragLeave={(e: React.DragEvent) => { e.preventDefault(); setIsNfoDragOver(false); }} onDrop={(e: React.DragEvent) => { e.preventDefault(); setIsNfoDragOver(false); const f = Array.from(e.dataTransfer.files).find((x: File) => x.name.toLowerCase().endsWith('.nfo')); if (f) handleNfoSelect(f); }} isDragOver={isNfoDragOver} loading={loading} />
        </div>

        <div className="lg:col-span-2">
          <UploadOptions anonymous={watch('anonymous')} freeleech={watch('freeleech')} onAnonymousChange={(v: boolean) => setValue('anonymous', v, { shouldValidate: true, shouldDirty: true })} onFreeleechChange={(v: boolean) => setValue('freeleech', v, { shouldValidate: true, shouldDirty: true })} loading={loading} />
        </div>

        <UploadActions isValid={isValid} hasFile={!!uploadedFile} isUploading={isUploading} disabledReasons={(() => {
          const reasons: string[] = [];
          if (!uploadedFile) reasons.push('Selecciona un archivo .torrent.');
          if (!watch('name')) reasons.push('Introduce un nombre para el torrent.');
          if (!watch('description') || watch('description').length < 10) reasons.push('Añade una descripción (mínimo 10 caracteres).');
          if (!watch('category')) reasons.push('Selecciona una categoría.');
          if (!watch('source')) reasons.push('Selecciona un source.');
          if (!watch('tags') || watch('tags').length === 0) reasons.push('Añade al menos una etiqueta.');
          const zodMsgs = Array.from(new Set(Object.values(errors).map((e) => (e as { message?: string } | undefined)?.message).filter(Boolean)));
          reasons.push(...zodMsgs as string[]);
          return reasons;
        })()} notes={(uploadedFile ? ['Recuerda: el .torrent debe estar marcado como privado y contener tu passkey en la URL de announce.'] : [])} loading={loading} />
      </form>

      <UploadTips loading={loading} />
    </div>
  );
}


