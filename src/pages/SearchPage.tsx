import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '@/stores/app.store';
import { questionService } from '@/services/question.service';
import { tagService } from '@/services/tag.service';
import { SearchBar } from '@/components/ui/SearchBar';
import { EmptyState } from '@/components/ui/EmptyState';
import { Badge } from '@/components/ui/Badge';
import type { Question, Tag } from '@/models';
import { formatDate } from '@/lib/date';
import { DIFFICULTY_LABELS } from '@/models/question';

export function SearchPage() {
  const { setTitle } = useAppStore();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Question[]>([]);
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
    let items: Question[];
    if (tag) {
      items = await questionService.searchByTag(tag);
      if (q.trim()) {
        items = items.filter(item =>
          [item.title, item.content, item.answer, item.analysis, item.source].join(' ').toLowerCase().includes(q.toLowerCase())
        );
      }
    } else {
      items = await questionService.search(q);
    }
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
      <SearchBar value={query} onChange={handleQueryChange} autoFocus />

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
        <div className="space-y-2">
          <div className="text-xs text-gray-400">找到 {results.length} 条结果</div>
          {results.map(q => (
            <button
              key={q.id}
              onClick={() => navigate(`/question/${q.id}`)}
              className="w-full bg-white rounded-xl p-3 shadow-sm text-left active:bg-gray-50"
            >
              <div className="font-medium text-sm">{q.title || '无标题'}</div>
              {q.content && (
                <div className="text-xs text-gray-500 mt-0.5 line-clamp-1">{q.content}</div>
              )}
              <div className="flex items-center gap-1.5 mt-1.5">
                <span className="text-xs text-gray-400">{formatDate(q.createdAt)}</span>
                <span className="text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-500">
                  {DIFFICULTY_LABELS[q.difficulty]}
                </span>
                {q.tags.map(t => (
                  <Badge key={t} text={t} onClick={() => handleTagClick(t)} />
                ))}
              </div>
            </button>
          ))}
        </div>
      ) : (query || activeTag) ? (
        <EmptyState icon="🔍" title="没有找到结果" description="试试其他关键词或标签" />
      ) : (
        <EmptyState icon="🔍" title="搜索错题" description="输入关键词或选择标签开始搜索" />
      )}
    </div>
  );
}
