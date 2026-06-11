import express from 'express';
import type { Request, Response } from 'express';
import { store } from '../store/memoryStore';
import { binanceService } from '../services/binanceService';
import type { ApiConfig } from '../../shared/types';

const router = express.Router();

router.get('/', (req: Request, res: Response) => {
  const config = store.getApiConfig();
  res.json({
    success: true,
    data: {
      testnet: config.testnet,
      hasApiKey: !!config.apiKey,
      hasApiSecret: !!config.apiSecret,
    },
  });
});

router.post('/', (req: Request, res: Response) => {
  const { apiKey, apiSecret, testnet } = req.body as ApiConfig;

  const config: ApiConfig = {
    apiKey: apiKey || '',
    apiSecret: apiSecret || '',
    testnet: testnet !== undefined ? testnet : true,
  };

  store.saveApiConfig(config);
  binanceService.setConfig(config);

  res.json({
    success: true,
    data: {
      testnet: config.testnet,
      hasApiKey: !!config.apiKey,
      hasApiSecret: !!config.apiSecret,
    },
  });
});

router.post('/test', async (req: Request, res: Response) => {
  const { apiKey, apiSecret, testnet } = req.body as ApiConfig;

  const config: ApiConfig = {
    apiKey: apiKey || '',
    apiSecret: apiSecret || '',
    testnet: testnet !== undefined ? testnet : true,
  };

  binanceService.setConfig(config);
  const result = await binanceService.testConnection();

  if (result.success) {
    store.saveApiConfig(config);
    try {
      const balances = await binanceService.getBalances();
      res.json({
        success: true,
        message: result.message || '连接成功',
        balances,
      });
    } catch (e) {
      res.json({
        success: true,
        message: '连接成功，但获取余额失败',
      });
    }
  } else {
    res.status(400).json({
      success: false,
      message: result.message || '连接失败',
    });
  }
});

export default router;
