import { db } from '@/db/database';
import { uid } from '@/lib/uid';
import { createLogger } from '@/lib/logger';
import type { Tag } from '@/models';
import { TAG_COLORS } from '@/models';

const log = createLogger('tag.service');

export const tagService = {
  async getAll(): Promise<Tag[]> {
    return db.tags.orderBy('questionCount').reverse().toArray();
  },

  async getByName(name: string): Promise<Tag | undefined> {
    return db.tags.where('name').equals(name).first();
  },

  async findOrCreate(name: string): Promise<Tag> {
    const existing = await this.getByName(name);
    if (existing) return existing;
    const tag: Tag = {
      id: uid(),
      name,
      color: TAG_COLORS[Math.floor(Math.random() * TAG_COLORS.length)],
      questionCount: 0,
    };
    await db.tags.add(tag);
    log.info('Tag created', { name });
    return tag;
  },

  async updateCount(name: string, delta: number): Promise<void> {
    const tag = await db.tags.where('name').equals(name).first();
    if (tag) {
      const newCount = Math.max(0, tag.questionCount + delta);
      await db.tags.update(tag.id, { questionCount: newCount });
    }
  },

  async syncTags(oldTags: string[], newTags: string[]): Promise<void> {
    const removed = oldTags.filter(t => !newTags.includes(t));
    const added = newTags.filter(t => !oldTags.includes(t));
    for (const t of added) {
      await this.findOrCreate(t);
      await this.updateCount(t, 1);
    }
    for (const t of removed) {
      await this.updateCount(t, -1);
      // cleanup empty tags
      const tag = await this.getByName(t);
      if (tag && tag.questionCount <= 0) {
        await db.tags.delete(tag.id);
      }
    }
  },

  async getQuestionCount(name: string): Promise<number> {
    const tag = await db.tags.where('name').equals(name).first();
    return tag?.questionCount ?? 0;
  },
};
