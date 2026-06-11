import { useEffect, useState } from 'react';
import { ListOrdered, X, RefreshCw, Search } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { api } from '@/services/api';
import StatusBadge from '@/components/StatusBadge';
import { formatCurrency, formatNumber, formatPrice, formatDateTime } from '@/utils/format';

export default function Orders() {
  const { orders, loadOrders, updateOrder } = useStore();
  const [sideFilter, setSideFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('active');
  const [search, setSearch] = useState('');
  const [canceling, setCanceling] = useState<string | null>(null);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const filtered = orders.filter((o) => {
    const matchSearch = o.symbol.toLowerCase().includes(search.toLowerCase());
    const matchSide = sideFilter === 'all' || o.side === sideFilter;
    let matchStatus = true;
    if (statusFilter === 'active') {
      matchStatus = o.status === 'NEW' || o.status === 'PARTIALLY_FILLED';
    } else if (statusFilter === 'filled') {
      matchStatus = o.status === 'FILLED';
    } else if (statusFilter === 'canceled') {
      matchStatus = o.status === 'CANCELED';
    }
    return matchSearch && matchSide && matchStatus;
  });

  const activeCount = orders.filter(
    (o) => o.status === 'NEW' || o.status === 'PARTIALLY_FILLED'
  ).length;

  const handleCancel = async (id: string) => {
    setCanceling(id);
    const res = await api.orders.cancel(id);
    if (res.success) {
      const order = orders.find((o) => o.orderId === id);
      if (order) {
        updateOrder({ ...order, status: 'CANCELED' });
      }
    }
    setCanceling(null);
  };

  const handleCancelAll = async () => {
    if (!confirm('确定要撤销所有挂单吗？')) return;
    setCanceling('all');
    await api.orders.cancelAll();
    updateOrder({ allCanceled: true });
    await loadOrders();
    setCanceling(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">挂单管理</h1>
          <p className="text-text-secondary mt-1 text-sm">
            管理您的所有订单，当前 <span className="text-accent-yellow font-medium">{activeCount}</span> 个挂单中
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadOrders}
            className="btn-secondary flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            刷新
          </button>
          {activeCount > 0 && (
            <button
              onClick={handleCancelAll}
              disabled={canceling === 'all'}
              className="btn-danger flex items-center gap-2"
            >
              <X className="w-4 h-4" />
              撤销全部
            </button>
          )}
        </div>
      </div>

      <div className="card">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
            <input
              type="text"
              placeholder="搜索交易对..."
              className="input-field pl-10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            {[
              { value: 'active', label: '挂单中' },
              { value: 'filled', label: '已成交' },
              { value: 'canceled', label: '已撤销' },
              { value: 'all', label: '全部' },
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
          <div className="flex gap-2">
            {[
              { value: 'all', label: '全部' },
              { value: 'BUY', label: '买入' },
              { value: 'SELL', label: '卖出' },
            ].map((f) => (
              <button
                key={f.value}
                onClick={() => setSideFilter(f.value)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  sideFilter === f.value
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
            <ListOrdered className="w-16 h-16 mx-auto mb-4 text-text-tertiary opacity-50" />
            <p className="text-text-secondary text-lg">暂无订单</p>
            <p className="text-text-tertiary text-sm mt-1">
              启动策略后将自动生成挂单
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="table-header text-left pb-4">交易对</th>
                  <th className="table-header text-left pb-4">方向</th>
                  <th className="table-header text-right pb-4">价格</th>
                  <th className="table-header text-right pb-4">数量</th>
                  <th className="table-header text-right pb-4">成交额</th>
                  <th className="table-header text-left pb-4">状态</th>
                  <th className="table-header text-left pb-4">时间</th>
                  <th className="table-header text-right pb-4">操作</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((order) => {
                  const isActive = order.status === 'NEW' || order.status === 'PARTIALLY_FILLED';
                  return (
                    <tr key={order.orderId} className="border-b border-border/50 hover:bg-bg-tertiary/30 transition-colors">
                      <td className="table-cell font-medium">{order.symbol}</td>
                      <td className="table-cell">
                        <span className={`font-medium ${
                          order.side === 'BUY' ? 'text-accent-green' : 'text-accent-red'
                        }`}>
                          {order.side === 'BUY' ? '买入' : '卖出'}
                        </span>
                      </td>
                      <td className="table-cell text-right font-mono">
                        {formatPrice(order.price)}
                      </td>
                      <td className="table-cell text-right font-mono">
                        {formatNumber(order.amount, 6)}
                      </td>
                      <td className="table-cell text-right font-mono">
                        {formatCurrency(order.price * order.amount)}
                      </td>
                      <td className="table-cell">
                        <StatusBadge status={order.status} />
                      </td>
                      <td className="table-cell text-text-secondary text-xs">
                        {formatDateTime(order.createdAt)}
                      </td>
                      <td className="table-cell text-right">
                        {isActive && (
                          <button
                            onClick={() => handleCancel(order.orderId)}
                            disabled={canceling === order.orderId}
                            className="p-1.5 rounded-lg text-text-secondary hover:text-accent-red hover:bg-accent-red/10 transition-colors disabled:opacity-50"
                            title="撤销订单"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
