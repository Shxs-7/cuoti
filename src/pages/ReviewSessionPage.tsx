import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAppStore } from '@/stores/app.store';
import { useUIStore } from '@/stores/ui.store';
import { reviewService } from '@/services/review.service';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import type { Question } from '@/models';

export function ReviewSessionPage() {
  const { setTitle } = useAppStore();
  const toast = useUIStore(s => s.toast);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showPhoto, setShowPhoto] = useState<string | null>(null);

  useEffect(() => {
    setTitle('复习中');
    const filters: { categoryId?: string; tag?: string; maxDifficulty?: number } = {};
    const cat = searchParams.get('categoryId');
    const tag = searchParams.get('tag');
    const diff = searchParams.get('maxDifficulty');
    if (cat) filters.categoryId = cat;
    if (tag) filters.tag = tag;
    if (diff) filters.maxDifficulty = Number(diff);

    reviewService.getQuestionsToReview(filters).then(qs => {
      setQuestions(qs);
      setLoading(false);
      if (qs.length === 0) toast('没有匹配的题目', 'info');
    });
  }, []);

  const handleRate = async (rating: 0 | 1 | 2) => {
    const q = questions[currentIndex];
    if (!q) return;
    await reviewService.recordReview(q.id, rating);
    setRevealed(false);

    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      toast(`复习完成！共 ${questions.length} 题`, 'success');
      navigate('/review');
    }
  };

  if (loading) {
    return <div className="text-center py-16 text-gray-400">准备题目中...</div>;
  }

  if (questions.length === 0) {
    return <EmptyState icon="🎉" title="没有需要复习的题目" description="去添加一些错题吧" />;
  }

  const q = questions[currentIndex];
  const progress = ((currentIndex + 1) / questions.length) * 100;

  return (
    <div className="space-y-4 pb-6">
      {/* Progress */}
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <span>{currentIndex + 1} / {questions.length}</span>
        <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-primary-500 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Card */}
      <div
        className="bg-white rounded-2xl shadow-md p-5 min-h-[200px]"
      >
        <h3 className="text-lg font-semibold mb-3">{q.title || '无标题'}</h3>

        {q.content && (
          <div className="text-sm text-gray-700 mb-4 whitespace-pre-wrap">{q.content}</div>
        )}

        {q.photos.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {q.photos.map((p, idx) => (
              <img key={idx} src={p} alt="" onClick={() => setShowPhoto(p)}
                className="w-20 h-20 object-cover rounded-lg cursor-pointer active:opacity-80" />
            ))}
          </div>
        )}

        {q.source && <div className="text-xs text-gray-400 mb-3">📖 {q.source}</div>}

        {/* Answer reveal */}
        {!revealed ? (
          <Button className="w-full mt-4" onClick={() => setRevealed(true)}>
            👆 点击查看答案
          </Button>
        ) : (
          <div className="space-y-3 mt-4 pt-4 border-t border-gray-100">
            <div className="bg-green-50 rounded-xl p-3">
              <div className="text-xs text-green-700 font-medium mb-1">正确答案</div>
              <div className="text-sm whitespace-pre-wrap">{q.answer || '未填写'}</div>
            </div>
            {q.wrongAnswer && (
              <div className="bg-red-50 rounded-xl p-3">
                <div className="text-xs text-red-700 font-medium mb-1">我的错误答案</div>
                <div className="text-sm whitespace-pre-wrap">{q.wrongAnswer}</div>
              </div>
            )}
            {q.analysis && (
              <div className="bg-blue-50 rounded-xl p-3">
                <div className="text-xs text-blue-700 font-medium mb-1">解析</div>
                <div className="text-sm whitespace-pre-wrap">{q.analysis}</div>
              </div>
            )}

            {q.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {q.tags.map(t => (
                  <span key={t} className="text-xs px-2 py-0.5 rounded bg-blue-50 text-blue-500">{t}</span>
                ))}
              </div>
            )}

            <div>
              <div className="text-xs text-gray-500 mb-2">自我评价掌握程度：</div>
              <div className="flex gap-2">
                <Button variant="danger" className="flex-1" onClick={() => handleRate(0)}>不会 😞</Button>
                <Button variant="secondary" className="flex-1" onClick={() => handleRate(1)}>模糊 🤔</Button>
                <Button variant="primary" className="flex-1" onClick={() => handleRate(2)}>掌握 ✅</Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {showPhoto && (
        <div className="fixed inset-0 z-[60] bg-black/90 flex items-center justify-center" onClick={() => setShowPhoto(null)}>
          <img src={showPhoto} alt="" className="max-w-full max-h-full object-contain p-4" />
          <button onClick={() => setShowPhoto(null)}
            className="absolute top-4 right-4 w-8 h-8 bg-white/20 text-white rounded-full flex items-center justify-center">✕</button>
        </div>
      )}
    </div>
  );
}
