import { Lightbulb } from "lucide-react";
import { TranslationKeys, PeerStory } from "../types";

interface Props {
  t: TranslationKeys;
  story?: PeerStory;
}

export default function PeerStorySection({ t, story }: Props) {
  if (!story?.author) return null;

  return (
    <section className="bg-white rounded-3xl border border-black/5 shadow-sm overflow-hidden">
      <div className="p-5 border-b border-black/5 bg-indigo-50/30 flex items-center justify-between">
        <h3 className="font-bold flex items-center gap-2 text-indigo-900">
          <Lightbulb size={18} className="text-indigo-500" />
          {t.peerStoryTitle}
        </h3>
        <span className="text-[10px] font-bold bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full">
          {t.weeklyStory}
        </span>
      </div>
      <div className="p-5 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-sm flex-shrink-0">
            {story.author.avatar ? (
              <img
                src={story.author.avatar}
                alt=""
                className="w-full h-full rounded-full object-cover"
                referrerPolicy="no-referrer"
                loading="lazy"
              />
            ) : (
              story.author.name.charAt(0)
            )}
          </div>
          <div>
            <p className="font-bold text-sm">{story.author.name}</p>
            <p className="text-xs text-gray-500">
              {story.author.school} · {story.author.status}
            </p>
          </div>
        </div>

        <h4 className="font-bold text-base leading-snug">{story.title}</h4>
        <p className="text-sm text-gray-600 leading-relaxed">{story.content}</p>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-emerald-50 rounded-2xl p-3">
            <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider mb-1">
              {t.funding}
            </p>
            <p className="text-sm font-bold text-emerald-800">{story.funding}</p>
          </div>
          <div className="bg-indigo-50 rounded-2xl p-3">
            <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider mb-1">
              {t.whatYouCanLearn}
            </p>
            <p className="text-xs text-indigo-800 leading-snug">{story.takeaway}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
