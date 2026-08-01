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
  const [apiModel, setApiModel] = useState(aiService.getApiModel());
  const [showSettings, setShowSettings] = useState(false);
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [question, setQuestion] = useState('');
  const [qaResult, setQaResult] = useState('');
  const [asking, setAsking] = useState(false);
  const [localStats, setLocalStats] = useState({ total: 0, reviewed: 0, avgMastery: 0, needReview: 0, journalCount: 0 });

  useEffect(() => {
    setTitle('AI 分析');
    loadStats();
    // 自动执行一次分析
    runAI();
  }, []);

  const loadStats = async () => {
    try {
      const [s, journalEntries] = await Promise.all([
        reviewService.getStats(),
        journalService.getAll(),
      ]);
      setLocalStats({ ...s, journalCount: journalEntries.length });
    } catch {
      // ignore
    }
  };

  const saveSettings = () => {
    aiService.setApiKey(apiKey.trim());
    aiService.setApiUrl(apiUrl.trim() || aiService.getApiUrl());
    aiService.setApiModel(apiModel.trim() || aiService.getApiModel());
    toast('设置已保存', 'success');
    setShowSettings(false);
    runAI();
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

  const askAI = async () => {
    const q = question.trim();
    if (!q || asking) return;
    if (!aiService.isConfigured()) {
      setQaResult('⚠️ 提问需要先配置云端 AI（点右上 ⚙️ 填 API 地址、Key 和模型）。不配置也能使用上方的自动分析。');
      return;
    }
    setAsking(true);
    setQaResult('');
    try {
      const answer = await aiService.ask(q);
      setQaResult(answer);
    } catch (e) {
      setQaResult('提问失败：' + (e instanceof Error ? e.message : String(e)));
    } finally {
      setAsking(false);
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

      {/* Settings (collapsed) */}
      {showSettings && (
        <div className="bg-white rounded-xl p-4 shadow-sm space-y-3">
          <h3 className="text-sm font-semibold">⚙️ AI 云分析设置（可选）</h3>
          <p className="text-xs text-gray-400">
            已内置本地智能分析，无需配置即可使用。
            如需更深入的 AI 分析，可填 OpenAI/DeepSeek 兼容 API。
          </p>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">API 地址</label>
            <input value={apiUrl} onChange={e => setApiUrl(e.target.value)}
              placeholder="https://api.deepseek.com/v1/chat/completions"
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:border-primary-400" />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">API Key</label>
            <input value={apiKey} onChange={e => setApiKey(e.target.value)} type="password"
              placeholder="sk-..."
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:border-primary-400" />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">模型名称</label>
            <input value={apiModel} onChange={e => setApiModel(e.target.value)}
              placeholder="deepseek-chat（OpenAI 用 gpt-4o-mini 等）"
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:border-primary-400" />
          </div>
          <Button size="sm" className="w-full" onClick={saveSettings}>保存并分析</Button>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        <Button className="flex-1" onClick={runAI} disabled={loading}>
          {loading ? '分析中...' : '🔄 重新分析'}
        </Button>
        <Button variant="ghost" size="sm" onClick={() => setShowSettings(!showSettings)}>
          ⚙️
        </Button>
      </div>

      {/* Result */}
      {loading && (
        <div className="text-center py-8 text-gray-400">
          <div className="text-3xl mb-2">🤖</div>
          <div className="text-sm">正在分析你的学习数据...</div>
        </div>
      )}

      {result && !loading && (
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">📊 分析结果</h3>
          <div className="text-sm whitespace-pre-wrap leading-relaxed">{result}</div>
        </div>
      )}

      {/* AI 提问 */}
      <div className="bg-white rounded-xl p-4 shadow-sm space-y-3">
        <h3 className="text-sm font-semibold text-gray-700">💬 向 AI 提问</h3>
        <textarea
          value={question}
          onChange={e => setQuestion(e.target.value)}
          rows={2}
          className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:border-primary-400 resize-y"
          placeholder="例如：我最近资料分析总是算错，应该怎么练？"
        />
        <Button size="sm" className="w-full" onClick={askAI} disabled={asking || !question.trim()}>
          {asking ? '思考中...' : '发送问题'}
        </Button>
        {!aiService.isConfigured() && (
          <p className="text-xs text-gray-400">未配置云端 AI 时，上方"自动分析"为本地智能分析，可直接使用。</p>
        )}
        {qaResult && (
          <div className="text-sm whitespace-pre-wrap leading-relaxed bg-gray-50 rounded-xl p-3">{qaResult}</div>
        )}
      </div>
    </div>
  );
}
