import { Languages, Users, Headphones } from 'lucide-react';
import type { Persona, Language, UserStats } from '../../types';

interface HeaderProps {
  t: any;
  persona: Persona;
  language: Language;
  userStats: UserStats;
  onPersonaToggle: () => void;
  onLanguageToggle: () => void;
  onProfileClick: () => void;
  onPodcastClick?: () => void;
}

export function Header({
  t,
  persona,
  language,
  userStats,
  onPersonaToggle,
  onLanguageToggle,
  onProfileClick,
  onPodcastClick
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-black/5 px-4 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-amber-800 to-amber-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-md">
            ☕
          </div>
          <div className="flex flex-col">
            <h1 className="text-lg font-semibold tracking-tight">
              {language === 'zh' ? '第一杯' : 'First Cup'}
            </h1>
            <p className="text-[10px] text-gray-500 font-medium">
              {t.appTagline}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 md:gap-3">
          {/* Language Toggle */}
          <button
            onClick={onLanguageToggle}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-black/5 hover:border-black/10 transition-all bg-white/50 hover:bg-white text-sm font-medium"
            title={language === 'en' ? 'Switch to Chinese' : 'Switch to English'}
          >
            <Languages size={16} className="text-gray-600" />
            <span className="hidden sm:inline">
              {language === 'en' ? t.switchToChinese : t.switchToEnglish}
            </span>
          </button>

          {/* Persona Toggle */}
          <button
            onClick={onPersonaToggle}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-black/5 hover:border-black/10 transition-all bg-white/50 hover:bg-white text-sm font-medium"
          >
            <Users size={16} className="text-gray-600" />
            <span className="hidden sm:inline">
              {persona === 'investor' ? t.student : t.investor}
            </span>
          </button>

          {/* Podcast Button (optional) */}
          {onPodcastClick && (
            <button
              onClick={onPodcastClick}
              className="p-2 rounded-xl border border-black/5 hover:border-black/10 transition-all bg-white/50 hover:bg-white"
              title={t.podcastDaily}
            >
              <Headphones size={18} className="text-gray-600" />
            </button>
          )}

          {/* Profile Button */}
          <button
            onClick={onProfileClick}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600 transition-all shadow-sm font-medium"
          >
            <div className="w-6 h-6 bg-white/20 rounded-lg flex items-center justify-center text-[10px] font-bold">
              {t.profileButton}
            </div>
            <div className="hidden md:flex flex-col items-start leading-tight">
              <span className="text-[9px] text-white/70">{t.myProfileFloat}</span>
              <span className="text-sm font-bold tabular-nums">
                {userStats.aiLiteracyPoints}
              </span>
            </div>
          </button>
        </div>
      </div>
    </header>
  );
}
