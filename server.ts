import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import { db, Story, StoryComment } from './server_db.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Ensure persistent uploads directory exists and is served statically
const uploadsDir = path.resolve(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));

// Real File Upload API - permanently writes uploaded files from computer/device to disk
app.post('/api/upload', (req, res) => {
  try {
    const { dataUrl, filename: reqFilename, name } = req.body;
    if (!dataUrl || typeof dataUrl !== 'string') {
      return res.status(400).json({ error: 'File data URL is required' });
    }

    const matches = dataUrl.match(/^data:([A-Za-z0-9-+/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      return res.status(400).json({ error: 'Invalid file data format' });
    }

    const mimeType = matches[1];
    const base64Data = matches[2];
    const buffer = Buffer.from(base64Data, 'base64');

    if (buffer.length > 25 * 1024 * 1024) {
      return res.status(400).json({ error: 'File size exceeds 25MB limit' });
    }

    let ext = 'jpg';
    if (mimeType.includes('png')) ext = 'png';
    else if (mimeType.includes('webp')) ext = 'webp';
    else if (mimeType.includes('gif')) ext = 'gif';
    else if (mimeType.includes('mp4')) ext = 'mp4';
    else if (mimeType.includes('webm')) ext = 'webm';
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

let posts: Post[] = [
  {
    id: 'post-1',
    author: {
      id: 'sarah-ahmed',
      name: 'Sarah Ahmed',
      username: 'sarah.design',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
      role: 'Product Designer | Creative Thinker',
      verified: true,
    },
    type: 'post',
    content: "Just launched my new design portfolio! 🚀 Worked on some exciting projects including a sustainable brand, mobile app UI, and illustrations. Would love your feedback! Let's build something bold together.",
    tags: ['#Design', '#UIUX', '#Portfolio', '#Creative', '#ProductDesign'],
    media: [
      {
        type: 'image',
        url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80',
        caption: 'Designs that make an impact',
      },
      {
        type: 'image',
        url: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&auto=format&fit=crop&q=80',
      },
      {
        type: 'image',
        url: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=800&auto=format&fit=crop&q=80',
      },
      {
        type: 'image',
        url: 'https://images.unsplash.com/photo-1542744094-24638eff58bb?w=800&auto=format&fit=crop&q=80',
      },
    ],
    likes: 243,
    likedByMe: true,
    comments: [
      {
        id: 'c-1',
        author: {
          name: 'Arjun Mehta',
          avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
          role: 'Full Stack Developer',
          verified: true,
        },
        content: 'The glassmorphic dashboard animations look pristine. Sent you a DM regarding a collaboration!',
        timestamp: '1h ago',
        likes: 14,
      },
      {
        id: 'c-2',
        author: {
          name: 'David Kim',
          avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
          role: 'Founder @ MedlAI',
          verified: false,
        },
        content: 'Love the typography hierarchy and color contrast. Very sharp!',
        timestamp: '30m ago',
        likes: 5,
      },
    ],
    reposts: 18,
    saves: 42,
    shareCount: 29,
    timestamp: '2h ago',
    category: 'Design & Creativity',
  },
  {
    id: 'post-2',
    author: {
      id: 'technova-team',
      name: 'TechNova',
      username: 'technova',
      avatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80',
      role: 'Startup | EdTech AI',
      verified: true,
    },
    type: 'pitch',
    title: 'AI-Powered Personalized Study Assistant',
    content: "We're building an AI study assistant that helps students learn 3x faster, understand complex concepts through interactive visual mental models, and track cognitive mastery. We're actively raising our Seed round!",
    tags: ['#Education', '#AI', '#EdTech', '#MVP', '#Fundraising'],
    media: [
      {
        type: 'image',
        url: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=80',
      },
    ],
    startupDetails: {
      name: 'TechNova',
      tagline: 'Hyper-personalized learning paths powered by cognitive AI',
      stage: 'MVP',
      industry: 'Education & AI',
      fundingGoal: '$250K',
      equityOffered: '12%',
      runway: '6 months',
      amountRaised: '$80K (32%)',
      teamNeeded: ['Senior Full-Stack Engineers', 'UI/UX Lead', 'Growth Marketer'],
    },
    likes: 186,
    likedByMe: false,
    comments: [
      {
        id: 'c-3',
        author: {
          name: 'Elena Rostova',
          avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
          role: 'Angel Investor @ BlueHorizon VC',
          verified: true,
        },
        content: 'Interesting traction metrics! Checked out your pitch deck. Requesting an intro call.',
        timestamp: '2h ago',
        likes: 21,
      },
    ],
    reposts: 24,
    saves: 56,
    shareCount: 45,
    timestamp: '3h ago',
    category: 'Startups',
  },
  {
    id: 'post-3',
    author: {
      id: 'david-kim',
      name: 'David Kim',
      username: 'davidkim',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
      role: 'Founder | Builder | Lifelong Learner',
      verified: true,
    },
    type: 'post',
    title: 'The Complete Guide to Building an MVP in 14 Days',
    content: 'Just published a detailed guide on building MVPs. Step-by-step guide to turn your raw idea into a working product without wasting 6 months in analysis paralysis. What was the hardest part when launching your first MVP?',
    tags: ['#Startups', '#MVP', '#BuildingInPublic', '#Product'],
    media: [
      {
        type: 'image',
        url: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=800&auto=format&fit=crop&q=80',
      },
    ],
    poll: {
      question: 'What is your biggest blocker to launching your MVP?',
      options: [
        { text: 'Finding technical co-founder', votes: 142 },
        { text: 'Securing initial pre-seed funding', votes: 98 },
        { text: 'Validating real customer demand', votes: 210 },
        { text: 'Building user acquisition loops', votes: 76 },
      ],
      totalVotes: 526,
      userVote: 2,
    },
    likes: 312,
    likedByMe: true,
    comments: [],
    reposts: 37,
    saves: 88,
    shareCount: 64,
    timestamp: '5h ago',
    category: 'Opportunities',
  },
  {
    id: 'post-4',
    author: {
      id: 'priya-sharma',
      name: 'Priya Sharma',
      username: 'priya_sharma',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      role: 'Artist | Designer | Dreamer',
      verified: true,
    },
    type: 'video',
    title: 'Digital Artwork Timelapse: Floating Solitude',
    content: 'Just finished my latest digital artwork! 🎨 Inspired by the beauty of nature and the calm it brings. Created with generative brushes and hand shading. What do you think? Would love to hear your thoughts! ✨',
    tags: ['#Art', '#DigitalArt', '#Nature', '#Creator', '#COOKClips'],
    media: [
      {
        type: 'video',
        url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
        aspect: '16:9',
      },
    ],
    likes: 248,
    likedByMe: true,
    comments: [],
    reposts: 34,
    saves: 61,
    shareCount: 19,
    timestamp: '2h ago',
    category: 'Design & Creativity',
  },
];

// Funding requests store
let fundingRequests = [
  {
    id: 'fund-1',
    startupName: 'TechNova',
    logo: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80',
    founderName: 'Arjun Mehta & Sneha Iyer',
    founderAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
    tagline: 'Cognitive AI platform generating dynamic interactive knowledge graphs for STEM students',
    description: 'TechNova solves the retention crisis in higher education by converting dense textbooks into interactive voice-and-simulation micro-modules. 12,000 active beta users across 14 universities.',
    problem: 'Students struggle with rote memorization and high drop-out rates in rigorous STEM courses without personalized feedback loops.',
    solution: 'Proprietary knowledge engine that parses syllabi and generates real-time interactive simulations and cognitive diagnostic quizzes.',
    targetAudience: 'University STEM students, higher-ed institutions, professional bootcamp learners.',
    industry: 'Education & AI',
    stage: 'MVP',
    fundingGoal: 250000,
    amountRaised: 80000,
    amountSeeking: 170000,
    equityOffered: '12%',
    runwayMonths: 6,
    investorTypeSought: ['Angel Investor', 'Seed Fund', 'Strategic Partner'],
    useOfFunds: '60% Product & Engineering hiring, 25% Growth & Campus Ambassador channels, 15% GPU Compute & Infrastructure.',
    pitchDeckUrl: 'https://technova.ai/deck.pdf',
    videoPitchUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    traction: '12k Monthly Active Students, 42% 30-day retention, $4.2K MRR organically.',
    status: 'Seeking Funding',
    verified: true,
    interestedCount: 38,
    savedCount: 94,
    tags: ['EdTech', 'Generative AI', 'STEM', 'B2C / B2B2C'],
  },
  {
    id: 'fund-2',
    startupName: 'NovaLearn',
    logo: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=150&auto=format&fit=crop&q=80',
    founderName: 'Sarah Ahmed & David Kim',
    founderAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    tagline: 'AI-Powered Adaptive Learning & Career Readiness Platform',
    description: 'NovaLearn partners with fast-scaling tech companies to create guaranteed-hire apprenticeship simulations powered by LLM mentors.',
    problem: 'Traditional tech bootcamps have 85% placement drop-off; companies spend $15k per entry hire onboarding.',
    solution: 'Simulated day-in-the-life code reviews, agile sprints, and real production pull request reviews scored in real-time.',
    targetAudience: 'Career changers, computer science graduates, hiring enterprise engineering managers.',
    industry: 'EdTech / HRTech',
    stage: 'Early Traction',
    fundingGoal: 500000,
    amountRaised: 190000,
    amountSeeking: 310000,
    equityOffered: '10%',
    runwayMonths: 12,
    investorTypeSought: ['Venture Capital', 'Angel Investor'],
    useOfFunds: '50% Enterprise Sales, 35% Platform R&D, 15% Operations.',
    pitchDeckUrl: 'https://novalearn.io/deck.pdf',
    videoPitchUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    traction: '$18k MRR, 4 signed corporate hiring partners, 150 placements.',
    status: 'In Discussion',
    verified: true,
    interestedCount: 64,
    savedCount: 142,
    tags: ['HRTech', 'Enterprise', 'Workforce', 'AI Coaching'],
  },
  {
    id: 'fund-3',
    startupName: 'GreenCycle',
    logo: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=150&auto=format&fit=crop&q=80',
    founderName: 'Marcus Vance',
    founderAvatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80',
    tagline: 'Automated Computer-Vision Optical Sorting for Plastic Recycling Facilities',
    description: 'Hardware + AI edge units that increase recycled polymer purity by 40%, unlocking tier-1 food packaging resale.',
    problem: '91% of plastic waste is downcycled or landfilled due to polymer contamination in optical sorting streams.',
    solution: 'High-speed hyperspectral computer vision sensors mounted on retrofitted sorter lines at 1/5th traditional cost.',
    targetAudience: 'Municipal waste recovery facilities, global plastics reclaimers.',
    industry: 'CleanTech & Hardware',
    stage: 'Prototype',
    fundingGoal: 350000,
    amountRaised: 110000,
    amountSeeking: 240000,
    equityOffered: '15%',
    runwayMonths: 8,
    investorTypeSought: ['Climate Fund', 'Seed Fund', 'Grant Provider'],
    useOfFunds: 'Pilot deployments, sensor fabrication, patent filings.',
    pitchDeckUrl: 'https://greencycle.eco/deck.pdf',
    videoPitchUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    traction: 'LOIs from 3 regional recycling plants, patent pending.',
    status: 'Seeking Funding',
    verified: true,
    interestedCount: 29,
    savedCount: 71,
    tags: ['CleanTech', 'Computer Vision', 'Robotics', 'Hardware'],
  },
  {
    id: 'fund-4',
    startupName: 'MedlAI',
    logo: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=150&auto=format&fit=crop&q=80',
    founderName: 'Dr. Evelyn Tan & Alex Chen',
    founderAvatar: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150&auto=format&fit=crop&q=80',
    tagline: 'Ambient Clinical AI Assistant for Specialty Ambulatory Clinics',
    description: 'Translates physician-patient dialogues into structured EHR medical charts and pre-authorization submissions in seconds.',
    problem: 'Doctors spend 2.5 hours per day on clerical paperwork, burning out and reducing patient capacity.',
    solution: 'HIPAA-compliant, multi-accent ambient voice scribe fine-tuned on 20+ medical sub-specialties.',
    targetAudience: 'Private specialty clinics, orthopedic groups, oncology networks.',
    industry: 'HealthTech & AI',
    stage: 'Revenue Generating',
    fundingGoal: 750000,
    amountRaised: 450000,
    amountSeeking: 300000,
    equityOffered: '8%',
    runwayMonths: 14,
    investorTypeSought: ['HealthTech VC', 'Strategic Partner', 'Angel Syndicate'],
    useOfFunds: 'SOC2 Type II compliance, EHR integrations, sales team.',
    pitchDeckUrl: 'https://medlai.health/deck.pdf',
    videoPitchUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
    traction: '$42K ARR, 90 daily physician users, 0 churn across 6 months.',
    status: 'Seeking Funding',
    verified: true,
    interestedCount: 52,
    savedCount: 118,
    tags: ['HealthTech', 'B2B SaaS', 'Speech AI', 'Medical'],
  },
];

// COOK Clips store
let clips = [
  {
    id: 'clip-1',
    creator: {
      name: 'Priya Sharma',
      username: 'priya_sharma',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      role: 'Creative Technologist',
      verified: true,
    },
    title: 'How we built a 100k user app with zero ad spend 💡',
    description: 'Here are the 3 viral loop strategies we engineered straight into our product onboarding. #buildinpublic #startups #growth',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    likes: 4210,
    commentsCount: 382,
    sharesCount: 914,
    views: '89.4K',
    tags: ['#startups', '#viral', '#growth', '#mvp'],
  },
  {
    id: 'clip-2',
    creator: {
      name: 'Arjun Mehta',
      username: 'arjun_builds',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
      role: 'Founder & Full-Stack Lead',
      verified: true,
    },
    title: 'Pitching your seed round? Never say these 3 things to VCs! 🚫',
    description: 'Top mistakes early founders make when discussing TAM, competitors, and valuation caps. Watch till the end! #venturecapital #pitch',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
    likes: 8940,
    commentsCount: 712,
    sharesCount: 1820,
    views: '142K',
    tags: ['#fundraising', '#investors', '#pitchdeck'],
  },
  {
    id: 'clip-3',
    creator: {
      name: 'NovaLearn Engineering',
      username: 'novalearn_hq',
      avatar: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=150&auto=format&fit=crop&q=80',
      role: 'EdTech Creators',
      verified: true,
    },
    title: 'Live product demo: Generating real-time code sandboxes with AI ⚡️',
    description: 'Peek behind our reactive container architecture. Latency went from 8s down to 240ms! #tech #engineering #ai',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyBlazes.mp4',
    likes: 3120,
    commentsCount: 198,
    sharesCount: 654,
    views: '54.2K',
    tags: ['#coding', '#software', '#techdemo'],
  },
];

// Messages store
let messages = [
  {
    id: 'msg-1',
    conversationId: 'conv-1',
    senderId: 'sarah-ahmed',
    senderName: 'Sarah Ahmed',
    senderAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    content: "Hey Arjun! Loved your latest post on TechNova. Are you open to discussing the UI system for the mobile app?",
    timestamp: '10:42 AM',
    isMe: false,
  },
  {
    id: 'msg-2',
    conversationId: 'conv-1',
    senderId: 'me',
    senderName: 'Arjun Mehta',
    senderAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
    content: "Hey Sarah! Absolutely. We're finalizing the design tokens right now. Would love to hop on a quick COOK video call today?",
    timestamp: '10:45 AM',
    isMe: true,
  },
  {
    id: 'msg-3',
    conversationId: 'conv-1',
    senderId: 'sarah-ahmed',
    senderName: 'Sarah Ahmed',
    senderAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    content: "Sounds great! Ready whenever you hit the call button.",
    timestamp: '10:48 AM',
    isMe: false,
  },
];

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
    <loc>${host}/profile/arjun_builds</loc>
    <changefreq>weekly</changefreq>
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

    return res.json({
      success: true,
      token,
      user,
      isNewUser,
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

    return res.json({
      success: true,
      token,
      user,
      isNewUser: true,
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

    return res.json({
      success: true,
      token,
      user,
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

  const updates = req.body;

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
    name: finalName.trim(),
    username: finalUsername.trim().toLowerCase(),
    headline: finalHeadline.trim(),
    bio: finalBio.trim(),
    onboardingCompleted: true,
    onboardingStep: 2,
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

// Update Authenticated User Profile
app.put('/api/profile', (req, res) => {
  const user = getAuthUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const updates = req.body;
  const merged = {
    ...user,
    ...updates,
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

// Communities Endpoints
app.get('/api/communities', (req, res) => {
  res.json({ communities: db.getCommunities() });
});

app.put('/api/communities/:id', (req, res) => {
  const updated = db.updateCommunity(req.params.id, req.body);
  res.json({ success: true, community: updated });
});

app.get('/api/profile/:username', (req, res) => {
  const { username } = req.params;
  const user = db.getUserByUsername(username) || (username === 'me' ? getAuthUser(req) : null);
  if (user) {
    return res.json({ user });
  }

  // Other known users
  const knownProfiles: Record<string, any> = {
    sarah_ahmed: {
      id: 'sarah-ahmed',
      name: 'Sarah Ahmed',
      username: 'sarah_ahmed',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=80',
      coverImage: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=1600&auto=format&fit=crop&q=80',
      role: 'Designer',
      primaryRole: 'Lead Product Designer',
      headline: 'Product Designer & Design Systems Lead • Creating high-fidelity interactions',
      bio: 'Crafting spatial interfaces, design tokens, and digital brand experiences for venture-backed teams.',
      location: 'New York, NY',
      website: 'https://sarahahmed.design',
      verified: true,
      followersCount: 1890,
      followingCount: 340,
      connectionsCount: 1220,
      skills: ['UI/UX Design', 'Design Systems', 'Figma', 'Prototyping', 'User Research'],
      skillItems: [
        { id: 's1', name: 'UI/UX Design', category: 'Design and Creativity', proficiency: 'Expert', endorsementsCount: 34, featured: true },
        { id: 's2', name: 'Design Systems', category: 'Design and Creativity', proficiency: 'Expert', endorsementsCount: 28, featured: true },
      ],
      experience: [
        {
          id: 'e1',
          title: 'Design Director',
          company: 'Studio Lumina',
          employmentType: 'Full-time',
          workplaceType: 'Hybrid',
          startDate: '2022',
          endDate: 'Present',
          current: true,
          description: 'Leading product design for 8 consumer and enterprise SaaS products.',
        },
      ],
      education: [
        {
          id: 'ed1',
          institution: 'Rhode Island School of Design (RISD)',
          degree: 'BFA in Graphic Design',
          fieldOfStudy: 'Interactive Media',
          qualificationType: 'Undergraduate Degree',
          startDate: '2016',
          endDate: '2020',
          currentlyStudying: false,
        },
      ],
    },
  };

  const found = knownProfiles[username];
  if (found) {
    return res.json({ user: found });
  }

  // Generic fallback public profile
  return res.json({
    user: {
      id: `user-${username}`,
      name: username.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      username,
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
      coverImage: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1600&auto=format&fit=crop&q=80',
      role: 'Startup enthusiast',
      headline: 'Founder & Builder on COOK',
      bio: 'Excited about building the next wave of startups on COOK.',
      location: 'Global',
      verified: false,
      followersCount: 42,
      followingCount: 65,
      connectionsCount: 30,
      skills: ['Startups', 'Product', 'Innovation'],
      experience: [],
      education: [],
    },
  });
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

// Posts
app.get('/api/posts', (req, res) => {
  const { filter, search } = req.query;
  let result = [...posts];

  if (filter === 'Following') {
    result = result.filter(p => p.author.name === 'Sarah Ahmed' || p.author.name === 'David Kim');
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
  const { content, type = 'post', title, tags = [], media = [], startupDetails, poll } = req.body;
  if (!content) {
    return res.status(400).json({ error: 'Content is required' });
  }

  const newPost: Post = {
    id: `post-${Date.now()}`,
    author: {
      id: 'me',
      name: 'Arjun Mehta',
      username: 'arjun_builds',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
      role: 'Full Stack Developer | Builder',
      verified: true,
    },
    type,
    title,
    content,
    tags: tags.length ? tags : ['#Cooking', '#Startups'],
    media,
    likes: 1,
    likedByMe: true,
    comments: [],
    reposts: 0,
    saves: 0,
    shareCount: 0,
    timestamp: 'Just now',
    category: type === 'pitch' ? 'Startups' : 'Tech',
    startupDetails,
    poll,
  };

  posts.unshift(newPost);
  res.json({ post: newPost });
});

app.post('/api/posts/:id/like', (req, res) => {
  const post = posts.find(p => p.id === req.params.id);
  if (!post) return res.status(404).json({ error: 'Post not found' });
  post.likedByMe = !post.likedByMe;
  post.likes += post.likedByMe ? 1 : -1;
  res.json({ likes: post.likes, likedByMe: post.likedByMe });
});

app.post('/api/posts/:id/save', (req, res) => {
  const post = posts.find(p => p.id === req.params.id);
  if (!post) return res.status(404).json({ error: 'Post not found' });
  post.savedByMe = !post.savedByMe;
  post.saves += post.savedByMe ? 1 : -1;
  res.json({ saves: post.saves, savedByMe: post.savedByMe });
});

app.post('/api/posts/:id/repost', (req, res) => {
  const post = posts.find(p => p.id === req.params.id);
  if (!post) return res.status(404).json({ error: 'Post not found' });
  post.repostedByMe = !post.repostedByMe;
  post.reposts += post.repostedByMe ? 1 : -1;
  res.json({ reposts: post.reposts, repostedByMe: post.repostedByMe });
});

app.post('/api/posts/:id/share', (req, res) => {
  const post = posts.find(p => p.id === req.params.id);
  if (post) {
    post.shareCount = (post.shareCount || 0) + 1;
    return res.json({ shareCount: post.shareCount });
  }
  res.json({ shareCount: 1 });
});

app.post('/api/posts/:id/comment', (req, res) => {
  const { content } = req.body;
  const post = posts.find(p => p.id === req.params.id);
  if (!post) return res.status(404).json({ error: 'Post not found' });
  if (!content) return res.status(400).json({ error: 'Comment content is required' });

  const newComment: Comment = {
    id: `c-${Date.now()}`,
    author: {
      name: 'Arjun Mehta',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
      role: 'Full Stack Developer',
      verified: true,
    },
    content,
    timestamp: 'Just now',
    likes: 0,
  };

  post.comments.push(newComment);
  res.json({ comment: newComment });
});

app.delete('/api/posts/:id', (req, res) => {
  const initialLen = posts.length;
  posts = posts.filter(p => p.id !== req.params.id);
  res.json({ success: posts.length < initialLen });
});

// Fundings
app.get('/api/fundings', (req, res) => {
  const { stage, industry, search } = req.query;
  let result = [...fundingRequests];
  if (stage && stage !== 'all') {
    result = result.filter(f => f.stage.toLowerCase() === String(stage).toLowerCase());
  }
  if (industry && industry !== 'all') {
    result = result.filter(f => f.industry.toLowerCase().includes(String(industry).toLowerCase()));
  }
  if (search && typeof search === 'string') {
    const q = search.toLowerCase();
    result = result.filter(
      f =>
        f.startupName.toLowerCase().includes(q) ||
        f.tagline.toLowerCase().includes(q) ||
        f.description.toLowerCase().includes(q)
    );
  }
  res.json({ fundings: result });
});

app.post('/api/fundings', (req, res) => {
  const data = req.body;
  if (!data.startupName || !data.fundingGoal) {
    return res.status(400).json({ error: 'Startup name and funding goal required' });
  }

  const newFunding = {
    id: `fund-${Date.now()}`,
    startupName: data.startupName,
    logo: data.logo || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80',
    founderName: data.founderName || 'Arjun Mehta',
    founderAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
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
    verified: false,
    interestedCount: 1,
    savedCount: 0,
    tags: data.tags || ['Startup', 'Fundraising'],
  };

  fundingRequests.unshift(newFunding);

  // Also publish an announcement post to the feed automatically!
  const pitchPost: Post = {
    id: `post-${Date.now()}`,
    author: {
      id: 'me',
      name: newFunding.startupName,
      username: newFunding.startupName.toLowerCase().replace(/\s+/g, ''),
      avatar: newFunding.logo,
      role: 'Startup | ' + newFunding.industry,
      verified: true,
    },
    type: 'pitch',
    title: newFunding.tagline,
    content: newFunding.description,
    tags: ['#Fundraising', '#Startups', `#${newFunding.stage}`, `#${newFunding.industry.replace(/\s+/g, '')}`],
    startupDetails: {
      name: newFunding.startupName,
      tagline: newFunding.tagline,
      stage: newFunding.stage,
      industry: newFunding.industry,
      fundingGoal: `$${Number(newFunding.fundingGoal).toLocaleString()}`,
      equityOffered: newFunding.equityOffered,
      runway: `${newFunding.runwayMonths} months`,
      amountRaised: `$${Number(newFunding.amountRaised).toLocaleString()} (${Math.round((newFunding.amountRaised / newFunding.fundingGoal) * 100)}%)`,
      teamNeeded: ['Founding Engineers', 'Growth Marketer'],
    },
    likes: 12,
    likedByMe: true,
    comments: [],
    reposts: 2,
    saves: 5,
    shareCount: 0,
    timestamp: 'Just now',
    category: 'Startups',
  };
  posts.unshift(pitchPost);

  res.json({ funding: newFunding, post: pitchPost });
});

app.post('/api/fundings/:id/interest', (req, res) => {
  const fund = fundingRequests.find(f => f.id === req.params.id);
  if (!fund) return res.status(404).json({ error: 'Funding post not found' });
  fund.interestedCount += 1;
  res.json({ success: true, interestedCount: fund.interestedCount });
});

// Clips
app.get('/api/clips', (req, res) => {
  res.json({ clips });
});

app.post('/api/clips', (req, res) => {
  const { title, description, videoUrl, tags = [] } = req.body;
  if (!title || !videoUrl) return res.status(400).json({ error: 'Title and video required' });

  const newClip = {
    id: `clip-${Date.now()}`,
    creator: {
      name: 'Arjun Mehta',
      username: 'arjun_builds',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
      role: 'Full Stack Developer',
      verified: true,
    },
    title,
    description: description || '',
    videoUrl,
    likes: 1,
    commentsCount: 0,
    sharesCount: 0,
    views: '1',
    tags,
  };
  clips.unshift(newClip);
  res.json({ clip: newClip });
});

// Messages
app.get('/api/messages', (req, res) => {
  res.json({ messages });
});

app.post('/api/messages', (req, res) => {
  const { content, conversationId = 'conv-1', mediaUrl, isVoiceNote } = req.body;
  if (!content && !mediaUrl) return res.status(400).json({ error: 'Message content required' });

  const newMsg = {
    id: `msg-${Date.now()}`,
    conversationId,
    senderId: 'me',
    senderName: 'Arjun Mehta',
    senderAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
    content: content || (isVoiceNote ? '🎙️ Voice note' : 'Sent an attachment'),
    mediaUrl,
    isVoiceNote: Boolean(isVoiceNote),
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    isMe: true,
  };
  messages.push(newMsg);
  res.json({ message: newMsg });
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

// Setup Vite in Dev mode or static files in Prod
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`COOK Server cooking on http://0.0.0.0:${PORT}`);
  });
}

startServer();
