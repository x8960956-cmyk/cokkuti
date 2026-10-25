import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.resolve(__dirname, 'data');
const DB_FILE = path.resolve(DATA_DIR, 'cook_db.json');
const UPLOADS_DIR = path.resolve(__dirname, 'uploads');

// Ensure directories exist
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
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
  expiresAt: number; // 24 hours from createdAt
  viewers: string[];
  comments: StoryComment[];
}

export interface UserSession {
  userId: string;
  createdAt: number;
  expiresAt: number;
}

export interface CookDatabase {
  stories: Story[];
  users: Record<string, any>;
  sessions: Record<string, UserSession>;
  userCredentials: Record<string, { userId: string; passwordHash: string; salt: string }>;
  communities: any[];
}

const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const SESSION_DURATION_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

function hashPassword(password: string, salt: string): string {
  return crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
}

function getDefaultDatabase(): CookDatabase {
  const now = Date.now();

  return {
    stories: [
      {
        id: 'story-sarah-1',
        userId: 'sarah-ahmed',
        userName: 'Sarah Ahmed',
        userUsername: 'sarah.design',
        userAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
        userVerified: true,
        mediaUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&auto=format&fit=crop&q=80',
        mediaType: 'image',
        caption: 'Iterating on the new COOK glassmorphism dashboard tokens! ✨ What do you think?',
        createdAt: now - 3 * 3600 * 1000,
        expiresAt: now - 3 * 3600 * 1000 + ONE_DAY_MS,
        viewers: ['david-kim'],
        comments: [
          {
            id: 'sc-1',
            author: {
              id: 'david-kim',
              name: 'David Kim',
              username: 'davidkim',
              avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
              verified: true,
            },
            content: 'Matches the brand perfectly! Let it cook 🚀',
            createdAt: '1h ago',
          },
        ],
      },
      {
        id: 'story-david-1',
        userId: 'david-kim',
        userName: 'David Kim',
        userUsername: 'davidkim',
        userAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
        userVerified: true,
        mediaUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=1200&auto=format&fit=crop&q=80',
        mediaType: 'image',
        caption: 'Late night coding session: shaving 120ms off our LLM inference pipeline 🔥',
        createdAt: now - 6 * 3600 * 1000,
        expiresAt: now - 6 * 3600 * 1000 + ONE_DAY_MS,
        viewers: [],
        comments: [],
      },
    ],
    // Clean initial state: NO demo user accounts!
    users: {},
    sessions: {},
    userCredentials: {},
    communities: [
      {
        id: 'comm-1',
        name: 'AI & Foundation Models',
        tagline: 'Engineers & researchers training, fine-tuning, and deploying sovereign AI.',
        category: 'Technology',
        icon: 'Bot',
        memberCount: '3.4k members',
        joined: false,
        moderators: ['Elena Rostova', 'Dr. Marcus Vance'],
        rules: ['Share model architecture benchmarks', 'No spam', 'Disclose dataset origins'],
        pinnedPost: 'Monthly research sync: Exploring test-time compute scaling.',
      },
      {
        id: 'comm-2',
        name: 'Pre-Seed Founders Club',
        tagline: 'Zero to One operators sharing term sheets, hiring hacks, and investor memos.',
        category: 'Startups',
        icon: 'Code',
        memberCount: '5.1k members',
        joined: false,
        moderators: ['Sarah Ahmed', 'David Kim'],
        rules: ['Constructive pitch feedback', 'Strict confidentiality on fundraising decks'],
        pinnedPost: 'Seed round benchmark report Q3/Q4 is out now.',
      },
    ],
  };
}

class DatabaseManager {
  private data: CookDatabase;

  constructor() {
    this.data = this.load();
    this.cleanLegacyDemoData();
    this.cleanExpiredStories();
  }

  private load(): CookDatabase {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        if (parsed) {
          if (!parsed.users) parsed.users = {};
          if (!parsed.sessions) parsed.sessions = {};
          if (!parsed.userCredentials) parsed.userCredentials = {};
          if (!Array.isArray(parsed.stories)) parsed.stories = [];
          if (!Array.isArray(parsed.communities)) parsed.communities = [];
          return parsed;
        }
      }
    } catch (err) {
      console.error('Error loading database from disk, using fresh defaults:', err);
    }
    const defaults = getDefaultDatabase();
    this.persistSync(defaults);
    return defaults;
  }

  // Deletes any leftover demo accounts (e.g. Arjun Mehta or 'me' legacy profile)
  private cleanLegacyDemoData() {
    let changed = false;
    if ((this.data as any).userProfile) {
      delete (this.data as any).userProfile;
      changed = true;
    }
    if (this.data.users && this.data.users['me']) {
      delete this.data.users['me'];
      changed = true;
    }
    // Clean out demo comments referring to 'me' or 'arjun_builds'
    if (this.data.stories) {
      this.data.stories.forEach((story) => {
        if (Array.isArray(story.comments)) {
          story.comments = story.comments.filter(
            (c) => c.author?.id !== 'me' && c.author?.id !== 'arjun_builds'
          );
        }
      });
    }
    if (changed) {
      this.save();
    }
  }

  private persistSync(dbState: CookDatabase) {
    try {
      const tempPath = `${DB_FILE}.tmp.${Date.now()}`;
      fs.writeFileSync(tempPath, JSON.stringify(dbState, null, 2), 'utf-8');
      fs.renameSync(tempPath, DB_FILE);
    } catch (err) {
      console.error('Failed to write database atomically:', err);
      try {
        fs.writeFileSync(DB_FILE, JSON.stringify(dbState, null, 2), 'utf-8');
      } catch (inner) {
        console.error('Direct fallback save failed:', inner);
      }
    }
  }

  public save() {
    this.persistSync(this.data);
  }

  // Session & Authentication Management
  public createSession(userId: string): string {
    const token = `cook_sess_${crypto.randomBytes(32).toString('hex')}`;
    const now = Date.now();
    this.data.sessions[token] = {
      userId,
      createdAt: now,
      expiresAt: now + SESSION_DURATION_MS,
    };
    this.save();
    return token;
  }

  public getSession(token: string): UserSession | null {
    if (!token) return null;
    const session = this.data.sessions[token];
    if (!session) return null;
    if (Date.now() > session.expiresAt) {
      delete this.data.sessions[token];
      this.save();
      return null;
    }
    return session;
  }

  public deleteSession(token: string): boolean {
    if (this.data.sessions[token]) {
      delete this.data.sessions[token];
      this.save();
      return true;
    }
    return false;
  }

  public getUser(userId: string): any | null {
    return this.data.users[userId] || null;
  }

  public getUserByEmail(email: string): any | null {
    const cleanEmail = email.toLowerCase().trim();
    return Object.values(this.data.users).find(
      (u) => u.email && u.email.toLowerCase().trim() === cleanEmail
    ) || null;
  }

  public getUserByUsername(username: string): any | null {
    const clean = username.toLowerCase().trim();
    return Object.values(this.data.users).find(
      (u) => u.username && u.username.toLowerCase().trim() === clean
    ) || null;
  }

  public saveUser(user: any): any {
    if (!user.id) {
      user.id = `user_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    }
    this.data.users[user.id] = {
      ...this.data.users[user.id],
      ...user,
      updatedAt: Date.now(),
    };
    this.save();
    return this.data.users[user.id];
  }

  public deleteUser(userId: string): boolean {
    if (this.data.users[userId]) {
      delete this.data.users[userId];
      // remove associated sessions
      Object.keys(this.data.sessions).forEach((token) => {
        if (this.data.sessions[token].userId === userId) {
          delete this.data.sessions[token];
        }
      });
      this.save();
      return true;
    }
    return false;
  }

  // Google OAuth Login or Register
  public loginOrRegisterGoogleUser(googlePayload: {
    googleId: string;
    email: string;
    name: string;
    avatar?: string;
    firstName?: string;
    lastName?: string;
  }): { user: any; token: string; isNewUser: boolean } {
    const cleanEmail = googlePayload.email.toLowerCase().trim();
    
    // Check if user exists by Google ID or by email
    let user = Object.values(this.data.users).find(
      (u) => u.googleId === googlePayload.googleId || (u.email && u.email.toLowerCase().trim() === cleanEmail)
    );

    let isNewUser = false;

    if (!user) {
      isNewUser = true;
      const baseUsername = cleanEmail.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '_');
      let finalUsername = baseUsername;
      let counter = 1;
      while (this.getUserByUsername(finalUsername)) {
        finalUsername = `${baseUsername}_${counter++}`;
      }

      user = {
        id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        googleId: googlePayload.googleId,
        email: cleanEmail,
        name: googlePayload.name || 'COOK Founder',
        firstName: googlePayload.firstName || googlePayload.name?.split(' ')[0] || 'Founder',
        lastName: googlePayload.lastName || googlePayload.name?.split(' ').slice(1).join(' ') || '',
        username: finalUsername,
        avatar: googlePayload.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80',
        coverImage: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1600&auto=format&fit=crop&q=80',
        role: 'Founder',
        primaryRole: '',
        title: '',
        headline: '',
        bio: '',
        location: '',
        website: '',
        portfolioWebsite: '',
        verified: false,
        postsCount: 0,
        followersCount: 0,
        followingCount: 0,
        connectionsCount: 0,
        skills: [],
        skillItems: [],
        interests: [],
        experience: [],
        education: [],
        projects: [],
        certifications: [],
        languages: ['English'],
        socialLinkItems: [],
        socialLinks: {},
        privacySettings: {
          profileVisibility: 'public',
          showEmail: false,
          showEducationGrades: true,
          showFundingRequests: true,
          allowDirectMessages: true,
        },
        profileCompletionPercentage: 20,
        onboardingCompleted: false,
        onboardingStep: 1,
        authProvider: 'google',
        createdAt: Date.now(),
      };
    } else {
      // Existing user: ensure googleId is linked and update avatar if provided
      user.googleId = googlePayload.googleId;
      if (!user.avatar && googlePayload.avatar) {
        user.avatar = googlePayload.avatar;
      }
    }

    this.saveUser(user);
    const token = this.createSession(user.id);
    return { user, token, isNewUser };
  }

  // Email / Password Register
  public registerEmailUser(params: {
    email: string;
    password: string;
    name: string;
  }): { user: any; token: string } {
    const cleanEmail = params.email.toLowerCase().trim();
    if (this.getUserByEmail(cleanEmail)) {
      throw new Error('An account with this email already exists.');
    }

    const salt = crypto.randomBytes(16).toString('hex');
    const passwordHash = hashPassword(params.password, salt);

    const baseUsername = cleanEmail.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '_');
    let finalUsername = baseUsername;
    let counter = 1;
    while (this.getUserByUsername(finalUsername)) {
      finalUsername = `${baseUsername}_${counter++}`;
    }

    const newUser = {
      id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      email: cleanEmail,
      name: params.name || 'COOK Founder',
      firstName: params.name?.split(' ')[0] || 'Founder',
      lastName: params.name?.split(' ').slice(1).join(' ') || '',
      username: finalUsername,
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80',
      coverImage: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1600&auto=format&fit=crop&q=80',
      role: 'Founder',
      primaryRole: '',
      title: '',
      headline: '',
      bio: '',
      location: '',
      website: '',
      portfolioWebsite: '',
      verified: false,
      postsCount: 0,
      followersCount: 0,
      followingCount: 0,
      connectionsCount: 0,
      skills: [],
      skillItems: [],
      interests: [],
      experience: [],
      education: [],
      projects: [],
      languages: ['English'],
      socialLinkItems: [],
      socialLinks: {},
      privacySettings: {
        profileVisibility: 'public',
        showEmail: false,
        showEducationGrades: true,
        showFundingRequests: true,
        allowDirectMessages: true,
      },
      profileCompletionPercentage: 20,
      onboardingCompleted: false,
      onboardingStep: 1,
      authProvider: 'email',
      createdAt: Date.now(),
    };

    this.saveUser(newUser);
    this.data.userCredentials[cleanEmail] = {
      userId: newUser.id,
      passwordHash,
      salt,
    };
    this.save();

    const token = this.createSession(newUser.id);
    return { user: newUser, token };
  }

  // Email / Password Login
  public loginEmailUser(email: string, password: string): { user: any; token: string } {
    const cleanEmail = email.toLowerCase().trim();
    const cred = this.data.userCredentials[cleanEmail];
    if (!cred) {
      throw new Error('Invalid email or password.');
    }

    const calculatedHash = hashPassword(password, cred.salt);
    if (calculatedHash !== cred.passwordHash) {
      throw new Error('Invalid email or password.');
    }

    const user = this.getUser(cred.userId);
    if (!user) {
      throw new Error('User account not found.');
    }

    const token = this.createSession(user.id);
    return { user, token };
  }

  // Stories
  public cleanExpiredStories(): Story[] {
    const now = Date.now();
    const lenBefore = this.data.stories.length;
    this.data.stories = this.data.stories.filter((story) => story.expiresAt > now);
    if (this.data.stories.length !== lenBefore) {
      this.save();
    }
    return this.data.stories;
  }

  public getStories(): Story[] {
    return this.cleanExpiredStories();
  }

  public addStory(story: Story): Story {
    this.cleanExpiredStories();
    this.data.stories.unshift(story);
    this.save();
    return story;
  }

  public deleteStory(id: string): boolean {
    const lenBefore = this.data.stories.length;
    this.data.stories = this.data.stories.filter((s) => s.id !== id);
    if (this.data.stories.length !== lenBefore) {
      this.save();
      return true;
    }
    return false;
  }

  public addStoryComment(storyId: string, comment: StoryComment): Story | null {
    const story = this.data.stories.find((s) => s.id === storyId);
    if (!story) return null;
    if (!Array.isArray(story.comments)) {
      story.comments = [];
    }
    story.comments.push(comment);
    this.save();
    return story;
  }

  public markStoryViewed(storyId: string, userId: string): Story | null {
    const story = this.data.stories.find((s) => s.id === storyId);
    if (!story) return null;
    if (!Array.isArray(story.viewers)) {
      story.viewers = [];
    }
    if (!story.viewers.includes(userId)) {
      story.viewers.push(userId);
      this.save();
    }
    return story;
  }

  // Communities
  public getCommunities() {
    return this.data.communities || [];
  }

  public updateCommunity(id: string, updates: any) {
    if (!this.data.communities) this.data.communities = [];
    const index = this.data.communities.findIndex((c) => c.id === id);
    if (index >= 0) {
      this.data.communities[index] = { ...this.data.communities[index], ...updates };
    } else {
      this.data.communities.push({ id, ...updates });
    }
    this.save();
    return this.data.communities.find((c) => c.id === id);
  }
}

export const db = new DatabaseManager();
