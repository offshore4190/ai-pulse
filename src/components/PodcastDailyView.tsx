import { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { Headphones, ArrowLeft } from 'lucide-react';
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

  chapters.push({
    id: 'today-signal',
    title: zh ? '今日重磅' : 'Heavy Hitter',
    content: `${data.todaySignal.title}\n\n${data.todaySignal.description}\n\n${zh ? '行动建议：' : 'Action: '}${data.todaySignal.takeaway}`,
    order: order++,
  });

  if (data.metrics?.length) {
    chapters.push({
      id: 'metrics',
      title: zh ? '核心指标' : 'Key Metrics',
      content: data.metrics
        .map((m) => `${m.label}: ${m.value}${m.change ? ` (${m.change})` : ''}`)
        .join('\n'),
      order: order++,
    });
  }

  if (data.news?.length) {
    const items = data.news.slice(0, 5).map((n) => `• ${n.title}\n  ${n.takeaway}`);
    chapters.push({
      id: 'news',
      title: zh ? '行业快讯' : 'News',
      content: items.join('\n\n'),
      order: order++,
    });
  }

  if (persona === 'investor') {
    if (data.socialSignals?.length) {
      chapters.push({
        id: 'social-signals',
        title: zh ? '社交信号' : 'Social Signals',
        content: data.socialSignals
          .slice(0, 3)
          .map((s) => `@${s.author.name}: ${s.content.slice(0, 150)}...`)
          .join('\n\n'),
        order: order++,
      });
    }
    if (data.deals?.length) {
      chapters.push({
        id: 'deals',
        title: zh ? '融资动态' : 'Key Deals',
        content: data.deals
          .slice(0, 4)
          .map((d) => `• ${d.company} (${d.amount}): ${d.description}`)
          .join('\n'),
        order: order++,
      });
    }
  }

  if (data.majorInsights?.length) {
    chapters.push({
      id: 'major-insights',
      title: zh ? '专业特调' : 'Major Insights',
      content: data.majorInsights
        .map((i) => `【${i.discipline}】${i.title}\n${i.content}`)
        .join('\n\n'),
      order: order++,
    });
  }

  if (persona === 'student') {
    if (data.sideHustles?.length) {
      chapters.push({
        id: 'side-hustles',
        title: zh ? '本周副业冰萃' : 'Side Hustles',
        content: data.sideHustles
          .map((h) => `• ${h.title} (${h.income})\n  ${h.description}`)
          .join('\n\n'),
        order: order++,
      });
    }
    if (data.peerStory) {
      chapters.push({
        id: 'peer-story',
        title: zh ? '同咖故事' : 'Peer Story',
        content: `${data.peerStory.title}\n\n${data.peerStory.content}\n\n${zh ? '你可以学到：' : 'Takeaway: '}${data.peerStory.takeaway}`,
        order: order++,
      });
    }
    if (data.todayAction) {
      chapters.push({
        id: 'today-action',
        title: zh ? '今天只做这1件事' : "Today's One Action",
        content: data.todayAction,
        order: order++,
      });
    }
  }

  if (data.agentIntros?.length) {
    chapters.push({
      id: 'agents',
      title: zh ? 'Agent 自助吧台' : 'Agent Directory',
      content: data.agentIntros
        .slice(0, 5)
        .map((a) => `• ${a.name} (${a.category}): ${a.description}`)
        .join('\n'),
      order: order++,
    });
  }

  return {
    title: zh ? '今日AI日报' : "Today's AI Pulse",
    intro: zh ? '大家好，欢迎收听今天的 AI 日报。' : 'Welcome to today\'s AI pulse.',
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

  useEffect(() => {
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
              {generating ? (zh ? '生成中...' : 'Generating...') : t.generateScript}
            </button>

            {script && script.chapters.length > 0 && (
              <div className="mt-6 pt-6 border-t border-black/5">
                <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-3">{t.chapterNav}</h3>
                <nav className="space-y-1 max-h-64 overflow-y-auto">
                  {script.chapters.map((ch) => (
                    <button
                      key={ch.id}
                      onClick={() => scrollToChapter(ch.id)}
                      className={`w-full text-left px-3 py-2 rounded-xl text-sm transition-all ${
                        activeChapterId === ch.id ? 'bg-violet-100 text-violet-800 font-bold' : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {ch.title}
                    </button>
                  ))}
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
              <p>
                {zh
                  ? '选择语气后点击「生成播客稿」，即可将今日日报转为播客式文本'
                  : 'Select a voice tone and click "Generate Script" to convert today\'s report into podcast-style text.'}
              </p>
            </div>
          ) : (
            <>
              {script.intro && (
                <section className="bg-violet-50/50 rounded-3xl border border-violet-100 p-6">
                  <p className="text-base leading-relaxed text-gray-800 whitespace-pre-wrap">{script.intro}</p>
                </section>
              )}
              {script.chapters.map((ch) => (
                <section key={ch.id} id={`chapter-${ch.id}`} className="scroll-mt-24">
                  <h3 className="text-xl font-bold border-l-4 border-violet-500 pl-4 py-2 bg-violet-50/40 rounded-r-lg mb-4">
                    {ch.title}
                  </h3>
                  <div className="bg-white rounded-3xl border border-black/5 p-6">
                    <p className="text-base leading-relaxed text-gray-800 whitespace-pre-wrap">{ch.content}</p>
                  </div>
                </section>
              ))}
              {script.outro && (
                <section className="bg-gray-50 rounded-3xl border border-black/5 p-6">
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
