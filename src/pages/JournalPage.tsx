import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '@/stores/app.store';
import { useUIStore } from '@/stores/ui.store';
import { journalService } from '@/services/journal.service';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import type { JournalEntry } from '@/models';
import { CATEGORY_ICONS, JOURNAL_CATEGORIES } from '@/models/journal';

export function JournalPage() {
  const { setTitle } = useAppStore();
  const toast = useUIStore(s => s.toast);
  const navigate = useNavigate();
  const [entries, setEntries] = useState<JournalEntry[]>([]);

  useEffect(() => {
    setTitle('学习日记');
    load();
  }, []);

  const load = async () => {
    const all = await journalService.getAll();
    setEntries(all);
  };

  // Level 1: group by date (newest first)
  const byDate = new Map<string, JournalEntry[]>();
  for (const e of entries) {
    const list = byDate.get(e.date) || [];
    list.push(e);
    byDate.set(e.date, list);
  }
  const dates = [...byDate.keys()].sort().reverse();

  // Level 2: within each date, group by category (fixed order)
  const byCategoryInDay = (dayEntries: JournalEntry[]) => {
    const groups: Record<string, JournalEntry[]> = {};
    for (const e of dayEntries) {
      (groups[e.category] = groups[e.category] || []).push(e);
    }
    // Sort by JOURNAL_CATEGORIES order first, then remaining
    const ordered: [string, JournalEntry[]][] = [];
    for (const cat of JOURNAL_CATEGORIES) {
      if (groups[cat]) ordered.push([cat, groups[cat]]);
    }
    for (const [cat, list] of Object.entries(groups)) {
      if (!JOURNAL_CATEGORIES.includes(cat)) ordered.push([cat, list]);
    }
    return ordered;
  };

  const [deleteTarget, setDeleteTarget] = useState<JournalEntry | null>(null);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await journalService.remove(deleteTarget.id);
    toast('已删除', 'success');
    setDeleteTarget(null);
    load();
  };

  return (
    <div className="space-y-4 pb-4">
      {entries.length === 0 ? (
        <EmptyState icon="📔" title="还没有日记" description="每天记录学习内容和错题原因" />
      ) : (
        dates.map(date => {
          const dayEntries = byDate.get(date)!;
          const catGroups = byCategoryInDay(dayEntries);
          return (
            <div key={date} className="bg-white rounded-xl shadow-sm overflow-hidden">
              {/* Level 1: Date header */}
              <div className="px-4 py-3 bg-primary-50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-lg">📅</span>
                  <span className="font-semibold text-primary-700">{date}</span>
                  <span className="text-xs text-primary-400">
                    {dayEntries.length} 条记录 · {catGroups.length} 个科目
                  </span>
                </div>
                <button
                  onClick={() => navigate(`/journal/new?date=${date}`)}
                  className="text-xs px-2.5 py-1.5 rounded-full bg-primary-600 text-white active:bg-primary-700"
                >+ 添加</button>
              </div>

              {/* Level 2: Category groups */}
              <div className="divide-y divide-gray-50">
                {catGroups.map(([cat, list]) => (
                  <div key={cat} className="px-4 py-3">
                    <div className="flex items-center gap-1.5 mb-2">
                      <span className="text-base">{CATEGORY_ICONS[cat] || '📝'}</span>
                      <span className="text-sm font-medium text-gray-700">{cat}</span>
                      <span className="text-xs text-gray-400">{list.length} 条</span>
                    </div>
                    <div className="space-y-2">
                      {list.map(e => (
                        <div key={e.id} className="bg-gray-50 rounded-lg p-3">
                          {e.content && (
                            <p className="text-sm text-gray-700 whitespace-pre-wrap">{e.content}</p>
                          )}
                          {e.wrongReasons && (
                            <div className="mt-1.5 p-2 bg-red-50 rounded-lg">
                              <span className="text-xs font-medium text-red-600">❌ 错因：</span>
                              <span className="text-sm text-red-700">{e.wrongReasons}</span>
                            </div>
                          )}
                          {Array.isArray(e.tags) && e.tags.length > 0 && (
                            <div className="flex gap-1 mt-1.5">
                              {e.tags.map(t => (
                                <span key={t} className="text-xs px-1.5 py-0.5 rounded bg-gray-200 text-gray-600">{t}</span>
                              ))}
                            </div>
                          )}
                          <div className="flex justify-end gap-1 mt-1.5">
                            <button onClick={() => navigate(`/journal/edit/${e.id}`)}
                              className="w-6 h-6 rounded-full bg-blue-50 text-blue-400 flex items-center justify-center text-xs">✎</button>
                            <button onClick={() => setDeleteTarget(e)}
                              className="w-6 h-6 rounded-full bg-red-50 text-red-400 flex items-center justify-center text-xs">🗑</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })
      )}

      <Button className="w-full" onClick={() => navigate('/journal/new')}>+ 写日记</Button>

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
