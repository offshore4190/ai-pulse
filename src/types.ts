export type Persona = 'student' | 'investor';
export type Language = 'en' | 'zh';

export type PodcastVoiceTone = 'youth' | 'middle' | 'elder' | 'gentle' | 'sunny' | 'professional';
export interface PodcastChapter {
  id: string;
  title: string;
  content: string;
  order: number;
}
export interface PodcastScript {
  title: string;
  intro?: string;
  chapters: PodcastChapter[];
  outro?: string;
  generatedAt: string;
}
export interface VoiceToneOption {
  value: PodcastVoiceTone;
  label: string;
  labelEn: string;
  icon: string;
  desc: string;
}
export type Discipline = 'humanities' | 'science' | 'engineering' | 'business';

export interface MajorInsight {
  discipline: Discipline;
  title: string;
  content: string;
  trend: string;
  url: string;
  timestamp?: string;
}

export interface Metric {
  label: string;
  value: string;
  change?: string;
  isPositive?: boolean;
}

export interface NewsItem {
  id: string;
  type: 'product' | 'funding' | 'policy' | 'tech' | 'research';
  title: string;
  context: string;
  source: string;
  takeaway: string; // "Investment Perspective" or "Learning Perspective"
  timestamp: string;
  url: string;
  /** ISO 8601 string: when the information source first published */
  sourceFirstPublishedAt?: string;
}

export interface SocialSignal {
  id: string;
  author: {
    name: string;
    handle: string;
    avatar: string;
    role: string;
    followers: string;
  };
  content: string;
  interpretation: string;
  timestamp?: string;
  url: string;
}

export interface TodaySignal {
  title: string;
  description: string;
  takeaway: string;
  url: string;
  timestamp?: string;
}

export interface Deal {
  company: string;
  stage: string;
  description: string;
  investors: string[];
  amount: string;
  timestamp?: string;
  url: string;
}

export interface TopicHeat {
  name: string;
  status: 'high' | 'rising';
  insight: string;
}

export interface AgentIntro {
  name: string;
  category: string;
  features: string[];
  description: string;
  url: string;
}

export interface SideHustle {
  id: string;
  title: string;
  income: string;
  description: string;
  steps: string[];
}

export interface PeerStory {
  author: {
    name: string;
    avatar: string;
    school: string;
    status: string;
  };
  title: string;
  content: string;
  funding: string;
  takeaway: string;
  timestamp?: string;
}

export interface SoloEntrepreneur {
  id: string;
  name: string;
  role: string;
  avatar: string;
  project: string;
  revenue: string;
  stack: string[];
  insight: string;
  url: string;
  timestamp?: string;
}

export interface MajorDeepDive {
  papers: NewsItem[];
  majorNews: NewsItem[];
  forums: { name: string; url: string; description: string }[];
}

/** User stats for AI literacy points and reading streak */
export interface UserStats {
  aiLiteracyPoints: number;
  lastReadDate: string;  // ISO date string YYYY-MM-DD
  currentStreakDays: number;
  totalReadDays?: number;
  recordedToday?: boolean;  // whether we already added daily-visit points today
}

/** No Pretending - I Use AI Too WebSocket message */
export interface CampusVoiceMessage {
  id: string;
  user: string;
  text: string;
  timestamp: string;
}

/** Translation keys shared between en/zh */
export type TranslationKeys = {
  investor: string;
  student: string;
  todaySignal: string;
  readAnalysis: string;
  intelligenceStream: string;
  viewAll: string;
  socialSignals: string;
  keyDeals: string;
  learningPath: string;
  topicRadar: string;
  upcoming: string;
  interpretation: string;
  signal: string;
  action: string;
  actionStudent?: string;
  footerDesc: string;
  product: string;
  company: string;
  subscribe: string;
  join: string;
  rights: string;
  live: string;
  resource: string;
  minRead: string;
  globalEvent: string;
  virtual: string;
  aiPlusMajor: string;
  agentDirectory: string;
  agentCategory: string;
  agentFeatures: string;
  visitSite: string;
  humanities: string;
  science: string;
  engineering: string;
  business: string;
  futureTrend: string;
  errorTitle: string;
  errorDesc: string;
  retry: string;
  switchKey: string;
  demoMode: string;
  demoNotice: string;
  papers: string;
  majorNews: string;
  forums: string;
  backToDashboard: string;
  deepDiveTitle: string;
  viewPost: string;
  campusVoice: string;
  campusVoiceDesc: string;
  sharePlaceholder: string;
  post: string;
  anonymous: string;
  complianceNotice: string;
  sideHustleTitle: string;
  lowCostStart: string;
  peerStoryTitle: string;
  weeklyStory: string;
  whatYouCanLearn: string;
  income: string;
  funding: string;
  soloEntrepreneurTitle: string;
  indieMaker: string;
  todayActionTitle: string;
  todayActionBadge: string;
  todayActionBadgeStudent?: string;
  dailyPromptTitle: string;
  featuredBadge: string;
  featuredSubmitHint: string;
  myProfile: string;
  myProfileFloat: string;
  aiLiteracyPoints: string;
  continuousReadDays: string;
  totalReadDays: string;
  bakeTime: string;
  pointsEarnHint: string;
  streakSuffix: string;
  appTagline: string;
  dailyBriefing: string;
  marketSignals: string;
  about: string;
  contact: string;
  privacy: string;
  emailPlaceholder: string;
  verifiedSources: string;
  readFullPaper: string;
  activeCommunity: string;
  podcastDaily: string;
  voiceTone: string;
  generateScript: string;
  chapterNav: string;
  generating: string;
  podcastEmptyHint: string;
  podcastPlay: string;
  podcastPause: string;
  podcastNowPlaying: string;
  revenue: string;
  project: string;
  recent: string;
  sourceFirstPublished: string;
  switchToEnglish: string;
  switchToChinese: string;
  twitter: string;
  linkedIn: string;
  discord: string;
  fetchError: string;
  apiKeyUnavailable: string;
  profileButton: string;
}

export interface DashboardData {
  todaySignal: TodaySignal;
  metrics: Metric[];
  news: NewsItem[];
  socialSignals: SocialSignal[];
  deals?: Deal[]; // Investor only
  learningResources?: NewsItem[]; // Student only
  topics: TopicHeat[];
  calendar: { date: string; event: string }[];
  majorInsights?: MajorInsight[];
  majorInsightsUrl?: string;
  majorDeepDive?: MajorDeepDive;
  agentIntros?: AgentIntro[];
  sideHustles?: SideHustle[]; // Student only
  peerStory?: PeerStory; // Student only
  soloEntrepreneurs?: SoloEntrepreneur[]; // Student only
  todayAction?: string; // Student only，一句话行动建议
  dailyPrompt?: string; // Student only，每日社区征集问题
  isDemo?: boolean;
  producedAt?: string; // ISO format
  isBreakingNews?: boolean;
}

declare global {
  interface Window {
    aistudio?: {
      hasSelectedApiKey: () => Promise<boolean>;
      openSelectKey: () => Promise<void>;
    };
  }
}
