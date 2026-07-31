import { useEffect, useState } from 'react';
import { useAppStore } from '@/stores/app.store';
import { useUIStore } from '@/stores/ui.store';
import { aiService } from '@/services/ai.service';
import { reviewService } from '@/services/review.service';
import { journalService } from '@/services/journal.service';
import { Button } from '@/components/ui/Button';

export function AIPage() {
  const { setTitle } = useAppStore();
  const toast = useUIStore(s => s.toast);
  const [apiKey, setApiKey] = useState(aiService.getApiKey());
  const [apiUrl, setApiUrl] = useState(aiService.getApiUrl());
  const [showSettings, setShowSettings] = useState(!aiService.isConfigured());
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [localStats, setLocalStats] = useState({ total: 0, reviewed: 0, avgMastery: 0, needReview: 0, journalCount: 0 });

  useEffect(() => {
    setTitle('AI 分析');
    loadStats();
  }, []);

  const loadStats = async () => {
    const [s, journalEntries] = await Promise.all([
      reviewService.getStats(),
      journalService.getAll(),
    ]);
    setLocalStats({ ...s, journalCount: journalEntries.length });
  };

  const saveSettings = () => {
    aiService.setApiKey(apiKey.trim());
    aiService.setApiUrl(apiUrl.trim() || aiService.getApiUrl());
    toast('设置已保存', 'success');
    setShowSettings(false);
  };

  const runAI = async () => {
    setLoading(true);
    setResult('');
    try {
      // Works without API key - uses local rule engine
      const summary = await aiService.summarize();
      setResult(summary);
    } catch (e) {
      setResult('分析失败: ' + (e instanceof Error ? e.message : ''));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 pb-6">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-white rounded-xl p-3 shadow-sm">
          <div className="text-xl font-bold text-primary-600">{localStats.total}</div>
          <div className="text-xs text-gray-500">总错题</div>
        </div>
        <div className="bg-white rounded-xl p-3 shadow-sm">
          <div className="text-xl font-bold text-green-600">{localStats.avgMastery}%</div>
          <div className="text-xs text-gray-500">掌握度</div>
        </div>
        <div className="bg-white rounded-xl p-3 shadow-sm">
          <div className="text-xl font-bold text-purple-600">{localStats.journalCount}</div>
          <div className="text-xs text-gray-500">日记数</div>
        </div>
        <div className="bg-white rounded-xl p-3 shadow-sm">
          <div className="text-xl font-bold text-orange-500">{localStats.needReview}</div>
          <div className="text-xs text-gray-500">待复习</div>
        </div>
      </div>

      {/* Settings */}
      {showSettings && (
        <div className="bg-white rounded-xl p-4 shadow-sm space-y-3">
          <h3 className="text-sm font-semibold">⚙️ AI 设置</h3>
          <p className="text-xs text-gray-400">需要 OpenAI 兼容的 API Key（支持 DeepSeek、OpenAI 等）</p>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">API 地址</label>
            <input value={apiUrl} onChange={e => setApiUrl(e.target.value)}
              placeholder="https://api.openai.com/v1/chat/completions"
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:border-primary-400" />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">API Key</label>
            <input value={apiKey} onChange={e => setApiKey(e.target.value)} type="password"
              placeholder="sk-..."
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:border-primary-400" />
          </div>
          <Button size="sm" className="w-full" onClick={saveSettings}>保存设置</Button>
        </div>
      )}

      {/* Run AI */}
      <div className="flex gap-2">
        <Button className="flex-1" onClick={runAI} disabled={loading}>
          {loading ? '分析中...' : '🤖 AI 分析'}
        </Button>
        <Button variant="ghost" size="sm" onClick={() => setShowSettings(!showSettings)}>
          ⚙️
        </Button>
      </div>

      {/* Result */}
      {loading && (
        <div className="text-center py-8 text-gray-400">
          <div className="text-3xl mb-2">🤖</div>
          <div className="text-sm">AI 正在分析你的学习数据...</div>
        </div>
      )}

      {result && (
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">📊 AI 分析结果</h3>
          <div className="text-sm whitespace-pre-wrap leading-relaxed">{result}</div>
        </div>
      )}
    </div>
  );
}
