export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  sortOrder: number;
  createdAt: number;
  updatedAt: number;
}

export const DEFAULT_ICONS = ['📝', '📊', '💬', '📖', '🎯', '📋', '🏛️', '🔢'];
export const DEFAULT_COLORS = [
  '#2563eb', '#dc2626', '#16a34a', '#ca8a04',
  '#9333ea', '#0891b2', '#ea580c', '#4f46e5',
];
