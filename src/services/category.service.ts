import { db } from '@/db/database';
import { uid } from '@/lib/uid';
import { createLogger } from '@/lib/logger';
import { syncService } from './sync.service';
import { tagService } from './tag.service';
import type { Category, Folder, Question, KnowledgePoint } from '@/models';

const log = createLogger('category.service');

export const categoryService = {
  async getAll(): Promise<Category[]> {
    return db.categories.orderBy('sortOrder').toArray();
  },

  async getById(id: string): Promise<Category | undefined> {
    return db.categories.get(id);
  },

  async create(data: Pick<Category, 'name' | 'icon' | 'color'>): Promise<Category> {
    const now = Date.now();
    const maxOrder = await db.categories.orderBy('sortOrder').last();
    const category: Category = {
      id: uid(),
      ...data,
      sortOrder: (maxOrder?.sortOrder ?? -1) + 1,
      createdAt: now,
      updatedAt: now,
    };
    await db.categories.add(category);
    syncService.syncOne('categories', category);
    log.info('Category created', { id: category.id, name: category.name });
    return category;
  },

  async update(id: string, data: Partial<Pick<Category, 'name' | 'icon' | 'color'>>): Promise<void> {
    await db.categories.update(id, { ...data, updatedAt: Date.now() });
    const updated = await db.categories.get(id);
    if (updated) syncService.syncOne('categories', updated);
    log.info('Category updated', { id });
  },

  async remove(id: string): Promise<void> {
    let folders: Folder[] = [];
    let questions: Question[] = [];
    let kps: KnowledgePoint[] = [];

    await db.transaction(
      'rw',
      [db.categories, db.folders, db.questions, db.reviews, db.knowledgePoints, db.tags],
      async () => {
        folders = await db.folders.where('categoryId').equals(id).toArray();
        questions = await db.questions.where('categoryId').equals(id).toArray();
        kps = await db.knowledgePoints.where('categoryId').equals(id).toArray();

        for (const q of questions) {
          await db.reviews.where('questionId').equals(q.id).delete();
          await tagService.applyQuestionTags(q.tags, -1);
        }
        await db.questions.where('categoryId').equals(id).delete();
        await db.knowledgePoints.where('categoryId').equals(id).delete();
        await db.folders.where('categoryId').equals(id).delete();
        await db.categories.delete(id);
      }
    );

    // propagate deletions to other devices
    for (const f of folders) await syncService.markDeleted('folders', f.id);
    for (const q of questions) {
      await syncService.markDeleted('questions', q.id);
      await syncService.markDeleted('reviews', q.id);
    }
    for (const k of kps) await syncService.markDeleted('knowledge_points', k.id);
    await syncService.markDeleted('categories', id);
    log.info('Category removed', { id });
  },

  async getQuestionCount(id: string): Promise<number> {
    return db.questions.where('categoryId').equals(id).count();
  },

  async reorder(ids: string[]): Promise<void> {
    await db.transaction('rw', db.categories, async () => {
      for (let i = 0; i < ids.length; i++) {
        await db.categories.update(ids[i], { sortOrder: i, updatedAt: Date.now() });
      }
    });
  },
};
