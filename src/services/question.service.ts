import { db } from '@/db/database';
import { uid } from '@/lib/uid';
import { createLogger } from '@/lib/logger';
import { tagService } from './tag.service';
import type { Question } from '@/models';

const log = createLogger('question.service');

export const questionService = {
  async getByFolder(folderId: string): Promise<Question[]> {
    return db.questions
      .where('folderId').equals(folderId)
      .reverse()
      .sortBy('createdAt');
  },

  async getById(id: string): Promise<Question | undefined> {
    return db.questions.get(id);
  },

  async create(
    data: Pick<Question, 'folderId' | 'categoryId' | 'title' | 'content' | 'photos'
      | 'answer' | 'wrongAnswer' | 'analysis' | 'source' | 'difficulty' | 'tags'>
  ): Promise<Question> {
    const now = Date.now();
    const question: Question = {
      id: uid(),
      ...data,
      createdAt: now,
      updatedAt: now,
    };
    await db.questions.add(question);

    // init review info
    await db.reviews.put({
      questionId: question.id,
      reviewCount: 0,
      lastReviewedAt: null,
      nextReviewAt: null,
      masteryLevel: 0,
      consecutiveCorrect: 0,
    });

    // sync tags
    for (const t of question.tags) {
      await tagService.findOrCreate(t);
      await tagService.updateCount(t, 1);
    }

    log.info('Question created', { id: question.id, title: question.title });
    return question;
  },

  async update(
    id: string,
    data: Partial<Omit<Question, 'id' | 'createdAt'>>
  ): Promise<void> {
    const old = await db.questions.get(id);
    if (!old) throw new Error('Question not found');

    const updateData = { ...data, updatedAt: Date.now() };
    await db.questions.update(id, updateData);

    // sync tags if changed
    if (data.tags) {
      await tagService.syncTags(old.tags, data.tags);
    }

    log.info('Question updated', { id });
  },

  async remove(id: string): Promise<void> {
    const question = await db.questions.get(id);
    if (!question) return;

    await db.transaction('rw', [db.questions, db.tags, db.reviews], async () => {
      // decrement tag counts
      for (const t of question.tags) {
        await tagService.updateCount(t, -1);
        const tag = await tagService.getByName(t);
        if (tag && tag.questionCount <= 0) {
          await db.tags.delete(tag.id);
        }
      }
      await db.reviews.where('questionId').equals(id).delete();
      await db.questions.delete(id);
    });
    log.info('Question removed', { id });
  },

  async getRecent(limit = 10): Promise<Question[]> {
    return db.questions
      .orderBy('createdAt')
      .reverse()
      .limit(limit)
      .toArray();
  },

  async getTotalCount(): Promise<number> {
    return db.questions.count();
  },

  async search(query: string): Promise<Question[]> {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    // Search across multiple fields using Dexie filter
    const all = await db.questions.reverse().sortBy('createdAt');
    return all.filter(item => {
      const tags = Array.isArray(item.tags) ? item.tags : [];
      const searchText = [
        item.title ?? '',
        item.content ?? '',
        item.answer ?? '',
        item.wrongAnswer ?? '',
        item.analysis ?? '',
        item.source ?? '',
        ...tags,
      ].join(' ').toLowerCase();
      return searchText.includes(q);
    });
  },

  async searchByTag(tagName: string): Promise<Question[]> {
    return db.questions
      .where('tags').equals(tagName)
      .reverse()
      .sortBy('createdAt');
  },
};
