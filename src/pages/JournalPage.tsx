import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '@/stores/app.store';
import { useUIStore } from '@/stores/ui.store';
import { journalService } from '@/services/journal.service';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import type { JournalEntry } from '@/models';
import { CATEGORY_ICONS } from '@/models/journal';

export function JournalPage() {
  const { setTitle } = useAppStore();
  const toast = useUIStore(s => s.toast);
  const navigate = useNavigate();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [selectedCat, setSelectedCat] = useState('');

  useEffect(() => {
    setTitle('学习日记');
    load();
  }, [selectedCat]);

  const load = async () => {
    const all = selectedCat
      ? await journalService.getByCategory(selectedCat)
      : await journalService.getAll();
    setEntries(all);
  };

  // Group by date
  const grouped = new Map<string, JournalEntry[]>();
  for (const e of entries) {
    const list = grouped.get(e.date) || [];
    list.push(e);
    grouped.set(e.date, list);
  }

  const handleDelete = async (id: string) => {
    if (!confirm('删除这条日记？')) return;
    await journalService.remove(id);
    toast('已删除', 'success');
    load();
  };

  return (
    <div className="space-y-4 pb-4">
      {/* Category filter */}
      <div className="flex flex-wrap gap-1.5">
        <button onClick={() => setSelectedCat('')}
          className={`px-3 py-1 rounded-full text-xs font-medium ${!selectedCat ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-500'}`}
        >全部</button>
        {['资料分析', '言语理解', '类比推理', '定义判断', '图形推理', '逻辑判断'].map(c => (
          <button key={c} onClick={() => setSelectedCat(c)}
            className={`px-3 py-1 rounded-full text-xs font-medium ${selectedCat === c ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-500'}`}
          >{CATEGORY_ICONS[c]} {c}</button>
        ))}
      </div>

      {entries.length === 0 ? (
        <EmptyState icon="📔" title="还没有日记" description="记录每日学习内容和错题原因" />
      ) : (
        [...grouped.entries()].map(([date, dayEntries]) => (
          <div key={date}>
            <h3 className="text-sm font-semibold text-gray-500 mb-2">{date}</h3>
            <div className="space-y-2">
              {dayEntries.map(e => (
                <div key={e.id} className="bg-white rounded-xl p-4 shadow-sm">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2 mb-1">
                      <span>{CATEGORY_ICONS[e.category] || '📝'}</span>
                      <span className="text-sm font-medium">{e.category}</span>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => navigate(`/journal/edit/${e.id}`)}
                        className="w-6 h-6 rounded-full bg-blue-50 text-blue-400 flex items-center justify-center text-xs">✎</button>
                      <button onClick={() => handleDelete(e.id)}
                        className="w-6 h-6 rounded-full bg-red-50 text-red-400 flex items-center justify-center text-xs">🗑</button>
                    </div>
                  </div>
                  {e.content && <p className="text-sm text-gray-700 whitespace-pre-wrap">{e.content}</p>}
                  {e.wrongReasons && (
                    <div className="mt-2 p-2 bg-red-50 rounded-lg">
                      <span className="text-xs font-medium text-red-600">❌ 错因：</span>
                      <span className="text-sm text-red-700">{e.wrongReasons}</span>
                    </div>
                  )}
                  {e.tags.length > 0 && (
                    <div className="flex gap-1 mt-2">
                      {e.tags.map(t => (
                        <span key={t} className="text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-500">{t}</span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))
      )}

      <Button className="w-full" onClick={() => navigate('/journal/new')}>+ 写日记</Button>
    </div>
  );
}
