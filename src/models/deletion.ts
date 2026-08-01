export interface Deletion {
  id: string;       // `${table}:${recordId}`
  table: string;    // 本地表名，如 questions / reviews / journal
  recordId: string;
  deletedAt: number;
}
