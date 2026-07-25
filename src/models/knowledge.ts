export interface KnowledgePoint {
  id: string;
  folderId: string;
  categoryId: string;
  title: string;
  content: string;
  photos: string[];
  tags: string[];
  color: string;
  createdAt: number;
  updatedAt: number;
}

export const KP_COLORS = [
  '#0891b2', '#7c3aed', '#059669', '#d97706',
  '#dc2626', '#2563eb', '#9333ea', '#0d9488',
];
