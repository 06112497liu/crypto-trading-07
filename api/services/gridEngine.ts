import type { GridStrategy, GridLevel, Order } from '../../shared/types';
import { binanceService } from './binanceService';
import { store } from '../store/memoryStore';
import { wsManager } from '../ws/wsManager';

function generateId(): string {
  return 'strat_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
}

function calculateGrids(
  lowerPrice: number,
  upperPrice: number,
  gridNum: number,
  investment: number
): GridLevel[] {
  const grids: GridLevel[] = [];
  const priceRange = upperPrice - lowerPrice;
  const gridSize = priceRange / gridNum;
  const perGridInvestment = investment / gridNum;

  for (let i = 0; i <= gridNum; i++) {
    const price = lowerPrice + i * gridSize;
    grids.push({
      index: i,
      price: roundTo(price, 6),
      buyFilled: false,
      sellFilled: false,
      amount: roundTo(perGridInvestment / price, 6),
    });
  }
  return grids;
}

function roundTo(value: number, decimals: number): number {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}

function floorToStep(value: number, stepSize: number): number {
  if (!stepSize || stepSize <= 0) return value;
  const decimals = Math.max(0, Math.ceil(-Math.log10(stepSize)));
  const factor = Math.pow(10, decimals);
  return Math.floor((value + stepSize * 1e-10) * factor) / factor;
}

function floorToTick(value: number, tickSize: number): number {
  if (!tickSize || tickSize <= 0) return value;
  const decimals = Math.max(0, Math.ceil(-Math.log10(tickSize)));
  const factor = Math.pow(10, decimals);
  return Math.floor((value + tickSize * 1e-10) * factor) / factor;
}

export async function createStrategy(params: {
  name: string;
  symbol: string;
  lowerPrice: number;
  upperPrice: number;
  gridNum: number;
  investment: number;
  autoStart?: boolean;
}): Promise<GridStrategy> {
  const currentPrice = await binanceService.getTickerPrice(params.symbol);

  if (params.lowerPrice >= params.upperPrice) {
    throw new Error('价格下限必须小于价格上限');
  }
  if (currentPrice <= params.lowerPrice || currentPrice >= params.upperPrice) {
    throw new Error(
      `当前价格 ${currentPrice} 必须在价格区间 [${params.lowerPrice}, ${params.upperPrice}] 内`
    );
  }
  if (params.gridNum < 2 || params.gridNum > 200) {
    throw new Error('网格数量必须在 2-200 之间');
  }
  if (params.investment <= 0) {
    throw new Error('投入金额必须大于0');
  }

  const strategy: GridStrategy = {
    id: generateId(),
    name: params.name,
    symbol: params.symbol,
    lowerPrice: params.lowerPrice,
    upperPrice: params.upperPrice,
    gridNum: params.gridNum,
    investment: params.investment,
    status: 'stopped',
    createdAt: Date.now(),
    profit: 0,
    grids: calculateGrids(params.lowerPrice, params.upperPrice, params.gridNum, params.investment),
    currentPrice,
    filledOrders: 0,
  };

  store.saveStrategy(strategy);

  if (params.autoStart) {
    await startStrategy(strategy.id);
  }

  wsManager.broadcast({
    type: 'strategyUpdate',
    data: store.getStrategy(strategy.id),
    timestamp: Date.now(),
  });

  return strategy;
}

export async function startStrategy(strategyId: string): Promise<GridStrategy> {
  const strategy = store.getStrategy(strategyId);
  if (!strategy) {
    throw new Error('策略不存在');
  }
  if (strategy.status === 'running') {
    return strategy;
  }

  const currentPrice = await binanceService.getTickerPrice(strategy.symbol);
  strategy.currentPrice = currentPrice;

  const exchangeInfo = await binanceService.getExchangeInfo(strategy.symbol);

  for (let i = 0; i < strategy.grids.length; i++) {
    const grid = strategy.grids[i];
    const orderPrice = floorToTick(grid.price, exchangeInfo.tickSize);
    const orderQty = floorToStep(grid.amount, exchangeInfo.stepSize);
    if (orderPrice <= 0 || orderQty <= 0) continue;

    if (grid.price < currentPrice && !grid.buyFilled) {
      try {
        const result = await binanceService.placeOrder({
          symbol: strategy.symbol,
          side: 'BUY',
          type: 'LIMIT',
          price: orderPrice,
          quantity: orderQty,
        });
        grid.buyOrderId = result.orderId;
        const order: Order = {
          orderId: result.orderId,
          strategyId: strategy.id,
          symbol: strategy.symbol,
          side: 'BUY',
          price: orderPrice,
          amount: orderQty,
          status: 'NEW',
          type: 'LIMIT',
          createdAt: Date.now(),
        };
        store.saveOrder(order);
      } catch (e) {
        console.error(`Failed to place buy order at ${orderPrice}:`, (e as Error).message);
      }
    }

    if (grid.price > currentPrice && !grid.sellFilled) {
      try {
        const result = await binanceService.placeOrder({
          symbol: strategy.symbol,
          side: 'SELL',
          type: 'LIMIT',
          price: orderPrice,
          quantity: orderQty,
        });
        grid.sellOrderId = result.orderId;
        const order: Order = {
          orderId: result.orderId,
          strategyId: strategy.id,
          symbol: strategy.symbol,
          side: 'SELL',
          price: orderPrice,
          amount: orderQty,
          status: 'NEW',
          type: 'LIMIT',
          createdAt: Date.now(),
        };
        store.saveOrder(order);
      } catch (e) {
        console.error(`Failed to place sell order at ${orderPrice}:`, (e as Error).message);
      }
    }
  }

  strategy.status = 'running';
  store.saveStrategy(strategy);

  wsManager.broadcast({
    type: 'strategyUpdate',
    data: strategy,
    timestamp: Date.now(),
  });

  return strategy;
}

export async function stopStrategy(strategyId: string): Promise<GridStrategy> {
  const strategy = store.getStrategy(strategyId);
  if (!strategy) {
    throw new Error('策略不存在');
  }

  for (const grid of strategy.grids) {
    if (grid.buyOrderId && !grid.buyFilled) {
      try {
        await binanceService.cancelOrder(strategy.symbol, grid.buyOrderId);
        const order = store.getOrder(grid.buyOrderId);
        if (order) {
          order.status = 'CANCELED';
          store.saveOrder(order);
        }
      } catch (e) {
        console.error(`Failed to cancel buy order ${grid.buyOrderId}:`, e);
      }
      grid.buyOrderId = undefined;
    }
    if (grid.sellOrderId && !grid.sellFilled) {
      try {
        await binanceService.cancelOrder(strategy.symbol, grid.sellOrderId);
        const order = store.getOrder(grid.sellOrderId);
        if (order) {
          order.status = 'CANCELED';
          store.saveOrder(order);
        }
      } catch (e) {
        console.error(`Failed to cancel sell order ${grid.sellOrderId}:`, e);
      }
      grid.sellOrderId = undefined;
    }
  }

  strategy.status = 'stopped';
  store.saveStrategy(strategy);

  wsManager.broadcast({
    type: 'strategyUpdate',
    data: strategy,
    timestamp: Date.now(),
  });

  return strategy;
}

export async function deleteStrategy(strategyId: string): Promise<boolean> {
  const strategy = store.getStrategy(strategyId);
  if (!strategy) {
    throw new Error('策略不存在');
  }

  if (strategy.status === 'running') {
    await stopStrategy(strategyId);
  }

  store.deleteStrategy(strategyId);

  wsManager.broadcast({
    type: 'strategyUpdate',
    data: { id: strategyId, deleted: true },
    timestamp: Date.now(),
  });

  return true;
}

export async function handleOrderFill(strategyId: string, orderId: string, filledPrice: number): Promise<void> {
  const strategy = store.getStrategy(strategyId);
  if (!strategy) return;

  const order = store.getOrder(orderId);
  if (!order) return;

  order.status = 'FILLED';
  order.filledAt = Date.now();
  store.saveOrder(order);

  const grid = strategy.grids.find((g) => g.price === filledPrice);
  if (!grid) return;

  const exchangeInfo = await binanceService.getExchangeInfo(strategy.symbol);

  if (order.side === 'BUY') {
    grid.buyFilled = true;
    strategy.filledOrders++;
    strategy.profit += 0;

    const nextGridIndex = strategy.grids.findIndex((g) => g.index === grid.index + 1);
    if (nextGridIndex >= 0) {
      const nextGrid = strategy.grids[nextGridIndex];
      if (!nextGrid.sellFilled) {
        try {
          const orderPrice = floorToTick(nextGrid.price, exchangeInfo.tickSize);
          const orderQty = floorToStep(nextGrid.amount, exchangeInfo.stepSize);
          if (orderPrice <= 0 || orderQty <= 0) return;

          const result = await binanceService.placeOrder({
            symbol: strategy.symbol,
            side: 'SELL',
            type: 'LIMIT',
            price: orderPrice,
            quantity: orderQty,
          });
          nextGrid.sellOrderId = result.orderId;
          const newOrder: Order = {
            orderId: result.orderId,
            strategyId: strategy.id,
            symbol: strategy.symbol,
            side: 'SELL',
            price: orderPrice,
            amount: orderQty,
            status: 'NEW',
            type: 'LIMIT',
            createdAt: Date.now(),
          };
          store.saveOrder(newOrder);
        } catch (e) {
          console.error('Failed to place replacement sell order:', (e as Error).message);
        }
      }
    }
  } else if (order.side === 'SELL') {
    grid.sellFilled = true;
    strategy.filledOrders++;
    const gridProfit = (grid.price - strategy.lowerPrice) * grid.amount * 0.001;
    strategy.profit += gridProfit;

    const prevGridIndex = strategy.grids.findIndex((g) => g.index === grid.index - 1);
    if (prevGridIndex >= 0) {
      const prevGrid = strategy.grids[prevGridIndex];
      if (!prevGrid.buyFilled) {
        try {
          const orderPrice = floorToTick(prevGrid.price, exchangeInfo.tickSize);
          const orderQty = floorToStep(prevGrid.amount, exchangeInfo.stepSize);
          if (orderPrice <= 0 || orderQty <= 0) return;

          const result = await binanceService.placeOrder({
            symbol: strategy.symbol,
            side: 'BUY',
            type: 'LIMIT',
            price: orderPrice,
            quantity: orderQty,
          });
          prevGrid.buyOrderId = result.orderId;
          const newOrder: Order = {
            orderId: result.orderId,
            strategyId: strategy.id,
            symbol: strategy.symbol,
            side: 'BUY',
            price: orderPrice,
            amount: orderQty,
            status: 'NEW',
            type: 'LIMIT',
            createdAt: Date.now(),
          };
          store.saveOrder(newOrder);
        } catch (e) {
          console.error('Failed to place replacement buy order:', (e as Error).message);
        }
      }
    }
  }

  store.saveStrategy(strategy);

  wsManager.broadcast({
    type: 'orderUpdate',
    data: order,
    timestamp: Date.now(),
  });

  wsManager.broadcast({
    type: 'strategyUpdate',
    data: strategy,
    timestamp: Date.now(),
  });
}

export function getStrategyStats(strategy: GridStrategy): {
  activeBuyOrders: number;
  activeSellOrders: number;
  filledBuyOrders: number;
  filledSellOrders: number;
} {
  let activeBuyOrders = 0;
  let activeSellOrders = 0;
  let filledBuyOrders = 0;
  let filledSellOrders = 0;

  for (const grid of strategy.grids) {
    if (grid.buyOrderId && !grid.buyFilled) activeBuyOrders++;
    if (grid.sellOrderId && !grid.sellFilled) activeSellOrders++;
    if (grid.buyFilled) filledBuyOrders++;
    if (grid.sellFilled) filledSellOrders++;
  }

  return { activeBuyOrders, activeSellOrders, filledBuyOrders, filledSellOrders };
}
