import { Zap, ExternalLink } from 'lucide-react';
import type { Persona, DashboardData } from '../../types';

interface TodaySignalCardProps {
  t: any;
  persona: Persona;
  data: DashboardData | null;
  loading: boolean;
  compact?: boolean;
  onAnalysisClick?: () => void;
}

export function TodaySignalCard({
  t,
  persona,
  data,
  loading,
  compact = false,
  onAnalysisClick
}: TodaySignalCardProps) {
  return (
    <section className={`bg-black text-white rounded-3xl relative overflow-hidden group ${compact ? 'p-5' : 'p-8'}`}>
      {/* Decorative gradient */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/20 blur-[100px] -mr-32 -mt-32 rounded-full" />

      <div className="relative z-10 space-y-4">
        {/* Header */}
        <div className="flex items-center gap-2 text-teal-400">
          <Zap size={16} fill="currentColor" />
          <span className="text-xs font-bold uppercase tracking-[0.2em]">{t.todaySignal}</span>
        </div>

        {/* Loading state */}
        {loading ? (
          <div className="space-y-3">
            <div className={`w-3/4 bg-white/10 rounded animate-pulse ${compact ? 'h-6' : 'h-8'}`} />
            <div className="h-4 w-full bg-white/10 rounded animate-pulse" />
            <div className="h-4 w-2/3 bg-white/10 rounded animate-pulse" />
          </div>
        ) : (
          <>
            {/* Title */}
            <h2 className={`font-bold tracking-tight leading-tight ${compact ? 'text-2xl md:text-3xl' : 'text-3xl md:text-4xl'}`}>
              {data?.todaySignal.title}
            </h2>

            {/* Description */}
            <p className={`text-gray-400 max-w-2xl ${compact ? 'text-sm line-clamp-2' : 'text-lg'}`}>
              {data?.todaySignal.description}
            </p>

            {/* Takeaway & CTA */}
            <div className="pt-4 flex flex-col md:flex-row gap-4">
              <div className={`bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl flex-1 ${compact ? 'p-3' : 'p-4'}`}>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[10px] uppercase font-bold text-teal-400">
                    {persona === 'investor' ? t.signal : (t.actionStudent ?? t.action)}
                  </p>
                  {data?.todaySignal.timestamp && (
                    <span className="text-[9px] text-white/50 font-medium tabular-nums">
                      {data.todaySignal.timestamp}
                    </span>
                  )}
                </div>
                <p className={`italic leading-relaxed ${compact ? 'text-xs' : 'text-sm'}`}>
                  "{data?.todaySignal.takeaway}"
                </p>
              </div>

              {/* Read More Button */}
              {data?.todaySignal.url && data.todaySignal.url !== '#' && (
                <a
                  href={data.todaySignal.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={onAnalysisClick}
                  className={`bg-teal-500 hover:bg-teal-400 text-black font-bold rounded-2xl transition-all flex items-center justify-center gap-2 self-end md:self-center ${compact ? 'px-4 py-2.5 text-xs' : 'px-6 py-4 text-sm'}`}
                >
                  {t.readAnalysis}
                  <ExternalLink size={compact ? 14 : 16} />
                </a>
              )}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
