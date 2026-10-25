import React, { useState, useRef } from 'react';
import { X, DollarSign, Flame, Upload, FileText, Video, ShieldCheck, Check, Camera, Film } from 'lucide-react';
import { FundingRequest } from '../types';

interface RaiseFundsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (fundingData: Partial<FundingRequest>) => void;
}

export const RaiseFundsModal: React.FC<RaiseFundsModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [startupName, setStartupName] = useState('CognitiveAI');
  const [logo, setLogo] = useState('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80');
  const [logoFileName, setLogoFileName] = useState<string | null>(null);

  const [tagline, setTagline] = useState('Cognitive tutoring engine turning complex STEM syllabi into interactive simulations');
  const [description, setDescription] = useState('We are building real-time cognitive tutoring for higher-ed STEM courses with 12,000 active beta learners.');
  const [problem, setProblem] = useState('High dropout rates in STEM courses due to static textbooks and lagging feedback.');
  const [solution, setSolution] = useState('Dynamic knowledge graphs that adapt to user comprehension in real-time.');
  const [targetAudience, setTargetAudience] = useState('College students & certification bootcamps');
  const [industry, setIndustry] = useState('Education & AI');
  const [stage, setStage] = useState<'Idea' | 'Prototype' | 'MVP' | 'Early Traction' | 'Revenue Generating'>('MVP');
  const [fundingGoal, setFundingGoal] = useState('250000');
  const [amountRaised, setAmountRaised] = useState('50000');
  const [equityOffered, setEquityOffered] = useState('10%');
  const [runwayMonths, setRunwayMonths] = useState('8');
  
  const [pitchDeckUrl, setPitchDeckUrl] = useState('https://technova.ai/deck.pdf');
  const [pitchDeckFileName, setPitchDeckFileName] = useState<string | null>(null);

  const [videoPitchUrl, setVideoPitchUrl] = useState('https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4');
  const [videoPitchFileName, setVideoPitchFileName] = useState<string | null>(null);

  const [traction, setTraction] = useState('12,000 MAU, $4.2K MRR');
  const [useOfFunds, setUseOfFunds] = useState('Engineering hires (60%), GPU compute (20%), User acquisition (20%)');
  const [confirmed, setConfirmed] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const logoInputRef = useRef<HTMLInputElement>(null);
  const deckInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleLogoFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setLogo(event.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleVideoFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setVideoPitchFileName(`${file.name} (${(file.size / (1024 * 1024)).toFixed(1)} MB)`);
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setVideoPitchUrl(event.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDeckFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPitchDeckFileName(`${file.name} (${(file.size / 1024).toFixed(0)} KB)`);
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setPitchDeckUrl(event.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirmed) {
      setErrorMessage('Please check the confirmation box to authorize publishing.');
      return;
    }
    setErrorMessage(null);

    const goalNum = Number(fundingGoal) || 100000;
    const raisedNum = Number(amountRaised) || 0;
    const seekingNum = Math.max(0, goalNum - raisedNum);

    onSubmit({
      startupName,
      logo,
      tagline,
      description,
      problem,
      solution,
      targetAudience,
      industry,
      stage: stage as any,
      fundingGoal: goalNum,
      amountRaised: raisedNum,
      amountSeeking: seekingNum,
      equityOffered,
      runwayMonths: Number(runwayMonths) || 12,
      pitchDeckUrl,
      videoPitchUrl,
      traction,
      useOfFunds,
      tags: [industry, stage, 'Fundraising'],
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in select-none">
      <div className="bg-[#13192B] border border-[#1F293D] rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Hidden File Pickers for Computer Files */}
        <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoFile} />
        <input ref={deckInputRef} type="file" accept=".pdf,application/pdf" className="hidden" onChange={handleDeckFile} />
        <input ref={videoInputRef} type="file" accept="video/mp4,video/webm,video/*" className="hidden" onChange={handleVideoFile} />

        {/* Header */}
        <div className="px-5 sm:px-6 py-4 border-b border-[#1F293D] flex items-center justify-between bg-gradient-to-r from-[#1E1B4B] to-[#13192B]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#FF5E1E]/20 text-[#FF5E1E] flex items-center justify-center border border-[#FF5E1E]/40 font-bold">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-white text-base">Raise Funds on COOK</h3>
              <p className="text-xs text-gray-400">Publish your round to angels, VCs, and the startup ecosystem</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1 text-xs text-gray-300">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-white mb-1">Startup Name *</label>
              <input
                type="text"
                required
                value={startupName}
                onChange={e => setStartupName(e.target.value)}
                className="w-full px-3 py-2 bg-[#0B0F19] border border-gray-800 rounded-xl text-white focus:outline-none focus:border-[#FF5E1E]"
              />
            </div>

            {/* Logo from Computer */}
            <div>
              <label className="block font-semibold text-white mb-1">Startup Logo (From Computer)</label>
              <div className="flex items-center gap-2">
                <img src={logo} alt="Logo preview" className="w-9 h-9 rounded-xl object-cover border border-gray-700" />
                <button
                  type="button"
                  onClick={() => logoInputRef.current?.click()}
                  className="flex-1 py-2 px-3 rounded-xl bg-[#0B0F19] hover:bg-white/5 border border-gray-700 text-white font-medium flex items-center justify-center gap-1.5 transition active:scale-95"
                >
                  <Camera className="w-3.5 h-3.5 text-indigo-400" />
                  <span>{logoFileName ? 'Change Logo' : 'Upload from Computer'}</span>
                </button>
              </div>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-white mb-1">One-Line Pitch / Tagline *</label>
            <input
              type="text"
              required
              value={tagline}
              onChange={e => setTagline(e.target.value)}
              className="w-full px-3 py-2 bg-[#0B0F19] border border-gray-800 rounded-xl text-white focus:outline-none focus:border-[#FF5E1E]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-white mb-1">Industry</label>
              <select
                value={industry}
                onChange={e => setIndustry(e.target.value)}
                className="w-full px-3 py-2 bg-[#0B0F19] border border-gray-800 rounded-xl text-white focus:outline-none focus:border-[#FF5E1E]"
              >
                <option value="Education & AI">Education & AI</option>
                <option value="HealthTech & AI">HealthTech & AI</option>
                <option value="CleanTech & Hardware">CleanTech & Hardware</option>
                <option value="FinTech">FinTech</option>
                <option value="B2B SaaS">B2B SaaS</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-white mb-1">Startup Stage</label>
              <select
                value={stage}
                onChange={e => setStage(e.target.value as any)}
                className="w-full px-3 py-2 bg-[#0B0F19] border border-gray-800 rounded-xl text-white focus:outline-none focus:border-[#FF5E1E]"
              >
                <option value="Idea">Idea</option>
                <option value="Prototype">Prototype</option>
                <option value="MVP">MVP</option>
                <option value="Early Traction">Early Traction</option>
                <option value="Revenue Generating">Revenue Generating</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-white mb-1">Runway Target</label>
              <input
                type="number"
                value={runwayMonths}
                onChange={e => setRunwayMonths(e.target.value)}
                placeholder="Months"
                className="w-full px-3 py-2 bg-[#0B0F19] border border-gray-800 rounded-xl text-white focus:outline-none focus:border-[#FF5E1E]"
              />
            </div>
          </div>

          {/* Financials Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 bg-[#0B0F19] rounded-2xl border border-gray-800">
            <div>
              <label className="block font-semibold text-white mb-1">Funding Goal ($)</label>
              <input
                type="number"
                required
                value={fundingGoal}
                onChange={e => setFundingGoal(e.target.value)}
                className="w-full px-3 py-1.5 bg-[#13192B] border border-gray-700 rounded-lg text-white font-bold"
              />
            </div>
            <div>
              <label className="block font-semibold text-white mb-1">Amount Raised ($)</label>
              <input
                type="number"
                value={amountRaised}
                onChange={e => setAmountRaised(e.target.value)}
                className="w-full px-3 py-1.5 bg-[#13192B] border border-gray-700 rounded-lg text-white font-bold text-emerald-400"
              />
            </div>
            <div>
              <label className="block font-semibold text-white mb-1">Proposed Equity (%)</label>
              <input
                type="text"
                value={equityOffered}
                onChange={e => setEquityOffered(e.target.value)}
                className="w-full px-3 py-1.5 bg-[#13192B] border border-gray-700 rounded-lg text-white font-bold text-[#FF5E1E]"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-white mb-1">Problem & Solution Description</label>
            <textarea
              rows={3}
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full px-3 py-2 bg-[#0B0F19] border border-gray-800 rounded-xl text-white focus:outline-none focus:border-[#FF5E1E]"
            />
          </div>

          {/* Computer Upload for Video Pitch and Pitch Deck */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Pitch Deck Upload */}
            <div className="p-3.5 rounded-2xl bg-[#0B0F19] border border-gray-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-white flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Pitch Deck (PDF)</span>
                </span>
                <span className="text-[10px] text-gray-500">From Computer</span>
              </div>
              <button
                type="button"
                onClick={() => deckInputRef.current?.click()}
                className="w-full py-2.5 px-3 rounded-xl bg-[#13192B] hover:bg-white/5 border border-gray-700 text-white font-semibold flex items-center justify-center gap-2 transition active:scale-95"
              >
                <Upload className="w-3.5 h-3.5 text-indigo-400" />
                <span className="truncate">{pitchDeckFileName || 'Select PDF from Computer'}</span>
              </button>
            </div>

            {/* Video Pitch Upload */}
            <div className="p-3.5 rounded-2xl bg-[#0B0F19] border border-gray-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-white flex items-center gap-1.5">
                  <Film className="w-3.5 h-3.5 text-[#FF5E1E]" />
                  <span>Video Pitch / Demo</span>
                </span>
                <span className="text-[10px] text-gray-500">From Computer</span>
              </div>
              <button
                type="button"
                onClick={() => videoInputRef.current?.click()}
                className="w-full py-2.5 px-3 rounded-xl bg-[#13192B] hover:bg-white/5 border border-gray-700 text-white font-semibold flex items-center justify-center gap-2 transition active:scale-95"
              >
                <Upload className="w-3.5 h-3.5 text-[#FF5E1E]" />
                <span className="truncate">{videoPitchFileName || 'Select Video from Computer'}</span>
              </button>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-white mb-1">Current Traction & Metrics</label>
            <input
              type="text"
              value={traction}
              onChange={e => setTraction(e.target.value)}
              placeholder="e.g. 5,000 active users, $2k MRR, 3 signed LOIs"
              className="w-full px-3 py-2 bg-[#0B0F19] border border-gray-800 rounded-xl text-white focus:outline-none focus:border-[#FF5E1E]"
            />
          </div>

          {/* Consent Checkbox */}
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-[#0B0F19] border border-gray-800">
            <input
              type="checkbox"
              id="confirm-raise"
              checked={confirmed}
              onChange={e => setConfirmed(e.target.checked)}
              className="mt-0.5 rounded text-[#FF5E1E] focus:ring-0"
            />
            <label htmlFor="confirm-raise" className="text-[11px] text-gray-300 cursor-pointer">
              I confirm I am authorized to publish this startup funding request. I understand COOK facilitates founder-investor discovery and does not guarantee funding or operate as an investment broker.
            </label>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Bottom Actions */}
          <div className="pt-2 flex justify-end gap-2.5 border-t border-gray-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-gray-800 text-gray-300 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!confirmed}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#FF5E1E] to-[#FF7A00] hover:from-[#ff6d31] hover:to-[#ff8d1e] text-white font-bold shadow-lg shadow-orange-500/25 disabled:opacity-40"
            >
              Publish Funding Request
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
