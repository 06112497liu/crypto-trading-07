import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Wallet,
  TrendingUp,
  Grid3X3,
  ListOrdered,
  ArrowRight,
  DollarSign,
  Percent,
} from 'lucide-react';
import { useStore } from '@/store/useStore';
import StatCard from '@/components/StatCard';
import StatusBadge from '@/components/StatusBadge';
import { formatCurrency, formatNumber, formatTimeAgo, formatPrice } from '@/utils/format';

export default function Dashboard() {
  const {
    strategies,
    orders,
    positions,
    balances,
    tickers,
    loadAll,
  } = useStore();

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const totalBalance = balances.reduce(
    (sum, b) => sum + (b.usdtValue || 0),
    0
  );

  const runningStrategies = strategies.filter((s) => s.status === 'running');
  const totalProfit = strategies.reduce((sum, s) => sum + s.profit, 0);
  const activeOrders = orders.filter(
    (o) => o.status === 'NEW' || o.status === 'PARTIALLY_FILLED'
  );
  const totalPnl = positions.reduce((sum, p) => sum + p.unrealizedPnl, 0);

  const btcTicker = tickers.get('BTCUSDT');
  const ethTicker = tickers.get('ETHUSDT');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">仪表盘</h1>
          <p className="text-text-secondary mt-1 text-sm">
            欢迎回来，查看您的交易概况
          </p>
        </div>
        <Link to="/strategies/create" className="btn-primary flex items-center gap-2">
          <Grid3X3 className="w-4 h-4" />
          创建策略
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="总资产"
          value={formatCurrency(totalBalance)}
          subtitle="折合 USDT"
          icon={<Wallet className="w-5 h-5 text-accent-yellow" />}
          trend={totalPnl >= 0 ? 'up' : 'down'}
          trendValue={formatCurrency(Math.abs(totalPnl))}
        />
        <StatCard
          title="运行中策略"
          value={String(runningStrategies.length)}
          subtitle={`共 ${strategies.length} 个策略`}
          icon={<Grid3X3 className="w-5 h-5 text-accent-green" />}
        />
        <StatCard
          title="累计收益"
          value={formatCurrency(totalProfit)}
          subtitle="所有策略累计"
          icon={<TrendingUp className="w-5 h-5 text-accent-green" />}
          trend={totalProfit >= 0 ? 'up' : 'down'}
          trendValue={`${totalProfit >= 0 ? '+' : ''}${formatNumber(totalProfit, 2)}`}
        />
        <StatCard
          title="活跃挂单"
          value={String(activeOrders.length)}
          subtitle="当前挂单中"
          icon={<ListOrdered className="w-5 h-5 text-accent-blue" />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-text-primary">运行中的策略</h2>
              <Link
                to="/strategies"
                className="text-sm text-accent-yellow hover:text-accent-yellow-hover flex items-center gap-1"
              >
                查看全部 <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {runningStrategies.length === 0 ? (
              <div className="text-center py-12 text-text-tertiary">
                <Grid3X3 className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>暂无运行中的策略</p>
                <Link to="/strategies/create" className="text-accent-yellow hover:underline text-sm mt-2 inline-block">
                  创建第一个策略
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {runningStrategies.slice(0, 5).map((strategy) => {
                  const ticker = tickers.get(strategy.symbol);
                  return (
                    <div
                      key={strategy.id}
                      className="flex items-center justify-between p-4 bg-bg-tertiary/50 rounded-lg hover:bg-bg-tertiary transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-bg-secondary flex items-center justify-center font-bold text-sm">
                          {strategy.symbol.slice(0, 2)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-text-primary">{strategy.name}</p>
                            <StatusBadge status={strategy.status} />
                          </div>
                          <p className="text-xs text-text-tertiary mt-0.5">
                            {strategy.symbol} · {strategy.gridNum} 格 · {formatCurrency(strategy.investment)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-mono font-semibold text-text-primary">
                          {formatPrice(strategy.currentPrice || 0)}
                        </p>
                        <p className={`text-sm font-medium ${strategy.profit >= 0 ? 'text-accent-green' : 'text-accent-red'}`}>
                          {strategy.profit >= 0 ? '+' : ''}{formatNumber(strategy.profit, 4)} USDT
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-text-primary">最近订单</h2>
              <Link
                to="/orders"
                className="text-sm text-accent-yellow hover:text-accent-yellow-hover flex items-center gap-1"
              >
                查看全部 <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {orders.length === 0 ? (
              <div className="text-center py-8 text-text-tertiary">
                <ListOrdered className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p className="text-sm">暂无订单记录</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="table-header text-left pb-3">交易对</th>
                      <th className="table-header text-left pb-3">方向</th>
                      <th className="table-header text-right pb-3">价格</th>
                      <th className="table-header text-right pb-3">数量</th>
                      <th className="table-header text-left pb-3">状态</th>
                      <th className="table-header text-right pb-3">时间</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.slice(0, 8).map((order) => (
                      <tr key={order.orderId} className="border-b border-border/50">
                        <td className="table-cell font-medium">{order.symbol}</td>
                        <td className="table-cell">
                          <span className={order.side === 'BUY' ? 'text-accent-green' : 'text-accent-red'}>
                            {order.side === 'BUY' ? '买入' : '卖出'}
                          </span>
                        </td>
                        <td className="table-cell text-right font-mono">{formatPrice(order.price)}</td>
                        <td className="table-cell text-right font-mono">{formatNumber(order.amount, 6)}</td>
                        <td className="table-cell"><StatusBadge status={order.status} /></td>
                        <td className="table-cell text-right text-text-secondary text-xs">
                          {formatTimeAgo(order.createdAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="card">
            <h2 className="text-lg font-semibold text-text-primary mb-4">实时行情</h2>
            <div className="space-y-3">
              {[
                { symbol: 'BTCUSDT', name: 'Bitcoin', ticker: btcTicker },
                { symbol: 'ETHUSDT', name: 'Ethereum', ticker: ethTicker },
                { symbol: 'BNBUSDT', name: 'BNB', ticker: tickers.get('BNBUSDT') },
                { symbol: 'SOLUSDT', name: 'Solana', ticker: tickers.get('SOLUSDT') },
              ].map(({ symbol, name, ticker }) => (
                <div key={symbol} className="flex items-center justify-between p-3 bg-bg-tertiary/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-bg-secondary flex items-center justify-center text-xs font-bold">
                      {symbol.slice(0, 2)}
                    </div>
                    <div>
                      <p className="font-medium text-text-primary text-sm">{name}</p>
                      <p className="text-xs text-text-tertiary">{symbol}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-mono font-semibold text-text-primary text-sm">
                      {ticker ? formatPrice(ticker.price) : '--'}
                    </p>
                    {ticker && (
                      <p className={`text-xs font-medium flex items-center justify-end gap-1 ${
                        (ticker.changePercent || 0) >= 0 ? 'text-accent-green' : 'text-accent-red'
                      }`}>
                        <Percent className="w-3 h-3" />
                        {(ticker.changePercent || 0) >= 0 ? '+' : ''}{formatNumber(ticker.changePercent || 0, 2)}%
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-text-primary">账户余额</h2>
              <Link
                to="/positions"
                className="text-sm text-accent-yellow hover:text-accent-yellow-hover flex items-center gap-1"
              >
                详情 <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="space-y-3">
              {balances.length === 0 ? (
                <div className="text-center py-6 text-text-tertiary text-sm">
                  暂无余额数据
                </div>
              ) : (
                balances.slice(0, 5).map((b) => (
                  <div key={b.asset} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <DollarSign className="w-4 h-4 text-text-tertiary" />
                      <span className="text-text-primary font-medium">{b.asset}</span>
                    </div>
                    <div className="text-right">
                      <p className="font-mono text-text-primary">{formatNumber(b.total, 4)}</p>
                      {b.usdtValue && (
                        <p className="text-xs text-text-tertiary">{formatCurrency(b.usdtValue)}</p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
