import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon?: ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  className?: string;
}

export default function StatCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  trendValue,
  className,
}: StatCardProps) {
  const trendColor = {
    up: 'text-accent-green',
    down: 'text-accent-red',
    neutral: 'text-text-secondary',
  };

  return (
    <div className={cn('card', className)}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-text-secondary text-sm font-medium">{title}</p>
          <p className="text-2xl font-bold text-text-primary mt-2 font-mono">{value}</p>
          {subtitle && (
            <p className="text-text-tertiary text-xs mt-1">{subtitle}</p>
          )}
        </div>
        {icon && (
          <div className="w-10 h-10 rounded-lg bg-bg-tertiary flex items-center justify-center">
            {icon}
          </div>
        )}
      </div>
      {trend && trendValue && (
        <div className={cn('mt-3 text-sm font-medium', trendColor[trend])}>
          {trend === 'up' ? '+' : ''}{trendValue}
        </div>
      )}
    </div>
  );
}
