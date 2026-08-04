import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppStore } from '@/stores/app.store';
import { folderService } from '@/services/folder.service';
import { questionService } from '@/services/question.service';
import { knowledgeService } from '@/services/knowledge.service';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { StarRating } from '@/components/ui/StarRating';
import type { Folder, Question, KnowledgePoint } from '@/models';
import { formatDate } from '@/lib/date';
import { DIFFICULTY_LABELS } from '@/models/question';

export function FolderPage() {
  const { folderId } = useParams<{ folderId: string }>();
  const { setTitle } = useAppStore();
  const navigate = useNavigate();
  const [folder, setFolder] = useState<Folder | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [kps, setKps] = useState<KnowledgePoint[]>([]);

  useEffect(() => {
    if (!folderId) return;
    loadData();
  }, [folderId]);

  const loadData = async () => {
    if (!folderId) return;
    const f = await folderService.getById(folderId);
    if (!f) { navigate('/'); return; }
    setFolder(f);
    setTitle(f.name);
    const [qs, ks] = await Promise.all([
      questionService.getByFolder(folderId),
      knowledgeService.getByFolder(folderId),
    ]);
    setQuestions(qs);
    setKps(ks);
  };

  const togglePinKp = async (kp: KnowledgePoint) => {
    await knowledgeService.setPinned(kp.id, !kp.pinnedAt);
    loadData();
  };

  if (!folder) return null;

  return (
    <div className="space-y-4 pb-24">
      {/* Knowledge Points Section */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-cyan-700">📚 知识点</h3>
          <span className="text-xs text-gray-400">{kps.length}</span>
        </div>
        {kps.length === 0 ? (
          <div className="text-center py-6 text-xs text-gray-400">暂无知识点</div>
        ) : (
          <div className="space-y-2">
            {kps.map(kp => (
              <button
                key={kp.id}
                onClick={() => navigate(`/knowledge/${kp.id}`)}
                className="w-full bg-cyan-50 border border-cyan-100 rounded-xl p-3 text-left active:bg-cyan-100"
              >
                <div className="flex items-start gap-2">
                  <span className="text-lg mt-0.5">📖</span>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm text-cyan-800">
                      {kp.pinnedAt && <span className="text-amber-500 text-xs mr-1">📌</span>}
                      {kp.title || '无标题'}
                    </div>
                    {kp.content && (
                      <div className="text-xs text-cyan-600/70 mt-0.5 line-clamp-1">{kp.content}</div>
                    )}
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <StarRating value={kp.rating || 3} />
                      <span className="text-xs text-cyan-400">{formatDate(kp.createdAt)}</span>
                      {kp.tags.map(t => (
                        <span key={t} className="text-xs px-1.5 py-0.5 rounded bg-cyan-100 text-cyan-600">{t}</span>
                      ))}
                      {kp.photos.length > 0 && (
                        <span className="text-xs text-cyan-400 ml-auto">📷{kp.photos.length}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-center gap-0.5 mt-0.5 flex-shrink-0">
                    <button
                      onClick={(e) => { e.stopPropagation(); togglePinKp(kp); }}
                      title={kp.pinnedAt ? '取消置顶' : '置顶'}
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-xs ${kp.pinnedAt ? 'bg-amber-50 text-amber-500' : 'bg-white/60 text-gray-400'}`}
                    >📌</button>
                    <span className="text-cyan-300 text-sm">›</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Divider */}
      <div className="border-t border-gray-100" />

      {/* Questions Section */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-gray-700">📝 错题</h3>
          <span className="text-xs text-gray-400">{questions.length}</span>
        </div>
        {questions.length === 0 ? (
          <div className="text-center py-6 text-xs text-gray-400">暂无错题</div>
        ) : (
          <div className="space-y-2">
            {questions.map(q => (
              <button
                key={q.id}
                onClick={() => navigate(`/question/${q.id}`)}
                className="w-full bg-white rounded-xl p-3 shadow-sm text-left active:bg-gray-50"
              >
                <div className="font-medium text-sm line-clamp-2">{q.title || '无标题'}</div>
                {q.content && (
                  <div className="text-xs text-gray-500 mt-1 line-clamp-1">{q.content}</div>
                )}
                <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                  <span className="text-xs text-gray-400">{formatDate(q.createdAt)}</span>
                  <span className="text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-500">
                    {DIFFICULTY_LABELS[q.difficulty] || '中等'}
                  </span>
                  {q.tags.slice(0, 3).map(t => (
                    <Badge key={t} text={t} />
                  ))}
                  {q.photos.length > 0 && (
                    <span className="text-xs text-gray-400 ml-auto">📷{q.photos.length}</span>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Action buttons（吸底固定，数据多也不用滑到底） */}
      <div className="sticky bottom-0 -mx-4 px-4 pt-3 pb-[calc(14px+env(safe-area-inset-bottom,0px))] bg-gray-50/95 backdrop-blur-md border-t border-gray-100 z-10 flex gap-2">
        <Button className="flex-1" onClick={() => navigate(`/question/new/${folderId}`)}>
          + 添加错题
        </Button>
        <Button variant="secondary" className="flex-1" onClick={() => navigate(`/kp/new/${folderId}`)}>
          + 添加知识点
        </Button>
      </div>

    </div>
  );
}
