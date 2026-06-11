import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Plus,
  Play,
  Square,
  Trash2,
  Grid3X3,
  Search,
  ChevronRight,
} from 'lucide-react';
import { useStore } from '@/store/useStore';
import { api } from '@/services/api';
import StatusBadge from '@/components/StatusBadge';
import { formatCurrency, formatNumber, formatDateTime, formatPrice } from '@/utils/format';

export default function Strategies() {
  const navigate = useNavigate();
  const { strategies, loadStrategies, updateStrategy } = useStore();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [loading, setLoading] = useState<string | null>(null);

  useEffect(() => {
    loadStrategies();
  }, [loadStrategies]);

  const filtered = strategies.filter((s) => {
    const matchSearch =
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.symbol.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || s.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const handleStart = async (id: string) => {
    setLoading(id);
    const res = await api.strategies.start(id);
    if (res.success && res.data) {
      updateStrategy(res.data);
    }
    setLoading(null);
  };

  const handleStop = async (id: string) => {
    setLoading(id);
    const res = await api.strategies.stop(id);
    if (res.success && res.data) {
      updateStrategy(res.data);
    }
    setLoading(null);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这个策略吗？')) return;
    setLoading(id);
    const res = await api.strategies.remove(id);
    if (res.success) {
      updateStrategy({ id, deleted: true });
    }
    setLoading(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">策略管理</h1>
          <p className="text-text-secondary mt-1 text-sm">
            管理您的网格交易策略
          </p>
        </div>
        <Link to="/strategies/create" className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          创建策略
        </Link>
      </div>

      <div className="card">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
            <input
              type="text"
              placeholder="搜索策略名称或交易对..."
              className="input-field pl-10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            {[
              { value: 'all', label: '全部' },
              { value: 'running', label: '运行中' },
              { value: 'stopped', label: '已停止' },
            ].map((f) => (
              <button
                key={f.value}
                onClick={() => setStatusFilter(f.value)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  statusFilter === f.value
                    ? 'bg-accent-yellow text-bg-primary'
                    : 'bg-bg-tertiary text-text-secondary hover:text-text-primary'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <Grid3X3 className="w-16 h-16 mx-auto mb-4 text-text-tertiary opacity-50" />
            <p className="text-text-secondary text-lg">暂无策略</p>
            <p className="text-text-tertiary text-sm mt-1">创建您的第一个网格策略开始交易</p>
            <Link to="/strategies/create" className="btn-primary inline-flex items-center gap-2 mt-6">
              <Plus className="w-4 h-4" />
              创建策略
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="table-header text-left pb-4">策略</th>
                  <th className="table-header text-left pb-4">交易对</th>
                  <th className="table-header text-right pb-4">价格区间</th>
                  <th className="table-header text-center pb-4">网格</th>
                  <th className="table-header text-right pb-4">投入</th>
                  <th className="table-header text-right pb-4">收益</th>
                  <th className="table-header text-left pb-4">状态</th>
                  <th className="table-header text-left pb-4">创建时间</th>
                  <th className="table-header text-right pb-4">操作</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((strategy) => (
                  <tr
                    key={strategy.id}
                    className="border-b border-border/50 hover:bg-bg-tertiary/30 transition-colors cursor-pointer"
                    onClick={() => navigate(`/strategies/${strategy.id}`)}
                  >
                    <td className="table-cell">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-bg-tertiary flex items-center justify-center">
                          <Grid3X3 className="w-5 h-5 text-accent-yellow" />
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{strategy.name}</span>
                          <ChevronRight className="w-4 h-4 text-text-tertiary" />
                        </div>
                      </div>
                    </td>
                    <td className="table-cell font-mono font-medium">{strategy.symbol}</td>
                    <td className="table-cell text-right font-mono text-sm">
                      <span className="text-accent-green">{formatPrice(strategy.lowerPrice)}</span>
                      <span className="text-text-tertiary mx-1">~</span>
                      <span className="text-accent-red">{formatPrice(strategy.upperPrice)}</span>
                    </td>
                    <td className="table-cell text-center">
                      <span className="font-mono text-text-secondary">{strategy.gridNum} 格</span>
                      <div className="text-xs text-text-tertiary mt-0.5">
                        成交 {strategy.filledOrders}
                      </div>
                    </td>
                    <td className="table-cell text-right font-mono">
                      {formatCurrency(strategy.investment)}
                    </td>
                    <td className={`table-cell text-right font-mono font-semibold ${
                      strategy.profit >= 0 ? 'text-accent-green' : 'text-accent-red'
                    }`}>
                      {strategy.profit >= 0 ? '+' : ''}{formatNumber(strategy.profit, 4)}
                    </td>
                    <td className="table-cell">
                      <StatusBadge status={strategy.status} />
                    </td>
                    <td className="table-cell text-text-secondary text-xs">
                      {formatDateTime(strategy.createdAt)}
                    </td>
                    <td className="table-cell" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        {strategy.status === 'running' ? (
                          <button
                            onClick={() => handleStop(strategy.id)}
                            disabled={loading === strategy.id}
                            className="p-2 rounded-lg text-accent-red hover:bg-accent-red/10 transition-colors disabled:opacity-50"
                            title="停止策略"
                          >
                            <Square className="w-4 h-4" />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleStart(strategy.id)}
                            disabled={loading === strategy.id}
                            className="p-2 rounded-lg text-accent-green hover:bg-accent-green/10 transition-colors disabled:opacity-50"
                            title="启动策略"
                          >
                            <Play className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(strategy.id)}
                          disabled={loading === strategy.id}
                          className="p-2 rounded-lg text-text-secondary hover:text-accent-red hover:bg-accent-red/10 transition-colors disabled:opacity-50"
                          title="删除策略"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
