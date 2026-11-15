import express from 'express';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import dotenv from 'dotenv';
import os from 'os';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import { db, Story, StoryComment, MODERATOR_EMAIL, isModeratorUser } from './server_db.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isServerless = Boolean(
  process.env.VERCEL || process.env.VERCEL_ENV || process.env.AWS_LAMBDA_FUNCTION_NAME
);

const app = express();
const PORT = process.env.PORT || 3000;

// Ensure persistent uploads directory exists and is served statically (with range support for video seeking)
const uploadsDir = isServerless
  ? path.join(os.tmpdir(), 'cook_uploads')
  : path.resolve(__dirname, 'uploads');
try {
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
} catch (uploadDirErr) {
  console.warn('Uploads directory notice:', uploadDirErr);
}
app.use('/uploads', express.static(uploadsDir, { acceptRanges: true }));

// Raw binary upload endpoint for large videos and photos (fast, zero base64 bloat)
app.post(
  '/api/upload/raw',
  express.raw({
    type: ['video/*', 'image/*', 'application/octet-stream'],
    limit: '60mb',
  }),
  (req, res) => {
    try {
      const buffer = req.body;
      if (!Buffer.isBuffer(buffer) || buffer.length === 0) {
        return res.status(400).json({ error: 'Empty file upload' });
      }
      const mimeType = String(req.headers['content-type'] || 'video/mp4').toLowerCase();
      const origName = String(req.headers['x-file-name'] || 'upload').replace(/[^a-zA-Z0-9._-]/g, '_');

      let ext = 'mp4';
      if (mimeType.includes('webm')) ext = 'webm';
      else if (mimeType.includes('quicktime') || origName.toLowerCase().endsWith('.mov')) ext = 'mov';
      else if (mimeType.includes('ogg')) ext = 'ogv';
      else if (mimeType.includes('png')) ext = 'png';
      else if (mimeType.includes('webp')) ext = 'webp';
      else if (mimeType.includes('gif')) ext = 'gif';
      else if (mimeType.includes('jpeg') || mimeType.includes('jpg')) ext = 'jpg';
      else if (origName.includes('.')) {
        const candidate = origName.split('.').pop()?.toLowerCase();
        if (candidate && /^[a-z0-9]{2,5}$/.test(candidate)) ext = candidate;
      }

      const base = origName.replace(/\.[^.]+$/, '').substring(0, 30) || 'media';
      const uniqueFilename = `${base}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${ext}`;
      const filePath = path.resolve(uploadsDir, uniqueFilename);
      fs.writeFileSync(filePath, buffer);

      res.json({
        success: true,
        url: `/uploads/${uniqueFilename}`,
        filename: uniqueFilename,
        size: buffer.length,
        mimeType,
      });
    } catch (err: any) {
      console.error('Raw File Upload Error:', err);
      res.status(500).json({ error: 'Failed to save uploaded media', details: err?.message });
    }
  }
);

app.use(express.json({ limit: '60mb' }));
app.use(express.urlencoded({ extended: true, limit: '60mb' }));

// Real File Upload API (JSON base64 fallback) - permanently writes uploaded files to disk
app.post('/api/upload', (req, res) => {
  try {
    const { dataUrl, filename: reqFilename, name } = req.body;
    if (!dataUrl || typeof dataUrl !== 'string') {
      return res.status(400).json({ error: 'File data URL is required' });
    }

    const matches = dataUrl.match(/^data:([A-Za-z0-9-+/.]+)(?:;[^,]*)?;base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      return res.status(400).json({ error: 'Invalid file data format' });
    }

    const mimeType = matches[1];
    const base64Data = matches[2];
    const buffer = Buffer.from(base64Data, 'base64');

    if (buffer.length > 60 * 1024 * 1024) {
      return res.status(400).json({ error: 'File size exceeds 60MB limit' });
    }

    let ext = 'jpg';
    if (mimeType.includes('png')) ext = 'png';
    else if (mimeType.includes('webp')) ext = 'webp';
    else if (mimeType.includes('gif')) ext = 'gif';
    else if (mimeType.includes('mp4')) ext = 'mp4';
    else if (mimeType.includes('webm')) ext = 'webm';
    else if (mimeType.includes('quicktime')) ext = 'mov';
    else if (mimeType.includes('jpeg') || mimeType.includes('jpg')) ext = 'jpg';

    const cleanName = (name || reqFilename || 'media')
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .substring(0, 30);
    const uniqueFilename = `${cleanName}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${ext}`;
    const filePath = path.resolve(uploadsDir, uniqueFilename);

    fs.writeFileSync(filePath, buffer);

    const publicUrl = `/uploads/${uniqueFilename}`;
    res.json({
      success: true,
      url: publicUrl,
      filename: uniqueFilename,
      size: buffer.length,
      mimeType,
    });
  } catch (err: any) {
    console.error('File Upload Error:', err);
    res.status(500).json({ error: 'Failed to save file to persistent storage', details: err?.message });
  }
});

// Initialize Google GenAI client
const apiKey = process.env.GEMINI_API_KEY || '';
let ai: GoogleGenAI | null = null;
if (apiKey) {
  ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// In-Memory Database store
interface Comment {
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

interface Post {
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
  shareCount: number;
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

// Real Persistent Multi-User Feed (No fake posts)
let posts: Post[] = db.getPosts();

// Real Persistent Funding Requests (No fake funding pitches)
let fundingRequests: any[] = db.getFundings();

// ==========================================
// REAL-TIME WEBSOCKET HUB (Presence, 1:1 Chat & Live Notifications)
// ==========================================
const userSockets = new Map<string, Set<WebSocket>>();

function sendWsToUser(userId: string, event: string, payload: any) {
  const sockets = userSockets.get(userId);
  if (!sockets || sockets.size === 0) return;
  const serialized = JSON.stringify({ event, payload });
  sockets.forEach((ws) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(serialized);
    }
  });
}

function broadcastOnlinePresence() {
  const onlineUserIds = Array.from(userSockets.keys());
  const serialized = JSON.stringify({
    event: 'presence:update',
    payload: { onlineUserIds },
  });
  userSockets.forEach((sockets) => {
    sockets.forEach((ws) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(serialized);
      }
    });
  });
}

function broadcastWsAll(event: string, payload: any) {
  const serialized = JSON.stringify({ event, payload });
  userSockets.forEach((sockets) => {
    sockets.forEach((ws) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(serialized);
      }
    });
  });
}

function emitNotification(notif: any) {
  db.addNotification(notif);
  if (notif.recipientId) {
    sendWsToUser(notif.recipientId, 'notification:new', { notification: notif });
  }
  return notif;
}

// Helper: fire optional WhatsApp webhook configured by moderator
async function dispatchModeratorWhatsAppWebhook(loginEvent: any) {
  try {
    const settings = db.getModeratorSettings();
    if (!settings?.whatsappWebhookUrl) return;
    await fetch(settings.whatsappWebhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event: 'cook_user_login',
        phone: settings.whatsappPhone,
        text: `COOK Login Alert: ${loginEvent.name} (${loginEvent.email}) signed in via ${loginEvent.provider} at ${loginEvent.isoTime}`,
        loginEvent,
      }),
    });
  } catch (err) {
    console.warn('WhatsApp webhook dispatch notice:', err);
  }
}

function notifyModeratorOnLogin(user: any, provider: string, isNewUser: boolean) {
  const evt = db.recordLoginEvent(user, provider, isNewUser);
  const mod = db.getModeratorUser();
  if (mod && mod.id !== user.id) {
    emitNotification({
      id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      recipientId: mod.id,
      actorId: user.id,
      actorName: user.name || user.email,
      actorAvatar: user.avatar || '',
      type: 'system',
      title: isNewUser ? 'New User Registered' : 'User Signed In',
      message: `${user.name} (${user.email}) logged in via ${provider}.`,
      targetId: user.id,
      targetType: 'moderator',
      read: false,
      createdAt: Date.now(),
      timestamp: 'Just now',
    });
  }
  dispatchModeratorWhatsAppWebhook(evt);
  return evt;
}

// Helper to decode Google Identity Services JWT token
function decodeGoogleJwt(jwt: string): any | null {
  try {
    const parts = jwt.split('.');
    if (parts.length !== 3) return null;
    const payloadBase64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = Buffer.from(payloadBase64, 'base64').toString('utf8');
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
}

// Authentication Helper: extracts user from Bearer session token
function getAuthUser(req: express.Request): any | null {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  const token = authHeader.substring(7).trim();
  const session = db.getSession(token);
  if (!session) return null;
  return db.getUser(session.userId);
}

// Calculate profile completion helper
function computeCompletion(profile: any) {
  let score = 0;
  if (profile.name) score += 10;
  if (profile.headline) score += 15;
  if (profile.avatar) score += 10;
  if (profile.coverImage) score += 10;
  if (profile.bio) score += 15;
  if (profile.experience && profile.experience.length > 0) score += 15;
  if (profile.education && profile.education.length > 0) score += 10;
  if (profile.skillItems && profile.skillItems.length >= 3) score += 10;
  if (profile.projects && profile.projects.length > 0) score += 5;
  return Math.min(100, score);
}

// API Routes

// Technical SEO: robots.txt and sitemap.xml
app.get('/robots.txt', (req, res) => {
  res.type('text/plain');
  res.send(`User-agent: *\nAllow: /\nDisallow: /api/\nSitemap: ${req.protocol}://${req.get('host')}/sitemap.xml\n`);
});

app.get('/sitemap.xml', (req, res) => {
  const host = `${req.protocol}://${req.get('host')}`;
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${host}/</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${host}/funding</loc>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>${host}/discover</loc>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${host}/communities</loc>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>
</urlset>`;
  res.type('application/xml');
  res.send(xml);
});

// ==========================================
// AUTHENTICATION REST ENDPOINTS
// ==========================================

app.get('/api/auth/health', (req, res) => {
  res.json({
    ok: true,
    runtime: isServerless ? 'vercel-serverless' : 'node-server',
    host: req.get('host'),
    protocol: req.protocol,
  });
});

// 1. Google OAuth Sign-In & Registration
app.post('/api/auth/google', (req, res) => {
  try {
    const { credential, googleUser } = req.body;
    let googleId = '';
    let email = '';
    let name = '';
    let avatar = '';
    let firstName = '';
    let lastName = '';

    if (credential) {
      const decoded = decodeGoogleJwt(credential);
      if (!decoded || !decoded.sub || !decoded.email) {
        return res.status(400).json({ error: 'Invalid Google credential token.' });
      }
      googleId = decoded.sub;
      email = decoded.email;
      name = decoded.name || '';
      avatar = decoded.picture || '';
      firstName = decoded.given_name || '';
      lastName = decoded.family_name || '';
    } else if (googleUser && googleUser.email) {
      googleId = googleUser.id || `google_${googleUser.email}`;
      email = googleUser.email;
      name = googleUser.name || 'COOK Founder';
      avatar = googleUser.avatar || '';
      firstName = googleUser.firstName || '';
      lastName = googleUser.lastName || '';
    } else {
      return res.status(400).json({ error: 'Google credential or profile information required.' });
    }

    const { user, token, isNewUser } = db.loginOrRegisterGoogleUser({
      googleId,
      email,
      name,
      avatar,
      firstName,
      lastName,
    });

    user.profileCompletionPercentage = computeCompletion(user);
    const loginEvent = notifyModeratorOnLogin(user, 'google', isNewUser);

    return res.json({
      success: true,
      token,
      user,
      isNewUser,
      loginEvent,
      onboardingCompleted: Boolean(user.onboardingCompleted),
      onboardingStep: user.onboardingStep || 1,
    });
  } catch (err: any) {
    console.error('Google Auth Error:', err);
    return res.status(500).json({ error: err.message || 'Google authentication failed.' });
  }
});

// 2. Email / Password Registration (Optional direct login support)
app.post('/api/auth/email-signup', (req, res) => {
  try {
    const { email, password, name } = req.body;
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, password, and name are required.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    }

    const { user, token } = db.registerEmailUser({ email, password, name });
    user.profileCompletionPercentage = computeCompletion(user);
    const loginEvent = notifyModeratorOnLogin(user, 'email', true);

    return res.json({
      success: true,
      token,
      user,
      isNewUser: true,
      loginEvent,
      onboardingCompleted: false,
      onboardingStep: 1,
    });
  } catch (err: any) {
    console.error('Email Signup Error:', err);
    return res.status(400).json({ error: err.message || 'Registration failed.' });
  }
});

// 3. Email / Password Login
app.post('/api/auth/email-login', (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const { user, token } = db.loginEmailUser(email, password);
    user.profileCompletionPercentage = computeCompletion(user);
    const loginEvent = notifyModeratorOnLogin(user, 'email', false);

    return res.json({
      success: true,
      token,
      user,
      loginEvent,
      onboardingCompleted: Boolean(user.onboardingCompleted),
      onboardingStep: user.onboardingStep || 1,
    });
  } catch (err: any) {
    console.error('Email Login Error:', err);
    return res.status(401).json({ error: err.message || 'Invalid email or password.' });
  }
});

// 4. Session Validation (Check logged in status)
app.get('/api/auth/me', (req, res) => {
  const user = getAuthUser(req);
  if (!user) {
    return res.json({ authenticated: false });
  }
  user.profileCompletionPercentage = computeCompletion(user);
  return res.json({
    authenticated: true,
    user,
    onboardingCompleted: Boolean(user.onboardingCompleted),
    onboardingStep: user.onboardingStep || 1,
  });
});

// 5. Sign Out
app.post('/api/auth/logout', (req, res) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7).trim();
    db.deleteSession(token);
  }
  return res.json({ success: true });
});

// ==========================================
// PROFILE & ONBOARDING REST ENDPOINTS
// ==========================================

// Step 1: Save Basic Profile
app.post('/api/profile/step1', (req, res) => {
  const user = getAuthUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Please sign in to save profile progress.' });
  }

  const {
    name,
    username,
    headline,
    bio,
    location,
    avatar,
    interests,
    languages,
    portfolioWebsite,
  } = req.body;

  if (!name?.trim()) {
    return res.status(400).json({ error: 'Full name is required.' });
  }
  if (!username?.trim()) {
    return res.status(400).json({ error: 'Username is required.' });
  }

  // Check username collision with another user
  const existingWithUsername = db.getUserByUsername(username);
  if (existingWithUsername && existingWithUsername.id !== user.id) {
    return res.status(400).json({ error: 'This username is already taken. Please choose another.' });
  }

  const updatedUser = db.saveUser({
    ...user,
    name: name.trim(),
    username: username.trim().toLowerCase(),
    headline: (headline || '').trim(),
    bio: (bio || '').trim(),
    location: (location || '').trim(),
    avatar: avatar || user.avatar,
    interests: Array.isArray(interests) ? interests : user.interests || [],
    languages: Array.isArray(languages) ? languages : user.languages || ['English'],
    portfolioWebsite: (portfolioWebsite || '').trim(),
    onboardingStep: 2,
    onboardingCompleted: false,
  });

  updatedUser.profileCompletionPercentage = computeCompletion(updatedUser);
  return res.json({ success: true, user: updatedUser });
});

// Step 2 + Complete Profile
app.post('/api/profile/complete', (req, res) => {
  const user = getAuthUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Please sign in to complete your profile.' });
  }

  const updates = req.body || {};
  delete updates.id;
  delete updates.googleId;
  delete updates.email;
  delete updates.authProvider;
  delete updates.createdAt;

  // Validation
  const finalName = updates.name || user.name;
  const finalUsername = updates.username || user.username;
  const finalHeadline = updates.headline || user.headline;
  const finalBio = updates.bio || user.bio;

  if (!finalName?.trim()) {
    return res.status(400).json({ error: 'Full name is required to complete profile.' });
  }
  if (!finalUsername?.trim()) {
    return res.status(400).json({ error: 'Username is required to complete profile.' });
  }
  if (!finalHeadline?.trim()) {
    return res.status(400).json({ error: 'Professional headline is required.' });
  }
  if (!finalBio?.trim()) {
    return res.status(400).json({ error: 'About / bio summary is required.' });
  }

  // Persist full profile with onboardingCompleted: true
  const completedUser = db.saveUser({
    ...user,
    ...updates,
    id: user.id,
    email: user.email,
    googleId: user.googleId,
    authProvider: user.authProvider,
    name: finalName.trim(),
    username: finalUsername.trim().toLowerCase(),
    headline: finalHeadline.trim(),
    bio: finalBio.trim(),
    onboardingCompleted: true,
    onboardingStep: 2,
    updatedAt: Date.now(),
  });

  completedUser.profileCompletionPercentage = computeCompletion(completedUser);
  return res.json({ success: true, user: completedUser });
});

// Get Authenticated User Profile
app.get('/api/profile', (req, res) => {
  const user = getAuthUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  user.profileCompletionPercentage = computeCompletion(user);
  return res.json({ user });
});

// Update Authenticated User Profile (Secure, Isolated, Permanent)
app.put('/api/profile', (req, res) => {
  const user = getAuthUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const updates = req.body || {};
  // Security protection: Prevent privilege escalation or account hijacking
  delete updates.id;
  delete updates.googleId;
  delete updates.email;
  delete updates.authProvider;
  delete updates.createdAt;

  const merged = {
    ...user,
    ...updates,
    id: user.id,
    email: user.email,
    googleId: user.googleId,
    authProvider: user.authProvider,
    createdAt: user.createdAt,
    updatedAt: Date.now(),
  };
  merged.profileCompletionPercentage = computeCompletion(merged);
  const updated = db.saveUser(merged);
  return res.json({ success: true, user: updated });
});

// STORIES REST ENDPOINTS (24-Hour Expiration & Story Comments)
app.get('/api/stories', (req, res) => {
  const activeStories = db.getStories();
  res.json({ stories: activeStories });
});

app.post('/api/stories', (req, res) => {
  const { mediaUrl, mediaType = 'image', caption } = req.body;
  if (!mediaUrl) {
    return res.status(400).json({ error: 'Media URL required' });
  }

  const user = getAuthUser(req) || {
    id: 'guest',
    name: 'COOK Builder',
    username: 'builder',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
    verified: false,
  };

  const now = Date.now();
  const newStory: Story = {
    id: `story-${now}-${Math.random().toString(36).substring(2, 6)}`,
    userId: user.id,
    userName: user.name,
    userUsername: user.username,
    userAvatar: user.avatar,
    userVerified: Boolean(user.verified),
    mediaUrl,
    mediaType,
    caption: caption || '',
    createdAt: now,
    expiresAt: now + 24 * 60 * 60 * 1000,
    viewers: [],
    comments: [],
  };

  db.addStory(newStory);
  res.json({ success: true, story: newStory });
});

app.post('/api/stories/:id/comment', (req, res) => {
  const { content } = req.body;
  if (!content || !content.trim()) {
    return res.status(400).json({ error: 'Comment content required' });
  }

  const user = getAuthUser(req) || {
    id: 'guest',
    name: 'COOK Builder',
    username: 'builder',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
    verified: false,
  };

  const newComment: StoryComment = {
    id: `sc-${Date.now()}`,
    author: {
      id: user.id,
      name: user.name,
      username: user.username,
      avatar: user.avatar || '',
      verified: Boolean(user.verified),
    },
    content: content.trim(),
    createdAt: 'Just now',
  };

  const updatedStory = db.addStoryComment(req.params.id, newComment);
  if (!updatedStory) {
    return res.status(404).json({ error: 'Story not found or expired' });
  }

  res.json({ success: true, story: updatedStory, comment: newComment });
});

app.post('/api/stories/:id/view', (req, res) => {
  const user = getAuthUser(req);
  const userId = user?.id || 'guest';
  const updated = db.markStoryViewed(req.params.id, userId);
  res.json({ success: true, story: updated });
});

app.delete('/api/stories/:id', (req, res) => {
  const success = db.deleteStory(req.params.id);
  res.json({ success });
});

// Communities Endpoints (100% real persisted communities)
app.get('/api/communities', (req, res) => {
  const authUser = getAuthUser(req);
  res.json({ communities: db.getCommunities(authUser?.id) });
});

app.post('/api/communities', (req, res) => {
  const authUser = getAuthUser(req);
  if (!authUser) return res.status(401).json({ error: 'Authentication required' });
  const { name, tagline, category = 'Technology', customPhotoUrl, bannerUrl, pinnedPost } = req.body;
  if (!name?.trim()) return res.status(400).json({ error: 'Community name required' });

  const newComm = {
    id: `comm-${Date.now()}`,
    name: name.trim(),
    tagline: (tagline || 'A collective space for COOK builders and creators.').trim(),
    category,
    icon: 'Users',
    customPhotoUrl: customPhotoUrl || undefined,
    bannerUrl: bannerUrl || undefined,
    memberIds: [authUser.id],
    memberCount: '1 member',
    joined: true,
    moderators: [authUser.name],
    creatorId: authUser.id,
    rules: ['Be respectful', 'Share high signal updates', 'Let it cook'],
    pinnedPost: pinnedPost || undefined,
    createdAt: Date.now(),
  };
  db.addCommunity(newComm);
  res.json({ success: true, community: newComm });
});

app.post('/api/communities/:id/join', (req, res) => {
  const authUser = getAuthUser(req);
  if (!authUser) return res.status(401).json({ error: 'Authentication required' });
  const updated = db.toggleJoinCommunity(req.params.id, authUser.id);
  if (!updated) return res.status(404).json({ error: 'Community not found' });
  res.json({ success: true, community: updated });
});

app.put('/api/communities/:id', (req, res) => {
  const authUser = getAuthUser(req);
  if (!authUser) return res.status(401).json({ error: 'Authentication required' });
  const updated = db.updateCommunity(req.params.id, req.body);
  res.json({ success: true, community: updated });
});

// Opportunities Endpoints (Real User-Posted)
app.get('/api/opportunities', (req, res) => {
  res.json({ opportunities: db.getOpportunities() });
});

app.post('/api/opportunities', (req, res) => {
  const authUser = getAuthUser(req);
  if (!authUser) return res.status(401).json({ error: 'Authentication required' });
  const { title, startup, type = 'Co-founder', location = 'Remote', commitment = 'Full-time', equityOrCompensation = '', skills = [], description = '' } = req.body;
  if (!title?.trim() || !startup?.trim()) {
    return res.status(400).json({ error: 'Role title and startup name required' });
  }
  const opp = {
    id: `opp-${Date.now()}`,
    creatorId: authUser.id,
    creatorName: authUser.name,
    title: title.trim(),
    startup: startup.trim(),
    logo: authUser.avatar || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80',
    type,
    location,
    remote: location.toLowerCase().includes('remote'),
    commitment,
    equityOrCompensation: equityOrCompensation || 'Equity / Negotiable',
    skills: Array.isArray(skills) ? skills : [],
    description,
    postedDate: 'Just now',
    createdAt: Date.now(),
  };
  db.addOpportunity(opp);
  res.json({ success: true, opportunity: opp });
});

// Events Endpoints (Real User-Posted)
app.get('/api/events', (req, res) => {
  const authUser = getAuthUser(req);
  res.json({ events: db.getEvents(authUser?.id) });
});

app.post('/api/events', (req, res) => {
  const authUser = getAuthUser(req);
  if (!authUser) return res.status(401).json({ error: 'Authentication required' });
  const { title, type = 'Demo Day', date, time, location = 'Virtual', description = '', prizes = '' } = req.body;
  if (!title?.trim() || !date?.trim()) {
    return res.status(400).json({ error: 'Event title and date required' });
  }
  const evt = {
    id: `evt-${Date.now()}`,
    creatorId: authUser.id,
    title: title.trim(),
    type,
    date: date.trim(),
    time: time || 'TBD',
    location,
    isVirtual: location.toLowerCase().includes('virtual') || location.toLowerCase().includes('online'),
    organizer: authUser.name,
    attendeeIds: [authUser.id],
    attendeesCount: 1,
    attending: true,
    description,
    prizes: prizes || undefined,
    createdAt: Date.now(),
  };
  db.addEvent(evt);
  res.json({ success: true, event: evt });
});

app.post('/api/events/:id/rsvp', (req, res) => {
  const authUser = getAuthUser(req);
  if (!authUser) return res.status(401).json({ error: 'Authentication required' });
  const updated = db.toggleEventRsvp(req.params.id, authUser.id);
  if (!updated) return res.status(404).json({ error: 'Event not found' });
  res.json({ success: true, event: updated });
});

app.get('/api/profile/:username', (req, res) => {
  const { username } = req.params;
  const user = db.getUserByUsername(username) || (username === 'me' ? getAuthUser(req) : null);
  if (user) {
    user.profileCompletionPercentage = computeCompletion(user);
    return res.json({ user });
  }

  return res.status(404).json({ error: 'User profile not found.' });
});

// Experience CRUD
app.post('/api/profile/experience', (req, res) => {
  const user = getAuthUser(req);
  if (!user) return res.status(401).json({ error: 'Not authenticated' });
  const newExp = {
    id: `exp-${Date.now()}`,
    ...req.body,
  };
  user.experience = [newExp, ...(user.experience || [])];
  db.saveUser(user);
  res.json({ success: true, experience: user.experience });
});

app.delete('/api/profile/experience/:id', (req, res) => {
  const user = getAuthUser(req);
  if (!user) return res.status(401).json({ error: 'Not authenticated' });
  user.experience = (user.experience || []).filter((e: any) => e.id !== req.params.id);
  db.saveUser(user);
  res.json({ success: true, experience: user.experience });
});

// Education CRUD
app.post('/api/profile/education', (req, res) => {
  const user = getAuthUser(req);
  if (!user) return res.status(401).json({ error: 'Not authenticated' });
  const newEdu = {
    id: `edu-${Date.now()}`,
    ...req.body,
  };
  user.education = [newEdu, ...(user.education || [])];
  db.saveUser(user);
  res.json({ success: true, education: user.education });
});

app.delete('/api/profile/education/:id', (req, res) => {
  const user = getAuthUser(req);
  if (!user) return res.status(401).json({ error: 'Not authenticated' });
  user.education = (user.education || []).filter((e: any) => e.id !== req.params.id);
  db.saveUser(user);
  res.json({ success: true, education: user.education });
});

// Posts: Real Multi-User Feed
app.get('/api/posts', (req, res) => {
  const { filter, search } = req.query;
  posts = db.getPosts();
  let result = [...posts];

  if (filter === 'Following') {
    const user = getAuthUser(req);
    if (user) {
      result = result.filter(p => p.author.id !== user.id);
    }
  } else if (filter === 'Trending') {
    result.sort((a, b) => b.likes - a.likes);
  } else if (filter === 'New Ideas') {
    result = result.filter(p => p.type === 'idea' || p.type === 'pitch');
  } else if (filter === 'Startups') {
    result = result.filter(p => p.type === 'pitch' || p.startupDetails);
  } else if (filter === 'Opportunities') {
    result = result.filter(p => p.category === 'Opportunities' || p.tags.includes('#Opportunities'));
  }

  if (search && typeof search === 'string') {
    const q = search.toLowerCase();
    result = result.filter(
      p =>
        p.content.toLowerCase().includes(q) ||
        p.author.name.toLowerCase().includes(q) ||
        p.tags.some(t => t.toLowerCase().includes(q))
    );
  }

  res.json({ posts: result });
});

app.post('/api/posts', (req, res) => {
  const { content, type = 'post', title, tags = [], media = [], startupDetails, poll, videoDurationSeconds } = req.body;
  if (!content && (!Array.isArray(media) || media.length === 0)) {
    return res.status(400).json({ error: 'Content or media is required' });
  }

  const authUser = getAuthUser(req);
  const author = authUser ? {
    id: authUser.id,
    name: authUser.name,
    username: authUser.username,
    avatar: authUser.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
    role: authUser.headline || authUser.role || 'Creator',
    verified: Boolean(authUser.verified),
  } : {
    id: 'guest',
    name: 'COOK Builder',
    username: 'builder',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
    role: 'Founder',
    verified: false,
  };

  const isVideoPost = type === 'video' || (Array.isArray(media) && media.some((m: any) => m.type === 'video'));

  const newPost: any = {
    id: `post-${Date.now()}`,
    author,
    type: isVideoPost ? 'video' : type,
    title,
    content: content || title || 'Shared a video on COOK',
    tags: tags.length ? tags : ['#COOK', '#Startups'],
    media,
    likes: 0,
    likedByMe: false,
    comments: [],
    reposts: 0,
    repostedByMe: false,
    saves: 0,
    savedByMe: false,
    shareCount: 0,
    viewsCount: 0,
    watchCompletions: 0,
    viewedBy: [],
    videoDurationSeconds: typeof videoDurationSeconds === 'number' ? videoDurationSeconds : undefined,
    timestamp: 'Just now',
    createdAt: Date.now(),
    category: type === 'pitch' ? 'Startups' : isVideoPost ? 'Videos' : (tags[0] || 'Tech'),
    startupDetails,
    poll,
  };

  db.addPost(newPost);
  posts = db.getPosts();
  res.json({ post: newPost });
});

app.post('/api/posts/:id/view', (req, res) => {
  const authUser = getAuthUser(req);
  const viewerKey = authUser?.id || String(req.body?.viewerKey || req.ip || 'guest');
  const completed = Boolean(req.body?.completed);
  const result = db.recordPostView(req.params.id, viewerKey, completed);
  posts = db.getPosts();
  if (!result) return res.status(404).json({ error: 'Post not found' });

  broadcastWsAll('post:engagement', {
    postId: req.params.id,
    viewsCount: result.viewsCount,
    watchCompletions: result.watchCompletions,
  });

  res.json({ success: true, ...result });
});

app.get('/api/posts/:id/metrics', (req, res) => {
  posts = db.getPosts();
  const post: any = posts.find(p => p.id === req.params.id);
  if (!post) return res.status(404).json({ error: 'Post not found' });

  const views = post.viewsCount || 0;
  const likes = post.likes || 0;
  const commentsCount = Array.isArray(post.comments) ? post.comments.length : 0;
  const reposts = post.reposts || 0;
  const saves = post.saves || 0;
  const shares = post.shareCount || 0;
  const watchCompletions = post.watchCompletions || 0;
  const interactions = likes + commentsCount + reposts + saves + shares;
  const engagementRate = views > 0 ? Number(((interactions / views) * 100).toFixed(1)) : 0;

  res.json({
    postId: post.id,
    viewsCount: views,
    watchCompletions,
    likes,
    commentsCount,
    reposts,
    saves,
    shareCount: shares,
    engagementRate,
    durationSeconds: post.videoDurationSeconds || 0,
  });
});

app.post('/api/posts/:id/like', (req, res) => {
  posts = db.getPosts();
  const post: any = posts.find(p => p.id === req.params.id);
  if (!post) return res.status(404).json({ error: 'Post not found' });
  const authUser = getAuthUser(req);
  post.likedByMe = !post.likedByMe;
  post.likes += post.likedByMe ? 1 : -1;
  if (post.likes < 0) post.likes = 0;
  db.savePosts(posts);

  // If liked and not self-like, create a real-time notification
  if (post.likedByMe && authUser && post.author?.id !== authUser.id) {
    const actorName = authUser.name || 'A builder';
    const postSnippet = post.title || (post.content ? post.content.substring(0, 45) + '...' : 'your post');
    emitNotification({
      id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      recipientId: post.author?.id || 'all',
      actorId: authUser.id,
      actorName,
      actorAvatar: authUser.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
      type: 'like',
      title: 'New Like on your post',
      message: `${actorName} liked "${postSnippet}"`,
      targetId: post.id,
      targetType: 'post',
      read: false,
      createdAt: Date.now(),
      timestamp: 'Just now',
    });
  }

  broadcastWsAll('post:engagement', { postId: post.id, likes: post.likes });
  res.json({ likes: post.likes, likedByMe: post.likedByMe });
});

app.post('/api/posts/:id/save', (req, res) => {
  posts = db.getPosts();
  const post = posts.find(p => p.id === req.params.id);
  if (!post) return res.status(404).json({ error: 'Post not found' });
  post.savedByMe = !post.savedByMe;
  post.saves += post.savedByMe ? 1 : -1;
  if (post.saves < 0) post.saves = 0;
  db.savePosts(posts);
  broadcastWsAll('post:engagement', { postId: post.id, saves: post.saves });
  res.json({ saves: post.saves, savedByMe: post.savedByMe });
});

app.post('/api/posts/:id/repost', (req, res) => {
  posts = db.getPosts();
  const post = posts.find(p => p.id === req.params.id);
  if (!post) return res.status(404).json({ error: 'Post not found' });
  post.repostedByMe = !post.repostedByMe;
  post.reposts += post.repostedByMe ? 1 : -1;
  if (post.reposts < 0) post.reposts = 0;
  db.savePosts(posts);
  broadcastWsAll('post:engagement', { postId: post.id, reposts: post.reposts });
  res.json({ reposts: post.reposts, repostedByMe: post.repostedByMe });
});

app.post('/api/posts/:id/share', (req, res) => {
  posts = db.getPosts();
  const post = posts.find(p => p.id === req.params.id);
  if (post) {
    post.shareCount = (post.shareCount || 0) + 1;
    db.savePosts(posts);
    broadcastWsAll('post:engagement', { postId: post.id, shareCount: post.shareCount });
    return res.json({ shareCount: post.shareCount });
  }
  res.json({ shareCount: 1 });
});

app.post('/api/posts/:id/comment', (req, res) => {
  const { content } = req.body;
  posts = db.getPosts();
  const post = posts.find(p => p.id === req.params.id);
  if (!post) return res.status(404).json({ error: 'Post not found' });
  if (!content) return res.status(400).json({ error: 'Comment content is required' });

  const authUser = getAuthUser(req);
  const author = authUser ? {
    id: authUser.id,
    name: authUser.name,
    avatar: authUser.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
    role: authUser.headline || authUser.role || 'Member',
    verified: Boolean(authUser.verified),
  } : {
    id: 'guest',
    name: 'COOK Member',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
    role: 'Member',
    verified: false,
  };

  const newComment: Comment = {
    id: `c-${Date.now()}`,
    author,
    content,
    timestamp: 'Just now',
    likes: 0,
  };

  post.comments.push(newComment);
  db.savePosts(posts);

  // Trigger comment notification to post author
  if (authUser && post.author?.id !== authUser.id) {
    const actorName = authUser.name || 'A builder';
    const commentSnippet = content.length > 50 ? content.substring(0, 50) + '...' : content;
    emitNotification({
      id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      recipientId: post.author?.id || 'all',
      actorId: authUser.id,
      actorName,
      actorAvatar: authUser.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
      type: 'comment',
      title: 'New comment on your post',
      message: `${actorName} commented: "${commentSnippet}"`,
      targetId: post.id,
      targetType: 'post',
      read: false,
      createdAt: Date.now(),
      timestamp: 'Just now',
    });
  }

  broadcastWsAll('post:engagement', { postId: post.id, commentsCount: post.comments.length });
  res.json({ comment: newComment });
});

app.delete('/api/posts/:id', (req, res) => {
  const success = db.deletePost(req.params.id);
  posts = db.getPosts();
  res.json({ success });
});

// Fundings: Real Persistent Venture Engine
app.get('/api/fundings', (req, res) => {
  const { stage, industry, search } = req.query;
  fundingRequests = db.getFundings();
  let result = [...fundingRequests];
  if (stage && stage !== 'all' && stage !== 'All') {
    result = result.filter(f => f.stage && f.stage.toLowerCase() === String(stage).toLowerCase());
  }
  if (industry && industry !== 'all' && industry !== 'All') {
    result = result.filter(f => f.industry && f.industry.toLowerCase().includes(String(industry).toLowerCase()));
  }
  if (search && typeof search === 'string' && search.trim()) {
    const q = search.toLowerCase();
    result = result.filter(
      f =>
        (f.startupName && f.startupName.toLowerCase().includes(q)) ||
        (f.tagline && f.tagline.toLowerCase().includes(q)) ||
        (f.description && f.description.toLowerCase().includes(q))
    );
  }
  res.json({ fundings: result });
});

app.post('/api/fundings', (req, res) => {
  const data = req.body;
  if (!data.startupName || !data.fundingGoal) {
    return res.status(400).json({ error: 'Startup name and funding goal required' });
  }

  const authUser = getAuthUser(req);
  const founderName = authUser?.name || data.founderName || 'COOK Founder';
  const founderAvatar = authUser?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80';

  const newFunding = {
    id: `fund-${Date.now()}`,
    userId: authUser?.id || 'guest',
    startupName: data.startupName,
    logo: data.logo || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80',
    founderName,
    founderAvatar,
    tagline: data.tagline || 'Next-generation venture cooking on COOK',
    description: data.description || '',
    problem: data.problem || '',
    solution: data.solution || '',
    targetAudience: data.targetAudience || '',
    industry: data.industry || 'Technology',
    stage: data.stage || 'MVP',
    fundingGoal: Number(data.fundingGoal) || 100000,
    amountRaised: Number(data.amountRaised) || 0,
    amountSeeking: Number(data.amountSeeking) || Number(data.fundingGoal) || 100000,
    equityOffered: data.equityOffered || '10%',
    runwayMonths: Number(data.runwayMonths) || 12,
    investorTypeSought: data.investorTypeSought || ['Angel Investor'],
    useOfFunds: data.useOfFunds || '',
    pitchDeckUrl: data.pitchDeckUrl || '',
    videoPitchUrl: data.videoPitchUrl || '',
    traction: data.traction || '',
    status: 'Seeking Funding',
    verified: Boolean(authUser?.verified),
    interestedCount: 0,
    savedCount: 0,
    tags: data.tags || ['Startup', 'Fundraising'],
    createdAt: Date.now(),
  };

  db.addFunding(newFunding);
  fundingRequests = db.getFundings();

  // Also publish an authentic announcement post to the feed
  const pitchPost: Post = {
    id: `post-${Date.now()}`,
    author: {
      id: authUser?.id || 'guest',
      name: newFunding.startupName,
      username: newFunding.startupName.toLowerCase().replace(/[^a-z0-9_]/g, ''),
      avatar: newFunding.logo,
      role: 'Startup | ' + newFunding.industry,
      verified: Boolean(authUser?.verified),
    },
    type: 'pitch',
    title: newFunding.tagline,
    content: newFunding.description || `Announcing our new funding round for ${newFunding.startupName} on COOK!`,
    tags: ['#Fundraising', '#Startups', `#${newFunding.stage.replace(/\s+/g, '')}`, `#${newFunding.industry.replace(/[^a-zA-Z0-9]/g, '')}`],
    startupDetails: {
      name: newFunding.startupName,
      tagline: newFunding.tagline,
      stage: newFunding.stage,
      industry: newFunding.industry,
      fundingGoal: `$${Number(newFunding.fundingGoal).toLocaleString()}`,
      equityOffered: newFunding.equityOffered,
      runway: `${newFunding.runwayMonths} months`,
      amountRaised: `$${Number(newFunding.amountRaised).toLocaleString()}`,
      teamNeeded: ['Founding Engineers', 'Early Collaborators'],
    },
    likes: 1,
    likedByMe: true,
    comments: [],
    reposts: 0,
    saves: 0,
    shareCount: 0,
    timestamp: 'Just now',
    category: 'Startups',
  };
  db.addPost(pitchPost);
  posts = db.getPosts();

  res.json({ funding: newFunding, post: pitchPost });
});

app.post('/api/fundings/:id/interest', (req, res) => {
  fundingRequests = db.getFundings();
  const fund = fundingRequests.find(f => f.id === req.params.id);
  if (!fund) return res.status(404).json({ error: 'Funding post not found' });
  const authUser = getAuthUser(req);
  fund.interestedCount = (fund.interestedCount || 0) + 1;
  db.saveFundings(fundingRequests);

  // Trigger funding interest notification to founder
  const actorName = authUser?.name || 'An investor';
  const newNotif = emitNotification({
    id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    recipientId: fund.userId || 'all',
    actorId: authUser?.id || 'investor',
    actorName,
    actorAvatar: authUser?.avatar || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    type: 'funding_interest',
    title: 'New Investor Interest! 🚀',
    message: `${actorName} expressed interest in backing ${fund.startupName}!`,
    targetId: fund.id,
    targetType: 'funding',
    read: false,
    createdAt: Date.now(),
    timestamp: 'Just now',
  });

  res.json({ success: true, interestedCount: fund.interestedCount, notification: newNotif });
});

// Messages (Real Persisted P2P Conversations with Privacy Enforcement & WebSocket Delivery)
app.get('/api/messages', (req, res) => {
  const authUser = getAuthUser(req);
  if (!authUser) return res.json({ messages: [] });
  const userMsgs = db.getMessagesForUser(authUser.id).map((m) => ({
    ...m,
    isMe: m.senderId === authUser.id,
  }));
  res.json({ messages: userMsgs });
});

app.post('/api/messages', (req, res) => {
  const { content, conversationId, recipientId, mediaUrl, isVoiceNote } = req.body;
  if (!content && !mediaUrl) return res.status(400).json({ error: 'Message content required' });

  const authUser = getAuthUser(req);
  if (!authUser) return res.status(401).json({ error: 'Sign in required to send messages' });

  if (recipientId) {
    const access = db.canUserInitiateChat(authUser.id, recipientId);
    if (!access.allowed) {
      return res.status(403).json({
        error: access.reason || 'Direct messaging is restricted by user privacy settings.',
        policy: access.policy,
      });
    }
  }

  const resolvedConvId =
    conversationId || (recipientId ? `dm_${[authUser.id, recipientId].sort().join('_')}` : 'general');

  const newMsg = {
    id: `msg-${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
    conversationId: resolvedConvId,
    senderId: authUser.id,
    recipientId: recipientId || null,
    senderName: authUser.name || 'COOK Member',
    senderAvatar: authUser.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
    content: content || (isVoiceNote ? '🎙️ Voice note' : 'Sent an attachment'),
    mediaUrl,
    isVoiceNote: Boolean(isVoiceNote),
    read: false,
    createdAt: Date.now(),
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  };
  db.addMessage(newMsg);

  // Push real-time message event to both sender and recipient sockets
  sendWsToUser(authUser.id, 'chat:message', {
    message: { ...newMsg, isMe: true },
  });
  if (recipientId && recipientId !== authUser.id) {
    sendWsToUser(recipientId, 'chat:message', {
      message: { ...newMsg, isMe: false },
    });

    emitNotification({
      id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      recipientId,
      actorId: authUser.id,
      actorName: authUser.name || 'COOK Member',
      actorAvatar: authUser.avatar || '',
      type: 'comment',
      title: 'New Direct Message',
      message: `${authUser.name} sent you a message: "${newMsg.content.substring(0, 60)}"`,
      targetId: authUser.id,
      targetType: 'messages',
      read: false,
      createdAt: Date.now(),
      timestamp: 'Just now',
    });
  }

  res.json({ message: { ...newMsg, isMe: true } });
});

app.post('/api/messages/read', (req, res) => {
  const authUser = getAuthUser(req);
  if (!authUser) return res.status(401).json({ error: 'Authentication required' });
  const { conversationId, partnerId } = req.body || {};
  if (!conversationId) return res.status(400).json({ error: 'conversationId required' });
  const updatedCount = db.markConversationRead(conversationId, authUser.id);
  if (updatedCount > 0 && partnerId) {
    sendWsToUser(partnerId, 'chat:read', {
      conversationId,
      readerId: authUser.id,
      readAt: Date.now(),
    });
  }
  res.json({ success: true, updatedCount });
});

// Chat Privacy Controls Endpoint (who can initiate chats & user blocking)
app.put('/api/chat/privacy', (req, res) => {
  const authUser = getAuthUser(req);
  if (!authUser) return res.status(401).json({ error: 'Authentication required' });

  const { chatInitiationPolicy, blockUserId, unblockUserId } = req.body || {};
  const currentPrivacy = authUser.privacySettings || {
    profileVisibility: 'public',
    showEmail: false,
    showEducationGrades: true,
    showFundingRequests: true,
    allowDirectMessages: true,
    chatInitiationPolicy: 'everyone',
    blockedUserIds: [],
  };

  let blockedUserIds: string[] = Array.isArray(currentPrivacy.blockedUserIds)
    ? [...currentPrivacy.blockedUserIds]
    : [];

  if (blockUserId && blockUserId !== authUser.id && !blockedUserIds.includes(blockUserId)) {
    blockedUserIds.push(blockUserId);
  }
  if (unblockUserId) {
    blockedUserIds = blockedUserIds.filter((id) => id !== unblockUserId);
  }

  const nextPolicy =
    chatInitiationPolicy === 'everyone' ||
    chatInitiationPolicy === 'connections_only' ||
    chatInitiationPolicy === 'nobody'
      ? chatInitiationPolicy
      : currentPrivacy.chatInitiationPolicy || 'everyone';

  const updatedUser = db.saveUser({
    ...authUser,
    privacySettings: {
      ...currentPrivacy,
      chatInitiationPolicy: nextPolicy,
      allowDirectMessages: nextPolicy !== 'nobody',
      blockedUserIds,
    },
  });

  res.json({
    success: true,
    privacySettings: updatedUser.privacySettings,
    user: updatedUser,
  });
});

// ==========================================
// REAL USER CONNECTIONS
// ==========================================
app.get('/api/connections', (req, res) => {
  const authUser = getAuthUser(req);
  if (!authUser) return res.json({ connectedUserIds: [] });
  res.json({ connectedUserIds: db.getConnectionsForUser(authUser.id) });
});

app.post('/api/connections/toggle', (req, res) => {
  const authUser = getAuthUser(req);
  if (!authUser) return res.status(401).json({ error: 'Authentication required' });
  const { targetUserId } = req.body;
  if (!targetUserId || targetUserId === authUser.id) {
    return res.status(400).json({ error: 'Valid target user required' });
  }
  const targetUser = db.getUser(targetUserId);
  if (!targetUser) return res.status(404).json({ error: 'User not found' });

  const result = db.toggleConnection(authUser.id, targetUserId);
  if (result.connected) {
    emitNotification({
      id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      recipientId: targetUserId,
      actorId: authUser.id,
      actorName: authUser.name || 'COOK Member',
      actorAvatar: authUser.avatar || '',
      type: 'follow',
      title: 'New Connection on COOK',
      message: `${authUser.name} connected with you!`,
      targetId: authUser.id,
      targetType: 'profile',
      read: false,
      createdAt: Date.now(),
      timestamp: 'Just now',
    });
  }
  res.json({ success: true, ...result });
});

// ==========================================
// NOTIFICATIONS REST ENDPOINTS (Strictly Real Per-User)
// ==========================================
app.get('/api/notifications', (req, res) => {
  const authUser = getAuthUser(req);
  if (!authUser) {
    return res.json({ notifications: [], unreadCount: 0 });
  }
  const notifications = db.getNotifications(authUser.id);
  const unreadCount = notifications.filter(n => !n.read).length;
  res.json({ notifications, unreadCount });
});

app.post('/api/notifications', (req, res) => {
  const authUser = getAuthUser(req);
  if (!authUser) return res.status(401).json({ error: 'Authentication required' });
  const { recipientId, actorName, actorAvatar, type, title, message, targetId, targetType } = req.body;
  if (!title || !message || !recipientId) {
    return res.status(400).json({ error: 'recipientId, title, and message required' });
  }
  const newNotif = emitNotification({
    id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    recipientId,
    actorId: authUser.id,
    actorName: actorName || authUser.name || 'COOK Member',
    actorAvatar: actorAvatar || authUser.avatar || '',
    type: type || 'system',
    title,
    message,
    targetId: targetId || null,
    targetType: targetType || null,
    read: false,
    createdAt: Date.now(),
    timestamp: 'Just now',
  });
  res.json({ success: true, notification: newNotif });
});

app.post('/api/notifications/:id/read', (req, res) => {
  const authUser = getAuthUser(req);
  const success = db.markNotificationRead(req.params.id, authUser?.id);
  res.json({ success });
});

app.post('/api/notifications/read-all', (req, res) => {
  const authUser = getAuthUser(req);
  const success = db.markAllNotificationsRead(authUser?.id);
  res.json({ success });
});

app.delete('/api/notifications', (req, res) => {
  const authUser = getAuthUser(req);
  const success = db.clearNotifications(authUser?.id);
  res.json({ success });
});

// ==========================================
// REAL SERVER STATUS & LIVE PEOPLE COUNTER
// ==========================================
app.get('/api/server/stats', (req, res) => {
  const stats = db.getPlatformStats();
  res.json({
    online: true,
    server: 'COOK Node.js Production Engine',
    port: 3000,
    onlineUsersNow: userSockets.size,
    ...stats,
  });
});

app.get('/api/users', (req, res) => {
  const authUser = getAuthUser(req);
  const myBlocked: string[] = authUser?.privacySettings?.blockedUserIds || [];

  const users = db.getAllUsers().map(u => {
    const policy =
      u.privacySettings?.allowDirectMessages === false
        ? 'nobody'
        : u.privacySettings?.chatInitiationPolicy || 'everyone';
    const access = authUser && u.id !== authUser.id
      ? db.canUserInitiateChat(authUser.id, u.id)
      : { allowed: true, reason: undefined, policy, isConnected: false, isBlocked: false };

    return {
      id: u.id,
      name: u.name,
      username: u.username,
      avatar: u.avatar,
      headline: u.headline,
      bio: u.bio,
      role: u.role || u.primaryRole,
      primaryRole: u.primaryRole || u.role,
      location: u.location,
      verified: Boolean(u.verified),
      postsCount: u.postsCount || 0,
      followersCount: u.followersCount || 0,
      connectionsCount: u.connectionsCount || 0,
      skills: u.skills || [],
      interests: u.interests || [],
      createdAt: u.createdAt,
      isOnline: userSockets.has(u.id),
      chatPrivacyPolicy: policy,
      canInitiateChat: access.allowed,
      chatBlockReason: access.reason,
      isConnected: access.isConnected,
      isBlockedByMe: myBlocked.includes(u.id),
    };
  });
  res.json({ users, count: users.length });
});

// ==========================================
// MODERATOR-ONLY ENDPOINTS (Strictly restricted to MODERATOR_EMAIL)
// Invisible to regular users; 403 Forbidden for any other account.
// ==========================================
app.get('/api/moderator/overview', (req, res) => {
  const authUser = getAuthUser(req);
  if (!authUser || !isModeratorUser(authUser)) {
    return res.status(403).json({ error: 'Forbidden: Moderator authorization required.' });
  }

  const allUsers = db.getAllUsers().map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    username: u.username,
    avatar: u.avatar,
    role: u.primaryRole || u.role,
    headline: u.headline,
    location: u.location,
    authProvider: u.authProvider,
    onboardingCompleted: Boolean(u.onboardingCompleted),
    profileCompletionPercentage: computeCompletion(u),
    postsCount: u.postsCount || 0,
    connectionsCount: u.connectionsCount || 0,
    createdAt: u.createdAt,
    updatedAt: u.updatedAt,
  }));

  const allPosts = db.getPosts();
  // Compute real-time trending tags from actual posts
  const tagCounts: Record<string, number> = {};
  const categoryCounts: Record<string, number> = {};
  allPosts.forEach((p: any) => {
    if (Array.isArray(p.tags)) {
      p.tags.forEach((tag: string) => {
        const clean = tag.startsWith('#') ? tag : `#${tag}`;
        tagCounts[clean] = (tagCounts[clean] || 0) + 1;
      });
    }
    if (p.category) {
      categoryCounts[p.category] = (categoryCounts[p.category] || 0) + 1;
    }
  });

  const trends = Object.entries(tagCounts)
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count);

  const categories = Object.entries(categoryCounts)
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count);

  res.json({
    moderatorEmail: MODERATOR_EMAIL,
    stats: db.getPlatformStats(),
    loginEvents: db.getLoginEvents(),
    users: allUsers,
    posts: allPosts,
    fundings: db.getFundings(),
    trends,
    categories,
    messages: db.getMessagesForUser(),
    settings: db.getModeratorSettings(),
  });
});

app.put('/api/moderator/settings', (req, res) => {
  const authUser = getAuthUser(req);
  if (!authUser || !isModeratorUser(authUser)) {
    return res.status(403).json({ error: 'Forbidden: Moderator authorization required.' });
  }
  const { spreadsheetId, spreadsheetUrl, sheetName, whatsappPhone, whatsappWebhookUrl } = req.body || {};
  const saved = db.saveModeratorSettings({
    ...(spreadsheetId !== undefined ? { spreadsheetId: String(spreadsheetId).trim() } : {}),
    ...(spreadsheetUrl !== undefined ? { spreadsheetUrl: String(spreadsheetUrl).trim() } : {}),
    ...(sheetName !== undefined ? { sheetName: String(sheetName).trim() || 'Logins' } : {}),
    ...(whatsappPhone !== undefined ? { whatsappPhone: String(whatsappPhone).trim() } : {}),
    ...(whatsappWebhookUrl !== undefined ? { whatsappWebhookUrl: String(whatsappWebhookUrl).trim() } : {}),
  });
  res.json({ success: true, settings: saved });
});

app.post('/api/moderator/message', (req, res) => {
  const authUser = getAuthUser(req);
  if (!authUser || !isModeratorUser(authUser)) {
    return res.status(403).json({ error: 'Forbidden: Moderator authorization required.' });
  }
  const { recipientId, content } = req.body || {};
  if (!recipientId || !content?.trim()) {
    return res.status(400).json({ error: 'Recipient and message content are required.' });
  }
  const targetUser = db.getUser(recipientId);
  if (!targetUser) {
    return res.status(404).json({ error: 'Recipient user not found.' });
  }

  const newMsg = {
    id: `msg-${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
    conversationId: `dm_${[authUser.id, recipientId].sort().join('_')}`,
    senderId: authUser.id,
    recipientId,
    senderName: authUser.name || 'COOK Moderator',
    senderAvatar: authUser.avatar || '',
    content: content.trim(),
    read: false,
    createdAt: Date.now(),
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  };
  db.addMessage(newMsg);

  sendWsToUser(authUser.id, 'chat:message', { message: { ...newMsg, isMe: true } });
  sendWsToUser(recipientId, 'chat:message', { message: { ...newMsg, isMe: false } });

  emitNotification({
    id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    recipientId,
    actorId: authUser.id,
    actorName: authUser.name || 'COOK Team',
    actorAvatar: authUser.avatar || '',
    type: 'system',
    title: 'Direct Message from COOK',
    message: content.trim(),
    targetId: authUser.id,
    targetType: 'messages',
    read: false,
    createdAt: Date.now(),
    timestamp: 'Just now',
  });

  res.json({ success: true, message: { ...newMsg, isMe: true } });
});

app.delete('/api/moderator/posts/:id', (req, res) => {
  const authUser = getAuthUser(req);
  if (!authUser || !isModeratorUser(authUser)) {
    return res.status(403).json({ error: 'Forbidden: Moderator authorization required.' });
  }
  const success = db.deletePost(req.params.id);
  posts = db.getPosts();
  res.json({ success });
});

// AI Startup Mentor with Gemini
app.post('/api/gemini/mentor', async (req, res) => {
  const { mode = 'idea_evaluation', ideaTitle, problem, solution, targetAudience, industry, stage, userQuery, history = [] } = req.body;

  if (!ai) {
    // Graceful fallback mock if API key isn't provided in development
    return res.json({
      success: true,
      mode,
      analysis: `### 🚀 AI Startup Mentor Evaluation: ${ideaTitle || 'Your Startup Concept'}\n\n**Executive Summary:**\nYour venture addresses a well-defined pain point in the **${industry || 'Emerging Tech'}** space. The value proposition of taking manual friction out of this workflow shows strong initial promise for early adopter stickiness.\n\n**Key Strengths:**\n- **Clear Problem Formulation:** Users actively lose time and money dealing with this.\n- **Direct Path to MVP:** Can be prototyped and validated within 14-21 days.\n- **Scalable Unit Economics:** Software margin model with high potential recurring revenues.\n\n**Critical Blindspots & Risks:**\n- Customer acquisition cost (CAC) inflation in standard paid channels.\n- Defensibility: How do you build a proprietary data flywheel before competitors copy the feature set?\n\n**Next 3 Actionable Milestones:**\n1. Conduct 15 structured problem-discovery interviews with ideal customers (do not pitch yet, validate the acute pain).\n2. Launch a high-converting COOK landing card and collect 100 early waitlist signups.\n3. Build a no-code or lightweight MVP focused exclusively on the single highest-value workflow.\n\n*(Note: Add your GEMINI_API_KEY in the Secrets panel to activate live Gemini 3.8 Flash intelligence!)*`,
    });
  }

  try {
    let prompt = '';
    const systemPrompt = `You are COOK AI — the elite, world-class startup mentor, venture partner, and product architect on the COOK social platform ("Got an Idea? Let It Cook.").
Your mission is to provide rigorous, actionable, brutally honest yet encouraging feedback to founders, builders, and entrepreneurs.
Always provide structured markdown with bold headers, bulleted action items, risk evaluations, and practical next steps. Avoid generic fluff. Give specific metrics, viral loops, and execution playbooks.`;

    switch (mode) {
      case 'idea_evaluation':
        prompt = `Evaluate this startup idea thoroughly:
Title: ${ideaTitle || 'Untitled Idea'}
Industry: ${industry || 'Tech'}
Stage: ${stage || 'Idea'}
Problem: ${problem || 'Not specified'}
Solution: ${solution || 'Not specified'}
Target Audience: ${targetAudience || 'General market'}

Please deliver:
1. **COOK Score (1-100)** with breakdown for (Market Size, Problem Urgency, Defensibility, Execution Speed).
2. **Deep Dive Analysis** of why this can win or fail.
3. **Core Risks & Countermeasures**.
4. **Monetization & Business Model Recommendations**.
5. **Day 1 to Day 30 Execution Plan** (MVP scope and customer validation).`;
        break;

      case 'pitch_deck_outline':
        prompt = `Generate a compelling 10-slide VC Pitch Deck outline for:
Title: ${ideaTitle}
Problem: ${problem}
Solution: ${solution}
Market: ${industry}

For each of the 10 slides, provide:
- Slide Title
- Key Visual / Graph idea
- The 1 sentence takeaway the investor must remember
- Bullet points of content`;
        break;

      case 'mvp_roadmap':
        prompt = `Create a tight, 4-week Lean MVP Roadmap for:
Startup: ${ideaTitle}
Problem & Solution: ${problem} -> ${solution}
Audience: ${targetAudience}

Focus on ruthlessly eliminating non-essential features and defining the single 'Hero Feature' that proves willingness to pay.`;
        break;

      case 'competitor_research':
        prompt = `Perform competitive landscape mapping and defensibility analysis for:
Product: ${ideaTitle} in ${industry}
Solution: ${solution}

Detail:
1. Direct Competitors
2. Indirect / Legacy Alternatives (e.g. Excel, Pen & Paper, Manual Agency)
3. Where the "White Space" lies
4. Moat Building Strategy (Data network effects, switching costs, brand).`;
        break;

      case 'chat':
      default:
        prompt = `Context:
Startup Idea: ${ideaTitle || 'New Venture'}
Problem: ${problem || 'N/A'}
Solution: ${solution || 'N/A'}

User's question to the COOK Mentor:
"${userQuery || 'How do I get my first 100 paying customers?'}"

Provide an insightful, founder-ready answer with specific examples and tactical steps.`;
        break;
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.7,
      },
    });

    res.json({
      success: true,
      mode,
      analysis: response.text || 'Analysis generated successfully.',
    });
  } catch (err: any) {
    console.error('Gemini Mentor Error:', err);
    res.status(500).json({
      error: 'Failed to generate mentor feedback',
      details: err?.message || 'Unknown error',
    });
  }
});

// Setup Vite in Dev mode or static files in Prod + Real-Time WebSocket Server
async function startServer() {
  const server = http.createServer(app);

  // Attach WebSocket server to the HTTP server on port 3000
  const wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (ws, req) => {
    try {
      const reqUrl = new URL(req.url || '/ws', `http://${req.headers.host || 'localhost'}`);
      const token = reqUrl.searchParams.get('token') || '';
      const session = db.getSession(token);
      if (!session) {
        ws.close(4001, 'Unauthorized');
        return;
      }

      const authUser = db.getUser(session.userId);
      if (!authUser) {
        ws.close(4001, 'User not found');
        return;
      }

      const userId = authUser.id;
      if (!userSockets.has(userId)) {
        userSockets.set(userId, new Set());
      }
      userSockets.get(userId)!.add(ws);

      // Send initial presence snapshot and broadcast online state
      ws.send(
        JSON.stringify({
          event: 'presence:update',
          payload: { onlineUserIds: Array.from(userSockets.keys()) },
        })
      );
      broadcastOnlinePresence();

      ws.on('message', (raw) => {
        try {
          const parsed = JSON.parse(raw.toString());
          const { event, payload } = parsed || {};

          if (event === 'chat:typing') {
            const { recipientId, conversationId, isTyping } = payload || {};
            if (recipientId && conversationId) {
              sendWsToUser(recipientId, 'chat:typing', {
                conversationId,
                senderId: userId,
                isTyping: Boolean(isTyping),
              });
            }
          } else if (event === 'chat:read') {
            const { conversationId, partnerId } = payload || {};
            if (conversationId) {
              const updatedCount = db.markConversationRead(conversationId, userId);
              if (updatedCount > 0 && partnerId) {
                sendWsToUser(partnerId, 'chat:read', {
                  conversationId,
                  readerId: userId,
                  readAt: Date.now(),
                });
              }
            }
          } else if (event === 'chat:send') {
            const { content, recipientId, conversationId, mediaUrl, isVoiceNote, clientTempId } = payload || {};
            if (!recipientId || (!content && !mediaUrl)) return;

            const access = db.canUserInitiateChat(userId, recipientId);
            if (!access.allowed) {
              ws.send(
                JSON.stringify({
                  event: 'chat:error',
                  payload: {
                    clientTempId,
                    error: access.reason || 'Messaging restricted by privacy settings.',
                  },
                })
              );
              return;
            }

            const sender = db.getUser(userId) || authUser;
            const resolvedConvId =
              conversationId || `dm_${[userId, recipientId].sort().join('_')}`;
            const newMsg = {
              id: `msg-${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
              conversationId: resolvedConvId,
              senderId: userId,
              recipientId,
              senderName: sender.name || 'COOK Member',
              senderAvatar: sender.avatar || '',
              content: content || (isVoiceNote ? '🎙️ Voice note' : 'Sent an attachment'),
              mediaUrl,
              isVoiceNote: Boolean(isVoiceNote),
              read: false,
              createdAt: Date.now(),
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            };
            db.addMessage(newMsg);

            sendWsToUser(userId, 'chat:message', {
              clientTempId,
              message: { ...newMsg, isMe: true },
            });
            if (recipientId !== userId) {
              sendWsToUser(recipientId, 'chat:message', {
                message: { ...newMsg, isMe: false },
              });
              emitNotification({
                id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
                recipientId,
                actorId: userId,
                actorName: sender.name || 'COOK Member',
                actorAvatar: sender.avatar || '',
                type: 'comment',
                title: 'New Direct Message',
                message: `${sender.name} sent you a message: "${newMsg.content.substring(0, 60)}"`,
                targetId: userId,
                targetType: 'messages',
                read: false,
                createdAt: Date.now(),
                timestamp: 'Just now',
              });
            }
          }
        } catch (msgErr) {
          // ignore malformed WS frames
        }
      });

      ws.on('close', () => {
        const set = userSockets.get(userId);
        if (set) {
          set.delete(ws);
          if (set.size === 0) {
            userSockets.delete(userId);
          }
        }
        broadcastOnlinePresence();
      });
    } catch (connErr) {
      ws.close(1011, 'Internal server error');
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: false },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  server.listen(PORT, () => {
    console.log(`COOK Server + WebSockets cooking on http://0.0.0.0:${PORT}`);
  });
}

if (!isServerless) {
  startServer();
}

export { app, startServer };
export default app;
