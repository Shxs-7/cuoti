import { db } from '@/db/database';
import { uid } from '@/lib/uid';
import { createLogger } from '@/lib/logger';
import type { KnowledgePoint } from '@/models';
import { KP_COLORS } from '@/models';

const log = createLogger('knowledge.service');

export const knowledgeService = {
  async getByFolder(folderId: string): Promise<KnowledgePoint[]> {
    return db.knowledgePoints.where('folderId').equals(folderId).reverse().sortBy('createdAt');
  },

  async getAll(): Promise<KnowledgePoint[]> {
    return db.knowledgePoints.reverse().sortBy('createdAt');
  },

  async getById(id: string): Promise<KnowledgePoint | undefined> {
    return db.knowledgePoints.get(id);
  },

  async create(data: {
    folderId: string;
    categoryId: string;
    title: string;
    content: string;
    photos: string[];
    tags: string[];
  }): Promise<KnowledgePoint> {
    const now = Date.now();
    const kp: KnowledgePoint = {
      id: uid(),
      ...data,
      color: KP_COLORS[Math.floor(Math.random() * KP_COLORS.length)],
      createdAt: now,
      updatedAt: now,
    };
    await db.knowledgePoints.add(kp);
    log.info('KP created', { title: kp.title });
    return kp;
  },

  async update(id: string, data: Partial<Pick<KnowledgePoint, 'title' | 'content' | 'photos' | 'tags'>>): Promise<void> {
    await db.knowledgePoints.update(id, { ...data, updatedAt: Date.now() });
  },

  async remove(id: string): Promise<void> {
    await db.knowledgePoints.delete(id);
    log.info('KP removed', { id });
  },

  async getCountByFolder(folderId: string): Promise<number> {
    return db.knowledgePoints.where('folderId').equals(folderId).count();
  },

  async getByCategory(categoryId: string): Promise<KnowledgePoint[]> {
    return db.knowledgePoints.where('categoryId').equals(categoryId).reverse().sortBy('createdAt');
  },
};
