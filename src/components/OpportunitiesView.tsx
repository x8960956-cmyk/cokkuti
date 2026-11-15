import React, { useState, useEffect } from 'react';
import { Briefcase, MapPin, Check, Share2, Search, Plus, X } from 'lucide-react';
import { Opportunity } from '../types';
import { ShareItem } from './ShareModal';

interface OpportunitiesViewProps {
  onShare: (item: ShareItem) => void;
  onContactFounder: (founderName: string) => void;
}

export const OpportunitiesView: React.FC<OpportunitiesViewProps> = ({ onShare, onContactFounder }) => {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState('All');
  const [search, setSearch] = useState('');
  const [appliedMap, setAppliedMap] = useState<Record<string, boolean>>({});
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [title, setTitle] = useState('');
  const [startup, setStartup] = useState('');
  const [type, setType] = useState('Co-founder');
  const [location, setLocation] = useState('Remote');
  const [equityOrCompensation, setEquityOrCompensation] = useState('');
  const [skillsText, setSkillsText] = useState('');
  const [description, setDescription] = useState('');

  const types = ['All', 'Co-founder', 'Developer', 'Designer', 'Internship', 'Full-time'];

  useEffect(() => {
    const fetchOpps = async () => {
      try {
        const res = await fetch('/api/opportunities');
        const data = await res.json();
        if (Array.isArray(data.opportunities)) {
          setOpportunities(data.opportunities);
        }
      } catch (err) {
        // ignore
      } finally {
        setLoading(false);
      }
    };
    fetchOpps();
  }, []);

  const handleApply = (opp: Opportunity) => {
    setAppliedMap((prev) => ({ ...prev, [opp.id]: true }));
    onContactFounder(opp.startup);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !startup.trim()) return;
    const token = localStorage.getItem('cook_auth_token');
    if (!token) return;

    try {
      const res = await fetch('/api/opportunities', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: title.trim(),
          startup: startup.trim(),
          type,
          location: location.trim() || 'Remote',
          equityOrCompensation: equityOrCompensation.trim(),
          skills: skillsText
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean),
          description: description.trim(),
        }),
      });
      const data = await res.json();
      if (data.success && data.opportunity) {
        setOpportunities([data.opportunity, ...opportunities]);
        setTitle('');
        setStartup('');
        setDescription('');
        setSkillsText('');
        setEquityOrCompensation('');
        setIsModalOpen(false);
      }
    } catch (err) {
      // ignore
    }
  };

  const filtered = opportunities.filter((opp) => {
    if (selectedType !== 'All' && opp.type !== selectedType) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        opp.title.toLowerCase().includes(q) ||
        opp.startup.toLowerCase().includes(q) ||
        opp.skills.some((s) => s.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="w-full flex-1 min-w-0 max-w-6xl space-y-6 pb-8">
      {/* Header */}
      <div className="rounded-2xl sm:rounded-3xl bg-gradient-to-r from-[#13192B] via-[#1E1B4B] to-[#13192B] border border-indigo-500/30 p-5 sm:p-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-xl">
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
            Real founding roles, equity collaborations, and technical openings posted directly by COOK founders.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#FF5E1E] to-[#FF7A00] text-white text-xs font-bold flex items-center gap-2 shadow-lg transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Post Role</span>
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-[#13192B] border border-[#1F293D] rounded-2xl p-3">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search roles, startups, or skills..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-[#0B0F19] border border-gray-800 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar w-full sm:w-auto">
          {types.map((t) => (
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
      {!loading && filtered.length === 0 ? (
        <div className="bg-[#13192B] border border-[#1F293D] rounded-2xl p-10 text-center space-y-3 shadow-xl">
          <Briefcase className="w-10 h-10 text-[#FF5E1E] mx-auto" />
          <h3 className="text-base font-bold text-white">No open roles posted yet</h3>
          <p className="text-xs text-gray-400 max-w-md mx-auto leading-relaxed">
            Looking for a technical co-founder, designer, or early engineer? Post a real opportunity for COOK builders to apply.
          </p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold inline-flex items-center gap-1.5 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Post First Role</span>
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((opp) => {
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

                <div className="flex flex-wrap gap-1.5 pt-1">
                  {opp.skills.map((s) => (
                    <span
                      key={s}
                      className="px-2.5 py-1 rounded-lg bg-[#0B0F19] border border-gray-800 text-[11px] text-gray-300"
                    >
                      {s}
                    </span>
                  ))}
                </div>

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
                    <span>{hasApplied ? 'Applied • Intro Sent' : 'Apply & Connect'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Post Opportunity Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-[#13192B] border border-gray-800 rounded-3xl p-6 shadow-2xl relative space-y-4">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white flex items-center justify-center"
            >
              <X className="w-4 h-4" />
            </button>
            <h2 className="text-lg font-bold text-white">Post a Co-Founder or Startup Role</h2>
            <form onSubmit={handleCreate} className="space-y-3">
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Role Title (e.g. Technical Co-Founder)"
                className="w-full px-3.5 py-2.5 bg-[#0B0F19] border border-gray-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  required
                  value={startup}
                  onChange={(e) => setStartup(e.target.value)}
                  placeholder="Startup / Project Name"
                  className="w-full px-3.5 py-2.5 bg-[#0B0F19] border border-gray-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                />
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#0B0F19] border border-gray-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  {types.filter((t) => t !== 'All').map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Location (e.g. Remote)"
                  className="w-full px-3.5 py-2.5 bg-[#0B0F19] border border-gray-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                />
                <input
                  type="text"
                  value={equityOrCompensation}
                  onChange={(e) => setEquityOrCompensation(e.target.value)}
                  placeholder="Equity / Salary"
                  className="w-full px-3.5 py-2.5 bg-[#0B0F19] border border-gray-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
              <input
                type="text"
                value={skillsText}
                onChange={(e) => setSkillsText(e.target.value)}
                placeholder="Required skills (comma separated)"
                className="w-full px-3.5 py-2.5 bg-[#0B0F19] border border-gray-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
              />
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the venture and what you are building together..."
                className="w-full px-3.5 py-2.5 bg-[#0B0F19] border border-gray-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500 resize-none"
              />
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-white/5 text-xs text-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold"
                >
                  Publish Role
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
