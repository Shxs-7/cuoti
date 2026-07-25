export interface ReviewInfo {
  questionId: string;
  reviewCount: number;
  lastReviewedAt: number | null;
  nextReviewAt: number | null;
  masteryLevel: number; // 0-100
  consecutiveCorrect: number;
}
