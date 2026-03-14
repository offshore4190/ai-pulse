import { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { Headphones, ArrowLeft, Play, Pause } from 'lucide-react';
import {
  Persona,
  DashboardData,
  Language,
  PodcastVoiceTone,
  PodcastScript,
  PodcastChapter,
  VoiceToneOption,
  TranslationKeys,
} from '../types';

const VOICE_TONE_OPTIONS: VoiceToneOption[] = [
  { value: 'youth', label: '青年', labelEn: 'Youth', icon: '🔥', desc: '活力、口语化' },
  { value: 'middle', label: '中年', labelEn: 'Middle', icon: '📊', desc: '稳重、有见解' },
  { value: 'elder', label: '老年', labelEn: 'Elder', icon: '📖', desc: '娓娓道来' },
  { value: 'gentle', label: '温柔', labelEn: 'Gentle', icon: '🌸', desc: '舒缓、亲切' },
  { value: 'sunny', label: '阳光', labelEn: 'Sunny', icon: '☀️', desc: '积极、明快' },
  { value: 'professional', label: '专业', labelEn: 'Professional', icon: '💼', desc: '简洁、信息密度高' },
];

const FALLBACK_TRANSITIONS: Record<string, { zh: string; en: string }> = {
  'today-signal': { zh: '先说说今天的重磅。', en: "First up—today's heavy hitter." },
  metrics: { zh: '接下来看看数据。', en: "Now let's look at the numbers." },
  news: { zh: '行业快讯这边，', en: "On the news front, " },
  'social-signals': { zh: '社交层面，', en: "On social, " },
  deals: { zh: '说到融资，', en: "On deals, " },
  'side-hustles': { zh: '副业方面，', en: "For side hustles, " },
  'peer-story': { zh: '有个同咖故事想跟你分享。', en: "There's a peer story to share." },
  'today-action': { zh: '今天可以做的，就这一件。', en: "For today, here's the one thing." },
  'major-insights': { zh: '专业特调这块，', en: "On major insights, " },
  agents: { zh: '最后看看 Agent 自助吧台。', en: "Finally, the Agent directory." },
};

function buildFallbackScript(
  data: DashboardData | null,
  _tone: PodcastVoiceTone,
  lang: Language,
  persona: Persona
): PodcastScript {
  if (!data) {
    return {
      title: lang === 'zh' ? '今日AI日报' : "Today's AI Pulse",
      chapters: [],
      generatedAt: new Date().toISOString(),
    };
  }

  const chapters: PodcastChapter[] = [];
  let order = 0;

  const zh = lang === 'zh';
  const t = (id: string) => (zh ? FALLBACK_TRANSITIONS[id]?.zh ?? '' : FALLBACK_TRANSITIONS[id]?.en ?? '');

  chapters.push({
    id: 'today-signal',
    title: zh ? '今日重磅' : 'Heavy Hitter',
    content: `${t('today-signal')}${data.todaySignal.title}。${data.todaySignal.description}。${zh ? '行动建议：' : 'Action: '}${data.todaySignal.takeaway}`,
    order: order++,
  });

  if (data.metrics?.length) {
    const parts = data.metrics.map((m) => `${m.label} ${zh ? '是' : 'is'} ${m.value}${m.change ? ` (${m.change})` : ''}`);
    chapters.push({
      id: 'metrics',
      title: zh ? '核心指标' : 'Key Metrics',
      content: `${t('metrics')}${parts.join(zh ? '；' : '; ')}`,
      order: order++,
    });
  }

  if (data.news?.length) {
    const items = data.news.slice(0, 5);
    const parts = items.map((n, i) =>
      zh ? `第${i + 1}条，${n.title}。${n.takeaway}` : `Item ${i + 1}: ${n.title}. ${n.takeaway}`
    );
    chapters.push({
      id: 'news',
      title: zh ? '行业快讯' : 'News',
      content: `${t('news')}${parts.join(zh ? '；' : ' ')}`,
      order: order++,
    });
  }

  if (persona === 'investor') {
    if (data.socialSignals?.length) {
      const parts = data.socialSignals.slice(0, 3).map((s) =>
        zh ? `@${s.author.name} 提到：${s.content.slice(0, 150)}…` : `@${s.author.name}: ${s.content.slice(0, 150)}…`
      );
      chapters.push({
        id: 'social-signals',
        title: zh ? '社交信号' : 'Social Signals',
        content: `${t('social-signals')}${parts.join(zh ? '；' : ' ')}`,
        order: order++,
      });
    }
    if (data.deals?.length) {
      const parts = data.deals.slice(0, 4).map((d) =>
        zh ? `${d.company} ${d.amount}，${d.description}` : `${d.company} (${d.amount}): ${d.description}`
      );
      chapters.push({
        id: 'deals',
        title: zh ? '融资动态' : 'Key Deals',
        content: `${t('deals')}${parts.join(zh ? '；' : ' ')}`,
        order: order++,
      });
    }
  }

  if (data.majorInsights?.length) {
    const parts = data.majorInsights.map((i) =>
      zh ? `【${i.discipline}】${i.title}。${i.content}` : `[${i.discipline}] ${i.title}. ${i.content}`
    );
    chapters.push({
      id: 'major-insights',
      title: zh ? '专业特调' : 'Major Insights',
      content: `${t('major-insights')}${parts.join(zh ? '；' : ' ')}`,
      order: order++,
    });
  }

  if (persona === 'student') {
    if (data.sideHustles?.length) {
      const parts = data.sideHustles.map((h) =>
        zh ? `${h.title}，大概${h.income}，${h.description}` : `${h.title} (${h.income}): ${h.description}`
      );
      chapters.push({
        id: 'side-hustles',
        title: zh ? '本周副业冰萃' : 'Side Hustles',
        content: `${t('side-hustles')}${parts.join(zh ? '；' : ' ')}`,
        order: order++,
      });
    }
    if (data.peerStory) {
      chapters.push({
        id: 'peer-story',
        title: zh ? '同咖故事' : 'Peer Story',
        content: `${t('peer-story')}${data.peerStory.title}。${data.peerStory.content}。${zh ? '你可以学到：' : 'Takeaway: '}${data.peerStory.takeaway}`,
        order: order++,
      });
    }
    if (data.todayAction) {
      chapters.push({
        id: 'today-action',
        title: zh ? '今天只做这1件事' : "Today's One Action",
        content: `${t('today-action')}${data.todayAction}`,
        order: order++,
      });
    }
  }

  if (data.agentIntros?.length) {
    const parts = data.agentIntros.slice(0, 5).map((a) =>
      zh ? `${a.name}（${a.category}）：${a.description}` : `${a.name} (${a.category}): ${a.description}`
    );
    chapters.push({
      id: 'agents',
      title: zh ? 'Agent 自助吧台' : 'Agent Directory',
      content: `${t('agents')}${parts.join(zh ? '；' : ' ')}`,
      order: order++,
    });
  }

  return {
    title: zh ? '今日AI日报' : "Today's AI Pulse",
    intro: zh ? '大家好，欢迎收听今天的 AI 日报。' : "Welcome to today's AI pulse.",
    chapters,
    outro: zh ? '以上就是今天的全部内容，感谢收听。' : "That's all for today. Thanks for listening.",
    generatedAt: new Date().toISOString(),
  };
}

export default function PodcastDailyView({
  data,
  persona,
  language,
  t,
  onBack,
}: {
  data: DashboardData | null;
  persona: Persona;
  language: Language;
  t: TranslationKeys;
  onBack: () => void;
}) {
  const [voiceTone, setVoiceTone] = useState<PodcastVoiceTone>('sunny');
  const [script, setScript] = useState<PodcastScript | null>(null);
  const [generating, setGenerating] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const [activeChapterId, setActiveChapterId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playingSegmentId, setPlayingSegmentId] = useState<string | null>(null);
  const segmentQueueRef = useRef<{ id: string; text: string }[]>([]);
  const queueIndexRef = useRef(0);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  useEffect(() => {
    if (script && typeof window !== 'undefined' && window.speechSynthesis?.speaking) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
      setPlayingSegmentId(null);
    }
  }, [script]);

  const handlePlayPause = () => {
    if (!script || typeof window === 'undefined' || !window.speechSynthesis) return;

    const synth = window.speechSynthesis;

    if (synth.speaking) {
      if (synth.paused) {
        synth.resume();
        setIsPlaying(true);
      } else {
        synth.pause();
        setIsPlaying(false);
      }
      return;
    }

    if (isPlaying || playingSegmentId) {
      synth.cancel();
      setPlayingSegmentId(null);
      setIsPlaying(false);
    }

    const segments: { id: string; text: string }[] = [];
    if (script.intro?.trim()) segments.push({ id: 'intro', text: script.intro });
    script.chapters.forEach((ch) => {
      if (ch.content?.trim()) segments.push({ id: ch.id, text: ch.content });
    });
    if (script.outro?.trim()) segments.push({ id: 'outro', text: script.outro });

    if (segments.length === 0) return;

    segmentQueueRef.current = segments;
    queueIndexRef.current = 0;
    const lang = language === 'zh' ? 'zh-CN' : 'en-US';

    const speakNext = () => {
      const idx = queueIndexRef.current;
      const segs = segmentQueueRef.current;
      if (idx >= segs.length || !mountedRef.current) {
        if (mountedRef.current) {
          setIsPlaying(false);
          setPlayingSegmentId(null);
        }
        return;
      }

      const seg = segs[idx];
      setPlayingSegmentId(seg.id);
      setIsPlaying(true);
      document.getElementById(seg.id === 'intro' ? 'segment-intro' : seg.id === 'outro' ? 'segment-outro' : `chapter-${seg.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });

      const u = new SpeechSynthesisUtterance(seg.text);
      u.lang = lang;
      u.onend = () => {
        queueIndexRef.current += 1;
        speakNext();
      };
      u.onerror = () => {
        queueIndexRef.current += 1;
        speakNext();
      };
      synth.speak(u);
    };

    speakNext();
  };

  useEffect(() => {
    if (!script?.chapters.length || !contentRef.current) return;
    if (!script?.chapters.length || !contentRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            const id = e.target.id.replace('chapter-', '');
            setActiveChapterId(id);
          }
        });
      },
      { root: contentRef.current, rootMargin: '-20% 0px -60% 0px', threshold: 0 }
    );

    script.chapters.forEach((ch) => {
      const el = document.getElementById(`chapter-${ch.id}`);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [script]);

  const scrollToChapter = (id: string) => {
    document.getElementById(`chapter-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const params = new URLSearchParams({
        persona,
        language,
        voiceTone,
      });
      const res = await fetch(`/api/pipeline/podcast-script?${params}`);
      if (res.ok) {
        const s: PodcastScript = await res.json();
        setScript(s);
      } else {
        setScript(buildFallbackScript(data, voiceTone, language, persona));
      }
    } catch {
      setScript(buildFallbackScript(data, voiceTone, language, persona));
    } finally {
      setGenerating(false);
    }
  };

  const zh = language === 'zh';

  return (
    <motion.div
      key="podcast"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-gray-600 hover:text-black transition-colors font-medium"
        >
          <ArrowLeft size={20} />
          {t.backToDashboard}
        </button>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-violet-100 text-violet-600 rounded-xl">
            <Headphones size={24} />
          </div>
          <h2 className="text-2xl font-bold tracking-tight">{t.podcastDaily}</h2>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <aside className="lg:col-span-4 space-y-6">
          <section className="bg-white rounded-3xl border border-black/5 shadow-sm p-5 sticky top-24">
            <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-4">{t.voiceTone}</h3>
            <div className="grid grid-cols-2 gap-2">
              {VOICE_TONE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setVoiceTone(opt.value)}
                  className={`p-3 rounded-2xl border transition-all text-left flex items-center gap-2 ${
                    voiceTone === opt.value
                      ? 'bg-violet-50 border-violet-200 text-violet-700'
                      : 'border-black/5 hover:bg-gray-50'
                  }`}
                >
                  <span className="text-lg">{opt.icon}</span>
                  <span className="font-semibold text-sm">{zh ? opt.label : opt.labelEn}</span>
                </button>
              ))}
            </div>

            <button
              onClick={handleGenerate}
              disabled={generating || !data}
              className="w-full mt-4 py-3 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {generating ? t.generating : t.generateScript}
            </button>

            {script && (script.intro || script.chapters.length > 0 || script.outro) && (
              <div className="mt-4 pt-4 border-t border-black/5 flex items-center gap-3">
                <button
                  onClick={handlePlayPause}
                  className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-semibold transition-colors"
                  title={isPlaying ? t.podcastPause : t.podcastPlay}
                >
                  {isPlaying ? <Pause size={18} /> : <Play size={18} />}
                  {isPlaying ? t.podcastPause : t.podcastPlay}
                </button>
                {playingSegmentId && (
                  <span className="text-xs text-gray-500 truncate max-w-[140px]">
                    {t.podcastNowPlaying} {playingSegmentId === 'intro' ? (zh ? '开场' : 'Intro') : playingSegmentId === 'outro' ? (zh ? '收尾' : 'Outro') : script.chapters.find((c) => c.id === playingSegmentId)?.title ?? playingSegmentId}
                  </span>
                )}
              </div>
            )}

            {script && script.chapters.length > 0 && (
              <div className="mt-6 pt-6 border-t border-black/5">
                <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-3">{t.chapterNav}</h3>
                <nav className="space-y-1 max-h-64 overflow-y-auto">
                  {script.chapters.map((ch) => {
                    const isActive = (playingSegmentId ? playingSegmentId === ch.id : activeChapterId === ch.id);
                    return (
                      <button
                        key={ch.id}
                        onClick={() => scrollToChapter(ch.id)}
                        className={`w-full text-left px-3 py-2 rounded-xl text-sm transition-all ${
                          isActive ? 'bg-violet-100 text-violet-800 font-bold' : 'text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        {ch.title}
                      </button>
                    );
                  })}
                </nav>
              </div>
            )}
          </section>
        </aside>

        <main
          ref={contentRef}
          className="lg:col-span-8 space-y-8 overflow-y-auto"
          style={{ maxHeight: 'calc(100vh - 12rem)' }}
        >
          {!script ? (
            <div className="bg-white rounded-3xl border border-black/5 p-12 text-center text-gray-500">
              <Headphones size={48} className="mx-auto mb-4 opacity-40" />
              <p>{t.podcastEmptyHint}</p>
            </div>
          ) : (
            <>
              {script.intro && (
                <section
                  id="segment-intro"
                  className={`scroll-mt-24 rounded-3xl border p-6 transition-colors ${
                    playingSegmentId === 'intro' ? 'bg-emerald-50/80 border-emerald-200 ring-2 ring-emerald-200' : 'bg-violet-50/50 border-violet-100'
                  }`}
                >
                  <p className="text-base leading-relaxed text-gray-800 whitespace-pre-wrap">{script.intro}</p>
                </section>
              )}
              {script.chapters.map((ch) => (
                <section
                  key={ch.id}
                  id={`chapter-${ch.id}`}
                  className={`scroll-mt-24 transition-colors ${
                    playingSegmentId === ch.id ? 'rounded-3xl ring-2 ring-emerald-200' : ''
                  }`}
                >
                  <h3 className="text-xl font-bold border-l-4 border-violet-500 pl-4 py-2 bg-violet-50/40 rounded-r-lg mb-4">
                    {ch.title}
                  </h3>
                  <div
                    className={`rounded-3xl border p-6 transition-colors ${
                      playingSegmentId === ch.id ? 'bg-emerald-50/60 border-emerald-200' : 'bg-white border-black/5'
                    }`}
                  >
                    <p className="text-base leading-relaxed text-gray-800 whitespace-pre-wrap">{ch.content}</p>
                  </div>
                </section>
              ))}
              {script.outro && (
                <section
                  id="segment-outro"
                  className={`scroll-mt-24 rounded-3xl border p-6 transition-colors ${
                    playingSegmentId === 'outro' ? 'bg-emerald-50/80 border-emerald-200 ring-2 ring-emerald-200' : 'bg-gray-50 border-black/5'
                  }`}
                >
                  <p className="text-base leading-relaxed text-gray-800 whitespace-pre-wrap">{script.outro}</p>
                </section>
              )}
            </>
          )}
        </main>
      </div>
    </motion.div>
  );
}
