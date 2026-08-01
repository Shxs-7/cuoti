import { supabase } from '@/lib/supabase';
import { uid } from '@/lib/uid';
import { db } from '@/db/database';
import { createLogger } from '@/lib/logger';

const log = createLogger('sync');
const DEVICE_KEY = 'cuoti-device-id';
const SYNC_TIMEOUT = 8000; // 8 seconds max per sync operation

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
  recordId: 'record_id', deletedAt: 'deleted_at',
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

// 本地表名 -> 远程表名 + upsert 冲突列
const TABLE_MAP: Record<string, { local: any; remote: string; conflictKey: string }> = {
  categories: { local: db.categories, remote: 'categories', conflictKey: 'id' },
  folders: { local: db.folders, remote: 'folders', conflictKey: 'id' },
  questions: { local: db.questions, remote: 'questions', conflictKey: 'id' },
  tags: { local: db.tags, remote: 'tags', conflictKey: 'id' },
  reviews: { local: db.reviews, remote: 'reviews', conflictKey: 'question_id' },
  knowledgePoints: { local: db.knowledgePoints, remote: 'knowledge_points', conflictKey: 'id' },
  journal: { local: db.journal, remote: 'journal', conflictKey: 'id' },
  deletions: { local: db.deletions, remote: 'deletions', conflictKey: 'id' },
};

function remoteConfig(remote: string) {
  for (const [, cfg] of Object.entries(TABLE_MAP)) {
    if (cfg.remote === remote) return cfg;
  }
  return undefined;
}

function localKeyOf(remote: string): string | undefined {
  for (const [localName, cfg] of Object.entries(TABLE_MAP)) {
    if (cfg.remote === remote) return localName;
  }
  return undefined;
}

export const syncService = {
  deviceId: getDeviceId(),

  async registerDevice() {
    await supabase.from('devices').upsert({
      id: this.deviceId,
      name: navigator.userAgent.slice(0, 50),
    });
  },

  async pullAll() {
    // 1) 先拉取删除标记，后续拉数据时跳过已被删除的记录，避免"复活"
    const tombstones = new Map<string, number>(); // `${remoteTable}:${recordId}` -> deletedAt
    try {
      const { data, error } = await supabase.from('deletions').select('*');
      if (!error && data?.length) {
        const localName = localKeyOf('deletions');
        for (const row of data as any[]) {
          const clean = toCamel(row);
          const table = String(clean.table ?? '');
          const recordId = String(clean.recordId ?? '');
          if (table && recordId) {
            tombstones.set(`${table}:${recordId}`, clean.deletedAt ? new Date(clean.deletedAt).getTime() : Date.now());
          }
          if (localName && clean.id) {
            await (TABLE_MAP[localName].local as any).put(clean, clean.id);
          }
        }
        log.info(`Pulled ${data.length} deletions`);
      }
    } catch (e) { log.warn('Pull deletions failed', e); }

    // 2) 拉取各表数据（不再按 device_id 过滤，多设备数据互通）
    for (const [, { local, remote }] of Object.entries(TABLE_MAP)) {
      if (remote === 'deletions') continue;
      try {
        const { data, error } = await supabase.from(remote).select('*');
        if (error || !data?.length) continue;

        const localData = await local.toArray();
        const localMap = new Map(localData.map((r: any) => [r.id ?? r.questionId, r]));

        for (const row of data as any[]) {
          const clean = toCamel(row);
          const key = clean.id ?? clean.questionId ?? clean.recordId;
          if (!key) continue;

          const remoteTime = row.updated_at ? new Date(row.updated_at).getTime() : 0;
          const tombstoneTime = tombstones.get(`${remote}:${key}`);
          if (tombstoneTime !== undefined && remoteTime <= tombstoneTime) {
            // 该记录在远端最后一次更新之后被删除：本地也删除，防止复活
            await local.delete(key).catch(() => {});
            continue;
          }

          const existing = localMap.get(key);
          const localTime = (existing as any)?.updatedAt ?? 0;
          if (!existing || remoteTime > localTime) {
            await local.put(clean, key);
          }
        }
        log.info(`Pulled ${data.length} from ${remote}`);
      } catch (e) { log.warn(`Pull ${remote} failed`, e); }
    }
  },

  async pushAll() {
    for (const [, { local, remote, conflictKey }] of Object.entries(TABLE_MAP)) {
      try {
        const rows = await local.toArray();
        if (!rows.length) continue;
        const payload = rows.map((r: any) => ({ ...toSnake(r), device_id: this.deviceId }));
        const { error } = await supabase.from(remote).upsert(payload, { onConflict: conflictKey });
        if (error) log.warn(`Push ${remote}: ${error.message}`);
      } catch (e) { log.warn(`Push ${remote} failed`, e); }
    }
    log.info('Push done');
  },

  async fullSync() {
    try {
      await Promise.race([
        (async () => {
          await this.registerDevice();
          await this.pushAll();
          await this.pullAll();
        })(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Sync timeout')), SYNC_TIMEOUT)),
      ]);
    } catch {
      log.warn('Full sync skipped (timeout or network error)');
    }
  },

  // 同步单条记录到云端（table 为远程表名）
  async syncOne(table: string, row: any) {
    try {
      const cfg = remoteConfig(table);
      const conflictKey = cfg?.conflictKey ?? 'id';
      const payload = { ...toSnake(row), device_id: this.deviceId };
      await supabase.from(table).upsert(payload, { onConflict: conflictKey });
    } catch (e) { log.warn(`Sync ${table} failed`, e); }
  },

  // 删除标记：本地记录 + 云端墓碑，让其他设备也删除这条数据
  async markDeleted(table: string, recordId: string, deletedAt = Date.now()) {
    try {
      const id = `${table}:${recordId}`;
      await db.deletions.put({ id, table, recordId, deletedAt });
      const { error } = await supabase.from('deletions').upsert({
        id,
        table,
        record_id: recordId,
        deleted_at: new Date(deletedAt).toISOString(),
        device_id: this.deviceId,
      }, { onConflict: 'id' });
      if (error) log.warn(`Mark deleted ${table}/${recordId}: ${error.message}`);
    } catch { log.warn(`Mark deleted ${table}/${recordId} failed`); }
  },
};
