import { db } from '@/db/database';
import { createLogger } from '@/lib/logger';
import type { Table } from 'dexie';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DexieTable = Table<any, any>;

const log = createLogger('autobackup');
const STORAGE_KEY = 'cuoti-autobackup';
const BACKUP_INTERVAL = 5 * 60 * 1000; // 5 minutes

export const autoBackupService = {
  async save(): Promise<void> {
    try {
      const [categories, folders, questions, tags, reviews, knowledgePoints] = await Promise.all([
        db.categories.toArray(),
        db.folders.toArray(),
        db.questions.toArray(),
        db.tags.toArray(),
        db.reviews.toArray(),
        db.knowledgePoints.toArray(),
      ]);
      const data = { categories, folders, questions, tags, reviews, knowledgePoints, updatedAt: Date.now() };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      log.debug('Auto-backup saved');
    } catch (e) {
      log.warn('Auto-backup failed', e);
    }
  },

  async restore(): Promise<boolean> {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return false;
      const data = JSON.parse(raw);
      if (!data.categories || !data.questions) return false;

      await db.transaction('rw',
        [db.categories, db.folders, db.questions, db.tags, db.reviews, db.knowledgePoints],
        async () => {
          await db.categories.clear();
          await db.folders.clear();
          await db.questions.clear();
          await db.tags.clear();
          await db.reviews.clear();
          await db.knowledgePoints.clear();

          await db.categories.bulkAdd(data.categories);
          await db.folders.bulkAdd(data.folders);
          await db.questions.bulkAdd(data.questions);
          if (data.tags) await db.tags.bulkAdd(data.tags);
          if (data.reviews) await db.reviews.bulkAdd(data.reviews);
          if (data.knowledgePoints) await db.knowledgePoints.bulkAdd(data.knowledgePoints);
        });

      log.info('Auto-backup restored');
      return true;
    } catch (e) {
      log.error('Auto-backup restore failed', e);
      return false;
    }
  },

  getBackupInfo(): { date: string; size: string } | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const data = JSON.parse(raw);
      return {
        date: data.updatedAt ? new Date(data.updatedAt).toLocaleString('zh-CN') : '未知',
        size: (raw.length / 1024).toFixed(1) + ' KB',
      };
    } catch {
      return null;
    }
  },

  startAutoBackup(): () => void {
    let timer: ReturnType<typeof setTimeout> | null = null;

    const scheduleBackup = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        this.save();
        timer = null;
      }, 2000);
    };

    // Attach hooks to all tables
    (db.categories as DexieTable).hook('creating', scheduleBackup);
    (db.categories as DexieTable).hook('updating', scheduleBackup);
    (db.categories as DexieTable).hook('deleting', scheduleBackup);
    (db.folders as DexieTable).hook('creating', scheduleBackup);
    (db.folders as DexieTable).hook('updating', scheduleBackup);
    (db.folders as DexieTable).hook('deleting', scheduleBackup);
    (db.questions as DexieTable).hook('creating', scheduleBackup);
    (db.questions as DexieTable).hook('updating', scheduleBackup);
    (db.questions as DexieTable).hook('deleting', scheduleBackup);
    (db.tags as DexieTable).hook('creating', scheduleBackup);
    (db.tags as DexieTable).hook('updating', scheduleBackup);
    (db.tags as DexieTable).hook('deleting', scheduleBackup);
    (db.reviews as DexieTable).hook('creating', scheduleBackup);
    (db.reviews as DexieTable).hook('updating', scheduleBackup);
    (db.reviews as DexieTable).hook('deleting', scheduleBackup);
    (db.knowledgePoints as DexieTable).hook('creating', scheduleBackup);
    (db.knowledgePoints as DexieTable).hook('updating', scheduleBackup);
    (db.knowledgePoints as DexieTable).hook('deleting', scheduleBackup);

    // Also save periodically
    const interval = setInterval(() => this.save(), BACKUP_INTERVAL);

    // Initial save after app loads
    setTimeout(() => this.save(), 5000);

    log.info('Auto-backup started');
    return () => {
      clearInterval(interval);
      if (timer) clearTimeout(timer);
    };
  },
};
