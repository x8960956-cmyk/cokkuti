import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.resolve(__dirname, 'data');
const DB_FILE = path.resolve(DATA_DIR, 'cook_db.json');
const UPLOADS_DIR = path.resolve(__dirname, 'uploads');

export const MODERATOR_EMAIL = 'x8960956@gmail.com';

export function isModeratorUser(user: any): boolean {
  return Boolean(user?.email && user.email.toLowerCase().trim() === MODERATOR_EMAIL);
}

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

export interface LoginEvent {
  id: string;
  userId: string;
  name: string;
  email: string;
  username: string;
  avatar: string;
  provider: string;
  isNewUser: boolean;
  onboardingCompleted: boolean;
  profileCompletionPercentage: number;
  timestamp: number;
  isoTime: string;
}

export interface ConnectionRecord {
  id: string;
  fromUserId: string;
  toUserId: string;
  createdAt: number;
}

export interface ModeratorSettings {
  spreadsheetId: string;
  spreadsheetUrl: string;
  sheetName: string;
  whatsappPhone: string;
  whatsappWebhookUrl: string;
}

export interface CookDatabase {
  stories: Story[];
  users: Record<string, any>;
  sessions: Record<string, UserSession>;
  userCredentials: Record<string, { userId: string; passwordHash: string; salt: string }>;
  communities: any[];
  posts: any[];
  fundings: any[];
  opportunities: any[];
  events: any[];
  messages: any[];
  connections: ConnectionRecord[];
  loginEvents: LoginEvent[];
  moderatorSettings: ModeratorSettings;
  notifications: any[];
}

const SESSION_DURATION_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

function hashPassword(password: string, salt: string): string {
  return crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
}

function getDefaultDatabase(): CookDatabase {
  return {
    stories: [],
    users: {},
    sessions: {},
    userCredentials: {},
    communities: [],
    posts: [],
    fundings: [],
    opportunities: [],
    events: [],
    messages: [],
    connections: [],
    loginEvents: [],
    moderatorSettings: {
      spreadsheetId: '',
      spreadsheetUrl: '',
      sheetName: 'Logins',
      whatsappPhone: '',
      whatsappWebhookUrl: '',
    },
    notifications: [],
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
          if (!Array.isArray(parsed.posts)) parsed.posts = [];
          if (!Array.isArray(parsed.fundings)) parsed.fundings = [];
          if (!Array.isArray(parsed.opportunities)) parsed.opportunities = [];
          if (!Array.isArray(parsed.events)) parsed.events = [];
          if (!Array.isArray(parsed.messages)) parsed.messages = [];
          if (!Array.isArray(parsed.connections)) parsed.connections = [];
          if (!Array.isArray(parsed.loginEvents)) parsed.loginEvents = [];
          if (!parsed.moderatorSettings) {
            parsed.moderatorSettings = {
              spreadsheetId: '',
              spreadsheetUrl: '',
              sheetName: 'Logins',
              whatsappPhone: '',
              whatsappWebhookUrl: '',
            };
          }
          if (!Array.isArray(parsed.notifications)) parsed.notifications = [];
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

  // Deletes any leftover demo accounts, fake stories, fake communities, fake posts, and fake notifications
  private cleanLegacyDemoData() {
    let changed = false;
    if ((this.data as any).userProfile) {
      delete (this.data as any).userProfile;
      changed = true;
    }

    const fakeUserIds = new Set<string>([
      'me',
      'sarah-ahmed',
      'david-kim',
      'usr_1792993565775_ronaw',
      'usr_1792993590194_2ptv7',
    ]);
    const fakeEmails = new Set(['alex.chen@cook.dev', 'maya.lin@cook.dev']);

    if (this.data.users) {
      Object.keys(this.data.users).forEach((uid) => {
        const u = this.data.users[uid];
        if (fakeUserIds.has(uid) || (u?.email && fakeEmails.has(u.email.toLowerCase().trim()))) {
          fakeUserIds.add(uid);
          delete this.data.users[uid];
          changed = true;
        }
      });
    }

    if (this.data.sessions) {
      Object.keys(this.data.sessions).forEach((tok) => {
        if (fakeUserIds.has(this.data.sessions[tok]?.userId)) {
          delete this.data.sessions[tok];
          changed = true;
        }
      });
    }

    // Clean fake stories
    if (this.data.stories && this.data.stories.length > 0) {
      const len = this.data.stories.length;
      const fakeStoryIds = new Set(['story-sarah-1', 'story-david-1']);
      this.data.stories = this.data.stories.filter(
        (s) => !fakeStoryIds.has(s.id) && !fakeUserIds.has(s.userId)
      );
      if (this.data.stories.length !== len) changed = true;
    }

    // Clean fake default communities with mock member strings
    if (this.data.communities && this.data.communities.length > 0) {
      const len = this.data.communities.length;
      this.data.communities = this.data.communities.filter(
        (c) =>
          c.memberCount !== '3.4k members' &&
          c.memberCount !== '5.1k members' &&
          c.memberCount !== '12.5K members'
      );
      if (this.data.communities.length !== len) changed = true;
    }

    // Clean out fake demo feed posts
    if (this.data.posts && this.data.posts.length > 0) {
      const initialCount = this.data.posts.length;
      const fakePostIds = new Set(['post-1', 'post-2', 'post-3', 'post-4']);
      this.data.posts = this.data.posts.filter((p) => !fakePostIds.has(p.id));
      if (this.data.posts.length !== initialCount) {
        changed = true;
      }
    }

    // Clean out fake demo funding pitches
    if (this.data.fundings && this.data.fundings.length > 0) {
      const initialCount = this.data.fundings.length;
      const fakeFundingIds = new Set(['fund-1', 'fund-2', 'fund-3', 'fund-4']);
      this.data.fundings = this.data.fundings.filter((f) => !fakeFundingIds.has(f.id));
      if (this.data.fundings.length !== initialCount) {
        changed = true;
      }
    }

    // Clean out any legacy clips array if present
    if ((this.data as any).clips) {
      delete (this.data as any).clips;
      changed = true;
    }

    // Clean out fake seeded test notifications
    if (this.data.notifications && this.data.notifications.length > 0) {
      const initialCount = this.data.notifications.length;
      this.data.notifications = this.data.notifications.filter(
        (n) =>
          n.id !== 'notif-1794232890974-418a' &&
          n.actorName !== 'Elena Rostova' &&
          n.actorId !== 'system'
      );
      if (this.data.notifications.length !== initialCount) {
        changed = true;
      }
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

  public getAllUsers(): any[] {
    return Object.values(this.data.users || {});
  }

  public getModeratorUser(): any | null {
    return this.getUserByEmail(MODERATOR_EMAIL);
  }

  public getPlatformStats(): {
    totalUsers: number;
    activeSessions: number;
    totalPosts: number;
    totalFundings: number;
    totalConnections: number;
    serverUptimeSeconds: number;
    serverTimestamp: number;
  } {
    const totalUsers = Object.keys(this.data.users || {}).length;
    const now = Date.now();
    // Deduplicate active sessions by userId for accurate live active user count
    const activeUserIds = new Set(
      Object.values(this.data.sessions || {})
        .filter((s) => s.expiresAt > now && this.data.users[s.userId])
        .map((s) => s.userId)
    );
    const totalPosts = (this.data.posts || []).length;
    const totalFundings = (this.data.fundings || []).length;
    const totalConnections = (this.data.connections || []).length;

    return {
      totalUsers,
      activeSessions: activeUserIds.size,
      totalPosts,
      totalFundings,
      totalConnections,
      serverUptimeSeconds: Math.floor(process.uptime()),
      serverTimestamp: now,
    };
  }

  // Login Event Tracking (for Moderator Observability & Google Sheets Export)
  public recordLoginEvent(user: any, provider: string, isNewUser: boolean): LoginEvent {
    if (!this.data.loginEvents) this.data.loginEvents = [];
    const now = Date.now();
    const evt: LoginEvent = {
      id: `login_${now}_${Math.random().toString(36).substring(2, 6)}`,
      userId: user.id,
      name: user.name || 'COOK User',
      email: user.email || '',
      username: user.username || '',
      avatar: user.avatar || '',
      provider,
      isNewUser,
      onboardingCompleted: Boolean(user.onboardingCompleted),
      profileCompletionPercentage: user.profileCompletionPercentage || 0,
      timestamp: now,
      isoTime: new Date(now).toISOString(),
    };
    this.data.loginEvents.unshift(evt);
    if (this.data.loginEvents.length > 500) {
      this.data.loginEvents = this.data.loginEvents.slice(0, 500);
    }
    this.save();
    return evt;
  }

  public getLoginEvents(): LoginEvent[] {
    return this.data.loginEvents || [];
  }

  // Moderator Settings
  public getModeratorSettings(): ModeratorSettings {
    return (
      this.data.moderatorSettings || {
        spreadsheetId: '',
        spreadsheetUrl: '',
        sheetName: 'Logins',
        whatsappPhone: '',
        whatsappWebhookUrl: '',
      }
    );
  }

  public saveModeratorSettings(updates: Partial<ModeratorSettings>): ModeratorSettings {
    this.data.moderatorSettings = {
      ...this.getModeratorSettings(),
      ...updates,
    };
    this.save();
    return this.data.moderatorSettings;
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
        verified: cleanEmail === MODERATOR_EMAIL,
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
          chatInitiationPolicy: 'everyone',
          blockedUserIds: [],
        },
        profileCompletionPercentage: 20,
        onboardingCompleted: false,
        onboardingStep: 1,
        authProvider: 'google',
        createdAt: Date.now(),
      };
    } else {
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
      verified: cleanEmail === MODERATOR_EMAIL,
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
        chatInitiationPolicy: 'everyone',
        blockedUserIds: [],
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

  // Connections between real users
  public getConnectionsForUser(userId: string): string[] {
    return (this.data.connections || [])
      .filter((c) => c.fromUserId === userId || c.toUserId === userId)
      .map((c) => (c.fromUserId === userId ? c.toUserId : c.fromUserId));
  }

  public areUsersConnected(userAId: string, userBId: string): boolean {
    if (!userAId || !userBId) return false;
    return (this.data.connections || []).some(
      (c) =>
        (c.fromUserId === userAId && c.toUserId === userBId) ||
        (c.fromUserId === userBId && c.toUserId === userAId)
    );
  }

  public canUserInitiateChat(
    senderId: string,
    recipientId: string
  ): {
    allowed: boolean;
    reason?: string;
    policy: 'everyone' | 'connections_only' | 'nobody';
    isConnected: boolean;
    isBlocked: boolean;
  } {
    const sender = this.getUser(senderId);
    const recipient = this.getUser(recipientId);
    const isConnected = this.areUsersConnected(senderId, recipientId);

    if (!recipient) {
      return {
        allowed: false,
        reason: 'Recipient user does not exist.',
        policy: 'nobody',
        isConnected: false,
        isBlocked: false,
      };
    }

    const recipientBlocked: string[] = recipient.privacySettings?.blockedUserIds || [];
    const senderBlocked: string[] = sender?.privacySettings?.blockedUserIds || [];
    const isBlocked = recipientBlocked.includes(senderId) || senderBlocked.includes(recipientId);

    const policy: 'everyone' | 'connections_only' | 'nobody' =
      recipient.privacySettings?.allowDirectMessages === false
        ? 'nobody'
        : recipient.privacySettings?.chatInitiationPolicy || 'everyone';

    if (isBlocked) {
      return {
        allowed: false,
        reason: 'Messaging is restricted because one user has blocked direct messages.',
        policy,
        isConnected,
        isBlocked: true,
      };
    }

    // Owner/moderator announcements remain deliverable unless explicitly blocked
    if (sender && isModeratorUser(sender)) {
      return { allowed: true, policy, isConnected, isBlocked: false };
    }

    // Check if recipient has previously initiated or replied in this thread
    const convId = `dm_${[senderId, recipientId].sort().join('_')}`;
    const recipientParticipated = (this.data.messages || []).some(
      (m) => m.conversationId === convId && m.senderId === recipientId
    );

    if (policy === 'nobody') {
      return {
        allowed: false,
        reason: `${recipient.name || 'This user'} has turned off new direct messages in their privacy settings.`,
        policy,
        isConnected,
        isBlocked: false,
      };
    }

    if (policy === 'connections_only' && !isConnected && !recipientParticipated) {
      return {
        allowed: false,
        reason: `${recipient.name || 'This user'} only accepts new chats from connections. Connect first to start messaging.`,
        policy,
        isConnected,
        isBlocked: false,
      };
    }

    return { allowed: true, policy, isConnected, isBlocked: false };
  }

  public toggleConnection(fromUserId: string, toUserId: string): { connected: boolean; connectionsCount: number } {
    if (!this.data.connections) this.data.connections = [];
    const idx = this.data.connections.findIndex(
      (c) =>
        (c.fromUserId === fromUserId && c.toUserId === toUserId) ||
        (c.fromUserId === toUserId && c.toUserId === fromUserId)
    );

    let connected = false;
    if (idx >= 0) {
      this.data.connections.splice(idx, 1);
      connected = false;
    } else {
      this.data.connections.push({
        id: `conn_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        fromUserId,
        toUserId,
        createdAt: Date.now(),
      });
      connected = true;
    }

    // Recompute exact real connection counts for both users
    const fromCount = this.getConnectionsForUser(fromUserId).length;
    const toCount = this.getConnectionsForUser(toUserId).length;
    if (this.data.users[fromUserId]) {
      this.data.users[fromUserId].connectionsCount = fromCount;
      this.data.users[fromUserId].followingCount = fromCount;
    }
    if (this.data.users[toUserId]) {
      this.data.users[toUserId].connectionsCount = toCount;
      this.data.users[toUserId].followersCount = toCount;
    }

    this.save();
    return { connected, connectionsCount: fromCount };
  }

  // Real Persisted Direct Messages
  public getMessagesForUser(userId?: string): any[] {
    const all = this.data.messages || [];
    if (!userId) return all;
    return all.filter(
      (m) => m.senderId === userId || m.recipientId === userId || !m.recipientId
    );
  }

  public addMessage(msg: any): any {
    if (!this.data.messages) this.data.messages = [];
    // Idempotency guard against duplicate message IDs
    const existing = this.data.messages.find((m) => m.id === msg.id);
    if (existing) return existing;
    this.data.messages.push(msg);
    if (this.data.messages.length > 1000) {
      this.data.messages = this.data.messages.slice(-1000);
    }
    this.save();
    return msg;
  }

  public markConversationRead(conversationId: string, readerId: string): number {
    if (!this.data.messages || !conversationId || !readerId) return 0;
    let updatedCount = 0;
    const now = Date.now();
    this.data.messages.forEach((m) => {
      if (m.conversationId === conversationId && m.recipientId === readerId && !m.read) {
        m.read = true;
        m.readAt = now;
        updatedCount++;
      }
    });
    if (updatedCount > 0) {
      this.save();
    }
    return updatedCount;
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

  // Communities (100% Real User-Created)
  public getCommunities(userId?: string) {
    return (this.data.communities || []).map((c) => {
      const members: string[] = Array.isArray(c.memberIds) ? c.memberIds : [];
      const count = members.length;
      return {
        ...c,
        memberCount: `${count} ${count === 1 ? 'member' : 'members'}`,
        joined: userId ? members.includes(userId) : Boolean(c.joined),
      };
    });
  }

  public addCommunity(community: any) {
    if (!this.data.communities) this.data.communities = [];
    this.data.communities.unshift(community);
    this.save();
    return community;
  }

  public toggleJoinCommunity(id: string, userId: string) {
    if (!this.data.communities) this.data.communities = [];
    const comm = this.data.communities.find((c) => c.id === id);
    if (!comm) return null;
    if (!Array.isArray(comm.memberIds)) comm.memberIds = [];
    if (comm.memberIds.includes(userId)) {
      comm.memberIds = comm.memberIds.filter((uid: string) => uid !== userId);
    } else {
      comm.memberIds.push(userId);
    }
    const count = comm.memberIds.length;
    comm.memberCount = `${count} ${count === 1 ? 'member' : 'members'}`;
    this.save();
    return {
      ...comm,
      joined: comm.memberIds.includes(userId),
    };
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

  // Opportunities (Real User-Posted)
  public getOpportunities(): any[] {
    return this.data.opportunities || [];
  }

  public addOpportunity(opp: any): any {
    if (!this.data.opportunities) this.data.opportunities = [];
    this.data.opportunities.unshift(opp);
    this.save();
    return opp;
  }

  // Events (Real User-Posted)
  public getEvents(userId?: string): any[] {
    return (this.data.events || []).map((e) => {
      const attendees: string[] = Array.isArray(e.attendeeIds) ? e.attendeeIds : [];
      return {
        ...e,
        attendeesCount: attendees.length,
        attending: userId ? attendees.includes(userId) : false,
      };
    });
  }

  public addEvent(evt: any): any {
    if (!this.data.events) this.data.events = [];
    this.data.events.unshift(evt);
    this.save();
    return evt;
  }

  public toggleEventRsvp(id: string, userId: string): any | null {
    if (!this.data.events) return null;
    const evt = this.data.events.find((e) => e.id === id);
    if (!evt) return null;
    if (!Array.isArray(evt.attendeeIds)) evt.attendeeIds = [];
    if (evt.attendeeIds.includes(userId)) {
      evt.attendeeIds = evt.attendeeIds.filter((uid: string) => uid !== userId);
    } else {
      evt.attendeeIds.push(userId);
    }
    evt.attendeesCount = evt.attendeeIds.length;
    this.save();
    return {
      ...evt,
      attending: evt.attendeeIds.includes(userId),
    };
  }

  // Posts: Real Multi-User Persistent Feed
  public getPosts(): any[] {
    return this.data.posts || [];
  }

  public savePosts(posts: any[]) {
    this.data.posts = posts;
    this.save();
  }

  public addPost(post: any) {
    if (!this.data.posts) this.data.posts = [];
    this.data.posts.unshift(post);
    if (post.author?.id && this.data.users[post.author.id]) {
      this.data.users[post.author.id].postsCount =
        (this.data.users[post.author.id].postsCount || 0) + 1;
    }
    this.save();
    return post;
  }

  public deletePost(id: string): boolean {
    if (!this.data.posts) return false;
    const target = this.data.posts.find((p) => p.id === id);
    const initialLen = this.data.posts.length;
    this.data.posts = this.data.posts.filter((p) => p.id !== id);
    if (this.data.posts.length !== initialLen) {
      if (target?.author?.id && this.data.users[target.author.id]) {
        this.data.users[target.author.id].postsCount = Math.max(
          0,
          (this.data.users[target.author.id].postsCount || 0) - 1
        );
      }
      this.save();
      return true;
    }
    return false;
  }

  public updatePost(id: string, updates: any) {
    if (!this.data.posts) this.data.posts = [];
    const index = this.data.posts.findIndex((p) => p.id === id);
    if (index >= 0) {
      this.data.posts[index] = { ...this.data.posts[index], ...updates };
      this.save();
      return this.data.posts[index];
    }
    return null;
  }

  public recordPostView(
    id: string,
    viewerKey?: string,
    completed?: boolean
  ): { viewsCount: number; watchCompletions: number } | null {
    if (!this.data.posts) return null;
    const post = this.data.posts.find((p) => p.id === id);
    if (!post) return null;

    if (!Array.isArray(post.viewedBy)) post.viewedBy = [];
    if (typeof post.viewsCount !== 'number') post.viewsCount = 0;
    if (typeof post.watchCompletions !== 'number') post.watchCompletions = 0;

    if (viewerKey) {
      if (!post.viewedBy.includes(viewerKey)) {
        post.viewedBy.push(viewerKey);
        post.viewsCount += 1;
      }
    } else {
      post.viewsCount += 1;
    }

    if (completed) {
      post.watchCompletions += 1;
    }

    this.save();
    return {
      viewsCount: post.viewsCount,
      watchCompletions: post.watchCompletions,
    };
  }

  // Fundings: Real Persistent Venture Engine
  public getFundings(): any[] {
    return this.data.fundings || [];
  }

  public saveFundings(fundings: any[]) {
    this.data.fundings = fundings;
    this.save();
  }

  public addFunding(funding: any) {
    if (!this.data.fundings) this.data.fundings = [];
    this.data.fundings.unshift(funding);
    this.save();
    return funding;
  }

  public deleteFunding(id: string): boolean {
    if (!this.data.fundings) return false;
    const initialLen = this.data.fundings.length;
    this.data.fundings = this.data.fundings.filter((f) => f.id !== id);
    if (this.data.fundings.length !== initialLen) {
      this.save();
      return true;
    }
    return false;
  }

  // Notifications: Strictly per-recipient real-time notifications (no generic 'all' demo blasts)
  public getNotifications(userId?: string): any[] {
    const list = this.data.notifications || [];
    if (!userId) return [];
    return list.filter((n) => n.recipientId === userId);
  }

  public saveNotifications(notifications: any[]) {
    this.data.notifications = notifications;
    this.save();
  }

  public addNotification(notification: any) {
    if (!this.data.notifications) this.data.notifications = [];
    this.data.notifications.unshift(notification);
    if (this.data.notifications.length > 250) {
      this.data.notifications = this.data.notifications.slice(0, 250);
    }
    this.save();
    return notification;
  }

  public markNotificationRead(id: string, userId?: string): boolean {
    if (!this.data.notifications) return false;
    const notif = this.data.notifications.find(
      (n) => n.id === id && (!userId || n.recipientId === userId)
    );
    if (notif) {
      notif.read = true;
      this.save();
      return true;
    }
    return false;
  }

  public markAllNotificationsRead(userId?: string): boolean {
    if (!this.data.notifications || !userId) return false;
    this.data.notifications.forEach((n) => {
      if (n.recipientId === userId) {
        n.read = true;
      }
    });
    this.save();
    return true;
  }

  public clearNotifications(userId?: string): boolean {
    if (!this.data.notifications || !userId) return false;
    this.data.notifications = this.data.notifications.filter((n) => n.recipientId !== userId);
    this.save();
    return true;
  }
}

export const db = new DatabaseManager();
