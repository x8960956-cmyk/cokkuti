import React, { useState, useEffect } from 'react';
import { Plus, Sparkles } from 'lucide-react';
import { Story, User } from '../types';
import { CreateStoryModal } from './CreateStoryModal';
import { StoryViewerModal } from './StoryViewerModal';

interface StoriesBarProps {
  currentUser: User;
}

export const StoriesBar: React.FC<StoriesBarProps> = ({ currentUser }) => {
  const [stories, setStories] = useState<Story[]>([]);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [viewerModalOpen, setViewerModalOpen] = useState(false);
  const [selectedStoryIndex, setSelectedStoryIndex] = useState(0);

  const fetchStories = async () => {
    try {
      const res = await fetch('/api/stories');
      const data = await res.json();
      if (data.stories) {
        setStories(data.stories);
      }
    } catch (err) {
      console.warn('Could not fetch stories:', err);
    }
  };

  useEffect(() => {
    fetchStories();
    // Poll every 60 seconds to check for story auto-expiration
    const interval = setInterval(fetchStories, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleStoryCreated = (newStory: Story) => {
    setStories((prev) => [newStory, ...prev.filter((s) => s.id !== newStory.id)]);
  };

  const handleStoryDeleted = (storyId: string) => {
    setStories((prev) => prev.filter((s) => s.id !== storyId));
  };

  const handleCommentAdded = (storyId: string, comment: any) => {
    setStories((prev) =>
      prev.map((s) => {
        if (s.id === storyId) {
          return {
            ...s,
            comments: [...(s.comments || []), comment],
          };
        }
        return s;
      })
    );
  };

  // Check if current user has an active story
  const myStories = stories.filter(
    (s) =>
      s.userId === currentUser.id ||
      s.userUsername === currentUser.username ||
      s.userId === 'me'
  );
  const hasMyStory = myStories.length > 0;

  // Group other users' stories (showing 1 circular avatar per user with their latest story)
  const otherStories = stories.filter(
    (s) =>
      s.userId !== currentUser.id &&
      s.userUsername !== currentUser.username &&
      s.userId !== 'me'
  );

  return (
    <>
      <div className="w-full bg-[#13192B] border border-[#1F293D] rounded-3xl p-3 sm:p-4 shadow-xl mb-4 overflow-hidden">
        <div className="flex items-center gap-3 sm:gap-4 overflow-x-auto no-scrollbar scroll-smooth py-1 px-1">
          {/* YOUR STORY ITEM */}
          <div className="flex flex-col items-center gap-1.5 flex-shrink-0 cursor-pointer group">
            <div
              onClick={() => {
                if (hasMyStory) {
                  const idx = stories.findIndex((s) => s.id === myStories[0].id);
                  setSelectedStoryIndex(idx >= 0 ? idx : 0);
                  setViewerModalOpen(true);
                } else {
                  setCreateModalOpen(true);
                }
              }}
              className="relative"
            >
              <div
                className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full p-[2.5px] transition-transform duration-300 group-hover:scale-105 ${
                  hasMyStory
                    ? 'bg-gradient-to-tr from-[#FF5E1E] via-[#EC4899] to-[#8B5CF6] shadow-lg shadow-purple-500/20'
                    : 'border-2 border-dashed border-gray-600 group-hover:border-[#FF5E1E]'
                }`}
              >
                <div className="w-full h-full rounded-full overflow-hidden p-0.5 bg-[#0B0F19]">
                  <img
                    src={currentUser.avatar}
                    alt={currentUser.name}
                    className="w-full h-full rounded-full object-cover"
                  />
                </div>
              </div>

              {/* Purple/Orange Plus badge */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setCreateModalOpen(true);
                }}
                className="absolute bottom-0 right-0 w-5 h-5 rounded-full bg-gradient-to-tr from-[#FF5E1E] to-[#6366F1] border-2 border-[#13192B] text-white flex items-center justify-center shadow-md hover:scale-110 transition active:scale-95"
                title="Add new story"
              >
                <Plus className="w-3.5 h-3.5 stroke-[3]" />
              </button>
            </div>

            <span className="text-[11px] font-semibold text-gray-200 group-hover:text-white truncate max-w-[72px]">
              {hasMyStory ? 'Your Story' : 'Add Story'}
            </span>
          </div>

          {/* OTHER STORIES */}
          {otherStories.map((story) => {
            const hasViewed =
              story.viewers && (story.viewers.includes(currentUser.id) || story.viewers.includes('me'));
            const fullStoryIndex = stories.findIndex((s) => s.id === story.id);

            return (
              <div
                key={story.id}
                onClick={() => {
                  setSelectedStoryIndex(fullStoryIndex >= 0 ? fullStoryIndex : 0);
                  setViewerModalOpen(true);
                }}
                className="flex flex-col items-center gap-1.5 flex-shrink-0 cursor-pointer group"
              >
                <div
                  className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full p-[2.5px] transition-transform duration-300 group-hover:scale-105 ${
                    hasViewed
                      ? 'border border-gray-700 bg-transparent opacity-75'
                      : 'bg-gradient-to-tr from-[#FF5E1E] via-[#EC4899] to-[#8B5CF6] shadow-lg shadow-purple-500/25 ring-1 ring-purple-500/30'
                  }`}
                >
                  <div className="w-full h-full rounded-full overflow-hidden p-0.5 bg-[#0B0F19]">
                    <img
                      src={story.userAvatar}
                      alt={story.userName}
                      className="w-full h-full rounded-full object-cover"
                    />
                  </div>
                </div>

                <span className="text-[11px] font-medium text-gray-300 group-hover:text-white truncate max-w-[72px]">
                  {story.userUsername || story.userName.split(' ')[0]}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Create Story Modal */}
      <CreateStoryModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        user={currentUser}
        onStoryCreated={handleStoryCreated}
      />

      {/* Story Viewer Modal */}
      {viewerModalOpen && stories.length > 0 && (
        <StoryViewerModal
          stories={stories}
          initialIndex={selectedStoryIndex}
          isOpen={viewerModalOpen}
          onClose={() => setViewerModalOpen(false)}
          currentUser={currentUser}
          onStoryDeleted={handleStoryDeleted}
          onCommentAdded={handleCommentAdded}
        />
      )}
    </>
  );
};
