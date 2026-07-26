/* eslint-disable @typescript-eslint/no-explicit-any */
import { supabase } from '@/lib/supabase';
import { uid } from '@/lib/uid';
import { db } from '@/db/database';
import { createLogger } from '@/lib/logger';

const log = createLogger('sync');
const DEVICE_KEY = 'cuoti-device-id';

function getDeviceId(): string {
  let id = localStorage.getItem(DEVICE_KEY);
  if (!id) {
    id = uid();
    localStorage.setItem(DEVICE_KEY, id);
  }
  return id;
}

const FIELD_MAP: Record<string, string> = {
  sortOrder: 'sort_order', createdAt: 'created_at', updatedAt: 'updated_at',
  categoryId: 'category_id', folderId: 'folder_id', wrongAnswer: 'wrong_answer',
  questionId: 'question_id', lastReviewedAt: 'last_reviewed_at',
  masteryLevel: 'mastery_level', nextReviewAt: 'next_review_at',
  consecutiveCorrect: 'consecutive_correct', reviewCount: 'review_count',
  questionCount: 'question_count', knowledgePoints: 'knowledge_points',
};

function toSnake(obj: any): any {
  const out: any = {};
  for (const [k, v] of Object.entries(obj)) {
    out[FIELD_MAP[k] || k] = v;
  }
  return out;
}

function toCamel(obj: any): any {
  const rev: Record<string, string> = {};
  for (const [k, v] of Object.entries(FIELD_MAP)) rev[v] = k;
  const out: any = {};
  for (const [k, v] of Object.entries(obj)) {
    out[rev[k] || k] = v;
  }
  return out;
}

const TABLE_MAP: Record<string, { local: any; remote: string }> = {
  categories: { local: db.categories, remote: 'categories' },
  folders: { local: db.folders, remote: 'folders' },
  questions: { local: db.questions, remote: 'questions' },
  tags: { local: db.tags, remote: 'tags' },
  reviews: { local: db.reviews, remote: 'reviews' },
  knowledgePoints: { local: db.knowledgePoints, remote: 'knowledge_points' },
};

export const syncService = {
  deviceId: getDeviceId(),

  async registerDevice() {
    await supabase.from('devices').upsert({
      id: this.deviceId,
      name: navigator.userAgent.slice(0, 50),
    });
  },

  async pullAll() {
    for (const [, { local, remote }] of Object.entries(TABLE_MAP)) {
      try {
        const { data, error } = await supabase.from(remote).select('*').eq('device_id', this.deviceId);
        if (error || !data?.length) continue;

        const localData = await local.toArray();
        const localMap = new Map(localData.map((r: any) => [r.id, r]));

        for (const row of data) {
          const { device_id: _, ...clean } = row;
          const existing = localMap.get(row.id);
          const remoteTime = new Date(row.updated_at || 0).getTime();
          const localTime = (existing as any)?.updatedAt ?? 0;
          if (!existing || remoteTime > localTime) {
            await local.put(toCamel(clean), clean.id);
          }
        }
        log.info(`Pulled ${data.length} from ${remote}`);
      } catch (e) { log.warn(`Pull ${remote} failed`, e); }
    }
  },

  async pushAll() {
    for (const [, { local, remote }] of Object.entries(TABLE_MAP)) {
      try {
        const rows = await local.toArray();
        if (!rows.length) continue;
        const payload = rows.map((r: any) => ({ ...toSnake(r), device_id: this.deviceId }));
        const { error } = await supabase.from(remote).upsert(payload, { onConflict: 'id' });
        if (error) log.warn(`Push ${remote}: ${error.message}`);
      } catch (e) { log.warn(`Push ${remote} failed`, e); }
    }
    log.info('Push done');
  },

  async fullSync() {
    await this.registerDevice();
    await this.pushAll();  // push first so local changes aren't overwritten
    await this.pullAll();
  },

  // Sync single item change
  async syncOne(table: string, row: any) {
    try {
      const payload = { ...toSnake(row), device_id: this.deviceId };
      await supabase.from(table).upsert(payload, { onConflict: 'id' });
    } catch (e) { log.warn(`Sync ${table} failed`, e); }
  },
};
