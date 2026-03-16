import { Lightbulb } from 'lucide-react';

interface TodayActionCardProps {
  t: any;
  action: string;
}

export function TodayActionCard({ t, action }: TodayActionCardProps) {
  return (
    <section className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6 rounded-3xl shadow-lg border border-white/10">
      <div className="flex items-start gap-4">
        <div className="p-3 bg-white/20 rounded-2xl flex-shrink-0">
          <Lightbulb size={24} className="text-white" />
        </div>
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold">{t.todayActionTitle}</h3>
            <span className="text-[10px] font-bold bg-white/30 text-white px-2 py-0.5 rounded-full uppercase tracking-wider">
              {t.todayActionBadgeStudent || t.todayActionBadge}
            </span>
          </div>
          <p className="text-base font-medium leading-relaxed">
            {action}
          </p>
        </div>
      </div>
    </section>
  );
}
