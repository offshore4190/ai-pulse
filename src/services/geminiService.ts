import { GoogleGenAI } from "@google/genai";
import { DashboardData, Persona, Language } from "../types";

// 延迟初始化：避免模块加载时 new GoogleGenAI() 抛出导致整页空白
// Vite 的 define 会在构建时替换 process.env.GEMINI_API_KEY
let _ai: InstanceType<typeof GoogleGenAI> | null = null;
function getAI() {
  if (!_ai) {
    _ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY ?? '' });
  }
  return _ai;
}

// Simple session-based cache to prevent redundant API calls and speed up navigation
const cache: Record<string, { data: DashboardData; timestamp: number }> = {};
const CACHE_TTL = 1000 * 60 * 30; // 30 minutes cache (standard session)
const PERSISTENT_CACHE_KEY = 'first_cup_report_cache';
const LEGACY_CACHE_KEY = 'ai_shot_report_cache';

function getPersistentCache(): Record<string, { data: DashboardData; timestamp: number }> {
  try {
    // Migrate from legacy key if present
    const legacy = localStorage.getItem(LEGACY_CACHE_KEY);
    if (legacy) {
      localStorage.setItem(PERSISTENT_CACHE_KEY, legacy);
      localStorage.removeItem(LEGACY_CACHE_KEY);
    }
    const stored = localStorage.getItem(PERSISTENT_CACHE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

function setPersistentCache(data: Record<string, { data: DashboardData; timestamp: number }>) {
  try {
    localStorage.setItem(PERSISTENT_CACHE_KEY, JSON.stringify(data));
  } catch (e) {
    console.warn("LocalStorage persistent cache failed:", e);
  }
}

function isSameDay(d1: number, d2: number) {
  const date1 = new Date(d1);
  const date2 = new Date(d2);
  return date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate();
}

export async function fetchDashboardData(persona: Persona, language: Language, forceRefresh = false): Promise<DashboardData> {
  const cacheKey = `${persona}-${language}`;
  const now = Date.now();

  // 1. Check in-memory cache
  if (!forceRefresh && cache[cacheKey] && (now - cache[cacheKey].timestamp < CACHE_TTL)) {
    return cache[cacheKey].data;
  }

  // 2. Check persistent cache for "One Report Per Day" logic
  const pCache = getPersistentCache();
  if (!forceRefresh && pCache[cacheKey]) {
    const { data: cachedData, timestamp: cachedTime } = pCache[cacheKey];
    
    // If it's the same day and NOT breaking news, return cached data
    if (isSameDay(now, cachedTime) && !cachedData.isBreakingNews) {
      console.log(`[Cache] Returning today's report for ${cacheKey}`);
      // Also update in-memory cache
      cache[cacheKey] = pCache[cacheKey];
      return cachedData;
    }
  }

  const languageInstruction = language === 'zh' 
    ? "Use Simplified Chinese." 
    : "Use English.";

    // Optimized prompt for abundance, diversity, and extreme accuracy of URLs
    const prompt = `
    Generate a high-density AI intelligence dashboard JSON for a ${persona === 'student' ? 'Student' : 'Investor'}.
    Date: ${new Date().toLocaleDateString()}. Language: ${languageInstruction}.
    
    CRITICAL REQUIREMENTS:
    1. GROUNDING: Use Google Search to find the most RELEVANT, HIGH-QUALITY, and DIVERSE AI information. No strict time limit, but prioritize recent significant breakthroughs and evergreen high-value resources.
    2. ABUNDANCE: Provide a rich set of data. 
       - For Investor: Aim for 6-8 news items, 4 social signals, and 5-6 agent introductions.
       - For Student: Aim for 6-8 news items, 2 side hustle inspirations ("sideHustles"), 1 peer story ("peerStory"), 2-3 solo entrepreneur profiles ("soloEntrepreneurs"), and 5-6 agent introductions. DO NOT provide "socialSignals" for Students.
    3. DIRECT LINKS: Every "url" MUST be a direct link to a SPECIFIC article, research paper, blog post, or project page. 
    4. NO HOMEPAGES: Do NOT use generic domain links (e.g., research.google or arxiv.org). Use the full deep-link path (e.g., research.google/blog/article-name/).
    5. SOCIAL SIGNALS (Investor Only): Use REAL, SPECIFIC post URLs from X (Twitter), LinkedIn, or official AI company blogs (OpenAI, Anthropic, DeepMind). NO FAKE HANDLES. Prefer deep links to specific posts (e.g., x.com/user/status/123) over profile links.
    6. TWITTER LINKS: Ensure all Twitter (X) links are valid and lead to the actual content described. If a specific post URL is unavailable, use a highly relevant official blog post or research page instead.
    7. MAJOR INSIGHTS: For "majorInsights", provide EXACTLY 4 items, one for each discipline: "humanities", "science", "engineering", and "business". Each should be a high-impact breakthrough.
    8. DEEP DIVE: Provide a "majorDeepDive" object for the expanded view. 
       - "papers": 4-5 real, high-impact recent AI papers with direct links (arXiv/OpenReview).
       - "majorNews": 4-5 news items specifically about AI integration in Humanities, Science, Engineering, and Business.
       - "forums": 3-4 real, active AI communities/forums (e.g., Reddit r/MachineLearning, HF Forums, specific academic AI circles).
    9. NO HOMEPAGES: Do NOT use generic domain links. Use the full deep-link path.
    10. VERIFICATION: Only include links that are real and accessible.
    11. BREAKING NEWS: Randomly determine if "isBreakingNews" is true based on major events.

    JSON Schema:
    {
      "isBreakingNews": bool,
      "todaySignal": { "title": "str", "description": "str", "takeaway": "str", "url": "str" },
      "metrics": [ { "label": "str", "value": "str", "change": "str", "isPositive": bool } ],
      "news": [ { "id": "str", "type": "product|funding|policy|tech|research", "title": "str", "context": "str", "source": "str", "takeaway": "str", "timestamp": "str", "url": "str" } ],
      "socialSignals": [ { "id": "str", "author": { "name": "str", "handle": "str", "avatar": "str", "role": "str", "followers": "str" }, "content": "str", "interpretation": "str", "url": "str" } ],
      "deals": [ { "company": "str", "stage": "str", "description": "str", "investors": ["str"], "amount": "str", "url": "str" } ],
      "sideHustles": [ { "id": "str", "title": "str", "income": "str", "description": "str", "steps": ["str"] } ],
      "peerStory": { "author": { "name": "str", "avatar": "str", "school": "str", "status": "str" }, "title": "str", "content": "str", "funding": "str", "takeaway": "str" },
      "soloEntrepreneurs": [ { "id": "str", "name": "str", "role": "str", "avatar": "str", "project": "str", "revenue": "str", "stack": ["str"], "insight": "str", "url": "str" } ],
      "topics": [ { "name": "str", "status": "high|rising", "insight": "str" } ],
      "calendar": [ { "date": "str", "event": "str" } ],
      "majorInsights": [ { "discipline": "humanities|science|engineering|business", "title": "str", "content": "str", "trend": "str", "url": "str" } ],
      "majorInsightsUrl": "str",
      "majorDeepDive": {
        "papers": [ { "id": "str", "title": "str", "source": "str", "url": "str", "timestamp": "str" } ],
        "majorNews": [ { "id": "str", "title": "str", "source": "str", "url": "str", "timestamp": "str" } ],
        "forums": [ { "name": "str", "url": "str", "description": "str" } ]
      },
      "agentIntros": [ { "name": "str", "category": "str", "features": ["str"], "description": "str", "url": "str" } ]
    }
  `;

  try {
    interface GeminiResponse {
      text?: string;
    }

    const fetchWithRetry = async (retries = 3, delay = 2000): Promise<GeminiResponse> => {
      try {
        const response = await getAI().models.generateContent({
          model: "gemini-1.5-flash",
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            tools: [{ google_search: {} }] as any,
            temperature: 0.1,
          },
        }) as GeminiResponse;
        return response;
      } catch (error: unknown) {
        const err = error as { message?: string; status?: string };
        const isQuotaError = (typeof err?.message === 'string' && err.message.includes("429")) || err?.status === "RESOURCE_EXHAUSTED";
        const isServerError = (typeof err?.message === 'string' && (err.message.includes("500") || err.message.includes("xhr error"))) || err?.status === "INTERNAL";

        if ((isQuotaError || isServerError) && retries > 0) {
          console.log(`API error (${err?.status ?? 'UNKNOWN'}), retrying in ${delay}ms... (${retries} retries left)`);
          await new Promise(resolve => setTimeout(resolve, delay));
          return fetchWithRetry(retries - 1, delay * 2);
        }
        throw error;
      }
    };

    const response = await fetchWithRetry();
    const data = JSON.parse(response.text || "{}");
    
    // Ensure all expected arrays exist to prevent frontend crashes
    const sanitizedData: DashboardData = {
      isBreakingNews: data.isBreakingNews || false,
      producedAt: new Date().toISOString(),
      todaySignal: data.todaySignal || { title: "AI Shot", description: "Intelligence feed", takeaway: "Stay tuned", url: "#" },
      metrics: Array.isArray(data.metrics) ? data.metrics.map((m: any) => ({
        label: m.label || 'Metric',
        value: m.value || 'N/A',
        change: m.change || '0%',
        isPositive: typeof m.isPositive === 'boolean' ? m.isPositive : true
      })) : [],
      news: Array.isArray(data.news) ? data.news.map((item: any) => ({
        id: item.id || Math.random().toString(36).substring(7),
        type: item.type || 'tech',
        title: item.title || 'AI Update',
        context: item.context || 'New developments in artificial intelligence.',
        source: item.source || 'AI Intelligence',
        takeaway: item.takeaway || 'Stay informed.',
        timestamp: item.timestamp || 'Recent',
        url: item.url || '#'
      })) : [],
      socialSignals: Array.isArray(data.socialSignals) ? data.socialSignals.map((s: any) => ({
        id: s.id || Math.random().toString(36).substring(7),
        author: s.author ? {
          name: s.author.name || 'Expert',
          handle: s.author.handle || '@ai_expert',
          avatar: s.author.avatar || '',
          role: s.author.role || 'AI Insider',
          followers: s.author.followers || '10k'
        } : { name: 'Expert', handle: '@ai_expert', avatar: '', role: 'AI Insider', followers: '10k' },
        content: s.content || 'No content provided.',
        interpretation: s.interpretation || 'No interpretation provided.',
        url: s.url || '#'
      })) : [],
      topics: Array.isArray(data.topics) ? data.topics : [],
      calendar: Array.isArray(data.calendar) ? data.calendar : [],
      majorInsights: Array.isArray(data.majorInsights) ? data.majorInsights : [],
      majorInsightsUrl: typeof data.majorInsightsUrl === 'string' ? data.majorInsightsUrl : "https://arxiv.org/list/cs.AI/recent",
      majorDeepDive: data.majorDeepDive ? {
        papers: Array.isArray(data.majorDeepDive.papers) ? data.majorDeepDive.papers : [],
        majorNews: Array.isArray(data.majorDeepDive.majorNews) ? data.majorDeepDive.majorNews : [],
        forums: Array.isArray(data.majorDeepDive.forums) ? data.majorDeepDive.forums : [],
      } : undefined,
      agentIntros: Array.isArray(data.agentIntros) ? data.agentIntros : [],
      deals: Array.isArray(data.deals) ? data.deals : [],
      sideHustles: Array.isArray(data.sideHustles) ? data.sideHustles : [],
      peerStory: (data.peerStory && data.peerStory.author) ? data.peerStory : undefined,
      soloEntrepreneurs: Array.isArray(data.soloEntrepreneurs) ? data.soloEntrepreneurs : [],
    };
    
    // Store in cache
    cache[cacheKey] = { data: sanitizedData, timestamp: now };
    
    // Update persistent cache
    const currentPCache = getPersistentCache();
    currentPCache[cacheKey] = { data: sanitizedData, timestamp: now };
    setPersistentCache(currentPCache);
    
    return sanitizedData;
  } catch (error: unknown) {
    const err = error as { message?: string; status?: string };
    const isQuotaError = (typeof err?.message === 'string' && err.message.includes("429")) || err?.status === "RESOURCE_EXHAUSTED";

    if (isQuotaError) {
      console.warn("Gemini API quota exceeded. Switching to high-quality fallback data to ensure uninterrupted service.");
    } else {
      console.error("Error fetching dashboard data, falling back to static content:", err);
    }
    
    // Return a high-quality static fallback if API fails
    const fallbackData: DashboardData = getFallbackData(persona, language);
    fallbackData.producedAt = new Date().toISOString();
    return fallbackData;
  }
}

/** Prefetch next data (opposite persona) */
export async function prefetchNextData(currentPersona: Persona, language: Language) {
  const nextPersona = currentPersona === 'investor' ? 'student' : 'investor';
  const cacheKey = `${nextPersona}-${language}`;
  
  if (!cache[cacheKey]) {
    console.log(`[Prefetch] Starting prefetch for ${cacheKey}`);
    try {
      await fetchDashboardData(nextPersona, language);
      console.log(`[Prefetch] Successfully prefetched ${cacheKey}`);
    } catch (e) {
      console.error(`[Prefetch] Failed for ${cacheKey}:`, e);
    }
  }
}

function getFallbackData(persona: Persona, language: Language): DashboardData {
  const isZh = language === 'zh';
  
  if (persona === 'investor') {
    return {
      isDemo: true,
      todaySignal: {
        title: isZh ? "AI 基础设施投资热潮持续" : "AI Infrastructure Investment Surge Continues",
        description: isZh ? "随着大模型竞争进入白热化，底层算力与能源基础设施成为资本追逐的新焦点。" : "As LLM competition intensifies, underlying compute and energy infrastructure become the new focus for capital.",
        takeaway: isZh ? "关注液冷技术与边缘计算节点的早期机会。" : "Focus on early opportunities in liquid cooling and edge computing nodes.",
        url: "https://techcrunch.com/category/artificial-intelligence/"
      },
      metrics: [
        { label: "NVDA", value: "$785.20", change: "+2.4%", isPositive: true },
        { label: "Weekly Funding", value: "$4.2B", change: "+12%", isPositive: true },
        { label: "AI M&A", value: "12", change: "0", isPositive: true },
        { label: "GPU Lead Time", value: "18w", change: "-2w", isPositive: true },
        { label: "Sentiment", value: "Bullish", change: "+5%", isPositive: true }
      ],
      news: [
        { id: "f1", type: "funding", title: "Mistral AI Raises €600M", context: "European AI champion secures massive funding for next-gen models.", source: "Reuters", takeaway: "European sovereignty in AI is gaining serious financial backing.", timestamp: "2h ago", url: "https://www.reuters.com/technology/" },
        { id: "f2", type: "tech", title: "NVIDIA Blackwell Production Ramps Up", context: "Supply chain reports suggest higher than expected yields for B200 chips.", source: "Bloomberg", takeaway: "Compute bottleneck may ease sooner than anticipated.", timestamp: "5h ago", url: "https://www.bloomberg.com/technology" }
      ],
      socialSignals: [
        { 
          id: "s1", 
          author: { 
            name: "Sam Altman", 
            handle: "@sama", 
            avatar: "https://picsum.photos/seed/sama/100/100", 
            role: "OpenAI CEO", 
            followers: "2.5M" 
          }, 
          content: "The rate of progress in the next 12 months will surprise everyone.", 
          interpretation: "Expect major model updates (GPT-5?) sooner than later.", 
          url: "https://x.com/sama/status/1758223652857540864" 
        },
        { 
          id: "s2", 
          author: { 
            name: "Andrej Karpathy", 
            handle: "@karpathy", 
            avatar: "https://picsum.photos/seed/karpathy/100/100", 
            role: "AI Researcher", 
            followers: "1M" 
          }, 
          content: "LLMs are the new kernel. We are learning how to program them.", 
          interpretation: "Shift from coding to orchestrating AI models.", 
          url: "https://x.com/karpathy/status/1752813158021706051" 
        }
      ],
      deals: [
        { company: "Scale AI", stage: "Series F", description: "Data labeling and RLHF infrastructure.", amount: "$1B", url: "https://scale.com", investors: ["Accel", "Thrive Capital"] }
      ],
      topics: [
        { name: "Sovereign AI", status: "high", insight: "Nations building their own compute clusters." }
      ],
      majorInsights: [
        { discipline: "humanities", title: "AI in Digital Humanities", content: "LLMs are revolutionizing the analysis of historical texts and cultural trends.", trend: "Automated archival research.", url: "https://research.google/blog/using-ai-to-help-preserve-endangered-languages/" },
        { discipline: "science", title: "AlphaFold 3 Breakthrough", content: "Predicting the structure and interactions of all life's molecules.", trend: "Accelerated drug discovery.", url: "https://deepmind.google/technologies/alphafold/" },
        { discipline: "engineering", title: "Generative Design in CAD", content: "AI-driven optimization for structural integrity and material efficiency.", trend: "Autonomous manufacturing pipelines.", url: "https://research.google/blog/a-new-approach-to-computation-offloading-for-on-device-ml/" },
        { discipline: "business", title: "AI-Driven Market Intelligence", content: "Real-time sentiment analysis and predictive modeling for global trade.", trend: "Hyper-personalized consumer experiences.", url: "https://www.mckinsey.com/capabilities/quantumblack/our-insights" }
      ],
      majorInsightsUrl: "https://arxiv.org/list/cs.AI/recent",
      majorDeepDive: {
        papers: [
          { id: "p1", type: "research", title: "Attention Is All You Need", context: "The seminal paper that introduced the Transformer architecture, replacing RNNs and CNNs for sequence modeling.", source: "arXiv", takeaway: "The foundation of all modern LLMs.", url: "https://arxiv.org/abs/1706.03762", timestamp: "Classic" },
          { id: "p2", type: "research", title: "Language Models are Few-Shot Learners", context: "Introduced GPT-3 and demonstrated that massive scaling enables models to perform tasks with minimal examples.", source: "arXiv", takeaway: "Scaling is a predictable path to intelligence.", url: "https://arxiv.org/abs/2005.14165", timestamp: "Classic" },
          { id: "p3", type: "research", title: "AlphaFold 3: Molecular Structure Prediction", context: "DeepMind's breakthrough in predicting the structures and interactions of all life's molecules.", source: "Nature", takeaway: "Revolutionizing drug discovery and biology.", url: "https://www.nature.com/articles/s41586-024-07487-w", timestamp: "2024" }
        ],
        majorNews: [
          { id: "m1", type: "tech", title: "AI in Healthcare: Diagnostic Breakthroughs", context: "FDA clears new AI algorithms for early cancer detection in medical imaging.", source: "Nature Medicine", takeaway: "AI is moving from research to clinical practice.", url: "https://www.nature.com/nm/", timestamp: "Recent" },
          { id: "m2", type: "tech", title: "AI in Finance: High-Frequency Evolution", context: "JPMorgan's IndexGPT begins rolling out for institutional clients.", source: "Bloomberg", takeaway: "Financial services are being re-engineered around LLMs.", url: "https://www.bloomberg.com/ai", timestamp: "Recent" },
          { id: "m3", type: "policy", title: "The EU AI Act: Implementation Begins", context: "First set of guidelines for high-risk AI systems released by the AI Office.", source: "EU Commission", takeaway: "Regulatory compliance is now a core business requirement.", url: "https://digital-strategy.ec.europa.eu/en/policies/regulatory-framework-ai", timestamp: "Recent" }
        ],
        forums: [
          { name: "Reddit r/MachineLearning", url: "https://www.reddit.com/r/MachineLearning/", description: "The premier community for ML research, paper discussions, and industry news." },
          { name: "Hugging Face Forums", url: "https://discuss.huggingface.co/", description: "The hub for open-source AI, model fine-tuning, and NLP community support." },
          { name: "arXiv AI Section", url: "https://arxiv.org/list/cs.AI/recent", description: "Daily feed of the latest artificial intelligence research pre-prints." },
          { name: "Papers with Code", url: "https://paperswithcode.com/", description: "Browse the state-of-the-art in machine learning with code and datasets." }
        ]
      },
      calendar: [
        { date: "MAR 15", event: "NVIDIA GTC Conference" }
      ],
      agentIntros: [
        { name: "Devin", category: "Coding", features: ["Autonomous coding", "Shell access"], description: "The first autonomous AI software engineer.", url: "https://www.cognition-labs.com/" }
      ]
    };
  } else {
    return {
      isDemo: true,
      todaySignal: {
        title: isZh ? "AI 辅助科研效率提升 40%" : "AI-Assisted Research Efficiency Up 40%",
        description: isZh ? "最新研究表明，使用 AI 智能体进行文献综述和实验设计的学生，其产出质量显著提高。" : "Latest studies show students using AI agents for literature review and experimental design see significant quality gains.",
        takeaway: isZh ? "掌握提示词工程将成为未来学术研究的核心竞争力。" : "Mastering prompt engineering will become a core competency for future academic research.",
        url: "https://arxiv.org/search/?searchtype=all&query=AI+research+efficiency"
      },
      metrics: [
        { label: "AI Tools Used", value: "85%", change: "+5%", isPositive: true },
        { label: "Research Papers", value: "1.2k", change: "+200", isPositive: true },
        { label: "Job Openings", value: "45k", change: "+15%", isPositive: true },
        { label: "Skill Demand", value: "Python", change: "High", isPositive: true },
        { label: "Learning Rate", value: "Fast", change: "N/A", isPositive: true }
      ],
      news: [
        { id: "n1", type: "research", title: "New Transformer Architecture", context: "Researchers propose a more efficient way to handle long-context windows.", source: "arXiv", takeaway: "Lower hardware requirements for running large models locally.", timestamp: "1d ago", url: "https://arxiv.org/abs/2401.00000" },
        { id: "n2", type: "product", title: "GitHub Copilot Workspace", context: "A new environment for building entire features with natural language.", source: "GitHub Blog", takeaway: "The barrier to building complex apps is disappearing.", timestamp: "3d ago", url: "https://github.blog/" }
      ],
      socialSignals: [],
      sideHustles: [
        {
          id: "sh1",
          title: isZh ? "帮本地店铺做AI短视频" : "AI Short Videos for Local Shops",
          income: isZh ? "¥2000-5000/月" : "$300-800/mo",
          description: isZh ? "咖啡店、健身房、餐厅都需要短视频内容。你用AI工具（如HeyGen/Argil/剪映）帮他们做，每月10-15条，收费¥400-1000/客户。同时服务5个客户就有稳定收入。" : "Coffee shops, gyms, and restaurants need short video content. You use AI tools to help them make 10-15 videos per month, charging $100-200 per client.",
          steps: isZh ? [
            "去学校附近逛一圈，找5家看起来需要内容的店",
            "用AI数字人或分身工具做3条样片，直接给老板看效果",
            "第一个客户可以免费做1周，换个好评和转介绍",
            "建立SOP，利用AI自动化剪辑流程"
          ] : [
            "Visit local shops near campus and find 5 that need content",
            "Use AI avatar or cloning tools to create 3 sample videos",
            "Offer a free 1-week trial for the first client to get testimonials",
            "Build an SOP to automate the editing process using AI"
          ]
        },
        {
          id: "sh2",
          title: isZh ? "AI辅助的1v1辅导" : "AI-Assisted 1v1 Tutoring",
          income: isZh ? "¥150-300/小时" : "$30-60/hr",
          description: isZh ? "用AI帮你备课、生成练习题、做学习计划。你专注于1v1辅导和答疑。效率比传统家教高3倍，可以同时带更多学生。" : "Use AI to help you prepare lessons, generate exercises, and create study plans. Focus on 1v1 tutoring and Q&A.",
          steps: isZh ? [
            "选一门你擅长的课，用Claude/GPT生成一套教案",
            "在小红书/朋友圈发'AI辅助学习法'的帖子引流",
            "每次课后用AI生成针对性练习题发给学生",
            "使用AI实时总结学生的薄弱点，调整教学进度"
          ] : [
            "Pick a subject you're good at, use AI to generate lesson plans",
            "Post 'AI-Assisted Learning' content on social media to attract students",
            "Use AI after each session to generate personalized exercises",
            "Use AI to summarize student weaknesses and adjust teaching pace"
          ]
        },
        {
          id: "sh3",
          title: isZh ? "AI提示词工程师/顾问" : "AI Prompt Engineer/Consultant",
          income: isZh ? "¥3000-8000/项目" : "$500-1500/project",
          description: isZh ? "很多传统企业想用AI但不知道怎么写提示词。你帮他们定制Prompt，优化工作流，或者搭建简单的AI Agent。" : "Many traditional businesses want to use AI but don't know how to write prompts. You help them customize prompts and optimize workflows.",
          steps: isZh ? [
            "在Upwork/闲鱼/小红书展示你写的复杂Prompt案例",
            "为小型电商团队提供'AI提效方案'咨询",
            "帮客户把繁琐的Excel操作变成一句话指令",
            "持续维护Prompt库，按月收取服务费"
          ] : [
            "Showcase complex prompt cases on Upwork or social media",
            "Provide 'AI Efficiency' consulting for small e-commerce teams",
            "Turn tedious Excel operations into one-sentence commands",
            "Maintain a prompt library and charge a monthly service fee"
          ]
        }
      ],
      peerStory: {
        author: {
          name: "Shraman & Shreyas Kar",
          avatar: "https://picsum.photos/seed/shraman/100/100",
          school: "Stanford",
          status: isZh ? "辍学创业" : "Dropout Founders"
        },
        title: isZh ? "这对兄弟在Stanford读书时开始做Golpo" : "These brothers started Golpo while at Stanford",
        content: isZh ? "一个能把文档自动变成动画解说视频的AI工具。他们发现教授和企业都需要把复杂内容变成易懂的视频，但传统方式太贵太慢。现在他们已经辍学全职做，刚融了$410万种子轮。" : "An AI tool that automatically turns documents into animated explainer videos. They found professors and businesses need to turn complex content into easy-to-understand videos.",
        funding: isZh ? "融了$410万" : "Raised $4.1M",
        takeaway: isZh ? "找到'贵且慢'的事情，用AI让它变得'便宜且快'。视频制作就是典型例子。" : "Find things that are 'expensive and slow', use AI to make them 'cheap and fast'."
      },
      soloEntrepreneurs: [
        {
          id: "se1",
          name: "Pieter Levels",
          role: "Solo Founder",
          avatar: "https://picsum.photos/seed/levels/100/100",
          project: "PhotoAI / Nomad List",
          revenue: "$200k+/mo",
          stack: ["PHP", "jQuery", "SQLite"],
          insight: isZh ? "不要过度设计。解决一个真实存在的问题，然后快速变现。" : "Don't over-engineer. Solve a real problem and monetize quickly.",
          url: "https://levels.io/"
        },
        {
          id: "se2",
          name: "Marc Lou",
          role: "Indie Maker",
          avatar: "https://picsum.photos/seed/marclou/100/100",
          project: "ShipFast / ByeDispute",
          revenue: "$50k+/mo",
          stack: ["Next.js", "Tailwind", "MongoDB"],
          insight: isZh ? "速度就是一切。如果你不为第一个版本感到羞愧，那你就发布得太晚了。" : "Speed is everything. If you are not embarrassed by your first version, you launched too late.",
          url: "https://marclou.com/"
        }
      ],
      topics: [
        { name: "RAG", status: "high", insight: "Retrieval Augmented Generation is the standard for accuracy." }
      ],
      majorInsights: [
        { discipline: "humanities", title: "AI for Language Preservation", content: "Using LLMs to document and revitalize endangered languages.", trend: "Real-time translation of oral histories.", url: "https://research.google/blog/using-ai-to-help-preserve-endangered-languages/" },
        { discipline: "science", title: "AI in Climate Modeling", content: "Deep learning models predicting extreme weather events with unprecedented accuracy.", trend: "Hyper-local climate adaptation.", url: "https://research.google/blog/video-generation-models-as-world-simulators/" },
        { discipline: "engineering", title: "AI-Optimized Robotics", content: "Reinforcement learning for agile locomotion in complex environments.", trend: "Humanoid robots in logistics.", url: "https://research.google/blog/tackling-the-challenges-of-long-form-video-understanding/" },
        { discipline: "business", title: "The Rise of AI Solopreneurs", content: "AI agents enabling single individuals to run complex business operations.", trend: "Decentralized autonomous organizations.", url: "https://www.ycombinator.com/library/95-the-future-of-ai-agents" }
      ],
      majorInsightsUrl: "https://paperswithcode.com/area/ai",
      majorDeepDive: {
        papers: [
          { id: "p1", type: "research", title: "LoRA: Low-Rank Adaptation of LLMs", context: "A method for fine-tuning large models with minimal hardware by only updating a small subset of parameters.", source: "arXiv", takeaway: "Enables local model customization on consumer GPUs.", url: "https://arxiv.org/abs/2106.09685", timestamp: "1d ago" },
          { id: "p2", type: "research", title: "Direct Preference Optimization (DPO)", context: "A simpler and more stable alternative to RLHF for aligning language models with human preferences.", source: "arXiv", takeaway: "Easier alignment for custom models.", url: "https://arxiv.org/abs/2305.18290", timestamp: "Recent" },
          { id: "p3", type: "research", title: "The Llama 3 Herd of Models", context: "Meta's detailed report on training and evaluating the Llama 3 family of open-weights models.", source: "Meta AI", takeaway: "Open-source models are catching up to proprietary ones.", url: "https://ai.meta.com/research/publications/the-llama-3-herd-of-models/", timestamp: "2024" }
        ],
        majorNews: [
          { id: "m1", type: "product", title: "AI in Education: Personalized Tutors", context: "Khan Academy and OpenAI partner to bring personalized AI tutoring to millions of students.", source: "EdTech", takeaway: "Classroom efficiency and student engagement are increasing.", url: "https://www.khanacademy.org/khan-labs", timestamp: "2d ago" },
          { id: "m2", type: "tech", title: "The Future of AI Coding Agents", context: "New benchmarks show AI agents solving complex real-world software engineering tasks autonomously.", source: "GitHub", takeaway: "Software development is being redefined as system orchestration.", url: "https://github.blog/category/ai/", timestamp: "Recent" },
          { id: "m3", type: "tech", title: "Open Source AI: The Year of the Local LLM", context: "Tools like Ollama and LM Studio make it trivial to run powerful models on personal laptops.", source: "The Verge", takeaway: "Privacy-first AI is becoming accessible to everyone.", url: "https://www.theverge.com/ai-artificial-intelligence", timestamp: "Recent" }
        ],
        forums: [
          { name: "Stack Overflow AI", url: "https://stackoverflow.com/questions/tagged/artificial-intelligence", description: "Technical Q&A for AI developers, covering everything from PyTorch to prompt engineering." },
          { name: "Reddit r/LearnMachineLearning", url: "https://www.reddit.com/r/learnmachinelearning/", description: "A supportive community for students starting their journey in ML and data science." },
          { name: "DeepLearning.AI Community", url: "https://community.deeplearning.ai/", description: "Discussion forums for Andrew Ng's courses and broader AI career advice." },
          { name: "Kaggle Discussions", url: "https://www.kaggle.com/discussions", description: "The place to discuss data science competitions, datasets, and best practices." }
        ]
      },
      calendar: [
        { date: "APR 10", event: "Google I/O 2026" }
      ],
      agentIntros: [
        { name: "Perplexity", category: "Search", features: ["Real-time search", "Source citations"], description: "AI-powered search engine that provides direct answers.", url: "https://www.perplexity.ai/" }
      ]
    };
  }
}
