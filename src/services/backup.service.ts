import { db } from '@/db/database';
import { createLogger } from '@/lib/logger';
import { APP_VERSION } from '@/lib/constants';
import type { Category, Folder, Question, Tag, ReviewInfo, KnowledgePoint, JournalEntry, Deletion } from '@/models';

const log = createLogger('backup.service');

export interface BackupFile {
  version: string;
  exportedAt: string;
  data: {
    categories: Category[];
    folders: Folder[];
    questions: Question[];
    tags: Tag[];
    reviews: ReviewInfo[];
    knowledgePoints: KnowledgePoint[];
    journal: JournalEntry[];
    deletions: Deletion[];
  };
}

export const backupService = {
  async exportData(): Promise<BackupFile> {
    const [categories, folders, questions, tags, reviews, knowledgePoints, journal, deletions] = await Promise.all([
      db.categories.toArray(),
      db.folders.toArray(),
      db.questions.toArray(),
      db.tags.toArray(),
      db.reviews.toArray(),
      db.knowledgePoints.toArray(),
      db.journal.toArray(),
      db.deletions.toArray(),
    ]);
    const backup: BackupFile = {
      version: APP_VERSION,
      exportedAt: new Date().toISOString(),
      data: { categories, folders, questions, tags, reviews, knowledgePoints, journal, deletions },
    };
    log.info('Backup exported', {
      categories: categories.length,
      folders: folders.length,
      questions: questions.length,
      knowledgePoints: knowledgePoints.length,
      journal: journal.length,
    });
    return backup;
  },

  async downloadBackup(): Promise<void> {
    const backup = await this.exportData();
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cuoti-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    log.info('Backup downloaded');
  },

  async shareBackup(): Promise<void> {
    const backup = await this.exportData();
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const file = new File([blob], `cuoti-backup-${new Date().toISOString().slice(0, 10)}.json`, {
      type: 'application/json',
    });
    if (navigator.share && navigator.canShare?.({ files: [file] })) {
      await navigator.share({
        title: '错题本备份',
        files: [file],
      });
    } else {
      // fallback to download
      await this.downloadBackup();
    }
  },

  async importData(file: File): Promise<BackupFile> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const backup = JSON.parse(reader.result as string) as BackupFile;
          if (!backup.version || !backup.data) {
            throw new Error('无效的备份文件格式');
          }
          resolve(backup);
        } catch (e) {
          reject(e);
        }
      };
      reader.onerror = () => reject(new Error('文件读取失败'));
      reader.readAsText(file);
    });
  },

  async restoreData(backup: BackupFile): Promise<void> {
    await db.transaction(
      'rw',
      [db.categories, db.folders, db.questions, db.tags, db.reviews, db.knowledgePoints, db.journal, db.deletions],
      async () => {
        await db.categories.clear();
        await db.folders.clear();
        await db.questions.clear();
        await db.tags.clear();
        await db.reviews.clear();
        await db.knowledgePoints.clear();
        await db.journal.clear();
        await db.deletions.clear();

        await db.categories.bulkAdd(backup.data.categories);
        await db.folders.bulkAdd(backup.data.folders);
        await db.questions.bulkAdd(backup.data.questions);
        await db.tags.bulkAdd(backup.data.tags);
        await db.reviews.bulkAdd(backup.data.reviews);
        if (backup.data.knowledgePoints?.length) await db.knowledgePoints.bulkAdd(backup.data.knowledgePoints);
        if (backup.data.journal?.length) await db.journal.bulkAdd(backup.data.journal);
        if (backup.data.deletions?.length) await db.deletions.bulkAdd(backup.data.deletions);
      }
    );
    log.info('Backup restored', {
      categories: backup.data.categories.length,
      questions: backup.data.questions.length,
    });
  },

  async getStorageInfo(): Promise<{ usage: string; quota: string; percent: number }> {
    const estimate = await navigator.storage.estimate();
    const usage = estimate.usage ?? 0;
    const quota = estimate.quota ?? 0;
    const fmt = (bytes: number) => {
      if (bytes < 1024) return `${bytes} B`;
      if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
      return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };
    return {
      usage: fmt(usage),
      quota: fmt(quota),
      percent: quota > 0 ? Math.round((usage / quota) * 100) : 0,
    };
  },
};
