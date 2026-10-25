import React, { useState } from 'react';
import { Briefcase, MapPin, Globe, Clock, Check, Share2, Search, ArrowRight, DollarSign } from 'lucide-react';
import { Opportunity } from '../types';
import { opportunitiesData } from '../data/mockData';
import { ShareItem } from './ShareModal';

interface OpportunitiesViewProps {
  onShare: (item: ShareItem) => void;
  onContactFounder: (founderName: string) => void;
}

export const OpportunitiesView: React.FC<OpportunitiesViewProps> = ({ onShare, onContactFounder }) => {
  const [opportunities, setOpportunities] = useState<Opportunity[]>(opportunitiesData);
  const [selectedType, setSelectedType] = useState('All');
  const [search, setSearch] = useState('');
  const [appliedMap, setAppliedMap] = useState<Record<string, boolean>>({});

  const types = ['All', 'Co-founder', 'Developer', 'Designer', 'Internship', 'Full-time'];

  const handleApply = (opp: Opportunity) => {
    setAppliedMap(prev => ({ ...prev, [opp.id]: true }));
    onContactFounder(opp.startup);
  };

  const filtered = opportunities.filter(opp => {
    if (selectedType !== 'All' && opp.type !== selectedType) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        opp.title.toLowerCase().includes(q) ||
        opp.startup.toLowerCase().includes(q) ||
        opp.skills.some(s => s.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="flex-1 max-w-5xl space-y-6 pb-16">
      {/* Header */}
      <div className="rounded-3xl bg-gradient-to-r from-[#13192B] via-[#1E1B4B] to-[#13192B] border border-indigo-500/30 p-6 sm:p-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#FF5E1E]/20 text-[#FF5E1E]">
              STARTUP TALENT MARKETPLACE
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Find your co-founder or next venture role
          </h1>
          <p className="text-xs sm:text-sm text-gray-300 mt-1 max-w-xl">
            Match with founding teams offering substantial equity, pre-seed salaries, and mission-driven challenges.
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-[#13192B] border border-[#1F293D] rounded-2xl p-3">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search roles, startups, or skills..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-[#0B0F19] border border-gray-800 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar w-full sm:w-auto">
          {types.map(t => (
            <button
              key={t}
              onClick={() => setSelectedType(t)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition ${
                selectedType === t
                  ? 'bg-[#FF5E1E] text-white'
                  : 'bg-[#0B0F19] text-gray-400 hover:text-white'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Opportunities List */}
      <div className="space-y-4">
        {filtered.map(opp => {
          const hasApplied = appliedMap[opp.id];
          return (
            <div
              key={opp.id}
              className="bg-[#13192B] border border-[#1F293D] rounded-2xl p-5 space-y-4 hover:border-gray-700 transition"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3.5">
                  <img
                    src={opp.logo}
                    alt={opp.startup}
                    className="w-12 h-12 rounded-xl object-cover border border-gray-800 flex-shrink-0"
                  />
                  <div>
                    <h3 className="font-bold text-white text-base">{opp.title}</h3>
                    <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-400">
                      <span className="font-semibold text-indigo-400">{opp.startup}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-gray-500" />
                        {opp.location}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                    {opp.equityOrCompensation}
                  </span>
                  <button
                    onClick={() =>
                      onShare({
                        id: opp.id,
                        type: 'post',
                        title: `${opp.title} at ${opp.startup}`,
                        description: opp.description,
                      })
                    }
                    className="w-8 h-8 rounded-lg bg-[#0B0F19] text-gray-400 hover:text-white border border-gray-800 flex items-center justify-center transition"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">{opp.description}</p>

              {/* Skills Tags */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {opp.skills.map(s => (
                  <span
                    key={s}
                    className="px-2.5 py-1 rounded-lg bg-[#0B0F19] border border-gray-800 text-[11px] text-gray-300"
                  >
                    {s}
                  </span>
                ))}
              </div>

              {/* Bottom Row */}
              <div className="pt-3 border-t border-gray-800 flex items-center justify-between">
                <span className="text-[11px] text-gray-500">Posted {opp.postedDate}</span>
                <button
                  onClick={() => handleApply(opp)}
                  className={`py-2 px-4 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${
                    hasApplied
                      ? 'bg-emerald-600 text-white'
                      : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md'
                  }`}
                >
                  {hasApplied ? <Check className="w-3.5 h-3.5" /> : <Briefcase className="w-3.5 h-3.5" />}
                  <span>{hasApplied ? 'Applied • Intro Sent' : 'Apply & Connect with Founder'}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
