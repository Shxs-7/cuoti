import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '@/stores/app.store';
import { questionService } from '@/services/question.service';
import { knowledgeService } from '@/services/knowledge.service';
import { tagService } from '@/services/tag.service';
import { categoryService } from '@/services/category.service';
import { folderService } from '@/services/folder.service';
import { SearchBar } from '@/components/ui/SearchBar';
import { EmptyState } from '@/components/ui/EmptyState';
import type { Question, KnowledgePoint, Tag } from '@/models';
import { formatDate } from '@/lib/date';
import { DIFFICULTY_LABELS } from '@/models/question';

interface SearchItem {
  type: 'question' | 'kp';
  data: Question | KnowledgePoint;
  categoryName?: string;
  folderName?: string;
}

export function SearchPage() {
  const { setTitle } = useAppStore();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchItem[]>([]);
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setTitle('搜索');
    tagService.getAll().then(setAllTags);
  }, []);

  const doSearch = async (q: string, tag: string | null) => {
    if (!q.trim() && !tag) { setResults([]); return; }
    setLoading(true);

    // Split query into keywords
    const keywords = q.split(/[,，\s]+/).filter(Boolean).map(k => k.toLowerCase());

    // Get all data
    const [questions, kps] = await Promise.all([
      questionService.search(q || tag || ''),
      knowledgeService.getAll(),
    ]);

    // Filter by keywords (OR match)
    let filteredQ = questions;
    if (keywords.length > 0) {
      filteredQ = questions.filter(item => {
        const text = [item.title, item.content, item.answer, item.wrongAnswer,
          item.analysis, item.source, ...item.tags].join(' ').toLowerCase();
        return keywords.some(k => text.includes(k));
      });
    }

    // Filter by tag
    if (tag) {
      filteredQ = filteredQ.filter(item => item.tags.includes(tag));
    }

    // Also search knowledge points
    let filteredKp = kps;
    if (keywords.length > 0) {
      filteredKp = kps.filter(kp => {
        const text = [kp.title, kp.content, ...kp.tags].join(' ').toLowerCase();
        return keywords.some(k => text.includes(k));
      });
    }
    if (tag) {
      filteredKp = filteredKp.filter(kp => kp.tags.includes(tag));
    }

    // Build results with category/folder context
    const cats = await categoryService.getAll();
    const catMap = new Map(cats.map(c => [c.id, c.name]));
    const folders = await Promise.all(
      [...new Set([...filteredQ.map(q => q.folderId), ...filteredKp.map(k => k.folderId)])]
        .map(async id => ({ id, f: await folderService.getById(id) }))
    );
    const folderMap = new Map(folders.filter(x => x.f).map(x => [x.id, x.f!.name]));

    const items: SearchItem[] = [
      ...filteredQ.map(q => ({
        type: 'question' as const,
        data: q,
        categoryName: catMap.get(q.categoryId),
        folderName: folderMap.get(q.folderId),
      })),
      ...filteredKp.map(k => ({
        type: 'kp' as const,
        data: k,
        categoryName: catMap.get(k.categoryId),
        folderName: folderMap.get(k.folderId),
      })),
    ];

    setResults(items);
    setLoading(false);
  };

  const handleQueryChange = (v: string) => {
    setQuery(v);
    doSearch(v, activeTag);
  };

  const handleTagClick = (tag: string) => {
    const newTag = activeTag === tag ? null : tag;
    setActiveTag(newTag);
    doSearch(query, newTag);
  };

  return (
    <div className="space-y-4 pb-4">
      <SearchBar value={query} onChange={handleQueryChange} autoFocus placeholder="搜索关键词，用逗号分隔多个词" />

      {/* Tag filters */}
      {allTags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {allTags.map(t => (
            <button
              key={t.id}
              onClick={() => handleTagClick(t.name)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                activeTag === t.name
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-500 active:bg-gray-200'
              }`}
            >
              {t.name} ({t.questionCount})
            </button>
          ))}
        </div>
      )}

      {/* Results */}
      {loading ? (
        <div className="text-center py-8 text-gray-400">搜索中...</div>
      ) : results.length > 0 ? (
        <div>
          <div className="text-xs text-gray-400 mb-2">
            找到 {results.filter(r => r.type === 'question').length} 道错题
            {results.filter(r => r.type === 'kp').length > 0 && ` + ${results.filter(r => r.type === 'kp').length} 个知识点`}
          </div>
          {results.map((item) => {
            const isQuestion = item.type === 'question';
            const q = item.data as Question;
            const kp = item.data as KnowledgePoint;
            return (
              <button
                key={item.type + '-' + item.data.id}
                onClick={() => navigate(isQuestion ? `/question/${q.id}` : `/knowledge/${kp.id}`)}
                className={`w-full text-left mb-2 rounded-xl shadow-sm overflow-hidden active:opacity-80 ${
                  isQuestion ? 'bg-white' : 'bg-cyan-50 border border-cyan-100'
                }`}
              >
                {/* Type indicator */}
                <div className={`px-3 py-1.5 flex items-center gap-2 text-[10px] font-medium ${
                  isQuestion ? 'bg-red-50 text-red-500' : 'bg-cyan-100 text-cyan-600'
                }`}>
                  <span>{isQuestion ? '📝 错题' : '📚 知识点'}</span>
                  {item.categoryName && item.folderName && (
                    <span className="opacity-60">{item.categoryName} › {item.folderName}</span>
                  )}
                </div>
                {/* Content */}
                <div className="px-3 py-2.5">
                  <div className="font-medium text-sm">{isQuestion ? (q.title || '无标题') : (kp.title || '无标题')}</div>
                  {(isQuestion ? q.content : kp.content) && (
                    <div className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                      {isQuestion ? q.content : kp.content}
                    </div>
                  )}
                  <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                    <span className="text-xs text-gray-400">{formatDate(isQuestion ? q.createdAt : kp.createdAt)}</span>
                    {isQuestion && (
                      <span className="text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-500">
                        {DIFFICULTY_LABELS[q.difficulty]}
                      </span>
                    )}
                    {(isQuestion ? q.tags : kp.tags).slice(0, 4).map(t => (
                      <span key={t} onClick={(ev) => { ev.stopPropagation(); handleTagClick(t); }}
                        className="text-xs px-1.5 py-0.5 rounded bg-blue-50 text-blue-500 cursor-pointer active:bg-blue-100"
                      >{t}</span>
                    ))}
                    {(isQuestion ? q.photos.length : kp.photos.length) > 0 && (
                      <span className="text-xs text-gray-400 ml-auto">
                        📷{(isQuestion ? q.photos.length : kp.photos.length)}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      ) : (query || activeTag) ? (
        <EmptyState icon="🔍" title="没有找到结果" description="试试其他关键词或标签" />
      ) : (
        <EmptyState icon="🔍" title="搜索错题和知识点" description="输入关键词（逗号分隔）或选择标签搜索" />
      )}
    </div>
  );
}
