import type {
  GridStrategy,
  Order,
  Position,
  Balance,
  ApiConfig,
  CreateStrategyRequest,
  TickerData,
} from '../../shared/types';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  balances?: Balance[];
  canceledCount?: number;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
  const response = await fetch(path, {
    headers: {
      'Content-Type': 'application/json',
    },
    ...options,
  });

  const data = await response.json() as ApiResponse<T>;
  return data;
}

export const api = {
  config: {
    get: () => request<{ testnet: boolean; hasApiKey: boolean; hasApiSecret: boolean }>('/api/config'),
    save: (config: ApiConfig) =>
      request<{ testnet: boolean; hasApiKey: boolean; hasApiSecret: boolean }>('/api/config', {
        method: 'POST',
        body: JSON.stringify(config),
      }),
    test: (config: ApiConfig) =>
      request<{ testnet: boolean; hasApiKey: boolean; hasApiSecret: boolean }>('/api/config/test', {
        method: 'POST',
        body: JSON.stringify(config),
      }),
  },

  strategies: {
    list: () => request<GridStrategy[]>('/api/strategies'),
    get: (id: string) => request<{ strategy: GridStrategy; orders: Order[] }>(`/api/strategies/${id}`),
    create: (params: CreateStrategyRequest) =>
      request<GridStrategy>('/api/strategies', {
        method: 'POST',
        body: JSON.stringify(params),
      }),
    start: (id: string) =>
      request<GridStrategy>(`/api/strategies/${id}/start`, { method: 'POST' }),
    stop: (id: string) =>
      request<GridStrategy>(`/api/strategies/${id}/stop`, { method: 'POST' }),
    remove: (id: string) => request<unknown>(`/api/strategies/${id}`, { method: 'DELETE' }),
  },

  account: {
    balances: () => request<Balance[]>('/api/account/balances'),
    positions: () => request<Position[]>('/api/account/positions'),
    ticker: (symbol: string) => request<TickerData>(`/api/account/ticker/${symbol}`),
  },

  orders: {
    list: () => request<Order[]>('/api/orders'),
    active: () => request<Order[]>('/api/orders/active'),
    cancel: (id: string) => request<unknown>(`/api/orders/${id}`, { method: 'DELETE' }),
    cancelAll: () => request<unknown>('/api/orders', { method: 'DELETE' }),
  },
};
