export interface Question {
  id: string;
  folderId: string;
  categoryId: string;
  title: string;
  content: string;
  photos: string[];
  answer: string;
  wrongAnswer: string;
  errorReason: string; // 错误原因
  analysis: string;
  source: string;
  difficulty: number; // 1-5
  tags: string[];
  createdAt: number;
  updatedAt: number;
}

export const DIFFICULTY_LABELS: Record<number, string> = {
  1: '很简单',
  2: '简单',
  3: '中等',
  4: '较难',
  5: '很难',
};
