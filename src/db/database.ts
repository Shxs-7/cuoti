import Dexie, { type Table } from 'dexie';
import type { Category, Folder, Question, Tag, ReviewInfo, KnowledgePoint, JournalEntry, Deletion } from '@/models';

export class CuotiDatabase extends Dexie {
  categories!: Table<Category, string>;
  folders!: Table<Folder, string>;
  questions!: Table<Question, string>;
  tags!: Table<Tag, string>;
  reviews!: Table<ReviewInfo, string>;
  knowledgePoints!: Table<KnowledgePoint, string>;
  journal!: Table<JournalEntry, string>;
  deletions!: Table<Deletion, string>;

  constructor() {
    // WARNING: Do NOT change the database name. Use version() for schema changes.
    super('cuoti-db');

    // Version 1: Core tables
    this.version(1).stores({
      categories: 'id, name, sortOrder',
      folders: 'id, categoryId, name',
      questions: 'id, folderId, categoryId, *tags, difficulty, createdAt',
      tags: 'id, &name, questionCount',
      reviews: 'questionId, reviewCount, lastReviewedAt, masteryLevel',
    });

    // Version 2: Added knowledge points + journal
    this.version(2).stores({
      categories: 'id, name, sortOrder',
      folders: 'id, categoryId, name',
      questions: 'id, folderId, categoryId, *tags, difficulty, createdAt',
      tags: 'id, &name, questionCount',
      reviews: 'questionId, reviewCount, lastReviewedAt, masteryLevel',
      knowledgePoints: 'id, folderId, categoryId, *tags, createdAt',
      journal: 'id, date, category, createdAt',
    });

    // Version 3: Sync tombstones so deletions propagate across devices
    this.version(3).stores({
      categories: 'id, name, sortOrder',
      folders: 'id, categoryId, name',
      questions: 'id, folderId, categoryId, *tags, difficulty, createdAt',
      tags: 'id, &name, questionCount',
      reviews: 'questionId, reviewCount, lastReviewedAt, masteryLevel',
      knowledgePoints: 'id, folderId, categoryId, *tags, createdAt',
      journal: 'id, date, category, createdAt',
      deletions: 'id, deletedAt',
    });
  }
}

export const db = new CuotiDatabase();
