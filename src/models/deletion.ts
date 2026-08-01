export interface Deletion {
  id: string;       // `${table}:${recordId}`
  tableName: string; // 本地表名，如 questions / reviews / journal（"table" 是数据库保留字）
  recordId: string;
  deletedAt: number;
}
