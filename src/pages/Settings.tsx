import { useState, useEffect } from 'react';
import { Settings, Key, Shield, Check, AlertCircle, Loader2, Eye, EyeOff } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { api } from '@/services/api';

export default function SettingsPage() {
  const { config, loadConfig, loadAll } = useStore();
  const [form, setForm] = useState({
    apiKey: '',
    apiSecret: '',
    testnet: true,
  });
  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showSecret, setShowSecret] = useState(false);

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  const handleTest = async () => {
    setTesting(true);
    setMessage(null);
    const res = await api.config.test(form);
    if (res.success) {
      setMessage({ type: 'success', text: res.message || '连接成功！API配置正确' });
      await loadConfig();
      await loadAll();
    } else {
      setMessage({ type: 'error', text: res.message || '连接失败，请检查API密钥' });
    }
    setTesting(false);
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    const res = await api.config.save(form);
    if (res.success) {
      setMessage({ type: 'success', text: '配置已保存' });
      await loadConfig();
      await loadAll();
    } else {
      setMessage({ type: 'error', text: '保存失败' });
    }
    setSaving(false);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">API配置</h1>
        <p className="text-text-secondary mt-1 text-sm">
          配置您的 Binance API 密钥以开始交易
        </p>
      </div>

      <div className="card">
        <div className="flex items-center gap-2 mb-6">
          <Key className="w-5 h-5 text-accent-yellow" />
          <h2 className="text-lg font-semibold text-text-primary">Binance API 密钥</h2>
        </div>

        <div className="space-y-5">
          <div>
            <label className="block text-sm text-text-secondary mb-2">
              网络环境
            </label>
            <div className="flex gap-3">
              <button
                onClick={() => setForm({ ...form, testnet: true })}
                className={`flex-1 p-4 rounded-lg border transition-all ${
                  form.testnet
                    ? 'bg-accent-green/10 border-accent-green/30 text-accent-green'
                    : 'bg-bg-tertiary border-border text-text-secondary hover:text-text-primary'
                }`}
              >
                <p className="font-medium">测试网</p>
                <p className="text-xs mt-1 opacity-70">推荐用于测试和调试</p>
              </button>
              <button
                onClick={() => setForm({ ...form, testnet: false })}
                className={`flex-1 p-4 rounded-lg border transition-all ${
                  !form.testnet
                    ? 'bg-accent-yellow/10 border-accent-yellow/30 text-accent-yellow'
                    : 'bg-bg-tertiary border-border text-text-secondary hover:text-text-primary'
                }`}
              >
                <p className="font-medium">主网</p>
                <p className="text-xs mt-1 opacity-70">真实资金交易</p>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm text-text-secondary mb-2">
              API Key
            </label>
            <input
              type="text"
              className="input-field font-mono"
              placeholder="输入您的 API Key"
              value={form.apiKey}
              onChange={(e) => setForm({ ...form, apiKey: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm text-text-secondary mb-2">
              API Secret
            </label>
            <div className="relative">
              <input
                type={showSecret ? 'text' : 'password'}
                className="input-field font-mono pr-12"
                placeholder="输入您的 API Secret"
                value={form.apiSecret}
                onChange={(e) => setForm({ ...form, apiSecret: e.target.value })}
              />
              <button
                type="button"
                onClick={() => setShowSecret(!showSecret)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-secondary"
              >
                {showSecret ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {config.hasApiKey && (
            <div className="flex items-center gap-2 text-sm text-accent-green bg-accent-green/10 rounded-lg px-4 py-3">
              <Check className="w-4 h-4" />
              <span>
                已检测到 API 配置（密钥未显示以保障安全）
                {config.testnet ? ' · 当前使用测试网' : ' · 当前使用主网'}
              </span>
            </div>
          )}

          {message && (
            <div className={`flex items-center gap-2 text-sm rounded-lg px-4 py-3 ${
              message.type === 'success'
                ? 'text-accent-green bg-accent-green/10'
                : 'text-accent-red bg-accent-red/10'
            }`}>
              {message.type === 'success' ? (
                <Check className="w-4 h-4" />
              ) : (
                <AlertCircle className="w-4 h-4" />
              )}
              <span>{message.text}</span>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              onClick={handleTest}
              disabled={testing || !form.apiKey || !form.apiSecret}
              className="btn-secondary flex-1 flex items-center justify-center gap-2"
            >
              {testing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Shield className="w-4 h-4" />
              )}
              {testing ? '测试中...' : '测试连接'}
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="btn-primary flex-1 flex items-center justify-center gap-2"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Key className="w-4 h-4" />
              )}
              {saving ? '保存中...' : '保存配置'}
            </button>
          </div>
        </div>
      </div>

      <div className="card bg-accent-yellow/5 border-accent-yellow/30">
        <div className="flex items-start gap-3">
          <Shield className="w-5 h-5 text-accent-yellow flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-text-primary font-medium">安全提示</p>
            <ul className="text-sm text-text-secondary mt-2 space-y-1.5">
              <li>• API 密钥仅保存在本地服务器，不会上传至第三方</li>
              <li>• 建议为 API 开启 IP 白名单，限制访问来源</li>
              <li>• 请勿在 API 中启用提币权限，仅需要现货交易权限</li>
              <li>• 推荐使用测试网验证策略后再切换到主网交易</li>
              <li>• 如未配置 API，系统将使用模拟数据进行演示</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
