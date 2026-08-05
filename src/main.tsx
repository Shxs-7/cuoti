import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/globals.css';

import { db } from '@/db/database';
import { DEFAULT_CATEGORIES } from '@/lib/constants';
import { uid } from '@/lib/uid';
import { autoBackupService } from '@/services/autobackup.service';

// Migrate data from old database names to the new one
async function migrateOldData() {
  const oldNames = ['cuoti-db-v4', 'cuoti-db-v2', 'cuoti-db-v5'];
  for (const oldName of oldNames) {
    try {
      const req = indexedDB.open(oldName);
      await new Promise<void>((resolve, reject) => {
        req.onsuccess = () => resolve();
        req.onerror = () => reject();
        req.onblocked = () => reject();
      });
      const oldDb = req.result;
      const tables = ['categories', 'folders', 'questions', 'tags', 'reviews', 'knowledgePoints', 'journal'];

      for (const table of tables) {
        if (!oldDb.objectStoreNames.contains(table)) continue;
        const tx = oldDb.transaction(table, 'readonly');
        const store = tx.objectStore(table);
        const rows = await new Promise<any[]>((res) => {
          const req2 = store.getAll();
          req2.onsuccess = () => res(req2.result || []);
          req2.onerror = () => res([]);
        });

        if (rows.length > 0) {
          const existing = await (db as any)[table].count();
          if (existing === 0) {
            try {
              await (db as any)[table].bulkAdd(rows);
            } catch { /* skip duplicates */ }
          }
        }
      }
      oldDb.close();
    } catch { /* old DB not found or inaccessible */ }
  }
}

// 旧数据迁移：老版本只有"解析"字段，新版本拆成"错误原因"+"解析"
async function migrateQuestionFields() {
  try {
    const questions = await db.questions.toArray();
    const updates: { id: string; errorReason: string; analysis: string }[] = [];
    for (const q of questions) {
      if (q.errorReason === undefined && q.analysis) {
        updates.push({ id: q.id, errorReason: q.analysis, analysis: '' });
      }
    }
    if (updates.length) {
      await db.transaction('rw', db.questions, async () => {
        for (const u of updates) {
          await db.questions.update(u.id, { errorReason: u.errorReason, analysis: u.analysis });
        }
      });
      console.info(`Migrated ${updates.length} questions to errorReason`);
    }
  } catch (e) {
    console.warn('Migrate question fields failed:', e);
  }
}

async function initDefaults() {
  try {
    // First try to migrate old data
    await migrateOldData();
    // 拆分解析字段
    await migrateQuestionFields();

    const count = await db.categories.count();
    if (count === 0) {
      const now = Date.now();
      await db.categories.bulkAdd(
        DEFAULT_CATEGORIES.map((c, i) => ({
          id: uid(),
          ...c,
          sortOrder: i,
          createdAt: now,
          updatedAt: now,
        }))
      );
    }
  } catch (e) {
    console.error('Init error:', e);
  }
}

// Render immediately, don't wait for network
initDefaults().finally(() => {
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );

  // 启动自动备份（数据变更后自动保存到 localStorage）
  autoBackupService.startAutoBackup();
});
