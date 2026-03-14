import { GoogleGenAI } from "@google/genai";
import { DashboardData, Persona, Language } from "../types";

// ── Backend pipeline URL ──────────────────────────────────────────────────
// When the Python FastAPI backend is running, it exposes a pre-built snapshot
// that was assembled via the four-stage pipeline (RSS → preprocess → AI score → aggregate).
// This is faster and cheaper than a direct Gemini call on every page load.
// Set VITE_PIPELINE_API_URL in .env to point to the backend (e.g. http://localhost:8000).
// Leave it empty to disable the backend fast-path and always call Gemini directly.
const PIPELINE_API_URL = (import.meta as any).env?.VITE_PIPELINE_API_URL ?? '';

async function tryFetchFromBackend(
  persona: Persona,
  language: Language,
): Promise<DashboardData | null> {
  if (!PIPELINE_API_URL) return null;

  try {
    const url = `${PIPELINE_API_URL}/api/pipeline/snapshot?persona=${persona}&language=${language}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return null;
    const data: DashboardData = await res.json();
    // Minimal sanity check — must at least have todaySignal
    if (!data?.todaySignal?.title) return null;
    console.log(`[Pipeline] Loaded snapshot from backend for ${persona}-${language}`);
    return data;
  } catch {
    // Backend unreachable or timed out — fall through to Gemini
    return null;
  }
}

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
    if (isSameDay(now, cachedTime) && !cachedData.isBreakingNews) {
      console.log(`[Cache] Returning today's report for ${cacheKey}`);
      cache[cacheKey] = pCache[cacheKey];
      return cachedData;
    }
  }

  // 3. Try the Python pipeline backend first (pre-built snapshot, no Gemini cost)
  if (!forceRefresh) {
    const backendData = await tryFetchFromBackend(persona, language);
    if (backendData) {
      backendData.producedAt = backendData.producedAt ?? new Date().toISOString();
      cache[cacheKey] = { data: backendData, timestamp: now };
      const updatedPCache = getPersistentCache();
      updatedPCache[cacheKey] = { data: backendData, timestamp: now };
      setPersistentCache(updatedPCache);
      return backendData;
    }
  }

  // 4. Fallback: direct Gemini API call (original behaviour)
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
    3. DIRECT LINKS: Every "url" MUST be a direct link to a SPECIFIC article, blog post, or project page. For "news", prefer official AI company blog posts (openai.com/blog, anthropic.com/news, deepmind.google/blog, ai.meta.com/blog) and top-tier tech media (TechCrunch, The Verge, Wired, VentureBeat).
    4. NO HOMEPAGES: Do NOT use generic domain links (e.g., research.google or arxiv.org). Use the full deep-link path (e.g., research.google/blog/article-name/).
    5. SOCIAL SIGNALS (Investor Only): Use REAL, SPECIFIC post URLs from X (Twitter) (x.com/user/status/...), YouTube videos (youtube.com/watch?v=...), or Reddit threads (reddit.com/r/.../comments/...). NO FAKE HANDLES. NO arxiv links in this section.
    6. TWITTER LINKS: Ensure all Twitter (X) links are valid and lead to the actual content described. If a specific post URL is unavailable, use a highly relevant official blog post or research page instead.
    7. MAJOR INSIGHTS: For "majorInsights", provide EXACTLY 4 items, one for each discipline: "humanities", "science", "engineering", and "business". Each should be a high-impact breakthrough. Use official research blog posts (research.google/blog/, ai.meta.com/research/, openai.com/research/) — NOT raw arxiv links.
    8. DEEP DIVE: Provide a "majorDeepDive" object for the expanded view. 
       - "papers": 4-5 real, high-impact recent AI papers with direct links (arXiv/OpenReview). This is the ONLY section that may use arxiv.org links.
       - "majorNews": 4-5 news items specifically about AI integration in Humanities, Science, Engineering, and Business. Use tech media or official blog links, NOT arxiv.
       - "forums": 3-4 real, active AI communities/forums (e.g., Reddit r/MachineLearning, HF Forums, YouTube AI channels).
    9. NO HOMEPAGES: Do NOT use generic domain links. Use the full deep-link path.
    10. VERIFICATION: Only include links that are real and accessible.
    11. BREAKING NEWS: Randomly determine if "isBreakingNews" is true based on major events.
    12. SOURCE RULES (MANDATORY — strictly enforce per field):
        - news[]: Sources MUST be official AI company blogs or top-tier tech media. NO arxiv or academic paper links.
        - socialSignals[]: Sources MUST be X (Twitter) posts, YouTube videos, or Reddit threads. NO arxiv links.
        - deals[]: Sources from Crunchbase, TechCrunch funding articles, or official press releases. NO arxiv links.
        - sideHustles[], soloEntrepreneurs[]: Sources from YouTube tutorials, Reddit success stories, Indie Hackers, or product landing pages. NO arxiv links.
        - majorDeepDive.papers[]: ONLY section permitted to use arxiv.org, OpenReview, or Nature paper links.
        - majorInsights[]: Use official research blog posts only. NO raw arxiv links.
    13. KEYWORD WEIGHTING: When searching for content, PRIORITIZE topics around: product launch, release, use case, tutorial, trending, revenue, funding, partnership, demo. DEPRIORITIZE: methodology, abstract, mathematical proof, theoretical framework, ablation study.
    14. TONE (Student Only): All student-facing text MUST use a conversational, peer-to-peer voice — write like a smart friend sharing gossip, NOT like a journalist or academic.
        - peerStory.title: MUST be first-person and hook-driven, e.g. "我用 Kimi 一晚上写完了文献综述——方法在这里" or "室友靠这个工具拿到了实习 offer，我问了她全套流程"
        - peerStory.takeaway: MUST begin with "你今天就能试" or "立刻可以做的一件事：" 
        - todaySignal.title (student): Should feel like overheard gossip in a dorm, NOT a press headline. E.g. "你室友用AI三天写完了文献综述，她用的是这个方法" instead of "AI Assisted Research Efficiency Up 40%"
        - todaySignal.takeaway (student): Start with "今天就做：" and give one concrete action. E.g. "今天就做：把你的作业题目丢给Claude，让它先给你出一个提纲" instead of "Master prompt engineering for academic success"
        - metrics (student): Use friendly, peer-oriented labels. Instead of "AI Tools Used: 85%", use label "同龄人悄悄用AI" with value "85%" and change "另外15%还不知道"
        - news[].title (student): Rewrite as student-friendly hooks. E.g. "6分钟听完今天最重要的1件AI大事，通勤/走路听" instead of "Daily Podcast (Multimodal)"
        - news[].takeaway (student): Conversational, action-oriented. E.g. "今天就做：把你的作业题目丢给Claude..." instead of "行动建议：掌握提示词工程..."
        - todayAction: ONE specific action a student can complete TODAY, starting with a verb, ≤30 Chinese characters or ≤20 English words. E.g. "打开 Kimi，把你最难的一篇文献丢进去，问它用3句话总结核心结论"
        - dailyPrompt: A curiosity-triggering daily question that makes students want to share. E.g. "今天你用 AI 省了多少时间？说个具体的数字" or "你发现过 AI 最让你惊喜的一个用法是什么？"

    JSON Schema:
    {
      "isBreakingNews": bool,
      "todaySignal": { "title": "str", "description": "str", "takeaway": "str", "url": "str", "timestamp": "str" },
      "metrics": [ { "label": "str", "value": "str", "change": "str", "isPositive": bool } ],
      "news": [ { "id": "str", "type": "product|funding|policy|tech|research", "title": "str", "context": "str", "source": "str", "takeaway": "str", "timestamp": "str", "url": "str", "sourceFirstPublishedAt": "str (optional, ISO 8601 when source first published)" } ],
      "socialSignals": [ { "id": "str", "author": { "name": "str", "handle": "str", "avatar": "str", "role": "str", "followers": "str" }, "content": "str", "interpretation": "str", "timestamp": "str", "url": "str" } ],
      "deals": [ { "company": "str", "stage": "str", "description": "str", "investors": ["str"], "amount": "str", "timestamp": "str", "url": "str" } ],
      "sideHustles": [ { "id": "str", "title": "str", "income": "str", "description": "str", "steps": ["str"] } ],
      "peerStory": { "author": { "name": "str", "avatar": "str", "school": "str", "status": "str" }, "title": "str", "content": "str", "funding": "str", "takeaway": "str", "timestamp": "str" },
      "soloEntrepreneurs": [ { "id": "str", "name": "str", "role": "str", "avatar": "str", "project": "str", "revenue": "str", "stack": ["str"], "insight": "str", "url": "str", "timestamp": "str" } ],
      "topics": [ { "name": "str", "status": "high|rising", "insight": "str" } ],
      "calendar": [ { "date": "str", "event": "str" } ],
      "majorInsights": [ { "discipline": "humanities|science|engineering|business", "title": "str", "content": "str", "trend": "str", "url": "str", "timestamp": "str" } ],
      "majorInsightsUrl": "str",
      "majorDeepDive": {
        "papers": [ { "id": "str", "title": "str", "source": "str", "url": "str", "timestamp": "str" } ],
        "majorNews": [ { "id": "str", "title": "str", "source": "str", "url": "str", "timestamp": "str" } ],
        "forums": [ { "name": "str", "url": "str", "description": "str" } ]
      },
      "agentIntros": [ { "name": "str", "category": "str", "features": ["str"], "description": "str", "url": "str" } ],
      "todayAction": "str (Student only: one concrete action completable today, verb-first, ≤30 Chinese chars)",
      "dailyPrompt": "str (Student only: a curiosity-triggering question to spark community sharing)"
    }
  `;

  try {
    interface GeminiResponse {
      text?: string;
    }

    const fetchWithRetry = async (retries = 3, delay = 2000): Promise<GeminiResponse> => {
      try {
        const response = await getAI().models.generateContent({
          model: "gemini-2.0-flash",
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
    const isZh = language === 'zh';

    // Ensure all expected arrays exist to prevent frontend crashes
    const sanitizedData: DashboardData = {
      isBreakingNews: data.isBreakingNews || false,
      producedAt: new Date().toISOString(),
      todaySignal: {
        title: data.todaySignal?.title || (isZh ? "AI 快讯" : "AI Shot"),
        description: data.todaySignal?.description || (isZh ? "情报速递" : "Intelligence feed"),
        takeaway: data.todaySignal?.takeaway || (isZh ? "敬请关注" : "Stay tuned"),
        url: data.todaySignal?.url || "#",
        timestamp: data.todaySignal?.timestamp,
      },
      metrics: Array.isArray(data.metrics) ? data.metrics.map((m: any) => ({
        label: m.label || (isZh ? '指标' : 'Metric'),
        value: m.value || 'N/A',
        change: m.change || '0%',
        isPositive: typeof m.isPositive === 'boolean' ? m.isPositive : true
      })) : [],
      news: Array.isArray(data.news) ? data.news.map((item: any) => ({
        id: item.id || Math.random().toString(36).substring(7),
        type: item.type || 'tech',
        title: item.title || (isZh ? 'AI 动态' : 'AI Update'),
        context: item.context || (isZh ? '人工智能领域新进展。' : 'New developments in artificial intelligence.'),
        source: item.source || (isZh ? 'AI 情报' : 'AI Intelligence'),
        takeaway: item.takeaway || (isZh ? '保持关注。' : 'Stay informed.'),
        timestamp: item.timestamp || (isZh ? '最近' : 'Recent'),
        url: item.url || '#',
        sourceFirstPublishedAt: typeof item.sourceFirstPublishedAt === 'string' ? item.sourceFirstPublishedAt : undefined
      })) : [],
      socialSignals: Array.isArray(data.socialSignals) ? data.socialSignals.map((s: any) => ({
        id: s.id || Math.random().toString(36).substring(7),
        author: s.author ? {
          name: s.author.name || (isZh ? '专家' : 'Expert'),
          handle: s.author.handle || '@ai_expert',
          avatar: s.author.avatar || '',
          role: s.author.role || (isZh ? 'AI 洞察者' : 'AI Insider'),
          followers: s.author.followers || '10k'
        } : { name: isZh ? '专家' : 'Expert', handle: '@ai_expert', avatar: '', role: isZh ? 'AI 洞察者' : 'AI Insider', followers: '10k' },
        content: s.content || (isZh ? '暂无内容' : 'No content provided.'),
        interpretation: s.interpretation || (isZh ? '暂无解读' : 'No interpretation provided.'),
        timestamp: s.timestamp || undefined,
        url: s.url || '#'
      })) : [],
      topics: Array.isArray(data.topics) ? data.topics : [],
      calendar: Array.isArray(data.calendar) ? data.calendar : [],
      majorInsights: Array.isArray(data.majorInsights) ? data.majorInsights.map((mi: any) => ({
        discipline: mi.discipline || 'humanities',
        title: mi.title || '',
        content: mi.content || '',
        trend: mi.trend || '',
        url: mi.url || '#',
        timestamp: mi.timestamp || undefined,
      })) : [],
      majorInsightsUrl: typeof data.majorInsightsUrl === 'string' ? data.majorInsightsUrl : "https://openai.com/research/",
      majorDeepDive: data.majorDeepDive ? {
        papers: Array.isArray(data.majorDeepDive.papers) ? data.majorDeepDive.papers : [],
        majorNews: Array.isArray(data.majorDeepDive.majorNews) ? data.majorDeepDive.majorNews : [],
        forums: Array.isArray(data.majorDeepDive.forums) ? data.majorDeepDive.forums : [],
      } : undefined,
      agentIntros: Array.isArray(data.agentIntros) ? data.agentIntros : [],
      deals: Array.isArray(data.deals) ? data.deals.map((d: any) => ({
        company: d.company || '',
        stage: d.stage || '',
        description: d.description || '',
        investors: Array.isArray(d.investors) ? d.investors : [],
        amount: d.amount || '',
        timestamp: d.timestamp || undefined,
        url: d.url || '#'
      })) : [],
      sideHustles: Array.isArray(data.sideHustles) ? data.sideHustles : [],
      peerStory: (data.peerStory && data.peerStory.author) ? {
        ...data.peerStory,
        timestamp: data.peerStory.timestamp || undefined,
      } : undefined,
      soloEntrepreneurs: Array.isArray(data.soloEntrepreneurs) ? data.soloEntrepreneurs.map((se: any) => ({
        ...se,
        timestamp: se.timestamp || undefined,
      })) : [],
      todayAction: typeof data.todayAction === 'string' && data.todayAction.trim() ? data.todayAction.trim() : undefined,
      dailyPrompt: typeof data.dailyPrompt === 'string' && data.dailyPrompt.trim() ? data.dailyPrompt.trim() : undefined,
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
      isDemo: false,
      todaySignal: {
        title: isZh ? "AI 基础设施投资热潮持续" : "AI Infrastructure Investment Surge Continues",
        description: isZh ? "随着大模型竞争进入白热化，底层算力与能源基础设施成为资本追逐的新焦点。" : "As LLM competition intensifies, underlying compute and energy infrastructure become the new focus for capital.",
        takeaway: isZh ? "关注液冷技术与边缘计算节点的早期机会。" : "Focus on early opportunities in liquid cooling and edge computing nodes.",
        url: "https://techcrunch.com/category/artificial-intelligence/"
      },
      metrics: [
        { label: "NVDA", value: "$785.20", change: "+2.4%", isPositive: true },
        { label: isZh ? "周融资额" : "Weekly Funding", value: "$4.2B", change: "+12%", isPositive: true },
        { label: isZh ? "AI 并购" : "AI M&A", value: "12", change: "0", isPositive: true },
        { label: isZh ? "GPU 交付周期" : "GPU Lead Time", value: "18w", change: "-2w", isPositive: true },
        { label: isZh ? "市场情绪" : "Sentiment", value: isZh ? "看涨" : "Bullish", change: "+5%", isPositive: true }
      ],
      news: isZh ? [
        { id: "f1", type: "funding", title: "Mistral AI 融资 6 亿欧元", context: "欧洲 AI 领军企业获得巨额融资，用于下一代模型研发。", source: "Reuters", takeaway: "欧洲 AI 主权建设获得实质性资金支持。", timestamp: "2小时前", url: "https://www.reuters.com/technology/" },
        { id: "f2", type: "tech", title: "英伟达 Blackwell 芯片量产提速", context: "供应链报告显示 B200 芯片良率高于预期。", source: "Bloomberg", takeaway: "算力瓶颈或比预期更早缓解。", timestamp: "5小时前", url: "https://www.bloomberg.com/technology" }
      ] : [
        { id: "f1", type: "funding", title: "Mistral AI Raises €600M", context: "European AI champion secures massive funding for next-gen models.", source: "Reuters", takeaway: "European sovereignty in AI is gaining serious financial backing.", timestamp: "2h ago", url: "https://www.reuters.com/technology/" },
        { id: "f2", type: "tech", title: "NVIDIA Blackwell Production Ramps Up", context: "Supply chain reports suggest higher than expected yields for B200 chips.", source: "Bloomberg", takeaway: "Compute bottleneck may ease sooner than anticipated.", timestamp: "5h ago", url: "https://www.bloomberg.com/technology" }
      ],
      socialSignals: isZh ? [
        { 
          id: "s1", 
          author: { 
            name: "Sam Altman", 
            handle: "@sama", 
            avatar: "https://picsum.photos/seed/sama/100/100", 
            role: "OpenAI 首席执行官", 
            followers: "2.5M" 
          }, 
          content: "未来 12 个月的进展速度会让所有人惊讶。", 
          interpretation: "预计重大模型更新（GPT-5？）即将到来。", 
          url: "https://x.com/sama/status/1758223652857540864" 
        },
        { 
          id: "s2", 
          author: { 
            name: "Andrej Karpathy", 
            handle: "@karpathy", 
            avatar: "https://picsum.photos/seed/karpathy/100/100", 
            role: "AI 研究员", 
            followers: "1M" 
          }, 
          content: "大模型是新内核。我们正在学习如何对它们编程。", 
          interpretation: "从写代码转向编排 AI 模型。", 
          url: "https://x.com/karpathy/status/1752813158021706051" 
        }
      ] : [
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
      deals: isZh ? [
        { company: "Scale AI", stage: "F轮", description: "数据标注与 RLHF 基础设施。", amount: "$1B", url: "https://scale.com", investors: ["Accel", "Thrive Capital"] }
      ] : [
        { company: "Scale AI", stage: "Series F", description: "Data labeling and RLHF infrastructure.", amount: "$1B", url: "https://scale.com", investors: ["Accel", "Thrive Capital"] }
      ],
      topics: isZh ? [
        { name: "主权 AI", status: "high", insight: "各国正在建设自己的算力集群。" }
      ] : [
        { name: "Sovereign AI", status: "high", insight: "Nations building their own compute clusters." }
      ],
      majorInsights: isZh ? [
        { discipline: "humanities", title: "AI 与数字人文", content: "大模型正在革新历史文本与文化趋势分析。", trend: "自动化档案研究。", url: "https://research.google/blog/using-ai-to-help-preserve-endangered-languages/" },
        { discipline: "science", title: "AlphaFold 3 突破", content: "预测所有生命分子的结构与相互作用。", trend: "加速药物研发。", url: "https://deepmind.google/technologies/alphafold/" },
        { discipline: "engineering", title: "CAD 中的生成式设计", content: "AI 驱动结构完整性与材料效率优化。", trend: "自主制造管线。", url: "https://research.google/blog/a-new-approach-to-computation-offloading-for-on-device-ml/" },
        { discipline: "business", title: "AI 驱动的市场情报", content: "全球贸易的实时情绪分析与预测建模。", trend: "超个性化消费体验。", url: "https://www.mckinsey.com/capabilities/quantumblack/our-insights" }
      ] : [
        { discipline: "humanities", title: "AI in Digital Humanities", content: "LLMs are revolutionizing the analysis of historical texts and cultural trends.", trend: "Automated archival research.", url: "https://research.google/blog/using-ai-to-help-preserve-endangered-languages/" },
        { discipline: "science", title: "AlphaFold 3 Breakthrough", content: "Predicting the structure and interactions of all life's molecules.", trend: "Accelerated drug discovery.", url: "https://deepmind.google/technologies/alphafold/" },
        { discipline: "engineering", title: "Generative Design in CAD", content: "AI-driven optimization for structural integrity and material efficiency.", trend: "Autonomous manufacturing pipelines.", url: "https://research.google/blog/a-new-approach-to-computation-offloading-for-on-device-ml/" },
        { discipline: "business", title: "AI-Driven Market Intelligence", content: "Real-time sentiment analysis and predictive modeling for global trade.", trend: "Hyper-personalized consumer experiences.", url: "https://www.mckinsey.com/capabilities/quantumblack/our-insights" }
      ],
      majorInsightsUrl: "https://openai.com/research/",
      majorDeepDive: isZh ? {
        papers: [
          { id: "p1", type: "research", title: "Attention Is All You Need", context: "提出 Transformer 架构的开创性论文，取代 RNN 和 CNN 用于序列建模。", source: "arXiv", takeaway: "所有现代大模型的基础。", url: "https://arxiv.org/abs/1706.03762", timestamp: "经典" },
          { id: "p2", type: "research", title: "Language Models are Few-Shot Learners", context: "引入 GPT-3，证明大规模扩展可使模型以极少示例完成任务。", source: "arXiv", takeaway: "扩展是通往智能的可预测路径。", url: "https://arxiv.org/abs/2005.14165", timestamp: "经典" },
          { id: "p3", type: "research", title: "AlphaFold 3：分子结构预测", context: "DeepMind 在预测生命分子结构与相互作用上的突破。", source: "Nature", takeaway: "革新药物发现与生物学研究。", url: "https://www.nature.com/articles/s41586-024-07487-w", timestamp: "2024" }
        ],
        majorNews: [
          { id: "m1", type: "tech", title: "AI 在医疗：诊断突破", context: "FDA 批准新型 AI 算法用于医学影像中的早期癌症检测。", source: "Nature Medicine", takeaway: "AI 正从研究走向临床应用。", url: "https://www.nature.com/nm/", timestamp: "最近" },
          { id: "m2", type: "tech", title: "AI 在金融：高频演化", context: "摩根大通 IndexGPT 开始向机构客户推出。", source: "Bloomberg", takeaway: "金融服务正围绕大模型重构。", url: "https://www.bloomberg.com/ai", timestamp: "最近" },
          { id: "m3", type: "policy", title: "欧盟 AI 法案：实施启动", context: "AI 办公室发布高风险 AI 系统首批指南。", source: "欧盟委员会", takeaway: "监管合规已成为核心商业要求。", url: "https://digital-strategy.ec.europa.eu/en/policies/regulatory-framework-ai", timestamp: "最近" }
        ],
        forums: [
          { name: "Reddit r/MachineLearning", url: "https://www.reddit.com/r/MachineLearning/", description: "机器学习研究、论文讨论与行业资讯的第一社区。" },
          { name: "Hugging Face 论坛", url: "https://discuss.huggingface.co/", description: "开源 AI、模型微调与 NLP 社区支持的枢纽。" },
          { name: "arXiv AI 版块", url: "https://arxiv.org/list/cs.AI/recent", description: "人工智能研究预印本每日更新。" },
          { name: "Papers with Code", url: "https://paperswithcode.com/", description: "浏览带代码和数据集的机器学习最新进展。" }
        ]
      } : {
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
      calendar: isZh ? [
        { date: "3月15日", event: "英伟达 GTC 大会" }
      ] : [
        { date: "MAR 15", event: "NVIDIA GTC Conference" }
      ],
      agentIntros: isZh ? [
        { name: "Devin", category: "编程", features: ["自主编码", "Shell 访问"], description: "首款自主 AI 软件工程师。", url: "https://www.cognition-labs.com/" },
        { name: "ChatGPT", category: "助手", features: ["多轮对话", "代码生成", "分析"], description: "OpenAI 旗舰对话 AI，用于研究、写作与分析。", url: "https://chat.openai.com/" },
        { name: "Cursor", category: "编程", features: ["AI 代码编辑器", "代码库上下文", "自动补全"], description: "理解你整个代码库的 AI 代码编辑器。", url: "https://cursor.sh/" }
      ] : [
        { name: "Devin", category: "Coding", features: ["Autonomous coding", "Shell access"], description: "The first autonomous AI software engineer.", url: "https://www.cognition-labs.com/" },
        { name: "ChatGPT", category: "Assistant", features: ["Multi-turn dialogue", "Code generation", "Analysis"], description: "OpenAI's flagship conversational AI for research, writing, and analysis.", url: "https://chat.openai.com/" },
        { name: "Cursor", category: "Coding", features: ["AI code editor", "Codebase context", "Auto-complete"], description: "AI-powered code editor that understands your entire codebase.", url: "https://cursor.sh/" }
      ]
    };
  } else {
    return {
      isDemo: false,
      todaySignal: {
        title: isZh ? "你室友用AI帮自己做PPT，你还在手动排版？" : "Your roommate uses AI for slides—are you still doing it manually?",
        description: isZh ? "最新研究表明，使用 AI 智能体进行文献综述和实验设计的学生，其产出质量显著提高。" : "Latest studies show students using AI agents for literature review and experimental design see significant quality gains.",
        takeaway: isZh ? "今天就做：把你的作业题目丢给Claude，让它先给你出一个提纲" : "Do this today: Drop your assignment into Claude and ask it to outline first",
        url: "https://github.blog/ai-and-ml/"
      },
      metrics: [
        { label: isZh ? "同龄人悄悄用AI" : "Peers using AI", value: "85%", change: isZh ? "另外15%还不知道" : "15% haven't tried yet", isPositive: true },
        { label: isZh ? "学术论文" : "Research Papers", value: "1.2k", change: "+200", isPositive: true },
        { label: isZh ? "岗位数" : "Job Openings", value: "45k", change: "+15%", isPositive: true },
        { label: isZh ? "技能需求" : "Skill Demand", value: "Python", change: isZh ? "高" : "High", isPositive: true },
        { label: isZh ? "学习速度" : "Learning Rate", value: isZh ? "快" : "Fast", change: isZh ? "—" : "N/A", isPositive: true }
      ],
      news: isZh ? [
        { id: "n1", type: "product", title: "6分钟听完今天最重要的1件AI大事，通勤/走路听", context: "GitHub 扩展 Copilot 上下文窗口，支持复杂代码库的多文件编辑。", source: "GitHub Blog", takeaway: "今天就做：把最难的一篇文献丢进Kimi，问它3句话总结", timestamp: "1天前", url: "https://github.blog/ai-and-ml/generative-ai/" },
        { id: "n2", type: "product", title: "用自然语言写代码，室友已经上手了", context: "新环境支持用自然语言构建完整功能。", source: "GitHub Blog", takeaway: "今天就做：把你的作业题目丢给Claude，先要个提纲", timestamp: "3天前", url: "https://github.blog/" }
      ] : [
        { id: "n1", type: "product", title: "6 min to catch today's biggest AI news—listen on your commute", context: "GitHub expands Copilot's context window and adds multi-file editing capabilities for complex codebases.", source: "GitHub Blog", takeaway: "Do this today: Drop your hardest paper into Kimi and ask for a 3-sentence summary", timestamp: "1d ago", url: "https://github.blog/ai-and-ml/generative-ai/" },
        { id: "n2", type: "product", title: "Write code with plain language—your roommate's already doing it", context: "A new environment for building entire features with natural language.", source: "GitHub Blog", takeaway: "Do this today: Give Claude your assignment and ask for an outline first", timestamp: "3d ago", url: "https://github.blog/" }
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
          title: isZh ? "用AI当助教，你只负责1v1答疑" : "AI-Assisted 1v1 Tutoring",
          income: isZh ? "¥150-300/小时" : "$30-60/hr",
          description: isZh ? "用AI帮你备课、生成练习题、做学习计划。你专注于1v1辅导和答疑。效率比传统家教高3倍，可以同时带更多学生。" : "Use AI to help you prepare lessons, generate exercises, and create study plans. Focus on 1v1 tutoring and Q&A.",
          steps: isZh ? [
            "选一门你擅长的课，用Claude/GPT生成一套教案",
            "在小红书/朋友圈发'AI辅助学习法'的帖子引流",
            "每次课后用AI生成针对性练习题发给学生",
            "用AI总结学生薄弱点，调整教学进度"
          ] : [
            "Pick a subject you're good at, use AI to generate lesson plans",
            "Post 'AI-Assisted Learning' content on social media to attract students",
            "Use AI after each session to generate personalized exercises",
            "Use AI to summarize student weaknesses and adjust teaching pace"
          ]
        },
        {
          id: "sh3",
          title: isZh ? "帮企业写提示词，他们不会写你来" : "AI Prompt Engineer/Consultant",
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
        title: isZh ? "这对兄弟在Stanford读书时开始做Golpo，辍学前就融了410万" : "These brothers started Golpo while at Stanford",
        content: isZh ? "一个能把文档自动变成动画解说视频的AI工具。他们发现教授和企业都需要把复杂内容变成易懂的视频，但传统方式太贵太慢。现在他们已经辍学全职做，刚融了$410万种子轮。" : "An AI tool that automatically turns documents into animated explainer videos. They found professors and businesses need to turn complex content into easy-to-understand videos.",
        funding: isZh ? "融了$410万" : "Raised $4.1M",
        takeaway: isZh ? "找到'贵且慢'的事情，用AI让它变得'便宜且快'。视频制作就是典型例子。" : "Find things that are 'expensive and slow', use AI to make them 'cheap and fast'."
      },
      soloEntrepreneurs: [
        {
          id: "se1",
          name: "Pieter Levels",
          role: isZh ? "独立创始人" : "Solo Founder",
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
          role: isZh ? "独立开发者" : "Indie Maker",
          avatar: "https://picsum.photos/seed/marclou/100/100",
          project: "ShipFast / ByeDispute",
          revenue: "$50k+/mo",
          stack: ["Next.js", "Tailwind", "MongoDB"],
          insight: isZh ? "速度就是一切。如果你不为第一个版本感到羞愧，那你就发布得太晚了。" : "Speed is everything. If you are not embarrassed by your first version, you launched too late.",
          url: "https://marclou.com/"
        }
      ],
      topics: isZh ? [
        { name: "RAG", status: "high", insight: "检索增强生成为准确性的标准方案。" }
      ] : [
        { name: "RAG", status: "high", insight: "Retrieval Augmented Generation is the standard for accuracy." }
      ],
      majorInsights: isZh ? [
        { discipline: "humanities", title: "AI 用于语言保护", content: "使用大模型记录和振兴濒危语言。", trend: "口述历史的实时翻译。", url: "https://research.google/blog/using-ai-to-help-preserve-endangered-languages/" },
        { discipline: "science", title: "AI 在气候建模中的应用", content: "深度学习模型以前所未有的准确度预测极端天气。", trend: "超本地化气候适应。", url: "https://research.google/blog/video-generation-models-as-world-simulators/" },
        { discipline: "engineering", title: "AI 优化机器人", content: "强化学习实现复杂环境中的敏捷运动。", trend: "物流人形机器人。", url: "https://research.google/blog/tackling-the-challenges-of-long-form-video-understanding/" },
        { discipline: "business", title: "AI 独立创业者兴起", content: "AI 智能体使单人运行复杂商业成为可能。", trend: "去中心化自治组织。", url: "https://www.ycombinator.com/library/95-the-future-of-ai-agents" }
      ] : [
        { discipline: "humanities", title: "AI for Language Preservation", content: "Using LLMs to document and revitalize endangered languages.", trend: "Real-time translation of oral histories.", url: "https://research.google/blog/using-ai-to-help-preserve-endangered-languages/" },
        { discipline: "science", title: "AI in Climate Modeling", content: "Deep learning models predicting extreme weather events with unprecedented accuracy.", trend: "Hyper-local climate adaptation.", url: "https://research.google/blog/video-generation-models-as-world-simulators/" },
        { discipline: "engineering", title: "AI-Optimized Robotics", content: "Reinforcement learning for agile locomotion in complex environments.", trend: "Humanoid robots in logistics.", url: "https://research.google/blog/tackling-the-challenges-of-long-form-video-understanding/" },
        { discipline: "business", title: "The Rise of AI Solopreneurs", content: "AI agents enabling single individuals to run complex business operations.", trend: "Decentralized autonomous organizations.", url: "https://www.ycombinator.com/library/95-the-future-of-ai-agents" }
      ],
      majorInsightsUrl: "https://paperswithcode.com/area/ai",
      majorDeepDive: isZh ? {
        papers: [
          { id: "p1", type: "research", title: "LoRA: 大模型低秩适配", context: "仅更新少量参数即可在低配置硬件上微调大模型的方法。", source: "arXiv", takeaway: "可在消费级 GPU 上实现本地模型定制。", url: "https://arxiv.org/abs/2106.09685", timestamp: "1天前" },
          { id: "p2", type: "research", title: "Direct Preference Optimization (DPO)", context: "比 RLHF 更简单稳定的语言模型偏好对齐方法。", source: "arXiv", takeaway: "便于自定义模型对齐。", url: "https://arxiv.org/abs/2305.18290", timestamp: "最近" },
          { id: "p3", type: "research", title: "Llama 3 模型家族", context: "Meta 关于 Llama 3 开源模型训练与评估的详细报告。", source: "Meta AI", takeaway: "开源模型正逼近闭源模型。", url: "https://ai.meta.com/research/publications/the-llama-3-herd-of-models/", timestamp: "2024" }
        ],
        majorNews: [
          { id: "m1", type: "product", title: "AI 在教育：个性化导师", context: "可汗学院与 OpenAI 合作，为数百万学生提供个性化 AI 辅导。", source: "EdTech", takeaway: "课堂效率与学生参与度正在提升。", url: "https://www.khanacademy.org/khan-labs", timestamp: "2天前" },
          { id: "m2", type: "tech", title: "AI 编程智能体的未来", context: "新基准显示 AI 智能体可自主解决复杂真实软件工程任务。", source: "GitHub", takeaway: "软件开发正重新定义为系统编排。", url: "https://github.blog/category/ai/", timestamp: "最近" },
          { id: "m3", type: "tech", title: "开源 AI：本地大模型之年", context: "Ollama、LM Studio 等工具使个人电脑轻松运行强大模型。", source: "The Verge", takeaway: "隐私优先的 AI 正变得人人可及。", url: "https://www.theverge.com/ai-artificial-intelligence", timestamp: "最近" }
        ],
        forums: [
          { name: "Stack Overflow AI", url: "https://stackoverflow.com/questions/tagged/artificial-intelligence", description: "AI 开发者技术问答，涵盖 PyTorch 到提示工程等。" },
          { name: "Reddit r/LearnMachineLearning", url: "https://www.reddit.com/r/learnmachinelearning/", description: "ML 与数据科学入门学生的互助社区。" },
          { name: "DeepLearning.AI 社区", url: "https://community.deeplearning.ai/", description: "吴恩达课程及更广泛 AI 职业建议的讨论论坛。" },
          { name: "Kaggle 讨论区", url: "https://www.kaggle.com/discussions", description: "数据科学竞赛、数据集与最佳实践的讨论平台。" }
        ]
      } : {
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
      calendar: isZh ? [
        { date: "4月10日", event: "Google I/O 2026" }
      ] : [
        { date: "APR 10", event: "Google I/O 2026" }
      ],
      agentIntros: isZh ? [
        { name: "Perplexity", category: "搜索", features: ["实时搜索", "来源引用"], description: "提供直接答案的 AI 搜索引擎。", url: "https://www.perplexity.ai/" },
        { name: "Notion AI", category: "效率", features: ["笔记", "总结", "写作辅助"], description: "内置于 Notion 的 AI，助你写作、总结和整理笔记。", url: "https://www.notion.so/product/ai" },
        { name: "Gamma", category: "演示", features: ["AI 幻灯片", "自动设计", "一键导出"], description: "用 AI 快速创建精美演示文稿和文档。", url: "https://gamma.app/" }
      ] : [
        { name: "Perplexity", category: "Search", features: ["Real-time search", "Source citations"], description: "AI-powered search engine that provides direct answers.", url: "https://www.perplexity.ai/" },
        { name: "Notion AI", category: "Productivity", features: ["Note-taking", "Summarization", "Writing assist"], description: "AI built into Notion to help you write, summarize, and organize your notes.", url: "https://www.notion.so/product/ai" },
        { name: "Gamma", category: "Presentation", features: ["AI slide deck", "Auto-design", "One-click export"], description: "Create beautiful presentations and documents with AI in minutes.", url: "https://gamma.app/" }
      ]
    };
  }
}
