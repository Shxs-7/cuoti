import { useState, useRef, forwardRef, useImperativeHandle } from 'react';
import type { Tag } from '@/models';

export interface TagInputHandle {
  flush: () => void; // 把输入框当前文字强制转为标签
}

interface Props {
  tags: string[];
  allTags: Tag[];
  onChange: (tags: string[]) => void;
}

export const TagInput = forwardRef<TagInputHandle, Props>(function TagInput(
  { tags, allTags, onChange }, ref
) {
  const [input, setInput] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const suggestions = allTags
    .filter(t => !tags.includes(t.name) && t.name.includes(input))
    .slice(0, 6);

  const addTags = (raw: string) => {
    // 支持逗号分隔一次添加多个标签
    const names = raw.split(/[,，\s]+/).map(s => s.trim()).filter(Boolean);
    if (names.length === 0) return;
    const newTags = [...tags];
    for (const n of names) {
      if (!newTags.includes(n)) newTags.push(n);
    }
    onChange(newTags);
    setInput('');
  };

  // 暴露给外部：保存前调用，确保输入框里的文字不会丢
  useImperativeHandle(ref, () => ({
    flush: () => {
      if (input.trim()) {
        addTags(input);
      }
    },
  }), [input, tags]);

  const removeTag = (name: string) => {
    onChange(tags.filter(t => t !== name));
  };

  const handleBlur = () => {
    if (input.trim()) {
      addTags(input);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (input.trim()) {
        addTags(input);
      }
    } else if (e.key === 'Backspace' && !input && tags.length > 0) {
      removeTag(tags[tags.length - 1]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // 输入逗号时自动把前面的内容添加为标签
    if (/[,，]/.test(value)) {
      const parts = value.split(/[,，]/);
      const pending = parts.slice(0, -1).join(',');
      if (pending.trim()) {
        const names = pending.split(/[,，\s]+/).map(s => s.trim()).filter(Boolean);
        const newTags = [...tags];
        for (const n of names) {
          if (!newTags.includes(n)) newTags.push(n);
        }
        onChange(newTags);
      }
      setInput(parts[parts.length - 1].trim());
    } else {
      setInput(value);
    }
    setShowSuggestions(true);
  };

  return (
    <div className="w-full">
      <label className="block text-sm font-medium text-gray-600 mb-1">标签</label>
      <div className="flex flex-wrap gap-1.5 p-2 border border-gray-300 rounded-xl bg-white min-h-[44px] focus-within:ring-2 focus-within:ring-primary-500 focus-within:border-transparent">
        {tags.map(t => (
          <span
            key={t}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-600"
          >
            {t}
            <button
              type="button"
              onClick={() => removeTag(t)}
              className="w-4 h-4 flex items-center justify-center rounded-full hover:bg-blue-200"
            >
              ×
            </button>
          </span>
        ))}
        <div className="relative flex-1 min-w-[80px]">
          <input
            ref={inputRef}
            value={input}
            onChange={handleChange}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => {
              setTimeout(() => setShowSuggestions(false), 150);
              handleBlur();
            }}
            onKeyDown={handleKeyDown}
            placeholder={tags.length === 0 ? '输入标签，逗号分隔多个' : '继续添加，逗号分隔...'}
            className="w-full py-1 px-1 text-sm outline-none bg-transparent min-w-[80px]"
          />
          {showSuggestions && input && suggestions.length > 0 && (
            <div className="absolute top-full left-0 mt-1 w-auto min-w-[160px] bg-white rounded-xl shadow-lg border z-10 py-1">
              {suggestions.map(s => (
                <button
                  key={s.id}
                  type="button"
                  className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center gap-2"
                  onMouseDown={(e) => { e.preventDefault(); addTags(s.name); }}
                >
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color }} />
                  {s.name}
                  <span className="text-gray-400 text-xs ml-auto">{s.questionCount}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
});
