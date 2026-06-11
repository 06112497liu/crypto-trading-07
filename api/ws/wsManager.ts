import type { Server as HttpServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import type { WsMessage } from '../../shared/types';
import { binanceService } from '../services/binanceService';
import { store } from '../store/memoryStore';
import type { GridStrategy } from '../../shared/types';

class WebSocketManager {
  private wss: WebSocketServer | null = null;
  private tickerIntervals: Map<string, NodeJS.Timeout> = new Map();

  attach(server: HttpServer): void {
    this.wss = new WebSocketServer({ server, path: '/ws' });

    this.wss.on('connection', (ws) => {
      console.log('Client connected');

      ws.on('message', async (data) => {
        try {
          const msg = JSON.parse(data.toString()) as { type: string; data?: unknown };
          await this.handleMessage(ws, msg);
        } catch (e) {
          console.error('Invalid WS message:', e);
        }
      });

      ws.on('close', () => {
        console.log('Client disconnected');
      });

      this.send(ws, {
        type: 'ticker',
        data: { symbol: 'BTCUSDT', price: 65000 },
        timestamp: Date.now(),
      });
    });

    this.startTickerSimulation();
  }

  private async handleMessage(ws: WebSocket, msg: { type: string; data?: unknown }): Promise<void> {
    switch (msg.type) {
      case 'ping':
        this.send(ws, { type: 'pong', data: null, timestamp: Date.now() });
        break;
      case 'subscribeTicker': {
        const symbol = (msg.data as { symbol?: string })?.symbol || 'BTCUSDT';
        this.subscribeTicker(symbol);
        break;
      }
      default:
        break;
    }
  }

  private subscribeTicker(symbol: string): void {
    if (this.tickerIntervals.has(symbol)) return;

    const interval = setInterval(async () => {
      try {
        const price = await binanceService.getTickerPrice(symbol);
        const tickerData = await binanceService.get24hTicker(symbol);
        this.broadcast({
          type: 'ticker',
          data: { symbol, price, ...tickerData },
          timestamp: Date.now(),
        });

        const strategies = store.getStrategies().filter(
          (s) => s.symbol === symbol && s.status === 'running'
        );
        for (const strategy of strategies) {
          strategy.currentPrice = price;
          store.saveStrategy(strategy);
          this.broadcast({
            type: 'strategyUpdate',
            data: strategy,
            timestamp: Date.now(),
          });
        }
      } catch (e) {
        console.error(`Ticker error for ${symbol}:`, e);
      }
    }, 2000);

    this.tickerIntervals.set(symbol, interval);
  }

  private startTickerSimulation(): void {
    const symbols = ['BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'SOLUSDT'];
    symbols.forEach((s) => this.subscribeTicker(s));

    setInterval(() => {
      this.simulateOrderFill();
    }, 10000);
  }

  private simulateOrderFill(): void {
    const strategies = store.getStrategies().filter((s) => s.status === 'running');
    if (strategies.length === 0) return;

    const strategy = strategies[Math.floor(Math.random() * strategies.length)];
    const activeOrders = store
      .getOrdersByStrategy(strategy.id)
      .filter((o) => o.status === 'NEW');

    if (activeOrders.length === 0) return;

    const order = activeOrders[Math.floor(Math.random() * activeOrders.length)];
    order.status = 'FILLED';
    order.filledAt = Date.now();
    order.filledAmount = order.amount;
    store.saveOrder(order);

    strategy.filledOrders++;
    const profitPerGrid = (strategy.upperPrice - strategy.lowerPrice) / strategy.gridNum * order.amount * 0.005;
    strategy.profit += order.side === 'SELL' ? profitPerGrid : 0;
    store.saveStrategy(strategy);

    this.broadcast({
      type: 'orderUpdate',
      data: order,
      timestamp: Date.now(),
    });

    this.broadcast({
      type: 'strategyUpdate',
      data: strategy,
      timestamp: Date.now(),
    });

    this.updatePositionsFromStrategy(strategy);
  }

  private updatePositionsFromStrategy(strategy: GridStrategy): void {
    const baseAsset = strategy.symbol.replace('USDT', '');
    let amount = 0;
    let totalCost = 0;

    for (const grid of strategy.grids) {
      if (grid.buyFilled && !grid.sellFilled) {
        amount += grid.amount;
        totalCost += grid.amount * grid.price;
      }
    }

    if (amount > 0) {
      const position = store.getPosition(strategy.symbol) || {
        symbol: strategy.symbol,
        amount: 0,
        avgPrice: 0,
        currentPrice: strategy.currentPrice || 0,
        unrealizedPnl: 0,
        unrealizedPnlPercent: 0,
        marketValue: 0,
      };

      position.amount = amount;
      position.avgPrice = totalCost / amount;
      position.currentPrice = strategy.currentPrice || position.currentPrice;
      position.marketValue = position.amount * position.currentPrice;
      position.unrealizedPnl = position.marketValue - totalCost;
      position.unrealizedPnlPercent = (position.unrealizedPnl / totalCost) * 100;
      store.savePosition(position);

      this.broadcast({
        type: 'positionUpdate',
        data: position,
        timestamp: Date.now(),
      });
    }
  }

  private send(ws: WebSocket, message: WsMessage): void {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }

  broadcast(message: WsMessage): void {
    if (!this.wss) return;
    this.wss.clients.forEach((client) => {
      this.send(client, message);
    });
  }

  close(): void {
    this.tickerIntervals.forEach((interval) => clearInterval(interval));
    this.tickerIntervals.clear();
    if (this.wss) {
      this.wss.close();
    }
  }
}

export const wsManager = new WebSocketManager();
