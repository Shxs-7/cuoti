import { db } from '@/db/database';
import { uid } from '@/lib/uid';
import { createLogger } from '@/lib/logger';
import type { JournalEntry } from '@/models';

const log = createLogger('journal');

export const journalService = {
  async getAll(): Promise<JournalEntry[]> {
    return db.journal.reverse().sortBy('date');
  },

  async getByDate(date: string): Promise<JournalEntry[]> {
    return db.journal.where('date').equals(date).toArray();
  },

  async getByCategory(category: string): Promise<JournalEntry[]> {
    return db.journal.where('category').equals(category).reverse().sortBy('date');
  },

  async getById(id: string): Promise<JournalEntry | undefined> {
    return db.journal.get(id);
  },

  async create(data: {
    date: string;
    category: string;
    content: string;
    wrongReasons: string;
    tags: string[];
  }): Promise<JournalEntry> {
    const now = Date.now();
    const entry: JournalEntry = { id: uid(), ...data, createdAt: now, updatedAt: now };
    await db.journal.add(entry);
    log.info('Journal created', { date: data.date, category: data.category });
    return entry;
  },

  async update(id: string, data: Partial<Pick<JournalEntry, 'category' | 'content' | 'wrongReasons' | 'tags'>>) {
    await db.journal.update(id, { ...data, updatedAt: Date.now() });
  },

  async remove(id: string): Promise<void> {
    await db.journal.delete(id);
  },

  async getStats() {
    const all = await db.journal.toArray();
    const byCat: Record<string, number> = {};
    const byDate: Record<string, number> = {};
    for (const e of all) {
      byCat[e.category] = (byCat[e.category] || 0) + 1;
      byDate[e.date] = (byDate[e.date] || 0) + 1;
    }
    return { total: all.length, byCategory: byCat, byDate, entries: all };
  },

  // Export for AI
  async exportForAI(): Promise<string> {
    const all = await db.journal.reverse().sortBy('date');
    if (all.length === 0) return '暂无日记记录。';
    return all.map(e =>
      `【${e.date}】${e.category}\n学习内容：${e.content || '无'}\n错因分析：${e.wrongReasons || '无'}\n标签：${e.tags.join('、') || '无'}`
    ).join('\n\n---\n\n');
  },
};
