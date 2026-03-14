import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  TrendingUp, 
  TrendingDown, 
  Zap, 
  MessageSquare, 
  Calendar, 
  Briefcase, 
  GraduationCap, 
  Globe, 
  Search,
  ChevronRight,
  Share2,
  Bookmark,
  ExternalLink,
  Cpu,
  BarChart3,
  Languages,
  BookOpen,
  FlaskConical,
  Settings,
  PieChart,
  ArrowLeft,
  Users,
  AlertCircle,
  Send,
  ShieldCheck,
  Coins,
  Lightbulb,
  Rocket,
  Flame,
  Award,
  Headphones
} from 'lucide-react';
import { Persona, DashboardData, Language, Discipline, AgentIntro, UserStats } from './types';
import { useLanguage } from './contexts/LanguageContext';
import { fetchDashboardData, prefetchNextData } from './services/geminiService';
import { getUserStats, recordReadAction, addPoints } from './services/userStatsService';
import DynamicBackground from './components/DynamicBackground';
import PodcastDailyView from './components/PodcastDailyView';

const FALLBACK_AGENTS_EN: AgentIntro[] = [
  { name: "ChatGPT", category: "Assistant", features: ["Multi-turn dialogue", "Code generation", "Analysis"], description: "OpenAI's flagship conversational AI for research, writing, and analysis.", url: "https://chat.openai.com/" },
  { name: "Perplexity", category: "Search", features: ["Real-time search", "Source citations"], description: "AI-powered search engine that provides direct answers with sources.", url: "https://www.perplexity.ai/" },
  { name: "Cursor", category: "Coding", features: ["AI code editor", "Codebase context", "Auto-complete"], description: "AI-powered code editor that understands your entire codebase.", url: "https://cursor.sh/" },
];
const FALLBACK_AGENTS_ZH: AgentIntro[] = [
  { name: "ChatGPT", category: "助手", features: ["多轮对话", "代码生成", "分析"], description: "OpenAI 旗舰对话 AI，用于研究、写作与分析。", url: "https://chat.openai.com/" },
  { name: "Perplexity", category: "搜索", features: ["实时搜索", "来源引用"], description: "提供直接答案与来源的 AI 搜索引擎。", url: "https://www.perplexity.ai/" },
  { name: "Cursor", category: "编程", features: ["AI 代码编辑器", "代码库上下文", "自动补全"], description: "理解你整个代码库的 AI 代码编辑器。", url: "https://cursor.sh/" },
];

const translations = {
// ... existing translations ...
// ... existing translations ...
  en: {
    investor: 'Investor',
    student: 'Student',
    todaySignal: "Heavy Hitter",
    readAnalysis: 'Read Full Analysis',
    intelligenceStream: 'Research Dark Brew',
    viewAll: 'View All',
    socialSignals: 'Social Signals',
    keyDeals: 'Key Deals',
    learningPath: 'Growth Recipe',
    topicRadar: 'Hot Topic Latte Art',
    upcoming: 'Upcoming',
    interpretation: 'Interpretation',
    signal: 'Signal',
    action: 'Action',
    actionStudent: 'Do This Today',
    footerDesc: 'High-fidelity intelligence for the next generation of builders and backers.',
    product: 'Product',
    company: 'Company',
    subscribe: 'Subscribe',
    join: 'Join',
    rights: 'All rights reserved.',
    live: 'LIVE',
    resource: 'Resource',
    minRead: 'min read',
    globalEvent: 'Global Event',
    virtual: 'Virtual',
    aiPlusMajor: 'Major Special Blend',
    agentDirectory: 'Self-Service Bar',
    agentCategory: 'Category',
    agentFeatures: 'Key Features',
    visitSite: 'Visit Website',
    humanities: 'Humanities',
    science: 'Science',
    engineering: 'Engineering',
    business: 'Business',
    futureTrend: 'Future Trend',
    errorTitle: 'Research Dark Brew Interrupted',
    errorDesc: 'We have exceeded the current API quota. Please wait a moment or switch to a paid API key for uninterrupted service.',
    retry: 'Retry Connection',
    switchKey: 'Switch to Paid API Key',
    demoMode: 'Demo Mode',
    demoNotice: 'Live feed paused due to quota. Showing cached/example data.',
    papers: 'Research Papers',
    majorNews: 'Major-Specific News',
    forums: 'Community Forums',
    backToDashboard: 'Back to Dashboard',
    deepDiveTitle: 'Major Special Blend Deep Dive',
    viewPost: 'View Post',
    campusVoice: 'No Pretending - I Use AI Too',
    campusVoiceDesc: 'Share your AI insights with fellow students.',
    sharePlaceholder: 'What AI breakthrough did you discover today?',
    post: 'Post',
    anonymous: 'Anonymous',
    complianceNotice: 'Please stay respectful. Content is moderated for community safety.',
    sideHustleTitle: 'Side Hustle Iced Brew',
    lowCostStart: 'Low Cost Start',
    peerStoryTitle: 'Global Coffee Fellows',
    weeklyStory: 'Weekly Story',
    whatYouCanLearn: 'What You Can Learn',
    income: 'Income',
    funding: 'Funding',
    soloEntrepreneurTitle: 'Independent Creator Cafe',
    indieMaker: 'Indie Maker',
    todayActionTitle: "Today's 1 Thing",
    todayActionBadge: 'DO THIS NOW',
    todayActionBadgeStudent: 'Do This Now',
    dailyPromptTitle: "Today's Question",
    featuredBadge: 'Top Pick Today',
    featuredSubmitHint: 'Answer the question above and get featured on the homepage',
    myProfile: 'My Profile',
    myProfileFloat: 'My AI Literacy',
    aiLiteracyPoints: 'AI Literacy Points',
    continuousReadDays: 'Day Streak',
    totalReadDays: 'Total Read Days',
    bakeTime: 'Fresh at',
    pointsEarnHint: 'Earn points by daily visits, reading articles, and community participation',
    streakSuffix: 'days streak',
    appTagline: 'What AI Is Up To Today',
    dailyBriefing: 'Daily Briefing',
    marketSignals: 'Market Signals',
    about: 'About',
    contact: 'Contact',
    privacy: 'Privacy',
    emailPlaceholder: 'Email',
    verifiedSources: 'Verified Sources',
    readFullPaper: 'Read Full Paper',
    activeCommunity: 'Active Community',
    podcastDaily: "Today's AI Podcast",
    voiceTone: 'Voice Tone',
    generateScript: 'Generate Script',
    chapterNav: 'Chapter Navigation',
    generating: 'Generating...',
    podcastEmptyHint: 'Select a voice tone and click "Generate Script" to convert today\'s report into podcast-style text.',
    revenue: 'Revenue',
    project: 'Project',
    recent: 'Recent',
    sourceFirstPublished: 'First published',
    switchToEnglish: 'EN',
    switchToChinese: 'Chinese',
    twitter: 'Twitter',
    linkedIn: 'LinkedIn',
    discord: 'Discord',
    fetchError: 'Failed to fetch data. Please retry.',
    apiKeyUnavailable: 'API key selection is not available in this environment.',
    profileButton: 'JD',
    exploreMore: 'Explore More',
    collapse: 'Collapse'
  },
  zh: {
    investor: '投资人',
    student: '大学生',
    todaySignal: '重磅热咖',
    readAnalysis: '阅读深度分析',
    intelligenceStream: '投研黑咖',
    viewAll: '查看全部',
    socialSignals: '社交信号',
    keyDeals: '核心交易',
    learningPath: '成长配方',
    topicRadar: '热点拉花',
    upcoming: '即将到来',
    interpretation: '深度解读',
    signal: '投资信号',
    action: '行动建议',
    actionStudent: '今天就做',
    footerDesc: '为下一代建设者和支持者提供的高保真情报站',
    product: '产品',
    company: '公司',
    subscribe: '订阅',
    join: '加入',
    rights: '版权所有',
    live: '实时',
    resource: '资源',
    minRead: '分钟阅读',
    globalEvent: '全球事件',
    virtual: '线上',
    aiPlusMajor: '专业特调',
    agentDirectory: '自助吧台',
    agentCategory: '分类',
    agentFeatures: '核心特点',
    visitSite: '访问网站',
    humanities: '文科',
    science: '理科',
    engineering: '工科',
    business: '商科',
    futureTrend: '未来趋势',
    errorTitle: '投研黑咖暂时中断',
    errorDesc: '当前 API 配额已耗尽。请稍候重试，或切换至您的付费 API 密钥以获得不间断服务。',
    retry: '重试连接',
    switchKey: '切换至付费 API 密钥',
    demoMode: '演示模式',
    demoNotice: '由于配额限制，实时流已暂停。正在显示示例数据。',
    papers: '前沿学术研究',
    majorNews: '专业细分时讯',
    forums: '可交流的论坛',
    backToDashboard: '返回仪表盘',
    deepDiveTitle: '专业特调 深度探索',
    viewPost: '查看原文',
    campusVoice: '不装了，我也在用AI',
    campusVoiceDesc: '与同学分享你的 AI 见解',
    sharePlaceholder: '今天你发现了什么 AI 突破？',
    post: '发布',
    anonymous: '匿名用户',
    complianceNotice: '请保持友善。内容将经过审核以确保社区安全。',
    sideHustleTitle: '本周副业冰萃',
    lowCostStart: '低成本启动',
    peerStoryTitle: '全球同咖',
    weeklyStory: '本周故事',
    whatYouCanLearn: '你可以学到',
    income: '收入',
    funding: '融了',
    soloEntrepreneurTitle: '独立创咖 / 青年创业者',
    indieMaker: '独立开发者',
    todayActionTitle: '今天只做这1件事',
    todayActionBadge: '立刻行动',
    todayActionBadgeStudent: '马上就做',
    dailyPromptTitle: '今日征集',
    featuredBadge: '今日最佳',
    featuredSubmitHint: '回答上面的问题，优质投稿将上今日首页',
    myProfile: '个人主页',
    myProfileFloat: '我的 AI 素养',
    aiLiteracyPoints: 'AI 素养积分',
    continuousReadDays: '连续阅读天数',
    totalReadDays: '总阅读天数',
    bakeTime: '出炉时间',
    pointsEarnHint: '每日访问、阅读文章、参与社区可获得积分',
    streakSuffix: '天连续阅读',
    appTagline: '今天AI在干嘛',
    dailyBriefing: '每日简报',
    marketSignals: '市场信号',
    about: '关于我们',
    contact: '联系我们',
    privacy: '隐私政策',
    emailPlaceholder: '邮箱',
    verifiedSources: '权威来源',
    readFullPaper: '阅读全文',
    activeCommunity: '活跃社区',
    podcastDaily: '今日 AI 播客',
    voiceTone: '播客气口',
    generateScript: '生成播客稿',
    chapterNav: '章节导航',
    generating: '生成中...',
    podcastEmptyHint: '选择语气后点击「生成播客稿」，即可将今日日报转为播客式文本',
    revenue: '营收',
    project: '项目',
    recent: '最近',
    switchToEnglish: '英语',
    switchToChinese: '中文',
    twitter: '推特',
    linkedIn: '领英',
    discord: 'Discord',
    fetchError: '数据加载失败，请重试',
    apiKeyUnavailable: '当前环境无法切换 API 密钥',
    profileButton: '今日',
    exploreMore: '探索更多',
    collapse: '收起'
  }
};

function CampusVoice({ t, language, dailyPrompt, onPostSuccess }: { t: any; language: Language; dailyPrompt?: string; onPostSuccess?: () => void }) {
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState("");
  const [sending, setSending] = useState(false);
  const lastTimestampRef = useRef<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const featuredMessage = messages.find((m) => m.featured) ?? null;
  const regularMessages = messages.filter((m) => !m.featured);

  const fetchMessages = async (initial = false) => {
    try {
      const url = initial
        ? '/api/messages'
        : `/api/messages${lastTimestampRef.current ? `?since=${encodeURIComponent(lastTimestampRef.current)}` : ''}`;
      const res = await fetch(url);
      if (!res.ok) return;
      const data: any[] = await res.json();
      if (data.length > 0) {
        lastTimestampRef.current = data[data.length - 1].timestamp;
        if (initial) {
          setMessages(data);
        } else {
          setMessages((prev) => [...prev, ...data]);
        }
      }
    } catch {
      // silent fail on network blip
    }
  };

  useEffect(() => {
    fetchMessages(true);
    const timer = setInterval(() => fetchMessages(false), 4000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!inputText.trim() || sending) return;
    setSending(true);
    const text = inputText.trim();
    setInputText("");
    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, user: t.anonymous }),
      });
      if (res.ok) {
        const newMsg = await res.json();
        lastTimestampRef.current = newMsg.timestamp;
        setMessages((prev) => [...prev, newMsg]);
        onPostSuccess?.();
      }
    } catch {
      // silent fail
    } finally {
      setSending(false);
    }
  };

  const activePlaceholder = dailyPrompt
    ? (dailyPrompt.length > 40 ? dailyPrompt.slice(0, 40) + '…' : dailyPrompt)
    : t.sharePlaceholder;

  return (
    <section className="bg-white rounded-3xl border border-black/5 shadow-sm overflow-hidden flex flex-col">
      {/* Header */}
      <div className="p-5 border-b border-black/5 bg-indigo-50/40">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold flex items-center gap-2">
            <MessageSquare size={18} className="text-indigo-600" />
            {t.campusVoice}
          </h3>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-[#4ECDC4] animate-pulse" />
            <span className="text-[10px] font-bold text-teal-600 uppercase tracking-widest">{t.live}</span>
          </div>
        </div>
        {/* Daily prompt banner */}
        {dailyPrompt && (
          <div className="bg-indigo-600 text-white rounded-2xl px-4 py-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-200 mb-1">{t.dailyPromptTitle}</p>
            <p className="text-sm font-semibold leading-snug">{dailyPrompt}</p>
            <p className="text-[10px] text-indigo-300 mt-1.5 italic">{t.featuredSubmitHint}</p>
          </div>
        )}
      </div>

      {/* Featured message (today's top pick) */}
      {featuredMessage && (
        <div className="px-5 pt-4">
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold bg-amber-400 text-white px-2 py-0.5 rounded-full uppercase tracking-wide">
                {t.featuredBadge}
              </span>
              <span className="text-[10px] font-bold text-amber-700 uppercase tracking-tight">{featuredMessage.user}</span>
              <span className="text-[10px] text-gray-400 ml-auto">
                {new Date(featuredMessage.timestamp).toLocaleTimeString(language === 'zh' ? 'zh-CN' : 'en-US', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            <p className="text-sm text-gray-800 leading-relaxed font-medium">"{featuredMessage.text}"</p>
          </div>
        </div>
      )}

      {/* Message list */}
      <div
        ref={scrollRef}
        className="overflow-y-auto p-5 space-y-4 scroll-smooth"
        style={{ maxHeight: '240px' }}
      >
        {regularMessages.map((msg) => (
          <div key={msg.id} className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-tight">{msg.user}</span>
              <span className="text-[10px] text-gray-400">
                {new Date(msg.timestamp).toLocaleTimeString(language === 'zh' ? 'zh-CN' : 'en-US', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            <div className="bg-gray-50 p-3 rounded-2xl rounded-tl-none border border-black/5">
              <p className="text-sm text-gray-700 leading-relaxed">{msg.text}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Input */}
      <div className="p-4 border-t border-black/5 bg-gray-50/30 space-y-3">
        <div className="flex gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder={activePlaceholder}
            className="flex-1 bg-white border border-black/10 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
          />
          <button
            onClick={handleSend}
            disabled={!inputText.trim() || sending}
            className="p-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send size={18} />
          </button>
        </div>
        <div className="flex items-center gap-2 text-[10px] text-gray-400 font-medium italic">
          <ShieldCheck size={12} className="text-teal-500" />
          {t.complianceNotice}
        </div>
      </div>
    </section>
  );
}

function useAutoScroll(ref: { current: HTMLDivElement | null }, interval = 3000) {
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    const container = ref.current;
    if (!container) return;

    const scroll = () => {
      if (isPaused) return;
      
      const { scrollLeft, scrollWidth, clientWidth } = container;
      // Check if we are near the end
      if (scrollLeft + clientWidth >= scrollWidth - 50) {
        container.scrollTo({ left: 0, behavior: 'smooth' });
      } else {
        // Scroll by roughly one card width (assuming ~300px + gap)
        // Or just scroll by a chunk
        container.scrollBy({ left: 320, behavior: 'smooth' }); 
      }
    };

    const timer = setInterval(scroll, interval);
    return () => clearInterval(timer);
  }, [isPaused, interval]);

  return {
    onMouseEnter: () => setIsPaused(true),
    onMouseLeave: () => setIsPaused(false),
    onTouchStart: () => setIsPaused(true),
    onTouchEnd: () => setIsPaused(false),
  };
}

function SideHustleSection({ t, sideHustles }: { t: any, sideHustles: any[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const scrollHandlers = useAutoScroll(scrollRef);

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between px-2">
        <h3 className="text-xl font-bold flex items-center gap-2 border-l-4 border-amber-700 pl-3 bg-amber-50/40 rounded-r-lg py-1 pr-3">
          <Coins size={20} className="text-amber-600" />
          {t.sideHustleTitle}
        </h3>
        <span className="text-[10px] font-bold bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full uppercase tracking-wider">
          {t.lowCostStart}
        </span>
      </div>
      <div 
        ref={scrollRef}
        {...scrollHandlers}
        className="flex overflow-x-auto snap-x snap-mandatory gap-4 pb-4 px-2 scrollbar-hide"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', overflowY: 'visible' }}
      >
        {sideHustles.map((hustle, idx) => (
          <motion.div 
            key={hustle.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="w-[calc(100%-8px)] flex-shrink-0 snap-center bg-white p-6 rounded-3xl border border-black/5 shadow-sm hover:shadow-md transition-all space-y-4"
          >
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-indigo-600 text-white rounded-lg flex items-center justify-center font-bold">
                  {idx + 1}
                </div>
                <h4 className="font-bold text-lg">{hustle.title}</h4>
              </div>
              <span className="text-sm font-bold text-teal-600 bg-teal-50 px-3 py-1 rounded-lg">
                {hustle.income}
              </span>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed">
              {hustle.description}
            </p>
            <div className="bg-gray-50/50 p-4 rounded-2xl space-y-2">
              {hustle.steps.map((step: string, sIdx: number) => (
                <div key={sIdx} className="flex items-start gap-3">
                  <div className="w-5 h-5 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5">
                    {sIdx + 1}
                  </div>
                  <p className="text-xs text-gray-700 font-medium">{step}</p>
                </div>
              ))}
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

function PeerStorySoloSlidingCards({ t, story, entrepreneurs }: { t: any; story: any; entrepreneurs: any[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const scrollHandlers = useAutoScroll(scrollRef, 3500);

  const hasStory = story && story.author;
  const hasEntrepreneurs = entrepreneurs && entrepreneurs.length > 0;
  if (!hasStory && !hasEntrepreneurs) return null;

  const cards: ({ type: 'peer'; data: any } | { type: 'solo'; data: any })[] = [];
  if (hasStory) cards.push({ type: 'peer', data: story });
  if (hasEntrepreneurs) entrepreneurs.forEach((e: any) => cards.push({ type: 'solo', data: e }));

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between px-2">
        <h3 className="text-xl font-bold flex items-center gap-2 border-l-4 border-amber-700 pl-3 bg-amber-50/40 rounded-r-lg py-1 pr-3">
          <Globe size={20} className="text-amber-700" />
          {t.peerStoryTitle}
          <span className="text-gray-400 font-normal text-sm">/</span>
          <Rocket size={18} className="text-amber-600" />
          {t.soloEntrepreneurTitle}
        </h3>
        <span className="text-[10px] font-bold bg-purple-100 text-purple-600 px-2 py-0.5 rounded-full uppercase tracking-wider">
          {t.weeklyStory}
        </span>
      </div>
      <div
        ref={scrollRef}
        {...scrollHandlers}
        className="flex overflow-x-auto snap-x snap-mandatory gap-4 pb-4 px-2 scrollbar-hide"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', overflowY: 'visible' }}
      >
        {cards.map((card, idx) => (
          <motion.div
            key={card.type === 'peer' ? 'peer' : card.data.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="w-[calc(100%-8px)] flex-shrink-0 snap-center bg-white p-6 rounded-3xl border border-black/5 shadow-sm hover:shadow-md transition-all space-y-4"
          >
            {card.type === 'peer' ? (
              <>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img
                      src={card.data.author.avatar}
                      alt=""
                      className="w-12 h-12 rounded-2xl bg-gray-100"
                      referrerPolicy="no-referrer"
                    />
                    <div>
                      <h4 className="font-bold text-lg">{card.data.author.name}</h4>
                      <p className="text-xs text-gray-500 font-medium">
                        {card.data.author.school} · {card.data.author.status}
                      </p>
                      {card.data.timestamp && (
                        <p className="text-[9px] text-gray-500 font-medium tabular-nums mt-0.5">{card.data.timestamp}</p>
                      )}
                    </div>
                  </div>
                  {card.data.funding && (
                    <div className="bg-teal-50 text-teal-600 text-xs font-bold px-3 py-1 rounded-lg">{card.data.funding}</div>
                  )}
                </div>
                <div className="space-y-3">
                  <h5 className="font-bold text-gray-800 leading-tight">{card.data.title}</h5>
                  <p className="text-sm text-gray-600 leading-relaxed line-clamp-3">{card.data.content}</p>
                </div>
                <div className="pt-4 border-t border-black/5">
                  <div className="flex items-center gap-2 text-[10px] font-bold text-purple-600 uppercase tracking-widest mb-2">
                    <Lightbulb size={14} />
                    {t.whatYouCanLearn}
                  </div>
                  <p className="text-sm font-medium text-gray-700 italic">{card.data.takeaway}</p>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img
                      src={card.data.avatar}
                      alt=""
                      className="w-10 h-10 rounded-xl bg-gray-100"
                      referrerPolicy="no-referrer"
                    />
                    <div>
                      <h4 className="font-bold text-sm">{card.data.name}</h4>
                      <p className="text-[10px] text-gray-500 font-medium">{card.data.role}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-rose-600">{card.data.revenue}</p>
                    <p className="text-[10px] text-gray-400 uppercase tracking-tighter">{t.revenue}</p>
                    {card.data.timestamp && (
                      <p className="text-[9px] text-gray-500 tabular-nums mt-0.5">{card.data.timestamp}</p>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{t.project}:</span>
                    <span className="text-sm font-bold text-gray-800">{card.data.project}</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {card.data.stack.map((tech: string) => (
                      <span key={tech} className="text-[9px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md font-bold uppercase">
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="bg-rose-50/50 p-3 rounded-2xl border border-rose-100/50">
                  <p className="text-xs text-rose-900 leading-relaxed italic">"{card.data.insight}"</p>
                </div>
                <a
                  href={card.data.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-2 bg-gray-50 hover:bg-black hover:text-white rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all"
                >
                  {t.visitSite} <ExternalLink size={12} />
                </a>
              </>
            )}
          </motion.div>
        ))}
      </div>
    </section>
  );
}

function TodayActionCard({ t, action }: { t: any; action: string }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="relative bg-amber-50 border-2 border-amber-300 rounded-3xl p-7 overflow-hidden"
    >
      {/* Decorative large "1" */}
      <span className="absolute right-6 top-1/2 -translate-y-1/2 text-[120px] font-black text-amber-200/60 select-none leading-none pointer-events-none">
        1
      </span>
      <div className="relative z-10 space-y-3">
        <div className="flex items-center gap-2">
          <Zap size={15} className="text-amber-600" fill="currentColor" />
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-700">{t.todayActionBadgeStudent ?? t.todayActionBadge}</span>
        </div>
        <h3 className="text-lg font-black text-gray-900 leading-snug max-w-xs">
          {t.todayActionTitle}
        </h3>
        <p className="text-base font-semibold text-gray-800 leading-relaxed max-w-sm">
          {action}
        </p>
      </div>
    </motion.section>
  );
}

export default function App() {
  const { language, setLanguage } = useLanguage();
  const [persona, setPersona] = useState<Persona>('investor');
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDeepDive, setShowDeepDive] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showPodcast, setShowPodcast] = useState(false);
  const [expandNews, setExpandNews] = useState(false);
  const [userStats, setUserStats] = useState<UserStats | null>(null);

  const t = translations[language];

  const refreshUserStats = () => setUserStats(getUserStats());

  useEffect(() => {
    loadData();
  }, [persona, language]);

  useEffect(() => {
    refreshUserStats();
  }, []);

  useEffect(() => {
    if (showProfile) refreshUserStats();
  }, [showProfile]);

  useEffect(() => {
    const isZh = language === 'zh';
    document.documentElement.lang = isZh ? 'zh-CN' : 'en';
    document.title = isZh ? 'Daily Shot. 今天AI在干嘛' : 'Daily Shot. What AI Is Up To Today';
    const desc = isZh
      ? '今天AI在干嘛 - 高密度 AI 情报仪表盘，整合学生学习洞察与投资人信号'
      : 'What AI is up to today - High-density AI intelligence dashboard for students and investors';
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute('content', desc);
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.setAttribute('content', isZh ? 'Daily Shot. 今天AI在干嘛' : 'Daily Shot. What AI Is Up To Today');
    const ogDesc = document.querySelector('meta[property="og:description"]');
    if (ogDesc) ogDesc.setAttribute('content', desc);
  }, [language]);

  const loadData = async () => {
    // If we already have data, don't show the full loading skeleton to make it feel faster
    // (Unless it's the very first load)
    if (!data) setLoading(true);
    setError(null);
    
    try {
      const result = await fetchDashboardData(persona, language);
      setData(result);
      recordReadAction();
      refreshUserStats();
      // If result is demo, we might want to show a small toast or notice, 
      // but not the full error card which blocks the UI.
      if (result.isDemo) {
        console.warn("Displaying demo data due to API quota limits.");
      }
      // Prefetch the opposite persona in background for instant tab switching
      setTimeout(() => prefetchNextData(persona, language), 2000);
    } catch (err: any) {
      console.error(err);
      // Only show error card if we have NO data at all (not even demo/cached)
      if (!data) {
        setError(err.message || t.fetchError);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSwitchKey = async () => {
    if (window.aistudio?.openSelectKey) {
      await window.aistudio.openSelectKey();
      loadData();
    } else {
      alert(t.apiKeyUnavailable);
    }
  };

  return (
    <div className={`min-h-screen text-[#1A1A1A] font-sans selection:bg-teal-100 relative`}>
      <DynamicBackground />
      {/* Top Navigation */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-black/5 px-4 py-1.5 md:py-2">
        <div className="max-w-7xl mx-auto">
        {/* Mobile: two-row layout */}
        <div className="md:hidden flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <img src="/logo.png" className="w-8 h-8 object-contain" alt="Daily Shot Logo" />
              <h1 className="text-sm font-bold tracking-tight">Daily Shot.</h1>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="flex items-center bg-black/5 p-0.5 rounded-full">
                <button onClick={() => setPersona('investor')} className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all flex items-center gap-1 ${persona === 'investor' ? 'bg-white shadow-sm text-black' : 'text-gray-500 hover:text-black'}`}>
                  <BarChart3 size={12} />
                  {t.investor}
                </button>
                <button onClick={() => setPersona('student')} className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all flex items-center gap-1 ${persona === 'student' ? 'bg-white shadow-sm text-black' : 'text-gray-500 hover:text-black'}`}>
                  <GraduationCap size={12} />
                  {t.student}
                </button>
              </div>
              <button onClick={() => setLanguage(language === 'en' ? 'zh' : 'en')} className="flex items-center gap-1 px-2 py-1 bg-black/5 hover:bg-black/10 rounded-full text-xs font-medium">
                <Languages size={12} />
                {language === 'en' ? t.switchToChinese : t.switchToEnglish}
              </button>
              <button className="p-1.5 text-gray-500 hover:bg-black/5 rounded-full"><Search size={18} /></button>
              <button onClick={() => { setShowProfile(true); refreshUserStats(); }} className="w-7 h-7 rounded-full bg-[#4ECDC4] flex items-center justify-center text-white text-xs font-bold shrink-0">{t.profileButton}</button>
            </div>
          </div>
          <div className="flex justify-end text-[10px] text-gray-500 font-medium tabular-nums">
            <span className="uppercase tracking-wider mr-1">{t.bakeTime}</span>
            {new Date().toLocaleDateString(language === 'zh' ? 'zh-CN' : 'en-US', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\//g, '-') + ' 06:00'}
          </div>
        </div>
        {/* Desktop: single-row layout */}
        <div className="hidden md:flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/logo.png" className="w-9 h-9 object-contain" alt="Daily Shot Logo" />
            <div className="flex flex-col leading-tight">
              <h1 className="text-base font-bold tracking-tight">Daily Shot.</h1>
              <span className="text-[10px] text-gray-400 font-medium tracking-wide">{t.appTagline}</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center bg-black/5 p-1 rounded-full">
              <button onClick={() => setPersona('investor')} className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${persona === 'investor' ? 'bg-white shadow-sm text-black' : 'text-gray-500 hover:text-black'}`}><BarChart3 size={14} />{t.investor}</button>
              <button onClick={() => setPersona('student')} className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${persona === 'student' ? 'bg-white shadow-sm text-black' : 'text-gray-500 hover:text-black'}`}><GraduationCap size={14} />{t.student}</button>
            </div>
            <button onClick={() => setLanguage(language === 'en' ? 'zh' : 'en')} className="flex items-center gap-2 px-3 py-1.5 bg-black/5 hover:bg-black/10 rounded-full text-sm font-medium"><Languages size={14} />{language === 'en' ? t.switchToChinese : t.switchToEnglish}</button>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex flex-col items-end leading-tight">
              <span className="text-[9px] text-gray-400 font-medium uppercase tracking-widest">{t.bakeTime}</span>
              <span className="text-[11px] font-bold text-gray-600 tabular-nums">{new Date().toLocaleDateString(language === 'zh' ? 'zh-CN' : 'en-US', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\//g, '-') + ' 06:00'}</span>
            </div>
            <button className="p-2 text-gray-500 hover:bg-black/5 rounded-full"><Search size={20} /></button>
            <button onClick={() => { setShowProfile(true); refreshUserStats(); }} className="w-8 h-8 rounded-full bg-[#4ECDC4] flex items-center justify-center text-white text-xs font-bold">{t.profileButton}</button>
          </div>
        </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        <AnimatePresence mode="wait">
          {showProfile ? (
            <motion.div
              key="profile"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setShowProfile(false)}
                  className="flex items-center gap-2 text-gray-600 hover:text-black transition-colors font-medium"
                >
                  <ArrowLeft size={20} />
                  {t.backToDashboard}
                </button>
                <h2 className="text-2xl font-bold tracking-tight">{t.myProfile}</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white p-8 rounded-3xl border border-black/5 shadow-sm"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-3 bg-amber-100 text-amber-600 rounded-2xl">
                      <Award size={28} />
                    </div>
                    <h3 className="text-lg font-bold">{t.aiLiteracyPoints}</h3>
                  </div>
                  <p className="text-4xl font-black text-amber-600 tabular-nums">
                    {(userStats ?? getUserStats()).aiLiteracyPoints}
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    {t.pointsEarnHint}
                  </p>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="bg-white p-8 rounded-3xl border border-black/5 shadow-sm"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-3 bg-rose-100 text-rose-600 rounded-2xl">
                      <Flame size={28} />
                    </div>
                    <h3 className="text-lg font-bold">{t.continuousReadDays}</h3>
                  </div>
                  <p className="text-4xl font-black text-rose-600 tabular-nums">
                    {(userStats ?? getUserStats()).currentStreakDays}
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    {t.streakSuffix}
                  </p>
                  {(userStats ?? getUserStats()).totalReadDays !== undefined && (userStats ?? getUserStats()).totalReadDays! > 0 && (
                    <p className="text-xs text-gray-400 mt-1">
                      {t.totalReadDays}: {(userStats ?? getUserStats()).totalReadDays}
                    </p>
                  )}
                </motion.div>
              </div>
            </motion.div>
          ) : showPodcast ? (
            <PodcastDailyView
              data={data}
              persona={persona}
              language={language}
              t={t}
              onBack={() => setShowPodcast(false)}
            />
          ) : showDeepDive ? (
            <motion.div
              key="deep-dive"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div className="flex items-center justify-between">
                <button 
                  onClick={() => setShowDeepDive(false)}
                  className="flex items-center gap-2 text-gray-600 hover:text-black transition-colors font-medium"
                >
                  <ArrowLeft size={20} />
                  {t.backToDashboard}
                </button>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-100 text-amber-600 rounded-xl">
                    <Zap size={24} />
                  </div>
                  <h2 className="text-3xl font-bold tracking-tight">{t.deepDiveTitle}</h2>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Papers Module */}
                <div className="lg:col-span-2 space-y-6">
                  <section className="bg-white rounded-3xl border border-black/5 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-black/5 flex items-center justify-between bg-teal-50/30">
                      <h3 className="text-xl font-bold flex items-center gap-2">
                        <BookOpen className="text-teal-600" size={22} />
                        {t.papers}
                      </h3>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-teal-600/50 uppercase tracking-widest">{t.verifiedSources}</span>
                        <div className="w-1.5 h-1.5 rounded-full bg-[#4ECDC4] animate-pulse" />
                      </div>
                    </div>
                    <div className="divide-y divide-black/5">
                      {data?.majorDeepDive?.papers.map((paper) => (
                        <a 
                          key={paper.id}
                          href={paper.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-6 block hover:bg-teal-50/10 transition-all group"
                        >
                          <div className="flex justify-between items-start gap-6">
                            <div className="space-y-3">
                              <h4 className="font-bold text-xl group-hover:text-teal-600 transition-colors leading-tight">
                                {paper.title}
                              </h4>
                              <p className="text-sm text-gray-500 line-clamp-2 leading-relaxed">
                                {paper.context}
                              </p>
                              <div className="flex items-center gap-4 text-xs">
                                <span className="font-bold px-2 py-1 bg-teal-100 text-teal-700 rounded-md">{paper.source}</span>
                                <span className="text-[9px] text-gray-500 font-medium tabular-nums">{paper.timestamp}</span>
                                <span className="text-teal-600 font-bold flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  {t.readFullPaper} <ChevronRight size={12} />
                                </span>
                              </div>
                            </div>
                            <div className="p-3 rounded-2xl bg-gray-50 group-hover:bg-teal-100 text-gray-400 group-hover:text-teal-600 transition-all flex-shrink-0">
                              <ExternalLink size={20} />
                            </div>
                          </div>
                        </a>
                      ))}
                    </div>
                  </section>

                  {/* Major News Module */}
                  <section className="bg-white rounded-3xl border border-black/5 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-black/5 flex items-center justify-between bg-blue-50/30">
                      <h3 className="text-xl font-bold flex items-center gap-2">
                        <Globe className="text-blue-600" size={22} />
                        {t.majorNews}
                      </h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-black/5">
                      {data?.majorDeepDive?.majorNews.map((news) => (
                        <a 
                          key={news.id}
                          href={news.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-6 block hover:bg-blue-50/10 transition-all group"
                        >
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-1 rounded-md">{news.source}</span>
                              <span className="text-[9px] text-gray-500 font-medium tabular-nums">{news.sourceFirstPublishedAt ? `${t.sourceFirstPublished} ` : ''}{news.timestamp}</span>
                            </div>
                            <h4 className="font-bold text-lg group-hover:text-blue-600 transition-colors leading-snug">
                              {news.title}
                            </h4>
                            <p className="text-sm text-gray-500 line-clamp-2 leading-relaxed">
                              {news.context}
                            </p>
                            <div className="pt-2 flex items-center gap-2 text-blue-600 text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                              {t.viewPost} <ExternalLink size={12} />
                            </div>
                          </div>
                        </a>
                      ))}
                    </div>
                  </section>
                </div>

                {/* Forums Module */}
                <div className="space-y-6">
                  <section className="bg-white rounded-3xl border border-black/5 shadow-sm overflow-hidden sticky top-6">
                    <div className="p-6 border-b border-black/5 bg-purple-50/30">
                      <h3 className="text-xl font-bold flex items-center gap-2">
                        <Users className="text-purple-600" size={22} />
                        {t.forums}
                      </h3>
                    </div>
                    <div className="p-3 space-y-2">
                      {data?.majorDeepDive?.forums.map((forum) => (
                        <a 
                          key={forum.name}
                          href={forum.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-5 block hover:bg-purple-50/50 rounded-2xl transition-all group border border-transparent hover:border-purple-100"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center text-purple-600 font-bold text-xs">
                                {forum.name.charAt(0)}
                              </div>
                              <span className="font-bold text-purple-900 group-hover:text-purple-600 transition-colors">{forum.name}</span>
                            </div>
                            <ExternalLink size={14} className="text-purple-300 group-hover:text-purple-600 transition-colors" />
                          </div>
                          <p className="text-xs text-purple-700/70 leading-relaxed mb-3">
                            {forum.description}
                          </p>
                          <div className="flex items-center gap-2 text-[10px] font-bold text-purple-400 uppercase tracking-widest">
                            <span className="w-1 h-1 rounded-full bg-purple-400" />
                            {t.activeCommunity}
                          </div>
                        </a>
                      ))}
                    </div>
                  </section>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-6"
            >
              {error && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-rose-50 border border-rose-100 rounded-3xl p-8 text-center space-y-6 my-12"
          >
            <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto">
              <Settings className="animate-spin-slow" size={32} />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-rose-900">{t.errorTitle}</h2>
              <p className="text-rose-700 max-w-md mx-auto">{t.errorDesc}</p>
            </div>
            <div className="flex flex-col md:flex-row gap-4 justify-center">
              <button 
                onClick={loadData}
                className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-8 py-3 rounded-xl transition-all flex items-center justify-center gap-2"
              >
                <Zap size={18} />
                {t.retry}
              </button>
              <button 
                onClick={handleSwitchKey}
                className="bg-white border border-rose-200 text-rose-700 font-bold px-8 py-3 rounded-xl hover:bg-rose-50 transition-all flex items-center justify-center gap-2"
              >
                <Settings size={18} />
                {t.switchKey}
              </button>
            </div>
          </motion.div>
        )}

        {/* Metrics Bar */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {loading ? (
            Array(5).fill(0).map((_, i) => (
              <div key={i} className={`h-20 bg-white rounded-2xl animate-pulse border border-black/5 ${i >= 4 ? 'hidden md:block' : ''}`} />
            ))
          ) : (
            (data?.metrics || []).map((metric, i) => (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                key={metric.label} 
                className={`bg-white p-4 rounded-2xl border border-black/5 shadow-sm hover:shadow-md transition-shadow ${i >= 4 ? 'hidden md:block' : ''}`}
              >
                <p className="text-[10px] uppercase tracking-wider font-semibold text-gray-400 mb-1">{metric.label}</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-xl font-bold font-mono">{metric.value}</span>
                  {metric.change && (
                    <span className={`text-[11px] font-medium flex items-center ${metric.isPositive ? 'text-teal-600' : 'text-rose-600'}`}>
                      {metric.isPositive ? <TrendingUp size={10} className="mr-0.5" /> : <TrendingDown size={10} className="mr-0.5" />}
                      {metric.change}
                    </span>
                  )}
                </div>
              </motion.div>
            ))
          )}
        </div>


        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: News & Signals */}
          <div className="lg:col-span-8 space-y-6">
            {/* Heavy Hitter — position 1 for both; student gets expanded with 投研 news + 探索更多 */}
            <section className="bg-black text-white rounded-3xl p-8 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/20 blur-[100px] -mr-32 -mt-32 rounded-full" />
              <div className="relative z-10 space-y-4">
                <div className="flex items-center gap-2 text-teal-400">
                  <Zap size={16} fill="currentColor" />
                  <span className="text-xs font-bold uppercase tracking-[0.2em]">{t.todaySignal}</span>
                </div>
                {loading ? (
                  <div className="space-y-3">
                    <div className="h-8 w-3/4 bg-white/10 rounded animate-pulse" />
                    <div className="h-4 w-full bg-white/10 rounded animate-pulse" />
                    <div className="h-4 w-2/3 bg-white/10 rounded animate-pulse" />
                  </div>
                ) : (
                  <>
                    <h2 className="text-3xl md:text-4xl font-bold tracking-tight leading-tight">
                      {data?.todaySignal.title}
                    </h2>
                    <p className="text-gray-400 text-lg max-w-2xl">
                      {data?.todaySignal.description}
                    </p>
                    <div className="pt-4 flex flex-col md:flex-row gap-4">
                      <div className="bg-white/10 backdrop-blur-md border border-white/10 p-4 rounded-2xl flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-[10px] uppercase font-bold text-teal-400">
                            {persona === 'investor' ? t.signal : (t.actionStudent ?? t.action)}
                          </p>
                          {data?.todaySignal.timestamp && (
                            <span className="text-[9px] text-white/50 font-medium tabular-nums">{data.todaySignal.timestamp}</span>
                          )}
                        </div>
                        <p className="text-sm italic leading-relaxed">
                          "{data?.todaySignal.takeaway}"
                        </p>
                      </div>
                      <button 
                        onClick={() => {
                          addPoints(5);
                          refreshUserStats();
                          window.open(data?.todaySignal.url, '_blank');
                        }}
                        className="bg-teal-500 hover:bg-teal-400 text-black font-bold px-6 py-4 rounded-2xl transition-all flex items-center justify-center gap-2 self-end md:self-center"
                      >
                        {t.readAnalysis}
                        <ChevronRight size={18} />
                      </button>
                    </div>
                    {/* Student-only: 投研黑咖 news preview + 探索更多 */}
                    {persona === 'student' && (data?.news?.length ?? 0) > 0 && (
                      <div className="pt-6 mt-6 border-t border-white/10 space-y-4">
                        <div className="space-y-2">
                          {(expandNews ? data!.news! : data!.news!.slice(0, 3)).map((item, i) => (
                            <motion.a 
                              href={item.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              key={item.id}
                              initial={{ opacity: 0, y: 4 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: i * 0.05 }}
                              className="block p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
                            >
                              <div className="flex items-start gap-3">
                                <div className="flex-shrink-0 w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center">
                                  {item.type === 'product' && <Cpu size={14} />}
                                  {item.type === 'funding' && <Briefcase size={14} />}
                                  {item.type === 'research' && <GraduationCap size={14} />}
                                  {item.type === 'tech' && <Zap size={14} />}
                                  {item.type === 'policy' && <Globe size={14} />}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-sm text-white/90 line-clamp-1">{item.title}</p>
                                  <p className="text-xs text-white/50 mt-0.5">{item.source}{item.timestamp && ` · ${item.timestamp}`}</p>
                                  <p className="text-xs text-teal-300/90 mt-1.5 line-clamp-1">{(t.actionStudent ?? t.action)}: {item.takeaway}</p>
                                </div>
                                <ChevronRight size={14} className="flex-shrink-0 text-white/40" />
                              </div>
                            </motion.a>
                          ))}
                        </div>
                        {data!.news!.length > 3 && (
                          <button
                            onClick={() => setExpandNews(!expandNews)}
                            className="w-full py-3 rounded-xl border border-white/20 text-white/80 hover:bg-white/10 hover:text-white transition-all flex items-center justify-center gap-2 text-sm font-medium"
                          >
                            {expandNews ? t.collapse : t.exploreMore}
                            <ChevronRight size={16} className={expandNews ? 'rotate-90' : ''} />
                          </button>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            </section>

            {/* Sliding cards: 全球同咖 + 独立创咖 — student only, position 2 */}
            {persona === 'student' && !loading && (data?.peerStory || (data?.soloEntrepreneurs?.length ?? 0) > 0) && (
              <PeerStorySoloSlidingCards t={t} story={data?.peerStory} entrepreneurs={data?.soloEntrepreneurs || []} />
            )}

            {/* AI + Major Section */}
            <section className="space-y-4">
              <div className="flex items-center justify-between px-2">
                <button 
                  onClick={() => setShowDeepDive(true)}
                  className="group flex items-center gap-2"
                >
                  <h3 className="text-xl font-bold flex items-center gap-2 group-hover:text-amber-600 transition-colors">
                    <Zap size={20} className="text-amber-500" />
                    {t.aiPlusMajor}
                    <ChevronRight size={18} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                  </h3>
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {loading ? (
                  Array(4).fill(0).map((_, i) => (
                    <div key={i} className="h-48 bg-white rounded-3xl animate-pulse border border-black/5" />
                  ))
                ) : (
                  (data?.majorInsights || []).map((insight, i) => (
                    <motion.a
                      href={insight.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.2 + i * 0.1 }}
                      key={insight.discipline}
                      className="bg-white p-6 rounded-3xl border border-black/5 shadow-sm hover:shadow-md transition-all group relative overflow-hidden block"
                    >
                      <div className={`absolute top-0 right-0 w-24 h-24 blur-3xl -mr-12 -mt-12 opacity-20 transition-opacity group-hover:opacity-40 ${
                        insight.discipline === 'humanities' ? 'bg-indigo-500' :
                        insight.discipline === 'science' ? 'bg-[#4ECDC4]' :
                        insight.discipline === 'engineering' ? 'bg-amber-500' : 'bg-rose-500'
                      }`} />
                      
                      <div className="flex items-center gap-3 mb-4">
                        <div className={`p-2 rounded-xl ${
                          insight.discipline === 'humanities' ? 'bg-indigo-50 text-indigo-600' :
                          insight.discipline === 'science' ? 'bg-teal-50 text-teal-600' :
                          insight.discipline === 'engineering' ? 'bg-amber-50 text-amber-600' : 'bg-rose-50 text-rose-600'
                        }`}>
                          {insight.discipline === 'humanities' && <BookOpen size={20} />}
                          {insight.discipline === 'science' && <FlaskConical size={20} />}
                          {insight.discipline === 'engineering' && <Settings size={20} />}
                          {insight.discipline === 'business' && <PieChart size={20} />}
                        </div>
                        <span className="font-bold text-sm uppercase tracking-wider">
                          {t[insight.discipline]}
                        </span>
                      </div>
                      
                      <h4 className="text-lg font-bold mb-2 group-hover:text-teal-600 transition-colors">{insight.title}</h4>
                      <p className="text-sm text-gray-500 mb-4 leading-relaxed line-clamp-3">{insight.content}</p>
                      
                      <div className="pt-4 border-t border-black/5">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                            <TrendingUp size={12} />
                            {t.futureTrend}
                          </div>
                          {insight.timestamp && (
                            <span className="text-[9px] text-gray-500 font-medium tabular-nums">{insight.timestamp}</span>
                          )}
                        </div>
                        <p className="text-xs font-medium text-gray-700 italic">
                          {insight.trend}
                        </p>
                      </div>
                    </motion.a>
                  ))
                )}
              </div>
            </section>

            {/* Self-Service Bar Section */}
            <section className="space-y-4">
              <div className="flex items-center justify-between px-2">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <Cpu size={20} className="text-blue-500" />
                  {t.agentDirectory}
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {loading ? (
                  Array(3).fill(0).map((_, i) => (
                    <div key={i} className="h-64 bg-white rounded-3xl animate-pulse border border-black/5" />
                  ))
                ) : (
                  (() => {
                    const agents = data?.agentIntros || [];
                    const fallbackAgents = language === 'zh' ? FALLBACK_AGENTS_ZH : FALLBACK_AGENTS_EN;
                    const displayed = agents.length >= 3
                      ? agents.slice(0, 3)
                      : [...agents, ...fallbackAgents.filter(f => !agents.find(a => a.name === f.name))].slice(0, 3);
                    return displayed;
                  })().map((agent, i) => (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 * i }}
                      key={agent.name}
                      className="bg-white p-6 rounded-3xl border border-black/5 shadow-sm hover:shadow-md transition-all group flex flex-col"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 font-bold text-xl">
                          {agent.name[0]}
                        </div>
                        <span className="text-[10px] font-bold bg-gray-100 text-gray-500 px-2 py-1 rounded-full uppercase tracking-wider">
                          {agent.category}
                        </span>
                      </div>
                      
                      <h4 className="text-lg font-bold mb-2">{agent.name}</h4>
                      <p className="text-sm text-gray-500 mb-4 line-clamp-2 flex-grow">{agent.description}</p>
                      
                      <div className="space-y-2 mb-6">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{t.agentFeatures}</p>
                        <div className="flex flex-wrap gap-1.5">
                          {agent.features.map((feature) => (
                            <span key={feature} className="text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md font-medium">
                              {feature}
                            </span>
                          ))}
                        </div>
                      </div>
                      
                      <a 
                        href={agent.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full py-3 bg-black text-white rounded-xl text-center text-sm font-bold hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
                      >
                        {t.visitSite}
                        <ExternalLink size={14} />
                      </a>
                    </motion.div>
                  ))
                )}
              </div>
            </section>

            {/* News Feed (投研黑咖) — investor only; student content is in Heavy Hitter */}
            {persona === 'investor' && (
              <section className="space-y-4">
                <div className="flex items-center justify-between px-2">
                  <h3 className="text-xl font-bold flex items-center gap-2 border-l-4 border-amber-700 pl-3 bg-amber-50/40 rounded-r-lg py-1 pr-3">
                    <Globe size={20} className="text-amber-700" />
                    {t.intelligenceStream}
                  </h3>
                  <button className="text-sm font-medium text-gray-500 hover:text-black transition-colors">{t.viewAll}</button>
                </div>
                
                <div className="space-y-3">
                  {loading ? (
                    Array(4).fill(0).map((_, i) => (
                      <div key={i} className="h-32 bg-white rounded-2xl animate-pulse border border-black/5" />
                    ))
                  ) : (
                    (data?.news || []).map((item, i) => (
                      <motion.a 
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        key={item.id} 
                        className="bg-white p-5 rounded-2xl border border-black/5 shadow-sm hover:shadow-md transition-all group block"
                      >
                        <div className="flex gap-4">
                          <div className="flex-shrink-0 w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400 group-hover:bg-teal-50 group-hover:text-teal-500 transition-colors">
                            {item.type === 'product' && <Cpu size={24} />}
                            {item.type === 'funding' && <Briefcase size={24} />}
                            {item.type === 'research' && <GraduationCap size={24} />}
                            {item.type === 'tech' && <Zap size={24} />}
                            {item.type === 'policy' && <Globe size={24} />}
                          </div>
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">{item.source} · <span className="text-[9px] text-gray-500 font-normal not-italic">{item.timestamp}</span></span>
                              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button className="p-1.5 hover:bg-black/5 rounded-lg text-gray-400 hover:text-black"><Bookmark size={14} /></button>
                                <button className="p-1.5 hover:bg-black/5 rounded-lg text-gray-400 hover:text-black"><Share2 size={14} /></button>
                              </div>
                            </div>
                            <h4 className="text-lg font-bold leading-snug group-hover:text-teal-600 transition-colors">{item.title}</h4>
                            <p className="text-sm text-gray-500 line-clamp-2">{item.context}</p>
                            <div className="bg-gray-50 p-3 rounded-xl border-l-2 border-teal-500">
                              <p className="text-xs font-medium text-gray-700">
                                <span className="font-bold text-teal-600 uppercase mr-2">{t.signal}:</span>
                                {item.takeaway}
                              </p>
                            </div>
                          </div>
                        </div>
                      </motion.a>
                    ))
                  )}
                </div>
              </section>
            )}

            {/* Topic Heatmap + Calendar side by side */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Topic Heatmap */}
              <section className="bg-white rounded-3xl border border-black/5 shadow-sm p-5">
                <h3 className="font-bold flex items-center gap-2 mb-4 border-l-4 border-amber-700 pl-3 bg-amber-50/40 rounded-r-lg py-1 pr-3">
                  <TrendingUp size={18} className="text-amber-700" />
                  {t.topicRadar}
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {loading ? (
                    Array(4).fill(0).map((_, i) => (
                      <div key={i} className="h-16 bg-gray-100 rounded-2xl animate-pulse" />
                    ))
                  ) : (
                    (data?.topics || []).map((topic) => (
                      <div key={topic.name} className="p-3 rounded-2xl bg-gray-50 border border-black/5 hover:border-orange-200 transition-colors">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-xs">#{topic.name}</span>
                          <span className={`w-2 h-2 rounded-full ${topic.status === 'high' ? 'bg-rose-500' : 'bg-orange-400 animate-pulse'}`} />
                        </div>
                        <p className="text-[10px] text-gray-500 leading-tight">{topic.insight}</p>
                      </div>
                    ))
                  )}
                </div>
              </section>

              {/* Calendar */}
              <section className="bg-white rounded-3xl border border-black/5 shadow-sm p-5">
                <h3 className="font-bold flex items-center gap-2 mb-4">
                  <Calendar size={18} className="text-gray-500" />
                  {t.upcoming}
                </h3>
                <div className="space-y-4">
                  {loading ? (
                    Array(2).fill(0).map((_, i) => (
                      <div key={i} className="h-10 bg-gray-100 rounded-xl animate-pulse" />
                    ))
                  ) : (
                    (data?.calendar || []).map((item) => (
                      <div key={item.event} className="flex gap-4">
                        <div className="flex-shrink-0 w-10 text-center">
                          <p className="text-[10px] font-bold text-gray-400 uppercase">{item.date.split(' ')[0]}</p>
                          <p className="text-lg font-bold leading-none">{item.date.split(' ')[1]}</p>
                        </div>
                        <div className="flex-1 pb-4 border-b border-black/5 last:border-0">
                          <p className="text-sm font-bold">{item.event}</p>
                          <p className="text-xs text-gray-500">{t.globalEvent} · {t.virtual}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </section>
            </div>

            {/* Today's One Action — Student Only */}
            {persona === 'student' && data?.todayAction && (
              <TodayActionCard action={data.todayAction} t={t} />
            )}
          </div>

          {/* Right Column: Social, Deals */}
          <div className="lg:col-span-4 space-y-6">
            {/* Social Signals - Investor Only */}
            {persona === 'investor' && (
              <section className="bg-white rounded-3xl border border-black/5 shadow-sm overflow-hidden">
                <div className="p-5 border-b border-black/5 bg-gray-50/50 flex items-center justify-between">
                  <h3 className="font-bold flex items-center gap-2">
                    <MessageSquare size={18} className="text-blue-500" />
                    {t.socialSignals}
                  </h3>
                  <span className="text-[10px] font-bold bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">{t.live}</span>
                </div>
                <div className="divide-y divide-black/5">
                  {loading ? (
                    Array(3).fill(0).map((_, i) => (
                      <div key={i} className="p-5 space-y-3 animate-pulse">
                        <div className="flex gap-3">
                          <div className="w-10 h-10 bg-gray-200 rounded-full" />
                          <div className="space-y-2 flex-1">
                            <div className="h-3 w-1/2 bg-gray-200 rounded" />
                            <div className="h-2 w-1/4 bg-gray-100 rounded" />
                          </div>
                        </div>
                        <div className="h-10 bg-gray-100 rounded" />
                      </div>
                    ))
                  ) : (
                    (data?.socialSignals || []).map((signal, i) => (
                      <motion.a 
                        href={signal.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 + i * 0.1 }}
                        key={signal.id} 
                        className="p-5 hover:bg-gray-50 transition-colors group block"
                      >
                        <div className="flex gap-3 mb-3">
                          {signal.author.avatar ? (
                            <img 
                              src={signal.author.avatar} 
                              alt="" 
                              className="w-10 h-10 rounded-full bg-gray-100" 
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs">
                              {signal.author.name.charAt(0)}
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1">
                              <span className="font-bold text-sm">{signal.author.name}</span>
                              <span className="text-gray-400 text-xs">{signal.author.handle}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <p className="text-[10px] text-gray-500 font-medium uppercase tracking-tight">
                                {signal.author.role} · {signal.author.followers}
                              </p>
                              {signal.timestamp && (
                                <span className="text-[9px] text-gray-500 font-medium tabular-nums">· {signal.timestamp}</span>
                              )}
                            </div>
                          </div>
                        </div>
                        <p className="text-sm text-gray-700 leading-relaxed mb-3">
                          {signal.content}
                        </p>
                        <div className="bg-blue-50/50 p-3 rounded-xl border border-blue-100 mb-3">
                          <p className="text-xs text-blue-800 leading-relaxed">
                            <span className="font-bold mr-1">💡 {t.interpretation}:</span>
                            {signal.interpretation}
                          </p>
                        </div>
                        <div className="flex items-center justify-between text-[10px] font-bold text-blue-600 uppercase tracking-widest">
                          <span className="flex items-center gap-1">
                            <TrendingUp size={10} />
                            High Signal
                          </span>
                          <span className="flex items-center gap-1 group-hover:underline">
                            {t.viewPost} <ExternalLink size={10} />
                          </span>
                        </div>
                      </motion.a>
                    ))
                  )}
                </div>
              </section>
            )}

            {/* Student Specific Modules — PeerStory & SoloEntrepreneur moved to left sliding cards */}
            {persona === 'student' && !loading && data && (
              <SideHustleSection t={t} sideHustles={data.sideHustles || []} />
            )}

            {/* Deals or Learning Resources */}
            <section className="bg-white rounded-3xl border border-black/5 shadow-sm overflow-hidden">
              <div className="p-5 border-b border-black/5 bg-gray-50/50">
                <h3 className="font-bold flex items-center gap-2">
                  {persona === 'investor' ? (
                    <><Briefcase size={18} className="text-teal-500" /> {t.keyDeals}</>
                  ) : (
                    <><GraduationCap size={18} className="text-indigo-500" /> {t.learningPath}</>
                  )}
                </h3>
              </div>
              <div className="p-5 space-y-4">
                {loading ? (
                  Array(3).fill(0).map((_, i) => (
                    <div key={i} className="h-16 bg-gray-100 rounded-2xl animate-pulse" />
                  ))
                ) : (
                  persona === 'investor' ? (
                    (data?.deals || []).map((deal) => (
                      <a 
                        key={deal.company} 
                        href={deal.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between p-3 rounded-2xl hover:bg-gray-50 transition-colors border border-transparent hover:border-black/5 block"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm">{deal.company}</span>
                            <span className="text-[10px] font-bold bg-teal-100 text-teal-700 px-1.5 py-0.5 rounded uppercase">{deal.stage}</span>
                          </div>
                          <p className="text-xs text-gray-500 truncate w-40">{deal.description}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-sm">{deal.amount}</p>
                          <p className="text-[9px] text-gray-500 tabular-nums">{deal.timestamp || t.recent}</p>
                        </div>
                      </a>
                    ))
                  ) : (
                    (data?.news || []).slice(0, 3).map((item) => (
                      <a 
                        key={item.id} 
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-3 rounded-2xl hover:bg-gray-50 transition-colors border border-transparent hover:border-black/5 block"
                      >
                        <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-500">
                          <GraduationCap size={20} />
                        </div>
                        <div>
                          <p className="font-bold text-sm line-clamp-1">{item.title}</p>
                          <p className="text-xs text-gray-500">{t.resource} · 5 {t.minRead}{item.timestamp && <span className="text-[9px] text-gray-500 ml-1">· {item.timestamp}</span>}</p>
                        </div>
                        <ExternalLink size={14} className="ml-auto text-gray-300" />
                      </a>
                    ))
                  )
                )}
              </div>
            </section>

            {/* No Pretending - I Use AI Too - Student Only */}
            {persona === 'student' && (
              <CampusVoice
                t={t}
                language={language}
                dailyPrompt={data?.dailyPrompt}
                onPostSuccess={() => { addPoints(3); refreshUserStats(); }}
              />
            )}
          </div>
        </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto px-4 py-12 border-t border-black/5 mt-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <img src="/logo.png" className="w-9 h-9 object-contain" alt="Daily Shot Logo" />
              <div className="flex flex-col leading-tight">
                <h1 className="text-base font-bold tracking-tight">Daily Shot.</h1>
                <span className="text-[10px] text-gray-500 font-medium tracking-wide">{t.appTagline}</span>
              </div>
            </div>
            <p className="text-sm text-gray-500 leading-relaxed">
              {t.footerDesc}
            </p>
          </div>
          <div>
            <h4 className="font-bold text-sm mb-4">{t.product}</h4>
            <ul className="space-y-2 text-sm text-gray-500">
              <li><a href="#" className="hover:text-black">{t.dailyBriefing}</a></li>
              <li><a href="#" className="hover:text-black">{t.marketSignals}</a></li>
              <li><a href="#" className="hover:text-black">{t.learningPath}</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-sm mb-4">{t.company}</h4>
            <ul className="space-y-2 text-sm text-gray-500">
              <li><a href="#" className="hover:text-black">{t.about}</a></li>
              <li><a href="#" className="hover:text-black">{t.contact}</a></li>
              <li><a href="#" className="hover:text-black">{t.privacy}</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-sm mb-4">{t.subscribe}</h4>
            <div className="flex gap-2">
              <input type="email" placeholder={t.emailPlaceholder} className="bg-black/5 border-0 rounded-xl px-4 py-2 text-sm flex-1 focus:ring-2 focus:ring-teal-500 outline-none" />
              <button className="bg-black text-white px-4 py-2 rounded-xl text-sm font-bold">{t.join}</button>
            </div>
          </div>
        </div>
        <div className="pt-12 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-gray-400">
          <p>© 2026 Daily Shot. {t.rights}</p>
          <div className="flex items-center gap-6">
            <a href="#" className="hover:text-black">{t.twitter}</a>
            <a href="#" className="hover:text-black">{t.linkedIn}</a>
            <a href="#" className="hover:text-black">{t.discord}</a>
          </div>
        </div>
      </footer>

      {/* Right-side vertical floating bar - only on dashboard view */}
      {!showDeepDive && !showProfile && !showPodcast && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="fixed right-4 top-1/2 -translate-y-1/2 z-40 flex flex-col gap-2 p-2 bg-white/90 backdrop-blur-md border border-black/10 rounded-2xl shadow-lg"
        >
          <button
            onClick={() => setShowPodcast(true)}
            className="p-3 rounded-xl hover:bg-violet-50 text-violet-600 hover:text-violet-700 transition-colors"
            title={t.podcastDaily}
          >
            <Headphones size={20} />
          </button>
          <button
            onClick={() => { setShowProfile(true); refreshUserStats(); }}
            className="p-3 rounded-xl hover:bg-amber-50 transition-colors flex flex-col items-center gap-0.5"
            title={t.myProfileFloat}
          >
            <Award size={18} className="text-amber-600" />
            <span className="text-[10px] font-bold tabular-nums text-amber-600">{(userStats ?? getUserStats()).aiLiteracyPoints}</span>
            <Flame size={14} className="text-rose-500" />
            <span className="text-[9px] font-bold tabular-nums text-rose-500">{(userStats ?? getUserStats()).currentStreakDays}</span>
          </button>
        </motion.div>
      )}
    </div>
  );
}
