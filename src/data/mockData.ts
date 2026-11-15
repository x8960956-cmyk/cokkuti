import { Community, Opportunity, LearningResource, StartupEvent, User } from '../types';

export const currentUser: User = {
  id: 'guest',
  name: 'COOK Member',
  firstName: 'COOK',
  lastName: 'Member',
  username: 'cook_member',
  avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80',
  coverImage: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1600&auto=format&fit=crop&q=80',
  role: 'Founder',
  primaryRole: 'Founder',
  title: '',
  headline: '',
  bio: '',
  location: '',
  website: '',
  verified: false,
  postsCount: 0,
  followersCount: 0,
  followingCount: 0,
  connectionsCount: 0,
  skills: [],
  interests: [],
  startupStage: 'Idea',
  lookingForCoFounder: false,
  profileCompletionPercentage: 0,
  customRoles: [],
  skillItems: [],
  experience: [],
  education: [],
  projects: [],
  certifications: [],
  languages: ['English'],
  socialLinks: {},
  privacySettings: {
    profileVisibility: 'public',
    showEmail: false,
    showEducationGrades: true,
    showFundingRequests: true,
    allowDirectMessages: true,
  },
};

export const communitiesData: Community[] = [];
export const opportunitiesData: Opportunity[] = [];
export const investorsData: any[] = [];
export const eventsData: StartupEvent[] = [];
export const trendingTopics: { tag: string; count: string }[] = [];
export const recentActivity: any[] = [];

export const learningResourcesData: LearningResource[] = [
  {
    id: 'learn-1',
    title: 'The Mom Test: How to Validate Startup Ideas Without Getting Lied To',
    category: 'Validation',
    type: 'Guide',
    duration: '15 min read',
    readTime: '15 min',
    author: 'Rob Fitzpatrick (Study Notes)',
    authorRole: 'Customer Discovery Framework',
    rating: 4.9,
    summary: 'Framework for talking to customers: uncover real buying behavior and past struggles instead of asking hypothetical questions.',
    content: `### Core Rules of Customer Discovery:
1. **Talk about their life and past behavior, not your idea.**
Ask: "When was the last time you struggled with X? What did you do to solve it?"
2. **Talk about specifics in the past instead of generics or promises for the future.**
3. **Listen more than you talk.** If you are speaking more than 20% of the interview, you are pitching, not learning.
4. **Watch for empty compliments.** Look for commitments of time, reputation, or budget.`,
  },
  {
    id: 'learn-2',
    title: 'Seed Pitch Deck Structure: 10 Essential Slides',
    category: 'Fundraising',
    type: 'Playbook',
    duration: '20 min read',
    readTime: '20 min',
    author: 'COOK Venture Guide',
    authorRole: 'Fundraising Reference',
    rating: 4.9,
    summary: 'Slide-by-slide sequence used by early-stage founders to communicate problem, traction, market sizing, and capital use clearly.',
    content: `### The 10-Slide Structure:
1. **Title Slide:** Company name and clear 1-line value proposition.
2. **Problem:** A measurable pain costing customers time or money.
3. **Solution / Product Demo:** Real screenshots or working demo clip.
4. **Market Opportunity:** Bottom-up TAM/SAM calculation.
5. **Business Model & Unit Economics:** Pricing and gross margins.
6. **Traction & Milestones:** Active users, retention, or revenue growth.
7. **Competition & Moat:** Why your approach compounds over time.
8. **Go-To-Market:** Repeatable distribution channels.
9. **Team:** Domain expertise and execution speed.
10. **The Ask:** Target raise, runway, and milestones.`,
  },
  {
    id: 'learn-3',
    title: 'Cap Table Basics: SAFEs, Vesting & Founder Splits',
    category: 'Legal',
    type: 'Template',
    duration: '18 min read',
    readTime: '18 min',
    author: 'COOK Founder Reference',
    authorRole: 'Startup Governance',
    rating: 4.8,
    summary: 'Understand post-money valuation caps, dilution math, 4-year vesting with a 1-year cliff, and founder equity mechanics.',
    content: `### Key Principles:
- Enforce **4-year vesting with a 1-year cliff** for all co-founders.
- Model post-money SAFE dilution across multiple rounds before signing.
- Keep your cap table clean and documented from day one.`,
  },
  {
    id: 'learn-4',
    title: 'Product-Led Growth Loops for Early-Stage SaaS',
    category: 'Growth',
    type: 'Guide',
    duration: '12 min read',
    readTime: '12 min',
    author: 'COOK Growth Architecture',
    authorRole: 'Product Strategy',
    rating: 4.7,
    summary: 'Design inherent collaboration and sharing loops inside your product so active teams naturally invite new users.',
    content: `### Designing Product Loops:
1. **Inherent Collaboration:** Make inviting teammates part of completing the core workflow.
2. **Shareable Outputs:** Allow users to publish clean public views of their work.
3. **Fast Time-to-Value:** Reduce onboarding friction so new signups reach value in minutes.`,
  },
];
