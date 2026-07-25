import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/globals.css';

import { db } from '@/db/database';
import { DEFAULT_CATEGORIES } from '@/lib/constants';
import { uid } from '@/lib/uid';
import { autoBackupService } from '@/services/autobackup.service';

async function initDefaults() {
  try {
    const count = await db.categories.count();
    if (count === 0) {
      // Check if we have auto-backup to restore
      const restored = await autoBackupService.restore();
      if (restored) {
        console.log('Auto-backup restored successfully');
        return;
      }
      // Otherwise init defaults
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
    console.error('DB init error:', e);
  }
}

initDefaults().finally(() => {
  // Start auto-backup
  autoBackupService.startAutoBackup();

  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
});
