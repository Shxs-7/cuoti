import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '@/stores/app.store';
import { knowledgeService } from '@/services/knowledge.service';
import { EmptyState } from '@/components/ui/EmptyState';
import type { KnowledgePoint } from '@/models';
import { formatDate } from '@/lib/date';

export function KnowledgePage() {
  const { setTitle } = useAppStore();
  const navigate = useNavigate();
  const [kps, setKps] = useState<KnowledgePoint[]>([]);

  useEffect(() => {
    setTitle('知识点');
    knowledgeService.getAll().then(setKps);
  }, []);

  return (
    <div className="space-y-3 pb-4">
      {kps.length === 0 ? (
        <EmptyState icon="📚" title="还没有知识点" description="在文件夹内添加知识点" />
      ) : (
        kps.map(kp => (
          <button
            key={kp.id}
            onClick={() => navigate(`/knowledge/${kp.id}`)}
            className="w-full bg-white rounded-xl p-3 shadow-sm text-left active:bg-gray-50"
          >
            <div className="flex items-start gap-2">
              <span className="w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0" style={{ backgroundColor: kp.color }} />
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm">{kp.title || '无标题'}</div>
                {kp.content && (
                  <div className="text-xs text-gray-500 mt-0.5 line-clamp-1">{kp.content}</div>
                )}
                <div className="flex items-center gap-1.5 mt-1.5">
                  <span className="text-xs text-gray-400">{formatDate(kp.createdAt)}</span>
                  {kp.tags.map(t => (
                    <span key={t} className="text-xs px-1.5 py-0.5 rounded bg-cyan-50 text-cyan-600">{t}</span>
                  ))}
                  {kp.photos.length > 0 && (
                    <span className="text-xs text-gray-400 ml-auto">📷{kp.photos.length}</span>
                  )}
                </div>
              </div>
              <span className="text-gray-300 text-sm mt-1">›</span>
            </div>
          </button>
        ))
      )}
    </div>
  );
}
