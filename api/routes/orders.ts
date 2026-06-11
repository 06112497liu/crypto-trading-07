import express from 'express';
import type { Request, Response } from 'express';
import { store } from '../store/memoryStore';
import { binanceService } from '../services/binanceService';
import { wsManager } from '../ws/wsManager';

const router = express.Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    if (!binanceService.isMock()) {
      const realOrders = await binanceService.getOpenOrders();
      for (const order of realOrders) {
        const existing = store.getOrder(order.orderId);
        if (!existing) {
          store.saveOrder(order);
        } else {
          store.saveOrder({ ...existing, ...order });
        }
      }
    }
    const orders = store.getOrders();
    res.json({ success: true, data: orders });
  } catch (e) {
    res.status(500).json({ success: false, error: (e as Error).message });
  }
});

router.get('/active', async (req: Request, res: Response) => {
  try {
    if (!binanceService.isMock()) {
      const realOrders = await binanceService.getOpenOrders();
      for (const order of realOrders) {
        const existing = store.getOrder(order.orderId);
        if (!existing) {
          store.saveOrder(order);
        } else {
          store.saveOrder({ ...existing, ...order });
        }
      }
      const knownIds = new Set(realOrders.map(o => o.orderId));
      for (const o of store.getActiveOrders()) {
        if (!knownIds.has(o.orderId)) {
          o.status = 'CANCELED';
          store.saveOrder(o);
        }
      }
    }
    const orders = store.getActiveOrders();
    res.json({ success: true, data: orders });
  } catch (e) {
    res.status(500).json({ success: false, error: (e as Error).message });
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const order = store.getOrder(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, error: '订单不存在' });
    }

    await binanceService.cancelOrder(order.symbol, order.orderId);
    order.status = 'CANCELED';
    store.saveOrder(order);

    wsManager.broadcast({
      type: 'orderUpdate',
      data: order,
      timestamp: Date.now(),
    });

    res.json({ success: true });
  } catch (e) {
    res.status(400).json({ success: false, error: (e as Error).message });
  }
});

router.delete('/', async (req: Request, res: Response) => {
  try {
    const activeOrders = store.getActiveOrders();
    for (const order of activeOrders) {
      try {
        await binanceService.cancelOrder(order.symbol, order.orderId);
        order.status = 'CANCELED';
        store.saveOrder(order);
      } catch (e) {
        console.error(`Failed to cancel order ${order.orderId}:`, e);
      }
    }

    wsManager.broadcast({
      type: 'orderUpdate',
      data: { allCanceled: true },
      timestamp: Date.now(),
    });

    res.json({ success: true, canceledCount: activeOrders.length });
  } catch (e) {
    res.status(400).json({ success: false, error: (e as Error).message });
  }
});

export default router;
