import { motion } from 'motion/react';
import type { Metric } from '../../types';

interface MetricsGridProps {
  metrics: Metric[];
  loading: boolean;
}

export function MetricsGrid({ metrics, loading }: MetricsGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="bg-white p-4 rounded-2xl border border-black/5 shadow-sm">
            <div className="h-3 w-16 bg-gray-200 rounded animate-pulse mb-2" />
            <div className="h-6 w-20 bg-gray-200 rounded animate-pulse" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
      {metrics.map((metric, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
          className="bg-white p-4 rounded-2xl border border-black/5 shadow-sm hover:shadow-md transition-shadow"
        >
          <p className="text-[10px] uppercase tracking-wider font-semibold text-gray-400 mb-1">
            {metric.label}
          </p>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl font-bold font-mono">{metric.value}</span>
            {metric.change && (
              <span
                className={`text-[11px] font-medium flex items-center ${
                  metric.isPositive !== false ? 'text-emerald-600' : 'text-rose-600'
                }`}
              >
                {metric.change}
              </span>
            )}
          </div>
        </motion.div>
      ))}
    </div>
  );
}
