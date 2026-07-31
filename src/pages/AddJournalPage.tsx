import { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useAppStore } from '@/stores/app.store';
import { useUIStore } from '@/stores/ui.store';
import { journalService } from '@/services/journal.service';
import { JOURNAL_CATEGORIES, CATEGORY_ICONS } from '@/models/journal';

export function AddJournalPage() {
  const { entryId } = useParams<{ entryId: string }>();
  const [searchParams] = useSearchParams();
  const { setTitle } = useAppStore();
  const toast = useUIStore(s => s.toast);
  const navigate = useNavigate();
  const isEdit = !!entryId;

  const [date, setDate] = useState(searchParams.get('date') || new Date().toISOString().slice(0, 10));
  const [category, setCategory] = useState(JOURNAL_CATEGORIES[0]);
  const [content, setContent] = useState('');
  const [wrongReasons, setWrongReasons] = useState('');
  const [tags, setTags] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setTitle(isEdit ? '编辑日记' : '写日记');
    if (entryId) {
      journalService.getById(entryId).then(e => {
        if (!e) { navigate('/journal'); return; }
        setDate(e.date);
        setCategory(e.category);
        setContent(e.content);
        setWrongReasons(e.wrongReasons);
        setTags(e.tags.join('，'));
      });
    }
  }, [entryId]);

  const submit = async () => {
    if (!content.trim() && !wrongReasons.trim()) { toast('请填写内容或错因', 'error'); return; }
    setSaving(true);
    try {
      if (isEdit && entryId) {
        await journalService.update(entryId, {
          date,
          category,
          content: content.trim(),
          wrongReasons: wrongReasons.trim(),
          tags: tags.split(/[,，\s]+/).filter(Boolean),
        });
      } else {
        await journalService.create({
          date,
          category,
          content: content.trim(),
          wrongReasons: wrongReasons.trim(),
          tags: tags.split(/[,，\s]+/).filter(Boolean),
        });
      }
      toast(isEdit ? '已更新' : '已保存', 'success');
      navigate('/journal');
    } catch {
      toast('保存失败', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4 pb-6">
      {/* Date */}
      <div>
        <label className="text-xs text-gray-500 mb-1 block">日期</label>
        <input type="date" value={date} onChange={e => setDate(e.target.value)}
          className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-base outline-none focus:border-primary-400 bg-white" />
      </div>

      {/* Category */}
      <div>
        <label className="text-xs text-gray-500 mb-1 block">模块</label>
        <div className="grid grid-cols-3 gap-2">
          {JOURNAL_CATEGORIES.map(c => (
            <button key={c} onClick={() => setCategory(c)}
              className={`py-2.5 rounded-xl text-sm font-medium ${category === c ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600'}`}
            >{CATEGORY_ICONS[c]} {c}</button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div>
        <label className="text-xs text-gray-500 mb-1 block">学习内容</label>
        <textarea value={content} onChange={e => setContent(e.target.value)}
          className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-base outline-none focus:border-primary-400 min-h-[100px] resize-y"
          placeholder="今天学了什么知识点..." autoFocus />
      </div>

      {/* Wrong reasons */}
      <div>
        <label className="text-xs text-gray-500 mb-1 block">❌ 错题原因分析</label>
        <textarea value={wrongReasons} onChange={e => setWrongReasons(e.target.value)}
          className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-base outline-none focus:border-primary-400 min-h-[80px] resize-y bg-red-50"
          placeholder="为什么做错了？哪个知识点不熟？" />
      </div>

      {/* Tags */}
      <div>
        <label className="text-xs text-gray-500 mb-1 block">标签</label>
        <input value={tags} onChange={e => setTags(e.target.value)}
          className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-base outline-none focus:border-primary-400"
          placeholder="多个标签用逗号分隔" />
      </div>

      <div className="flex gap-3">
        <button type="button"
          className="flex-1 py-2.5 text-sm font-medium rounded-lg bg-gray-200 text-gray-700 active:bg-gray-300 min-h-[44px]"
          onTouchEnd={(e) => { e.preventDefault(); navigate('/journal'); }}
        >取消</button>
        <button type="button"
          className="flex-1 py-2.5 text-sm font-medium rounded-lg bg-primary-600 text-white active:bg-primary-700 min-h-[44px] disabled:opacity-50"
          disabled={saving}
          onTouchEnd={(e) => { e.preventDefault(); submit(); }}
        >{saving ? '保存中...' : isEdit ? '更新' : '保存'}</button>
      </div>
    </div>
  );
}
