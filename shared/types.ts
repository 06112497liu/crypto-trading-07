export interface GridLevel {
  index: number;
  price: number;
  buyOrderId?: string;
  sellOrderId?: string;
  buyFilled: boolean;
  sellFilled: boolean;
  amount: number;
}

export interface GridStrategy {
  id: string;
  name: string;
  symbol: string;
  lowerPrice: number;
  upperPrice: number;
  gridNum: number;
  investment: number;
  status: 'running' | 'stopped' | 'error';
  createdAt: number;
  profit: number;
  grids: GridLevel[];
  currentPrice?: number;
  filledOrders: number;
}

export interface Position {
  symbol: string;
  amount: number;
  avgPrice: number;
  currentPrice: number;
  unrealizedPnl: number;
  unrealizedPnlPercent: number;
  marketValue: number;
}

export interface Order {
  orderId: string;
  strategyId: string;
  symbol: string;
  side: 'BUY' | 'SELL';
  price: number;
  amount: number;
  filledAmount?: number;
  status: 'NEW' | 'PARTIALLY_FILLED' | 'FILLED' | 'CANCELED';
  type: 'LIMIT';
  createdAt: number;
  filledAt?: number;
}

export interface ApiConfig {
  apiKey: string;
  apiSecret: string;
  testnet: boolean;
  forceMock?: boolean;
}

export interface Balance {
  asset: string;
  free: number;
  locked: number;
  total: number;
  usdtValue?: number;
}

export interface CreateStrategyRequest {
  name: string;
  symbol: string;
  lowerPrice: number;
  upperPrice: number;
  gridNum: number;
  investment: number;
  autoStart?: boolean;
}

export interface TickerData {
  symbol: string;
  price: number;
  change?: number;
  changePercent?: number;
  high?: number;
  low?: number;
  volume?: number;
}

export type WsMessageType = 'ticker' | 'orderUpdate' | 'strategyUpdate' | 'positionUpdate' | 'pong';

export interface WsMessage {
  type: WsMessageType;
  data: unknown;
  timestamp: number;
}
