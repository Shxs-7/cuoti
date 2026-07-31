import { journalService } from './journal.service';
import { questionService } from './question.service';
import { reviewService } from './review.service';
import { knowledgeService } from './knowledge.service';
import { createLogger } from '@/lib/logger';

const log = createLogger('ai');

const API_KEY_STORAGE = 'cuoti-ai-apikey';
const API_URL_STORAGE = 'cuoti-ai-url';
const DEFAULT_API_URL = 'https://api.openai.com/v1/chat/completions';

export const aiService = {
  getApiKey(): string {
    return localStorage.getItem(API_KEY_STORAGE) || '';
  },
  setApiKey(key: string) {
    localStorage.setItem(API_KEY_STORAGE, key);
  },
  getApiUrl(): string {
    return localStorage.getItem(API_URL_STORAGE) || DEFAULT_API_URL;
  },
  setApiUrl(url: string) {
    localStorage.setItem(API_URL_STORAGE, url);
  },
  isConfigured(): boolean {
    return !!this.getApiKey();
  },

  async summarize(): Promise<string> {
    const apiKey = this.getApiKey();
    if (!apiKey) return this.localSummary();

    // Gather data
    const [journalText, questionStats, questions, kps] = await Promise.all([
      journalService.exportForAI(),
      reviewService.getStats(),
      questionService.getRecent(20),
      knowledgeService.getAll(),
    ]);

    const questionText = questions.map(q =>
      `【${q.title}】难度${q.difficulty}/5 标签：${q.tags.join('、')}`
    ).join('\n');

    const kpText = kps.map(k =>
      `【${k.title}】${k.content?.slice(0, 100) || ''}`
    ).join('\n');

    const prompt = `你是一位公务员考试辅导专家。请分析以下学习数据并给出建议：

## 学习日记
${journalText}

## 近期错题 (${questionStats.total}题，掌握度${questionStats.avgMastery}%)
${questionText}

## 知识点
${kpText}

请总结：
1. 学习进度和薄弱环节
2. 错题规律和建议
3. 下一步学习计划`;

    try {
      const res = await fetch(this.getApiUrl(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            { role: 'system', content: '你是公考辅导专家，回答简洁有条理，用中文。' },
            { role: 'user', content: prompt },
          ],
          max_tokens: 1500,
          temperature: 0.7,
        }),
      });
      if (!res.ok) {
        const err = await res.text();
        log.warn('AI API error: ' + err);
        return 'AI 请求失败，请检查 API Key 和地址是否正确。\n\n' + this.localSummary();
      }
      const data = await res.json();
      return data.choices?.[0]?.message?.content || this.localSummary();
    } catch (e) {
      log.warn('AI request failed', e);
      return '网络错误，无法连接 AI。\n\n' + this.localSummary();
    }
  },

  localSummary(): string {
    return '未配置 AI API Key，显示本地统计。\n请在下方设置 API Key 后重试。\n\n支持 OpenAI / DeepSeek 等兼容 API。';
  },
};
