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

  if (!apiKey || !apiSecret) {
    res.status(400).json({
      success: false,
      message: '请填写完整的 API Key 和 API Secret',
    });
    return;
  }

  const config: ApiConfig = {
    apiKey: apiKey || '',
    apiSecret: apiSecret || '',
    testnet: testnet !== undefined ? testnet : true,
  };

  const originalConfig = binanceService['config'];
  binanceService.setConfig(config);

  const result = await binanceService.testConnection();

  if (!result.success) {
    binanceService.setConfig(originalConfig);
    res.status(400).json({
      success: false,
      message: result.message || '连接失败，请检查API密钥',
    });
    return;
  }

  store.saveApiConfig(config);
  const balances = result.balances || [];
  store.saveBalances(balances);

  res.json({
    success: true,
    message: '连接成功，API配置有效',
    data: {
      testnet: config.testnet,
      hasApiKey: !!config.apiKey,
      hasApiSecret: !!config.apiSecret,
    },
    balances,
  });
});

export default router;
