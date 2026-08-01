interface Props {
  value: number;          // 1-5
  onChange?: (v: number) => void;  // 传入则可编辑
  size?: 'sm' | 'md' | 'lg';
}

export function StarRating({ value, onChange, size = 'sm' }: Props) {
  const sizeCls = size === 'lg' ? 'text-2xl' : size === 'md' ? 'text-xl' : 'text-sm';
  const emptyColor = '#d1d5db';
  const starColor = '#f59e0b';

  return (
    <div className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <button
          key={i}
          type="button"
          disabled={!onChange}
          onClick={() => onChange?.(i)}
          className={`${sizeCls} leading-none ${onChange ? 'active:scale-90 transition-transform' : ''}`}
          style={{ color: i <= value ? starColor : emptyColor }}
        >
          ★
        </button>
      ))}
    </div>
  );
}
