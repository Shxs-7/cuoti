import { db } from '@/db/database';
import { createLogger } from '@/lib/logger';
import type { ReviewInfo, Question } from '@/models';

const log = createLogger('review.service');

export const reviewService = {
  async getByQuestion(questionId: string): Promise<ReviewInfo | undefined> {
    return db.reviews.get(questionId);
  },

  async recordReview(questionId: string, rating: 0 | 1 | 2): Promise<void> {
    const info = await db.reviews.get(questionId);
    if (!info) return;

    const consecutive = rating === 2 ? info.consecutiveCorrect + 1 : 0;
    const mastery = Math.min(100, Math.max(0,
      info.masteryLevel + (rating === 2 ? 10 : rating === 1 ? 3 : -5)
    ));

    await db.reviews.update(questionId, {
      reviewCount: info.reviewCount + 1,
      lastReviewedAt: Date.now(),
      masteryLevel: mastery,
      consecutiveCorrect: consecutive,
    });
    log.info('Review recorded', { questionId, rating, mastery });
  },

  async getStats(): Promise<{
    total: number;
    reviewed: number;
    avgMastery: number;
    needReview: number;
  }> {
    const all = await db.reviews.toArray();
    const total = all.length;
    const reviewed = all.filter(r => r.reviewCount > 0).length;
    const avgMastery = total > 0
      ? Math.round(all.reduce((s, r) => s + r.masteryLevel, 0) / total)
      : 0;
    // need review: mastery < 60 AND not reviewed in last 3 days
    const threeDaysAgo = Date.now() - 3 * 24 * 60 * 60 * 1000;
    const needReview = all.filter(r =>
      r.masteryLevel < 60 && (!r.lastReviewedAt || r.lastReviewedAt < threeDaysAgo)
    ).length;
    return { total, reviewed, avgMastery, needReview };
  },

  async getQuestionsToReview(
    filters: { categoryId?: string; folderId?: string; tag?: string; maxDifficulty?: number }
  ): Promise<Question[]> {
    let collection = db.questions.toCollection();
    if (filters.categoryId) {
      collection = collection.filter(q => q.categoryId === filters.categoryId);
    }
    if (filters.folderId) {
      collection = collection.filter(q => q.folderId === filters.folderId);
    }
    if (filters.maxDifficulty !== undefined) {
      collection = collection.filter(q => q.difficulty <= filters.maxDifficulty!);
    }
    const questions = await collection.toArray();

    let result = questions;
    if (filters.tag) {
      result = questions.filter(q => q.tags.includes(filters.tag!));
    }

    // shuffle
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }

    return result;
  },
};
