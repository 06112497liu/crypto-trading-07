import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Info, Zap } from 'lucide-react';
import { api } from '@/services/api';
import { formatPrice, formatNumber, formatCurrency } from '@/utils/format';

const SYMBOLS = ['BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'SOLUSDT', 'DOGEUSDT', 'ADAUSDT', 'XRPUSDT'];

export default function CreateStrategy() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPrice, setCurrentPrice] = useState<number>(0);

  const [form, setForm] = useState({
    name: '',
    symbol: 'BTCUSDT',
    lowerPrice: '',
    upperPrice: '',
    gridNum: '50',
    investment: '1000',
    autoStart: true,
  });

  useEffect(() => {
    const fetchPrice = async () => {
      const res = await api.account.ticker(form.symbol);
      if (res.success && res.data) {
        setCurrentPrice(res.data.price);
        if (!form.lowerPrice && !form.upperPrice) {
          setForm((f) => ({
            ...f,
            lowerPrice: String(Math.round(res.data.price * 0.9 * 100) / 100),
            upperPrice: String(Math.round(res.data.price * 1.1 * 100) / 100),
          }));
        }
      }
    };
    fetchPrice();
  }, [form.symbol]);

  const lower = parseFloat(form.lowerPrice) || 0;
  const upper = parseFloat(form.upperPrice) || 0;
  const gridNum = parseInt(form.gridNum) || 0;
  const investment = parseFloat(form.investment) || 0;

  const gridSize = upper > lower && gridNum > 0 ? (upper - lower) / gridNum : 0;
  const profitPerGrid = gridSize && currentPrice ? (gridSize / currentPrice) * 100 : 0;
  const perGridAmount = gridNum > 0 && currentPrice > 0 ? investment / gridNum / currentPrice : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await api.strategies.create({
        name: form.name || `${form.symbol} 网格策略`,
        symbol: form.symbol,
        lowerPrice: lower,
        upperPrice: upper,
        gridNum: gridNum,
        investment: investment,
        autoStart: form.autoStart,
      });

      if (res.success && res.data) {
        navigate(`/strategies/${res.data.id}`);
      } else {
        setError(res.error || '创建失败');
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Link
          to="/strategies"
          className="p-2 rounded-lg hover:bg-bg-tertiary text-text-secondary hover:text-text-primary transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-text-primary">创建网格策略</h1>
          <p className="text-text-secondary mt-1 text-sm">配置参数，一键启动网格交易</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="card">
            <h2 className="text-lg font-semibold text-text-primary mb-4">基础设置</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm text-text-secondary mb-2">策略名称</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="输入策略名称（可选）"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm text-text-secondary mb-2">交易对</label>
                <select
                  className="input-field"
                  value={form.symbol}
                  onChange={(e) => setForm({ ...form, symbol: e.target.value })}
                >
                  {SYMBOLS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                {currentPrice > 0 && (
                  <p className="text-xs text-text-tertiary mt-1">
                    当前价格: <span className="text-accent-yellow font-mono">{formatPrice(currentPrice)}</span>
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm text-text-secondary mb-2">投入金额 (USDT)</label>
                <input
                  type="number"
                  className="input-field"
                  placeholder="1000"
                  min="10"
                  step="10"
                  value={form.investment}
                  onChange={(e) => setForm({ ...form, investment: e.target.value })}
                />
                <p className="text-xs text-text-tertiary mt-1">
                  建议最小投入: <span className="font-mono">{formatCurrency(gridNum * 10)}</span>
                </p>
              </div>
            </div>
          </div>

          <div className="card">
            <h2 className="text-lg font-semibold text-text-primary mb-4">网格参数</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm text-text-secondary mb-2">
                  价格下限 <span className="text-accent-green">(做多区域)</span>
                </label>
                <input
                  type="number"
                  className="input-field"
                  placeholder="下限价格"
                  min="0"
                  step="0.01"
                  value={form.lowerPrice}
                  onChange={(e) => setForm({ ...form, lowerPrice: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm text-text-secondary mb-2">
                  价格上限 <span className="text-accent-red">(做空区域)</span>
                </label>
                <input
                  type="number"
                  className="input-field"
                  placeholder="上限价格"
                  min="0"
                  step="0.01"
                  value={form.upperPrice}
                  onChange={(e) => setForm({ ...form, upperPrice: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm text-text-secondary mb-2">网格数量</label>
                <input
                  type="number"
                  className="input-field"
                  placeholder="50"
                  min="2"
                  max="200"
                  value={form.gridNum}
                  onChange={(e) => setForm({ ...form, gridNum: e.target.value })}
                />
                <p className="text-xs text-text-tertiary mt-1">建议: 20-100 格</p>
              </div>
            </div>

            {currentPrice > 0 && lower > 0 && upper > 0 && (
              <div className="mt-6 p-4 bg-bg-tertiary/50 rounded-lg">
                <div className="relative h-3 bg-bg-secondary rounded-full overflow-hidden">
                  <div
                    className="absolute inset-y-0 bg-accent-green/30"
                    style={{ left: '0%', right: `${100 - ((currentPrice - lower) / (upper - lower)) * 100}%` }}
                  />
                  <div
                    className="absolute inset-y-0 bg-accent-red/30"
                    style={{ left: `${((currentPrice - lower) / (upper - lower)) * 100}%`, right: '0%' }}
                  />
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-accent-yellow z-10"
                    style={{ left: `${((currentPrice - lower) / (upper - lower)) * 100}%` }}
                  />
                </div>
                <div className="flex justify-between mt-2 text-xs">
                  <span className="text-accent-green font-mono">{formatPrice(lower)}</span>
                  <span className="text-accent-yellow font-mono font-semibold">当前: {formatPrice(currentPrice)}</span>
                  <span className="text-accent-red font-mono">{formatPrice(upper)}</span>
                </div>
              </div>
            )}
          </div>

          <div className="card">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                className="w-5 h-5 rounded border-border bg-bg-tertiary text-accent-yellow focus:ring-accent-yellow"
                checked={form.autoStart}
                onChange={(e) => setForm({ ...form, autoStart: e.target.checked })}
              />
              <div>
                <p className="text-text-primary font-medium">创建后立即启动</p>
                <p className="text-text-tertiary text-xs mt-0.5">勾选后将立即开始挂单交易</p>
              </div>
            </label>
          </div>
        </div>

        <div className="space-y-6">
          <div className="card">
            <div className="flex items-center gap-2 mb-4">
              <Info className="w-5 h-5 text-accent-yellow" />
              <h2 className="text-lg font-semibold text-text-primary">策略预览</h2>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-border/50">
                <span className="text-text-secondary">交易对</span>
                <span className="font-mono font-semibold">{form.symbol}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-border/50">
                <span className="text-text-secondary">价格区间</span>
                <span className="font-mono text-sm">
                  <span className="text-accent-green">{formatPrice(lower)}</span>
                  <span className="text-text-tertiary mx-1">~</span>
                  <span className="text-accent-red">{formatPrice(upper)}</span>
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-border/50">
                <span className="text-text-secondary">网格数量</span>
                <span className="font-mono">{gridNum} 格</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-border/50">
                <span className="text-text-secondary">网格间距</span>
                <span className="font-mono">{formatPrice(gridSize)}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-border/50">
                <span className="text-text-secondary">单格利润率</span>
                <span className="font-mono text-accent-green">+{formatNumber(profitPerGrid, 2)}%</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-border/50">
                <span className="text-text-secondary">每格数量</span>
                <span className="font-mono">{formatNumber(perGridAmount, 6)}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-text-secondary">总投入</span>
                <span className="font-mono font-semibold text-accent-yellow">{formatCurrency(investment)}</span>
              </div>
            </div>
          </div>

          <div className="card bg-accent-yellow/5 border-accent-yellow/30">
            <div className="flex items-start gap-3">
              <Zap className="w-5 h-5 text-accent-yellow flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-text-primary font-medium text-sm">策略说明</p>
                <ul className="text-xs text-text-secondary mt-2 space-y-1.5">
                  <li>• 下跌做多：价格跌破网格线时自动买入</li>
                  <li>• 上涨做空：价格涨破网格线时自动卖出</li>
                  <li>• 无需初始仓位，自动在区间内双向挂单</li>
                  <li>• 成交后自动补挂反向订单，循环获利</li>
                </ul>
              </div>
            </div>
          </div>

          {error && (
            <div className="p-4 bg-accent-red/10 border border-accent-red/30 rounded-lg text-accent-red text-sm">
              {error}
            </div>
          )}

          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading ? '创建中...' : (form.autoStart ? '一键创建并启动' : '创建策略')}
          </button>
        </div>
      </form>
    </div>
  );
}
