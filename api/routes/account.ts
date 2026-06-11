import express from 'express';
import type { Request, Response } from 'express';
import { binanceService } from '../services/binanceService';
import { store } from '../store/memoryStore';

const router = express.Router();

router.get('/balances', async (req: Request, res: Response) => {
  try {
    const balances = await binanceService.getBalances();
    store.saveBalances(balances);
    res.json({ success: true, data: balances });
  } catch (e) {
    res.status(500).json({ success: false, error: (e as Error).message });
  }
});

router.get('/positions', (req: Request, res: Response) => {
  const positions = store.getPositions();
  res.json({ success: true, data: positions });
});

router.get('/ticker/:symbol', async (req: Request, res: Response) => {
  try {
    const ticker = await binanceService.get24hTicker(req.params.symbol);
    res.json({ success: true, data: ticker });
  } catch (e) {
    res.status(500).json({ success: false, error: (e as Error).message });
  }
});

export default router;
