import type { UserStats } from '../types';

const STORAGE_KEY = 'daily_shot_user_stats';

const DEFAULT_STATS: UserStats = {
  aiLiteracyPoints: 0,
  lastReadDate: '',
  currentStreakDays: 0,
  totalReadDays: 0,
  recordedToday: false,
};

function isSameDay(d1: Date | string, d2: Date | string): boolean {
  const a = typeof d1 === 'string' ? new Date(d1) : d1;
  const b = typeof d2 === 'string' ? new Date(d2) : d2;
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function toDateStr(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function getYesterday(d: Date): Date {
  const y = new Date(d);
  y.setDate(y.getDate() - 1);
  return y;
}

function getPersistentStats(): UserStats {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return { ...DEFAULT_STATS };
    const parsed = JSON.parse(stored) as UserStats;
    return {
      ...DEFAULT_STATS,
      ...parsed,
      aiLiteracyPoints: parsed.aiLiteracyPoints ?? 0,
      lastReadDate: parsed.lastReadDate ?? '',
      currentStreakDays: parsed.currentStreakDays ?? 0,
      totalReadDays: parsed.totalReadDays ?? 0,
      recordedToday: parsed.recordedToday ?? false,
    };
  } catch {
    return { ...DEFAULT_STATS };
  }
}

function saveUserStats(stats: UserStats): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
  } catch (e) {
    console.warn('userStatsService: save failed', e);
  }
}

/** Daily first-visit points (e.g. +10) */
const DAILY_VISIT_POINTS = 10;

/**
 * Record an effective read action (e.g. dashboard loaded, user saw content).
 * On first action of the day: update streak, add daily-visit points.
 */
export function recordReadAction(): void {
  const now = new Date();
  const todayStr = toDateStr(now);
  const stats = getPersistentStats();

  if (isSameDay(stats.lastReadDate || '2000-01-01', now)) {
    // Already recorded today, no-op
    return;
  }

  const yesterdayStr = toDateStr(getYesterday(now));
  let newStreak = 1;
  if (stats.lastReadDate === yesterdayStr) {
    newStreak = (stats.currentStreakDays || 0) + 1;
  }
  // else: gap or first time → streak = 1

  const updated: UserStats = {
    ...stats,
    lastReadDate: todayStr,
    currentStreakDays: newStreak,
    totalReadDays: (stats.totalReadDays ?? 0) + 1,
    recordedToday: true,
    aiLiteracyPoints: (stats.aiLiteracyPoints ?? 0) + DAILY_VISIT_POINTS,
  };
  saveUserStats(updated);
}

/**
 * Add points for actions like clicking "Read Full Analysis", posting in Campus Voice, etc.
 */
export function addPoints(amount: number): void {
  const stats = getPersistentStats();
  const updated: UserStats = {
    ...stats,
    aiLiteracyPoints: (stats.aiLiteracyPoints ?? 0) + amount,
  };
  saveUserStats(updated);
}

export function getUserStats(): UserStats {
  const stats = getPersistentStats();
  const now = new Date();
  const todayStr = toDateStr(now);
  if (stats.lastReadDate && !isSameDay(stats.lastReadDate, todayStr)) {
    // New day: reset recordedToday so next visit can get daily points
    const updated = { ...stats, recordedToday: false };
    saveUserStats(updated);
    return updated;
  }
  return stats;
}
