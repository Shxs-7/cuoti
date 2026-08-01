import { db } from '@/db/database';
import { uid } from '@/lib/uid';
import { createLogger } from '@/lib/logger';
import { syncService } from './sync.service';
import { tagService } from './tag.service';
import type { Folder, Question, KnowledgePoint } from '@/models';

const log = createLogger('folder.service');

export const folderService = {
  async getByCategory(categoryId: string): Promise<Folder[]> {
    return db.folders.where('categoryId').equals(categoryId).sortBy('sortOrder');
  },

  async getById(id: string): Promise<Folder | undefined> {
    return db.folders.get(id);
  },

  async create(data: Pick<Folder, 'categoryId' | 'name' | 'description'>): Promise<Folder> {
    const now = Date.now();
    const maxOrder = await db.folders
      .where('categoryId').equals(data.categoryId)
      .sortBy('sortOrder');
    const folder: Folder = {
      id: uid(),
      ...data,
      sortOrder: maxOrder.length > 0 ? (maxOrder[maxOrder.length - 1]?.sortOrder ?? -1) + 1 : 0,
      createdAt: now,
      updatedAt: now,
    };
    await db.folders.add(folder);
    syncService.syncOne('folders', folder);
    log.info('Folder created', { id: folder.id, name: folder.name });
    return folder;
  },

  async update(id: string, data: Partial<Pick<Folder, 'name' | 'description'>>): Promise<void> {
    await db.folders.update(id, { ...data, updatedAt: Date.now() });
    const updated = await db.folders.get(id);
    if (updated) syncService.syncOne('folders', updated);
    log.info('Folder updated', { id });
  },

  async remove(id: string): Promise<void> {
    let questions: Question[] = [];
    let kps: KnowledgePoint[] = [];

    await db.transaction(
      'rw',
      [db.folders, db.questions, db.reviews, db.knowledgePoints, db.tags],
      async () => {
        questions = await db.questions.where('folderId').equals(id).toArray();
        for (const q of questions) {
          await db.reviews.where('questionId').equals(q.id).delete();
          await tagService.applyQuestionTags(q.tags, -1);
        }
        kps = await db.knowledgePoints.where('folderId').equals(id).toArray();
        await db.questions.where('folderId').equals(id).delete();
        await db.knowledgePoints.where('folderId').equals(id).delete();
        await db.folders.delete(id);
      }
    );

    // propagate deletions to other devices
    for (const q of questions) {
      await syncService.markDeleted('questions', q.id);
      await syncService.markDeleted('reviews', q.id);
    }
    for (const k of kps) {
      await syncService.markDeleted('knowledge_points', k.id);
    }
    log.info('Folder removed', { id });
  },

  async getQuestionCount(id: string): Promise<number> {
    return db.questions.where('folderId').equals(id).count();
  },
};
