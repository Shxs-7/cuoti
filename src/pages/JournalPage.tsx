import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '@/stores/app.store';
import { journalService } from '@/services/journal.service';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { CATEGORY_ICONS } from '@/models/journal';

export function JournalPage() {
  const { setTitle } = useAppStore();
  const navigate = useNavigate();
  const [dates, setDates] = useState<{ date: string; count: number; cats: string[] }[]>([]);

  useEffect(() => {
    setTitle('学习日记');
    load();
  }, []);

  const load = async () => {
    const all = await journalService.getAll();
    // Group by date
    const byDate = new Map<string, Set<string>>();
    for (const e of all) {
      const set = byDate.get(e.date) || new Set<string>();
      set.add(e.category);
      byDate.set(e.date, set);
    }
    const list = [...byDate.entries()]
      .map(([date, cats]) => ({ date, count: cats.size, cats: [...cats] }))
      .sort((a, b) => (a.date < b.date ? 1 : -1));
    setDates(list);
  };

  return (
    <div className="space-y-3 pb-4">
      {dates.length === 0 ? (
        <EmptyState icon="📔" title="还没有日记" description="每天记录学习内容和错题原因" />
      ) : (
        dates.map(d => (
          <button
            key={d.date}
            onClick={() => navigate(`/journal/day/${d.date}`)}
            className="w-full bg-white rounded-xl shadow-sm text-left active:bg-gray-50 overflow-hidden"
          >
            <div className="px-4 py-3 bg-primary-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-lg">📅</span>
                <span className="font-semibold text-primary-700">{d.date}</span>
              </div>
              <span className="text-xs text-primary-400">{d.count} 个科目</span>
            </div>
            <div className="px-4 py-2.5 flex items-center gap-1.5 flex-wrap">
              {d.cats.map(c => (
                <span key={c} className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                  {CATEGORY_ICONS[c] || '📝'} {c}
                </span>
              ))}
              <span className="text-gray-300 ml-auto">›</span>
            </div>
          </button>
        ))
      )}

      <Button className="w-full" onClick={() => navigate('/journal/new')}>+ 写日记</Button>
    </div>
  );
}
