import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppStore } from '@/stores/app.store';
import { useUIStore } from '@/stores/ui.store';
import { questionService } from '@/services/question.service';
import { tagService } from '@/services/tag.service';
import { folderService } from '@/services/folder.service';
import { compressImage } from '@/lib/compression';
import { MAX_PHOTOS_PER_QUESTION } from '@/lib/constants';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';
import { TagInput } from '@/components/ui/TagInput';
import type { Tag, Folder } from '@/models';
import { DIFFICULTY_LABELS } from '@/models/question';

export function AddQuestionPage() {
  const { folderId } = useParams<{ folderId: string }>();
  const navigate = useNavigate();
  const { setTitle } = useAppStore();
  const toast = useUIStore(s => s.toast);

  const [folder, setFolder] = useState<Folder | null>(null);
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [title, setTitle_] = useState('');
  const [content, setContent] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [answer, setAnswer] = useState('');
  const [wrongAnswer, setWrongAnswer] = useState('');
  const [analysis, setAnalysis] = useState('');
  const [source, setSource] = useState('');
  const [difficulty, setDifficulty] = useState(3);
  const [tags, setTags] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTitle('添加错题');
    loadData();
  }, [folderId]);

  const loadData = async () => {
    const t = await tagService.getAll();
    setAllTags(t);
    if (folderId) {
      const f = await folderService.getById(folderId);
      if (f) setFolder(f);
    }
  };

  const handlePhotoAdd = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    if (photos.length + files.length > MAX_PHOTOS_PER_QUESTION) {
      toast(`最多${MAX_PHOTOS_PER_QUESTION}张图片`, 'error');
      return;
    }
    for (let i = 0; i < files.length; i++) {
      try {
        const compressed = await compressImage(files[i]);
        setPhotos(prev => [...prev, compressed]);
      } catch {
        toast('图片处理失败', 'error');
      }
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removePhoto = (idx: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async () => {
    if (!title.trim()) { toast('标题不能为空', 'error'); return; }
    if (!folderId) { toast('请先选择文件夹', 'error'); return; }

    setSaving(true);
    try {
      const q = await questionService.create({
        folderId,
        categoryId: folder?.categoryId ?? '',
        title: title.trim(),
        content,
        photos,
        answer,
        wrongAnswer,
        analysis,
        source,
        difficulty,
        tags,
      });
      toast('添加成功', 'success');
      navigate(`/question/${q.id}`, { replace: true });
    } catch {
      toast('保存失败', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4 pb-6">
      {/* Folder info */}
      {folder && (
        <div className="text-sm text-gray-500">
          保存到：📂 {folder.name}
        </div>
      )}

      <Input label="标题 *" value={title} onChange={e => setTitle_(e.target.value)} placeholder="输入题目简要标题" />

      <Textarea label="题目内容" value={content} onChange={e => setContent(e.target.value)} placeholder="粘贴或输入完整题目内容" />

      {/* Photos */}
      <div>
        <label className="block text-sm font-medium text-gray-600 mb-1">图片 ({photos.length}/{MAX_PHOTOS_PER_QUESTION})</label>
        <div className="flex flex-wrap gap-2">
          {photos.map((p, idx) => (
            <div key={idx} className="relative w-20 h-20 rounded-lg overflow-hidden bg-gray-100">
              <img src={p} alt="" className="w-full h-full object-cover" />
              <button
                onClick={() => removePhoto(idx)}
                className="absolute top-0.5 right-0.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs"
              >
                ✕
              </button>
            </div>
          ))}
          {photos.length < MAX_PHOTOS_PER_QUESTION && (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-20 h-20 rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 active:border-primary-400 active:text-primary-500"
            >
              <span className="text-xl">📷</span>
              <span className="text-[10px] mt-0.5">添加</span>
            </button>
          )}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handlePhotoAdd}
          className="hidden"
        />
      </div>

      <Input label="正确答案" value={answer} onChange={e => setAnswer(e.target.value)} placeholder="这道题的正确答案" />
      <Input label="我的错误答案" value={wrongAnswer} onChange={e => setWrongAnswer(e.target.value)} placeholder="你当时选了/写了什么" />
      <Textarea label="解析" value={analysis} onChange={e => setAnalysis(e.target.value)} placeholder="知识点解析、错因分析..." />

      <Input label="来源" value={source} onChange={e => setSource(e.target.value)} placeholder="如：2024国考真题、粉笔模考" />

      {/* Difficulty */}
      <div>
        <label className="block text-sm font-medium text-gray-600 mb-1">难度</label>
        <div className="flex gap-2">
          {Object.entries(DIFFICULTY_LABELS).map(([val, label]) => (
            <button
              key={val}
              onClick={() => setDifficulty(Number(val))}
              className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors ${
                difficulty === Number(val)
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-500 active:bg-gray-200'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <TagInput tags={tags} allTags={allTags} onChange={setTags} />

      <div className="flex gap-3 pt-2">
        <Button variant="secondary" className="flex-1" onClick={() => navigate(-1)}>取消</Button>
        <Button className="flex-1" onClick={handleSubmit} disabled={saving}>
          {saving ? '保存中...' : '保存'}
        </Button>
      </div>
    </div>
  );
}
