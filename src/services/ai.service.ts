import { journalService } from './journal.service';
import { questionService } from './question.service';
import { reviewService } from './review.service';
import { knowledgeService } from './knowledge.service';
import { createLogger } from '@/lib/logger';
import { CATEGORY_ICONS, JOURNAL_CATEGORIES } from '@/models/journal';
import type { JournalEntry } from '@/models';

const log = createLogger('ai');

const API_KEY_STORAGE = 'cuoti-ai-apikey';
const API_URL_STORAGE = 'cuoti-ai-url';
const API_MODEL_STORAGE = 'cuoti-ai-model';
const DEFAULT_API_URL = 'https://api.deepseek.com/v1/chat/completions';
const DEFAULT_MODEL = 'deepseek-chat';
const AI_TIMEOUT = 15000; // 15s 超时，超时自动回退本地分析

async function fetchWithTimeout(url: string, options: RequestInit, timeoutMs = AI_TIMEOUT): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

// 组装发送给云端 AI 的学习数据上下文（最近错题 + 日记错因）
async function buildAIContext(): Promise<string> {
  const [journalEntries, questions, kps] = await Promise.all([
    journalService.getAll(),
    questionService.getRecent(20),
    knowledgeService.getAll(),
  ]);
  const questionText = questions.map(q =>
    `- 【${q.title || '无标题'}】难度${q.difficulty}/5 标签：${Array.isArray(q.tags) ? q.tags.join('、') : '无'}，我的错误答案：${q.wrongAnswer || '未记录'}`
  ).join('\n') || '暂无错题';
  const errorText = journalEntries
    .filter(j => j.wrongReasons)
    .slice(-15)
    .map(j => `- 【${j.date} ${j.category}】${j.wrongReasons}`)
    .join('\n') || '暂无错因记录';
  const kpText = kps.slice(0, 15).map(k => `- ${k.title}`).join('\n') || '暂无知识点';
  return `## 最近错题（${questions.length} 道）\n${questionText}\n\n## 日记错因（${journalEntries.length} 条）\n${errorText}\n\n## 已记录知识点\n${kpText}`;
}

// 从日记错因里统计高频片段（按标点切分，找出反复出现的错误描述）
function frequentErrorFragments(entries: JournalEntry[]): { text: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const e of entries) {
    if (!e.wrongReasons) continue;
    const fragments = e.wrongReasons
      .split(/[。；;，,\n]+/)
      .map(s => s.trim())
      .filter(s => s.length >= 2);
    for (const f of fragments) {
      counts.set(f, (counts.get(f) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .map(([text, count]) => ({ text, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
}

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
  getApiModel(): string {
    return localStorage.getItem(API_MODEL_STORAGE) || DEFAULT_MODEL;
  },
  setApiModel(model: string) {
    localStorage.setItem(API_MODEL_STORAGE, model);
  },
  isConfigured(): boolean {
    return !!this.getApiKey();
  },

  async summarize(): Promise<string> {
    // 1. Always produce local analysis (works offline, no API needed)
    const local = await this.localSummary();

    // 2. If API key configured, try cloud AI for deeper analysis
    const apiKey = this.getApiKey();
    if (!apiKey) return local;

    try {
      const [journalEntries, questionStats, questions, kps] = await Promise.all([
        journalService.getAll(),
        reviewService.getStats(),
        questionService.getRecent(30),
        knowledgeService.getAll(),
      ]);

      const questionText = questions.map(q =>
        `【${q.title || '无标题'}】难度${q.difficulty}/5 标签：${Array.isArray(q.tags) ? q.tags.join('、') : '无'}\n` +
        `我的错误答案：${q.wrongAnswer || '未记录'}`
      ).join('\n');

      // 日记错因按模块汇总
      const byCat: Record<string, string[]> = {};
      for (const j of journalEntries) {
        const cat = j.category || '未分类';
        (byCat[cat] = byCat[cat] || []).push(j.wrongReasons || '');
      }
      const errorSummary = Object.entries(byCat)
        .map(([cat, list]) => {
          const texts = list.filter(Boolean);
          if (!texts.length) return `${cat}：暂无错因记录`;
          return `${cat}（${texts.length} 条）：\n${texts.slice(0, 5).map(t => `- ${t}`).join('\n')}`;
        })
        .join('\n\n');
      const topErrors = frequentErrorFragments(journalEntries)
        .map(f => `${f.text}（出现 ${f.count} 次）`)
        .join('、') || '暂无';

      const journalText = journalEntries.length
        ? journalEntries.slice(0, 30).map(e =>
            `【${e.date}】${e.category}\n学习内容：${e.content || '无'}\n错因分析：${e.wrongReasons || '无'}`
          ).join('\n\n---\n\n')
        : '暂无日记记录。';

      const kpText = kps.map(k =>
        `【${k.title}】${k.content?.slice(0, 100) || ''}`
      ).join('\n');

      const prompt = `你是一位公务员考试辅导专家。请重点分析以下学习数据，并给出针对性建议：

## 学习日记（最近 ${journalEntries.length} 条）
${journalText}

## 日记里的高频错因
${topErrors || '暂无'}

## 错因按模块汇总
${errorSummary || '暂无'}

## 最近错题（共${questionStats.total}题，掌握度${questionStats.avgMastery}%）
${questionText}

## 知识点
${kpText}

请按要求回答：
1. 分析最近错题：哪些模块/知识点反复出错、共性错误是什么
2. 分析日记里的频繁错误：反复出现的错因和薄弱环节
3. 给出下一步学习计划和每日复习建议

用中文，简洁有条理，分点回答。`;

      const res = await fetchWithTimeout(this.getApiUrl(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: this.getApiModel(),
          messages: [
            { role: 'system', content: '你是公考辅导专家，回答简洁有条理，用中文。' },
            { role: 'user', content: prompt },
          ],
          max_tokens: 1500,
          temperature: 0.7,
        }),
      });
      if (!res.ok) {
        log.warn('AI API error: ' + await res.text());
        return local + '\n\n⚠️ AI 云分析失败（检查 Key/地址/模型），以上为本地分析结果。';
      }
      const data = await res.json();
      const content = data.choices?.[0]?.message?.content;
      return content ? content : local;
    } catch (e) {
      log.warn('AI request failed', e);
      return local + '\n\n⚠️ AI 云分析超时或网络错误，以上为本地分析结果。';
    }
  },

  // 直接向云端 AI 提问（需配置 Key）
  async ask(question: string): Promise<string> {
    const apiKey = this.getApiKey();
    if (!apiKey) throw new Error('请先在 ⚙️ 里配置 API Key');
    try {
      const context = await buildAIContext();
      const prompt = `你是公务员考试辅导专家。以下是用户的学习数据摘要：\n\n${context}\n\n用户的问题：${question}\n\n请结合这些数据给出具体、可操作的回答，用中文，分点，简洁。`;
      const res = await fetchWithTimeout(this.getApiUrl(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: this.getApiModel(),
          messages: [
            { role: 'system', content: '你是公考辅导专家，回答简洁有条理，用中文。' },
            { role: 'user', content: prompt },
          ],
          max_tokens: 1000,
          temperature: 0.7,
        }),
      });
      if (!res.ok) {
        throw new Error('AI 接口错误：' + (await res.text()).slice(0, 200));
      }
      const data = await res.json();
      const content = data.choices?.[0]?.message?.content;
      if (!content) throw new Error('AI 返回内容为空');
      return content;
    } catch (e) {
      log.warn('AI ask failed', e);
      throw new Error(e instanceof Error ? e.message : '请求失败');
    }
  },

  // 本地规则分析：不依赖任何 API，重点看最近错题 + 日记高频错因
  async localSummary(): Promise<string> {
    try {
      const [journalEntries, questionStats, questions, kps] = await Promise.all([
        journalService.getAll(),
        reviewService.getStats(),
        questionService.getRecent(200),
        knowledgeService.getAll(),
      ]);

      const lines: string[] = [];
      lines.push(`📊 学习总览：共 ${questionStats.total} 道错题，${journalEntries.length} 篇日记，${kps.length} 个知识点，平均掌握度 ${questionStats.avgMastery}%，待复习 ${questionStats.needReview} 题`);

      // 日记按科目统计
      const journalByCat: Record<string, number> = {};
      for (const j of journalEntries) {
        journalByCat[j.category || '未分类'] = (journalByCat[j.category || '未分类'] || 0) + 1;
      }

      // 标签频率（薄弱知识点）
      const tagCount: Record<string, number> = {};
      for (const q of questions) {
        if (Array.isArray(q.tags)) {
          for (const t of q.tags) tagCount[t] = (tagCount[t] || 0) + 1;
        }
      }
      const topTags = Object.entries(tagCount).sort((a, b) => b[1] - a[1]).slice(0, 8);

      lines.push('');
      lines.push('📈 六大模块记录：');
      for (const cat of JOURNAL_CATEGORIES) {
        const count = journalByCat[cat] || 0;
        const icon = CATEGORY_ICONS[cat] || '📝';
        lines.push(`${icon} ${cat}：${count} 条日记${count > 0 ? `（占比 ${Math.round((count / journalEntries.length) * 100)}%）` : ''}`);
      }

      lines.push('');
      lines.push('🔍 最近错题：');
      if (questions.length === 0) {
        lines.push('暂无错题，建议先添加错题');
      } else {
        for (const q of questions.slice(0, 8)) {
          const wrong = q.wrongAnswer ? `｜错答：${q.wrongAnswer.slice(0, 40)}` : '';
          const tags = Array.isArray(q.tags) && q.tags.length ? `｜标签：${q.tags.join('、')}` : '';
          lines.push(`• ${q.title || '无标题'}（难度${q.difficulty}/5）${tags}${wrong}`);
        }
        if (questions.length > 8) lines.push(`…共 ${questions.length} 道最近错题`);
      }

      lines.push('');
      lines.push('🏷️ 高频错题标签（薄弱点）：');
      if (topTags.length === 0) {
        lines.push('暂无标签数据，建议给错题添加标签');
      } else {
        for (const [tag, count] of topTags) {
          lines.push(`• ${tag}：${count} 题`);
        }
      }

      lines.push('');
      lines.push('⚠️ 日记高频错因：');
      const topErrors = frequentErrorFragments(journalEntries);
      if (topErrors.length === 0) {
        lines.push('暂无错因记录，建议在日记中记录每日错因');
      } else {
        for (const f of topErrors) {
          lines.push(`• ${f.text}（出现 ${f.count} 次）`);
        }
      }

      lines.push('');
      lines.push('📝 近期错因明细：');
      const wrongReasonList = journalEntries
        .filter(j => j.wrongReasons)
        .slice(0, 8)
        .map(j => `【${j.date} ${j.category}】${j.wrongReasons}`);
      if (wrongReasonList.length === 0) {
        lines.push('暂无');
      } else {
        lines.push(wrongReasonList.join('\n'));
      }

      lines.push('');
      lines.push('💡 建议：');
      const advice: string[] = [];
      if (questionStats.needReview > 0) advice.push(`有 ${questionStats.needReview} 道题需要复习（掌握度<60%或超过3天未复习）`);
      if (journalEntries.length === 0) advice.push('坚持写学习日记，记录每日错因');
      if (topTags.length > 0) {
        advice.push(`重点关注薄弱点：${topTags.slice(0, 3).map(t => t[0]).join('、')}`);
      }
      if (topErrors.length > 0) {
        advice.push(`反复出现的错因：${topErrors.slice(0, 3).map(t => t.text).join('；')}，建议针对性专项练习`);
      }
      if (questionStats.avgMastery < 50) advice.push('整体掌握度偏低，建议增加复习频率');
      if (advice.length === 0) advice.push('整体状态不错，保持节奏，定期复习');
      for (const a of advice) lines.push(`• ${a}`);

      return lines.join('\n');
    } catch (e) {
      log.warn('localSummary error', e);
      return '📊 分析数据失败：' + (e instanceof Error ? e.message : String(e));
    }
  },
};
