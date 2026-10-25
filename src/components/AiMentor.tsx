import React, { useState } from 'react';
import {
  Sparkles,
  Send,
  Copy,
  Check,
  Share2,
  Bookmark,
  Layers,
  Target,
  Compass,
  PieChart,
  Lightbulb,
  FileText,
  TrendingUp,
  HelpCircle,
  RefreshCw,
  AlertCircle,
  Flame,
} from 'lucide-react';
import { ShareItem } from './ShareModal';

interface AiMentorProps {
  onShare: (item: ShareItem) => void;
}

export const AiMentor: React.FC<AiMentorProps> = ({ onShare }) => {
  const [mode, setMode] = useState<string>('idea_evaluation');
  const [ideaTitle, setIdeaTitle] = useState('Cognitive AI Study Engine');
  const [industry, setIndustry] = useState('EdTech & AI');
  const [stage, setStage] = useState('MVP');
  const [problem, setProblem] = useState(
    'Students drop out of complex STEM courses because textbooks are passive, non-interactive, and feedback is delayed by weeks.'
  );
  const [solution, setSolution] = useState(
    'Generative knowledge graphs that parse syllabi and convert homework problems into interactive simulations with live cognitive tutoring.'
  );
  const [targetAudience, setTargetAudience] = useState('College students & professional certification seekers');
  const [userQuery, setUserQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [savedPlans, setSavedPlans] = useState<string[]>([]);

  const mentorModes = [
    { id: 'idea_evaluation', label: 'Evaluate Startup Idea', icon: Sparkles, desc: 'COOK Score (1-100), market viability, risks' },
    { id: 'pitch_deck_outline', label: '10-Slide VC Pitch Deck', icon: FileText, desc: 'Slide-by-slide structure with key visuals' },
    { id: 'mvp_roadmap', label: '4-Week Lean MVP Roadmap', icon: Layers, desc: 'Ruthlessly prioritize single hero feature' },
    { id: 'competitor_research', label: 'Competitor & Moat Map', icon: Target, desc: 'Direct, indirect, and defensibility strategy' },
    { id: 'business_model', label: 'Business Model & Unit Economics', icon: PieChart, desc: 'Pricing tiers, LTV/CAC, monetization' },
    { id: 'chat', label: 'Freeform Mentor Chat', icon: Lightbulb, desc: 'Ask any specific question to COOK AI' },
  ];

  const handleGenerate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    setAnalysisResult(null);

    try {
      const res = await fetch('/api/gemini/mentor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode,
          ideaTitle,
          industry,
          stage,
          problem,
          solution,
          targetAudience,
          userQuery: userQuery || undefined,
        }),
      });

      const data = await res.json();
      if (data.analysis) {
        setAnalysisResult(data.analysis);
      } else {
        setAnalysisResult('Could not generate feedback. Please try again.');
      }
    } catch (err) {
      console.error(err);
      setAnalysisResult('Server communication error. Please ensure server is running.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!analysisResult) return;
    navigator.clipboard.writeText(analysisResult);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSharePlan = () => {
    if (!analysisResult) return;
    onShare({
      id: `mentor-plan-${Date.now()}`,
      type: 'resource',
      title: `COOK AI Strategy Blueprint: ${ideaTitle}`,
      description: analysisResult.slice(0, 300) + '...',
    });
  };

  const handleSavePlan = () => {
    if (analysisResult && !savedPlans.includes(analysisResult)) {
      setSavedPlans([analysisResult, ...savedPlans]);
    }
  };

  return (
    <div className="flex-1 max-w-4xl space-y-6 pb-16">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#1E1B4B] via-[#13192B] to-[#1E1B4B] border border-indigo-500/40 rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-2xl">
        <div className="relative z-10 max-w-2xl space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FF5E1E]/20 text-[#FF5E1E] text-xs font-bold border border-[#FF5E1E]/30">
            <Flame className="w-3.5 h-3.5 fill-[#FF5E1E]" />
            <span>POWERED BY GEMINI 3.8 FLASH</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            COOK AI Startup Mentor
          </h1>
          <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
            Get instant, rigorous, VC-grade feedback on your startup idea. Evaluate problem-solution fit, generate 10-slide decks, plan your 4-week MVP, and discover hidden market blindspots.
          </p>
        </div>
      </div>

      {/* Mode Selector Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
        {mentorModes.map(item => {
          const Icon = item.icon;
          const isActive = mode === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                setMode(item.id);
                setAnalysisResult(null);
              }}
              className={`p-3.5 rounded-2xl border text-left transition-all ${
                isActive
                  ? 'bg-gradient-to-br from-indigo-900/60 to-[#13192B] border-[#FF5E1E] shadow-lg shadow-orange-500/10'
                  : 'bg-[#13192B] border-[#1F293D] hover:border-gray-700 text-gray-400'
              }`}
            >
              <div className="flex items-center gap-2 mb-1.5">
                <Icon className={`w-4 h-4 ${isActive ? 'text-[#FF5E1E]' : 'text-indigo-400'}`} />
                <h4 className={`text-xs font-bold ${isActive ? 'text-white' : 'text-gray-300'}`}>
                  {item.label}
                </h4>
              </div>
              <p className="text-[11px] text-gray-400 line-clamp-1">{item.desc}</p>
            </button>
          );
        })}
      </div>

      {/* Input Parameters Form */}
      <div className="bg-[#13192B] border border-[#1F293D] rounded-2xl p-5 sm:p-6 shadow-xl space-y-4">
        <h3 className="font-bold text-white text-sm flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#FF5E1E]" />
          <span>Venture Parameters for Analysis</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1">Startup / Idea Title</label>
            <input
              type="text"
              value={ideaTitle}
              onChange={e => setIdeaTitle(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-[#0B0F19] border border-gray-800 rounded-xl text-white focus:outline-none focus:border-[#FF5E1E]"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1">Industry / Category</label>
            <input
              type="text"
              value={industry}
              onChange={e => setIndustry(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-[#0B0F19] border border-gray-800 rounded-xl text-white focus:outline-none focus:border-[#FF5E1E]"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1">Current Stage</label>
            <select
              value={stage}
              onChange={e => setStage(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-[#0B0F19] border border-gray-800 rounded-xl text-white focus:outline-none focus:border-[#FF5E1E]"
            >
              <option value="Idea">Idea Stage</option>
              <option value="Validation">Customer Validation</option>
              <option value="Prototype">Prototype</option>
              <option value="MVP">MVP in Market</option>
              <option value="Early Traction">Early Traction / Seed</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-400 mb-1">
            Acute Problem Being Solved (What hurts your customer?)
          </label>
          <textarea
            rows={2}
            value={problem}
            onChange={e => setProblem(e.target.value)}
            className="w-full px-3 py-2 text-xs bg-[#0B0F19] border border-gray-800 rounded-xl text-white focus:outline-none focus:border-[#FF5E1E]"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-400 mb-1">
            Proposed Solution & Core Secret (How does your tech fix it?)
          </label>
          <textarea
            rows={2}
            value={solution}
            onChange={e => setSolution(e.target.value)}
            className="w-full px-3 py-2 text-xs bg-[#0B0F19] border border-gray-800 rounded-xl text-white focus:outline-none focus:border-[#FF5E1E]"
          />
        </div>

        {mode === 'chat' && (
          <div>
            <label className="block text-xs font-semibold text-[#FF5E1E] mb-1">
              Your Specific Question for the COOK Mentor
            </label>
            <input
              type="text"
              value={userQuery}
              onChange={e => setUserQuery(e.target.value)}
              placeholder="e.g. How do we reach $10k MRR without paying for ads?"
              className="w-full px-3 py-2 text-xs bg-[#0B0F19] border border-orange-500/40 rounded-xl text-white focus:outline-none focus:border-[#FF5E1E]"
            />
          </div>
        )}

        <div className="flex items-center justify-between pt-2 border-t border-gray-800">
          <span className="text-[11px] text-gray-500">
            Powered by secure Gemini API server routes
          </span>
          <button
            onClick={handleGenerate}
            disabled={loading}
            className="py-2.5 px-6 rounded-xl bg-gradient-to-r from-[#FF5E1E] to-[#FF7A00] hover:from-[#ff6d31] hover:to-[#ff8d1e] text-white text-xs font-bold shadow-lg shadow-orange-500/25 flex items-center gap-2 transition disabled:opacity-50 cursor-pointer"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Cooking Analysis...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Generate Mentor Blueprint</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Output Screen */}
      {analysisResult && (
        <div className="bg-[#13192B] border border-indigo-500/30 rounded-2xl p-6 shadow-2xl space-y-4 animate-in fade-in">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-gray-800">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
              <h3 className="font-bold text-white text-sm">COOK AI Strategy Dossier</h3>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopy}
                className="py-1.5 px-3 rounded-lg bg-[#0B0F19] hover:bg-white/5 border border-gray-800 text-xs text-gray-300 font-medium flex items-center gap-1.5 transition"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy Output'}</span>
              </button>
              <button
                onClick={handleSharePlan}
                className="py-1.5 px-3 rounded-lg bg-[#0B0F19] hover:bg-white/5 border border-gray-800 text-xs text-[#FF5E1E] font-medium flex items-center gap-1.5 transition"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Share Plan</span>
              </button>
              <button
                onClick={handleSavePlan}
                className="py-1.5 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs text-white font-semibold flex items-center gap-1.5 transition"
              >
                <Bookmark className="w-3.5 h-3.5" />
                <span>Save to Notebook</span>
              </button>
            </div>
          </div>

          {/* Render formatted markdown output */}
          <div className="prose prose-invert max-w-none text-xs sm:text-sm text-gray-200 leading-relaxed space-y-2 whitespace-pre-wrap">
            {analysisResult}
          </div>

          {/* AI Disclaimer */}
          <div className="pt-4 border-t border-gray-800/80 flex items-center gap-2 text-[11px] text-gray-500">
            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
            <span>
              COOK AI feedback is generated via artificial intelligence and should be supplemented with independent customer validation.
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
