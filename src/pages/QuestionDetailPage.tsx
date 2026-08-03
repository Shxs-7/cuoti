import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppStore } from '@/stores/app.store';
import { useUIStore } from '@/stores/ui.store';
import { questionService } from '@/services/question.service';
import { reviewService } from '@/services/review.service';
import { tagService } from '@/services/tag.service';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { TagInput, type TagInputHandle } from '@/components/ui/TagInput';
import type { Question, ReviewInfo, Tag } from '@/models';
import { DIFFICULTY_LABELS } from '@/models/question';
import { formatDateTime } from '@/lib/date';
import { compressImage } from '@/lib/compression';
import { MAX_PHOTOS_PER_QUESTION } from '@/lib/constants';

export function QuestionDetailPage() {
  const { questionId } = useParams<{ questionId: string }>();
  const { setTitle } = useAppStore();
  const toast = useUIStore(s => s.toast);
  const navigate = useNavigate();
  const [question, setQuestion] = useState<Question | null>(null);
  const [review, setReview] = useState<ReviewInfo | null>(null);
  const [showDelete, setShowDelete] = useState(false);
  const [showPhoto, setShowPhoto] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [saving, setSaving] = useState(false);
  const tagInputRef = useRef<TagInputHandle>(null);

  // Edit form state
  const [eTitle, setETitle] = useState('');
  const [eContent, setEContent] = useState('');
  const [eAnswer, setEAnswer] = useState('');
  const [eWrong, setEWrong] = useState('');
  const [eAnalysis, setEAnalysis] = useState('');
  const [eSource, setESource] = useState('');
  const [eDiff, setEDiff] = useState(3);
  const [eTags, setETags] = useState<string[]>([]);
  const [ePhotos, setEPhotos] = useState<string[]>([]);

  useEffect(() => {
    if (!questionId) return;
    loadData();
    tagService.getAll().then(setAllTags);
  }, [questionId]);

  const loadData = async () => {
    if (!questionId) return;
    const q = await questionService.getById(questionId);
    if (!q) { navigate('/'); return; }
    setQuestion(q);
    setTitle(q.title || '题目详情');
    const r = await reviewService.getByQuestion(questionId);
    setReview(r ?? null);
  };

  const startEdit = () => {
    if (!question) return;
    setETitle(question.title);
    setEContent(question.content);
    setEAnswer(question.answer);
    setEWrong(question.wrongAnswer);
    setEAnalysis(question.analysis);
    setESource(question.source);
    setEDiff(question.difficulty);
    setETags(Array.isArray(question.tags) ? [...question.tags] : []);
    setEPhotos([...question.photos]);
    setEditing(true);
  };

  const cancelEdit = () => setEditing(false);

  const handlePhotoAdd = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || ePhotos.length + files.length > MAX_PHOTOS_PER_QUESTION) {
      toast(`最多${MAX_PHOTOS_PER_QUESTION}张`, 'error');
      return;
    }
    for (let i = 0; i < files.length; i++) {
      try {
        const compressed = await compressImage(files[i]);
        setEPhotos(prev => [...prev, compressed]);
      } catch {
        toast('图片处理失败', 'error');
      }
    }
  };

  const saveEdit = async () => {
    // Flush pending tag input before saving
    tagInputRef.current?.flush();
    if (!questionId || !eTitle.trim()) { toast('标题不能为空', 'error'); return; }
    setSaving(true);
    try {
      const updateData = {
        title: eTitle.trim(),
        content: eContent,
        answer: eAnswer,
        wrongAnswer: eWrong,
        analysis: eAnalysis,
        source: eSource,
        difficulty: eDiff,
        tags: Array.isArray(eTags) ? eTags : [],
        photos: ePhotos,
        categoryId: question!.categoryId,
        folderId: question!.folderId,
      };
      await questionService.update(questionId, updateData);
      toast('已更新', 'success');
      setEditing(false);
      loadData();
    } catch (err: unknown) {
      toast('保存失败: ' + (err instanceof Error ? err.message : String(err)), 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!questionId) return;
    await questionService.remove(questionId);
    toast('已删除', 'success');
    navigate(-1);
  };

  const handleReview = async (rating: 0 | 1 | 2) => {
    if (!questionId) return;
    await reviewService.recordReview(questionId, rating);
    toast(rating === 2 ? '已掌握！' : rating === 1 ? '继续加油' : '多加复习', 'info');
    loadData();
  };

  if (!question) return null;

  return (
    <div className="space-y-4 pb-24">
      {/* Header */}
      <div className="bg-white rounded-xl p-4 shadow-sm flex items-start justify-between">
        <div className="flex-1">
          {editing ? (
            <input value={eTitle} onChange={e => setETitle(e.target.value)}
              className="w-full text-lg font-semibold px-3 py-2 border border-gray-200 rounded-xl outline-none focus:border-primary-400" />
          ) : (
            <h2 className="text-lg font-semibold">{question.title || '无标题'}</h2>
          )}
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <span className="text-xs text-gray-400">{formatDateTime(question.createdAt)}</span>
            <span className="text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-500">
              {DIFFICULTY_LABELS[question.difficulty] || '中等'}
            </span>
            {!editing && Array.isArray(question.tags) && question.tags.map((t: string) => <Badge key={t} text={t} />)}
          </div>
        </div>
        {!editing && (
          <button onClick={startEdit}
            className="ml-2 w-8 h-8 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center text-sm active:bg-blue-100"
          >✎</button>
        )}
      </div>

      {editing ? (
        <>
          {/* Edit mode */}
          <div className="bg-white rounded-xl p-4 shadow-sm space-y-3">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">题目内容</label>
              <textarea value={eContent} onChange={e => setEContent(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:border-primary-400 min-h-[80px] resize-y" />
            </div>

            <div>
              <label className="text-xs text-gray-500 mb-1 block">图片</label>
              <div className="flex flex-wrap gap-2">
                {ePhotos.map((p, idx) => (
                  <div key={idx} className="relative w-16 h-16 rounded-lg overflow-hidden bg-gray-100">
                    <img src={p} alt="" className="w-full h-full object-cover" />
                    <button onClick={() => setEPhotos(prev => prev.filter((_, i) => i !== idx))}
                      className="absolute top-0 right-0 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-[10px]">✕</button>
                  </div>
                ))}
                {ePhotos.length < MAX_PHOTOS_PER_QUESTION && (
                  <label className="w-16 h-16 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400 active:border-primary-400">
                    <span className="text-xl">+</span>
                    <input type="file" accept="image/*" multiple onChange={handlePhotoAdd} className="hidden" />
                  </label>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">正确答案</label>
                <input value={eAnswer} onChange={e => setEAnswer(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:border-primary-400" />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">我的错误答案</label>
                <input value={eWrong} onChange={e => setEWrong(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:border-primary-400" />
              </div>
            </div>

            <div>
              <label className="text-xs text-gray-500 mb-1 block">解析</label>
              <textarea value={eAnalysis} onChange={e => setEAnalysis(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:border-primary-400 min-h-[60px] resize-y" />
            </div>

            <div>
              <label className="text-xs text-gray-500 mb-1 block">来源</label>
              <input value={eSource} onChange={e => setESource(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:border-primary-400" />
            </div>

            <div>
              <label className="text-xs text-gray-500 mb-1 block">难度</label>
              <div className="flex gap-2">
                {Object.entries(DIFFICULTY_LABELS).map(([v, l]) => (
                  <button key={v} onClick={() => setEDiff(Number(v))}
                    className={`flex-1 py-2 rounded-xl text-sm font-medium ${eDiff === Number(v) ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-500'}`}
                  >{l}</button>
                ))}
              </div>
            </div>

            <TagInput ref={tagInputRef} tags={eTags} allTags={allTags} onChange={setETags} />

            <div className="sticky bottom-0 -mx-4 -mb-4 px-4 pt-3 pb-[calc(14px+env(safe-area-inset-bottom,0px))] bg-white border-t border-gray-100 z-10 flex gap-2">
              <button type="button"
                className="flex-1 py-2.5 text-sm font-medium rounded-lg bg-gray-200 text-gray-700 active:bg-gray-300 min-h-[44px]"
                onTouchEnd={(e) => { e.preventDefault(); cancelEdit(); }}
              >取消</button>
              <button type="button"
                className="flex-1 py-2.5 text-sm font-medium rounded-lg bg-primary-600 text-white active:bg-primary-700 min-h-[44px] disabled:opacity-50"
                disabled={saving}
                onTouchEnd={(e) => { e.preventDefault(); saveEdit(); }}
              >{saving ? '保存中...' : '保存修改'}</button>
            </div>
          </div>
        </>
      ) : (
        <>
          {/* View mode */}
          {question.content && (
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <h3 className="text-sm font-medium text-gray-500 mb-1">题目内容</h3>
              <p className="text-sm whitespace-pre-wrap">{question.content}</p>
            </div>
          )}

          {question.photos.length > 0 && (
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <h3 className="text-sm font-medium text-gray-500 mb-2">题目图片</h3>
              <div className="flex flex-wrap gap-2">
                {question.photos.map((p, idx) => (
                  <img key={idx} src={p} alt="" onClick={() => setShowPhoto(p)}
                    className="w-24 h-24 object-cover rounded-lg cursor-pointer active:opacity-80" />
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-green-50 rounded-xl p-4">
              <h3 className="text-sm font-medium text-green-700 mb-1">正确答案</h3>
              <p className="text-sm whitespace-pre-wrap">{question.answer || '未填写'}</p>
            </div>
            <div className="bg-red-50 rounded-xl p-4">
              <h3 className="text-sm font-medium text-red-700 mb-1">我的错误答案</h3>
              <p className="text-sm whitespace-pre-wrap">{question.wrongAnswer || '未填写'}</p>
            </div>
          </div>

          {question.analysis && (
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <h3 className="text-sm font-medium text-gray-500 mb-1">解析</h3>
              <p className="text-sm whitespace-pre-wrap">{question.analysis}</p>
            </div>
          )}

          {question.source && (
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <h3 className="text-sm font-medium text-gray-500 mb-1">来源</h3>
              <p className="text-sm">{question.source}</p>
            </div>
          )}

          {review && review.reviewCount > 0 && (
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <h3 className="text-sm font-medium text-gray-500 mb-2">复习记录</h3>
              <div className="flex items-center gap-4 text-sm">
                <div>复习 <span className="font-semibold text-primary-600">{review.reviewCount}</span> 次</div>
                <div>掌握度 <span className="font-semibold text-purple-600">{review.masteryLevel}%</span></div>
              </div>
            </div>
          )}

          <div className="bg-white rounded-xl p-4 shadow-sm">
            <h3 className="text-sm font-medium text-gray-500 mb-2">快速复习自评</h3>
            <div className="flex gap-2">
              <Button variant="danger" size="sm" className="flex-1" onClick={() => handleReview(0)}>不会 😞</Button>
              <Button variant="secondary" size="sm" className="flex-1" onClick={() => handleReview(1)}>模糊 🤔</Button>
              <Button variant="primary" size="sm" className="flex-1" onClick={() => handleReview(2)}>掌握 ✅</Button>
            </div>
          </div>

          <Button variant="danger" className="w-full" onClick={() => setShowDelete(true)}>删除</Button>
        </>
      )}

      <ConfirmDialog
        open={showDelete}
        onClose={() => setShowDelete(false)}
        onConfirm={handleDelete}
        title="确认删除"
        message="删除后将无法恢复"
        confirmText="删除"
        danger
      />

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
