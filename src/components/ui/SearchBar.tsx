import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

interface Props {
  placeholder?: string;
  value?: string;
  onChange?: (v: string) => void;
  autoFocus?: boolean;
}

export function SearchBar({
  placeholder = '搜索错题、标签、关键词...',
  value: controlledValue,
  onChange: controlledOnChange,
  autoFocus = false,
}: Props) {
  const navigate = useNavigate();
  const [internalValue, setInternalValue] = useState('');

  const value = controlledValue ?? internalValue;
  const onChange = controlledOnChange ?? setInternalValue;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim()) {
      navigate(`/search?q=${encodeURIComponent(value.trim())}`);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg">🔍</span>
        <input
          type="search"
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          autoFocus={autoFocus}
          className="w-full pl-10 pr-4 py-2.5 bg-gray-100 rounded-xl text-base outline-none focus:bg-white focus:ring-2 focus:ring-primary-500 transition-all"
        />
        {value && (
          <button
            type="button"
            onClick={() => onChange('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-6 h-6 flex items-center justify-center rounded-full hover:bg-gray-200"
          >
            ✕
          </button>
        )}
      </div>
    </form>
  );
}
