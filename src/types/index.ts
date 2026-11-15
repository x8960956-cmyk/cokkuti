export type UserRole =
  | 'Founder'
  | 'Aspiring entrepreneur'
  | 'Investor'
  | 'Co-founder seeker'
  | 'Developer'
  | 'Designer'
  | 'Mentor'
  | 'Student'
  | 'Startup enthusiast'
  | string;

export type VisibilityLevel = 'public' | 'members_only' | 'private';

export interface RecordPhoto {
  id: string;
  url: string;
  caption?: string;
  visibility?: VisibilityLevel;
}

export type SocialPlatform =
  | 'linkedin'
  | 'instagram'
  | 'facebook'
  | 'twitter'
  | 'youtube'
  | 'github'
  | 'behance'
  | 'dribbble'
  | 'medium'
  | 'website'
  | 'other';

export interface SocialLinkItem {
  id: string;
  platform: SocialPlatform;
  platformName?: string;
  url: string;
  visibility?: VisibilityLevel;
  displayOrder?: number;
}

export interface CustomRole {
  id: string;
  name: string;
  isPrimary?: boolean;
  category?: 'Professional' | 'Founder' | 'Creative' | 'Academic' | 'Community' | 'Custom';
  description?: string;
  skills?: string[];
  photo?: string;
}

export interface SkillItem {
  id: string;
  name: string;
  category?: string;
  proficiency?: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
  endorsementsCount?: number;
  featured?: boolean;
}

export interface ExperienceItem {
  id: string;
  title: string;
  company: string;
  companyLogo?: string;
  employmentType: 'Full-time' | 'Part-time' | 'Contract' | 'Co-founder' | 'Freelance' | 'Internship' | string;
  workplaceType: 'Remote' | 'Hybrid' | 'On-site';
  location?: string;
  startDate: string;
  endDate?: string;
  current: boolean;
  description: string;
  achievements?: string[];
  skillsUsed?: string[];
  photos?: RecordPhoto[];
  visibility?: VisibilityLevel;
}

export interface EducationItem {
  id: string;
  institution: string;
  institutionLogo?: string;
  institutionType?: string;
  qualificationType: string;
  degree: string;
  fieldOfStudy: string;
  startDate: string;
  endDate?: string;
  currentlyStudying: boolean;
  grade?: string;
  description?: string;
  activities?: string;
  skillsLearned?: string[];
  certificateUrl?: string;
  website?: string;
  photos?: RecordPhoto[];
  visibility?: VisibilityLevel;
}

export interface ProjectItem {
  id: string;
  title: string;
  description: string;
  role: string;
  link?: string;
  sourceUrl?: string;
  image?: string;
  imageUrl?: string;
  photos?: RecordPhoto[];
  gallery?: RecordPhoto[];
  tags?: string[];
  date?: string;
  completionDate?: string;
  visibility?: VisibilityLevel;
}

export interface CertificationItem {
  id: string;
  name: string;
  issuingOrg: string;
  issueDate: string;
  expirationDate?: string;
  credentialId?: string;
  credentialUrl?: string;
  logo?: string;
}

export interface ProfilePrivacySettings {
  profileVisibility: 'public' | 'members_only' | 'private';
  showEmail: boolean;
  showEducationGrades: boolean;
  showFundingRequests: boolean;
  allowDirectMessages: boolean;
  chatInitiationPolicy?: 'everyone' | 'connections_only' | 'nobody';
  blockedUserIds?: string[];
}

export interface User {
  id: string;
  name: string;
  firstName?: string;
  lastName?: string;
  username: string;
  email?: string;
  authProvider?: string;
  avatar: string;
  coverImage?: string;
  role: UserRole;
  primaryRole?: string;
  customRoles?: CustomRole[];
  title: string;
  headline?: string;
  bio: string;
  location: string;
  website?: string;
  portfolioWebsite?: string;
  verified: boolean;
  postsCount: number;
  followersCount: number;
  followingCount: number;
  connectionsCount?: number;
  skills: string[];
  skillItems?: SkillItem[];
  interests: string[];
  experience?: ExperienceItem[];
  education?: EducationItem[];
  projects?: ProjectItem[];
  certifications?: CertificationItem[];
  languages?: string[];
  availability?: string;
  yearsOfExperience?: number | string;
  githubUrl?: string;
  collaborationGoals?: string[];
  socialLinks?: {
    github?: string;
    linkedin?: string;
    twitter?: string;
    website?: string;
    youtube?: string;
    instagram?: string;
    facebook?: string;
  };
  socialLinkItems?: SocialLinkItem[];
  privacySettings?: ProfilePrivacySettings;
  profileCompletionPercentage?: number;
  startupStage?: string;
  lookingForCoFounder?: boolean;
  onboardingCompleted?: boolean;
  onboardingStep?: number;
}

export interface Post {
  id: string;
  author: {
    id: string;
    name: string;
    username: string;
    avatar: string;
    role: string;
    verified: boolean;
  };
  type: 'post' | 'idea' | 'pitch' | 'video' | 'poll' | 'update';
  title?: string;
  content: string;
  media?: {
    type: 'image' | 'video';
    url: string;
    aspect?: string;
    caption?: string;
  }[];
  tags: string[];
  likes: number;
  likedByMe?: boolean;
  comments: Comment[];
  reposts: number;
  repostedByMe?: boolean;
  saves: number;
  savedByMe?: boolean;
  sharesCount?: number;
  shareCount: number;
  viewsCount?: number;
  watchCompletions?: number;
  videoDurationSeconds?: number;
  timestamp: string;
  category: string;
  startupDetails?: {
    name: string;
    tagline: string;
    stage: string;
    industry: string;
    fundingGoal?: string;
    equityOffered?: string;
    runway?: string;
    amountRaised?: string;
    teamNeeded?: string[];
  };
  poll?: {
    question: string;
    options: { text: string; votes: number }[];
    totalVotes: number;
    userVote?: number;
  };
}

export interface Comment {
  id: string;
  author: {
    name: string;
    avatar: string;
    role: string;
    verified: boolean;
  };
  content: string;
  timestamp: string;
  likes: number;
}

export interface FundingRequest {
  id: string;
  startupName: string;
  logo: string;
  founderName: string;
  founderAvatar: string;
  tagline: string;
  description: string;
  problem: string;
  solution: string;
  targetAudience: string;
  industry: string;
  stage: 'Idea' | 'Research' | 'Prototype' | 'MVP' | 'Early Traction' | 'Revenue Generating' | 'Growth';
  fundingGoal: number;
  amountRaised: number;
  amountSeeking: number;
  equityOffered: string;
  runwayMonths: number;
  investorTypeSought: string[];
  useOfFunds: string;
  pitchDeckUrl?: string;
  videoPitchUrl?: string;
  traction: string;
  status: 'Seeking Funding' | 'In Discussion' | 'Partially Funded' | 'Funding Completed' | 'Paused';
  verified: boolean;
  interestedCount: number;
  savedCount: number;
  tags: string[];
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  recipientId?: string;
  content: string;
  mediaUrl?: string;
  isVoiceNote?: boolean;
  read?: boolean;
  readAt?: number;
  createdAt?: number;
  timestamp: string;
  isMe: boolean;
}

export interface Community {
  id: string;
  name: string;
  tagline: string;
  category: string;
  icon: string;
  customPhotoUrl?: string;
  bannerUrl?: string;
  memberCount: string;
  joined: boolean;
  moderators: string[];
  rules: string[];
  pinnedPost?: string;
}

export interface StoryComment {
  id: string;
  author: {
    id: string;
    name: string;
    username: string;
    avatar: string;
    verified?: boolean;
  };
  content: string;
  createdAt: string;
}

export interface Story {
  id: string;
  userId: string;
  userName: string;
  userUsername: string;
  userAvatar: string;
  userVerified?: boolean;
  mediaUrl: string;
  mediaType: 'image' | 'video';
  caption?: string;
  createdAt: number;
  expiresAt: number;
  viewers: string[];
  comments: StoryComment[];
}

export interface Opportunity {
  id: string;
  title: string;
  startup: string;
  logo: string;
  type: 'Co-founder' | 'Developer' | 'Designer' | 'Internship' | 'Full-time' | 'Mentor';
  location: string;
  remote: boolean;
  commitment: 'Full-time' | 'Part-time' | 'Contract' | 'Equity-only';
  equityOrCompensation: string;
  skills: string[];
  description: string;
  postedDate: string;
  applied?: boolean;
}

export interface LearningResource {
  id: string;
  title: string;
  category: 'Validation' | 'Product' | 'Fundraising' | 'Growth' | 'Sales' | 'Legal';
  type: 'Guide' | 'Playbook' | 'Template' | 'Video Course';
  duration: string;
  readTime: string;
  summary: string;
  author: string;
  authorRole: string;
  rating: number;
  saved?: boolean;
  content: string;
}

export interface StartupEvent {
  id: string;
  title: string;
  type: 'Pitch Night' | 'Hackathon' | 'Demo Day' | 'Workshop' | 'Mixer';
  date: string;
  time: string;
  location: string;
  isVirtual: boolean;
  organizer: string;
  attendeesCount: number;
  attending?: boolean;
  description: string;
  prizes?: string;
}

export type NotificationType = 'like' | 'comment' | 'funding_interest' | 'follow' | 'mention' | 'system';

export interface NotificationItem {
  id: string;
  recipientId?: string;
  actorId?: string;
  actorName: string;
  actorAvatar: string;
  type: NotificationType;
  title: string;
  message: string;
  targetId?: string;
  targetType?: 'post' | 'funding' | 'profile' | 'messages' | 'moderator';
  read: boolean;
  createdAt: number;
  timestamp: string;
}
