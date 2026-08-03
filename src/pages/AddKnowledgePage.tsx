import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppStore } from '@/stores/app.store';
import { useUIStore } from '@/stores/ui.store';
import { knowledgeService } from '@/services/knowledge.service';
import { folderService } from '@/services/folder.service';
import { compressImage } from '@/lib/compression';
import { MAX_PHOTOS_PER_QUESTION } from '@/lib/constants';
import { StarRating } from '@/components/ui/StarRating';
import type { Folder } from '@/models';

export function AddKnowledgePage() {
  const { folderId } = useParams<{ folderId: string }>();
  const navigate = useNavigate();
  const { setTitle } = useAppStore();
  const toast = useUIStore(s => s.toast);

  const [folder, setFolder] = useState<Folder | null>(null);
  const [title, setTitle_] = useState('');
  const [content, setContent] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [tags, setTags] = useState('');
  const [rating, setRating] = useState(3);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTitle('添加知识点');
    if (folderId) {
      folderService.getById(folderId).then(f => { if (f) setFolder(f); });
    }
  }, [folderId]);

  const handlePhotoAdd = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || photos.length + files.length > MAX_PHOTOS_PER_QUESTION) {
      toast(`最多${MAX_PHOTOS_PER_QUESTION}张`, 'error');
      return;
    }
    for (let i = 0; i < files.length; i++) {
      try {
        const compressed = await compressImage(files[i]);
        setPhotos(prev => [...prev, compressed]);
      } catch { toast('图片处理失败', 'error'); }
    }
    if (fileRef.current) fileRef.current.value = '';
  };

  const handleSubmit = async () => {
    if (!title.trim()) { toast('标题不能为空', 'error'); return; }
    if (!folderId) { toast('请先选择文件夹', 'error'); return; }
    setSaving(true);
    try {
      const kp = await knowledgeService.create({
        folderId,
        categoryId: folder?.categoryId ?? '',
        title: title.trim(),
        content,
        photos,
        tags: tags.split(/[,，\s]+/).filter(Boolean),
        rating,
      });
      toast('添加成功', 'success');
      navigate(`/knowledge/${kp.id}`, { replace: true });
    } catch {
      toast('保存失败', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4 pb-24">
      {folder && <div className="text-sm text-gray-500">保存到：📂 {folder.name}</div>}

      <div>
        <label className="text-xs text-gray-500 mb-1 block">标题 *</label>
        <input value={title} onChange={e => setTitle_(e.target.value)}
          className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-base outline-none focus:border-primary-400"
          placeholder="例如：增长率计算公式" autoFocus />
      </div>

      <div>
        <label className="text-xs text-gray-500 mb-1 block">重要程度</label>
        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
          <StarRating value={rating} onChange={setRating} size="md" />
          <span className="text-xs text-gray-400">
            {rating === 5 ? '非常重要' : rating === 4 ? '重要' : rating === 3 ? '一般' : rating <= 2 ? '了解即可' : ''}
          </span>
        </div>
      </div>

      <div>
        <label className="text-xs text-gray-500 mb-1 block">内容</label>
        <textarea value={content} onChange={e => setContent(e.target.value)}
          className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-base outline-none focus:border-primary-400 min-h-[100px] resize-y"
          placeholder="知识点详细说明..." />
      </div>

      <div>
        <label className="text-xs text-gray-500 mb-1 block">图片</label>
        <div className="flex flex-wrap gap-2">
          {photos.map((p, idx) => (
            <div key={idx} className="relative w-16 h-16 rounded-lg overflow-hidden bg-gray-100">
              <img src={p} alt="" className="w-full h-full object-cover" />
              <button onClick={() => setPhotos(prev => prev.filter((_, i) => i !== idx))}
                className="absolute top-0 right-0 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-[10px]">✕</button>
            </div>
          ))}
          {photos.length < MAX_PHOTOS_PER_QUESTION && (
            <label className="w-16 h-16 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400 active:border-primary-400">
              <span className="text-xl">+</span>
              <input ref={fileRef} type="file" accept="image/*" multiple onChange={handlePhotoAdd} className="hidden" />
            </label>
          )}
        </div>
      </div>

      <div>
        <label className="text-xs text-gray-500 mb-1 block">标签</label>
        <input value={tags} onChange={e => setTags(e.target.value)}
          className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-base outline-none focus:border-primary-400"
          placeholder="多个标签用逗号分隔" />
      </div>

      <div className="sticky bottom-0 -mx-4 px-4 pt-3 pb-[calc(14px+env(safe-area-inset-bottom,0px))] bg-gray-50/95 backdrop-blur-md border-t border-gray-100 z-10 flex gap-3">
        <button type="button"
          className="flex-1 py-2.5 text-sm font-medium rounded-lg bg-gray-200 text-gray-700 active:bg-gray-300 min-h-[44px]"
          onTouchEnd={(e) => { e.preventDefault(); navigate(-1); }}
        >取消</button>
        <button type="button"
          className="flex-1 py-2.5 text-sm font-medium rounded-lg bg-cyan-600 text-white active:bg-cyan-700 min-h-[44px] disabled:opacity-50"
          disabled={saving}
          onTouchEnd={(e) => { e.preventDefault(); handleSubmit(); }}
        >{saving ? '保存中...' : '保存'}</button>
      </div>
    </div>
  );
}
