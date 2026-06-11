import crypto from 'crypto';
import type { ApiConfig, Balance, Order } from '../../shared/types';

const MAINNET_BASE = 'https://api.binance.com';
const TESTNET_BASE = 'https://testnet.binance.vision';

export class BinanceService {
  private config: ApiConfig = { apiKey: '', apiSecret: '', testnet: true };
  private useMock = true;
  private forceMock = false;
  private connectionError: string | null = null;

  setConfig(config: ApiConfig): void {
    this.config = config;
    this.useMock = !config.apiKey || !config.apiSecret;
    this.forceMock = false;
    this.connectionError = null;
  }

  setForceMock(force: boolean, reason?: string): void {
    this.forceMock = force;
    if (force && reason) {
      this.connectionError = reason;
    } else if (!force) {
      this.connectionError = null;
    }
  }

  getConnectionError(): string | null {
    return this.connectionError;
  }

  isMock(): boolean {
    return this.useMock || this.forceMock;
  }

  isForceMock(): boolean {
    return this.forceMock;
  }

  private getBaseUrl(): string {
    return this.config.testnet ? TESTNET_BASE : MAINNET_BASE;
  }

  private sign(query: string): string {
    return crypto
      .createHmac('sha256', this.config.apiSecret)
      .update(query)
      .digest('hex');
  }

  private async request<T>(
    method: 'GET' | 'POST' | 'DELETE',
    path: string,
    params: Record<string, unknown> = {},
    signed = false
  ): Promise<T> {
    if (this.isMock()) {
      return this.mockRequest<T>(method, path, params);
    }

    try {
      const url = new URL(this.getBaseUrl() + path);
      const timestamp = Date.now();
      const allParams = signed ? { ...params, timestamp } : params;
      const query = new URLSearchParams(
        Object.entries(allParams).map(([k, v]) => [k, String(v)])
      ).toString();

      if (signed) {
        const signature = this.sign(query);
        url.search = `${query}&signature=${signature}`;
      } else if (query) {
        url.search = query;
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(url.toString(), {
        method,
        headers: {
          'X-MBX-APIKEY': this.config.apiKey,
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Binance API error: ${response.status} ${error}`);
      }

      return (await response.json()) as T;
    } catch (e) {
      if (e instanceof Error && e.name === 'AbortError') {
        throw new Error('连接 Binance API 超时，请检查网络连接或使用模拟模式');
      }
      if (e instanceof Error && e.message.includes('fetch failed')) {
        throw new Error('无法连接到 Binance API，请检查网络连接、防火墙设置或使用模拟模式');
      }
      throw e;
    }
  }

  private mockRequest<T>(
    method: 'GET' | 'POST' | 'DELETE',
    path: string,
    params: Record<string, unknown>
  ): Promise<T> {
    return Promise.resolve({} as T);
  }

  async testConnection(): Promise<{ success: boolean; message?: string; balances?: Balance[] }> {
    try {
      if (this.useMock) {
        return { success: true, message: 'Mock mode - API未配置' };
      }
      const accountData = await this.request<{ balances: Array<{ asset: string; free: string; locked: string }> }>(
        'GET',
        '/api/v3/account',
        {},
        true
      );
      const balances: Balance[] = [];
      for (const b of accountData.balances) {
        const free = parseFloat(b.free);
        const locked = parseFloat(b.locked);
        const total = free + locked;
        if (total <= 0) continue;

        let usdtValue = total;
        if (b.asset !== 'USDT') {
          try {
            const price = await this.getTickerPrice(`${b.asset}USDT`);
            usdtValue = total * price;
          } catch {
            usdtValue = 0;
          }
        }

        balances.push({
          asset: b.asset,
          free,
          locked,
          total,
          usdtValue,
        });
      }
      return { success: true, balances: balances.sort((a, b) => (b.usdtValue || 0) - (a.usdtValue || 0)) };
    } catch (e) {
      return { success: false, message: (e as Error).message };
    }
  }

  async getBalances(): Promise<Balance[]> {
    if (this.useMock) {
      return [
        { asset: 'USDT', free: 10000, locked: 0, total: 10000, usdtValue: 10000 },
        { asset: 'BTC', free: 0.5, locked: 0, total: 0.5, usdtValue: 32500 },
        { asset: 'ETH', free: 5, locked: 0, total: 5, usdtValue: 15000 },
      ];
    }

    const data = await this.request<{ balances: Array<{ asset: string; free: string; locked: string }> }>(
      'GET',
      '/api/v3/account',
      {},
      true
    );

    const balances: Balance[] = [];
    for (const b of data.balances) {
      const free = parseFloat(b.free);
      const locked = parseFloat(b.locked);
      const total = free + locked;
      if (total <= 0) continue;

      let usdtValue = total;
      if (b.asset !== 'USDT') {
        try {
          const price = await this.getTickerPrice(`${b.asset}USDT`);
          usdtValue = total * price;
        } catch {
          usdtValue = 0;
        }
      }

      balances.push({
        asset: b.asset,
        free,
        locked,
        total,
        usdtValue,
      });
    }

    return balances.sort((a, b) => (b.usdtValue || 0) - (a.usdtValue || 0));
  }

  async getTickerPrice(symbol: string): Promise<number> {
    if (this.useMock) {
      const mockPrices: Record<string, number> = {
        BTCUSDT: 65000,
        ETHUSDT: 3000,
        BNBUSDT: 600,
        SOLUSDT: 150,
        DOGEUSDT: 0.15,
        ADAUSDT: 0.45,
        XRPUSDT: 0.6,
      };
      return mockPrices[symbol] || 100;
    }

    const data = await this.request<{ price: string }>('GET', '/api/v3/ticker/price', { symbol });
    return parseFloat(data.price);
  }

  async get24hTicker(symbol: string): Promise<{
    price: number;
    change: number;
    changePercent: number;
    high: number;
    low: number;
    volume: number;
  }> {
    if (this.useMock) {
      const base = await this.getTickerPrice(symbol);
      return {
        price: base,
        change: base * 0.023,
        changePercent: 2.3,
        high: base * 1.05,
        low: base * 0.95,
        volume: 1000000,
      };
    }

    const data = await this.request<{
      lastPrice: string;
      priceChange: string;
      priceChangePercent: string;
      highPrice: string;
      lowPrice: string;
      volume: string;
    }>('GET', '/api/v3/ticker/24hr', { symbol });

    return {
      price: parseFloat(data.lastPrice),
      change: parseFloat(data.priceChange),
      changePercent: parseFloat(data.priceChangePercent),
      high: parseFloat(data.highPrice),
      low: parseFloat(data.lowPrice),
      volume: parseFloat(data.volume),
    };
  }

  async placeOrder(params: {
    symbol: string;
    side: 'BUY' | 'SELL';
    type: 'LIMIT';
    price: number;
    quantity: number;
    timeInForce?: 'GTC';
  }): Promise<{ orderId: string; status: string }> {
    if (this.useMock) {
      return {
        orderId: 'mock_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8),
        status: 'NEW',
      };
    }

    return this.request('POST', '/api/v3/order', {
      symbol: params.symbol,
      side: params.side,
      type: params.type,
      price: params.price,
      quantity: params.quantity,
      timeInForce: params.timeInForce || 'GTC',
    }, true);
  }

  async cancelOrder(symbol: string, orderId: string): Promise<{ success: boolean }> {
    if (this.useMock) {
      return { success: true };
    }

    await this.request('DELETE', '/api/v3/order', { symbol, orderId }, true);
    return { success: true };
  }

  async cancelAllOrders(symbol: string): Promise<{ success: boolean }> {
    if (this.useMock) {
      return { success: true };
    }

    await this.request('DELETE', '/api/v3/openOrders', { symbol }, true);
    return { success: true };
  }

  async getOpenOrders(symbol?: string): Promise<Order[]> {
    if (this.useMock) {
      return [];
    }

    const params = symbol ? { symbol } : {};
    const data = await this.request<Array<{
      orderId: number | string;
      symbol: string;
      side: 'BUY' | 'SELL';
      type: string;
      price: string;
      origQty: string;
      executedQty: string;
      status: string;
      time: number;
    }>>('GET', '/api/v3/openOrders', params, true);

    return data.map((o) => ({
      orderId: String(o.orderId),
      strategyId: '',
      symbol: o.symbol,
      side: o.side,
      price: parseFloat(o.price),
      amount: parseFloat(o.origQty),
      filledAmount: parseFloat(o.executedQty),
      status: o.status as Order['status'],
      type: o.type === 'LIMIT' ? 'LIMIT' : 'LIMIT',
      createdAt: o.time,
    }));
  }

  async getExchangeInfo(symbol: string): Promise<{
    minQty: number;
    maxQty: number;
    stepSize: number;
    minPrice: number;
    maxPrice: number;
    tickSize: number;
  }> {
    if (this.useMock) {
      return {
        minQty: 0.00001,
        maxQty: 10000,
        stepSize: 0.00001,
        minPrice: 0.0001,
        maxPrice: 1000000,
        tickSize: 0.01,
      };
    }

    const data = await this.request<{ symbols: Array<{ symbol: string; filters: Array<{ filterType: string; [key: string]: unknown }> }> }>(
      'GET',
      '/api/v3/exchangeInfo',
      { symbol }
    );

    const sym = data.symbols[0];
    const lotSize = sym.filters.find((f) => f.filterType === 'LOT_SIZE');
    const priceFilter = sym.filters.find((f) => f.filterType === 'PRICE_FILTER');

    return {
      minQty: parseFloat((lotSize?.minQty as string) || '0.00001'),
      maxQty: parseFloat((lotSize?.maxQty as string) || '10000'),
      stepSize: parseFloat((lotSize?.stepSize as string) || '0.00001'),
      minPrice: parseFloat((priceFilter?.minPrice as string) || '0.0001'),
      maxPrice: parseFloat((priceFilter?.maxPrice as string) || '1000000'),
      tickSize: parseFloat((priceFilter?.tickSize as string) || '0.01'),
    };
  }
}

export const binanceService = new BinanceService();
