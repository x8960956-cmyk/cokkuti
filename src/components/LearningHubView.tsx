import React, { useState } from 'react';
import { BookOpen, Star, Clock, User, Share2, Search, ArrowRight, Bookmark, Check } from 'lucide-react';
import { LearningResource } from '../types';
import { learningResourcesData } from '../data/mockData';
import { ShareItem } from './ShareModal';

interface LearningHubViewProps {
  onShare: (item: ShareItem) => void;
}

export const LearningHubView: React.FC<LearningHubViewProps> = ({ onShare }) => {
  const [resources, setResources] = useState<LearningResource[]>(learningResourcesData);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [activeArticle, setActiveArticle] = useState<LearningResource | null>(null);

  const categories = ['All', 'Validation', 'Fundraising', 'Legal', 'Growth'];

  const filtered = resources.filter(res => {
    if (selectedCategory !== 'All' && res.category !== selectedCategory) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return res.title.toLowerCase().includes(q) || res.summary.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="w-full flex-1 min-w-0 max-w-6xl space-y-6 pb-8">
      {/* Header */}
      <div className="rounded-2xl sm:rounded-3xl bg-gradient-to-r from-[#13192B] via-[#1E1B4B] to-[#13192B] border border-indigo-500/30 p-5 sm:p-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300">
              FOUNDER ACADEMY
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Curated Startup Playbooks & Guides
          </h1>
          <p className="text-xs sm:text-sm text-gray-300 mt-1 max-w-xl">
            Battle-tested frameworks on validating demand, negotiating valuation caps, structuring vesting schedules, and engineering PLG loops.
          </p>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-[#13192B] border border-[#1F293D] rounded-2xl p-3">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search guides, templates, playbooks..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-[#0B0F19] border border-gray-800 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar w-full sm:w-auto">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition ${
                selectedCategory === cat
                  ? 'bg-amber-600 text-white'
                  : 'bg-[#0B0F19] text-gray-400 hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map(res => (
          <div
            key={res.id}
            className="bg-[#13192B] border border-[#1F293D] rounded-2xl p-5 space-y-3.5 hover:border-gray-700 transition flex flex-col justify-between"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                  {res.category} • {res.type}
                </span>
                <div className="flex items-center gap-1 text-[11px] text-amber-400 font-bold">
                  <Star className="w-3.5 h-3.5 fill-amber-400" />
                  <span>{res.rating}</span>
                </div>
              </div>

              <h3 className="font-bold text-white text-sm sm:text-base leading-snug">{res.title}</h3>
              <p className="text-xs text-gray-300 leading-relaxed">{res.summary}</p>
            </div>

            <div className="pt-3 border-t border-gray-800 flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-[11px] text-gray-400">
                <Clock className="w-3.5 h-3.5" />
                <span>{res.readTime}</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() =>
                    onShare({
                      id: res.id,
                      type: 'resource',
                      title: res.title,
                      description: res.summary,
                    })
                  }
                  className="w-8 h-8 rounded-lg bg-[#0B0F19] text-gray-400 hover:text-white border border-gray-800 flex items-center justify-center transition"
                >
                  <Share2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setActiveArticle(res)}
                  className="py-1.5 px-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1 transition"
                >
                  <span>Read Guide</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Article Reader Modal */}
      {activeArticle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="bg-[#13192B] border border-gray-800 rounded-2xl p-6 max-w-2xl w-full max-h-[85vh] overflow-y-auto space-y-4">
            <div className="flex justify-between items-start border-b border-gray-800 pb-3">
              <div>
                <span className="text-xs text-amber-400 font-bold uppercase">{activeArticle.category}</span>
                <h2 className="text-lg font-bold text-white mt-1">{activeArticle.title}</h2>
                <p className="text-xs text-gray-400 mt-0.5">By {activeArticle.author} • {activeArticle.authorRole}</p>
              </div>
              <button
                onClick={() => setActiveArticle(null)}
                className="px-2.5 py-1 text-xs bg-gray-800 hover:bg-gray-700 text-white rounded-lg"
              >
                Close
              </button>
            </div>

            <div className="prose prose-invert max-w-none text-xs sm:text-sm text-gray-200 whitespace-pre-wrap leading-relaxed">
              {activeArticle.content}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
