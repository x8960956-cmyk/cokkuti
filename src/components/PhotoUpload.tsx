import React, { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon, Camera, RefreshCw, Check, AlertCircle, Eye, EyeOff, Lock, Globe, Users } from 'lucide-react';
import { RecordPhoto, VisibilityLevel } from '../types';

interface SinglePhotoUploadProps {
  currentUrl?: string;
  onUploaded: (url: string) => void;
  onRemove?: () => void;
  label?: string;
  sublabel?: string;
  aspect?: 'square' | 'cover' | 'video' | 'auto';
  className?: string;
}

export const SinglePhotoUpload: React.FC<SinglePhotoUploadProps> = ({
  currentUrl,
  onUploaded,
  onRemove,
  label = 'Choose Photo from Computer',
  sublabel = 'JPG, PNG, WebP or GIF up to 20MB',
  aspect = 'auto',
  className = '',
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | undefined>(currentUrl);
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync preview if currentUrl changes externally
  React.useEffect(() => {
    setPreviewUrl(currentUrl);
  }, [currentUrl]);

  const processFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file (JPG, PNG, WebP, GIF)');
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      setError('Image file exceeds the 20MB limit. Please choose a smaller photo.');
      return;
    }

    setError(null);
    setIsUploading(true);
    setUploadProgress(15);

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64Data = e.target?.result as string;
        setPreviewUrl(base64Data);
        setUploadProgress(45);

        // Upload to backend persistent storage
        const res = await fetch('/api/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            dataUrl: base64Data,
            name: file.name,
          }),
        });

        setUploadProgress(85);
        const data = await res.json();

        if (!res.ok || !data.success) {
          throw new Error(data.error || 'Failed to upload photo');
        }

        setUploadProgress(100);
        setPreviewUrl(data.url);
        onUploaded(data.url);
        setIsUploading(false);
      };

      reader.onerror = () => {
        setError('Error reading file from your device.');
        setIsUploading(false);
      };

      reader.readAsDataURL(file);
    } catch (err: any) {
      console.error('Upload failed:', err);
      setError(err?.message || 'Upload failed. Please try again.');
      setIsUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
    // reset input so the same file can be re-selected if replaced
    e.target.value = '';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const aspectClass =
    aspect === 'square'
      ? 'aspect-square max-w-[180px]'
      : aspect === 'cover'
      ? 'aspect-[3/1] w-full max-h-[160px]'
      : aspect === 'video'
      ? 'aspect-video w-full'
      : 'min-h-[120px] w-full';

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Hidden native file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      {previewUrl ? (
        <div className={`relative rounded-2xl overflow-hidden border border-gray-700 bg-[#0B0F19] group ${aspectClass}`}>
          <img
            src={previewUrl}
            alt="Uploaded preview"
            className="w-full h-full object-cover"
          />

          {/* Action overlay */}
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="px-3 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 backdrop-blur-md text-white text-xs font-semibold flex items-center gap-1.5 transition active:scale-95"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isUploading ? 'animate-spin' : ''}`} />
              <span>Change</span>
            </button>
            {onRemove && (
              <button
                type="button"
                onClick={() => {
                  setPreviewUrl(undefined);
                  onRemove();
                }}
                disabled={isUploading}
                className="px-3 py-1.5 rounded-xl bg-rose-500/80 hover:bg-rose-600 text-white text-xs font-semibold flex items-center gap-1.5 transition active:scale-95"
              >
                <X className="w-3.5 h-3.5" />
                <span>Remove</span>
              </button>
            )}
          </div>

          {/* Upload progress indicator */}
          {isUploading && (
            <div className="absolute inset-0 bg-black/75 backdrop-blur-sm flex flex-col items-center justify-center gap-2 p-4">
              <RefreshCw className="w-6 h-6 text-[#FF5E1E] animate-spin" />
              <span className="text-xs text-white font-medium">Uploading to persistent storage... {uploadProgress}%</span>
              <div className="w-36 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-[#FF5E1E] transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}
        </div>
      ) : (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-4 sm:p-5 flex flex-col items-center justify-center text-center cursor-pointer transition ${
            isDragging
              ? 'border-[#FF5E1E] bg-[#FF5E1E]/5 scale-[0.99]'
              : 'border-gray-700 hover:border-indigo-500/60 bg-[#0B0F19]/60 hover:bg-[#0B0F19]'
          } ${aspectClass}`}
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 flex items-center justify-center mb-2 text-indigo-400">
            {isUploading ? <RefreshCw className="w-5 h-5 animate-spin text-[#FF5E1E]" /> : <Camera className="w-5 h-5" />}
          </div>
          <span className="text-xs sm:text-sm font-semibold text-white mb-0.5">
            {isUploading ? 'Uploading...' : label}
          </span>
          <span className="text-[11px] text-gray-400">{sublabel}</span>
          <span className="mt-2 text-[10px] text-indigo-400 font-bold underline">
            Browse files or drag & drop
          </span>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-1.5 text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 p-2 rounded-xl">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};

interface GalleryPhotoUploadProps {
  photos: RecordPhoto[];
  onChange?: (photos: RecordPhoto[]) => void;
  onPhotosChanged?: (photos: RecordPhoto[]) => void;
  label?: string;
  title?: string;
  description?: string;
  helpText?: string;
  maxPhotos?: number;
}

export const GalleryPhotoUpload: React.FC<GalleryPhotoUploadProps> = ({
  photos = [],
  onChange,
  onPhotosChanged,
  label,
  title = 'Work & Project Photos',
  description = 'Add workplace photos, presentations, work samples, or awards.',
  helpText,
  maxPhotos = 12,
}) => {
  const triggerChange = (updated: RecordPhoto[]) => {
    if (onChange) onChange(updated);
    if (onPhotosChanged) onPhotosChanged(updated);
  };
  const displayTitle = label || title;
  const displayDesc = helpText || description;
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleMultipleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    if (photos.length + files.length > maxPhotos) {
      setError(`Maximum ${maxPhotos} photos allowed in this gallery.`);
      return;
    }

    setError(null);
    setIsUploading(true);

    const uploadedList: RecordPhoto[] = [];

    for (const file of Array.from(files)) {
      if (!file.type.startsWith('image/')) continue;

      try {
        const base64: string = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        const res = await fetch('/api/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            dataUrl: base64,
            name: file.name,
          }),
        });

        const data = await res.json();
        if (data.success && data.url) {
          uploadedList.push({
            id: `p-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            url: data.url,
            caption: '',
            visibility: 'public',
          });
        }
      } catch (err) {
        console.error('Failed to upload gallery image:', err);
      }
    }

    setIsUploading(false);
    if (uploadedList.length > 0) {
      triggerChange([...photos, ...uploadedList]);
    }
  };

  const handleRemovePhoto = (id: string) => {
    triggerChange(photos.filter(p => p.id !== id));
  };

  const handleUpdateCaption = (id: string, caption: string) => {
    triggerChange(photos.map(p => p.id === id ? { ...p, caption } : p));
  };

  const handleToggleVisibility = (id: string) => {
    triggerChange(photos.map(p => {
      if (p.id === id) {
        const nextVis: VisibilityLevel =
          p.visibility === 'public'
            ? 'members_only'
            : p.visibility === 'members_only'
            ? 'private'
            : 'public';
        return { ...p, visibility: nextVis };
      }
      return p;
    }));
  };

  return (
    <div className="space-y-3 p-4 rounded-2xl bg-[#0B0F19] border border-[#1F293D]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h4 className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5">
            <ImageIcon className="w-4 h-4 text-indigo-400" />
            <span>{displayTitle}</span>
            <span className="text-[10px] text-gray-400">({photos.length}/{maxPhotos})</span>
          </h4>
          <p className="text-[11px] text-gray-400">{displayDesc}</p>
        </div>

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading || photos.length >= maxPhotos}
          className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition active:scale-95 disabled:opacity-50 whitespace-nowrap"
        >
          <Upload className="w-3.5 h-3.5" />
          <span>{isUploading ? 'Uploading...' : 'Choose Photos from Computer'}</span>
        </button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={(e) => {
          handleMultipleFiles(e.target.files);
          e.target.value = '';
        }}
        className="hidden"
      />

      {error && (
        <div className="flex items-center gap-1.5 text-xs text-rose-400 bg-rose-500/10 p-2 rounded-xl">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}

      {/* Gallery Grid */}
      {photos.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
          {photos.map((item) => (
            <div key={item.id} className="relative rounded-xl overflow-hidden border border-gray-800 bg-[#13192B] group flex flex-col">
              <div className="relative aspect-video w-full bg-black/40">
                <img src={item.url} alt={item.caption || 'Photo'} className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => handleRemovePhoto(item.id)}
                  className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-rose-600/90 text-white flex items-center justify-center hover:bg-rose-600 transition"
                  title="Remove photo"
                >
                  <X className="w-3.5 h-3.5" />
                </button>

                <button
                  type="button"
                  onClick={() => handleToggleVisibility(item.id)}
                  className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded text-[9px] font-semibold bg-black/70 backdrop-blur-md text-gray-300 hover:text-white flex items-center gap-1 transition"
                  title="Toggle photo visibility"
                >
                  {item.visibility === 'public' && <Globe className="w-2.5 h-2.5 text-emerald-400" />}
                  {item.visibility === 'members_only' && <Users className="w-2.5 h-2.5 text-indigo-400" />}
                  {item.visibility === 'private' && <Lock className="w-2.5 h-2.5 text-amber-400" />}
                  <span>{item.visibility || 'public'}</span>
                </button>
              </div>

              <div className="p-2">
                <input
                  type="text"
                  value={item.caption || ''}
                  onChange={(e) => handleUpdateCaption(item.id, e.target.value)}
                  placeholder="Optional caption..."
                  className="w-full text-[11px] bg-black/40 border border-gray-800 rounded-lg px-2 py-1 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-6 border border-dashed border-gray-800 rounded-xl text-xs text-gray-500">
          No photos added yet. Select photos from your computer or phone to attach to this record.
        </div>
      )}
    </div>
  );
};
