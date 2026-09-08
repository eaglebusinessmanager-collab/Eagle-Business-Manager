import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  color?: 'blue' | 'emerald' | 'amber' | 'purple' | 'rose' | 'slate';
  trend?: {
    value: string;
    isPositive: boolean;
  };
  onClick?: () => void;
}

const colorMap = {
  blue: {
    bg: 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400',
    border: 'border-blue-100 dark:border-blue-900/50',
  },
  emerald: {
    bg: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400',
    border: 'border-emerald-100 dark:border-emerald-900/50',
  },
  amber: {
    bg: 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400',
    border: 'border-amber-100 dark:border-amber-900/50',
  },
  purple: {
    bg: 'bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400',
    border: 'border-purple-100 dark:border-purple-900/50',
  },
  rose: {
    bg: 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400',
    border: 'border-rose-100 dark:border-rose-900/50',
  },
  slate: {
    bg: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300',
    border: 'border-slate-200 dark:border-slate-700',
  },
};

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  color = 'blue',
  trend,
  onClick,
}) => {
  const styles = colorMap[color];

  return (
    <div
      onClick={onClick}
      className={`relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-xs transition dark:border-slate-800 dark:bg-slate-900 ${
        onClick ? 'cursor-pointer hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700' : ''
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">{title}</span>
        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${styles.bg}`}>
          <Icon className="h-4 w-4" />
        </div>
      </div>

      <div className="mt-2.5">
        <h3 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white font-mono">
          {value}
        </h3>
        {subtitle && (
          <p className="mt-1 text-[11px] font-medium text-slate-500 dark:text-slate-400 truncate">
            {subtitle}
          </p>
        )}
      </div>

      {trend && (
        <div className="mt-2 flex items-center gap-1.5 text-[11px]">
          <span
            className={`font-bold ${
              trend.isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
            }`}
          >
            {trend.value}
          </span>
          <span className="text-slate-400">vs last period</span>
        </div>
      )}
    </div>
  );
};
