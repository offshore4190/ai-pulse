import { motion } from 'motion/react';
import { ArrowLeft, Award, Flame } from 'lucide-react';
import type { UserStats } from '../../types';

interface UserProfilePanelProps {
  t: any;
  userStats: UserStats;
  onBack: () => void;
}

export function UserProfilePanel({ t, userStats, onBack }: UserProfilePanelProps) {
  return (
    <motion.div
      key="profile"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-8"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-gray-600 hover:text-black transition-colors font-medium"
        >
          <ArrowLeft size={20} />
          {t.backToDashboard}
        </button>
        <h2 className="text-2xl font-bold tracking-tight">{t.myProfile}</h2>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* AI Literacy Points */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-8 rounded-3xl border border-black/5 shadow-sm"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-amber-100 text-amber-600 rounded-2xl">
              <Award size={28} />
            </div>
            <h3 className="text-lg font-bold">{t.aiLiteracyPoints}</h3>
          </div>
          <p className="text-4xl font-black text-amber-600 tabular-nums">
            {userStats.aiLiteracyPoints}
          </p>
          <p className="text-sm text-gray-500 mt-2">{t.pointsEarnHint}</p>
        </motion.div>

        {/* Reading Streak */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white p-8 rounded-3xl border border-black/5 shadow-sm"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-rose-100 text-rose-600 rounded-2xl">
              <Flame size={28} />
            </div>
            <h3 className="text-lg font-bold">{t.continuousReadDays}</h3>
          </div>
          <p className="text-4xl font-black text-rose-600 tabular-nums">
            {userStats.currentStreakDays}
          </p>
          <p className="text-sm text-gray-500 mt-2">{t.streakSuffix}</p>
          {userStats.totalReadDays !== undefined && userStats.totalReadDays > 0 && (
            <p className="text-xs text-gray-400 mt-1">
              {t.totalReadDays}: {userStats.totalReadDays}
            </p>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
}
