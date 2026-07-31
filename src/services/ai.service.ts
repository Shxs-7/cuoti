import { journalService } from './journal.service';
import { questionService } from './question.service';
import { reviewService } from './review.service';
import { knowledgeService } from './knowledge.service';
import { createLogger } from '@/lib/logger';
import { CATEGORY_ICONS, JOURNAL_CATEGORIES } from '@/models/journal';

const log = createLogger('ai');

const API_KEY_STORAGE = 'cuoti-ai-apikey';
const API_URL_STORAGE = 'cuoti-ai-url';
const DEFAULT_API_URL = 'https://api.deepseek.com/v1/chat/completions';

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
    // 1. Always produce local analysis (works offline, no API needed)
    const local = await this.localSummary();

    // 2. If API key configured, try cloud AI for deeper analysis
    const apiKey = this.getApiKey();
    if (!apiKey) return local;

    try {
      const [journalText, questionStats, questions, kps] = await Promise.all([
        journalService.exportForAI(),
        reviewService.getStats(),
        questionService.getRecent(30),
        knowledgeService.getAll(),
      ]);

      const questionText = questions.map(q =>
        `【${q.title}】难度${q.difficulty}/5 标签：${Array.isArray(q.tags) ? q.tags.join('、') : '无'}`
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

      const res = await fetch(this.getApiUrl(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: 'deepseek-chat',
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
        return local + '\n\n⚠️ AI 云分析失败（检查 Key/地址），以上为本地分析结果。';
      }
      const data = await res.json();
      const content = data.choices?.[0]?.message?.content;
      return content ? content : local;
    } catch (e) {
      log.warn('AI request failed', e);
      return local + '\n\n⚠️ 网络错误，无法连接 AI，以上为本地分析结果。';
    }
  },

  // 本地规则分析：不依赖任何 API，根据数据生成有意义的总结
  async localSummary(): Promise<string> {
    const [journalEntries, questionStats, questions, kps] = await Promise.all([
      journalService.getAll(),
      reviewService.getStats(),
      questionService.getRecent(200),
      knowledgeService.getAll(),
    ]);

    const lines: string[] = [];
    lines.push(`📊 学习总览：共 ${questions.length} 道错题，${journalEntries.length} 篇日记，${kps.length} 个知识点，平均掌握度 ${questionStats.avgMastery}%，待复习 ${questionStats.needReview} 题`);

    // 按科目统计错题
    const byCategory: Record<string, { total: number; mastery: number }> = {};
    for (const q of questions) {
      const key = q.categoryId || '未分类';
      if (!byCategory[key]) byCategory[key] = { total: 0, mastery: 0 };
      byCategory[key].total++;
    }

    // 日记按科目统计
    const journalByCat: Record<string, number> = {};
    const wrongReasonList: string[] = [];
    for (const j of journalEntries) {
      journalByCat[j.category] = (journalByCat[j.category] || 0) + 1;
      if (j.wrongReasons) wrongReasonList.push(`【${j.date} ${j.category}】${j.wrongReasons}`);
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
    lines.push('🏷️ 高频错题标签（薄弱点）：');
    if (topTags.length === 0) {
      lines.push('暂无标签数据，建议给错题添加标签');
    } else {
      for (const [tag, count] of topTags) {
        lines.push(`• ${tag}：${count} 题`);
      }
    }

    lines.push('');
    lines.push('📝 错因记录：');
    if (wrongReasonList.length === 0) {
      lines.push('暂无错因记录，建议在日记中记录每日错因');
    } else {
      lines.push(wrongReasonList.slice(0, 8).join('\n'));
    }

    lines.push('');
    lines.push('💡 建议：');
    const advice: string[] = [];
    if (questionStats.needReview > 0) advice.push(`有 ${questionStats.needReview} 道题需要复习（掌握度<60%或超过3天未复习）`);
    if (journalEntries.length === 0) advice.push('坚持写学习日记，记录每日错因');
    if (topTags.length > 0) {
      advice.push(`重点关注薄弱点：${topTags.slice(0, 3).map(t => t[0]).join('、')}`);
    }
    if (questionStats.avgMastery < 50) advice.push('整体掌握度偏低，建议增加复习频率');
    if (advice.length === 0) advice.push('整体状态不错，保持节奏，定期复习');
    for (const a of advice) lines.push(`• ${a}`);

    return lines.join('\n');
  },
};
