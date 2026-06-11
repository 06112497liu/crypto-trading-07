import { create } from 'zustand';
import type {
  GridStrategy,
  Order,
  Position,
  Balance,
  TickerData,
} from '../../shared/types';
import { api } from '@/services/api';

interface TradingStore {
  strategies: GridStrategy[];
  orders: Order[];
  positions: Position[];
  balances: Balance[];
  tickers: Map<string, TickerData>;
  config: {
    testnet: boolean;
    hasApiKey: boolean;
    hasApiSecret: boolean;
  };
  loading: boolean;
  error: string | null;

  loadAll: () => Promise<void>;
  loadStrategies: () => Promise<void>;
  loadOrders: () => Promise<void>;
  loadPositions: () => Promise<void>;
  loadBalances: () => Promise<void>;
  loadConfig: () => Promise<void>;

  addStrategy: (s: GridStrategy) => void;
  updateStrategy: (s: GridStrategy | { id: string; deleted: boolean }) => void;
  updateOrder: (o: Order | { allCanceled: boolean }) => void;
  updatePosition: (p: Position) => void;
  setTicker: (t: TickerData) => void;
  setError: (e: string | null) => void;
}

export const useStore = create<TradingStore>((set, get) => ({
  strategies: [],
  orders: [],
  positions: [],
  balances: [],
  tickers: new Map(),
  config: {
    testnet: true,
    hasApiKey: false,
    hasApiSecret: false,
  },
  loading: false,
  error: null,

  loadAll: async () => {
    set({ loading: true });
    try {
      await Promise.all([
        get().loadStrategies(),
        get().loadOrders(),
        get().loadPositions(),
        get().loadBalances(),
        get().loadConfig(),
      ]);
    } catch (e) {
      set({ error: (e as Error).message });
    } finally {
      set({ loading: false });
    }
  },

  loadStrategies: async () => {
    const res = await api.strategies.list();
    if (res.success && res.data) {
      set({ strategies: res.data });
    }
  },

  loadOrders: async () => {
    const res = await api.orders.list();
    if (res.success && res.data) {
      set({ orders: res.data });
    }
  },

  loadPositions: async () => {
    const res = await api.account.positions();
    if (res.success && res.data) {
      set({ positions: res.data });
    }
  },

  loadBalances: async () => {
    const res = await api.account.balances();
    if (res.success && res.data) {
      set({ balances: res.data });
    }
  },

  loadConfig: async () => {
    const res = await api.config.get();
    if (res.success && res.data) {
      set({ config: res.data });
    }
  },

  addStrategy: (s) => {
    set((state) => ({ strategies: [s, ...state.strategies] }));
  },

  updateStrategy: (s) => {
    if ('deleted' in s) {
      set((state) => ({
        strategies: state.strategies.filter((x) => x.id !== s.id),
      }));
      return;
    }
    set((state) => {
      const idx = state.strategies.findIndex((x) => x.id === s.id);
      if (idx >= 0) {
        const updated = [...state.strategies];
        updated[idx] = s;
        return { strategies: updated };
      }
      return { strategies: [s, ...state.strategies] };
    });
  },

  updateOrder: (o) => {
    if ('allCanceled' in o) {
      set((state) => ({
        orders: state.orders.map((x) =>
          x.status === 'NEW' || x.status === 'PARTIALLY_FILLED'
            ? { ...x, status: 'CANCELED' }
            : x
        ),
      }));
      return;
    }
    set((state) => {
      const idx = state.orders.findIndex((x) => x.orderId === o.orderId);
      if (idx >= 0) {
        const updated = [...state.orders];
        updated[idx] = o;
        return { orders: updated };
      }
      return { orders: [o, ...state.orders] };
    });
  },

  updatePosition: (p) => {
    set((state) => {
      const idx = state.positions.findIndex((x) => x.symbol === p.symbol);
      if (idx >= 0) {
        const updated = [...state.positions];
        updated[idx] = p;
        return { positions: updated };
      }
      return { positions: [...state.positions, p] };
    });
  },

  setTicker: (t) => {
    set((state) => {
      const tickers = new Map(state.tickers);
      tickers.set(t.symbol, t);
      return { tickers };
    });
  },

  setError: (e) => set({ error: e }),
}));
