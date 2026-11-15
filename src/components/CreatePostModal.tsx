import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  FileText,
  Image as ImageIcon,
  Video,
  BarChart2,
  Plus,
  Trash2,
  Send,
  Flame,
  Upload,
  Film,
  Camera,
  Loader2,
} from 'lucide-react';
import { uploadMediaFile, extractVideoDuration, formatDuration } from '../utils/mediaUpload';

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (postData: {
    type: 'post' | 'idea' | 'pitch' | 'video' | 'poll' | 'update';
    title?: string;
    content: string;
    tags: string[];
    media?: { type: 'image' | 'video'; url: string; caption?: string }[];
    poll?: { question: string; options: { text: string; votes: number }[]; totalVotes: number };
    videoDurationSeconds?: number;
  }) => void;
  defaultType?: string;
}

export const CreatePostModal: React.FC<CreatePostModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  defaultType = 'post',
}) => {
  const [postType, setPostType] = useState<string>(defaultType);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tagInput, setTagInput] = useState('#BuildingInPublic, #Startups');
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setPostType(defaultType || 'post');
      setUploadError(null);
    }
  }, [isOpen, defaultType]);
  
  // Media states: persisted uploaded files or URLs
  const [mediaList, setMediaList] = useState<{
    type: 'image' | 'video';
    url: string;
    name: string;
    size?: string;
    durationSeconds?: number;
  }[]>([]);

  const [useUrlInput, setUseUrlInput] = useState(false);
  const [manualUrl, setManualUrl] = useState('');

  // Poll state
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState<string[]>(['Yes, definitely', 'Not right now']);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Upload images permanently to server /uploads storage
  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploadError(null);

    for (const file of Array.from(files)) {
      try {
        setUploadProgress(5);
        const uploaded = await uploadMediaFile(file, (pct) => setUploadProgress(pct));
        const fileSizeMB = (file.size / (1024 * 1024)).toFixed(1);
        setMediaList(prev => [
          ...prev,
          {
            type: 'image',
            url: uploaded.url,
            name: file.name,
            size: `${fileSizeMB} MB`,
          },
        ]);
      } catch (err: any) {
        setUploadError(err?.message || 'Failed to upload image');
      } finally {
        setUploadProgress(null);
      }
    }
    e.target.value = '';
  };

  // Upload video permanently to server /uploads storage with duration detection
  const handleVideoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError(null);

    try {
      setUploadProgress(5);
      const [durationSeconds, uploaded] = await Promise.all([
        extractVideoDuration(file),
        uploadMediaFile(file, (pct) => setUploadProgress(pct)),
      ]);
      const fileSizeMB = (file.size / (1024 * 1024)).toFixed(1);
      setMediaList([
        {
          type: 'video',
          url: uploaded.url,
          name: file.name,
          size: `${fileSizeMB} MB`,
          durationSeconds,
        },
      ]);
      setPostType('video');
    } catch (err: any) {
      setUploadError(err?.message || 'Failed to upload video');
    } finally {
      setUploadProgress(null);
    }
    e.target.value = '';
  };

  const handleAddManualUrl = () => {
    if (!manualUrl.trim()) return;
    const isVid = manualUrl.endsWith('.mp4') || manualUrl.endsWith('.webm') || postType === 'video';
    setMediaList(prev => [
      ...prev,
      {
        type: isVid ? 'video' : 'image',
        url: manualUrl.trim(),
        name: manualUrl.split('/').pop() || 'Web Media',
      },
    ]);
    setManualUrl('');
    setUseUrlInput(false);
  };

  const handleRemoveMedia = (index: number) => {
    setMediaList(prev => prev.filter((_, i) => i !== index));
  };

  const handleAddPollOption = () => {
    if (pollOptions.length < 5) {
      setPollOptions([...pollOptions, '']);
    }
  };

  const handlePollOptionChange = (idx: number, val: string) => {
    const updated = [...pollOptions];
    updated[idx] = val;
    setPollOptions(updated);
  };

  const handleRemovePollOption = (idx: number) => {
    if (pollOptions.length > 2) {
      setPollOptions(pollOptions.filter((_, i) => i !== idx));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() && !title.trim() && mediaList.length === 0) return;

    const parsedTags = tagInput
      .split(',')
      .map(t => t.trim())
      .filter(t => t.length > 0)
      .map(t => (t.startsWith('#') ? t : `#${t}`));

    const media =
      mediaList.length > 0
        ? mediaList.map(m => ({
            type: m.type,
            url: m.url,
            caption: m.name,
          }))
        : undefined;

    let poll = undefined;
    if (postType === 'poll' && pollQuestion.trim()) {
      poll = {
        question: pollQuestion.trim(),
        options: pollOptions
          .filter(o => o.trim().length > 0)
          .map(o => ({ text: o.trim(), votes: 1 })),
        totalVotes: pollOptions.filter(o => o.trim().length > 0).length,
      };
    }

    const videoMedia = mediaList.find(m => m.type === 'video');
    const calculatedType =
      postType === 'poll'
        ? 'poll'
        : videoMedia || postType === 'video'
        ? 'video'
        : 'post';

    onSubmit({
      type: calculatedType as any,
      title: title.trim() || undefined,
      content: content.trim() || title.trim() || 'Shared a video on COOK',
      tags: parsedTags.length > 0 ? parsedTags : ['#COOK', '#Startups'],
      media,
      poll,
      videoDurationSeconds: videoMedia?.durationSeconds,
    });

    setTitle('');
    setContent('');
    setMediaList([]);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in select-none">
      <div className="bg-[#13192B] border border-[#1F293D] rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-[#1F293D] bg-gradient-to-r from-[#1E1B4B]/80 to-[#13192B]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-orange-500/20 text-[#FF5E1E] flex items-center justify-center border border-orange-500/30">
              <Flame className="w-4 h-4 fill-[#FF5E1E]" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">What's Cooking?</h3>
              <p className="text-[11px] text-gray-400">Share with the global founder and investor network</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 flex items-center justify-center transition active:scale-95"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Hidden File Inputs for Computer Uploads */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleImageFileChange}
        />
        <input
          ref={videoInputRef}
          type="file"
          accept="video/mp4,video/webm,video/quicktime,video/*"
          className="hidden"
          onChange={handleVideoFileChange}
        />

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1">
          {/* Post Type Selector Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
            {[
              { id: 'post', label: 'General Post', icon: FileText },
              { id: 'photo', label: 'Photo Upload', icon: ImageIcon },
              { id: 'video', label: 'Video Upload', icon: Video },
              { id: 'poll', label: 'Poll', icon: BarChart2 },
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setPostType(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap transition active:scale-95 ${
                  postType === tab.id
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'bg-[#0B0F19] text-gray-400 hover:text-white border border-gray-800'
                }`}
              >
                <tab.icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1">
              {postType === 'video' || mediaList.some(m => m.type === 'video')
                ? 'Video Title *'
                : 'Title / Hook (Optional)'}
            </label>
            <input
              type="text"
              required={postType === 'video' || mediaList.some(m => m.type === 'video')}
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder={
                postType === 'video'
                  ? 'e.g. Live Product Walkthrough: How our MVP works'
                  : 'e.g. Just launched our AI MVP on COOK!'
              }
              className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-[#0B0F19] border border-gray-800 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#FF5E1E]"
            />
          </div>

          {/* Content Body */}
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1">
              {postType === 'video' || mediaList.some(m => m.type === 'video')
                ? 'Video Description & Context *'
                : 'Your Story, Question, or Idea *'}
            </label>
            <textarea
              rows={4}
              required={mediaList.length === 0}
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder={
                postType === 'video'
                  ? 'Describe what viewers will see in this video, key milestones, or feedback you want...'
                  : "Share what you're building, insights learned, customer validation findings, or ask for feedback..."
              }
              className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-[#0B0F19] border border-gray-800 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#FF5E1E]"
            />
          </div>

          {/* Direct Computer Upload Dropzone Area */}
          {(postType === 'photo' || postType === 'video' || postType === 'post') && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-300 flex items-center gap-1.5">
                  <Upload className="w-3.5 h-3.5 text-[#FF5E1E]" />
                  <span>Attach Media from this Computer / Device</span>
                </span>
                <button
                  type="button"
                  onClick={() => setUseUrlInput(!useUrlInput)}
                  className="text-[11px] font-medium text-indigo-400 hover:text-indigo-300"
                >
                  {useUrlInput ? 'Hide URL input' : 'Or paste web link'}
                </button>
              </div>

              {/* Upload Trigger Buttons */}
              <div className="grid grid-cols-2 gap-2.5">
                {/* Upload Photo Button */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="p-3.5 rounded-2xl bg-[#0B0F19] border-2 border-dashed border-gray-800 hover:border-indigo-500 text-center transition group active:scale-98 flex flex-col items-center justify-center gap-1"
                >
                  <div className="w-9 h-9 rounded-full bg-indigo-500/10 text-indigo-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Camera className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-bold text-white mt-1">Upload Photos</span>
                  <span className="text-[10px] text-gray-400">From this computer (PNG, JPG)</span>
                </button>

                {/* Upload Video Button */}
                <button
                  type="button"
                  onClick={() => videoInputRef.current?.click()}
                  className="p-3.5 rounded-2xl bg-[#0B0F19] border-2 border-dashed border-gray-800 hover:border-[#FF5E1E] text-center transition group active:scale-98 flex flex-col items-center justify-center gap-1"
                >
                  <div className="w-9 h-9 rounded-full bg-orange-500/10 text-[#FF5E1E] flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Film className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-bold text-white mt-1">Upload Video</span>
                  <span className="text-[10px] text-gray-400">From this computer (MP4, WebM)</span>
                </button>
              </div>

              {/* Paste URL Input if selected */}
              {useUrlInput && (
                <div className="flex gap-2 p-2 bg-[#0B0F19] border border-gray-800 rounded-xl">
                  <input
                    type="text"
                    value={manualUrl}
                    onChange={e => setManualUrl(e.target.value)}
                    placeholder="Paste image or video link (https://...)"
                    className="flex-1 px-3 py-1.5 text-xs bg-transparent text-white focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleAddManualUrl}
                    className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg"
                  >
                    Add
                  </button>
                </div>
              )}

              {/* Upload Progress / Error */}
              {uploadProgress !== null && (
                <div className="p-3 rounded-xl bg-[#0B0F19] border border-indigo-500/40 space-y-1.5">
                  <div className="flex items-center justify-between text-xs text-indigo-300 font-semibold">
                    <span className="flex items-center gap-1.5">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Uploading media to COOK server...</span>
                    </span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-gray-800 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-indigo-500 to-[#FF5E1E] transition-all"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {uploadError && (
                <p className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/30 rounded-xl px-3 py-2">
                  {uploadError}
                </p>
              )}

              {/* Attached Media Previews */}
              {mediaList.length > 0 && (
                <div className="space-y-2.5 pt-1">
                  <span className="text-[11px] font-semibold text-gray-400">
                    Uploaded & Ready ({mediaList.length}):
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {mediaList.map((m, idx) => (
                      <div
                        key={idx}
                        className="relative rounded-xl overflow-hidden border border-gray-700 bg-black aspect-video group"
                      >
                        {m.type === 'video' ? (
                          <video src={m.url} className="w-full h-full object-cover" controls />
                        ) : (
                          <img src={m.url} alt={m.name} className="w-full h-full object-cover" />
                        )}
                        <button
                          type="button"
                          onClick={() => handleRemoveMedia(idx)}
                          className="absolute top-1.5 right-1.5 p-1.5 rounded-full bg-rose-600 text-white shadow-lg opacity-85 hover:opacity-100"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        <span className="absolute bottom-1 left-1 max-w-[85%] text-[9px] font-medium bg-black/75 text-white px-1.5 py-0.5 rounded truncate">
                          {m.durationSeconds ? `${formatDuration(m.durationSeconds)} • ` : ''}
                          {m.name}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Poll Setup */}
          {postType === 'poll' && (
            <div className="p-3.5 rounded-2xl bg-[#0B0F19] border border-gray-800 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1">
                  Poll Question *
                </label>
                <input
                  type="text"
                  value={pollQuestion}
                  onChange={e => setPollQuestion(e.target.value)}
                  placeholder="e.g. Which pricing model would you choose?"
                  className="w-full px-3 py-2 text-xs bg-[#13192B] border border-gray-700 rounded-xl text-white"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-semibold text-gray-400">Options</label>
                {pollOptions.map((opt, idx) => (
                  <div key={idx} className="flex gap-2">
                    <input
                      type="text"
                      value={opt}
                      onChange={e => handlePollOptionChange(idx, e.target.value)}
                      placeholder={`Option ${idx + 1}`}
                      className="flex-1 px-3 py-1.5 text-xs bg-[#13192B] border border-gray-700 rounded-lg text-white"
                    />
                    {pollOptions.length > 2 && (
                      <button
                        type="button"
                        onClick={() => handleRemovePollOption(idx)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-rose-400"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
                {pollOptions.length < 4 && (
                  <button
                    type="button"
                    onClick={handleAddPollOption}
                    className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Option</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Tags */}
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1">
              Topic Tags (comma separated)
            </label>
            <input
              type="text"
              value={tagInput}
              onChange={e => setTagInput(e.target.value)}
              className="w-full px-3.5 py-2 text-xs bg-[#0B0F19] border border-gray-800 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Bottom Actions */}
          <div className="pt-3 border-t border-[#1F293D] flex justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white text-xs font-bold shadow-md shadow-indigo-600/30 flex items-center gap-1.5"
            >
              <span>Publish Post</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
