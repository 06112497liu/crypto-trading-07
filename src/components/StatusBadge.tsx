import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: 'running' | 'stopped' | 'error' | 'NEW' | 'FILLED' | 'CANCELED' | 'PARTIALLY_FILLED';
  className?: string;
}

const statusConfig: Record<string, { label: string; className: string }> = {
  running: { label: '运行中', className: 'bg-accent-green/20 text-accent-green' },
  stopped: { label: '已停止', className: 'bg-text-tertiary/20 text-text-secondary' },
  error: { label: '错误', className: 'bg-accent-red/20 text-accent-red' },
  NEW: { label: '挂单中', className: 'bg-accent-blue/20 text-blue-400' },
  PARTIALLY_FILLED: { label: '部分成交', className: 'bg-accent-yellow/20 text-accent-yellow' },
  FILLED: { label: '已成交', className: 'bg-accent-green/20 text-accent-green' },
  CANCELED: { label: '已撤销', className: 'bg-text-tertiary/20 text-text-secondary' },
};

export default function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status] || {
    label: status,
    className: 'bg-text-tertiary/20 text-text-secondary',
  };

  return (
    <span className={cn('badge', config.className, className)}>
      <span
        className={cn(
          'w-1.5 h-1.5 rounded-full mr-1.5',
          status === 'running' && 'bg-accent-green animate-pulse',
          status === 'NEW' && 'bg-blue-400 animate-pulse',
          status === 'FILLED' && 'bg-accent-green',
          status === 'stopped' || status === 'CANCELED' ? 'bg-text-tertiary' : ''
        )}
      />
      {config.label}
    </span>
  );
}
