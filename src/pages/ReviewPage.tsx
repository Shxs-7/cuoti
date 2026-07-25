import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '@/stores/app.store';
import { reviewService } from '@/services/review.service';
import { categoryService } from '@/services/category.service';
import { tagService } from '@/services/tag.service';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import type { Category, Tag } from '@/models';

export function ReviewPage() {
  const { setTitle } = useAppStore();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ total: 0, reviewed: 0, avgMastery: 0, needReview: 0 });
  const [categories, setCategories] = useState<Category[]>([]);
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const [maxDifficulty, setMaxDifficulty] = useState(5);

  useEffect(() => {
    setTitle('复习');
    loadData();
  }, []);

  const loadData = async () => {
    const [s, cats, tags] = await Promise.all([
      reviewService.getStats(),
      categoryService.getAll(),
      tagService.getAll(),
    ]);
    setStats(s);
    setCategories(cats);
    setAllTags(tags);
  };

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
                onClick={() => setSelectedCategory(c.id)}
                className={`px-3 py-1 rounded-full text-xs font-medium ${
                  selectedCategory === c.id ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-500'
                }`}
              >
                {c.icon} {c.name}
              </button>
            ))}
          </div>
        </div>

        {allTags.length > 0 && (
          <div>
            <label className="text-xs text-gray-500 mb-1 block">标签（可选）</label>
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => setSelectedTag('')}
                className={`px-3 py-1 rounded-full text-xs font-medium ${
                  !selectedTag ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-500'
                }`}
              >
                不限
              </button>
              {allTags.map(t => (
                <button
                  key={t.id}
                  onClick={() => setSelectedTag(t.name)}
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    selectedTag === t.name ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {t.name}
                </button>
              ))}
            </div>
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
