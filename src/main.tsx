import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/globals.css';

import { db } from '@/db/database';
import { DEFAULT_CATEGORIES } from '@/lib/constants';
import { uid } from '@/lib/uid';
import { syncService } from '@/services/sync.service';

async function initDefaults() {
  try {
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

  // Background sync after page is live
  setTimeout(() => {
    syncService.fullSync().catch(e => console.warn('Background sync failed:', e));
  }, 2000);
});
