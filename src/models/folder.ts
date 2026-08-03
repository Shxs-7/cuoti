export interface Folder {
  id: string;
  categoryId: string;
  name: string;
  description: string;
  sortOrder: number;
  pinnedAt: number | null; // 置顶时间戳，null 表示未置顶
  createdAt: number;
  updatedAt: number;
}
