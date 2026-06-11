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
  try {
    const response = await fetch(path, {
      headers: {
        'Content-Type': 'application/json',
      },
      ...options,
    });

    const data = await response.json() as ApiResponse<T>;
    return data;
  } catch (e) {
    if (e instanceof Error && e.message.includes('Failed to fetch')) {
      return {
        success: false,
        message: '网络连接失败，请检查后端服务是否正常运行',
      };
    }
    return {
      success: false,
      message: (e as Error).message || '请求失败',
    };
  }
}

export const api = {
  config: {
    get: () => request<{ 
      testnet: boolean; 
      hasApiKey: boolean; 
      hasApiSecret: boolean;
      isMock: boolean;
      isForceMock: boolean;
      connectionError: string | null;
    }>('/api/config'),
    save: (config: ApiConfig) =>
      request<{ 
        testnet: boolean; 
        hasApiKey: boolean; 
        hasApiSecret: boolean;
        isMock: boolean;
        isForceMock: boolean;
        connectionError: string | null;
      }>('/api/config', {
        method: 'POST',
        body: JSON.stringify(config),
      }),
    test: (config: ApiConfig) =>
      request<{ 
        testnet: boolean; 
        hasApiKey: boolean; 
        hasApiSecret: boolean;
        isMock: boolean;
        isForceMock: boolean;
        connectionError: string | null;
      }>('/api/config/test', {
        method: 'POST',
        body: JSON.stringify(config),
      }),
    forceMock: (forceMock: boolean, reason?: string) =>
      request<{
        isMock: boolean;
        isForceMock: boolean;
        connectionError: string | null;
      }>('/api/config/force-mock', {
        method: 'POST',
        body: JSON.stringify({ forceMock, reason }),
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
