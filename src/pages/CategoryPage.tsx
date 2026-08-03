import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppStore } from '@/stores/app.store';
import { useUIStore } from '@/stores/ui.store';
import { categoryService } from '@/services/category.service';
import { folderService } from '@/services/folder.service';
import { syncService } from '@/services/sync.service';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import type { Category, Folder } from '@/models';

export function CategoryPage() {
  const { categoryId } = useParams<{ categoryId: string }>();
  const { setTitle } = useAppStore();
  const toast = useUIStore(s => s.toast);
  const navigate = useNavigate();
  const [category, setCategory] = useState<Category | null>(null);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingFolder, setEditingFolder] = useState<Folder | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Folder | null>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const descRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!categoryId) return;
    loadData();
  }, [categoryId]);

  const loadData = async () => {
    if (!categoryId) return;
    const cat = await categoryService.getById(categoryId);
    if (!cat) { navigate('/'); return; }
    setCategory(cat);
    setTitle(cat.name);
    const flds = await folderService.getByCategory(categoryId);
    setFolders(flds);
    const counts = await Promise.all(flds.map(f => folderService.getQuestionCount(f.id)));
    const c: Record<string, number> = {};
    flds.forEach((f, i) => { c[f.id] = counts[i]; });
    setCounts(c);
  };

  const openAdd = () => {
    setEditingFolder(null);
    setShowForm(true);
    setTimeout(() => {
      if (nameRef.current) { nameRef.current.value = ''; nameRef.current.focus(); }
      if (descRef.current) descRef.current.value = '';
    }, 50);
  };

  const openEdit = (f: Folder) => {
    setEditingFolder(f);
    setShowForm(true);
    setTimeout(() => {
      if (nameRef.current) { nameRef.current.value = f.name; nameRef.current.focus(); }
      if (descRef.current) descRef.current.value = f.description ?? '';
    }, 50);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingFolder(null);
  };

  const doSave = () => {
    const name = (nameRef.current?.value ?? '').trim();
    if (!name || !categoryId || saving) return;
    setSaving(true);

    const desc = (descRef.current?.value ?? '').trim();
    const promise = editingFolder
      ? folderService.update(editingFolder.id, { name, description: desc })
      : folderService.create({ categoryId, name, description: desc });

    promise
      .then(async () => {
        toast(editingFolder ? '已更新' : '文件夹已创建', 'success');
        const flds = await folderService.getByCategory(categoryId!);
        const changed = editingFolder
          ? flds.find(f => f.id === editingFolder.id)
          : flds.find(f => f.name === name);
        if (changed) syncService.syncOne('folders', changed);
        closeForm();
        loadData();
      })
      .catch((e: unknown) => {
        alert('失败: ' + (e instanceof Error ? e.message : String(e)));
      })
      .finally(() => setSaving(false));
  };

  const togglePinFolder = async (f: Folder) => {
    await folderService.setPinned(f.id, !f.pinnedAt);
    loadData();
  };

  if (!category) return null;

  return (
    <div className="space-y-3 pb-4">
      <div className="bg-white rounded-xl p-4 shadow-sm flex items-center gap-3">
        <span className="text-3xl">{category.icon}</span>
        <div>
          <div className="font-semibold">{category.name}</div>
          <div className="text-sm text-gray-500">{folders.length} 个文件夹</div>
        </div>
      </div>

      <div className="space-y-2">
        {folders.map(f => (
          <div
            key={f.id}
            className={`rounded-xl p-4 shadow-sm flex items-center justify-between ${
              f.pinnedAt ? 'bg-amber-50 border border-amber-200' : 'bg-white'
            }`}
          >
            <button
              onClick={() => navigate(`/folder/${f.id}`)}
              className="flex-1 text-left active:bg-gray-50 -m-2 p-2 rounded-lg"
            >
              <div className={`font-medium text-sm ${f.pinnedAt ? 'text-amber-700' : ''}`}>
                {f.pinnedAt && <span className="text-amber-500 text-xs mr-1">📌</span>}
                {f.name}
              </div>
              {f.description && <div className="text-xs text-gray-400 mt-0.5">{f.description}</div>}
            </button>
            <div className="flex items-center gap-1 ml-2">
              <span className="text-xs text-gray-400">{counts[f.id] ?? 0} 题</span>
              <button
                onClick={() => togglePinFolder(f)}
                title={f.pinnedAt ? '取消置顶' : '置顶'}
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs ${
                  f.pinnedAt ? 'bg-amber-100 text-amber-500' : 'bg-gray-50 text-gray-400'
                }`}
              >📌</button>
              <button
                onClick={() => openEdit(f)}
                className="w-7 h-7 rounded-full bg-blue-50 text-blue-400 flex items-center justify-center text-xs active:bg-blue-100"
              >✎</button>
              <button
                onClick={() => setDeleteTarget(f)}
                className="w-7 h-7 rounded-full bg-red-50 text-red-400 flex items-center justify-center text-xs active:bg-red-100"
              >🗑</button>
              <span className="text-gray-300 ml-1">›</span>
            </div>
          </div>
        ))}
      </div>

      {folders.length === 0 && !showForm && (
        <EmptyState icon="📂" title="还没有文件夹" description="点击下方按钮创建" />
      )}

      {showForm ? (
        <div className="bg-white rounded-xl p-4 shadow-sm border-2 border-primary-400 space-y-3">
          <input
            ref={nameRef}
            autoFocus
            placeholder="文件夹名称"
            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-base outline-none focus:border-primary-400"
            onKeyDown={e => { if (e.key === 'Enter') doSave(); }}
          />
          <input
            ref={descRef}
            placeholder="描述（可选）"
            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-base outline-none focus:border-primary-400"
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
            >{saving ? '保存中...' : editingFolder ? '更新' : '创建'}</button>
          </div>
        </div>
      ) : (
        <Button className="w-full" onClick={openAdd}>+ 新建文件夹</Button>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={async () => {
          if (!deleteTarget) return;
          try {
            await folderService.remove(deleteTarget.id);
            toast('已删除', 'success');
            setDeleteTarget(null);
            loadData();
          } catch (e: unknown) {
            toast('删除失败: ' + (e instanceof Error ? e.message : ''), 'error');
          }
        }}
        title="确认删除"
        message={`删除文件夹「${deleteTarget?.name}」及其所有错题？`}
        confirmText="删除"
        danger
      />
    </div>
  );
}
