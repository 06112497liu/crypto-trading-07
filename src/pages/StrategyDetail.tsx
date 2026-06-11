import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Play,
  Square,
  Trash2,
  Grid3X3,
  TrendingUp,
  ListOrdered,
  Target,
  DollarSign,
  BarChart3,
} from 'lucide-react';
import { useStore } from '@/store/useStore';
import { api } from '@/services/api';
import StatusBadge from '@/components/StatusBadge';
import StatCard from '@/components/StatCard';
import { formatCurrency, formatNumber, formatPrice, formatDateTime } from '@/utils/format';
import type { GridStrategy, Order } from '../../shared/types';

export default function StrategyDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { strategies, updateStrategy } = useStore();
  const [strategy, setStrategy] = useState<GridStrategy | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      if (!id) return;
      const res = await api.strategies.get(id);
      if (res.success && res.data) {
        setStrategy(res.data.strategy);
        setOrders(res.data.orders || []);
      }
    };
    loadData();
  }, [id]);

  useEffect(() => {
    if (id) {
      const fromStore = strategies.find((s) => s.id === id);
      if (fromStore) {
        setStrategy(fromStore);
      }
    }
  }, [id, strategies]);

  const handleStart = async () => {
    if (!id) return;
    setLoading(true);
    const res = await api.strategies.start(id);
    if (res.success && res.data) {
      setStrategy(res.data);
      updateStrategy(res.data);
    }
    setLoading(false);
  };

  const handleStop = async () => {
    if (!id) return;
    setLoading(true);
    const res = await api.strategies.stop(id);
    if (res.success && res.data) {
      setStrategy(res.data);
      updateStrategy(res.data);
    }
    setLoading(false);
  };

  const handleDelete = async () => {
    if (!id) return;
    if (!confirm('确定要删除这个策略吗？')) return;
    setLoading(true);
    await api.strategies.remove(id);
    updateStrategy({ id, deleted: true });
    navigate('/strategies');
  };

  if (!strategy) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin w-8 h-8 border-2 border-accent-yellow border-t-transparent rounded-full" />
      </div>
    );
  }

  const activeBuyOrders = orders.filter(
    (o) => o.side === 'BUY' && (o.status === 'NEW' || o.status === 'PARTIALLY_FILLED')
  ).length;
  const activeSellOrders = orders.filter(
    (o) => o.side === 'SELL' && (o.status === 'NEW' || o.status === 'PARTIALLY_FILLED')
  ).length;
  const filledOrders = orders.filter((o) => o.status === 'FILLED').length;

  const pricePercent = strategy.currentPrice
    ? ((strategy.currentPrice - strategy.lowerPrice) / (strategy.upperPrice - strategy.lowerPrice)) * 100
    : 50;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            to="/strategies"
            className="p-2 rounded-lg hover:bg-bg-tertiary text-text-secondary hover:text-text-primary transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-text-primary">{strategy.name}</h1>
              <StatusBadge status={strategy.status} />
            </div>
            <p className="text-text-secondary mt-1 text-sm">
              {strategy.symbol} · 创建于 {formatDateTime(strategy.createdAt)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {strategy.status === 'running' ? (
            <button onClick={handleStop} disabled={loading} className="btn-danger flex items-center gap-2">
              <Square className="w-4 h-4" />
              停止策略
            </button>
          ) : (
            <button onClick={handleStart} disabled={loading} className="btn-success flex items-center gap-2">
              <Play className="w-4 h-4" />
              启动策略
            </button>
          )}
          <button
            onClick={handleDelete}
            disabled={loading}
            className="p-2.5 rounded-lg text-text-secondary hover:text-accent-red hover:bg-accent-red/10 transition-colors"
            title="删除策略"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="当前价格"
          value={formatPrice(strategy.currentPrice || 0)}
          subtitle={strategy.symbol}
          icon={<BarChart3 className="w-5 h-5 text-accent-yellow" />}
        />
        <StatCard
          title="累计收益"
          value={`${strategy.profit >= 0 ? '+' : ''}${formatNumber(strategy.profit, 4)}`}
          subtitle="USDT"
          icon={<TrendingUp className={`w-5 h-5 ${strategy.profit >= 0 ? 'text-accent-green' : 'text-accent-red'}`} />}
          trend={strategy.profit >= 0 ? 'up' : 'down'}
          trendValue={`${formatNumber(strategy.profit >= 0 ? strategy.profit / strategy.investment * 100 : 0, 2)}%`}
        />
        <StatCard
          title="总成交数"
          value={String(strategy.filledOrders || filledOrders)}
          subtitle="笔成交"
          icon={<ListOrdered className="w-5 h-5 text-accent-green" />}
        />
        <StatCard
          title="投入资金"
          value={formatCurrency(strategy.investment)}
          subtitle={`${strategy.gridNum} 网格`}
          icon={<DollarSign className="w-5 h-5 text-accent-blue" />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="flex items-center gap-2 mb-5">
            <Target className="w-5 h-5 text-accent-yellow" />
            <h2 className="text-lg font-semibold text-text-primary">价格区间</h2>
          </div>

          <div className="space-y-5">
            <div>
              <div className="relative h-4 bg-bg-secondary rounded-full overflow-hidden">
                <div
                  className="absolute inset-y-0 bg-accent-green/30"
                  style={{ left: '0%', right: `${100 - Math.min(100, Math.max(0, pricePercent))}%` }}
                />
                <div
                  className="absolute inset-y-0 bg-accent-red/30"
                  style={{ left: `${Math.min(100, Math.max(0, pricePercent))}%`, right: '0%' }}
                />
                <div
                  className="absolute top-0 bottom-0 w-1 bg-accent-yellow z-10 shadow-lg shadow-accent-yellow/30"
                  style={{ left: `${Math.min(98, Math.max(2, pricePercent))}%` }}
                />
              </div>
              <div className="flex justify-between mt-3">
                <div>
                  <p className="text-xs text-text-tertiary">下限</p>
                  <p className="font-mono font-semibold text-accent-green">{formatPrice(strategy.lowerPrice)}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-text-tertiary">当前</p>
                  <p className="font-mono font-bold text-accent-yellow">{formatPrice(strategy.currentPrice || 0)}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-text-tertiary">上限</p>
                  <p className="font-mono font-semibold text-accent-red">{formatPrice(strategy.upperPrice)}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-border">
              <div className="text-center">
                <p className="text-2xl font-mono font-bold text-text-primary">{strategy.gridNum}</p>
                <p className="text-xs text-text-tertiary mt-1">网格数</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-mono font-bold text-accent-green">{activeBuyOrders}</p>
                <p className="text-xs text-text-tertiary mt-1">买单挂单</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-mono font-bold text-accent-red">{activeSellOrders}</p>
                <p className="text-xs text-text-tertiary mt-1">卖单挂单</p>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center gap-2 mb-5">
            <Grid3X3 className="w-5 h-5 text-accent-yellow" />
            <h2 className="text-lg font-semibold text-text-primary">网格分布</h2>
          </div>

          <div className="space-y-1.5 max-h-64 overflow-y-auto pr-2">
            {strategy.grids.slice().reverse().map((grid, idx) => {
              const isAbove = strategy.currentPrice ? grid.price > strategy.currentPrice : false;
              const isBelow = strategy.currentPrice ? grid.price < strategy.currentPrice : false;
              return (
                <div
                  key={grid.index}
                  className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm ${
                    isAbove
                      ? 'bg-accent-red/5 border border-accent-red/20'
                      : isBelow
                      ? 'bg-accent-green/5 border border-accent-green/20'
                      : 'bg-accent-yellow/10 border border-accent-yellow/30'
                  }`}
                >
                  <span className="text-text-tertiary text-xs">#{grid.index + 1}</span>
                  <span className={`font-mono font-semibold ${
                    isAbove ? 'text-accent-red' : isBelow ? 'text-accent-green' : 'text-accent-yellow'
                  }`}>
                    {formatPrice(grid.price)}
                  </span>
                  <span className="font-mono text-text-secondary text-xs">
                    {formatNumber(grid.amount, 6)}
                  </span>
                  <span className="flex items-center gap-1">
                    {grid.buyFilled && (
                      <span className="w-2 h-2 rounded-full bg-accent-green" title="买单已成交" />
                    )}
                    {grid.buyOrderId && !grid.buyFilled && (
                      <span className="w-2 h-2 rounded-full bg-accent-green/40 animate-pulse" title="买单挂单中" />
                    )}
                    {grid.sellFilled && (
                      <span className="w-2 h-2 rounded-full bg-accent-red" title="卖单已成交" />
                    )}
                    {grid.sellOrderId && !grid.sellFilled && (
                      <span className="w-2 h-2 rounded-full bg-accent-red/40 animate-pulse" title="卖单挂单中" />
                    )}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-text-primary">订单历史</h2>
          <span className="text-sm text-text-secondary">{orders.length} 条记录</span>
        </div>

        {orders.length === 0 ? (
          <div className="text-center py-10 text-text-tertiary">
            <ListOrdered className="w-10 h-10 mx-auto mb-2 opacity-50" />
            <p>暂无订单</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="table-header text-left pb-3">方向</th>
                  <th className="table-header text-right pb-3">价格</th>
                  <th className="table-header text-right pb-3">数量</th>
                  <th className="table-header text-right pb-3">成交额</th>
                  <th className="table-header text-left pb-3">状态</th>
                  <th className="table-header text-right pb-3">时间</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.orderId} className="border-b border-border/50">
                    <td className="table-cell">
                      <span className={`font-medium ${order.side === 'BUY' ? 'text-accent-green' : 'text-accent-red'}`}>
                        {order.side === 'BUY' ? '买入' : '卖出'}
                      </span>
                    </td>
                    <td className="table-cell text-right font-mono">{formatPrice(order.price)}</td>
                    <td className="table-cell text-right font-mono">{formatNumber(order.amount, 6)}</td>
                    <td className="table-cell text-right font-mono">{formatCurrency(order.price * order.amount)}</td>
                    <td className="table-cell"><StatusBadge status={order.status} /></td>
                    <td className="table-cell text-right text-text-secondary text-xs">
                      {formatDateTime(order.createdAt)}
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
