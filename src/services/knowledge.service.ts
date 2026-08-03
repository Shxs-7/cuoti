import { db } from '@/db/database';
import { uid } from '@/lib/uid';
import { createLogger } from '@/lib/logger';
import { syncService } from './sync.service';
import type { KnowledgePoint } from '@/models';
import { KP_COLORS } from '@/models';

const log = createLogger('knowledge.service');

// 置顶的知识点排最前（按置顶时间倒序），其余按创建时间倒序
function sortByPinned(list: KnowledgePoint[]): KnowledgePoint[] {
  return [...list].sort((a, b) => (b.pinnedAt ?? 0) - (a.pinnedAt ?? 0));
}

export const knowledgeService = {
  async getByFolder(folderId: string): Promise<KnowledgePoint[]> {
    const list = await db.knowledgePoints.where('folderId').equals(folderId).reverse().sortBy('createdAt');
    return sortByPinned(list);
  },

  async getAll(): Promise<KnowledgePoint[]> {
    const list = await db.knowledgePoints.reverse().sortBy('createdAt');
    return sortByPinned(list);
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
    rating?: number;
  }): Promise<KnowledgePoint> {
    const now = Date.now();
    const kp: KnowledgePoint = {
      id: uid(),
      ...data,
      rating: data.rating ?? 3,
      pinnedAt: null,
      color: KP_COLORS[Math.floor(Math.random() * KP_COLORS.length)],
      createdAt: now,
      updatedAt: now,
    };
    await db.knowledgePoints.add(kp);
    syncService.syncOne('knowledge_points', kp);
    log.info('KP created', { title: kp.title });
    return kp;
  },

  async update(id: string, data: Partial<Pick<KnowledgePoint, 'title' | 'content' | 'photos' | 'tags' | 'rating' | 'pinnedAt'>>): Promise<void> {
    await db.knowledgePoints.update(id, { ...data, updatedAt: Date.now() });
    const updated = await db.knowledgePoints.get(id);
    if (updated) syncService.syncOne('knowledge_points', updated);
  },

  // 置顶 / 取消置顶（置顶后按置顶时间倒序排在最前）
  async setPinned(id: string, pinned: boolean): Promise<void> {
    await db.knowledgePoints.update(id, {
      pinnedAt: pinned ? Date.now() : null,
      updatedAt: Date.now(),
    });
    const updated = await db.knowledgePoints.get(id);
    if (updated) syncService.syncOne('knowledge_points', updated);
  },

  async remove(id: string): Promise<void> {
    await db.knowledgePoints.delete(id);
    await syncService.markDeleted('knowledge_points', id);
    log.info('KP removed', { id });
  },

  async getCountByFolder(folderId: string): Promise<number> {
    return db.knowledgePoints.where('folderId').equals(folderId).count();
  },

  async getByCategory(categoryId: string): Promise<KnowledgePoint[]> {
    const list = await db.knowledgePoints.where('categoryId').equals(categoryId).reverse().sortBy('createdAt');
    return sortByPinned(list);
  },
};
