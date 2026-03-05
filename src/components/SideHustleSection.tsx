import { Coins, ChevronRight } from "lucide-react";
import { TranslationKeys, SideHustle } from "../types";

interface Props {
  t: TranslationKeys;
  sideHustles: SideHustle[];
}

export default function SideHustleSection({ t, sideHustles }: Props) {
  if (!sideHustles.length) return null;

  return (
    <section className="bg-white rounded-3xl border border-black/5 shadow-sm overflow-hidden">
      <div className="p-5 border-b border-black/5 bg-amber-50/30 flex items-center justify-between">
        <h3 className="font-bold flex items-center gap-2 text-amber-900">
          <Coins size={18} className="text-amber-500" />
          {t.sideHustleTitle}
        </h3>
        <span className="text-[10px] font-bold bg-amber-100 text-amber-600 px-2 py-0.5 rounded-full">
          {t.lowCostStart}
        </span>
      </div>
      <div className="divide-y divide-black/5">
        {sideHustles.map((hustle) => (
          <div key={hustle.id} className="p-5 hover:bg-amber-50/20 transition-colors">
            <div className="flex items-start justify-between gap-3 mb-3">
              <h4 className="font-bold text-sm leading-snug">{hustle.title}</h4>
              <span className="flex-shrink-0 text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                {hustle.income}
              </span>
            </div>
            <p className="text-xs text-gray-500 leading-relaxed mb-3">
              {hustle.description}
            </p>
            <div className="space-y-1">
              {hustle.steps.slice(0, 3).map((step, i) => (
                <div key={i} className="flex items-start gap-2 text-xs text-gray-600">
                  <ChevronRight size={12} className="text-amber-500 flex-shrink-0 mt-0.5" />
                  <span>{step}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
