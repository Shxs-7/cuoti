import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '@/stores/app.store';
import { categoryService } from '@/services/category.service';
import { questionService } from '@/services/question.service';
import { reviewService } from '@/services/review.service';
import { SearchBar } from '@/components/ui/SearchBar';
import { EmptyState } from '@/components/ui/EmptyState';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import type { Category, Question } from '@/models';
import { formatDate } from '@/lib/date';
import { useUIStore } from '@/stores/ui.store';

export function HomePage() {
  const { setTitle, setShowBack } = useAppStore();
  const navigate = useNavigate();
  const toast = useUIStore(s => s.toast);
  const [categories, setCategories] = useState<Category[]>([]);
  const [recentQuestions, setRecentQuestions] = useState<Question[]>([]);
  const [stats, setStats] = useState({ total: 0, reviewed: 0, avgMastery: 0, needReview: 0 });
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const [editingCat, setEditingCat] = useState<Category | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTitle('公考错题本');
    setShowBack(false);
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [cats, recent, s] = await Promise.all([
        categoryService.getAll(),
        questionService.getRecent(5),
        reviewService.getStats(),
      ]);
      setCategories(cats);
      setRecentQuestions(recent);
      setStats(s);
    } catch (e) {
      console.error('Load error:', e);
    }
  };

  const openAdd = () => {
    setEditingCat(null);
    setShowForm(true);
    setTimeout(() => { if (inputRef.current) { inputRef.current.value = ''; inputRef.current.focus(); } }, 50);
  };

  const openEdit = (cat: Category) => {
    setEditingCat(cat);
    setShowForm(true);
    setTimeout(() => { if (inputRef.current) { inputRef.current.value = cat.name; inputRef.current.focus(); } }, 50);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingCat(null);
  };

  const doSave = () => {
    const name = (inputRef.current?.value ?? '').trim();
    if (!name || saving) return;
    setSaving(true);

    const promise = editingCat
      ? categoryService.update(editingCat.id, { name })
      : categoryService.create({ name, icon: '📋', color: '#6366f1' });

    promise
      .then(() => {
        toast(editingCat ? '已更新' : '分类已创建', 'success');
        closeForm();
        loadData();
      })
      .catch((e: unknown) => {
        alert('失败: ' + (e instanceof Error ? e.message : String(e)));
      })
      .finally(() => setSaving(false));
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await categoryService.remove(deleteTarget.id);
      toast('已删除', 'success');
      setDeleteTarget(null);
      loadData();
    } catch (e: unknown) {
      toast('失败: ' + (e instanceof Error ? e.message : ''), 'error');
    }
  };

  return (
    <div className="space-y-5 pb-4">
      <SearchBar />

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-xl p-3 shadow-sm">
          <div className="text-2xl font-bold text-primary-600">{stats.total}</div>
          <div className="text-xs text-gray-500 mt-0.5">总错题数</div>
        </div>
        <div className="bg-white rounded-xl p-3 shadow-sm">
          <div className="text-2xl font-bold text-orange-500">{stats.needReview}</div>
          <div className="text-xs text-gray-500 mt-0.5">待复习</div>
        </div>
        <div className="bg-white rounded-xl p-3 shadow-sm">
          <div className="text-2xl font-bold text-green-600">{stats.reviewed}</div>
          <div className="text-xs text-gray-500 mt-0.5">已复习</div>
        </div>
        <div className="bg-white rounded-xl p-3 shadow-sm">
          <div className="text-2xl font-bold text-purple-600">{stats.avgMastery}%</div>
          <div className="text-xs text-gray-500 mt-0.5">平均掌握度</div>
        </div>
      </div>

      {/* Categories */}
      <div>
        <h2 className="text-base font-semibold text-gray-700 mb-2">分类</h2>
        <div className="grid grid-cols-2 gap-2.5">
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => navigate(`/category/${cat.id}`)}
              className="bg-white rounded-xl p-4 shadow-sm text-left active:scale-[0.98] transition-transform relative group"
            >
              <span className="text-2xl">{cat.icon}</span>
              <div className="font-medium text-sm mt-1.5 pr-8">{cat.name}</div>
              <div className="absolute top-2 right-2 flex gap-0.5">
                <button
                  onClick={(ev) => { ev.stopPropagation(); openEdit(cat); }}
                  className="w-6 h-6 rounded-full bg-blue-50 text-blue-400 flex items-center justify-center text-xs active:bg-blue-100"
                >✎</button>
                <button
                  onClick={(ev) => { ev.stopPropagation(); setDeleteTarget(cat); }}
                  className="w-6 h-6 rounded-full bg-red-50 text-red-400 flex items-center justify-center text-xs active:bg-red-100"
                >🗑</button>
              </div>
            </button>
          ))}

          {showForm ? (
            <div className="col-span-2 bg-white rounded-xl p-4 shadow-sm border-2 border-primary-400">
              <input
                ref={inputRef}
                autoFocus
                placeholder="分类名称"
                defaultValue={editingCat?.name ?? ''}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-base outline-none focus:border-primary-400 mb-3"
                onKeyDown={e => { if (e.key === 'Enter') doSave(); }}
              />
              <div className="flex gap-2">
                <button type="button"
                  className="flex-1 py-2.5 text-sm font-medium rounded-lg bg-gray-200 text-gray-700 active:bg-gray-300 min-h-[44px]"
                  onTouchEnd={(e) => { e.preventDefault(); closeForm(); }}
                >取消</button>
                <button type="button"
                  className="flex-1 py-2.5 text-sm font-medium rounded-lg bg-primary-600 text-white active:bg-primary-700 min-h-[44px] disabled:opacity-50"
                  disabled={saving}
                  onTouchEnd={(e) => { e.preventDefault(); doSave(); }}
                >{saving ? '保存中...' : editingCat ? '更新' : '创建'}</button>
              </div>
            </div>
          ) : (
            <button
              onClick={openAdd}
              className="bg-white/50 border-2 border-dashed border-gray-300 rounded-xl p-4 flex items-center justify-center text-gray-400 active:border-primary-400 active:text-primary-500 min-h-[80px]"
            >
              <span className="text-xl mr-1.5">+</span>
              <span className="text-sm">添加分类</span>
            </button>
          )}
        </div>
      </div>

      {/* Recent Questions */}
      <div>
        <h2 className="text-base font-semibold text-gray-700 mb-2">最近错题</h2>
        {recentQuestions.length === 0 ? (
          <EmptyState icon="📭" title="还没有错题" description="进入分类添加第一道错题吧" />
        ) : (
          <div className="space-y-2">
            {recentQuestions.map(q => (
              <button
                key={q.id}
                onClick={() => navigate(`/question/${q.id}`)}
                className="w-full bg-white rounded-xl p-3 shadow-sm text-left active:bg-gray-50"
              >
                <div className="font-medium text-sm truncate">{q.title || '无标题'}</div>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="text-xs text-gray-400">{formatDate(q.createdAt)}</span>
                  {q.tags.map(t => (
                    <span key={t} className="text-xs px-1.5 py-0.5 rounded bg-blue-50 text-blue-500">{t}</span>
                  ))}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="text-center text-xs text-gray-300 pt-2">
        更新于 {__BUILD_TIME__}
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="确认删除"
        message={`删除分类「${deleteTarget?.name}」及其所有文件夹和错题？`}
        confirmText="删除"
        danger
      />
    </div>
  );
}
