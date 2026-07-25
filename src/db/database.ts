import Dexie, { type Table } from 'dexie';
import type { Category, Folder, Question, Tag, ReviewInfo, KnowledgePoint } from '@/models';

export class CuotiDatabase extends Dexie {
  categories!: Table<Category, string>;
  folders!: Table<Folder, string>;
  questions!: Table<Question, string>;
  tags!: Table<Tag, string>;
  reviews!: Table<ReviewInfo, string>;
  knowledgePoints!: Table<KnowledgePoint, string>;

  constructor() {
    super('cuoti-db-v4');
    this.version(1).stores({
      categories: 'id, name, sortOrder',
      folders: 'id, categoryId, name',
      questions: 'id, folderId, categoryId, *tags, difficulty, createdAt',
      tags: 'id, &name, questionCount',
      reviews: 'questionId, reviewCount, lastReviewedAt, masteryLevel',
      knowledgePoints: 'id, folderId, categoryId, *tags, createdAt',
    });
  }
}

export const db = new CuotiDatabase();
