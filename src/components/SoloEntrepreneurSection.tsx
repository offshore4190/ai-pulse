import { Rocket, ExternalLink } from "lucide-react";
import { TranslationKeys, SoloEntrepreneur } from "../types";

interface Props {
  t: TranslationKeys;
  entrepreneurs: SoloEntrepreneur[];
}

export default function SoloEntrepreneurSection({ t, entrepreneurs = [] }: Props) {
  if (!entrepreneurs?.length) return null;

  return (
    <section className="bg-white rounded-3xl border border-black/5 shadow-sm overflow-hidden">
      <div className="p-5 border-b border-black/5 bg-rose-50/30 flex items-center justify-between">
        <h3 className="font-bold flex items-center gap-2 text-rose-900">
          <Rocket size={18} className="text-rose-500" />
          {t.soloEntrepreneurTitle}
        </h3>
        <span className="text-[10px] font-bold bg-rose-100 text-rose-600 px-2 py-0.5 rounded-full">
          {t.indieMaker}
        </span>
      </div>
      <div className="divide-y divide-black/5">
        {entrepreneurs.map((person) => (
          <a
            key={person.id}
            href={person.url}
            target="_blank"
            rel="noopener noreferrer"
            className="p-5 flex gap-4 hover:bg-rose-50/20 transition-colors group block"
          >
            <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 font-bold text-sm flex-shrink-0">
              {person.avatar ? (
                <img
                  src={person.avatar}
                  alt=""
                  className="w-full h-full rounded-full object-cover"
                  referrerPolicy="no-referrer"
                  loading="lazy"
                />
              ) : (
                person.name.charAt(0)
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-bold text-sm">{person.name}</p>
                  <p className="text-xs text-gray-500">{person.role}</p>
                </div>
                <ExternalLink
                  size={14}
                  className="text-gray-300 group-hover:text-rose-500 transition-colors flex-shrink-0 mt-1"
                />
              </div>
              <p className="text-xs text-gray-600 mt-1 leading-snug">{person.project}</p>
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs font-bold text-emerald-600">{person.revenue}</span>
                <div className="flex gap-1 flex-wrap justify-end">
                  {person.stack.slice(0, 3).map((tech) => (
                    <span
                      key={tech}
                      className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded font-medium"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
              <p className="text-xs text-gray-500 italic mt-2 leading-snug">"{person.insight}"</p>
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}
