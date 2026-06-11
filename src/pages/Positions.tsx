import { useEffect } from 'react';
import { Wallet, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { formatCurrency, formatNumber, formatPrice, formatPercent } from '@/utils/format';

export default function Positions() {
  const { positions, balances, loadPositions, loadBalances } = useStore();

  useEffect(() => {
    loadPositions();
    loadBalances();
  }, [loadPositions, loadBalances]);

  const totalMarketValue = positions.reduce((sum, p) => sum + p.marketValue, 0);
  const totalPnl = positions.reduce((sum, p) => sum + p.unrealizedPnl, 0);
  const totalCost = positions.reduce((sum, p) => sum + p.avgPrice * p.amount, 0);
  const totalBalanceUSDT = balances.reduce((sum, b) => sum + (b.usdtValue || 0), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">持仓管理</h1>
        <p className="text-text-secondary mt-1 text-sm">查看您的当前持仓和盈亏情况</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-accent-yellow/10 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-accent-yellow" />
            </div>
            <div>
              <p className="text-text-secondary text-sm">账户总资产</p>
              <p className="text-xl font-bold text-text-primary font-mono mt-1">
                {formatCurrency(totalBalanceUSDT + totalMarketValue)}
              </p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-accent-green/10 flex items-center justify-center">
              <Wallet className="w-5 h-5 text-accent-green" />
            </div>
            <div>
              <p className="text-text-secondary text-sm">持仓市值</p>
              <p className="text-xl font-bold text-text-primary font-mono mt-1">
                {formatCurrency(totalMarketValue)}
              </p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-bg-tertiary flex items-center justify-center">
              <Wallet className="w-5 h-5 text-text-secondary" />
            </div>
            <div>
              <p className="text-text-secondary text-sm">持仓成本</p>
              <p className="text-xl font-bold text-text-primary font-mono mt-1">
                {formatCurrency(totalCost)}
              </p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              totalPnl >= 0 ? 'bg-accent-green/10' : 'bg-accent-red/10'
            }`}>
              {totalPnl >= 0 ? (
                <TrendingUp className="w-5 h-5 text-accent-green" />
              ) : (
                <TrendingDown className="w-5 h-5 text-accent-red" />
              )}
            </div>
            <div>
              <p className="text-text-secondary text-sm">浮动盈亏</p>
              <p className={`text-xl font-bold font-mono mt-1 ${
                totalPnl >= 0 ? 'text-accent-green' : 'text-accent-red'
              }`}>
                {totalPnl >= 0 ? '+' : ''}{formatCurrency(totalPnl)}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <h2 className="text-lg font-semibold text-text-primary mb-4">持仓明细</h2>

        {positions.length === 0 ? (
          <div className="text-center py-16">
            <Wallet className="w-16 h-16 mx-auto mb-4 text-text-tertiary opacity-50" />
            <p className="text-text-secondary text-lg">暂无持仓</p>
            <p className="text-text-tertiary text-sm mt-1">
              启动网格策略后，成交的买单将自动计入持仓
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="table-header text-left pb-4">交易对</th>
                  <th className="table-header text-right pb-4">持仓数量</th>
                  <th className="table-header text-right pb-4">成本价</th>
                  <th className="table-header text-right pb-4">当前价</th>
                  <th className="table-header text-right pb-4">市值</th>
                  <th className="table-header text-right pb-4">浮动盈亏</th>
                  <th className="table-header text-right pb-4">盈亏比例</th>
                </tr>
              </thead>
              <tbody>
                {positions.map((p) => (
                  <tr key={p.symbol} className="border-b border-border/50 hover:bg-bg-tertiary/30 transition-colors">
                    <td className="table-cell">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-bg-tertiary flex items-center justify-center text-sm font-bold">
                          {p.symbol.slice(0, 2)}
                        </div>
                        <div>
                          <p className="font-medium">{p.symbol}</p>
                          <p className="text-xs text-text-tertiary">
                            {p.symbol.replace('USDT', '')}/USDT
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="table-cell text-right font-mono font-semibold">
                      {formatNumber(p.amount, 6)}
                    </td>
                    <td className="table-cell text-right font-mono">
                      {formatPrice(p.avgPrice)}
                    </td>
                    <td className="table-cell text-right font-mono">
                      {formatPrice(p.currentPrice)}
                    </td>
                    <td className="table-cell text-right font-mono font-medium">
                      {formatCurrency(p.marketValue)}
                    </td>
                    <td className={`table-cell text-right font-mono font-semibold ${
                      p.unrealizedPnl >= 0 ? 'text-accent-green' : 'text-accent-red'
                    }`}>
                      {p.unrealizedPnl >= 0 ? '+' : ''}{formatCurrency(p.unrealizedPnl)}
                    </td>
                    <td className="table-cell text-right">
                      <span className={`badge ${
                        p.unrealizedPnlPercent >= 0
                          ? 'bg-accent-green/20 text-accent-green'
                          : 'bg-accent-red/20 text-accent-red'
                      }`}>
                        {formatPercent(p.unrealizedPnlPercent)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {balances.length > 0 && (
        <div className="card">
          <h2 className="text-lg font-semibold text-text-primary mb-4">账户余额</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {balances.map((b) => (
              <div key={b.asset} className="p-4 bg-bg-tertiary/50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-text-primary">{b.asset}</span>
                  <DollarSign className="w-4 h-4 text-text-tertiary" />
                </div>
                <p className="text-xl font-mono font-bold text-text-primary">
                  {formatNumber(b.total, 4)}
                </p>
                <div className="flex items-center justify-between mt-2 text-xs">
                  <span className="text-text-tertiary">可用: {formatNumber(b.free, 4)}</span>
                  {b.usdtValue && (
                    <span className="text-text-secondary font-mono">{formatCurrency(b.usdtValue)}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
