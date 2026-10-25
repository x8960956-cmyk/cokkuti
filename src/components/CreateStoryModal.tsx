import React, { useState, useRef } from 'react';
import { X, Upload, Camera, Film, Sparkles, AlertCircle, RefreshCw, Send } from 'lucide-react';
import { User } from '../types';

interface CreateStoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  onStoryCreated: (newStory: any) => void;
}

export const CreateStoryModal: React.FC<CreateStoryModalProps> = ({
  isOpen,
  onClose,
  user,
  onStoryCreated,
}) => {
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image');
  const [caption, setCaption] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleSelectFile = (file: File) => {
    const isVideo = file.type.startsWith('video/');
    const isImage = file.type.startsWith('image/');

    if (!isImage && !isVideo) {
      setError('Please select an image (JPG, PNG, WebP) or video (MP4, WebM)');
      return;
    }

    if (file.size > 30 * 1024 * 1024) {
      setError('Story media size exceeds 30MB limit. Please choose a smaller file.');
      return;
    }

    setError(null);
    setMediaFile(file);
    setMediaType(isVideo ? 'video' : 'image');

    const reader = new FileReader();
    reader.onload = (e) => {
      setMediaPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handlePublishStory = async () => {
    if (!mediaPreview) {
      setError('Please choose a photo or video for your story.');
      return;
    }

    setIsUploading(true);
    setUploadProgress(20);
    setError(null);

    try {
      // 1. Upload media to persistent storage
      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dataUrl: mediaPreview,
          name: mediaFile?.name || 'story_media',
        }),
      });

      setUploadProgress(65);
      const uploadData = await uploadRes.json();

      if (!uploadRes.ok || !uploadData.url) {
        throw new Error(uploadData.error || 'Failed to upload story media to storage');
      }

      setUploadProgress(85);

      // 2. Create story record in persistent database
      const storyRes = await fetch('/api/stories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mediaUrl: uploadData.url,
          mediaType,
          caption: caption.trim(),
        }),
      });

      const storyData = await storyRes.json();
      if (!storyRes.ok || !storyData.story) {
        throw new Error(storyData.error || 'Failed to save story record');
      }

      setUploadProgress(100);
      onStoryCreated(storyData.story);
      onClose();
    } catch (err: any) {
      console.error('Failed to create story:', err);
      setError(err?.message || 'Failed to publish story. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-lg bg-[#13192B] border border-[#1F293D] rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#1F293D] flex items-center justify-between bg-[#0B0F19]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#FF5E1E] to-[#6366F1] flex items-center justify-center text-white">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-white text-sm sm:text-base">Add to Your Story</h3>
              <p className="text-[11px] text-gray-400">Expires automatically after 24 hours</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1">
          {/* File Picker input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            onChange={(e) => {
              if (e.target.files?.[0]) {
                handleSelectFile(e.target.files[0]);
              }
              e.target.value = '';
            }}
            className="hidden"
          />

          {mediaPreview ? (
            <div className="space-y-3">
              <div className="relative aspect-[9/14] max-h-[380px] mx-auto rounded-2xl overflow-hidden bg-black border border-gray-700 shadow-xl flex items-center justify-center">
                {mediaType === 'video' ? (
                  <video
                    src={mediaPreview}
                    controls
                    autoPlay
                    playsInline
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <img
                    src={mediaPreview}
                    alt="Story Preview"
                    className="w-full h-full object-cover"
                  />
                )}

                {/* Change photo button */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute top-3 right-3 px-3 py-1.5 rounded-xl bg-black/60 hover:bg-black/80 backdrop-blur-md text-white text-xs font-semibold flex items-center gap-1.5 transition"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Change</span>
                </button>

                {caption && (
                  <div className="absolute bottom-4 left-4 right-4 bg-black/70 backdrop-blur-md p-2.5 rounded-xl text-center text-xs text-white font-medium">
                    {caption}
                  </div>
                )}
              </div>

              {/* Caption Input */}
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">
                  Add a Caption or Question (Optional)
                </label>
                <input
                  type="text"
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="Share what you're working on today..."
                  maxLength={160}
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-[#0B0F19] border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#FF5E1E]"
                />
              </div>
            </div>
          ) : (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                if (e.dataTransfer.files?.[0]) {
                  handleSelectFile(e.dataTransfer.files[0]);
                }
              }}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-3xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition min-h-[260px] ${
                isDragging
                  ? 'border-[#FF5E1E] bg-[#FF5E1E]/10'
                  : 'border-gray-700 hover:border-indigo-500 bg-[#0B0F19]/60 hover:bg-[#0B0F19]'
              }`}
            >
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#FF5E1E]/20 to-[#6366F1]/20 border border-orange-500/30 flex items-center justify-center text-[#FF5E1E] mb-3">
                <Camera className="w-7 h-7" />
              </div>
              <h4 className="font-bold text-white text-sm sm:text-base mb-1">
                Choose Photo or Video from Computer
              </h4>
              <p className="text-xs text-gray-400 max-w-xs mb-3">
                Upload team updates, launch milestones, sneak peeks, or demo clips.
              </p>
              <div className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#FF5E1E] to-[#6366F1] text-white text-xs font-bold shadow-lg shadow-orange-500/20">
                Browse Files
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 border-t border-[#1F293D] flex items-center justify-between bg-[#0B0F19]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-400 hover:text-white transition"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handlePublishStory}
            disabled={!mediaPreview || isUploading}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#FF5E1E] to-[#6366F1] hover:from-[#ff6d31] hover:to-[#4f46e5] text-white text-xs font-bold shadow-lg shadow-orange-500/25 transition flex items-center gap-1.5 disabled:opacity-50 active:scale-95 cursor-pointer"
          >
            {isUploading ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Publishing {uploadProgress}%...</span>
              </>
            ) : (
              <>
                <Send className="w-3.5 h-3.5" />
                <span>Publish Story (24h)</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
