import type { GridStrategy, Order, Position, ApiConfig, Balance } from '../../shared/types';

class MemoryStore {
  private strategies: Map<string, GridStrategy> = new Map();
  private orders: Map<string, Order> = new Map();
  private positions: Map<string, Position> = new Map();
  private balances: Map<string, Balance> = new Map();
  private apiConfig: ApiConfig = {
    apiKey: '',
    apiSecret: '',
    testnet: true,
  };

  getStrategies(): GridStrategy[] {
    return Array.from(this.strategies.values()).sort(
      (a, b) => b.createdAt - a.createdAt
    );
  }

  getStrategy(id: string): GridStrategy | undefined {
    return this.strategies.get(id);
  }

  saveStrategy(strategy: GridStrategy): void {
    this.strategies.set(strategy.id, strategy);
  }

  deleteStrategy(id: string): boolean {
    return this.strategies.delete(id);
  }

  getOrders(): Order[] {
    return Array.from(this.orders.values()).sort(
      (a, b) => b.createdAt - a.createdAt
    );
  }

  getOrdersByStrategy(strategyId: string): Order[] {
    return this.getOrders().filter((o) => o.strategyId === strategyId);
  }

  getActiveOrders(): Order[] {
    return this.getOrders().filter((o) => o.status === 'NEW' || o.status === 'PARTIALLY_FILLED');
  }

  getOrder(id: string): Order | undefined {
    return this.orders.get(id);
  }

  saveOrder(order: Order): void {
    this.orders.set(order.orderId, order);
  }

  deleteOrder(id: string): boolean {
    return this.orders.delete(id);
  }

  getPositions(): Position[] {
    return Array.from(this.positions.values());
  }

  getPosition(symbol: string): Position | undefined {
    return this.positions.get(symbol);
  }

  savePosition(position: Position): void {
    this.positions.set(position.symbol, position);
  }

  getBalances(): Balance[] {
    return Array.from(this.balances.values());
  }

  getBalance(asset: string): Balance | undefined {
    return this.balances.get(asset);
  }

  saveBalance(balance: Balance): void {
    this.balances.set(balance.asset, balance);
  }

  saveBalances(balances: Balance[]): void {
    balances.forEach((b) => this.balances.set(b.asset, b));
  }

  getApiConfig(): ApiConfig {
    return { ...this.apiConfig };
  }

  saveApiConfig(config: ApiConfig): void {
    this.apiConfig = { ...config };
  }
}

export const store = new MemoryStore();
