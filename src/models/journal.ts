export interface JournalEntry {
  id: string;
  date: string;        // YYYY-MM-DD
  category: string;    // 资料分析 | 言语理解 | 类比推理 | 定义判断 | 图形推理 | 逻辑判断
  content: string;     // 学习笔记
  wrongReasons: string; // 错题原因分析
  tags: string[];
  createdAt: number;
  updatedAt: number;
}

export const JOURNAL_CATEGORIES = [
  '资料分析',
  '言语理解',
  '类比推理',
  '定义判断',
  '图形推理',
  '逻辑判断',
];

export const CATEGORY_ICONS: Record<string, string> = {
  '资料分析': '📊',
  '言语理解': '📖',
  '类比推理': '🔄',
  '定义判断': '📋',
  '图形推理': '🎨',
  '逻辑判断': '🧩',
};
