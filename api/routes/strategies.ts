import express from 'express';
import type { Request, Response } from 'express';
import { store } from '../store/memoryStore';
import {
  createStrategy,
  startStrategy,
  stopStrategy,
  deleteStrategy,
} from '../services/gridEngine';
import type { CreateStrategyRequest } from '../../shared/types';

const router = express.Router();

router.get('/', (req: Request, res: Response) => {
  const strategies = store.getStrategies();
  res.json({ success: true, data: strategies });
});

router.get('/:id', (req: Request, res: Response) => {
  const strategy = store.getStrategy(req.params.id);
  if (!strategy) {
    return res.status(404).json({ success: false, error: '策略不存在' });
  }
  const orders = store.getOrdersByStrategy(strategy.id);
  res.json({ success: true, data: { strategy, orders } });
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const params = req.body as CreateStrategyRequest;
    const strategy = await createStrategy(params);
    res.json({ success: true, data: strategy });
  } catch (e) {
    res.status(400).json({ success: false, error: (e as Error).message });
  }
});

router.post('/:id/start', async (req: Request, res: Response) => {
  try {
    const strategy = await startStrategy(req.params.id);
    res.json({ success: true, data: strategy });
  } catch (e) {
    res.status(400).json({ success: false, error: (e as Error).message });
  }
});

router.post('/:id/stop', async (req: Request, res: Response) => {
  try {
    const strategy = await stopStrategy(req.params.id);
    res.json({ success: true, data: strategy });
  } catch (e) {
    res.status(400).json({ success: false, error: (e as Error).message });
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    await deleteStrategy(req.params.id);
    res.json({ success: true });
  } catch (e) {
    res.status(400).json({ success: false, error: (e as Error).message });
  }
});

export default router;
