import React, { useState } from 'react';
import {
  Sparkles,
  Camera,
  User as UserIcon,
  Briefcase,
  GraduationCap,
  Layers,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  ExternalLink,
  Flame,
  Eye,
  LogOut,
  Globe,
  Share2,
  Star,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  User,
  ExperienceItem,
  EducationItem,
  ProjectItem,
  CustomRole,
  SkillItem,
  SocialLinkItem,
  SocialPlatform,
  RecordPhoto,
  VisibilityLevel,
} from '../types';
import { SinglePhotoUpload, GalleryPhotoUpload } from './PhotoUpload';
import { ConnectWithMe } from './ConnectWithMe';

interface OnboardingFlowProps {
  user: User;
  initialStep?: number;
  onComplete: (user: User) => void;
  onSignOut: () => void;
}

export const OnboardingFlow: React.FC<OnboardingFlowProps> = ({
  user,
  initialStep = 1,
  onComplete,
  onSignOut,
}) => {
  const [currentStep, setCurrentStep] = useState<number>(initialStep || 1);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // STEP 1 STATE: Basic Profile
  const [avatar, setAvatar] = useState(user.avatar || '');
  const [coverImage, setCoverImage] = useState(user.coverImage || '');
  const [name, setName] = useState(user.name || '');
  const [username, setUsername] = useState(user.username || '');
  const [headline, setHeadline] = useState(user.headline || '');
  const [bio, setBio] = useState(user.bio || '');
  const [location, setLocation] = useState(user.location || '');
  const [portfolioWebsite, setPortfolioWebsite] = useState(user.portfolioWebsite || user.website || '');
  const [interests, setInterests] = useState<string[]>(
    user.interests && user.interests.length > 0
      ? user.interests
      : ['AI Tools', 'Startups', 'Open Source', 'Product Design']
  );
  const [newInterestInput, setNewInterestInput] = useState('');
  const [languages, setLanguages] = useState<string[]>(
    user.languages && user.languages.length > 0 ? user.languages : ['English']
  );
  const [newLanguageInput, setNewLanguageInput] = useState('');

  // STEP 2 STATE: Role & Experience
  const [primaryRole, setPrimaryRole] = useState(user.primaryRole || user.title || 'Founder');
  const [experienceLevel, setExperienceLevel] = useState(user.startupStage || 'Mid-Level');
  const [customRoles, setCustomRoles] = useState<CustomRole[]>(user.customRoles || []);
  const [newRoleInput, setNewRoleInput] = useState('');
  const [newRolePhoto, setNewRolePhoto] = useState('');

  // Experience Entries
  const [experiences, setExperiences] = useState<ExperienceItem[]>(user.experience || []);
  const [showExpForm, setShowExpForm] = useState(false);
  const [expTitle, setExpTitle] = useState('');
  const [expCompany, setExpCompany] = useState('');
  const [expLogo, setExpLogo] = useState('');
  const [expType, setExpType] = useState('Full-time');
  const [expWorkplace, setExpWorkplace] = useState<'Remote' | 'Hybrid' | 'On-site'>('Remote');
  const [expStartDate, setExpStartDate] = useState('2023');
  const [expEndDate, setExpEndDate] = useState('Present');
  const [expCurrent, setExpCurrent] = useState(true);
  const [expDesc, setExpDesc] = useState('');
  const [expSkills, setExpSkills] = useState('');
  const [expPhotos, setExpPhotos] = useState<RecordPhoto[]>([]);

  // Education Entries
  const [educations, setEducations] = useState<EducationItem[]>(user.education || []);
  const [showEduForm, setShowEduForm] = useState(false);
  const [eduSchool, setEduSchool] = useState('');
  const [eduLogo, setEduLogo] = useState('');
  const [eduDegree, setEduDegree] = useState('');
  const [eduField, setEduField] = useState('');
  const [eduStartDate, setEduStartDate] = useState('2019');
  const [eduEndDate, setEduEndDate] = useState('2023');
  const [eduDesc, setEduDesc] = useState('');
  const [eduPhotos, setEduPhotos] = useState<RecordPhoto[]>([]);

  // Skills
  const [skills, setSkills] = useState<string[]>(
    user.skills && user.skills.length > 0
      ? user.skills
      : ['Product Strategy', 'Full Stack Development', 'System Architecture']
  );
  const [newSkillInput, setNewSkillInput] = useState('');

  // Collaboration Goals & Availability
  const [collaborationGoals, setCollaborationGoals] = useState<string[]>([
    'Find a Co-Founder',
    'Raise Seed Capital',
    'Hire Engineers',
  ]);
  const [availability, setAvailability] = useState('Full-time');

  // Social Links
  const [socialLinkItems, setSocialLinkItems] = useState<SocialLinkItem[]>(
    user.socialLinkItems && user.socialLinkItems.length > 0
      ? user.socialLinkItems
      : []
  );
  const [newSocialPlatform, setNewSocialPlatform] = useState<SocialPlatform>('linkedin');
  const [newSocialUrl, setNewSocialUrl] = useState('');
  const [newSocialCustomName, setNewSocialCustomName] = useState('');

  // Projects
  const [projects, setProjects] = useState<ProjectItem[]>(user.projects || []);
  const [showProjForm, setShowProjForm] = useState(false);
  const [projTitle, setProjTitle] = useState('');
  const [projDesc, setProjDesc] = useState('');
  const [projLink, setProjLink] = useState('');
  const [projCover, setProjCover] = useState('');
  const [projPhotos, setProjPhotos] = useState<RecordPhoto[]>([]);

  // Helper to detect platform from URL
  const detectPlatformFromUrl = (url: string): SocialPlatform => {
    const lower = url.toLowerCase();
    if (lower.includes('linkedin.com')) return 'linkedin';
    if (lower.includes('instagram.com')) return 'instagram';
    if (lower.includes('facebook.com')) return 'facebook';
    if (lower.includes('twitter.com') || lower.includes('x.com')) return 'twitter';
    if (lower.includes('youtube.com') || lower.includes('youtu.be')) return 'youtube';
    if (lower.includes('github.com')) return 'github';
    if (lower.includes('behance.net')) return 'behance';
    if (lower.includes('dribbble.com')) return 'dribbble';
    if (lower.includes('medium.com')) return 'medium';
    return 'other';
  };

  const handleAddSocialLink = () => {
    if (!newSocialUrl.trim()) return;
    const platform = newSocialPlatform || detectPlatformFromUrl(newSocialUrl);
    const platformNames: Record<string, string> = {
      linkedin: 'LinkedIn',
      instagram: 'Instagram',
      facebook: 'Facebook',
      twitter: 'X (Twitter)',
      youtube: 'YouTube',
      github: 'GitHub',
      behance: 'Behance',
      dribbble: 'Dribbble',
      medium: 'Medium',
      website: 'Personal Website',
      other: newSocialCustomName || 'External Platform',
    };

    const newLink: SocialLinkItem = {
      id: `soc-${Date.now()}`,
      platform,
      platformName: newSocialCustomName.trim() || platformNames[platform] || 'Social Profile',
      url: newSocialUrl.trim(),
      visibility: 'public',
      displayOrder: socialLinkItems.length + 1,
    };

    setSocialLinkItems([...socialLinkItems, newLink]);
    setNewSocialUrl('');
    setNewSocialCustomName('');
  };

  const handleRemoveSocialLink = (id: string) => {
    setSocialLinkItems(socialLinkItems.filter((s) => s.id !== id));
  };

  const handleMoveSocialLink = (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= socialLinkItems.length) return;
    const copy = [...socialLinkItems];
    const [moved] = copy.splice(index, 1);
    copy.splice(targetIdx, 0, moved);
    setSocialLinkItems(copy);
  };

  // Add Custom Role
  const handleAddCustomRole = () => {
    if (!newRoleInput.trim()) return;
    const newRole: CustomRole = {
      id: `role-${Date.now()}`,
      name: newRoleInput.trim(),
      category: 'Professional',
      isPrimary: customRoles.length === 0,
      photo: newRolePhoto || undefined,
    };
    setCustomRoles([...customRoles, newRole]);
    setNewRoleInput('');
    setNewRolePhoto('');
  };

  // Save Experience Entry
  const handleSaveExp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!expTitle.trim() || !expCompany.trim()) return;
    const newExp: ExperienceItem = {
      id: `exp-${Date.now()}`,
      title: expTitle.trim(),
      company: expCompany.trim(),
      companyLogo: expLogo || undefined,
      employmentType: expType,
      workplaceType: expWorkplace,
      startDate: expStartDate || '2023',
      endDate: expCurrent ? 'Present' : expEndDate || 'Present',
      current: expCurrent,
      description: expDesc.trim(),
      skillsUsed: expSkills.split(',').map((s) => s.trim()).filter(Boolean),
      photos: expPhotos,
      visibility: 'public',
    };
    setExperiences([...experiences, newExp]);
    setExpTitle('');
    setExpCompany('');
    setExpLogo('');
    setExpDesc('');
    setExpSkills('');
    setExpPhotos([]);
    setShowExpForm(false);
  };

  // Save Education Entry
  const handleSaveEdu = (e: React.FormEvent) => {
    e.preventDefault();
    if (!eduSchool.trim() || !eduDegree.trim()) return;
    const newEdu: EducationItem = {
      id: `edu-${Date.now()}`,
      institution: eduSchool.trim(),
      institutionLogo: eduLogo || undefined,
      qualificationType: 'Degree',
      degree: eduDegree.trim(),
      fieldOfStudy: eduField.trim(),
      startDate: eduStartDate || '2019',
      endDate: eduEndDate || '2023',
      currentlyStudying: false,
      description: eduDesc.trim(),
      photos: eduPhotos,
      visibility: 'public',
    };
    setEducations([...educations, newEdu]);
    setEduSchool('');
    setEduDegree('');
    setEduField('');
    setEduLogo('');
    setEduDesc('');
    setEduPhotos([]);
    setShowEduForm(false);
  };

  // Save Project Entry
  const handleSaveProj = (e: React.FormEvent) => {
    e.preventDefault();
    if (!projTitle.trim()) return;
    const newProj: ProjectItem = {
      id: `proj-${Date.now()}`,
      title: projTitle.trim(),
      description: projDesc.trim(),
      role: primaryRole || 'Creator',
      link: projLink.trim(),
      imageUrl: projCover || undefined,
      photos: projPhotos,
      tags: ['Startup', 'Build'],
    };
    setProjects([...projects, newProj]);
    setProjTitle('');
    setProjDesc('');
    setProjLink('');
    setProjCover('');
    setProjPhotos([]);
    setShowProjForm(false);
  };

  // STEP 1 PROCEED
  const handleStep1Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Please provide your full name.');
      return;
    }
    if (!username.trim()) {
      setError('Please provide a unique username.');
      return;
    }
    if (!headline.trim()) {
      setError('Please enter a professional headline (e.g. AI Systems Architect • Building tools).');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('cook_auth_token');
      const res = await fetch('/api/profile/step1', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: name.trim(),
          username: username.trim().toLowerCase(),
          headline: headline.trim(),
          bio: bio.trim(),
          location: location.trim(),
          avatar,
          interests,
          languages,
          portfolioWebsite: portfolioWebsite.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to save Step 1 progress.');
      }

      setCurrentStep(2);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      setError(err.message || 'Error saving profile progress.');
    } finally {
      setLoading(false);
    }
  };

  // COMPLETE PROFILE SUBMIT
  const handleCompleteProfile = async () => {
    setError(null);
    if (!name.trim() || !username.trim() || !headline.trim()) {
      setError('Please ensure Name, Username, and Professional Headline are completed.');
      setCurrentStep(1);
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('cook_auth_token');
      const res = await fetch('/api/profile/complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: name.trim(),
          username: username.trim().toLowerCase(),
          headline: headline.trim(),
          bio: bio.trim(),
          location: location.trim(),
          avatar,
          coverImage,
          primaryRole,
          title: primaryRole,
          customRoles,
          experience: experiences,
          education: educations,
          skills,
          interests,
          languages,
          socialLinkItems,
          portfolioWebsite: portfolioWebsite.trim(),
          website: portfolioWebsite.trim(),
          projects,
          startupStage: experienceLevel,
          collaborationGoals,
          availability,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to complete profile. Please verify your fields and retry.');
      }

      // Profile successfully saved permanently to backend!
      onComplete(data.user);
    } catch (err: any) {
      setError(err.message || 'Failed to complete profile. Your changes have been kept—please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0F19] text-[#F3F4F6] pb-24 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-indigo-600/10 blur-[130px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-[#FF5E1E]/10 blur-[130px] pointer-events-none" />

      {/* Top Header */}
      <header className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-6 flex items-center justify-between border-b border-gray-800/80">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#FF5E1E] to-[#6366F1] flex items-center justify-center shadow-md">
            <Flame className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="font-extrabold text-white text-base tracking-tight">COOK Profile Setup</span>
            <span className="text-[10px] text-gray-400 block -mt-0.5">Google Sign-In Connected</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsPreviewOpen(!isPreviewOpen)}
            className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-gray-300 hover:text-white flex items-center gap-1.5 transition"
          >
            <Eye className="w-3.5 h-3.5 text-indigo-400" />
            <span>{isPreviewOpen ? 'Hide Preview' : 'Preview Profile'}</span>
          </button>

          <button
            type="button"
            onClick={onSignOut}
            className="px-3 py-1.5 rounded-xl text-xs text-gray-400 hover:text-rose-400 hover:bg-rose-500/10 flex items-center gap-1.5 transition"
            title="Sign out and return to Google Sign-In"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>
      </header>

      {/* Step Progress Tracker */}
      <div className="w-full max-w-4xl mx-auto px-4 pt-6 pb-2">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition ${
                currentStep >= 1
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'bg-gray-800 text-gray-400'
              }`}
            >
              1
            </div>
            <div>
              <span className="text-xs font-bold text-white block">Step 1: Basic Profile</span>
              <span className="text-[10px] text-gray-400">Photo, Name, Bio & Interests</span>
            </div>
          </div>

          <div className="h-0.5 flex-1 mx-4 bg-gray-800 relative">
            <div
              className={`h-full bg-gradient-to-r from-indigo-600 to-[#FF5E1E] transition-all duration-300 ${
                currentStep === 2 ? 'w-full' : 'w-0'
              }`}
            />
          </div>

          <div className="flex items-center gap-3">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition ${
                currentStep >= 2
                  ? 'bg-gradient-to-r from-indigo-600 to-[#FF5E1E] text-white shadow-md'
                  : 'bg-gray-800 text-gray-400'
              }`}
            >
              2
            </div>
            <div>
              <span className="text-xs font-bold text-white block">Step 2: Role & Experience</span>
              <span className="text-[10px] text-gray-400">Work, Photos & Social Links</span>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-2.5 text-xs text-rose-300">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-400" />
            <div className="flex-1">{error}</div>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <main className="w-full max-w-4xl mx-auto px-4 pt-4">
        {/* STEP 1: BASIC PROFILE */}
        {currentStep === 1 && (
          <form
            onSubmit={handleStep1Submit}
            className="bg-[#13192B] border border-[#1F293D] rounded-3xl p-6 sm:p-8 shadow-xl space-y-6"
          >
            <div>
              <h2 className="text-xl font-extrabold text-white">Create Your Basic Profile</h2>
              <p className="text-xs text-gray-400 mt-0.5">
                Upload your real photos and share the core details that tell the COOK community who you are.
              </p>
            </div>

            {/* Photo Uploaders (Avatar & Cover) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-[#0B0F19] border border-gray-800">
              <SinglePhotoUpload
                label="Profile Photo (Upload from PC/Mobile)"
                currentUrl={avatar}
                onUploaded={(url) => setAvatar(url)}
                onRemove={() => setAvatar('')}
                aspect="square"
                sublabel="Choose any photo from your computer. JPG, PNG, WebP up to 20MB."
              />

              <SinglePhotoUpload
                label="Wide Cover Image (Upload from PC/Mobile)"
                currentUrl={coverImage}
                onUploaded={(url) => setCoverImage(url)}
                onRemove={() => setCoverImage('')}
                aspect="cover"
                sublabel="Select a banner for the top of your profile."
              />
            </div>

            {/* Name & Username */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your full name"
                  className="w-full px-3.5 py-2.5 bg-[#0B0F19] border border-gray-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">Unique Username *</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 text-xs">@</span>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))}
                    placeholder="your_username"
                    className="w-full pl-8 pr-3.5 py-2.5 bg-[#0B0F19] border border-gray-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>

            {/* Headline */}
            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1">
                Professional Headline *
              </label>
              <input
                type="text"
                required
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                placeholder="e.g. Founder & CEO • Software Architect & Product Builder"
                className="w-full px-3.5 py-2.5 bg-[#0B0F19] border border-gray-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Bio */}
            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1">About / Bio</label>
              <textarea
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="What are you building? Share your passions, mission, and what you're excited to cook next..."
                className="w-full px-3.5 py-2.5 bg-[#0B0F19] border border-gray-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500 resize-none"
              />
            </div>

            {/* Location & External Website */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">Location (Optional)</label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. San Francisco, CA & Remote"
                  className="w-full px-3.5 py-2.5 bg-[#0B0F19] border border-gray-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">
                  External Portfolio Website (Optional)
                </label>
                <input
                  type="url"
                  value={portfolioWebsite}
                  onChange={(e) => setPortfolioWebsite(e.target.value)}
                  placeholder="https://yourportfolio.dev"
                  className="w-full px-3.5 py-2.5 bg-[#0B0F19] border border-gray-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Interests Tagging */}
            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1.5">
                Interests & Focus Areas
              </label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {interests.map((tag) => (
                  <span
                    key={tag}
                    className="px-2.5 py-1 rounded-lg bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-xs font-medium flex items-center gap-1.5"
                  >
                    <span>{tag}</span>
                    <button
                      type="button"
                      onClick={() => setInterests(interests.filter((t) => t !== tag))}
                      className="text-indigo-400 hover:text-white"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newInterestInput}
                  onChange={(e) => setNewInterestInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      if (newInterestInput.trim()) {
                        setInterests([...interests, newInterestInput.trim()]);
                        setNewInterestInput('');
                      }
                    }
                  }}
                  placeholder="Type an interest and press Enter (e.g. Robotics, BioTech, LLMs)"
                  className="flex-1 px-3.5 py-2 bg-[#0B0F19] border border-gray-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (newInterestInput.trim()) {
                      setInterests([...interests, newInterestInput.trim()]);
                      setNewInterestInput('');
                    }
                  }}
                  className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-white font-semibold transition"
                >
                  Add
                </button>
              </div>
            </div>

            {/* Action Row */}
            <div className="pt-4 border-t border-gray-800/80 flex items-center justify-between">
              <span className="text-[11px] text-gray-500">Progress saved securely on submit</span>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-indigo-600/30 active:scale-95 transition cursor-pointer"
              >
                <span>{loading ? 'Saving...' : 'Continue to Step 2'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}

        {/* STEP 2: ROLE, EXPERIENCE & REAL SOCIAL LINKS */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div className="bg-[#13192B] border border-[#1F293D] rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-extrabold text-white">Step 2: Role, Experience & Social Links</h2>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Attach work experience photos, education moments, custom roles, and connect your real social accounts.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-gray-300 hover:text-white flex items-center gap-1.5 transition"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Step 1</span>
                </button>
              </div>

              {/* 1. Primary & Secondary Roles */}
              <div className="p-4 rounded-2xl bg-[#0B0F19] border border-gray-800 space-y-4">
                <span className="text-xs font-bold text-white block">Professional Roles & Stage</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-gray-400 mb-1">Primary Role *</label>
                    <input
                      type="text"
                      value={primaryRole}
                      onChange={(e) => setPrimaryRole(e.target.value)}
                      placeholder="e.g. Founder & CEO, Lead Engineer, Designer"
                      className="w-full px-3.5 py-2 bg-[#13192B] border border-gray-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-gray-400 mb-1">Experience Level</label>
                    <select
                      value={experienceLevel}
                      onChange={(e) => setExperienceLevel(e.target.value)}
                      className="w-full px-3.5 py-2 bg-[#13192B] border border-gray-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                    >
                      <option value="Student">Student</option>
                      <option value="Early Career">Early Career (1-3 yrs)</option>
                      <option value="Mid-Level">Mid-Level (3-5 yrs)</option>
                      <option value="Senior">Senior (5+ yrs)</option>
                      <option value="Lead">Lead / Architect</option>
                      <option value="Founder">Founder / Executive</option>
                    </select>
                  </div>
                </div>

                {/* Custom Roles List & Adder */}
                <div className="pt-2 border-t border-gray-800 space-y-2">
                  <span className="text-[11px] font-semibold text-gray-300 block">
                    Custom Roles ({customRoles.length})
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {customRoles.map((r) => (
                      <div
                        key={r.id}
                        className="px-2.5 py-1 rounded-lg bg-white/5 border border-gray-800 flex items-center gap-2 text-xs text-white"
                      >
                        {r.photo && (
                          <img src={r.photo} alt={r.name} className="w-4 h-4 rounded object-cover" />
                        )}
                        <span>{r.name}</span>
                        <button
                          type="button"
                          onClick={() => setCustomRoles(customRoles.filter((c) => c.id !== r.id))}
                          className="text-gray-400 hover:text-rose-400"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2 pt-1">
                    <input
                      type="text"
                      value={newRoleInput}
                      onChange={(e) => setNewRoleInput(e.target.value)}
                      placeholder="Add any role (e.g. AI Builder, Solo Hacker)"
                      className="flex-1 px-3 py-1.5 bg-[#13192B] border border-gray-800 rounded-xl text-xs text-white focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleAddCustomRole}
                      className="px-3 py-1.5 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-500 transition"
                    >
                      + Add Role
                    </button>
                  </div>

                  <SinglePhotoUpload
                    label="Optional Role Badge or Work Proof Photo (Upload from PC)"
                    currentUrl={newRolePhoto}
                    onUploaded={(url) => setNewRolePhoto(url)}
                    aspect="square"
                    sublabel="Attach an image from your computer to represent this custom role."
                  />
                </div>
              </div>

              {/* 2. REAL SOCIAL MEDIA CONTROL */}
              <div className="p-4 rounded-2xl bg-[#0B0F19] border border-gray-800 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white flex items-center gap-2">
                    <Share2 className="w-3.5 h-3.5 text-indigo-400" />
                    Real Social Media Control & Connections ({socialLinkItems.length})
                  </span>
                  <span className="text-[10px] text-gray-400">Public profile links</span>
                </div>

                {/* Existing Social Links List with Reorder and Delete */}
                {socialLinkItems.length > 0 && (
                  <div className="space-y-2">
                    {socialLinkItems.map((item, index) => (
                      <div
                        key={item.id}
                        className="p-2.5 rounded-xl bg-[#13192B] border border-gray-800 flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-white/5 text-gray-300">
                            {item.platform}
                          </span>
                          <span className="font-semibold text-white truncate">{item.platformName}</span>
                          <a
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[11px] text-indigo-400 hover:underline truncate max-w-[200px]"
                          >
                            {item.url}
                          </a>
                        </div>

                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button
                            type="button"
                            disabled={index === 0}
                            onClick={() => handleMoveSocialLink(index, 'up')}
                            className="p-1 rounded text-gray-400 hover:text-white disabled:opacity-30"
                            title="Move Up"
                          >
                            <ChevronUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            disabled={index === socialLinkItems.length - 1}
                            onClick={() => handleMoveSocialLink(index, 'down')}
                            className="p-1 rounded text-gray-400 hover:text-white disabled:opacity-30"
                            title="Move Down"
                          >
                            <ChevronDown className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveSocialLink(item.id)}
                            className="p-1 rounded text-gray-400 hover:text-rose-400"
                            title="Remove Link"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add Social Link Form */}
                <div className="p-3 rounded-xl bg-[#13192B] border border-dashed border-gray-800 space-y-3">
                  <span className="text-[11px] font-semibold text-gray-300 block">Add New Social Profile Link</span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <select
                      value={newSocialPlatform}
                      onChange={(e) => setNewSocialPlatform(e.target.value as any)}
                      className="px-3 py-2 bg-[#0B0F19] border border-gray-800 rounded-xl text-xs text-white focus:outline-none"
                    >
                      <option value="linkedin">LinkedIn</option>
                      <option value="github">GitHub</option>
                      <option value="twitter">X (Twitter)</option>
                      <option value="instagram">Instagram</option>
                      <option value="youtube">YouTube</option>
                      <option value="facebook">Facebook</option>
                      <option value="behance">Behance</option>
                      <option value="dribbble">Dribbble</option>
                      <option value="medium">Medium</option>
                      <option value="website">Personal Website</option>
                      <option value="other">Other Platform</option>
                    </select>

                    <input
                      type="url"
                      value={newSocialUrl}
                      onChange={(e) => {
                        setNewSocialUrl(e.target.value);
                        const detected = detectPlatformFromUrl(e.target.value);
                        if (detected !== 'other') setNewSocialPlatform(detected);
                      }}
                      placeholder="https://linkedin.com/in/username"
                      className="sm:col-span-2 px-3 py-2 bg-[#0B0F19] border border-gray-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={handleAddSocialLink}
                      className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 transition"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Social Link</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* 3. Work Experience Entries with Photos */}
              <div className="p-4 rounded-2xl bg-[#0B0F19] border border-gray-800 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white flex items-center gap-2">
                    <Briefcase className="w-3.5 h-3.5 text-indigo-400" />
                    Work Experience ({experiences.length})
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowExpForm(!showExpForm)}
                    className="px-3 py-1 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-indigo-300 font-semibold flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{showExpForm ? 'Close Form' : 'Add Experience'}</span>
                  </button>
                </div>

                {experiences.map((exp) => (
                  <div
                    key={exp.id}
                    className="p-3 rounded-xl bg-[#13192B] border border-gray-800 space-y-2 text-xs"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-bold text-white text-sm">{exp.title}</h4>
                        <span className="text-gray-400 text-xs">
                          {exp.company} • {exp.startDate} - {exp.endDate}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setExperiences(experiences.filter((e) => e.id !== exp.id))}
                        className="text-gray-400 hover:text-rose-400"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {exp.description && <p className="text-gray-300 text-xs">{exp.description}</p>}

                    {exp.photos && exp.photos.length > 0 && (
                      <div className="flex gap-2 overflow-x-auto py-1">
                        {exp.photos.map((p, idx) => (
                          <img
                            key={idx}
                            src={p.url}
                            alt={p.caption || 'work photo'}
                            className="w-14 h-14 rounded-lg object-cover border border-gray-700"
                          />
                        ))}
                      </div>
                    )}
                  </div>
                ))}

                {/* Add Experience Form */}
                {showExpForm && (
                  <form onSubmit={handleSaveExp} className="p-4 rounded-xl bg-[#13192B] border border-gray-800 space-y-3">
                    <h5 className="font-bold text-white text-xs">New Work Experience Entry</h5>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <input
                        type="text"
                        required
                        value={expTitle}
                        onChange={(e) => setExpTitle(e.target.value)}
                        placeholder="Job Title *"
                        className="px-3 py-2 bg-[#0B0F19] border border-gray-800 rounded-xl text-xs text-white focus:outline-none"
                      />
                      <input
                        type="text"
                        required
                        value={expCompany}
                        onChange={(e) => setExpCompany(e.target.value)}
                        placeholder="Company Name *"
                        className="px-3 py-2 bg-[#0B0F19] border border-gray-800 rounded-xl text-xs text-white focus:outline-none"
                      />
                    </div>

                    <textarea
                      rows={2}
                      value={expDesc}
                      onChange={(e) => setExpDesc(e.target.value)}
                      placeholder="Key achievements, impact, technologies used..."
                      className="w-full px-3 py-2 bg-[#0B0F19] border border-gray-800 rounded-xl text-xs text-white focus:outline-none resize-none"
                    />

                    {/* Company Logo Upload from PC */}
                    <SinglePhotoUpload
                      label="Company Logo (Upload from PC)"
                      currentUrl={expLogo}
                      onUploaded={(url) => setExpLogo(url)}
                      aspect="square"
                      sublabel="Upload company icon or logo from your computer."
                    />

                    {/* Work Experience Photo Gallery from PC */}
                    <GalleryPhotoUpload
                      label="Attach Workplace, Team, or Project Photos (From PC/Mobile)"
                      photos={expPhotos}
                      onPhotosChanged={(updated) => setExpPhotos(updated)}
                      helpText="Add office, team, or screenshot photos from your computer files with captions."
                    />

                    <div className="flex justify-end gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setShowExpForm(false)}
                        className="px-3 py-1.5 rounded-xl bg-white/5 text-gray-400 text-xs hover:text-white"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-1.5 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-500"
                      >
                        Save Experience
                      </button>
                    </div>
                  </form>
                )}
              </div>

              {/* 4. Education Entries with Photos */}
              <div className="p-4 rounded-2xl bg-[#0B0F19] border border-gray-800 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white flex items-center gap-2">
                    <GraduationCap className="w-3.5 h-3.5 text-indigo-400" />
                    Education & Certifications ({educations.length})
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowEduForm(!showEduForm)}
                    className="px-3 py-1 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-indigo-300 font-semibold flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{showEduForm ? 'Close Form' : 'Add Education'}</span>
                  </button>
                </div>

                {educations.map((edu) => (
                  <div
                    key={edu.id}
                    className="p-3 rounded-xl bg-[#13192B] border border-gray-800 space-y-2 text-xs"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-bold text-white text-sm">{edu.institution}</h4>
                        <span className="text-gray-400 text-xs">
                          {edu.degree} {edu.fieldOfStudy ? `in ${edu.fieldOfStudy}` : ''} • {edu.startDate} - {edu.endDate}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setEducations(educations.filter((e) => e.id !== edu.id))}
                        className="text-gray-400 hover:text-rose-400"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {edu.photos && edu.photos.length > 0 && (
                      <div className="flex gap-2 overflow-x-auto py-1">
                        {edu.photos.map((p, idx) => (
                          <img
                            key={idx}
                            src={p.url}
                            alt={p.caption || 'education photo'}
                            className="w-14 h-14 rounded-lg object-cover border border-gray-700"
                          />
                        ))}
                      </div>
                    )}
                  </div>
                ))}

                {showEduForm && (
                  <form onSubmit={handleSaveEdu} className="p-4 rounded-xl bg-[#13192B] border border-gray-800 space-y-3">
                    <h5 className="font-bold text-white text-xs">New Education Entry</h5>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <input
                        type="text"
                        required
                        value={eduSchool}
                        onChange={(e) => setEduSchool(e.target.value)}
                        placeholder="School or Institution *"
                        className="px-3 py-2 bg-[#0B0F19] border border-gray-800 rounded-xl text-xs text-white focus:outline-none"
                      />
                      <input
                        type="text"
                        required
                        value={eduDegree}
                        onChange={(e) => setEduDegree(e.target.value)}
                        placeholder="Degree or Qualification *"
                        className="px-3 py-2 bg-[#0B0F19] border border-gray-800 rounded-xl text-xs text-white focus:outline-none"
                      />
                    </div>

                    <input
                      type="text"
                      value={eduField}
                      onChange={(e) => setEduField(e.target.value)}
                      placeholder="Field of Study (e.g. Computer Science)"
                      className="w-full px-3 py-2 bg-[#0B0F19] border border-gray-800 rounded-xl text-xs text-white focus:outline-none"
                    />

                    {/* Institution Logo */}
                    <SinglePhotoUpload
                      label="Institution Logo (Upload from PC)"
                      currentUrl={eduLogo}
                      onUploaded={(url) => setEduLogo(url)}
                      aspect="square"
                      sublabel="School or college badge from your computer."
                    />

                    {/* Campus & Certificate Photos */}
                    <GalleryPhotoUpload
                      label="Campus, Certificate, or Graduation Photos (From PC)"
                      photos={eduPhotos}
                      onPhotosChanged={(updated) => setEduPhotos(updated)}
                      helpText="Add certificate or campus photos from your device with captions."
                    />

                    <div className="flex justify-end gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setShowEduForm(false)}
                        className="px-3 py-1.5 rounded-xl bg-white/5 text-gray-400 text-xs hover:text-white"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-1.5 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-500"
                      >
                        Save Education
                      </button>
                    </div>
                  </form>
                )}
              </div>

              {/* Complete & Enter Button */}
              <div className="pt-4 border-t border-gray-800 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-gray-300 font-semibold transition"
                >
                  Back to Step 1
                </button>

                <button
                  type="button"
                  disabled={loading}
                  onClick={handleCompleteProfile}
                  className="px-6 py-3 rounded-2xl bg-gradient-to-r from-indigo-600 via-[#8B5CF6] to-[#FF5E1E] hover:opacity-95 text-white text-xs font-extrabold flex items-center gap-2 shadow-xl shadow-purple-500/25 active:scale-95 transition cursor-pointer"
                >
                  <span>{loading ? 'Completing Profile...' : 'Complete Profile & Enter COOK'}</span>
                  <CheckCircle2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Live Profile Preview Modal */}
      {isPreviewOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-2xl bg-[#13192B] border border-gray-800 rounded-3xl p-6 shadow-2xl relative my-8 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-gray-800">
              <span className="font-bold text-white text-sm">Public Profile Preview</span>
              <button
                type="button"
                onClick={() => setIsPreviewOpen(false)}
                className="text-gray-400 hover:text-white text-xs font-semibold"
              >
                Close Preview
              </button>
            </div>

            {/* Profile Header Preview */}
            <div className="relative rounded-2xl overflow-hidden border border-gray-800 bg-[#0B0F19]">
              <div className="h-28 w-full bg-gradient-to-r from-indigo-900 to-purple-900 overflow-hidden">
                {coverImage && <img src={coverImage} alt="Cover" className="w-full h-full object-cover" />}
              </div>
              <div className="p-4 pt-0 relative flex items-end justify-between -mt-8">
                <div className="w-16 h-16 rounded-full border-4 border-[#13192B] overflow-hidden bg-black">
                  <img
                    src={avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'}
                    alt="Avatar"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
              <div className="px-4 pb-4 space-y-1">
                <h3 className="font-extrabold text-white text-base">{name || 'Your Name'}</h3>
                <span className="text-xs text-indigo-400">@{username || 'username'}</span>
                <p className="text-xs text-gray-300 font-medium">{headline || 'Professional Headline'}</p>
                {bio && <p className="text-xs text-gray-400 pt-1 leading-relaxed">{bio}</p>}
              </div>
            </div>

            {/* Social Links Preview */}
            {socialLinkItems.length > 0 && (
              <ConnectWithMe
                user={{
                  id: user.id,
                  name: name || 'Founder',
                  username: username || 'user',
                  avatar: avatar || '',
                  role: primaryRole || 'Founder',
                  title: headline || '',
                  bio: bio || '',
                  location: location || '',
                  verified: false,
                  postsCount: 0,
                  followersCount: 0,
                  followingCount: 0,
                  skills: skills,
                  interests: interests,
                  socialLinkItems: socialLinkItems,
                }}
                socialLinks={socialLinkItems}
              />
            )}

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setIsPreviewOpen(false)}
                className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold"
              >
                Back to Editing
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
