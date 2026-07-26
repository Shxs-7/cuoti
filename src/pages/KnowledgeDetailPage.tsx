import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppStore } from '@/stores/app.store';
import { useUIStore } from '@/stores/ui.store';
import { knowledgeService } from '@/services/knowledge.service';
import { syncService } from '@/services/sync.service';
import { compressImage } from '@/lib/compression';
import { MAX_PHOTOS_PER_QUESTION } from '@/lib/constants';
import { Badge } from '@/components/ui/Badge';
import type { KnowledgePoint } from '@/models';
import { formatDateTime } from '@/lib/date';

export function KnowledgeDetailPage() {
  const { kpId } = useParams<{ kpId: string }>();
  const { setTitle } = useAppStore();
  const toast = useUIStore(s => s.toast);
  const navigate = useNavigate();
  const [kp, setKp] = useState<KnowledgePoint | null>(null);
  const [showPhoto, setShowPhoto] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [eTitle, setETitle] = useState('');
  const [eContent, setEContent] = useState('');
  const [ePhotos, setEPhotos] = useState<string[]>([]);
  const [eTags, setETags] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!kpId) return;
    load();
  }, [kpId]);

  const load = async () => {
    if (!kpId) return;
    const k = await knowledgeService.getById(kpId);
    if (!k) { navigate('/'); return; }
    setKp(k);
    setTitle(k.title || '知识点');
  };

  const startEdit = () => {
    if (!kp) return;
    setETitle(kp.title);
    setEContent(kp.content);
    setEPhotos([...kp.photos]);
    setETags(kp.tags.join('，'));
    setEditing(true);
  };

  const handlePhotoAdd = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || ePhotos.length + files.length > MAX_PHOTOS_PER_QUESTION) {
      toast(`最多${MAX_PHOTOS_PER_QUESTION}张`, 'error');
      return;
    }
    for (let i = 0; i < files.length; i++) {
      try {
        const compressed = await compressImage(files[i]);
        setEPhotos(prev => [...prev, compressed]);
      } catch { toast('图片处理失败', 'error'); }
    }
    if (fileRef.current) fileRef.current.value = '';
  };

  const saveEdit = async () => {
    if (!kpId || !eTitle.trim()) { toast('标题不能为空', 'error'); return; }
    setSaving(true);
    try {
      const updateData = {
        title: eTitle.trim(),
        content: eContent,
        photos: ePhotos,
        tags: eTags.split(/[,，\s]+/).filter(Boolean),
      };
      await knowledgeService.update(kpId, updateData);
      // Also push to cloud immediately
      const updated = await knowledgeService.getById(kpId);
      if (updated) syncService.syncOne('knowledge_points', updated);
      toast('已更新', 'success');
      setEditing(false);
      load();
    } catch (err: unknown) {
      toast('保存失败: ' + (err instanceof Error ? err.message : String(err)), 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!kpId) return;
    if (!confirm('删除此知识点？')) return;
    await knowledgeService.remove(kpId);
    toast('已删除', 'success');
    navigate(-1);
  };

  if (!kp) return null;

  return (
    <div className="space-y-4 pb-6">
      {editing ? (
        <>
          <div className="bg-white rounded-xl p-4 shadow-sm space-y-3">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">标题 *</label>
              <input value={eTitle} onChange={e => setETitle(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-base outline-none focus:border-primary-400" autoFocus />
            </div>

            <div>
              <label className="text-xs text-gray-500 mb-1 block">内容</label>
              <textarea value={eContent} onChange={e => setEContent(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:border-primary-400 min-h-[100px] resize-y" />
            </div>

            <div>
              <label className="text-xs text-gray-500 mb-1 block">图片</label>
              <div className="flex flex-wrap gap-2">
                {ePhotos.map((p, idx) => (
                  <div key={idx} className="relative w-16 h-16 rounded-lg overflow-hidden bg-gray-100">
                    <img src={p} alt="" className="w-full h-full object-cover" />
                    <button onClick={() => setEPhotos(prev => prev.filter((_, i) => i !== idx))}
                      className="absolute top-0 right-0 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-[10px]">✕</button>
                  </div>
                ))}
                {ePhotos.length < MAX_PHOTOS_PER_QUESTION && (
                  <label className="w-16 h-16 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400 active:border-primary-400">
                    <span className="text-xl">+</span>
                    <input ref={fileRef} type="file" accept="image/*" multiple onChange={handlePhotoAdd} className="hidden" />
                  </label>
                )}
              </div>
            </div>

            <div>
              <label className="text-xs text-gray-500 mb-1 block">标签</label>
              <input value={eTags} onChange={e => setETags(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-base outline-none focus:border-primary-400"
                placeholder="多个标签用逗号分隔" />
            </div>

            <div className="flex gap-2 pt-2">
              <button type="button"
                className="flex-1 py-2.5 text-sm font-medium rounded-lg bg-gray-200 text-gray-700 active:bg-gray-300 min-h-[44px]"
                onTouchEnd={(e) => { e.preventDefault(); setEditing(false); }}
              >取消</button>
              <button type="button"
                className="flex-1 py-2.5 text-sm font-medium rounded-lg bg-cyan-600 text-white active:bg-cyan-700 min-h-[44px] disabled:opacity-50"
                disabled={saving}
                onTouchEnd={(e) => { e.preventDefault(); saveEdit(); }}
              >{saving ? '保存中...' : '保存修改'}</button>
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: kp.color }} />
                  <span className="text-xs text-gray-400">📚 知识点</span>
                </div>
                <h2 className="text-lg font-semibold">{kp.title || '无标题'}</h2>
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  <span className="text-xs text-gray-400">{formatDateTime(kp.createdAt)}</span>
                  {kp.tags.map(t => <Badge key={t} text={t} />)}
                </div>
              </div>
              <button onClick={startEdit}
                className="ml-2 w-8 h-8 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center text-sm active:bg-blue-100"
              >✎</button>
            </div>
          </div>

          {kp.content && (
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <h3 className="text-sm font-medium text-gray-500 mb-1">内容</h3>
              <p className="text-sm whitespace-pre-wrap">{kp.content}</p>
            </div>
          )}

          {kp.photos.length > 0 && (
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <h3 className="text-sm font-medium text-gray-500 mb-2">图片</h3>
              <div className="flex flex-wrap gap-2">
                {kp.photos.map((p, idx) => (
                  <img key={idx} src={p} alt="" onClick={() => setShowPhoto(p)}
                    className="w-24 h-24 object-cover rounded-lg cursor-pointer active:opacity-80" />
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <button
              onClick={() => navigate(`/kp/new/${kp.folderId}`)}
              className="flex-1 py-2.5 text-sm font-medium rounded-lg bg-gray-200 text-gray-700 active:bg-gray-300 min-h-[44px]"
              onTouchEnd={(e) => { e.preventDefault(); navigate(`/kp/new/${kp.folderId}`); }}
            >+ 新知识点</button>
            <button
              onClick={handleDelete}
              className="flex-1 py-2.5 text-sm font-medium rounded-lg bg-red-500 text-white active:bg-red-600 min-h-[44px]"
              onTouchEnd={(e) => { e.preventDefault(); handleDelete(); }}
            >删除</button>
          </div>
        </>
      )}

      {showPhoto && (
        <div className="fixed inset-0 z-[60] bg-black/90 flex items-center justify-center" onClick={() => setShowPhoto(null)}>
          <img src={showPhoto} alt="" className="max-w-full max-h-full object-contain p-4" />
          <button onClick={() => setShowPhoto(null)}
            className="absolute top-4 right-4 w-8 h-8 bg-white/20 text-white rounded-full flex items-center justify-center">✕</button>
        </div>
      )}
    </div>
  );
}
