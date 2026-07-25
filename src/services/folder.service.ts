import { db } from '@/db/database';
import { uid } from '@/lib/uid';
import { createLogger } from '@/lib/logger';
import type { Folder } from '@/models';

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
    log.info('Folder created', { id: folder.id, name: folder.name });
    return folder;
  },

  async update(id: string, data: Partial<Pick<Folder, 'name' | 'description'>>): Promise<void> {
    await db.folders.update(id, { ...data, updatedAt: Date.now() });
    log.info('Folder updated', { id });
  },

  async remove(id: string): Promise<void> {
    await db.transaction('rw', [db.folders, db.questions, db.reviews], async () => {
      const questions = await db.questions.where('folderId').equals(id).toArray();
      for (const q of questions) {
        await db.reviews.where('questionId').equals(q.id).delete();
      }
      await db.questions.where('folderId').equals(id).delete();
      await db.folders.delete(id);
    });
    log.info('Folder removed', { id });
  },

  async getQuestionCount(id: string): Promise<number> {
    return db.questions.where('folderId').equals(id).count();
  },
};
