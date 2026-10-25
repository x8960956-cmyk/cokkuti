import React, { useState } from 'react';
import {
  DollarSign,
  TrendingUp,
  Search,
  Filter,
  CheckCircle,
  Play,
  FileText,
  Users,
  ShieldCheck,
  Share2,
  ExternalLink,
  MessageSquare,
  Sparkles,
  ArrowRight,
  Flame,
  Clock,
  Eye,
  Heart,
  Briefcase,
  AlertTriangle,
} from 'lucide-react';
import { FundingRequest } from '../types';
import { investorsData } from '../data/mockData';
import { ShareItem } from './ShareModal';

interface FundingHubProps {
  fundings: FundingRequest[];
  onOpenRaiseFundsModal: () => void;
  onExpressInterest: (fundId: string) => void;
  onShare: (item: ShareItem) => void;
  onContactFounder: (founderName: string) => void;
  selectedStartupFilter?: string;
}

export const FundingHub: React.FC<FundingHubProps> = ({
  fundings,
  onOpenRaiseFundsModal,
  onExpressInterest,
  onShare,
  onContactFounder,
  selectedStartupFilter,
}) => {
  const [activeTab, setActiveTab] = useState<'discover' | 'trending' | 'investors' | 'funded'>('discover');
  const [selectedIndustry, setSelectedIndustry] = useState<string>('all');
  const [selectedStage, setSelectedStage] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState(selectedStartupFilter || '');
  const [activeVideoModal, setActiveVideoModal] = useState<string | null>(null);
  const [interestedIds, setInterestedIds] = useState<Record<string, boolean>>({});

  const industries = ['All', 'Education & AI', 'EdTech / HRTech', 'CleanTech & Hardware', 'HealthTech & AI', 'FinTech', 'SaaS'];
  const stages = ['All', 'Idea', 'Prototype', 'MVP', 'Early Traction', 'Revenue Generating', 'Growth'];

  const filteredFundings = fundings.filter(f => {
    if (selectedIndustry !== 'All' && selectedIndustry !== 'all') {
      if (!f.industry.toLowerCase().includes(selectedIndustry.toLowerCase())) return false;
    }
    if (selectedStage !== 'All' && selectedStage !== 'all') {
      if (f.stage.toLowerCase() !== selectedStage.toLowerCase()) return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match =
        f.startupName.toLowerCase().includes(q) ||
        f.tagline.toLowerCase().includes(q) ||
        f.description.toLowerCase().includes(q) ||
        f.tags.some(t => t.toLowerCase().includes(q));
      if (!match) return false;
    }
    return true;
  });

  const handleInterestClick = (fundId: string) => {
    setInterestedIds(prev => ({ ...prev, [fundId]: true }));
    onExpressInterest(fundId);
  };

  return (
    <div className="flex-1 max-w-5xl space-y-6 pb-16">
      {/* Hero Header */}
      <div className="relative rounded-3xl bg-gradient-to-r from-[#1E1B4B] via-[#13192B] to-[#1E1B4B] border border-indigo-500/30 p-6 sm:p-8 overflow-hidden shadow-2xl">
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FF5E1E]/20 text-[#FF5E1E] text-xs font-bold border border-[#FF5E1E]/30">
            <Flame className="w-3.5 h-3.5 fill-[#FF5E1E]" />
            <span>COOK FUNDING HUB & VENTURE ENGINE</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
            Discover vetted startups or <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF5E1E] to-amber-400">raise your round.</span>
          </h1>
          <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
            Open access venture discovery. Anyone can explore funding requests, express investor interest, or publish early-stage pitches with pitch decks and video demos.
          </p>
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={onOpenRaiseFundsModal}
              className="py-2.5 px-5 rounded-xl bg-gradient-to-r from-[#FF5E1E] to-[#FF7A00] hover:from-[#ff6d31] hover:to-[#ff8d1e] text-white text-xs sm:text-sm font-bold shadow-lg shadow-orange-500/25 flex items-center gap-2 transition cursor-pointer"
            >
              <DollarSign className="w-4 h-4" />
              <span>Raise Funds for Your Startup</span>
            </button>
            <button
              onClick={() => setActiveTab('investors')}
              className="py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs sm:text-sm font-semibold transition"
            >
              Explore Investor Directory
            </button>
          </div>
        </div>

        {/* Decorative background glow */}
        <div className="absolute -right-16 -top-16 w-80 h-80 rounded-full bg-gradient-to-bl from-[#FF5E1E]/20 to-[#6366F1]/20 blur-3xl pointer-events-none" />
      </div>

      {/* Tabs */}
      <div className="flex items-center justify-between border-b border-[#1F293D] pb-3 gap-2 overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-2">
          {[
            { id: 'discover', label: 'Discover Funding', icon: DollarSign },
            { id: 'trending', label: 'Trending Startups', icon: TrendingUp },
            { id: 'investors', label: 'Investor Directory', icon: Users },
            { id: 'funded', label: 'Funded Alumni', icon: CheckCircle },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 whitespace-nowrap transition ${
                activeTab === tab.id
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-[#13192B] text-gray-400 hover:text-white hover:bg-white/5 border border-[#1F293D]'
              }`}
            >
              <tab.icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        <button
          onClick={onOpenRaiseFundsModal}
          className="px-3.5 py-1.5 rounded-xl bg-[#FF5E1E]/15 text-[#FF5E1E] text-xs font-bold border border-[#FF5E1E]/30 flex items-center gap-1.5 whitespace-nowrap ml-auto"
        >
          <DollarSign className="w-3.5 h-3.5" />
          <span>+ Raise Funds</span>
        </button>
      </div>

      {/* Filter and Search Bar for Discover Tab */}
      {activeTab !== 'investors' && (
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-[#13192B] border border-[#1F293D] rounded-2xl p-3">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Filter by startup name or keywords..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-[#0B0F19] border border-gray-800 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto no-scrollbar">
            <select
              value={selectedIndustry}
              onChange={e => setSelectedIndustry(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-[#0B0F19] border border-gray-800 text-xs text-gray-300 focus:outline-none focus:border-indigo-500"
            >
              {industries.map(ind => (
                <option key={ind} value={ind} className="bg-[#13192B] text-white">
                  Industry: {ind}
                </option>
              ))}
            </select>

            <select
              value={selectedStage}
              onChange={e => setSelectedStage(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-[#0B0F19] border border-gray-800 text-xs text-gray-300 focus:outline-none focus:border-indigo-500"
            >
              {stages.map(st => (
                <option key={st} value={st} className="bg-[#13192B] text-white">
                  Stage: {st}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Investors Directory View */}
      {activeTab === 'investors' && (
        <div className="space-y-4">
          <div className="bg-[#13192B] border border-[#1F293D] rounded-2xl p-4">
            <h3 className="font-bold text-white text-sm mb-1">Accredited Angels & VC Partners on COOK</h3>
            <p className="text-xs text-gray-400">
              Direct connection pipeline. Submit your pitch deck directly to matching partners without gatekeepers.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {investorsData.map(inv => (
              <div
                key={inv.id}
                className="bg-[#13192B] border border-[#1F293D] rounded-2xl p-5 space-y-3.5 hover:border-gray-700 transition"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <img
                      src={inv.avatar}
                      alt={inv.name}
                      className="w-12 h-12 rounded-full object-cover border border-indigo-500/40"
                    />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h4 className="font-bold text-white text-sm">{inv.name}</h4>
                        {inv.verified && <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />}
                      </div>
                      <p className="text-xs text-gray-400">{inv.title}</p>
                      <span className="text-[11px] text-gray-500">{inv.location}</span>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FF5E1E]/15 text-[#FF5E1E] border border-[#FF5E1E]/30">
                    {inv.checkSize}
                  </span>
                </div>

                <p className="text-xs text-gray-300 leading-relaxed">{inv.bio}</p>

                <div className="space-y-1.5 text-xs">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-gray-500 text-[11px]">Focus:</span>
                    {inv.focus.map(f => (
                      <span key={f} className="px-2 py-0.5 rounded bg-white/5 text-indigo-300 text-[10px]">
                        {f}
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-gray-500 text-[11px]">Stages:</span>
                    {inv.stages.map(s => (
                      <span key={s} className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[10px]">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-2 border-t border-gray-800 flex items-center justify-between">
                  <span className="text-[11px] text-gray-400">{inv.portfolioCount} Portfolio Companies</span>
                  <button
                    onClick={() => onContactFounder(inv.name)}
                    className="py-1.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 transition"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Pitch Investor</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Discover / Trending / Funded Funding Cards */}
      {activeTab !== 'investors' && (
        <div className="space-y-5">
          {filteredFundings.length === 0 ? (
            <div className="bg-[#13192B] border border-[#1F293D] rounded-2xl p-8 text-center space-y-2">
              <p className="text-sm font-semibold text-white">No funding requests match your criteria</p>
              <p className="text-xs text-gray-400">Try adjusting your industry, stage filters, or search terms.</p>
            </div>
          ) : (
            filteredFundings.map(fund => {
              const percent = Math.min(100, Math.round((fund.amountRaised / fund.fundingGoal) * 100));
              const isInterested = interestedIds[fund.id];

              return (
                <div
                  key={fund.id}
                  className="bg-[#13192B] border border-[#1F293D] rounded-2xl p-5 sm:p-6 shadow-xl space-y-4 hover:border-indigo-500/40 transition"
                >
                  {/* Top Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={fund.logo}
                        alt={fund.startupName}
                        className="w-12 h-12 rounded-xl object-cover border border-gray-800 flex-shrink-0"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-extrabold text-white text-base sm:text-lg">{fund.startupName}</h3>
                          {fund.verified && <ShieldCheck className="w-4 h-4 text-blue-400" />}
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FF5E1E]/15 text-[#FF5E1E] border border-[#FF5E1E]/30">
                            {fund.stage}
                          </span>
                        </div>
                        <p className="text-xs text-gray-400">Founded by {fund.founderName}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                        {fund.status}
                      </span>
                      <button
                        onClick={() =>
                          onShare({
                            id: fund.id,
                            type: 'funding',
                            title: `${fund.startupName} is raising $${fund.fundingGoal.toLocaleString()} on COOK`,
                            description: fund.tagline,
                            imageUrl: fund.logo,
                          })
                        }
                        className="w-8 h-8 rounded-lg bg-[#0B0F19] text-gray-400 hover:text-white border border-gray-800 flex items-center justify-center transition"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Pitch Tagline & Problem/Solution */}
                  <div className="space-y-2">
                    <h4 className="text-sm font-bold text-gray-100">{fund.tagline}</h4>
                    <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">{fund.description}</p>
                  </div>

                  {/* Financial Overview Metrics */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3.5 bg-[#0B0F19] rounded-xl border border-gray-800/80 text-center">
                    <div>
                      <span className="text-[11px] text-gray-500 block mb-0.5">Target Capital</span>
                      <span className="text-base font-extrabold text-white">
                        ${fund.fundingGoal.toLocaleString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-[11px] text-gray-500 block mb-0.5">Amount Seeking</span>
                      <span className="text-base font-extrabold text-[#FF5E1E]">
                        ${fund.amountSeeking.toLocaleString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-[11px] text-gray-500 block mb-0.5">Equity Offered</span>
                      <span className="text-base font-extrabold text-white">{fund.equityOffered}</span>
                    </div>
                    <div>
                      <span className="text-[11px] text-gray-500 block mb-0.5">Runway Target</span>
                      <span className="text-base font-extrabold text-white">{fund.runwayMonths} months</span>
                    </div>
                  </div>

                  {/* Funding Progress Bar */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-400">
                        Raised <strong className="text-white">${fund.amountRaised.toLocaleString()}</strong> of $
                        {fund.fundingGoal.toLocaleString()}
                      </span>
                      <span className="font-bold text-emerald-400">{percent}% Funded</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-gray-800 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-emerald-500 via-indigo-500 to-[#FF5E1E] transition-all duration-500"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>

                  {/* Traction & Media preview */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500">Traction:</span>
                      <span className="font-medium text-emerald-400">{fund.traction}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      {fund.videoPitchUrl && (
                        <button
                          onClick={() => setActiveVideoModal(fund.videoPitchUrl!)}
                          className="px-2.5 py-1 rounded-lg bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 font-medium flex items-center gap-1 hover:bg-indigo-500/25 transition"
                        >
                          <Play className="w-3 h-3 fill-indigo-300" />
                          <span>Watch Video Pitch</span>
                        </button>
                      )}
                      {fund.pitchDeckUrl && (
                        <a
                          href={fund.pitchDeckUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="px-2.5 py-1 rounded-lg bg-white/5 text-gray-300 border border-gray-700 font-medium flex items-center gap-1 hover:bg-white/10 transition"
                        >
                          <FileText className="w-3 h-3" />
                          <span>Pitch Deck</span>
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Primary CTA Buttons */}
                  <div className="pt-3 border-t border-gray-800 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 text-xs text-gray-400">
                      <Users className="w-3.5 h-3.5" />
                      <span>{fund.interestedCount + (isInterested ? 1 : 0)} Investors tracking</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleInterestClick(fund.id)}
                        className={`py-2 px-3.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${
                          isInterested
                            ? 'bg-emerald-600 text-white'
                            : 'bg-gradient-to-r from-[#FF5E1E] to-[#FF7A00] hover:from-[#ff6d31] hover:to-[#ff8d1e] text-white shadow-md shadow-orange-500/20'
                        }`}
                      >
                        <Heart className={`w-3.5 h-3.5 ${isInterested ? 'fill-white' : ''}`} />
                        <span>{isInterested ? 'Interest Logged!' : "I'm Interested"}</span>
                      </button>

                      <button
                        onClick={() => onContactFounder(fund.founderName)}
                        className="py-2 px-3.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold flex items-center gap-1.5 transition"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Contact Founder</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Safety & Compliance Disclaimer banner */}
      <div className="p-4 rounded-2xl bg-[#0B0F19] border border-amber-500/20 text-xs text-gray-400 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold text-gray-300">Investor & Founder Protection Notice</p>
          <p className="leading-relaxed">
            COOK provides communication and discovery tools. Submitting a funding request or clicking "I'm Interested" does not constitute an offer of securities, guarantee investment, or process monetary transactions. Always conduct independent due diligence.
          </p>
        </div>
      </div>

      {/* Video Pitch Modal */}
      {activeVideoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-[#13192B] border border-gray-800 rounded-2xl p-4 max-w-2xl w-full">
            <div className="flex justify-between items-center pb-2 mb-2 border-b border-gray-800">
              <h4 className="font-bold text-white text-sm">Startup Pitch Video Demo</h4>
              <button
                onClick={() => setActiveVideoModal(null)}
                className="text-gray-400 hover:text-white text-xs px-2 py-1 bg-white/10 rounded-lg"
              >
                Close
              </button>
            </div>
            <video src={activeVideoModal} controls autoPlay className="w-full rounded-xl max-h-[460px] bg-black" />
          </div>
        </div>
      )}
    </div>
  );
};
