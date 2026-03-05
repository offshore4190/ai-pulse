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
  Rocket
} from 'lucide-react';
import { Persona, DashboardData, Language, Discipline } from './types';
import { fetchDashboardData } from './services/geminiService';

const translations = {
// ... existing translations ...
// ... existing translations ...
  en: {
    investor: 'Investor',
    student: 'Student',
    todaySignal: "Today's Signal",
    readAnalysis: 'Read Full Analysis',
    intelligenceStream: 'Intelligence Stream',
    viewAll: 'View All',
    socialSignals: 'Social Signals',
    keyDeals: 'Key Deals',
    learningPath: 'Learning Path',
    topicRadar: 'Topic Radar',
    upcoming: 'Upcoming',
    interpretation: 'Interpretation',
    signal: 'Signal',
    action: 'Action',
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
    aiPlusMajor: 'AI + Major',
    agentDirectory: 'AI Agent Directory',
    agentCategory: 'Category',
    agentFeatures: 'Key Features',
    visitSite: 'Visit Website',
    humanities: 'Humanities',
    science: 'Science',
    engineering: 'Engineering',
    business: 'Business',
    futureTrend: 'Future Trend',
    errorTitle: 'Intelligence Feed Interrupted',
    errorDesc: 'We have exceeded the current API quota. Please wait a moment or switch to a paid API key for uninterrupted service.',
    retry: 'Retry Connection',
    switchKey: 'Switch to Paid API Key',
    demoMode: 'Demo Mode',
    demoNotice: 'Live feed paused due to quota. Showing cached/example data.',
    papers: 'Research Papers',
    majorNews: 'Major-Specific News',
    forums: 'Community Forums',
    backToDashboard: 'Back to Dashboard',
    deepDiveTitle: 'AI + Major Deep Dive',
    viewPost: 'View Post',
    campusVoice: 'Campus Voice',
    campusVoiceDesc: 'Share your AI insights with fellow students.',
    sharePlaceholder: 'What AI breakthrough did you discover today?',
    post: 'Post',
    anonymous: 'Anonymous',
    complianceNotice: 'Please stay respectful. Content is moderated for community safety.',
    sideHustleTitle: 'Side Hustle Inspiration',
    lowCostStart: 'Low Cost Start',
    peerStoryTitle: 'What Global Peers are Doing',
    weeklyStory: 'Weekly Story',
    whatYouCanLearn: 'What You Can Learn',
    income: 'Income',
    funding: 'Funding',
    soloEntrepreneurTitle: 'Solo Entrepreneur / Indie Maker',
    indieMaker: 'Indie Maker'
  },
  zh: {
    investor: '投资人',
    student: '大学生',
    todaySignal: '今日信号',
    readAnalysis: '阅读深度分析',
    intelligenceStream: '情报流',
    viewAll: '查看全部',
    socialSignals: '社交信号',
    keyDeals: '核心交易',
    learningPath: '学习路径',
    topicRadar: '话题雷达',
    upcoming: '即将到来',
    interpretation: '深度解读',
    signal: '投资信号',
    action: '行动建议',
    footerDesc: '为下一代建设者和支持者提供的高保真情报。',
    product: '产品',
    company: '公司',
    subscribe: '订阅',
    join: '加入',
    rights: '版权所有。',
    live: '实时',
    resource: '资源',
    minRead: '分钟阅读',
    globalEvent: '全球事件',
    virtual: '线上',
    aiPlusMajor: 'AI + 专业',
    agentDirectory: 'AI Agent 导航',
    agentCategory: '分类',
    agentFeatures: '核心特点',
    visitSite: '访问网站',
    humanities: '文科',
    science: '理科',
    engineering: '工科',
    business: '商科',
    futureTrend: '未来趋势',
    errorTitle: '情报流暂时中断',
    errorDesc: '当前 API 配额已耗尽。请稍候重试，或切换至您的付费 API 密钥以获得不间断服务。',
    retry: '重试连接',
    switchKey: '切换至付费 API 密钥',
    demoMode: '演示模式',
    demoNotice: '由于配额限制，实时流已暂停。正在显示示例数据。',
    papers: '前沿学术研究',
    majorNews: '专业细分时讯',
    forums: '可交流的论坛',
    backToDashboard: '返回仪表盘',
    deepDiveTitle: 'AI + 专业 深度探索',
    viewPost: '查看原文',
    campusVoice: '校园之声',
    campusVoiceDesc: '与同学分享你的 AI 见解。',
    sharePlaceholder: '今天你发现了什么 AI 突破？',
    post: '发布',
    anonymous: '匿名用户',
    complianceNotice: '请保持友善。内容将经过审核以确保社区安全。',
    sideHustleTitle: '本周副业灵感',
    lowCostStart: '低成本启动',
    peerStoryTitle: '全球同龄人在干嘛',
    weeklyStory: '本周故事',
    whatYouCanLearn: '你可以学到',
    income: '收入',
    funding: '融了',
    soloEntrepreneurTitle: '一人公司 / 青年创业者',
    indieMaker: '独立开发者'
  }
};

function CampusVoice({ t, language }: { t: any, language: Language }) {
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState("");
  const socketRef = useRef<WebSocket | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Determine WebSocket URL based on current origin
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}`;
    
    const socket = new WebSocket(wsUrl);
    socketRef.current = socket;

    socket.onmessage = (event) => {
      const message = JSON.parse(event.data);
      if (message.type === "init") {
        setMessages(message.data);
      } else if (message.type === "new_message") {
        setMessages((prev) => [...prev, message.data]);
      }
    };

    return () => {
      socket.close();
    };
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = () => {
    if (!inputText.trim() || !socketRef.current) return;
    
    socketRef.current.send(JSON.stringify({
      type: "post",
      text: inputText.trim(),
      user: t.anonymous
    }));
    
    setInputText("");
  };

  return (
    <section className="bg-white rounded-3xl border border-black/5 shadow-sm overflow-hidden flex flex-col h-[400px]">
      <div className="p-5 border-b border-black/5 bg-indigo-50/30 flex items-center justify-between">
        <h3 className="font-bold flex items-center gap-2">
          <MessageSquare size={18} className="text-indigo-600" />
          {t.campusVoice}
        </h3>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">{t.live}</span>
        </div>
      </div>
      
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-5 space-y-4 scroll-smooth"
      >
        {messages.map((msg) => (
          <div key={msg.id} className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-tight">{msg.user}</span>
              <span className="text-[10px] text-gray-400">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
            <div className="bg-gray-50 p-3 rounded-2xl rounded-tl-none border border-black/5">
              <p className="text-sm text-gray-700 leading-relaxed">{msg.text}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 border-t border-black/5 bg-gray-50/30 space-y-3">
        <div className="flex gap-2">
          <input 
            type="text" 
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder={t.sharePlaceholder}
            className="flex-1 bg-white border border-black/10 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
          />
          <button 
            onClick={handleSend}
            disabled={!inputText.trim()}
            className="p-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send size={18} />
          </button>
        </div>
        <div className="flex items-center gap-2 text-[10px] text-gray-400 font-medium italic">
          <ShieldCheck size={12} className="text-emerald-500" />
          {t.complianceNotice}
        </div>
      </div>
    </section>
  );
}

function SideHustleSection({ t, sideHustles }: { t: any, sideHustles: any[] }) {
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between px-2">
        <h3 className="text-xl font-bold flex items-center gap-2">
          <Coins size={20} className="text-amber-500" />
          {t.sideHustleTitle}
        </h3>
        <span className="text-[10px] font-bold bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full uppercase tracking-wider">
          {t.lowCostStart}
        </span>
      </div>
      <div className="space-y-4">
        {sideHustles.map((hustle, idx) => (
          <motion.div 
            key={hustle.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="bg-white p-6 rounded-3xl border border-black/5 shadow-sm hover:shadow-md transition-all space-y-4"
          >
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-indigo-600 text-white rounded-lg flex items-center justify-center font-bold">
                  {idx + 1}
                </div>
                <h4 className="font-bold text-lg">{hustle.title}</h4>
              </div>
              <span className="text-sm font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-lg">
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

function PeerStorySection({ t, story }: { t: any, story: any }) {
  if (!story || !story.author) return null;
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between px-2">
        <h3 className="text-xl font-bold flex items-center gap-2">
          <Globe size={20} className="text-blue-500" />
          {t.peerStoryTitle}
        </h3>
        <span className="text-[10px] font-bold bg-purple-100 text-purple-600 px-2 py-0.5 rounded-full uppercase tracking-wider">
          {t.weeklyStory}
        </span>
      </div>
      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white p-6 rounded-3xl border border-black/5 shadow-sm hover:shadow-md transition-all space-y-6"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img 
              src={story.author.avatar} 
              alt="" 
              className="w-12 h-12 rounded-2xl bg-gray-100" 
              referrerPolicy="no-referrer"
            />
            <div>
              <h4 className="font-bold text-lg">{story.author.name}</h4>
              <p className="text-xs text-gray-500 font-medium">
                {story.author.school} • {story.author.status}
              </p>
            </div>
          </div>
          <div className="bg-emerald-50 text-emerald-600 text-xs font-bold px-3 py-1 rounded-lg">
            {story.funding}
          </div>
        </div>
        
        <div className="space-y-3">
          <h5 className="font-bold text-gray-800 leading-tight">{story.title}</h5>
          <p className="text-sm text-gray-600 leading-relaxed">
            {story.content}
          </p>
        </div>

        <div className="pt-4 border-t border-black/5">
          <div className="flex items-center gap-2 text-[10px] font-bold text-purple-600 uppercase tracking-widest mb-2">
            <Lightbulb size={14} />
            {t.whatYouCanLearn}
          </div>
          <p className="text-sm font-medium text-gray-700 italic">
            {story.takeaway}
          </p>
        </div>
      </motion.div>
    </section>
  );
}

function SoloEntrepreneurSection({ t, entrepreneurs }: { t: any, entrepreneurs: any[] }) {
  if (!entrepreneurs || entrepreneurs.length === 0) return null;
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between px-2">
        <h3 className="text-xl font-bold flex items-center gap-2">
          <Rocket size={20} className="text-rose-500" />
          {t.soloEntrepreneurTitle}
        </h3>
        <span className="text-[10px] font-bold bg-rose-100 text-rose-600 px-2 py-0.5 rounded-full uppercase tracking-wider">
          {t.indieMaker}
        </span>
      </div>
      <div className="grid grid-cols-1 gap-4">
        {entrepreneurs.map((person, idx) => (
          <motion.div 
            key={person.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="bg-white p-5 rounded-3xl border border-black/5 shadow-sm hover:shadow-md transition-all space-y-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img 
                  src={person.avatar} 
                  alt="" 
                  className="w-10 h-10 rounded-xl bg-gray-100" 
                  referrerPolicy="no-referrer"
                />
                <div>
                  <h4 className="font-bold text-sm">{person.name}</h4>
                  <p className="text-[10px] text-gray-500 font-medium">{person.role}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs font-bold text-rose-600">{person.revenue}</p>
                <p className="text-[10px] text-gray-400 uppercase tracking-tighter">Revenue</p>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Project:</span>
                <span className="text-sm font-bold text-gray-800">{person.project}</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {person.stack.map((tech: string) => (
                  <span key={tech} className="text-[9px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md font-bold uppercase">
                    {tech}
                  </span>
                ))}
              </div>
            </div>

            <div className="bg-rose-50/50 p-3 rounded-2xl border border-rose-100/50">
              <p className="text-xs text-rose-900 leading-relaxed italic">
                "{person.insight}"
              </p>
            </div>

            <a 
              href={person.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-2 bg-gray-50 hover:bg-black hover:text-white rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all"
            >
              {t.visitSite} <ExternalLink size={12} />
            </a>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

export default function App() {
  const [persona, setPersona] = useState<Persona>('investor');
  const [language, setLanguage] = useState<Language>('zh');
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDeepDive, setShowDeepDive] = useState(false);

  const t = translations[language];

  useEffect(() => {
    loadData();
  }, [persona, language]);

  const loadData = async () => {
    // If we already have data, don't show the full loading skeleton to make it feel faster
    // (Unless it's the very first load)
    if (!data) setLoading(true);
    setError(null);
    
    try {
      const result = await fetchDashboardData(persona, language);
      setData(result);
      // If result is demo, we might want to show a small toast or notice, 
      // but not the full error card which blocks the UI.
      if (result.isDemo) {
        console.warn("Displaying demo data due to API quota limits.");
      }
    } catch (err: any) {
      console.error(err);
      // Only show error card if we have NO data at all (not even demo/cached)
      if (!data) {
        setError(err.message || 'Failed to fetch data');
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
      alert('API key selection is not available in this environment.');
    }
  };

  return (
    <div className={`min-h-screen bg-[#F8F9FA] text-[#1A1A1A] font-sans selection:bg-emerald-100`}>
      {/* Top Navigation */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-bottom border-black/5 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center text-white font-bold italic">
              AI
            </div>
            <h1 className="text-lg font-semibold tracking-tight">Pulse</h1>
            {data?.isDemo && (
              <div className="flex items-center gap-1.5 px-2 py-0.5 bg-amber-100 text-amber-700 rounded-md border border-amber-200 ml-2 animate-pulse">
                <div className="w-1.5 h-1.5 bg-amber-500 rounded-full" />
                <span className="text-[10px] font-bold uppercase tracking-wider">{t.demoMode}</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center bg-black/5 p-1 rounded-full">
              <button 
                onClick={() => setPersona('investor')}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${persona === 'investor' ? 'bg-white shadow-sm text-black' : 'text-gray-500 hover:text-black'}`}
              >
                <BarChart3 size={14} />
                {t.investor}
              </button>
              <button 
                onClick={() => setPersona('student')}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${persona === 'student' ? 'bg-white shadow-sm text-black' : 'text-gray-500 hover:text-black'}`}
              >
                <GraduationCap size={14} />
                {t.student}
              </button>
            </div>

            <button 
              onClick={() => setLanguage(language === 'en' ? 'zh' : 'en')}
              className="flex items-center gap-2 px-3 py-1.5 bg-black/5 hover:bg-black/10 rounded-full text-sm font-medium transition-colors"
            >
              <Languages size={14} />
              {language === 'en' ? '中文' : 'EN'}
            </button>
          </div>

          <div className="flex items-center gap-4">
            <button className="p-2 text-gray-500 hover:bg-black/5 rounded-full transition-colors">
              <Search size={20} />
            </button>
            <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-white text-xs font-bold">
              JD
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        <AnimatePresence mode="wait">
          {showDeepDive ? (
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
                    <div className="p-6 border-b border-black/5 flex items-center justify-between bg-emerald-50/30">
                      <h3 className="text-xl font-bold flex items-center gap-2">
                        <BookOpen className="text-emerald-600" size={22} />
                        {t.papers}
                      </h3>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-emerald-600/50 uppercase tracking-widest">Verified Sources</span>
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      </div>
                    </div>
                    <div className="divide-y divide-black/5">
                      {data?.majorDeepDive?.papers.map((paper) => (
                        <a 
                          key={paper.id}
                          href={paper.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-6 block hover:bg-emerald-50/10 transition-all group"
                        >
                          <div className="flex justify-between items-start gap-6">
                            <div className="space-y-3">
                              <h4 className="font-bold text-xl group-hover:text-emerald-600 transition-colors leading-tight">
                                {paper.title}
                              </h4>
                              <p className="text-sm text-gray-500 line-clamp-2 leading-relaxed">
                                {paper.context}
                              </p>
                              <div className="flex items-center gap-4 text-xs">
                                <span className="font-bold px-2 py-1 bg-emerald-100 text-emerald-700 rounded-md">{paper.source}</span>
                                <span className="text-gray-400 font-medium">{paper.timestamp}</span>
                                <span className="text-emerald-600 font-bold flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  Read Full Paper <ChevronRight size={12} />
                                </span>
                              </div>
                            </div>
                            <div className="p-3 rounded-2xl bg-gray-50 group-hover:bg-emerald-100 text-gray-400 group-hover:text-emerald-600 transition-all flex-shrink-0">
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
                              <span className="text-[10px] text-gray-400 font-medium">{news.timestamp}</span>
                            </div>
                            <h4 className="font-bold text-lg group-hover:text-blue-600 transition-colors leading-snug">
                              {news.title}
                            </h4>
                            <p className="text-sm text-gray-500 line-clamp-2 leading-relaxed">
                              {news.context}
                            </p>
                            <div className="pt-2 flex items-center gap-2 text-blue-600 text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                              View Article <ExternalLink size={12} />
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
                            Active Community
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
              <div key={i} className="h-20 bg-white rounded-2xl animate-pulse border border-black/5" />
            ))
          ) : (
            (data?.metrics || []).map((metric, i) => (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                key={metric.label} 
                className="bg-white p-4 rounded-2xl border border-black/5 shadow-sm hover:shadow-md transition-shadow"
              >
                <p className="text-[10px] uppercase tracking-wider font-semibold text-gray-400 mb-1">{metric.label}</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-xl font-bold font-mono">{metric.value}</span>
                  {metric.change && (
                    <span className={`text-[11px] font-medium flex items-center ${metric.isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {metric.isPositive ? <TrendingUp size={10} className="mr-0.5" /> : <TrendingDown size={10} className="mr-0.5" />}
                      {metric.change}
                    </span>
                  )}
                </div>
              </motion.div>
            ))
          )}
        </div>

        {data?.isDemo && !error && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-amber-50 border border-amber-100 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4"
          >
            <div className="flex items-center gap-3 text-amber-800">
              <div className="p-2 bg-amber-100 rounded-lg">
                <AlertCircle size={20} />
              </div>
              <p className="text-sm font-medium">{t.demoNotice}</p>
            </div>
            <button 
              onClick={handleSwitchKey}
              className="text-xs font-bold bg-amber-600 text-white px-4 py-2 rounded-lg hover:bg-amber-700 transition-colors flex items-center gap-2"
            >
              <Settings size={14} />
              {t.switchKey}
            </button>
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: News & Signals */}
          <div className="lg:col-span-8 space-y-6">
            {/* Today's Signal (Hero) */}
            <section className="bg-black text-white rounded-3xl p-8 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/20 blur-[100px] -mr-32 -mt-32 rounded-full" />
              <div className="relative z-10 space-y-4">
                <div className="flex items-center gap-2 text-emerald-400">
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
                        <p className="text-[10px] uppercase font-bold text-emerald-400 mb-2">
                          {persona === 'investor' ? t.signal : t.action}
                        </p>
                        <p className="text-sm italic leading-relaxed">
                          "{data?.todaySignal.takeaway}"
                        </p>
                      </div>
                      <button 
                        onClick={() => window.open(data?.todaySignal.url, '_blank')}
                        className="bg-emerald-500 hover:bg-emerald-400 text-black font-bold px-6 py-4 rounded-2xl transition-all flex items-center justify-center gap-2 self-end md:self-center"
                      >
                        {t.readAnalysis}
                        <ChevronRight size={18} />
                      </button>
                    </div>
                  </>
                )}
              </div>
            </section>

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
                        insight.discipline === 'science' ? 'bg-emerald-500' :
                        insight.discipline === 'engineering' ? 'bg-amber-500' : 'bg-rose-500'
                      }`} />
                      
                      <div className="flex items-center gap-3 mb-4">
                        <div className={`p-2 rounded-xl ${
                          insight.discipline === 'humanities' ? 'bg-indigo-50 text-indigo-600' :
                          insight.discipline === 'science' ? 'bg-emerald-50 text-emerald-600' :
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
                      
                      <h4 className="text-lg font-bold mb-2 group-hover:text-emerald-600 transition-colors">{insight.title}</h4>
                      <p className="text-sm text-gray-500 mb-4 leading-relaxed line-clamp-3">{insight.content}</p>
                      
                      <div className="pt-4 border-t border-black/5">
                        <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">
                          <TrendingUp size={12} />
                          {t.futureTrend}
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

            {/* AI Agent Directory Section */}
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
                  (data?.agentIntros || []).map((agent, i) => (
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

            {/* News Feed */}
            <section className="space-y-4">
              <div className="flex items-center justify-between px-2">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <Globe size={20} className="text-emerald-500" />
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
                        <div className="flex-shrink-0 w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400 group-hover:bg-emerald-50 group-hover:text-emerald-500 transition-colors">
                          {item.type === 'product' && <Cpu size={24} />}
                          {item.type === 'funding' && <Briefcase size={24} />}
                          {item.type === 'research' && <GraduationCap size={24} />}
                          {item.type === 'tech' && <Zap size={24} />}
                          {item.type === 'policy' && <Globe size={24} />}
                        </div>
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">{item.source} • {item.timestamp}</span>
                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button className="p-1.5 hover:bg-black/5 rounded-lg text-gray-400 hover:text-black"><Bookmark size={14} /></button>
                              <button className="p-1.5 hover:bg-black/5 rounded-lg text-gray-400 hover:text-black"><Share2 size={14} /></button>
                            </div>
                          </div>
                          <h4 className="text-lg font-bold leading-snug group-hover:text-emerald-600 transition-colors">{item.title}</h4>
                          <p className="text-sm text-gray-500 line-clamp-2">{item.context}</p>
                          <div className="bg-gray-50 p-3 rounded-xl border-l-2 border-emerald-500">
                            <p className="text-xs font-medium text-gray-700">
                              <span className="font-bold text-emerald-600 uppercase mr-2">
                                {persona === 'investor' ? t.signal : t.action}:
                              </span>
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
          </div>

          {/* Right Column: Social, Deals, Calendar */}
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
                          <div>
                            <div className="flex items-center gap-1">
                              <span className="font-bold text-sm">{signal.author.name}</span>
                              <span className="text-gray-400 text-xs">{signal.author.handle}</span>
                            </div>
                            <p className="text-[10px] text-gray-500 font-medium uppercase tracking-tight">
                              {signal.author.role} • {signal.author.followers}
                            </p>
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

            {/* Student Specific Modules */}
            {persona === 'student' && !loading && data && (
              <>
                <SideHustleSection t={t} sideHustles={data.sideHustles || []} />
                <PeerStorySection t={t} story={data.peerStory} />
                <SoloEntrepreneurSection t={t} entrepreneurs={data.soloEntrepreneurs || []} />
              </>
            )}

            {/* Deals or Learning Resources */}
            <section className="bg-white rounded-3xl border border-black/5 shadow-sm overflow-hidden">
              <div className="p-5 border-b border-black/5 bg-gray-50/50">
                <h3 className="font-bold flex items-center gap-2">
                  {persona === 'investor' ? (
                    <><Briefcase size={18} className="text-emerald-500" /> {t.keyDeals}</>
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
                            <span className="text-[10px] font-bold bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded uppercase">{deal.stage}</span>
                          </div>
                          <p className="text-xs text-gray-500 truncate w-40">{deal.description}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-sm">{deal.amount}</p>
                          <p className="text-[10px] text-gray-400">Valuation N/A</p>
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
                          <p className="text-xs text-gray-500">{t.resource} • 5 {t.minRead}</p>
                        </div>
                        <ExternalLink size={14} className="ml-auto text-gray-300" />
                      </a>
                    ))
                  )
                )}
              </div>
            </section>

            {/* Campus Voice - Student Only */}
            {persona === 'student' && (
              <CampusVoice t={t} language={language} />
            )}

            {/* Topic Heatmap */}
            <section className="bg-white rounded-3xl border border-black/5 shadow-sm p-5">
              <h3 className="font-bold flex items-center gap-2 mb-4">
                <TrendingUp size={18} className="text-orange-500" />
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
                        <p className="text-xs text-gray-500">{t.globalEvent} • {t.virtual}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>
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
              <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center text-white font-bold italic">
                AI
              </div>
              <h1 className="text-lg font-semibold tracking-tight">Pulse</h1>
            </div>
            <p className="text-sm text-gray-500 leading-relaxed">
              {t.footerDesc}
            </p>
          </div>
          <div>
            <h4 className="font-bold text-sm mb-4">{t.product}</h4>
            <ul className="space-y-2 text-sm text-gray-500">
              <li><a href="#" className="hover:text-black">Daily Briefing</a></li>
              <li><a href="#" className="hover:text-black">Market Signals</a></li>
              <li><a href="#" className="hover:text-black">Learning Path</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-sm mb-4">{t.company}</h4>
            <ul className="space-y-2 text-sm text-gray-500">
              <li><a href="#" className="hover:text-black">About</a></li>
              <li><a href="#" className="hover:text-black">Contact</a></li>
              <li><a href="#" className="hover:text-black">Privacy</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-sm mb-4">{t.subscribe}</h4>
            <div className="flex gap-2">
              <input type="email" placeholder="Email" className="bg-black/5 border-0 rounded-xl px-4 py-2 text-sm flex-1 focus:ring-2 focus:ring-emerald-500 outline-none" />
              <button className="bg-black text-white px-4 py-2 rounded-xl text-sm font-bold">{t.join}</button>
            </div>
          </div>
        </div>
        <div className="pt-12 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-gray-400">
          <p>© 2026 AI Pulse Intelligence. {t.rights}</p>
          <div className="flex items-center gap-6">
            <a href="#" className="hover:text-black">Twitter</a>
            <a href="#" className="hover:text-black">LinkedIn</a>
            <a href="#" className="hover:text-black">Discord</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
