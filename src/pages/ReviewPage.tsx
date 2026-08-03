import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '@/stores/app.store';
import { reviewService } from '@/services/review.service';
import { categoryService } from '@/services/category.service';
import { tagService } from '@/services/tag.service';
import { questionService } from '@/services/question.service';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import type { Category, Tag } from '@/models';

export function ReviewPage() {
  const { setTitle } = useAppStore();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ total: 0, reviewed: 0, avgMastery: 0, needReview: 0 });
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryTags, setCategoryTags] = useState<{ id: string; name: string; icon: string; tags: Tag[] }[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const [maxDifficulty, setMaxDifficulty] = useState(5);

  useEffect(() => {
    setTitle('复习');
    loadData();
  }, []);

  const loadData = async () => {
    const [s, cats, tags, questions] = await Promise.all([
      reviewService.getStats(),
      categoryService.getAll(),
      tagService.getAll(),
      questionService.getAll(),
    ]);
    setStats(s);
    setCategories(cats);

    // 标签按分类分组：每道题的标签归属到它的分类下
    const tagByCat = new Map<string, Set<string>>();
    for (const q of questions) {
      if (!Array.isArray(q.tags)) continue;
      const set = tagByCat.get(q.categoryId) || new Set<string>();
      for (const t of q.tags) set.add(t);
      tagByCat.set(q.categoryId, set);
    }
    const tagMap = new Map(tags.map(t => [t.name, t]));
    const groups = cats
      .map(c => ({
        id: c.id,
        name: c.name,
        icon: c.icon,
        tags: [...(tagByCat.get(c.id) || [])]
          .map(n => tagMap.get(n))
          .filter((t): t is Tag => !!t)
          .sort((a, b) => b.questionCount - a.questionCount),
      }))
      .filter(g => g.tags.length > 0);
    setCategoryTags(groups);
  };

  const visibleGroups = selectedCategory
    ? categoryTags.filter(g => g.id === selectedCategory)
    : categoryTags;

  const startReview = () => {
    const params = new URLSearchParams();
    if (selectedCategory) params.set('categoryId', selectedCategory);
    if (selectedTag) params.set('tag', selectedTag);
    params.set('maxDifficulty', String(maxDifficulty));
    navigate(`/review/session?${params.toString()}`);
  };

  return (
    <div className="space-y-4 pb-4">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-xl p-3 shadow-sm">
          <div className="text-2xl font-bold text-primary-600">{stats.total}</div>
          <div className="text-xs text-gray-500">总题数</div>
        </div>
        <div className="bg-white rounded-xl p-3 shadow-sm">
          <div className="text-2xl font-bold text-orange-500">{stats.needReview}</div>
          <div className="text-xs text-gray-500">待复习</div>
        </div>
        <div className="bg-white rounded-xl p-3 shadow-sm">
          <div className="text-2xl font-bold text-green-600">{stats.reviewed}</div>
          <div className="text-xs text-gray-500">已复习</div>
        </div>
        <div className="bg-white rounded-xl p-3 shadow-sm">
          <div className="text-2xl font-bold text-purple-600">{stats.avgMastery}%</div>
          <div className="text-xs text-gray-500">平均掌握</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 shadow-sm space-y-3">
        <h3 className="text-sm font-semibold text-gray-700">选择复习范围</h3>

        <div>
          <label className="text-xs text-gray-500 mb-1 block">分类（可选）</label>
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => setSelectedCategory('')}
              className={`px-3 py-1 rounded-full text-xs font-medium ${
                !selectedCategory ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-500'
              }`}
            >
              全部
            </button>
            {categories.map(c => (
              <button
                key={c.id}
                onClick={() => {
                  const next = selectedCategory === c.id ? '' : c.id;
                  setSelectedCategory(next);
                  // 切换分类时，如果当前标签不属于该分类就清掉，避免筛不出题
                  if (next) {
                    const group = categoryTags.find(g => g.id === next);
                    if (group && !group.tags.some(t => t.name === selectedTag)) {
                      setSelectedTag('');
                    }
                  }
                }}
                className={`px-3 py-1 rounded-full text-xs font-medium ${
                  selectedCategory === c.id ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-500'
                }`}
              >
                {c.icon} {c.name}
              </button>
            ))}
          </div>
        </div>

        {visibleGroups.length > 0 && (
          <div className="space-y-2.5">
            <label className="text-xs text-gray-500 mb-1 block">标签（可选）</label>
            <button
              onClick={() => setSelectedTag('')}
              className={`px-3 py-1 rounded-full text-xs font-medium mb-1 ${
                !selectedTag ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-500'
              }`}
            >
              不限
            </button>
            {visibleGroups.map(g => (
              <div key={g.id}>
                <div className="text-xs text-gray-400 mb-1 mt-2">{g.icon} {g.name}</div>
                <div className="flex flex-wrap gap-1.5">
                  {g.tags.map(t => (
                    <button
                      key={t.id}
                      onClick={() => setSelectedTag(selectedTag === t.name ? '' : t.name)}
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        selectedTag === t.name ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {t.name}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        <div>
          <label className="text-xs text-gray-500 mb-1 block">最高难度: {maxDifficulty}</label>
          <input
            type="range"
            min={1}
            max={5}
            value={maxDifficulty}
            onChange={e => setMaxDifficulty(Number(e.target.value))}
            className="w-full accent-primary-600"
          />
          <div className="flex justify-between text-xs text-gray-400">
            <span>很简单</span><span>中等</span><span>很难</span>
          </div>
        </div>
      </div>

      {stats.total === 0 ? (
        <EmptyState icon="📝" title="还没有错题" description="先添加一些错题再来复习吧" />
      ) : (
        <Button className="w-full" onClick={startReview}>
          🚀 开始复习 ({stats.needReview > 0 ? `建议复习 ${stats.needReview} 题` : '全部已掌握'})
        </Button>
      )}
    </div>
  );
}
