import React, { useState } from 'react';
import {
  User as UserIcon,
  Briefcase,
  GraduationCap,
  Sparkles,
  Layers,
  FolderGit2,
  Award,
  Link2,
  Lock,
  Camera,
  Plus,
  Trash2,
  Edit2,
  Check,
  ArrowLeft,
  Eye,
  Flame,
  Star,
  ExternalLink,
  ChevronRight,
  Upload,
} from 'lucide-react';
import {
  User,
  CustomRole,
  SkillItem,
  ExperienceItem,
  EducationItem,
  ProjectItem,
  CertificationItem,
  ProfilePrivacySettings,
  SocialLinkItem,
  SocialPlatform,
  RecordPhoto,
  VisibilityLevel,
} from '../types';
import { PhotoCropModal } from './PhotoCropModal';
import { SinglePhotoUpload, GalleryPhotoUpload } from './PhotoUpload';

interface EditProfileViewProps {
  user: User;
  onSave: (updated: Partial<User>) => Promise<void> | void;
  onBack: () => void;
  onViewPublicProfile?: () => void;
}

type TabKey =
  | 'personal'
  | 'media'
  | 'roles'
  | 'skills'
  | 'experience'
  | 'education'
  | 'projects'
  | 'certifications'
  | 'social'
  | 'privacy';

export const EditProfileView: React.FC<EditProfileViewProps> = ({
  user,
  onSave,
  onBack,
  onViewPublicProfile,
}) => {
  const [activeTab, setActiveTab] = useState<TabKey>('personal');

  // Form states
  const [firstName, setFirstName] = useState(user.firstName || user.name.split(' ')[0] || '');
  const [lastName, setLastName] = useState(user.lastName || user.name.split(' ').slice(1).join(' ') || '');
  const [displayName, setDisplayName] = useState(user.name || '');
  const [username, setUsername] = useState(user.username || '');
  const [headline, setHeadline] = useState(user.headline || user.title || '');
  const [bio, setBio] = useState(user.bio || '');
  const [location, setLocation] = useState(user.location || '');
  const [website, setWebsite] = useState(user.website || '');
  const [startupStage, setStartupStage] = useState(user.startupStage || 'MVP');
  const [avatar, setAvatar] = useState(user.avatar || '');
  const [coverImage, setCoverImage] = useState(
    user.coverImage ||
      'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1600&auto=format&fit=crop&q=80'
  );

  // Custom Roles state
  const [customRoles, setCustomRoles] = useState<CustomRole[]>(
    user.customRoles || [
      { id: 'r-1', name: user.role || 'Founder', isPrimary: true, category: 'Founder' },
    ]
  );
  const [newRoleInput, setNewRoleInput] = useState('');
  const [newRoleCategory, setNewRoleCategory] = useState<CustomRole['category']>('Professional');

  // Skills state
  const [skillItems, setSkillItems] = useState<SkillItem[]>(
    user.skillItems ||
      user.skills.map((s, idx) => ({
        id: `sk-${idx}`,
        name: s,
        proficiency: 'Advanced',
        category: 'Technical Skills',
      }))
  );
  const [newSkillInput, setNewSkillInput] = useState('');
  const [newSkillCategory, setNewSkillCategory] = useState('Technical Skills');
  const [newSkillProficiency, setNewSkillProficiency] = useState<SkillItem['proficiency']>('Advanced');

  // Experience state
  const [experiences, setExperiences] = useState<ExperienceItem[]>(user.experience || []);
  const [showExpForm, setShowExpForm] = useState(false);
  const [editingExpId, setEditingExpId] = useState<string | null>(null);
  const [expTitle, setExpTitle] = useState('');
  const [expCompany, setExpCompany] = useState('');
  const [expLogo, setExpLogo] = useState('');
  const [expEmploymentType, setExpEmploymentType] = useState('Full-time');
  const [expWorkplaceType, setExpWorkplaceType] = useState<'Remote' | 'Hybrid' | 'On-site'>('Remote');
  const [expStartDate, setExpStartDate] = useState('');
  const [expEndDate, setExpEndDate] = useState('');
  const [expCurrent, setExpCurrent] = useState(false);
  const [expDescription, setExpDescription] = useState('');
  const [expSkillsUsed, setExpSkillsUsed] = useState('');
  const [expPhotos, setExpPhotos] = useState<RecordPhoto[]>([]);
  const [expVisibility, setExpVisibility] = useState<VisibilityLevel>('public');

  // Education state
  const [educations, setEducations] = useState<EducationItem[]>(user.education || []);
  const [showEduForm, setShowEduForm] = useState(false);
  const [editingEduId, setEditingEduId] = useState<string | null>(null);
  const [eduInstitution, setEduInstitution] = useState('');
  const [eduLogo, setEduLogo] = useState('');
  const [eduQualificationType, setEduQualificationType] = useState('Undergraduate Degree');
  const [eduDegree, setEduDegree] = useState('');
  const [eduFieldOfStudy, setEduFieldOfStudy] = useState('');
  const [eduStartDate, setEduStartDate] = useState('');
  const [eduEndDate, setEduEndDate] = useState('');
  const [eduCurrentlyStudying, setEduCurrentlyStudying] = useState(false);
  const [eduGrade, setEduGrade] = useState('');
  const [eduDescription, setEduDescription] = useState('');
  const [eduPhotos, setEduPhotos] = useState<RecordPhoto[]>([]);
  const [eduVisibility, setEduVisibility] = useState<VisibilityLevel>('public');

  // Projects state
  const [projects, setProjects] = useState<ProjectItem[]>(user.projects || []);
  const [showProjForm, setShowProjForm] = useState(false);
  const [projTitle, setProjTitle] = useState('');
  const [projRole, setProjRole] = useState('');
  const [projLink, setProjLink] = useState('');
  const [projDesc, setProjDesc] = useState('');
  const [projTags, setProjTags] = useState('');
  const [projImage, setProjImage] = useState('');
  const [projGallery, setProjGallery] = useState<RecordPhoto[]>([]);

  // Role photo state
  const [newRolePhoto, setNewRolePhoto] = useState('');

  // Certifications state
  const [certifications, setCertifications] = useState<CertificationItem[]>(user.certifications || []);
  const [showCertForm, setShowCertForm] = useState(false);
  const [certName, setCertName] = useState('');
  const [certOrg, setCertOrg] = useState('');
  const [certDate, setCertDate] = useState('');
  const [certId, setCertId] = useState('');
  const [certUrl, setCertUrl] = useState('');

  // Social links state
  const [socialLinks, setSocialLinks] = useState({
    github: user.socialLinks?.github || '',
    linkedin: user.socialLinks?.linkedin || '',
    twitter: user.socialLinks?.twitter || '',
    website: user.socialLinks?.website || user.website || '',
    youtube: user.socialLinks?.youtube || '',
    instagram: user.socialLinks?.instagram || '',
    facebook: user.socialLinks?.facebook || '',
  });

  // Dedicated Social Link Items state
  const [socialLinkItems, setSocialLinkItems] = useState<SocialLinkItem[]>(
    user.socialLinkItems && user.socialLinkItems.length > 0
      ? user.socialLinkItems
      : [
          { id: 'soc-1', platform: 'linkedin' as SocialPlatform, platformName: 'LinkedIn', url: user.socialLinks?.linkedin || 'https://linkedin.com/in/arjunmehta-cook', visibility: 'public' as VisibilityLevel, displayOrder: 1 },
          { id: 'soc-2', platform: 'github' as SocialPlatform, platformName: 'GitHub', url: user.socialLinks?.github || 'https://github.com/arjunmehta', visibility: 'public' as VisibilityLevel, displayOrder: 2 },
          { id: 'soc-3', platform: 'twitter' as SocialPlatform, platformName: 'X (Twitter)', url: user.socialLinks?.twitter || 'https://x.com/arjun_builds', visibility: 'public' as VisibilityLevel, displayOrder: 3 },
          { id: 'soc-4', platform: 'website' as SocialPlatform, platformName: 'Portfolio Website', url: user.socialLinks?.website || user.website || 'https://arjun.build', visibility: 'public' as VisibilityLevel, displayOrder: 4 },
        ].filter(s => s.url)
  );

  const [newSocialPlatform, setNewSocialPlatform] = useState<SocialPlatform>('linkedin');
  const [newSocialUrl, setNewSocialUrl] = useState('');
  const [newSocialCustomName, setNewSocialCustomName] = useState('');
  const [newSocialVisibility, setNewSocialVisibility] = useState<VisibilityLevel>('public');

  // Privacy settings state
  const [privacySettings, setPrivacySettings] = useState<ProfilePrivacySettings>(
    user.privacySettings || {
      profileVisibility: 'public',
      showEmail: false,
      showEducationGrades: true,
      showFundingRequests: true,
      allowDirectMessages: true,
    }
  );

  // Photo Crop Modal states
  const [photoCropOpen, setPhotoCropOpen] = useState(false);
  const [photoCropMode, setPhotoCropMode] = useState<'avatar' | 'cover'>('avatar');

  // Save feedback state
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Suggested roles library
  const suggestedRoles = [
    'Founder & CEO',
    'AI Systems Architect',
    'Aspiring Entrepreneur',
    'Product Designer',
    'Full Stack Engineer',
    'Angel Investor',
    'Venture Capitalist',
    'Growth Marketer',
    'Content Creator',
    'Student Builder',
    'Research Scientist',
    'Open Source Contributor',
  ];

  // Suggested skills library
  const suggestedSkills = [
    'React',
    'TypeScript',
    'Node.js',
    'Python',
    'LLM Agents',
    'System Architecture',
    'UI/UX Design',
    'Venture Fundraising',
    'Growth Loops',
    'Product Strategy',
    'PostgreSQL',
    'Kubernetes',
    'Prompt Engineering',
  ];

  // Handle Add Role
  const handleAddRole = (roleNameToAdd?: string) => {
    const name = (roleNameToAdd || newRoleInput).trim();
    if (!name) return;
    if (customRoles.some((r) => r.name.toLowerCase() === name.toLowerCase())) return;

    const newRole: CustomRole = {
      id: `role-${Date.now()}`,
      name,
      isPrimary: customRoles.length === 0,
      category: newRoleCategory,
      photo: newRolePhoto || undefined,
    };
    setCustomRoles([...customRoles, newRole]);
    setNewRoleInput('');
    setNewRolePhoto('');
  };

  const handleSetPrimaryRole = (id: string) => {
    setCustomRoles(
      customRoles.map((r) => ({
        ...r,
        isPrimary: r.id === id,
      }))
    );
  };

  const handleRemoveRole = (id: string) => {
    setCustomRoles(customRoles.filter((r) => r.id !== id));
  };

  // Handle Add Skill
  const handleAddSkill = (skillNameToAdd?: string) => {
    const name = (skillNameToAdd || newSkillInput).trim();
    if (!name) return;
    if (skillItems.some((s) => s.name.toLowerCase() === name.toLowerCase())) return;

    const newSkill: SkillItem = {
      id: `sk-${Date.now()}`,
      name,
      category: newSkillCategory,
      proficiency: newSkillProficiency,
      endorsementsCount: 1,
      featured: skillItems.length < 3,
    };
    setSkillItems([...skillItems, newSkill]);
    setNewSkillInput('');
  };

  const handleToggleFeaturedSkill = (id: string) => {
    setSkillItems(
      skillItems.map((s) => (s.id === id ? { ...s, featured: !s.featured } : s))
    );
  };

  const handleRemoveSkill = (id: string) => {
    setSkillItems(skillItems.filter((s) => s.id !== id));
  };

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

  // Handle Add Social Link Item
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
      visibility: newSocialVisibility,
      displayOrder: socialLinkItems.length + 1,
    };

    const updatedList = [...socialLinkItems, newLink];
    setSocialLinkItems(updatedList);
    setNewSocialUrl('');
    setNewSocialCustomName('');

    // Also update legacy socialLinks object for backward compatibility
    if (platform === 'linkedin' || platform === 'github' || platform === 'twitter' || platform === 'website' || platform === 'youtube' || platform === 'instagram' || platform === 'facebook') {
      setSocialLinks(prev => ({ ...prev, [platform]: newLink.url }));
    }
  };

  const handleRemoveSocialLink = (id: string) => {
    setSocialLinkItems(socialLinkItems.filter(s => s.id !== id));
  };

  const handleMoveSocialLink = (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= socialLinkItems.length) return;
    const copy = [...socialLinkItems];
    const [moved] = copy.splice(index, 1);
    copy.splice(targetIdx, 0, moved);
    setSocialLinkItems(copy);
  };

  // Handle Experience Save
  const handleSaveExp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!expTitle.trim() || !expCompany.trim()) return;

    if (editingExpId) {
      setExperiences(
        experiences.map((exp) =>
          exp.id === editingExpId
            ? {
                ...exp,
                title: expTitle,
                company: expCompany,
                companyLogo: expLogo || exp.companyLogo,
                employmentType: expEmploymentType,
                workplaceType: expWorkplaceType,
                startDate: expStartDate,
                endDate: expCurrent ? 'Present' : expEndDate,
                current: expCurrent,
                description: expDescription,
                skillsUsed: expSkillsUsed.split(',').map((s) => s.trim()).filter(Boolean),
                photos: expPhotos,
                visibility: expVisibility,
              }
            : exp
        )
      );
    } else {
      const newExp: ExperienceItem = {
        id: `exp-${Date.now()}`,
        title: expTitle,
        company: expCompany,
        companyLogo: expLogo,
        employmentType: expEmploymentType,
        workplaceType: expWorkplaceType,
        startDate: expStartDate || '2024',
        endDate: expCurrent ? 'Present' : expEndDate || 'Present',
        current: expCurrent,
        description: expDescription,
        skillsUsed: expSkillsUsed.split(',').map((s) => s.trim()).filter(Boolean),
        photos: expPhotos,
        visibility: expVisibility,
      };
      setExperiences([newExp, ...experiences]);
    }

    // Reset Form
    setShowExpForm(false);
    setEditingExpId(null);
    setExpTitle('');
    setExpCompany('');
    setExpLogo('');
    setExpStartDate('');
    setExpEndDate('');
    setExpDescription('');
    setExpSkillsUsed('');
    setExpPhotos([]);
    setExpCurrent(false);
    setExpVisibility('public');
  };

  const handleEditExp = (exp: ExperienceItem) => {
    setEditingExpId(exp.id);
    setExpTitle(exp.title);
    setExpCompany(exp.company);
    setExpLogo(exp.companyLogo || '');
    setExpEmploymentType(exp.employmentType);
    setExpWorkplaceType(exp.workplaceType);
    setExpStartDate(exp.startDate);
    setExpEndDate(exp.endDate || '');
    setExpCurrent(exp.current);
    setExpDescription(exp.description);
    setExpSkillsUsed(exp.skillsUsed?.join(', ') || '');
    setExpPhotos(exp.photos || []);
    setExpVisibility(exp.visibility || 'public');
    setShowExpForm(true);
  };

  const handleDeleteExp = (id: string) => {
    setExperiences(experiences.filter((exp) => exp.id !== id));
  };

  // Handle Education Save
  const handleSaveEdu = (e: React.FormEvent) => {
    e.preventDefault();
    if (!eduInstitution.trim()) return;

    if (editingEduId) {
      setEducations(
        educations.map((edu) =>
          edu.id === editingEduId
            ? {
                ...edu,
                institution: eduInstitution,
                institutionLogo: eduLogo || edu.institutionLogo,
                qualificationType: eduQualificationType,
                degree: eduDegree,
                fieldOfStudy: eduFieldOfStudy,
                startDate: eduStartDate,
                endDate: eduCurrentlyStudying ? 'Present' : eduEndDate,
                currentlyStudying: eduCurrentlyStudying,
                grade: eduGrade,
                description: eduDescription,
                photos: eduPhotos,
                visibility: eduVisibility,
              }
            : edu
        )
      );
    } else {
      const newEdu: EducationItem = {
        id: `edu-${Date.now()}`,
        institution: eduInstitution,
        institutionLogo: eduLogo,
        qualificationType: eduQualificationType,
        degree: eduDegree,
        fieldOfStudy: eduFieldOfStudy,
        startDate: eduStartDate || '2020',
        endDate: eduCurrentlyStudying ? 'Present' : eduEndDate || '2024',
        currentlyStudying: eduCurrentlyStudying,
        grade: eduGrade,
        description: eduDescription,
        photos: eduPhotos,
        visibility: eduVisibility,
      };
      setEducations([newEdu, ...educations]);
    }

    setShowEduForm(false);
    setEditingEduId(null);
    setEduInstitution('');
    setEduLogo('');
    setEduDegree('');
    setEduFieldOfStudy('');
    setEduStartDate('');
    setEduEndDate('');
    setEduGrade('');
    setEduDescription('');
    setEduPhotos([]);
    setEduCurrentlyStudying(false);
    setEduVisibility('public');
  };

  const handleEditEdu = (edu: EducationItem) => {
    setEditingEduId(edu.id);
    setEduInstitution(edu.institution);
    setEduLogo(edu.institutionLogo || '');
    setEduQualificationType(edu.qualificationType);
    setEduDegree(edu.degree);
    setEduFieldOfStudy(edu.fieldOfStudy);
    setEduStartDate(edu.startDate);
    setEduEndDate(edu.endDate || '');
    setEduCurrentlyStudying(edu.currentlyStudying);
    setEduGrade(edu.grade || '');
    setEduDescription(edu.description || '');
    setEduPhotos(edu.photos || []);
    setEduVisibility(edu.visibility || 'public');
    setShowEduForm(true);
  };

  const handleDeleteEdu = (id: string) => {
    setEducations(educations.filter((edu) => edu.id !== id));
  };

  // Master Save Handler
  const handleMasterSave = async () => {
    setIsSaving(true);
    const primaryRole = customRoles.find((r) => r.isPrimary)?.name || customRoles[0]?.name || 'Founder';

    const updatedUserPayload: Partial<User> = {
      name: displayName.trim() || `${firstName} ${lastName}`.trim(),
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      username: username.trim().toLowerCase().replace(/@/g, ''),
      headline: headline.trim(),
      title: headline.trim(),
      bio: bio.trim(),
      location: location.trim(),
      website: website.trim(),
      portfolioWebsite: socialLinks.website || user.portfolioWebsite,
      startupStage,
      avatar,
      coverImage,
      role: primaryRole,
      primaryRole,
      customRoles,
      skills: skillItems.map((s) => s.name),
      skillItems,
      experience: experiences,
      education: educations,
      projects,
      certifications,
      socialLinks,
      socialLinkItems,
      privacySettings,
    };

    try {
      await onSave(updatedUserPayload);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const navItems = [
    { id: 'personal', label: 'Personal Information', icon: UserIcon },
    { id: 'media', label: 'Photos & Banner', icon: Camera },
    { id: 'roles', label: 'Roles & Specialties', icon: Layers, badge: `${customRoles.length}` },
    { id: 'skills', label: 'Skills & Expertise', icon: Sparkles, badge: `${skillItems.length}` },
    { id: 'experience', label: 'Experience', icon: Briefcase, badge: `${experiences.length}` },
    { id: 'education', label: 'Education & Learning', icon: GraduationCap, badge: `${educations.length}` },
    { id: 'projects', label: 'Projects & Portfolio', icon: FolderGit2 },
    { id: 'certifications', label: 'Certifications', icon: Award },
    { id: 'social', label: 'Social & Links', icon: Link2 },
    { id: 'privacy', label: 'Privacy & Visibility', icon: Lock },
  ];

  return (
    <div className="w-full max-w-6xl mx-auto space-y-5 pb-20 select-none">
      {/* Photo Crop Modal trigger */}
      <PhotoCropModal
        isOpen={photoCropOpen}
        onClose={() => setPhotoCropOpen(false)}
        initialImage={photoCropMode === 'avatar' ? avatar : coverImage}
        isCover={photoCropMode === 'cover'}
        title={photoCropMode === 'avatar' ? 'Change Profile Avatar' : 'Change Cover Banner'}
        onSave={(croppedUrl) => {
          if (photoCropMode === 'avatar') {
            setAvatar(croppedUrl);
          } else {
            setCoverImage(croppedUrl);
          }
        }}
      />

      {/* Top Header Bar */}
      <div className="bg-[#13192B] border border-[#1F293D] rounded-2xl p-4 sm:p-5 shadow-lg flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white flex items-center justify-center transition active:scale-95"
            title="Back to profile"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-extrabold text-white">Edit Profile & Credentials</h1>
              <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-[10px] font-bold border border-indigo-500/30">
                PRO
              </span>
            </div>
            <p className="text-xs text-gray-400">
              Customize your roles, experience, skills, and public founder persona
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {onViewPublicProfile && (
            <button
              onClick={onViewPublicProfile}
              className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition"
            >
              <Eye className="w-3.5 h-3.5 text-indigo-400" />
              <span>Preview Public Profile</span>
            </button>
          )}

          <button
            onClick={handleMasterSave}
            disabled={isSaving}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] hover:from-[#4F46E5] hover:to-[#7C3AED] text-white text-xs font-bold shadow-lg shadow-indigo-500/25 flex items-center gap-1.5 transition active:scale-95 cursor-pointer disabled:opacity-50"
          >
            {isSaving ? (
              <span>Saving...</span>
            ) : saveSuccess ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span>Saved!</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>Save Changes</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Layout Split: Desktop Left Nav, Mobile Horizontal Scroller */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Nav Menu */}
        <div className="lg:col-span-4 xl:col-span-3">
          {/* Mobile Horizontal Tabs */}
          <div className="lg:hidden flex overflow-x-auto gap-2 pb-2 scrollbar-none">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id as TabKey)}
                  className={`flex-shrink-0 flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'bg-[#13192B] border border-[#1F293D] text-gray-400 hover:text-white'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* Desktop Left Sidebar Card */}
          <div className="hidden lg:block bg-[#13192B] border border-[#1F293D] rounded-2xl p-3 shadow-lg space-y-1 sticky top-20">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id as TabKey)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${
                    isActive
                      ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-md'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-gray-400'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span
                      className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                        isActive ? 'bg-white/20 text-white' : 'bg-gray-800 text-gray-400'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Content Editor Card */}
        <div className="lg:col-span-8 xl:col-span-9 space-y-5">
          {/* TAB 1: Personal Information */}
          {activeTab === 'personal' && (
            <div className="bg-[#13192B] border border-[#1F293D] rounded-2xl p-5 sm:p-6 shadow-lg space-y-5">
              <div>
                <h2 className="text-base font-bold text-white mb-1">Personal Details</h2>
                <p className="text-xs text-gray-400">
                  Basic information displayed at the top of your public profile
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">First Name</label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#0B0F19] border border-gray-800 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500"
                    placeholder="Arjun"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">Last Name</label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#0B0F19] border border-gray-800 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500"
                    placeholder="Mehta"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">Display Name</label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#0B0F19] border border-gray-800 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500"
                    placeholder="Arjun Mehta"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">Username / Handle</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-2.5 text-gray-500 text-sm">@</span>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full pl-8 pr-3.5 py-2.5 bg-[#0B0F19] border border-gray-800 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500"
                      placeholder="arjun_builds"
                    />
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-medium text-gray-300">Professional Headline</label>
                  <span className="text-[10px] text-gray-500">{headline.length}/140</span>
                </div>
                <input
                  type="text"
                  maxLength={140}
                  value={headline}
                  onChange={(e) => setHeadline(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#0B0F19] border border-gray-800 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500"
                  placeholder="e.g. Founder & CEO @ TechNova • AI Systems Architect • Building in Public"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">Location</label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#0B0F19] border border-gray-800 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500"
                    placeholder="e.g. San Francisco, CA & Remote"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">Website URL</label>
                  <input
                    type="text"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#0B0F19] border border-gray-800 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500"
                    placeholder="https://yourdomain.com"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-medium text-gray-300">About & Biography</label>
                  <span className="text-[10px] text-gray-500">{bio.length}/1000</span>
                </div>
                <textarea
                  rows={4}
                  maxLength={1000}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#0B0F19] border border-gray-800 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500 resize-none leading-relaxed"
                  placeholder="Share your founder journey, mission, key achievements, and what you're cooking..."
                />
              </div>
            </div>
          )}

          {/* TAB 2: Photos & Banner */}
          {activeTab === 'media' && (
            <div className="bg-[#13192B] border border-[#1F293D] rounded-2xl p-5 sm:p-6 shadow-lg space-y-6">
              <div>
                <h2 className="text-base font-bold text-white mb-1">Profile Photo & Cover Banner</h2>
                <p className="text-xs text-gray-400">
                  Upload, reposition, crop, and adjust your visuals using the interactive canvas editor
                </p>
              </div>

              {/* Cover Banner Preview */}
              <div className="space-y-2">
                <label className="block text-xs font-medium text-gray-300">Cover Banner</label>
                <div className="relative h-44 sm:h-52 rounded-2xl overflow-hidden border border-gray-800 bg-gray-900 group">
                  <img
                    src={coverImage}
                    alt="Cover banner"
                    className="w-full h-full object-cover transition group-hover:opacity-90"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setPhotoCropMode('cover');
                        setPhotoCropOpen(true);
                      }}
                      className="px-4 py-2 rounded-xl bg-white/20 backdrop-blur-md hover:bg-white/30 text-white text-xs font-bold flex items-center gap-2 border border-white/20"
                    >
                      <Camera className="w-4 h-4" />
                      <span>Adjust & Crop Cover</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Avatar Preview */}
              <div className="space-y-2 pt-2">
                <label className="block text-xs font-medium text-gray-300">Profile Photo (Avatar)</label>
                <div className="flex items-center gap-5">
                  <div className="relative">
                    <img
                      src={avatar}
                      alt="Avatar"
                      className="w-24 h-24 rounded-full object-cover border-4 border-indigo-500/50 shadow-xl"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setPhotoCropMode('avatar');
                        setPhotoCropOpen(true);
                      }}
                      className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-[#6366F1] hover:bg-[#4F46E5] text-white flex items-center justify-center shadow-lg transition active:scale-95"
                      title="Edit photo"
                    >
                      <Camera className="w-4 h-4" />
                    </button>
                  </div>
                  <div>
                    <button
                      type="button"
                      onClick={() => {
                        setPhotoCropMode('avatar');
                        setPhotoCropOpen(true);
                      }}
                      className="px-4 py-2 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 text-xs font-bold flex items-center gap-2 border border-indigo-500/30 transition mb-1.5"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload & Crop Photo</span>
                    </button>
                    <p className="text-[11px] text-gray-400">
                      Supports JPG, PNG, WebP up to 10MB • Live circular preview
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Roles & Specialties (Unlimited Custom Roles) */}
          {activeTab === 'roles' && (
            <div className="bg-[#13192B] border border-[#1F293D] rounded-2xl p-5 sm:p-6 shadow-lg space-y-6">
              <div>
                <h2 className="text-base font-bold text-white mb-1">Custom Roles & Specializations</h2>
                <p className="text-xs text-gray-400">
                  Select or type any custom role that fits your background. Choose your primary role for top-level display.
                </p>
              </div>

              {/* Active Roles List */}
              <div className="space-y-2.5">
                <label className="block text-xs font-medium text-gray-300">Your Current Roles</label>
                <div className="space-y-2">
                  {customRoles.map((role) => (
                    <div
                      key={role.id}
                      className="flex items-center justify-between p-3 rounded-xl bg-[#0B0F19] border border-gray-800"
                    >
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => handleSetPrimaryRole(role.id)}
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-xs transition ${
                            role.isPrimary
                              ? 'bg-amber-500 text-black font-bold'
                              : 'bg-gray-800 text-gray-400 hover:text-white'
                          }`}
                          title={role.isPrimary ? 'Primary Role' : 'Click to make Primary'}
                        >
                          ★
                        </button>
                        {role.photo && (
                          <img
                            src={role.photo}
                            alt={role.name}
                            className="w-8 h-8 rounded-lg object-cover border border-purple-500/40"
                          />
                        )}
                        <div>
                          <span className="font-bold text-white text-sm">{role.name}</span>
                          {role.isPrimary && (
                            <span className="ml-2 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                              Primary Role
                            </span>
                          )}
                          <span className="ml-2 text-[10px] text-gray-500">{role.category}</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveRole(role.id)}
                        className="w-7 h-7 rounded-lg text-gray-400 hover:text-rose-400 hover:bg-rose-500/10 flex items-center justify-center transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Add Custom Role Input */}
              <div className="p-4 rounded-xl bg-[#0B0F19] border border-dashed border-gray-800 space-y-3">
                <span className="text-xs font-bold text-white block">Add Any Custom Role</span>
                <div className="flex flex-col sm:flex-row gap-2.5">
                  <input
                    type="text"
                    value={newRoleInput}
                    onChange={(e) => setNewRoleInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddRole())}
                    placeholder="Type any role (e.g. AI Builder, Solo Hacker, Climate Founder...)"
                    className="flex-1 px-3.5 py-2.5 bg-[#13192B] border border-gray-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                  <select
                    value={newRoleCategory}
                    onChange={(e) => setNewRoleCategory(e.target.value as any)}
                    className="px-3 py-2 bg-[#13192B] border border-gray-800 rounded-xl text-xs text-white focus:outline-none"
                  >
                    <option value="Founder">Founder</option>
                    <option value="Professional">Professional</option>
                    <option value="Creative">Creative</option>
                    <option value="Academic">Academic</option>
                    <option value="Community">Community</option>
                    <option value="Custom">Custom</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => handleAddRole()}
                    className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Role</span>
                  </button>
                </div>

                {/* Optional Custom Role Photo Upload from PC */}
                <div className="pt-1">
                  <SinglePhotoUpload
                    label="Optional Role Photo or Work Sample (Upload from PC/Mobile)"
                    currentUrl={newRolePhoto}
                    onUploaded={(url) => setNewRolePhoto(url)}
                    aspect="square"
                    sublabel="Attach a badge, avatar, or proof for this role from your computer files."
                  />
                </div>

                {/* Suggestions Pills */}
                <div>
                  <span className="text-[10px] text-gray-500 block mb-1.5">Suggested Roles:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {suggestedRoles.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => handleAddRole(s)}
                        className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-[11px] text-gray-300 hover:text-white transition"
                      >
                        + {s}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: Skills & Expertise (Unlimited Skills Library) */}
          {activeTab === 'skills' && (
            <div className="bg-[#13192B] border border-[#1F293D] rounded-2xl p-5 sm:p-6 shadow-lg space-y-6">
              <div>
                <h2 className="text-base font-bold text-white mb-1">Skills & Areas of Expertise</h2>
                <p className="text-xs text-gray-400">
                  Add unlimited technical, founder, design, or leadership skills with self-reported proficiency
                </p>
              </div>

              {/* Current Skills Grid */}
              <div className="space-y-2">
                <label className="block text-xs font-medium text-gray-300">Your Skills ({skillItems.length})</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {skillItems.map((skill) => (
                    <div
                      key={skill.id}
                      className="p-3 rounded-xl bg-[#0B0F19] border border-gray-800 flex items-center justify-between"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-xs truncate">{skill.name}</span>
                          {skill.featured && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-indigo-500/20 text-indigo-300">
                              Top Skill
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 text-[10px] text-gray-400">
                          <span>{skill.proficiency || 'Advanced'}</span>
                          <span>•</span>
                          <span className="truncate">{skill.category}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleToggleFeaturedSkill(skill.id)}
                          className={`p-1.5 rounded-lg text-xs transition ${
                            skill.featured ? 'text-amber-400 bg-amber-400/10' : 'text-gray-500 hover:text-white'
                          }`}
                          title="Feature on top of profile"
                        >
                          <Star className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveSkill(skill.id)}
                          className="p-1.5 rounded-lg text-gray-500 hover:text-rose-400 transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Add Custom Skill Form */}
              <div className="p-4 rounded-xl bg-[#0B0F19] border border-dashed border-gray-800 space-y-3">
                <span className="text-xs font-bold text-white block">Add Any Skill</span>
                <div className="flex flex-col sm:flex-row gap-2.5">
                  <input
                    type="text"
                    value={newSkillInput}
                    onChange={(e) => setNewSkillInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSkill())}
                    placeholder="Type skill name (e.g. Vector DBs, System Design, Due Diligence...)"
                    className="flex-1 px-3.5 py-2.5 bg-[#13192B] border border-gray-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                  <select
                    value={newSkillProficiency}
                    onChange={(e) => setNewSkillProficiency(e.target.value as any)}
                    className="px-3 py-2 bg-[#13192B] border border-gray-800 rounded-xl text-xs text-white focus:outline-none"
                  >
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                    <option value="Expert">Expert</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => handleAddSkill()}
                    className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Skill</span>
                  </button>
                </div>

                {/* Suggestions Chips */}
                <div>
                  <span className="text-[10px] text-gray-500 block mb-1.5">Quick Add Suggestions:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {suggestedSkills.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => handleAddSkill(s)}
                        className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-[11px] text-gray-300 hover:text-white transition"
                      >
                        + {s}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: Experience */}
          {activeTab === 'experience' && (
            <div className="bg-[#13192B] border border-[#1F293D] rounded-2xl p-5 sm:p-6 shadow-lg space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-white mb-1">Work & Startup Experience</h2>
                  <p className="text-xs text-gray-400">
                    Your professional history, startup ventures, and advisory roles
                  </p>
                </div>
                {!showExpForm && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingExpId(null);
                      setShowExpForm(true);
                    }}
                    className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Experience</span>
                  </button>
                )}
              </div>

              {/* Experience Form */}
              {showExpForm && (
                <form
                  onSubmit={handleSaveExp}
                  className="p-5 rounded-2xl bg-[#0B0F19] border border-indigo-500/40 space-y-4 animate-in fade-in"
                >
                  <h3 className="font-bold text-white text-sm">
                    {editingExpId ? 'Edit Experience' : 'Add New Experience'}
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-300 mb-1">Job Title *</label>
                      <input
                        type="text"
                        required
                        value={expTitle}
                        onChange={(e) => setExpTitle(e.target.value)}
                        placeholder="e.g. Founder & CEO, Lead Engineer"
                        className="w-full px-3 py-2 bg-[#13192B] border border-gray-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-300 mb-1">Company / Organization *</label>
                      <input
                        type="text"
                        required
                        value={expCompany}
                        onChange={(e) => setExpCompany(e.target.value)}
                        placeholder="e.g. TechNova Labs"
                        className="w-full px-3 py-2 bg-[#13192B] border border-gray-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-300 mb-1">Employment Type</label>
                      <select
                        value={expEmploymentType}
                        onChange={(e) => setExpEmploymentType(e.target.value)}
                        className="w-full px-3 py-2 bg-[#13192B] border border-gray-800 rounded-xl text-xs text-white focus:outline-none"
                      >
                        <option value="Full-time">Full-time</option>
                        <option value="Part-time">Part-time</option>
                        <option value="Co-founder">Co-founder</option>
                        <option value="Contract">Contract</option>
                        <option value="Freelance">Freelance</option>
                        <option value="Internship">Internship</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-300 mb-1">Workplace Type</label>
                      <select
                        value={expWorkplaceType}
                        onChange={(e) => setExpWorkplaceType(e.target.value as any)}
                        className="w-full px-3 py-2 bg-[#13192B] border border-gray-800 rounded-xl text-xs text-white focus:outline-none"
                      >
                        <option value="Remote">Remote</option>
                        <option value="Hybrid">Hybrid</option>
                        <option value="On-site">On-site</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-300 mb-1">Start Date</label>
                      <input
                        type="text"
                        value={expStartDate}
                        onChange={(e) => setExpStartDate(e.target.value)}
                        placeholder="e.g. Jan 2024"
                        className="w-full px-3 py-2 bg-[#13192B] border border-gray-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-300 mb-1">End Date</label>
                      <input
                        type="text"
                        disabled={expCurrent}
                        value={expCurrent ? 'Present' : expEndDate}
                        onChange={(e) => setExpEndDate(e.target.value)}
                        placeholder="e.g. Present"
                        className="w-full px-3 py-2 bg-[#13192B] border border-gray-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500 disabled:opacity-40"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="currentExp"
                      checked={expCurrent}
                      onChange={(e) => setExpCurrent(e.target.checked)}
                      className="rounded text-indigo-500 focus:ring-0"
                    />
                    <label htmlFor="currentExp" className="text-xs text-gray-300 cursor-pointer">
                      I currently work in this role
                    </label>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-300 mb-1">Company Logo / Workplace Thumbnail</label>
                    <SinglePhotoUpload
                      currentUrl={expLogo}
                      onUploaded={(url) => setExpLogo(url)}
                      onRemove={() => setExpLogo('')}
                      label="Upload Company Logo from Computer"
                      aspect="square"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-300 mb-1">Description & Achievements</label>
                    <textarea
                      rows={3}
                      value={expDescription}
                      onChange={(e) => setExpDescription(e.target.value)}
                      placeholder="Describe what you built, key metrics moved, capital raised, or teams managed..."
                      className="w-full px-3 py-2 bg-[#13192B] border border-gray-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500 resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-300 mb-1">Skills Used (comma-separated)</label>
                    <input
                      type="text"
                      value={expSkillsUsed}
                      onChange={(e) => setExpSkillsUsed(e.target.value)}
                      placeholder="e.g. React, TypeScript, Vector DBs, Fundraising"
                      className="w-full px-3 py-2 bg-[#13192B] border border-gray-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  {/* Work Photos Gallery */}
                  <GalleryPhotoUpload
                    photos={expPhotos}
                    onChange={(newPhotos) => setExpPhotos(newPhotos)}
                    title="Workplace Photos & Deliverables"
                    description="Upload office photos, project screenshots, team presentations, or awards from your computer."
                  />

                  <div>
                    <label className="block text-xs font-medium text-gray-300 mb-1">Record Visibility</label>
                    <select
                      value={expVisibility}
                      onChange={(e) => setExpVisibility(e.target.value as any)}
                      className="w-full px-3 py-2 bg-[#13192B] border border-gray-800 rounded-xl text-xs text-white focus:outline-none"
                    >
                      <option value="public">Public — Anyone can view</option>
                      <option value="members_only">COOK Members Only — Signed-in users</option>
                      <option value="private">Private — Only you can view</option>
                    </select>
                  </div>

                  <div className="flex justify-end gap-2 pt-2 border-t border-gray-800">
                    <button
                      type="button"
                      onClick={() => setShowExpForm(false)}
                      className="px-3 py-1.5 rounded-xl text-xs text-gray-400 hover:text-white"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold"
                    >
                      Save Experience
                    </button>
                  </div>
                </form>
              )}

              {/* Experience Items List */}
              <div className="space-y-3">
                {experiences.map((exp) => (
                  <div
                    key={exp.id}
                    className="p-4 rounded-xl bg-[#0B0F19] border border-gray-800 flex items-start justify-between gap-3"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-white text-sm">{exp.title}</h4>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-gray-300">
                          {exp.employmentType}
                        </span>
                      </div>
                      <p className="text-xs text-indigo-400 mt-0.5">
                        {exp.company} • <span className="text-gray-400">{exp.workplaceType}</span>
                      </p>
                      <p className="text-[11px] text-gray-500 mt-0.5">
                        {exp.startDate} - {exp.endDate || (exp.current ? 'Present' : '')}
                      </p>
                      {exp.description && (
                        <p className="text-xs text-gray-300 mt-2 leading-relaxed">{exp.description}</p>
                      )}
                      {exp.skillsUsed && exp.skillsUsed.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {exp.skillsUsed.map((s) => (
                            <span key={s} className="text-[10px] text-indigo-300 bg-indigo-500/10 px-2 py-0.5 rounded">
                              {s}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => handleEditExp(exp)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteExp(exp.id)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-rose-400 hover:bg-rose-500/10 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 6: Education & Learning (Unlimited Education Types) */}
          {activeTab === 'education' && (
            <div className="bg-[#13192B] border border-[#1F293D] rounded-2xl p-5 sm:p-6 shadow-lg space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-white mb-1">Education & Learning</h2>
                  <p className="text-xs text-gray-400">
                    Degrees, bootcamps, online accelerators, and self-directed research
                  </p>
                </div>
                {!showEduForm && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingEduId(null);
                      setShowEduForm(true);
                    }}
                    className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Education</span>
                  </button>
                )}
              </div>

              {/* Education Form */}
              {showEduForm && (
                <form
                  onSubmit={handleSaveEdu}
                  className="p-5 rounded-2xl bg-[#0B0F19] border border-indigo-500/40 space-y-4 animate-in fade-in"
                >
                  <h3 className="font-bold text-white text-sm">
                    {editingEduId ? 'Edit Education' : 'Add New Education'}
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-300 mb-1">School / Institution *</label>
                      <input
                        type="text"
                        required
                        value={eduInstitution}
                        onChange={(e) => setEduInstitution(e.target.value)}
                        placeholder="e.g. Stanford University or Y Combinator Startup School"
                        className="w-full px-3 py-2 bg-[#13192B] border border-gray-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-300 mb-1">Education / Learning Type</label>
                      <input
                        type="text"
                        value={eduQualificationType}
                        onChange={(e) => setEduQualificationType(e.target.value)}
                        placeholder="Undergraduate, Bootcamp, Online Course, Self-Learning..."
                        className="w-full px-3 py-2 bg-[#13192B] border border-gray-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-300 mb-1">Degree / Certificate</label>
                      <input
                        type="text"
                        value={eduDegree}
                        onChange={(e) => setEduDegree(e.target.value)}
                        placeholder="e.g. Bachelor of Science (B.S.)"
                        className="w-full px-3 py-2 bg-[#13192B] border border-gray-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-300 mb-1">Field of Study</label>
                      <input
                        type="text"
                        value={eduFieldOfStudy}
                        onChange={(e) => setEduFieldOfStudy(e.target.value)}
                        placeholder="e.g. Computer Science, AI Track"
                        className="w-full px-3 py-2 bg-[#13192B] border border-gray-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-300 mb-1">Start Date</label>
                      <input
                        type="text"
                        value={eduStartDate}
                        onChange={(e) => setEduStartDate(e.target.value)}
                        placeholder="e.g. 2016"
                        className="w-full px-3 py-2 bg-[#13192B] border border-gray-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-300 mb-1">End Date</label>
                      <input
                        type="text"
                        disabled={eduCurrentlyStudying}
                        value={eduCurrentlyStudying ? 'Present' : eduEndDate}
                        onChange={(e) => setEduEndDate(e.target.value)}
                        placeholder="e.g. 2020"
                        className="w-full px-3 py-2 bg-[#13192B] border border-gray-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500 disabled:opacity-40"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-300 mb-1">Grade / GPA (Optional)</label>
                      <input
                        type="text"
                        value={eduGrade}
                        onChange={(e) => setEduGrade(e.target.value)}
                        placeholder="e.g. 3.9 GPA"
                        className="w-full px-3 py-2 bg-[#13192B] border border-gray-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="currentEdu"
                      checked={eduCurrentlyStudying}
                      onChange={(e) => setEduCurrentlyStudying(e.target.checked)}
                      className="rounded text-indigo-500 focus:ring-0"
                    />
                    <label htmlFor="currentEdu" className="text-xs text-gray-300 cursor-pointer">
                      I am currently studying / pursuing this
                    </label>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-300 mb-1">Institution Logo</label>
                    <SinglePhotoUpload
                      currentUrl={eduLogo}
                      onUploaded={(url) => setEduLogo(url)}
                      onRemove={() => setEduLogo('')}
                      label="Upload Institution Logo from Computer"
                      aspect="square"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-300 mb-1">Activities & Description</label>
                    <textarea
                      rows={2}
                      value={eduDescription}
                      onChange={(e) => setEduDescription(e.target.value)}
                      placeholder="Key coursework, honors, leadership, societies, or research projects..."
                      className="w-full px-3 py-2 bg-[#13192B] border border-gray-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500 resize-none"
                    />
                  </div>

                  {/* Education Photos Gallery */}
                  <GalleryPhotoUpload
                    photos={eduPhotos}
                    onChange={(newPhotos) => setEduPhotos(newPhotos)}
                    title="Campus & Academic Photos / Certificates"
                    description="Upload graduation photos, campus moments, certificates, or hackathon awards from your computer."
                  />

                  <div>
                    <label className="block text-xs font-medium text-gray-300 mb-1">Record Visibility</label>
                    <select
                      value={eduVisibility}
                      onChange={(e) => setEduVisibility(e.target.value as any)}
                      className="w-full px-3 py-2 bg-[#13192B] border border-gray-800 rounded-xl text-xs text-white focus:outline-none"
                    >
                      <option value="public">Public — Anyone can view</option>
                      <option value="members_only">COOK Members Only — Signed-in users</option>
                      <option value="private">Private — Only you can view</option>
                    </select>
                  </div>

                  <div className="flex justify-end gap-2 pt-2 border-t border-gray-800">
                    <button
                      type="button"
                      onClick={() => setShowEduForm(false)}
                      className="px-3 py-1.5 rounded-xl text-xs text-gray-400 hover:text-white"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold"
                    >
                      Save Education
                    </button>
                  </div>
                </form>
              )}

              {/* Education List */}
              <div className="space-y-3">
                {educations.map((edu) => (
                  <div
                    key={edu.id}
                    className="p-4 rounded-xl bg-[#0B0F19] border border-gray-800 flex items-start justify-between gap-3"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-white text-sm">{edu.institution}</h4>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-gray-300">
                          {edu.qualificationType}
                        </span>
                      </div>
                      <p className="text-xs text-indigo-400 mt-0.5">
                        {edu.degree} {edu.fieldOfStudy ? `• ${edu.fieldOfStudy}` : ''}
                      </p>
                      <p className="text-[11px] text-gray-500 mt-0.5">
                        {edu.startDate} - {edu.endDate || (edu.currentlyStudying ? 'Present' : '')}
                        {edu.grade ? ` • ${edu.grade}` : ''}
                      </p>
                      {edu.description && (
                        <p className="text-xs text-gray-300 mt-2 leading-relaxed">{edu.description}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => handleEditEdu(edu)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteEdu(edu.id)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-rose-400 hover:bg-rose-500/10 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 7: Projects & Portfolio */}
          {activeTab === 'projects' && (
            <div className="bg-[#13192B] border border-[#1F293D] rounded-2xl p-5 sm:p-6 shadow-lg space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-white mb-1">Projects & Portfolio</h2>
                  <p className="text-xs text-gray-400">Showcase products, apps, research, or side ventures</p>
                </div>
                {!showProjForm && (
                  <button
                    type="button"
                    onClick={() => setShowProjForm(true)}
                    className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Project</span>
                  </button>
                )}
              </div>

              {/* Add Project Form */}
              {showProjForm && (
                <div className="p-4 rounded-xl bg-[#0B0F19] border border-indigo-500/40 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="text"
                      value={projTitle}
                      onChange={(e) => setProjTitle(e.target.value)}
                      placeholder="Project Title *"
                      className="px-3 py-2 bg-[#13192B] border border-gray-800 rounded-xl text-xs text-white"
                    />
                    <input
                      type="text"
                      value={projRole}
                      onChange={(e) => setProjRole(e.target.value)}
                      placeholder="Your Role (e.g. Lead Builder)"
                      className="px-3 py-2 bg-[#13192B] border border-gray-800 rounded-xl text-xs text-white"
                    />
                  </div>
                  <input
                    type="text"
                    value={projLink}
                    onChange={(e) => setProjLink(e.target.value)}
                    placeholder="Project URL (e.g. https://github.com/...)"
                    className="w-full px-3 py-2 bg-[#13192B] border border-gray-800 rounded-xl text-xs text-white"
                  />
                  <textarea
                    rows={2}
                    value={projDesc}
                    onChange={(e) => setProjDesc(e.target.value)}
                    placeholder="Short description of the problem solved..."
                    className="w-full px-3 py-2 bg-[#13192B] border border-gray-800 rounded-xl text-xs text-white resize-none"
                  />
                  <input
                    type="text"
                    value={projTags}
                    onChange={(e) => setProjTags(e.target.value)}
                    placeholder="Tags (e.g. React, Python, AI)"
                    className="w-full px-3 py-2 bg-[#13192B] border border-gray-800 rounded-xl text-xs text-white"
                  />
                  <div>
                    <label className="block text-xs font-medium text-gray-300 mb-1">Project Cover Photo</label>
                    <SinglePhotoUpload
                      currentUrl={projImage}
                      onUploaded={(url) => setProjImage(url)}
                      onRemove={() => setProjImage('')}
                      label="Choose Project Cover Photo from Computer"
                      aspect="cover"
                    />
                  </div>

                  <GalleryPhotoUpload
                    photos={projGallery}
                    onChange={(newGallery) => setProjGallery(newGallery)}
                    title="Project Screenshots & Gallery"
                    description="Upload UI mockups, architectural diagrams, or demo screenshots."
                  />

                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowProjForm(false)}
                      className="px-3 py-1.5 text-xs text-gray-400 hover:text-white"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (!projTitle.trim()) return;
                        setProjects([
                          ...projects,
                          {
                            id: `proj-${Date.now()}`,
                            title: projTitle,
                            role: projRole || 'Builder',
                            link: projLink,
                            description: projDesc,
                            imageUrl: projImage,
                            gallery: projGallery,
                            tags: projTags.split(',').map((t) => t.trim()).filter(Boolean),
                          },
                        ]);
                        setShowProjForm(false);
                        setProjTitle('');
                        setProjRole('');
                        setProjLink('');
                        setProjDesc('');
                        setProjTags('');
                        setProjImage('');
                        setProjGallery([]);
                      }}
                      className="px-4 py-1.5 rounded-xl bg-indigo-600 text-white text-xs font-bold"
                    >
                      Add Project
                    </button>
                  </div>
                </div>
              )}

              {/* Projects List */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {projects.map((proj) => (
                  <div
                    key={proj.id}
                    className="p-4 rounded-xl bg-[#0B0F19] border border-gray-800 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-white text-sm">{proj.title}</h4>
                        <button
                          type="button"
                          onClick={() => setProjects(projects.filter((p) => p.id !== proj.id))}
                          className="text-gray-500 hover:text-rose-400"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <span className="text-[10px] text-indigo-400 block mt-0.5">{proj.role}</span>
                      <p className="text-xs text-gray-300 mt-2 line-clamp-2">{proj.description}</p>
                    </div>
                    {proj.link && (
                      <a
                        href={proj.link}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-400 hover:text-indigo-300 mt-3"
                      >
                        <span>Visit Project</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 8: Certifications */}
          {activeTab === 'certifications' && (
            <div className="bg-[#13192B] border border-[#1F293D] rounded-2xl p-5 sm:p-6 shadow-lg space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-white mb-1">Licenses & Certifications</h2>
                  <p className="text-xs text-gray-400">Cloud credentials, developer accreditations, and degrees</p>
                </div>
                {!showCertForm && (
                  <button
                    type="button"
                    onClick={() => setShowCertForm(true)}
                    className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Certification</span>
                  </button>
                )}
              </div>

              {/* Add Cert Form */}
              {showCertForm && (
                <div className="p-4 rounded-xl bg-[#0B0F19] border border-indigo-500/40 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="text"
                      value={certName}
                      onChange={(e) => setCertName(e.target.value)}
                      placeholder="Certification Name *"
                      className="px-3 py-2 bg-[#13192B] border border-gray-800 rounded-xl text-xs text-white"
                    />
                    <input
                      type="text"
                      value={certOrg}
                      onChange={(e) => setCertOrg(e.target.value)}
                      placeholder="Issuing Organization *"
                      className="px-3 py-2 bg-[#13192B] border border-gray-800 rounded-xl text-xs text-white"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="text"
                      value={certDate}
                      onChange={(e) => setCertDate(e.target.value)}
                      placeholder="Issue Date (e.g. Oct 2023)"
                      className="px-3 py-2 bg-[#13192B] border border-gray-800 rounded-xl text-xs text-white"
                    />
                    <input
                      type="text"
                      value={certId}
                      onChange={(e) => setCertId(e.target.value)}
                      placeholder="Credential ID (Optional)"
                      className="px-3 py-2 bg-[#13192B] border border-gray-800 rounded-xl text-xs text-white"
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowCertForm(false)}
                      className="px-3 py-1.5 text-xs text-gray-400 hover:text-white"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (!certName.trim()) return;
                        setCertifications([
                          ...certifications,
                          {
                            id: `cert-${Date.now()}`,
                            name: certName,
                            issuingOrg: certOrg,
                            issueDate: certDate,
                            credentialId: certId,
                          },
                        ]);
                        setShowCertForm(false);
                        setCertName('');
                        setCertOrg('');
                        setCertDate('');
                        setCertId('');
                      }}
                      className="px-4 py-1.5 rounded-xl bg-indigo-600 text-white text-xs font-bold"
                    >
                      Add
                    </button>
                  </div>
                </div>
              )}

              {/* Certs List */}
              <div className="space-y-2.5">
                {certifications.map((cert) => (
                  <div
                    key={cert.id}
                    className="p-3.5 rounded-xl bg-[#0B0F19] border border-gray-800 flex items-center justify-between"
                  >
                    <div>
                      <h4 className="font-bold text-white text-xs">{cert.name}</h4>
                      <p className="text-[11px] text-indigo-400 mt-0.5">
                        {cert.issuingOrg} • <span className="text-gray-500">Issued {cert.issueDate}</span>
                      </p>
                      {cert.credentialId && (
                        <span className="text-[10px] text-gray-500 block font-mono">ID: {cert.credentialId}</span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => setCertifications(certifications.filter((c) => c.id !== cert.id))}
                      className="p-1.5 text-gray-500 hover:text-rose-400 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 9: Social Media & Links */}
          {activeTab === 'social' && (
            <div className="bg-[#13192B] border border-[#1F293D] rounded-2xl p-5 sm:p-6 shadow-lg space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-[#1F293D]">
                <div>
                  <h2 className="text-base font-bold text-white mb-0.5">Social Media & Public Profiles</h2>
                  <p className="text-xs text-gray-400">
                    Connect your professional and creative profiles. Displayed in the "Connect With Me" panel.
                  </p>
                </div>
                {onViewPublicProfile && (
                  <button
                    type="button"
                    onClick={onViewPublicProfile}
                    className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-indigo-300 hover:text-white flex items-center gap-1.5 self-start sm:self-auto transition"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Preview Profile</span>
                  </button>
                )}
              </div>

              {/* Add New Social Link Form */}
              <div className="p-4 rounded-2xl bg-[#0B0F19] border border-indigo-500/30 space-y-3.5">
                <span className="text-xs font-bold text-white block">Add a Social Profile or Link</span>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-gray-300 mb-1">Platform</label>
                    <select
                      value={newSocialPlatform}
                      onChange={(e) => setNewSocialPlatform(e.target.value as SocialPlatform)}
                      className="w-full px-3 py-2 bg-[#13192B] border border-gray-700 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                    >
                      <option value="linkedin">LinkedIn</option>
                      <option value="github">GitHub</option>
                      <option value="twitter">X (Twitter)</option>
                      <option value="instagram">Instagram</option>
                      <option value="facebook">Facebook</option>
                      <option value="youtube">YouTube</option>
                      <option value="behance">Behance</option>
                      <option value="dribbble">Dribbble</option>
                      <option value="medium">Medium</option>
                      <option value="website">Personal Website / Portfolio</option>
                      <option value="other">Other Platform</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-gray-300 mb-1">
                      Custom Name (Optional)
                    </label>
                    <input
                      type="text"
                      value={newSocialCustomName}
                      onChange={(e) => setNewSocialCustomName(e.target.value)}
                      placeholder="e.g. My Substack, Dribbble Shot"
                      className="w-full px-3 py-2 bg-[#13192B] border border-gray-700 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-gray-300 mb-1">Visibility</label>
                    <select
                      value={newSocialVisibility}
                      onChange={(e) => setNewSocialVisibility(e.target.value as VisibilityLevel)}
                      className="w-full px-3 py-2 bg-[#13192B] border border-gray-700 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                    >
                      <option value="public">Public (Everyone)</option>
                      <option value="members_only">COOK Members Only</option>
                      <option value="private">Private (Only You)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-gray-300 mb-1">Profile URL *</label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={newSocialUrl}
                      onChange={(e) => {
                        const val = e.target.value;
                        setNewSocialUrl(val);
                        // Auto-detect platform from URL
                        const detected = detectPlatformFromUrl(val);
                        if (detected !== 'other') {
                          setNewSocialPlatform(detected);
                        }
                      }}
                      placeholder="https://linkedin.com/in/username or https://instagram.com/username"
                      className="flex-1 px-3.5 py-2 bg-[#13192B] border border-gray-700 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                    />
                    <button
                      type="button"
                      onClick={handleAddSocialLink}
                      disabled={!newSocialUrl.trim()}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-[#6366F1] hover:from-indigo-500 hover:to-indigo-400 text-white text-xs font-bold transition disabled:opacity-40 whitespace-nowrap active:scale-95 cursor-pointer"
                    >
                      Add Link
                    </button>
                  </div>
                  <span className="text-[10px] text-gray-500 mt-1 block">
                    Supported: LinkedIn, Instagram, Facebook, X, YouTube, GitHub, Behance, Dribbble, Medium, Portfolios.
                  </span>
                </div>
              </div>

              {/* Current Connected Links List */}
              <div className="space-y-2.5">
                <span className="text-xs font-bold text-gray-300 block">
                  Connected Links ({socialLinkItems.length})
                </span>

                {socialLinkItems.length > 0 ? (
                  socialLinkItems.map((item, idx) => (
                    <div
                      key={item.id}
                      className="p-3.5 rounded-xl bg-[#0B0F19] border border-gray-800 flex items-center justify-between gap-3 group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-xs font-bold text-gray-500 w-4">{idx + 1}.</span>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-white capitalize">{item.platformName || item.platform}</span>
                            <span className={`text-[9px] font-semibold px-2 py-0.5 rounded-full ${
                              item.visibility === 'public'
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : item.visibility === 'members_only'
                                ? 'bg-indigo-500/10 text-indigo-300 border border-indigo-500/20'
                                : 'bg-gray-800 text-gray-400'
                            }`}>
                              {item.visibility || 'public'}
                            </span>
                          </div>
                          <a
                            href={item.url.startsWith('http') ? item.url : `https://${item.url}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[11px] text-indigo-400 hover:underline truncate block max-w-sm mt-0.5"
                          >
                            {item.url}
                          </a>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {idx > 0 && (
                          <button
                            type="button"
                            onClick={() => handleMoveSocialLink(idx, 'up')}
                            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white text-[10px]"
                            title="Move up"
                          >
                            ↑
                          </button>
                        )}
                        {idx < socialLinkItems.length - 1 && (
                          <button
                            type="button"
                            onClick={() => handleMoveSocialLink(idx, 'down')}
                            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white text-[10px]"
                            title="Move down"
                          >
                            ↓
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleRemoveSocialLink(item.id)}
                          className="p-1.5 rounded-lg text-gray-500 hover:text-rose-400 transition"
                          title="Remove social link"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6 border border-dashed border-gray-800 rounded-xl text-xs text-gray-500">
                    No social media links connected yet. Add your LinkedIn, GitHub, X, or portfolio above.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 10: Privacy Settings */}
          {activeTab === 'privacy' && (
            <div className="bg-[#13192B] border border-[#1F293D] rounded-2xl p-5 sm:p-6 shadow-lg space-y-5">
              <div>
                <h2 className="text-base font-bold text-white mb-1">Privacy & Visibility Settings</h2>
                <p className="text-xs text-gray-400">Control who can discover and view your profile sections</p>
              </div>

              <div className="space-y-4">
                <div className="p-3.5 rounded-xl bg-[#0B0F19] border border-gray-800 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-white text-xs block">Profile Discoverability</span>
                    <span className="text-[11px] text-gray-400">Make profile indexable and visible publicly</span>
                  </div>
                  <select
                    value={privacySettings.profileVisibility}
                    onChange={(e) =>
                      setPrivacySettings({ ...privacySettings, profileVisibility: e.target.value as any })
                    }
                    className="px-3 py-1.5 bg-[#13192B] border border-gray-700 rounded-xl text-xs text-white focus:outline-none"
                  >
                    <option value="public">Public to Everyone</option>
                    <option value="members_only">COOK Members Only</option>
                    <option value="private">Private</option>
                  </select>
                </div>

                <div className="p-3.5 rounded-xl bg-[#0B0F19] border border-gray-800 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-white text-xs block">Show Education Grades & GPA</span>
                    <span className="text-[11px] text-gray-400">Display GPA or grades on education cards</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={privacySettings.showEducationGrades}
                    onChange={(e) =>
                      setPrivacySettings({ ...privacySettings, showEducationGrades: e.target.checked })
                    }
                    className="rounded text-indigo-500 focus:ring-0"
                  />
                </div>

                <div className="p-3.5 rounded-xl bg-[#0B0F19] border border-gray-800 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-white text-xs block">Allow Direct Messaging</span>
                    <span className="text-[11px] text-gray-400">Let other founders and investors message you</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={privacySettings.allowDirectMessages}
                    onChange={(e) =>
                      setPrivacySettings({ ...privacySettings, allowDirectMessages: e.target.checked })
                    }
                    className="rounded text-indigo-500 focus:ring-0"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
