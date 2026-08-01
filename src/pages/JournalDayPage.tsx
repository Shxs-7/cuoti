import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppStore } from '@/stores/app.store';
import { useUIStore } from '@/stores/ui.store';
import { journalService } from '@/services/journal.service';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { EmptyState } from '@/components/ui/EmptyState';
import type { JournalEntry } from '@/models';
import { CATEGORY_ICONS, JOURNAL_CATEGORIES } from '@/models/journal';

export function JournalDayPage() {
  const { date } = useParams<{ date: string }>();
  const { setTitle } = useAppStore();
  const toast = useUIStore(s => s.toast);
  const navigate = useNavigate();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<JournalEntry | null>(null);

  useEffect(() => {
    if (!date) return;
    setTitle(`${date} 日记`);
    load();
  }, [date]);

  const load = async () => {
    if (!date) return;
    const all = await journalService.getByDate(date);
    setEntries(all);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await journalService.remove(deleteTarget.id);
    toast('已删除', 'success');
    setDeleteTarget(null);
    load();
  };

  // Group by category (fixed order)
  const groups: Record<string, JournalEntry[]> = {};
  for (const e of entries) {
    (groups[e.category] = groups[e.category] || []).push(e);
  }
  const orderedCats = [
    ...JOURNAL_CATEGORIES.filter(c => groups[c]),
    ...Object.keys(groups).filter(c => !JOURNAL_CATEGORIES.includes(c)),
  ];

  return (
    <div className="space-y-4 pb-4">
      {/* Add button */}
      <button
        onClick={() => navigate(`/journal/new?date=${date}`)}
        className="w-full py-3 border-2 border-dashed border-primary-300 rounded-xl text-primary-500 text-sm font-medium active:bg-primary-50"
      >+ 添加今天的记录</button>

      {entries.length === 0 ? (
        <EmptyState icon="📔" title="今天还没有记录" description="点击上方按钮添加" />
      ) : (
        orderedCats.map(cat => {
          const list = groups[cat];
          return (
            <div key={cat} className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="px-4 py-2.5 bg-gray-50 flex items-center gap-2">
                <span className="text-base">{CATEGORY_ICONS[cat] || '📝'}</span>
                <span className="text-sm font-semibold text-gray-700">{cat}</span>
                <span className="text-xs text-gray-400 ml-auto">{list.length} 条</span>
              </div>
              <div className="divide-y divide-gray-50">
                {list.map(e => (
                  <div key={e.id} className="px-4 py-3">
                    {e.content && (
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">{e.content}</p>
                    )}
                    {e.wrongReasons && (
                      <div className="mt-2 p-2 bg-red-50 rounded-lg">
                        <span className="text-xs font-medium text-red-600">❌ 错因：</span>
                        <span className="text-sm text-red-700">{e.wrongReasons}</span>
                      </div>
                    )}
                    {Array.isArray(e.tags) && e.tags.length > 0 && (
                      <div className="flex gap-1 mt-2">
                        {e.tags.map(t => (
                          <span key={t} className="text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">{t}</span>
                        ))}
                      </div>
                    )}
                    <div className="flex justify-end gap-1 mt-2">
                      <button onClick={() => navigate(`/journal/edit/${e.id}`)}
                        className="w-7 h-7 rounded-full bg-blue-50 text-blue-400 flex items-center justify-center text-xs">✎</button>
                      <button onClick={() => setDeleteTarget(e)}
                        className="w-7 h-7 rounded-full bg-red-50 text-red-400 flex items-center justify-center text-xs">🗑</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="确认删除"
        message="删除这条日记？"
        confirmText="删除"
        danger
      />
    </div>
  );
}
